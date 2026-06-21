import React, { useState, useEffect } from 'react';
import {
    View, Text, StyleSheet, ScrollView, TouchableOpacity,
    Platform, Dimensions, ActivityIndicator, Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useIsFocused } from '@react-navigation/native';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Colors from '../../../utils/Colors';
import CustomHeader from '../../Navigation/CustomHeader';
import GridMenu from '../../Navigation/GridMenu';
import API_BASE_URL from '../../../api';

const { width } = Dimensions.get('window');

const AnalysisWorkspace = () => {
    const navigation = useNavigation();
    const isFocused = useIsFocused();
    const [isMenuVisible, setIsMenuVisible] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    // Upload & analysis
    const [selectedFile, setSelectedFile] = useState(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [analysisResult, setAnalysisResult] = useState(null);
    const [expandedCategories, setExpandedCategories] = useState({});
    const [drafts, setDrafts] = useState([]);
    
    // Interactive Manuscript States
    const [activeTab, setActiveTab] = useState('feedback'); // 'feedback' | 'manuscript'
    const [localPagesText, setLocalPagesText] = useState([]);
    const [appliedIssueIds, setAppliedIssueIds] = useState([]);
    const [isSaving, setIsSaving] = useState(false);
    const [activeIssueId, setActiveIssueId] = useState(null);

    useEffect(() => { fetchDrafts(); }, []);

    const fetchDrafts = async () => {
        try {
            const token = await AsyncStorage.getItem('userToken');
            if (!token) return;
            const res = await fetch(`${API_BASE_URL}/user/analysis-drafts`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            if (data.success) setDrafts(data.data || []);
        } catch (e) { console.error('Fetch drafts error:', e); }
    };

    // Auto-save logic
    useEffect(() => {
        if (localPagesText.length > 0 && analysisResult) {
            const timer = setTimeout(() => {
                saveDraft();
            }, 3000);
            return () => clearTimeout(timer);
        }
    }, [localPagesText, appliedIssueIds]);

    const saveDraft = async () => {
        if (!selectedFile?.name || !analysisResult) return;
        setIsSaving(true);
        try {
            const token = await AsyncStorage.getItem('userToken');
            await fetch(`${API_BASE_URL}/user/analysis-drafts`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    fileName: selectedFile.name,
                    originalResults: analysisResult,
                    localPagesText,
                    appliedIssueIds
                })
            });
        } catch (err) {
            console.error('Auto-save error:', err);
        } finally {
            setIsSaving(false);
        }
    };

    const pickDocument = async () => {
        try {
            const result = await DocumentPicker.getDocumentAsync({
                type: [
                    'application/pdf',
                    'application/msword',
                    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                    'text/plain'
                ],
                copyToCacheDirectory: true,
            });

            if (!result.canceled && result.assets && result.assets.length > 0) {
                const file = result.assets[0];
                setSelectedFile(file);
                setAnalysisResult(null);
            }
        } catch (err) {
            Alert.alert('Error', 'Could not pick file');
        }
    };

    const handleUpload = async () => {
        if (!selectedFile) return Alert.alert('No File', 'Please select a file first');
        setIsAnalyzing(true);
        try {
            const token = await AsyncStorage.getItem('userToken');
            const formData = new FormData();
            formData.append('thesis', {
                uri: selectedFile.uri,
                name: selectedFile.name,
                type: selectedFile.mimeType || 'application/pdf',
            });

            const response = await fetch(`${API_BASE_URL}/user/analyze`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` },
                body: formData,
            });
            const data = await response.json();
            if (response.ok) {
                const results = {
                    overallScore: data.overallScore,
                    totalIssues: data.totalIssues || (data.recommendations || []).length,
                    statistics: data.statistics || {},
                    categories: data.categories || [],
                    pagesText: data.pagesText || [],
                };
                setAnalysisResult(results);
                setLocalPagesText(data.pagesText || []);
                setAppliedIssueIds([]);
                Alert.alert('Success', 'Analysis complete!');
            } else {
                Alert.alert('Error', data.error || data.message || 'Analysis failed');
            }
        } catch (err) {
            console.error('Upload error:', err);
            Alert.alert('Error', 'Could not analyze file (server error)');
        } finally {
            setIsAnalyzing(false);
        }
    };

    const handleResumeDraft = (draft) => {
        setSelectedFile({ name: draft.fileName, uri: null });
        setAnalysisResult(draft.originalResults);
        setLocalPagesText(draft.localPagesText || []);
        setAppliedIssueIds(draft.appliedIssueIds || []);
    };

    const resetAnalysis = () => {
        setSelectedFile(null);
        setAnalysisResult(null);
        setExpandedCategories({});
        setLocalPagesText([]);
        setAppliedIssueIds([]);
        setActiveTab('feedback');
    };

    const toggleCategory = (idx) => {
        setExpandedCategories(prev => ({ ...prev, [idx]: !prev[idx] }));
    };

    const getScoreColor = (score) => {
        if (score >= 90) return '#22c55e';
        if (score >= 70) return '#f59e0b';
        return '#ef4444';
    };

    const getSeverityColor = (sev) => {
        if (sev === 'high') return '#ef4444';
        if (sev === 'medium') return '#f59e0b';
        return '#3b82f6';
    };

    const applySuggestion = (issue) => {
        if (!issue.targetWord || !issue.suggestedWord) return;
        const issueId = getIssueId(issue);

        const newPages = localPagesText.map(page => {
            if (issue.pages.includes(page.pageNumber)) {
                // Simplified text replacement for mobile (no regex complexities)
                const safeContext = issue.context.replace(/\s+/g, ' ');
                const newText = page.text.replace(issue.context, (match) => {
                    const targetRegex = new RegExp(`(?<!\\w)${issue.targetWord}(?!\\w)`, 'gi');
                    return match.replace(targetRegex, issue.suggestedWord);
                });
                return { ...page, text: newText };
            }
            return page;
        });

        setLocalPagesText(newPages);
        setAppliedIssueIds(prev => [...prev, issueId]);
        Alert.alert('Applied', `Replaced "${issue.targetWord}" with "${issue.suggestedWord}"`);
    };

    const getIssueId = (issue) => {
        return issue.id || `${issue.title}-${issue.context}`.replace(/[^a-z0-9]/gi, '-').substring(0, 50);
    };

    const isIssueApplied = (issue) => {
        return appliedIssueIds.includes(getIssueId(issue));
    };

    const getRemainingIssues = () => {
        if (!analysisResult) return [];
        return (analysisResult.categories || []).flatMap(cat => 
            cat.issues.filter(i => !isIssueApplied(i)).map(i => ({ ...i, categoryName: cat.name }))
        );
    };

    const handleDownload = async () => {
        if (localPagesText.length === 0) return;
        try {
            const fullContent = localPagesText.map(p => `--- Page ${p.pageNumber} ---\n\n${p.text}`).join('\n\n');
            const fileUri = FileSystem.cacheDirectory + `Refined_${selectedFile.name.split('.')[0] || 'Manuscript'}.txt`;
            await FileSystem.writeAsStringAsync(fileUri, fullContent, { encoding: FileSystem.EncodingType.UTF8 });
            await Sharing.shareAsync(fileUri);
        } catch (err) {
            console.error('Download error:', err);
            Alert.alert('Error', 'Could not export document');
        }
    };

    const renderPageWithHighlights = (text, pageNumber) => {
        if (!activeIssueId) return <Text style={styles.pageText}>{text}</Text>;
        
        const activeIssue = getRemainingIssues().find(i => getIssueId(i) === activeIssueId);
        if (!activeIssue || !activeIssue.pages.includes(pageNumber) || !activeIssue.context) {
            return <Text style={styles.pageText}>{text}</Text>;
        }

        const parts = text.split(activeIssue.context);
        return (
            <Text style={styles.pageText}>
                {parts.map((part, i) => (
                    <React.Fragment key={i}>
                        {part}
                        {i < parts.length - 1 && (
                            <Text style={styles.highlightText}>{activeIssue.context}</Text>
                        )}
                    </React.Fragment>
                ))}
            </Text>
        );
    };

    const handleSearch = () => {
        if (searchQuery.trim()) {
            navigation.navigate('SmartSearch', { initialQuery: searchQuery.trim() });
            setSearchQuery('');
        }
    };

    // ---- RENDER ----

    return (
        <LinearGradient colors={[Colors.background, Colors.surface, Colors.background]} style={styles.container}>
            <CustomHeader
                onMenuPress={() => setIsMenuVisible(true)}
                onSearch={handleSearch}
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
            />
            {/* Grid Menu */}
            {isFocused && (
                <GridMenu isVisible={isMenuVisible} onClose={() => setIsMenuVisible(false)} navigation={navigation} />
            )}

            <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

                {/* Back Button */}
                <TouchableOpacity style={styles.backRow} onPress={() => navigation.navigate('Home')}>
                    <Ionicons name="arrow-back" size={16} color={Colors.primary} />
                    <Text style={styles.backText}>Back to Dashboard</Text>
                </TouchableOpacity>

                {/* If no results yet, show upload UI */}
                {!analysisResult ? (
                    <>
                        {/* Hero */}
                        <View style={styles.heroSection}>
                            <Text style={styles.heroTag}>ANALYSIS</Text>
                            <Text style={styles.heroTitle}>Analysis Workspace</Text>
                            <Text style={styles.heroDesc}>Upload a thesis (PDF, DOCX, TXT) for AI-powered analysis.</Text>
                        </View>

                        {/* Upload Card */}
                        <TouchableOpacity
                            style={[styles.uploadCard, selectedFile && styles.uploadCardSelected]}
                            onPress={pickDocument}
                            disabled={isAnalyzing}
                            activeOpacity={0.8}
                        >
                            <View style={styles.uploadIconBox}>
                                {isAnalyzing ? (
                                    <ActivityIndicator color="#7f0000" />
                                ) : selectedFile ? (
                                    <Ionicons name="document-text" size={32} color="#22c55e" />
                                ) : (
                                    <Ionicons name="cloud-upload" size={32} color="#7f0000" />
                                )}
                            </View>
                            <Text style={styles.uploadTitle}>
                                {isAnalyzing ? 'Analyzing...' : selectedFile ? selectedFile.name : 'Tap to Select File'}
                            </Text>
                            <Text style={styles.uploadSub}>
                                {isAnalyzing ? 'Processing your document' : selectedFile ? `${((selectedFile.size || 0) / (1024 * 1024)).toFixed(2)} MB` : 'PDF, DOC, DOCX, TXT • Max 50MB'}
                            </Text>
                        </TouchableOpacity>

                        {selectedFile && !isAnalyzing && (
                            <View style={styles.actionRow}>
                                <TouchableOpacity style={styles.clearBtn} onPress={resetAnalysis}>
                                    <Ionicons name="close-circle" size={18} color="#f87171" />
                                    <Text style={styles.clearBtnText}>Clear</Text>
                                </TouchableOpacity>
                                <TouchableOpacity style={styles.analyzeBtn} onPress={handleUpload}>
                                    <Ionicons name="analytics" size={18} color="#fff" />
                                    <Text style={styles.analyzeBtnText}>Analyze</Text>
                                </TouchableOpacity>
                            </View>
                        )}

                        {/* Recent Drafts */}
                        {drafts.length > 0 && (
                            <View style={styles.draftsSection}>
                                <Text style={styles.draftsSectionTitle}>SAVED DRAFTS</Text>
                                {drafts.map((draft, idx) => (
                                    <TouchableOpacity
                                        key={draft._id || idx}
                                        style={styles.draftCard}
                                        onPress={() => handleResumeDraft(draft)}
                                        activeOpacity={0.7}
                                    >
                                        <Ionicons name="document-attach" size={20} color="#7f0000" />
                                        <View style={{ flex: 1, marginLeft: 12 }}>
                                            <Text style={styles.draftName} numberOfLines={1}>{draft.fileName}</Text>
                                            <Text style={styles.draftDate}>
                                                {new Date(draft.updatedAt).toLocaleDateString()} • {(draft.appliedIssueIds || []).length} fixes applied
                                            </Text>
                                        </View>
                                        <Text style={styles.draftResume}>RESUME</Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        )}
                    </>
                ) : (
                    /* Analysis Results View */
                    <>
                        {/* Tab Switcher */}
                        <View style={styles.tabContainer}>
                            <TouchableOpacity 
                                style={[styles.tab, activeTab === 'feedback' && styles.tabActive]} 
                                onPress={() => setActiveTab('feedback')}
                            >
                                <Ionicons name="chatbubbles" size={16} color={activeTab === 'feedback' ? '#fff' : 'rgba(255,255,255,0.4)'} />
                                <Text style={[styles.tabText, activeTab === 'feedback' && styles.tabTextActive]}>FEEDBACK</Text>
                            </TouchableOpacity>
                            <TouchableOpacity 
                                style={[styles.tab, activeTab === 'manuscript' && styles.tabActive]} 
                                onPress={() => setActiveTab('manuscript')}
                            >
                                <Ionicons name="document-text" size={16} color={activeTab === 'manuscript' ? '#fff' : 'rgba(255,255,255,0.4)'} />
                                <Text style={[styles.tabText, activeTab === 'manuscript' && styles.tabTextActive]}>MANUSCRIPT</Text>
                            </TouchableOpacity>
                        </View>

                        {activeTab === 'feedback' ? (
                            <>
                                {/* Score Card */}
                                <View style={styles.scoreCard}>
                                    <View style={[styles.scoreBadge, { borderColor: getScoreColor(analysisResult.overallScore) }]}>
                                        <Text style={[styles.scoreNum, { color: getScoreColor(analysisResult.overallScore) }]}>
                                            {analysisResult.overallScore}
                                        </Text>
                                        <Text style={styles.scoreLabel}>/100</Text>
                                    </View>
                                    <View style={{ flex: 1, marginLeft: 16 }}>
                                        <Text style={styles.scoreTitle}>Overall Assessment</Text>
                                        <Text style={styles.scoreSub}>
                                            {analysisResult.overallScore >= 90 ? 'Exceptional' :
                                                analysisResult.overallScore >= 70 ? 'Acceptable' : 'Needs Revision'}
                                        </Text>
                                    </View>
                                    {isSaving ? (
                                        <ActivityIndicator size="small" color="#f87171" style={{ marginRight: 10 }} />
                                    ) : (
                                        <TouchableOpacity onPress={resetAnalysis}>
                                            <Ionicons name="close" size={22} color="rgba(255,255,255,0.5)" />
                                        </TouchableOpacity>
                                    )}
                                </View>

                                {/* Stats Row */}
                                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 20 }}>
                                    <View style={styles.statsRow}>
                                        {[
                                            { label: 'Words', val: analysisResult.statistics?.wordCount || 0 },
                                            { label: 'Sentences', val: analysisResult.statistics?.sentenceCount || 0 },
                                            { label: 'Paragraphs', val: analysisResult.statistics?.paragraphCount || 0 },
                                            { label: 'Readability', val: analysisResult.statistics?.readabilityIndex || 0 },
                                        ].map((s, i) => (
                                            <View key={i} style={styles.statPill}>
                                                <Text style={styles.statPillVal}>{s.val.toLocaleString()}</Text>
                                                <Text style={styles.statPillLabel}>{s.label}</Text>
                                            </View>
                                        ))}
                                    </View>
                                </ScrollView>

                                {/* Categories & Issues */}
                                <Text style={styles.feedbackTitle}>FINDINGS</Text>
                                {(analysisResult.categories || []).map((cat, idx) => {
                                    const visibleIssues = cat.issues.filter(i => !isIssueApplied(i));
                                    if (visibleIssues.length === 0) return null;

                                    return (
                                        <View key={idx} style={styles.catBlock}>
                                            <TouchableOpacity
                                                style={styles.catHeader}
                                                onPress={() => toggleCategory(idx)}
                                                activeOpacity={0.7}
                                            >
                                                <View style={[styles.catDot, { backgroundColor: cat.color || '#7f0000' }]} />
                                                <Text style={styles.catName}>{cat.name}</Text>
                                                <View style={styles.catBadge}>
                                                    <Text style={styles.catBadgeText}>{visibleIssues.length}</Text>
                                                </View>
                                                <Ionicons
                                                    name={expandedCategories[idx] ? 'chevron-up' : 'chevron-down'}
                                                    size={16} color="rgba(255,255,255,0.4)"
                                                />
                                            </TouchableOpacity>

                                            {expandedCategories[idx] && visibleIssues.map((issue, iIdx) => (
                                                <View key={iIdx} style={styles.issueCard}>
                                                    <View style={[styles.issueSeverityBar, { backgroundColor: getSeverityColor(issue.severity) }]} />
                                                    <View style={styles.issueBody}>
                                                        <View style={styles.issueTop}>
                                                            <Text style={styles.issueTitle} numberOfLines={2}>{issue.title}</Text>
                                                            <View style={[styles.severityPill, { backgroundColor: getSeverityColor(issue.severity) + '10', borderColor: getSeverityColor(issue.severity) }]}>
                                                                <Text style={[styles.severityPillText, { color: getSeverityColor(issue.severity) }]}>
                                                                    {issue.severity}
                                                                </Text>
                                                            </View>
                                                        </View>
                                                        <Text style={styles.issueDesc} numberOfLines={5}>{issue.description}</Text>

                                                        <View style={styles.suggestionBox}>
                                                            <Ionicons name="sparkles" size={14} color="#f59e0b" style={{ marginTop: 2 }} />
                                                            <Text style={styles.suggestionText}>
                                                                "{issue.suggestion}"
                                                            </Text>
                                                        </View>

                                                        <View style={styles.issueActionRow}>
                                                            <TouchableOpacity 
                                                                style={styles.jumpBtn}
                                                                onPress={() => {
                                                                    setActiveTab('manuscript');
                                                                    setActiveIssueId(getIssueId(issue));
                                                                }}
                                                            >
                                                                <Ionicons name="eye" size={14} color="#6b7280" />
                                                                <Text style={styles.jumpBtnText}>VIEW IN TEXT</Text>
                                                            </TouchableOpacity>
                                                            
                                                            {issue.suggestionType === 'replacement' ? (
                                                                <TouchableOpacity 
                                                                    style={styles.applyIssueBtn}
                                                                    onPress={() => applySuggestion(issue)}
                                                                >
                                                                    <Ionicons name="checkmark-circle" size={14} color="#fff" />
                                                                    <Text style={styles.applyIssueBtnText}>APPLY FIX</Text>
                                                                </TouchableOpacity>
                                                            ) : (
                                                                <TouchableOpacity 
                                                                    style={styles.dimissBtn}
                                                                    onPress={() => setAppliedIssueIds(prev => [...prev, getIssueId(issue)])}
                                                                >
                                                                    <Ionicons name="checkmark" size={14} color="#059669" />
                                                                    <Text style={styles.dimissBtnText}>MARK RESOLVED</Text>
                                                                </TouchableOpacity>
                                                            )}
                                                        </View>
                                                    </View>
                                                </View>
                                            ))}
                                        </View>
                                    );
                                })}
                            </>
                        ) : (
                            /* Manuscript Viewer */
                            <View style={styles.manuscriptContainer}>
                                <View style={styles.manuscriptPaper}>
                                    <View style={styles.manuscriptHeader}>
                                        <Ionicons name="document-text" size={18} color="#9ca3af" />
                                        <Text style={styles.manuscriptTitle}>{selectedFile?.name}</Text>
                                    </View>
                                    
                                    {localPagesText.map((page, pIdx) => (
                                        <View key={pIdx} style={styles.manuscriptPage}>
                                            <View style={styles.pageMarker}>
                                                <View style={styles.pageMarkerLine} />
                                                <Text style={styles.pageMarkerText}>PAGE {page.pageNumber}</Text>
                                                <View style={styles.pageMarkerLine} />
                                            </View>
                                            
                                            {renderPageWithHighlights(page.text, page.pageNumber)}
                                            
                                            {/* Issues on this page indicator */}
                                            <View style={styles.pageIssuesFooter}>
                                                {getRemainingIssues().filter(i => i.pages.includes(page.pageNumber)).map((i, idx) => (
                                                    <TouchableOpacity 
                                                        key={idx} 
                                                        style={[styles.miniIssueTag, activeIssueId === getIssueId(i) && styles.miniIssueTagActive]}
                                                        onPress={() => {
                                                            setActiveIssueId(getIssueId(i));
                                                            Alert.alert(i.title, i.suggestion);
                                                        }}
                                                    >
                                                        <View style={[styles.miniIssueDot, { backgroundColor: getSeverityColor(i.severity) }]} />
                                                        <Text style={styles.miniIssueText}>{i.categoryName}</Text>
                                                    </TouchableOpacity>
                                                ))}
                                            </View>
                                        </View>
                                    ))}
                                </View>
                                
                                <TouchableOpacity 
                                    style={styles.downloadFixedBtn}
                                    onPress={handleDownload}
                                    disabled={appliedIssueIds.length === 0}
                                >
                                    <Ionicons name="download" size={18} color={appliedIssueIds.length > 0 ? "#fff" : "rgba(255,255,255,0.2)"} />
                                    <Text style={[styles.downloadFixedBtnText, appliedIssueIds.length === 0 && { color: 'rgba(255,255,255,0.2)' }]}>
                                        DOWNLOAD REFINED MANUSCRIPT
                                    </Text>
                                </TouchableOpacity>
                            </View>
                        )}
                    </>
                )}

            </ScrollView>
        </LinearGradient>
    );
};

const styles = StyleSheet.create({
    // Base
    container: { flex: 1 },
    scroll: { flex: 1 },
    scrollContent: { paddingTop: 20, paddingBottom: 60, paddingHorizontal: 20 },
    backRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 20 },
    backText: { color: Colors.primary, fontSize: 10, fontWeight: '900', letterSpacing: 2, textTransform: 'uppercase' },

    // Hero
    heroSection: { marginBottom: 32 },
    heroTag: { fontSize: 10, fontWeight: '900', color: '#fca5a5', letterSpacing: 2, marginBottom: 8 },
    heroTitle: { fontSize: 32, fontWeight: 'bold', color: '#fff', marginBottom: 12 },
    heroDesc: { fontSize: 15, color: 'rgba(255,255,255,0.7)', lineHeight: 22 },

    // Upload Card
    uploadCard: { backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 24, padding: 32, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', borderStyle: 'dashed' },
    uploadCardSelected: { backgroundColor: 'rgba(255,255,255,0.1)', borderColor: '#22c55e', borderStyle: 'solid' },
    uploadIconBox: { width: 64, height: 64, borderRadius: 32, backgroundColor: 'rgba(255,255,255,0.1)', alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
    uploadTitle: { fontSize: 18, fontWeight: 'bold', color: '#fff', marginBottom: 4 },
    uploadSub: { fontSize: 13, color: 'rgba(255,255,255,0.5)' },

    // Action Row
    actionRow: { flexDirection: 'row', gap: 12, marginTop: 24 },
    clearBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 14, borderRadius: 16, backgroundColor: 'rgba(239,68,68,0.1)', borderWidth: 1, borderColor: 'rgba(239,68,68,0.2)' },
    clearBtnText: { color: '#f87171', fontWeight: 'bold' },
    analyzeBtn: { flex: 2, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 14, borderRadius: 16, backgroundColor: '#7f0000', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
    analyzeBtnText: { color: '#fff', fontWeight: 'bold' },

    // Drafts
    draftsSection: { marginTop: 40 },
    draftsSectionTitle: { fontSize: 10, fontWeight: '900', color: 'rgba(255,255,255,0.4)', letterSpacing: 2, marginBottom: 16 },
    draftCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.05)', padding: 16, borderRadius: 16, marginBottom: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
    draftName: { fontSize: 14, fontWeight: 'bold', color: '#fff' },
    draftDate: { fontSize: 11, color: 'rgba(255,255,255,0.4)', marginTop: 2 },
    draftResume: { fontSize: 10, fontWeight: '900', color: '#fca5a5', letterSpacing: 1 },

    // Tabs
    tabContainer: { flexDirection: 'row', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 16, padding: 4, marginBottom: 24, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
    tab: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 10, borderRadius: 12 },
    tabActive: { backgroundColor: 'rgba(255,255,255,0.15)' },
    tabText: { fontSize: 10, fontWeight: '900', color: 'rgba(255,255,255,0.4)', letterSpacing: 1.5 },
    tabTextActive: { color: '#fff' },

    // Manuscript
    manuscriptContainer: { marginBottom: 40 },
    manuscriptPaper: { backgroundColor: '#fff', borderRadius: 24, padding: 20, ...Platform.select({ ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.1, shadowRadius: 20 }, android: { elevation: 8 } }) },
    manuscriptHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, borderBottomWidth: 1, borderBottomColor: '#f3f4f6', paddingBottom: 15, marginBottom: 20 },
    manuscriptTitle: { fontSize: 12, fontWeight: 'bold', color: '#6b7280', flex: 1 },
    manuscriptPage: { marginBottom: 40 },
    pageMarker: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 20, opacity: 0.3 },
    pageMarkerLine: { flex: 1, height: 1, backgroundColor: '#d1d5db' },
    pageMarkerText: { fontSize: 9, fontWeight: '900', color: '#111827', letterSpacing: 2 },
    pageText: { fontSize: 14, color: '#374151', lineHeight: 26, textAlign: 'justify', fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif' },
    pageIssuesFooter: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 15, borderTopWidth: 1, borderTopColor: '#f9fafb', paddingTop: 10 },
    miniIssueTag: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#f9fafb', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10, borderWidth: 1, borderColor: '#f3f4f6' },
    miniIssueTagActive: { borderColor: '#7f0000', backgroundColor: '#fef2f2' },
    miniIssueDot: { width: 6, height: 6, borderRadius: 3 },
    miniIssueText: { fontSize: 9, fontWeight: 'bold', color: '#4b5563' },

    // Findings
    scoreCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 24, padding: 20, marginBottom: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
    scoreBadge: { width: 60, height: 60, borderRadius: 30, borderWidth: 3, alignItems: 'center', justifyContent: 'center' },
    scoreNum: { fontSize: 20, fontWeight: 'bold' },
    scoreLabel: { fontSize: 8, fontWeight: 'bold', color: 'rgba(255,255,255,0.4)', marginTop: -2 },
    scoreTitle: { fontSize: 16, fontWeight: 'bold', color: '#fff', marginBottom: 2 },
    scoreSub: { fontSize: 13, color: 'rgba(255,255,255,0.5)' },

    statsRow: { flexDirection: 'row', gap: 12, paddingRight: 20 },
    statPill: { backgroundColor: 'rgba(255,255,255,0.05)', paddingHorizontal: 16, paddingVertical: 12, borderRadius: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)', minWidth: 100 },
    statPillVal: { fontSize: 16, fontWeight: 'bold', color: '#fff' },
    statPillLabel: { fontSize: 10, color: 'rgba(255,255,255,0.4)', marginTop: 2, fontWeight: 'bold', letterSpacing: 1 },

    feedbackTitle: { fontSize: 10, fontWeight: '900', color: 'rgba(255,255,255,0.4)', letterSpacing: 2, marginBottom: 16, marginTop: 10 },
    catBlock: { marginBottom: 16 },
    catHeader: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.05)', padding: 16, borderRadius: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
    catDot: { width: 8, height: 8, borderRadius: 4, marginRight: 12 },
    catName: { flex: 1, fontSize: 14, fontWeight: 'bold', color: '#fff' },
    catBadge: { backgroundColor: 'rgba(255,255,255,0.1)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10, marginRight: 12 },
    catBadgeText: { fontSize: 10, fontWeight: 'bold', color: '#fff' },

    issueCard: { backgroundColor: 'rgba(255,255,255,0.98)', borderRadius: 20, marginTop: 12, overflow: 'hidden', ...Platform.select({ ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 10 }, android: { elevation: 4 } }) },
    issueSeverityBar: { height: 4 },
    issueBody: { padding: 16 },
    issueTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10, marginBottom: 8 },
    issueTitle: { flex: 1, fontSize: 15, fontWeight: 'bold', color: '#111827' },
    severityPill: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6, borderWidth: 1 },
    severityPillText: { fontSize: 8, fontWeight: '900', textTransform: 'uppercase' },
    issueDesc: { fontSize: 13, color: '#4b5563', lineHeight: 20, marginBottom: 16 },
    suggestionBox: { backgroundColor: '#fffbeb', padding: 12, borderRadius: 12, flexDirection: 'row', gap: 10, marginBottom: 16, borderWidth: 1, borderColor: '#fef3c7' },
    suggestionText: { flex: 1, fontSize: 13, color: '#92400e', fontWeight: '500', fontStyle: 'italic' },

    issueActionRow: { flexDirection: 'row', gap: 10, marginTop: 15, borderTopWidth: 1, borderTopColor: '#f3f4f6', paddingTop: 12 },
    jumpBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 8, borderRadius: 8, borderWidth: 1, borderColor: '#e5e7eb' },
    jumpBtnText: { fontSize: 9, fontWeight: '900', color: '#6b7280', letterSpacing: 1 },
    applyIssueBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 8, borderRadius: 8, backgroundColor: '#059669' },
    applyIssueBtnText: { fontSize: 9, fontWeight: '900', color: '#fff', letterSpacing: 1 },
    dimissBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 8, borderRadius: 8, borderWidth: 1, borderColor: '#10b98120', backgroundColor: '#10b98108' },
    dimissBtnText: { fontSize: 9, fontWeight: '900', color: '#059669', letterSpacing: 1 },

    highlightText: { backgroundColor: '#fef3c7', color: '#b45309', fontWeight: 'bold', textDecorationLine: 'underline' },

    downloadFixedBtn: { 
        marginTop: 20, 
        flexDirection: 'row', 
        alignItems: 'center', 
        justifyContent: 'center', 
        gap: 10, 
        backgroundColor: '#7f0000', 
        paddingVertical: 16, 
        borderRadius: 16,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)'
    },
    downloadFixedBtnText: { color: '#fff', fontWeight: '900', fontSize: 10, letterSpacing: 2 },
});

export default AnalysisWorkspace;
