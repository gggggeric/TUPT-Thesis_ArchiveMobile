import React, { useState, useEffect } from 'react';
import {
    View, Text, StyleSheet, ScrollView, TouchableOpacity,
    Platform, ActivityIndicator, RefreshControl, Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import CustomHeader from '../../Navigation/CustomHeader';
import GridMenu from '../../Navigation/GridMenu';
import API_BASE_URL from '../../../api';
import Colors from '../../../utils/Colors';

const MySubmissions = () => {
    const navigation = useNavigation();
    const [isMenuVisible, setIsMenuVisible] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    const [theses, setTheses] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    useEffect(() => {
        const checkUserRole = async () => {
            try {
                const userData = await AsyncStorage.getItem('userData');
                if (userData) {
                    const user = JSON.parse(userData);
                    if (user.isProfessor) {
                        Alert.alert(
                            "Access Denied",
                            "Faculty members cannot access the submissions page. You have been redirected to Faculty Approvals."
                        );
                        navigation.navigate('Approvals');
                        return;
                    } else if (user.isAdmin) {
                        Alert.alert(
                            "Access Denied",
                            "Admin administrative tools are available on the web portal. Mobile access is restricted to search, stats, and profile viewing."
                        );
                        navigation.navigate('AdminDashboard');
                        return;
                    }
                }
            } catch (err) {
                console.error(err);
            }
            fetchTheses();
        };
        checkUserRole();
    }, []);

    const fetchTheses = async () => {
        setIsLoading(true);
        try {
            const token = await AsyncStorage.getItem('userToken');
            if (!token) { setIsLoading(false); return; }

            const res = await fetch(`${API_BASE_URL}/user/theses`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setTheses(data.data || []);
            }
        } catch (err) {
            console.error('Error fetching theses:', err);
        } finally {
            setIsLoading(false);
            setRefreshing(false);
        }
    };

    const handleSearch = () => {
        if (searchQuery.trim()) {
            navigation.navigate('SmartSearch', { initialQuery: searchQuery.trim() });
            setSearchQuery('');
        }
    };

    return (
        <LinearGradient colors={[Colors.background, Colors.surface, Colors.background]} style={styles.container}>
            <CustomHeader
                onMenuPress={() => setIsMenuVisible(true)}
                onSearch={handleSearch}
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
            />
            {/* Grid Menu */}
            <GridMenu isVisible={isMenuVisible} onClose={() => setIsMenuVisible(false)} navigation={navigation} />

            <ScrollView
                style={styles.scroll}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchTheses(); }} tintColor={Colors.primary} />}
            >
                {/* Back Button */}
                <TouchableOpacity style={styles.backRow} onPress={() => navigation.navigate('Home')}>
                    <Ionicons name="arrow-back" size={16} color={Colors.primary} />
                    <Text style={styles.backText}>Back to Dashboard</Text>
                </TouchableOpacity>

                {/* Header */}
                <View style={styles.headerRow}>
                    <View style={styles.headerLeft}>
                        <View style={styles.headerBar} />
                        <View>
                            <Text style={styles.headerTag}>MY SUBMISSIONS</Text>
                            <Text style={styles.headerTitle}>My Research Entries</Text>
                        </View>
                    </View>
                    <View style={styles.countBadge}>
                        <Text style={styles.countBadgeText}>{theses.length} Submissions</Text>
                    </View>
                </View>

                {isLoading ? (
                    <View style={styles.loadingBox}>
                        <ActivityIndicator size="large" color={Colors.primary} />
                    </View>
                ) : theses.length > 0 ? (
                    theses.map((thesis) => (
                        <View key={thesis._id} style={styles.thesisCard}>
                            {/* Course + Status */}
                            <View style={styles.cardTopRow}>
                                <Text style={styles.courseText}>{thesis.course || 'General'}</Text>
                                <View style={[styles.statusPill, thesis.isApproved ? styles.statusApproved : styles.statusPending]}>
                                    <View style={[styles.statusDot, { backgroundColor: thesis.isApproved ? '#4ade80' : '#fbbf24' }]} />
                                    <Text style={[styles.statusPillText, thesis.isApproved ? styles.statusApprovedText : styles.statusPendingText]}>
                                        {thesis.isApproved ? 'Approved' : 'Reviewing'}
                                    </Text>
                                </View>
                            </View>

                            {/* Title */}
                            <Text style={styles.thesisTitle} numberOfLines={2}>{thesis.title}</Text>

                            {/* Metadata */}
                            <View style={styles.metaRow}>
                                <View style={styles.metaCol}>
                                    <Text style={styles.metaLabel}>AUTHOR</Text>
                                    <Text style={styles.metaValue}>{thesis.author}</Text>
                                </View>
                                <View style={styles.metaCol}>
                                    <Text style={styles.metaLabel}>YEAR</Text>
                                    <Text style={styles.metaValue}>{thesis.year_range || 'N/A'}</Text>
                                </View>
                            </View>

                            {/* Approval Report Section */}
                            <View style={styles.approvalSection}>
                                <View style={styles.reportRow}>
                                    <Text style={styles.reportLabel}>PROFESSOR</Text>
                                    <Text style={styles.reportValue}>{thesis.professorId?.name || 'Unassigned'}</Text>
                                </View>
                                
                                {thesis.isApproved && thesis.approvedBy && (
                                    <View style={styles.reportRow}>
                                        <Text style={[styles.reportLabel, { color: Colors.primary }]}>APPROVED BY</Text>
                                        <View style={styles.reportValueRow}>
                                            <Text style={[styles.reportValue, { fontWeight: '900' }]}>{thesis.approvedBy.name}</Text>
                                            <Text style={styles.reportDate}>
                                                {thesis.approvedAt ? new Date(thesis.approvedAt).toLocaleDateString() : ''}
                                            </Text>
                                        </View>
                                    </View>
                                )}
                            </View>

                            {/* Action Button */}
                            <TouchableOpacity
                                style={[styles.mainActionBtn, !thesis.isApproved && styles.mainActionBtnDisabled]}
                                disabled={!thesis.isApproved}
                                onPress={() => navigation.navigate('ThesisDetail', { thesisId: thesis._id })}
                            >
                                <Text style={[styles.mainActionBtnText, !thesis.isApproved && styles.mainActionBtnTextDisabled]}>
                                    {thesis.isApproved ? 'VIEW RESEARCH' : 'UNDER REVIEW'}
                                </Text>
                            </TouchableOpacity>
                        </View>
                    ))
                ) : (
                    <View style={styles.emptyCard}>
                        <View style={styles.emptyIconBox}>
                            <Ionicons name="bulb" size={32} color="#9ca3af" />
                        </View>
                        <Text style={styles.emptyTitle}>No submissions detected</Text>
                        <Text style={styles.emptyDesc}>Your uploaded documents will appear here.</Text>
                    </View>
                )}
            </ScrollView>
        </LinearGradient>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },
    scroll: { flex: 1 },
    scrollContent: { paddingTop: 20, paddingBottom: 60, paddingHorizontal: 20 },
    backRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 20 },
    backText: { color: Colors.primary, fontSize: 10, fontWeight: '900', letterSpacing: 2, textTransform: 'uppercase' },

    // Header
    headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 },
    headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    headerBar: { width: 4, height: 40, borderRadius: 2, backgroundColor: Colors.primary },
    headerTag: { fontSize: 10, fontWeight: '900', color: Colors.textSecondary, letterSpacing: 2 },
    headerTitle: { fontSize: 22, fontWeight: '900', color: Colors.foreground, textTransform: 'uppercase' },
    countBadge: { backgroundColor: `${Colors.primary}15`, paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20, borderWidth: 1, borderColor: `${Colors.primary}30` },
    countBadgeText: { fontSize: 9, fontWeight: '900', color: Colors.primary, letterSpacing: 1 },

    loadingBox: { paddingVertical: 60, alignItems: 'center' },

    // Cards
    thesisCard: {
        backgroundColor: Colors.card, borderRadius: 24, padding: 20, marginBottom: 16,
        borderWidth: 1, borderColor: Colors.border,
        ...Platform.select({
            ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.25, shadowRadius: 12 },
            android: { elevation: 6 }
        }),
    },
    cardTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
    statusPill: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, borderWidth: 1 },
    statusApproved: { backgroundColor: 'rgba(34,197,94,0.1)', borderColor: 'rgba(34,197,94,0.3)' },
    statusPending: { backgroundColor: 'rgba(251,191,36,0.1)', borderColor: 'rgba(251,191,36,0.3)' },
    statusPillText: { fontSize: 8, fontWeight: '900', letterSpacing: 1, textTransform: 'uppercase' },
    statusApprovedText: { color: '#4ade80' },
    statusPendingText: { color: '#fbbf24' },
    thesisTitle: { fontSize: 16, fontWeight: '900', color: Colors.foreground, textTransform: 'uppercase', lineHeight: 22, marginBottom: 16 },
    
    metaRow: { flexDirection: 'row', gap: 24, marginBottom: 20 },
    metaCol: { flex: 1 },
    metaLabel: { fontSize: 8, fontWeight: '900', color: Colors.textSecondary, letterSpacing: 1.5, marginBottom: 4 },
    metaValue: { fontSize: 11, fontWeight: 'bold', color: Colors.foreground },

    approvalSection: { paddingTop: 16, borderTopWidth: 1, borderTopColor: Colors.border, marginBottom: 20 },
    reportRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
    reportLabel: { fontSize: 8, fontWeight: '900', color: Colors.textDim, letterSpacing: 1 },
    reportValue: { fontSize: 11, fontWeight: 'bold', color: Colors.textSecondary },
    reportValueRow: { alignItems: 'flex-end' },
    reportDate: { fontSize: 8, color: Colors.textDim, italic: true, marginTop: 2 },

    mainActionBtn: { backgroundColor: Colors.primary, paddingVertical: 12, borderRadius: 12, alignItems: 'center' },
    mainActionBtnDisabled: { backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1, borderColor: Colors.border },
    mainActionBtnText: { fontSize: 10, fontWeight: '900', color: '#fff', letterSpacing: 2 },
    mainActionBtnTextDisabled: { color: Colors.textDim },

    courseText: { fontSize: 10, fontWeight: '900', color: Colors.primary, letterSpacing: 1 },
    statusDot: { width: 6, height: 6, borderRadius: 3, marginRight: 6 },

    // Removed old footer styles


    // Empty
    emptyCard: {
        backgroundColor: Colors.card, borderRadius: 28, padding: 40, alignItems: 'center',
        borderWidth: 1, borderColor: Colors.border,
        ...Platform.select({
            ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.25, shadowRadius: 12 },
            android: { elevation: 6 }
        }),
    },
    emptyIconBox: { width: 64, height: 64, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.04)', alignItems: 'center', justifyContent: 'center', marginBottom: 16, borderWidth: 1, borderColor: Colors.border },
    emptyTitle: { fontSize: 15, fontWeight: '900', color: Colors.foreground, textTransform: 'uppercase', marginBottom: 4 },
    emptyDesc: { fontSize: 12, color: Colors.textSecondary, textAlign: 'center' },
});

export default MySubmissions;
