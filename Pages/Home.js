import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Dimensions,
  Animated,
  Platform,
  Alert,
  ActivityIndicator,
  Linking
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation, useIsFocused } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import CustomHeader from './Navigation/CustomHeader';
import GridMenu from './Navigation/GridMenu';
import BottomNavBar from './Navigation/BottomNavBar';
import AsyncStorage from '@react-native-async-storage/async-storage';
import API_BASE_URL from '../api';
import Colors from '../utils/Colors';

const { width, height } = Dimensions.get('window');

const HomeScreen = () => {
    const navigation = useNavigation();
    const isFocused = useIsFocused();
    const [isMenuVisible, setIsMenuVisible] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [user, setUser] = useState(null);
    const [activeTab, setActiveTab] = useState('ai'); // 'ai', 'recent', 'stats'

    // Animation States
    const welcomeAnim = React.useRef(new Animated.Value(0)).current;
    const statsAnim = React.useRef(new Animated.Value(0)).current;
    const aiLogAnim = React.useRef(new Animated.Value(0)).current;
    const secondaryGridAnim = React.useRef(new Animated.Value(0)).current;

    // Data States
    const [thesisCount, setThesisCount] = useState(0);
    const [deptCounts, setDeptCounts] = useState([]);
    const [aiHistory, setAiHistory] = useState([]);
    const [sessionHistory, setSessionHistory] = useState([]);
    const [localHistory, setLocalHistory] = useState([]);
    const [loadingAi, setLoadingAi] = useState(false);
    const [pendingCount, setPendingCount] = useState(0);

    // Selected AI Modal
    const [selectedAiItem, setSelectedAiItem] = useState(null);

    // Load Data whenever screen comes into focus
    useEffect(() => {
        if (isFocused) {
            loadDashboardData();
            startEntranceAnimations();
        }
    }, [isFocused]);

    const startEntranceAnimations = () => {
        // Reset
        welcomeAnim.setValue(0);
        statsAnim.setValue(0);
        aiLogAnim.setValue(0);
        secondaryGridAnim.setValue(0);

        // Staggered sequence
        Animated.stagger(150, [
            Animated.timing(welcomeAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
            Animated.timing(statsAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
            Animated.timing(aiLogAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
            Animated.timing(secondaryGridAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
        ]).start();
    };

    const loadDashboardData = async () => {
        try {
            const userDataStr = await AsyncStorage.getItem('userData');
            const token = await AsyncStorage.getItem('userToken');
            
            if (userDataStr) {
                setUser(JSON.parse(userDataStr));
            }

            // Local history is now handled by the backend session-history endpoint

            if (token) {
                // Fetch Thesis Count
                fetch(`${API_BASE_URL}/thesis/count`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                })
                .then(res => res.json())
                .then(data => { if (data.count !== undefined) setThesisCount(data.count) })
                .catch(err => console.log('Error fetching thesis count', err));

                // Fetch Department Counts
                fetch(`${API_BASE_URL}/thesis/department-counts`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                })
                .then(res => res.json())
                .then(data => { if (Array.isArray(data)) setDeptCounts(data) })
                .catch(err => console.log('Error fetching dept counts', err));

                // Fetch All Histories
                setLoadingAi(true);
                Promise.all([
                    fetch(`${API_BASE_URL}/user/ai-history`, { headers: { 'Authorization': `Bearer ${token}` } }),
                    fetch(`${API_BASE_URL}/user/session-history`, { headers: { 'Authorization': `Bearer ${token}` } }),
                    fetch(`${API_BASE_URL}/user/local-history`, { headers: { 'Authorization': `Bearer ${token}` } })
                ])
                .then(async ([aiRes, sessionRes, localRes]) => {
                    const aiData = await aiRes.json();
                    const sessionData = await sessionRes.json();
                    const localData = await localRes.json();

                    if (aiData.success) setAiHistory(aiData.data || []);
                    if (sessionData.success) setSessionHistory(sessionData.data || []);
                    if (localData.success) setLocalHistory(localData.data || []);
                })
                .catch(err => console.log('Error fetching history:', err))
                .finally(() => setLoadingAi(false));

                // Fetch Pending Approvals count if Professor
                if (userDataStr && JSON.parse(userDataStr).isProfessor) {
                    fetch(`${API_BASE_URL}/thesis/assigned/count`, {
                        headers: { 'Authorization': `Bearer ${token}` }
                    })
                    .then(res => res.json())
                    .then(data => { if (data.count !== undefined) setPendingCount(data.count) })
                    .catch(err => console.log('Error fetching pending count', err));
                }
            }
        } catch (error) {
            console.error('Error loading dashboard data:', error);
        }
    };

    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return 'Good Morning';
        if (hour < 17) return 'Good Afternoon';
        return 'Good Evening';
    };

    const handleSearch = () => {
        if (searchQuery.trim()) {
            navigation.navigate('SmartSearch', { initialQuery: searchQuery.trim() });
            setSearchQuery('');
        }
    };

    const clearRecentViews = async () => {
        Alert.alert(
            "Clear Recent Views",
            "Are you sure you want to permanently clear your research viewing history from all devices?",
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Clear All", onPress: async () => {
                        try {
                            const token = await AsyncStorage.getItem('userToken');
                            const res = await fetch(`${API_BASE_URL}/user/session-history`, {
                                method: 'DELETE',
                                headers: { 'Authorization': `Bearer ${token}` }
                            });
                            if (res.ok) {
                                setSessionHistory([]);
                                await AsyncStorage.removeItem('recent_theses');
                            }
                        } catch (err) {
                            Alert.alert("Error", "Failed to clear history");
                        }
                    }, style: 'destructive'
                }
            ]
        );
    };

    const confirmDeleteAiHistory = async (id) => {
        Alert.alert(
            "Delete Recommendation?",
            "Are you sure you want to permanently delete this AI title recommendation?",
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Delete", style: "destructive", onPress: async () => {
                        try {
                            const token = await AsyncStorage.getItem('userToken');
                            const res = await fetch(`${API_BASE_URL}/user/ai-history/${id}`, {
                                method: 'DELETE',
                                headers: { 'Authorization': `Bearer ${token}` }
                            });
                            if (res.ok) {
                                setAiHistory(prev => prev.filter(item => item._id !== id));
                            } else {
                                Alert.alert("Error", "Failed to delete history item");
                            }
                        } catch (err) {
                            Alert.alert("Error", "An network error occurred");
                        }
                    }
                }
            ]
        );
    };

    const confirmClearAllAiHistory = async () => {
        Alert.alert(
            "Clear All History?",
            "Are you sure you want to permanently clear all your AI title recommendations?",
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Clear All", style: "destructive", onPress: async () => {
                        try {
                            const token = await AsyncStorage.getItem('userToken');
                            const res = await fetch(`${API_BASE_URL}/user/ai-history`, {
                                method: 'DELETE',
                                headers: { 'Authorization': `Bearer ${token}` }
                            });
                            if (res.ok) {
                                setAiHistory([]);
                            } else {
                                Alert.alert("Error", "Failed to clear history");
                            }
                        } catch (err) {
                            Alert.alert("Error", "A network error occurred");
                        }
                    }
                }
            ]
        );
    };

    // Helper to extract bold parts
    const renderRecommendationText = (text) => {
        const lines = text.split('\n');
        return lines.map((line, lineIdx) => {
           const processedLine = line.replace(/^\s*\*\s/, '• ').replace(/^\s*-\s/, '• ');
           const parts = processedLine.split(/(\*\*.*?\*\*)/g);
           
           return (
               <Text key={lineIdx} style={styles.modalBodyText}>
                   {parts.map((part, i) => {
                       if (part.startsWith('**') && part.endsWith('**')) {
                          return <Text key={i} style={styles.modalBoldText}>{part.slice(2, -2)}</Text>;
                       }
                       return <Text key={i}>{part}</Text>;
                   })}
                   {'\n'}
               </Text>
           );
        });
    };

    return (
        <LinearGradient
            colors={[Colors.background, Colors.surface, Colors.background]}
            style={styles.container}
        >
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

            <ScrollView
                style={styles.scrollView}
                showsVerticalScrollIndicator={false}
                bounces={false}
                contentContainerStyle={{ flexGrow: 1, paddingBottom: 110 }}
            >
                <View style={styles.mainContent}>
                    
                    {/* Welcome Header */}
                    <Animated.View style={[
                        styles.welcomeSection,
                        { 
                            opacity: welcomeAnim,
                            transform: [{ translateY: welcomeAnim.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }]
                        }
                    ]}>
                        <Text style={styles.greetingHeader}>{getGreeting()}</Text>
                        <Text style={styles.welcomeTitle}>Welcome back, {user?.name || 'Researcher'}</Text>
                        <Text style={styles.welcomeSub}>Manage your research and explore the thesis collection.</Text>
                    </Animated.View>
                    {/* Unified Stats Strip */}
                    <Animated.View style={{ 
                        opacity: statsAnim,
                        transform: [{ translateY: statsAnim.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }]
                    }}>
                        <View style={styles.statsContainer}>
                            <View style={styles.statCol}>
                                <Text style={styles.statVal}>{thesisCount.toLocaleString()}</Text>
                                <Text style={styles.statLbl}>THESES</Text>
                            </View>
                            <View style={styles.statDivider} />
                            <View style={styles.statCol}>
                                <Text style={styles.statVal}>{aiHistory.length}</Text>
                                <Text style={styles.statLbl}>AI LOGS</Text>
                            </View>
                            <View style={styles.statDivider} />
                            <TouchableOpacity 
                                style={styles.statCol}
                                disabled={!user?.isProfessor}
                                onPress={() => navigation.navigate('Approvals')}
                            >
                                <Text style={[styles.statVal, user?.isProfessor && { color: Colors.primary }]}>
                                    {user?.isProfessor ? pendingCount : sessionHistory.length}
                                </Text>
                                <Text style={styles.statLbl}>
                                    {user?.isProfessor ? 'PENDING' : 'RECENT'}
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </Animated.View>

                    {/* Segmented Control Tabs */}
                    <Animated.View style={[
                        styles.tabsContainer,
                        {
                            opacity: aiLogAnim,
                            transform: [{ translateY: aiLogAnim.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }]
                        }
                    ]}>
                        <View style={styles.tabBar}>
                            <TouchableOpacity 
                                style={[styles.tabButton, activeTab === 'ai' && styles.tabButtonActive]}
                                onPress={() => setActiveTab('ai')}
                                activeOpacity={0.7}
                            >
                                <Ionicons name="hardware-chip" size={14} color={activeTab === 'ai' ? '#FFFFFF' : Colors.textSecondary} />
                                <Text style={[styles.tabText, activeTab === 'ai' && styles.tabTextActive]}>AI Help</Text>
                            </TouchableOpacity>

                            <TouchableOpacity 
                                style={[styles.tabButton, activeTab === 'recent' && styles.tabButtonActive]}
                                onPress={() => setActiveTab('recent')}
                                activeOpacity={0.7}
                            >
                                <Ionicons name="time" size={14} color={activeTab === 'recent' ? '#FFFFFF' : Colors.textSecondary} />
                                <Text style={[styles.tabText, activeTab === 'recent' && styles.tabTextActive]}>Recent</Text>
                            </TouchableOpacity>

                            <TouchableOpacity 
                                style={[styles.tabButton, activeTab === 'stats' && styles.tabButtonActive]}
                                onPress={() => setActiveTab('stats')}
                                activeOpacity={0.7}
                            >
                                <Ionicons name="podium" size={14} color={activeTab === 'stats' ? '#FFFFFF' : Colors.textSecondary} />
                                <Text style={[styles.tabText, activeTab === 'stats' && styles.tabTextActive]}>Courses</Text>
                            </TouchableOpacity>
                        </View>
                    </Animated.View>

                    {/* Active Tab Content Card */}
                    <Animated.View style={[
                        styles.contentCardContainer,
                        {
                            opacity: secondaryGridAnim,
                            transform: [{ translateY: secondaryGridAnim.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }]
                        }
                    ]}>
                        {activeTab === 'ai' && (
                            <View style={styles.tabContentCard}>
                                <View style={styles.cardHeaderRow}>
                                    <Text style={styles.cardHeaderTitle}>AI SUGGESTIONS</Text>
                                    {aiHistory.length > 0 && (
                                        <TouchableOpacity style={styles.clearBtn} onPress={confirmClearAllAiHistory}>
                                            <Text style={styles.clearBtnText}>CLEAR ALL</Text>
                                        </TouchableOpacity>
                                    )}
                                </View>

                                {loadingAi ? (
                                    <View style={styles.emptyState}>
                                        <ActivityIndicator size="small" color={Colors.primary} />
                                        <Text style={styles.emptyStateText}>Loading suggestions...</Text>
                                    </View>
                                ) : aiHistory.length > 0 ? (
                                    aiHistory.slice(0, 5).map((item, index) => (
                                        <TouchableOpacity 
                                            key={item._id} 
                                            style={[styles.historyRow, index !== Math.min(aiHistory.length, 5) - 1 && styles.rowBorder]}
                                            onPress={() => setSelectedAiItem(item)}
                                        >
                                            <View style={styles.rowInfo}>
                                                <View style={[styles.rowIconCircle, { backgroundColor: 'rgba(45, 212, 191, 0.08)' }]}>
                                                    <Ionicons name="hardware-chip" size={16} color={Colors.primary} />
                                                </View>
                                                <View style={styles.rowTextContainer}>
                                                    <Text style={styles.rowTitle} numberOfLines={1}>{item.prompt}</Text>
                                                    <Text style={styles.rowSub}>{new Date(item.createdAt).toLocaleDateString()}</Text>
                                                </View>
                                            </View>
                                            <TouchableOpacity 
                                                style={styles.rowDeleteBtn}
                                                onPress={() => confirmDeleteAiHistory(item._id)}
                                            >
                                                <Ionicons name="trash-outline" size={16} color={Colors.accent} />
                                            </TouchableOpacity>
                                        </TouchableOpacity>
                                    ))
                                ) : (
                                    <View style={styles.emptyState}>
                                        <Ionicons name="hardware-chip-outline" size={32} color={Colors.textDim} />
                                        <Text style={styles.emptyStateText}>No AI suggestions yet</Text>
                                    </View>
                                )}
                            </View>
                        )}

                        {activeTab === 'recent' && (
                            <View style={styles.tabContentCard}>
                                <View style={styles.cardHeaderRow}>
                                    <Text style={styles.cardHeaderTitle}>RECENT VIEWS</Text>
                                    {sessionHistory.length > 0 && (
                                        <TouchableOpacity style={styles.clearBtn} onPress={clearRecentViews}>
                                            <Text style={styles.clearBtnText}>CLEAR ALL</Text>
                                        </TouchableOpacity>
                                    )}
                                </View>

                                {sessionHistory.length > 0 ? (
                                    sessionHistory.slice(0, 5).map((item, idx) => {
                                        const thesisTitle = item.title || (item.thesis && item.thesis.title) || 'Unknown Thesis';
                                        const thesisYear = item.year || (item.thesis && item.thesis.year_range) || 'Unknown';
                                        const thesisId = item.thesis?._id || item.thesis?.id || item._id;

                                        return (
                                            <TouchableOpacity 
                                                key={item._id || idx}
                                                style={[styles.historyRow, idx !== Math.min(sessionHistory.length, 5) - 1 && styles.rowBorder]}
                                                onPress={() => navigation.navigate('ThesisDetail', { thesisId: thesisId })}
                                            >
                                                <View style={styles.rowInfo}>
                                                    <View style={[styles.rowIconCircle, { backgroundColor: 'rgba(249, 115, 22, 0.08)' }]}>
                                                        <Ionicons name="book" size={16} color="#f97316" />
                                                    </View>
                                                    <View style={styles.rowTextContainer}>
                                                        <Text style={styles.rowTitle} numberOfLines={1}>{thesisTitle}</Text>
                                                        <Text style={styles.rowSub}>Published: {thesisYear}</Text>
                                                    </View>
                                                </View>
                                                <Ionicons name="chevron-forward" size={16} color={Colors.textDim} />
                                            </TouchableOpacity>
                                        );
                                    })
                                ) : (
                                    <View style={styles.emptyState}>
                                        <Ionicons name="book-outline" size={32} color={Colors.textDim} />
                                        <Text style={styles.emptyStateText}>No recently viewed papers</Text>
                                    </View>
                                )}
                            </View>
                        )}

                        {activeTab === 'stats' && (
                            <View style={styles.tabContentCard}>
                                <View style={styles.cardHeaderRow}>
                                    <Text style={styles.cardHeaderTitle}>PAPERS BY COURSE</Text>
                                </View>

                                {deptCounts.length > 0 ? (
                                    deptCounts.slice(0, 5).map((dept, idx) => (
                                        <TouchableOpacity 
                                            key={dept.course + idx}
                                            style={[styles.historyRow, idx !== Math.min(deptCounts.length, 5) - 1 && styles.rowBorder]}
                                            onPress={() => navigation.navigate('SearchResult', { course: dept.course })}
                                        >
                                            <View style={styles.rowInfo}>
                                                <View style={[styles.rowIconCircle, { backgroundColor: 'rgba(168, 85, 247, 0.08)' }]}>
                                                    <Ionicons name="podium" size={16} color="#a855f7" />
                                                </View>
                                                <View style={styles.rowTextContainer}>
                                                    <Text style={styles.rowTitle}>{dept.course}</Text>
                                                    <Text style={styles.rowSub}>{dept.count} documents available</Text>
                                                </View>
                                            </View>
                                            <Ionicons name="chevron-forward" size={16} color={Colors.textDim} />
                                        </TouchableOpacity>
                                    ))
                                ) : (
                                    <View style={styles.emptyState}>
                                        <Ionicons name="podium-outline" size={32} color={Colors.textDim} />
                                        <Text style={styles.emptyStateText}>No archive data found</Text>
                                    </View>
                                )}
                            </View>
                        )}
                    </Animated.View>

                </View>
            </ScrollView>

            {/* Selected AI Modal */}
            {selectedAiItem && (
                <View style={[StyleSheet.absoluteFill, styles.modalOverlay]}>
                     <View style={styles.modalContent}>
                          <TouchableOpacity 
                              style={styles.modalCloseBtn}
                              onPress={() => setSelectedAiItem(null)}
                          >
                              <Ionicons name="close" size={24} color="#9ca3af" />
                          </TouchableOpacity>

                          <View style={styles.modalHeaderRow}>
                               <View style={styles.modalIconBox}>
                                   <Ionicons name="hardware-chip" size={32} color="#ef4444" />
                               </View>
                               <View style={styles.modalHeaderTextFlex}>
                                   <Text style={styles.modalTitle}>AI Title Recommendation</Text>
                                   <Text style={styles.modalSubtitle}>TAILORED TO: "{selectedAiItem.prompt}"</Text>
                               </View>
                          </View>

                          <View style={styles.modalScrollBodyArea}>
                              <ScrollView contentContainerStyle={{ padding: 20 }}>
                                  {renderRecommendationText(selectedAiItem.recommendation)}
                              </ScrollView>
                          </View>

                     </View>
                </View>
            )}

            {/* Bottom Nav Bar */}
            <BottomNavBar activeScreen="Home" onGridPress={() => setIsMenuVisible(true)} />

        </LinearGradient>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    scrollView: {
        flex: 1,
    },
    mainContent: {
        flex: 1,
        paddingTop: 30,
        zIndex: 1,
    },
    welcomeSection: {
        paddingHorizontal: 24,
        marginBottom: 32,
    },
    greetingHeader: {
        fontSize: 10,
        color: Colors.primary,
        fontWeight: '900',
        letterSpacing: 2,
        textTransform: 'uppercase',
        marginBottom: 8,
    },
    welcomeTitle: {
        fontSize: 32,
        fontWeight: '900',
        color: Colors.foreground,
        letterSpacing: -0.5,
    },
    welcomeSub: {
        fontSize: 14,
        color: Colors.textSecondary,
        fontWeight: '500',
        marginTop: 6,
    },
    statsContainer: {
        flexDirection: 'row',
        backgroundColor: 'rgba(38, 38, 55, 0.4)',
        borderColor: Colors.border,
        borderWidth: 1,
        borderRadius: 24,
        paddingVertical: 18,
        marginHorizontal: 24,
        marginBottom: 24,
        alignItems: 'center',
        justifyContent: 'space-around',
    },
    statCol: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    statVal: {
        fontSize: 22,
        fontWeight: '900',
        color: '#FFFFFF',
        marginBottom: 4,
    },
    statLbl: {
        fontSize: 9,
        fontWeight: '900',
        color: Colors.textSecondary,
        letterSpacing: 1.5,
    },
    statDivider: {
        width: 1,
        height: 32,
        backgroundColor: 'rgba(255, 255, 255, 0.08)',
    },

    // Segmented Tabs Control
    tabsContainer: {
        marginHorizontal: 24,
        marginBottom: 16,
    },
    tabBar: {
        flexDirection: 'row',
        backgroundColor: 'rgba(255, 255, 255, 0.03)',
        borderWidth: 1,
        borderColor: Colors.border,
        borderRadius: 16,
        padding: 4,
        gap: 4,
    },
    tabButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        paddingVertical: 10,
        borderRadius: 12,
    },
    tabButtonActive: {
        backgroundColor: Colors.primary,
        ...Platform.select({
            ios: {
                shadowColor: Colors.primary,
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.3,
                shadowRadius: 6,
            },
            android: {
                elevation: 4,
            },
        }),
    },
    tabText: {
        fontSize: 12,
        fontWeight: '700',
        color: Colors.textSecondary,
    },
    tabTextActive: {
        color: '#FFFFFF',
        fontWeight: '800',
    },

    // Content Cards
    contentCardContainer: {
        marginHorizontal: 24,
        marginBottom: 40,
    },
    tabContentCard: {
        backgroundColor: Colors.card,
        borderWidth: 1,
        borderColor: Colors.border,
        borderRadius: 24,
        padding: 20,
        overflow: 'hidden',
    },
    cardHeaderRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 16,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255, 255, 255, 0.05)',
        paddingBottom: 12,
    },
    cardHeaderTitle: {
        fontSize: 10,
        fontWeight: '900',
        color: '#FFFFFF',
        letterSpacing: 2,
    },
    clearBtn: {
        backgroundColor: 'rgba(243, 139, 168, 0.08)',
        borderColor: 'rgba(243, 139, 168, 0.2)',
        borderWidth: 1,
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
    },
    clearBtnText: {
        fontSize: 9,
        fontWeight: '900',
        color: Colors.accent,
        letterSpacing: 1.5,
    },

    // Sleek Rows
    historyRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 14,
    },
    rowBorder: {
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255, 255, 255, 0.04)',
    },
    rowInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
        marginRight: 16,
    },
    rowIconCircle: {
        width: 36,
        height: 36,
        borderRadius: 18,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    rowTextContainer: {
        flex: 1,
    },
    rowTitle: {
        fontSize: 14,
        fontWeight: '700',
        color: '#FFFFFF',
        marginBottom: 2,
    },
    rowSub: {
        fontSize: 11,
        color: Colors.textSecondary,
        fontWeight: '500',
    },
    rowDeleteBtn: {
        padding: 6,
    },
    emptyStateText: {
        fontSize: 13,
        color: Colors.textDim,
        fontWeight: '600',
        marginTop: 10,
    },
    emptyState: {
        padding: 40,
        alignItems: 'center',
        justifyContent: 'center',
    },

    // Modal Overlays
    modalOverlay: {
        backgroundColor: 'rgba(0,0,0,0.6)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
        zIndex: 100,
    },
    modalContent: {
        backgroundColor: Colors.card,
        width: '100%',
        maxHeight: '85%',
        borderRadius: 32,
        paddingTop: 32,
        paddingBottom: 24,
        borderWidth: 1,
        borderColor: Colors.border,
        ...Platform.select({
            ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 20 }, shadowOpacity: 0.5, shadowRadius: 30 },
            android: { elevation: 20 }
        }),
    },
    modalCloseBtn: {
        position: 'absolute',
        top: 20,
        right: 20,
        width: 36,
        height: 36,
        backgroundColor: 'rgba(255,255,255,0.08)',
        borderRadius: 18,
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 10,
    },
    modalHeaderRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 24,
        marginBottom: 24,
    },
    modalIconBox: {
        width: 56,
        height: 56,
        borderRadius: 16,
        backgroundColor: `${Colors.primary}15`,
        borderWidth: 1,
        borderColor: `${Colors.primary}30`,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 16,
    },
    modalHeaderTextFlex: {
        flex: 1,
        paddingRight: 20,
    },
    modalTitle: {
        fontSize: 22,
        fontWeight: '900',
        color: Colors.foreground,
        lineHeight: 26,
        marginBottom: 4,
    },
    modalSubtitle: {
        fontSize: 10,
        color: Colors.textSecondary,
        fontWeight: '900',
        letterSpacing: 1.5,
    },
    modalScrollBodyArea: {
        flexShrink: 1,
        marginHorizontal: 24,
        backgroundColor: 'rgba(255,255,255,0.04)',
        borderWidth: 1,
        borderColor: Colors.border,
        borderRadius: 24,
    },
    modalBodyText: {
        fontSize: 15,
        color: Colors.textSecondary,
        lineHeight: 26,
    },
    modalBoldText: {
        fontWeight: '900',
        color: Colors.foreground,
    }
});

export default HomeScreen;