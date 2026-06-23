import React, { useState, useEffect } from 'react';
import {
    View, Text, StyleSheet, ScrollView, TouchableOpacity,
    Platform, ActivityIndicator, RefreshControl, Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useIsFocused } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import CustomHeader from '../Navigation/CustomHeader';
import GridMenu from '../Navigation/GridMenu';
import API_BASE_URL from '../../api';
import Colors from '../../utils/Colors';

const Approvals = () => {
    const navigation = useNavigation();
    const isFocused = useIsFocused();
    const [isMenuVisible, setIsMenuVisible] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    const [theses, setTheses] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [processingId, setProcessingId] = useState(null);

    useEffect(() => { fetchAssignedTheses(); }, []);

    const fetchAssignedTheses = async () => {
        setIsLoading(true);
        try {
            const token = await AsyncStorage.getItem('userToken');
            if (!token) { setIsLoading(false); return; }

            const res = await fetch(`${API_BASE_URL}/thesis/assigned`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setTheses(data.data || []);
            }
        } catch (err) {
            console.error('Error fetching assigned theses:', err);
        } finally {
            setIsLoading(false);
            setRefreshing(false);
        }
    };

    const handleApprove = async (id, title) => {
        Alert.alert(
            "Approve Research",
            `Are you sure you want to approve "${title}"?`,
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Approve",
                    onPress: async () => {
                        setProcessingId(id);
                        try {
                            const token = await AsyncStorage.getItem('userToken');
                            const res = await fetch(`${API_BASE_URL}/thesis/${id}/approve`, {
                                method: 'PATCH',
                                headers: { 'Authorization': `Bearer ${token}` }
                            });
                            if (res.ok) {
                                Alert.alert("Success", "Research approved successfully");
                                fetchAssignedTheses();
                            } else {
                                Alert.alert("Error", "Failed to approve research");
                            }
                        } catch (err) {
                            Alert.alert("Error", "Could not connect to server");
                        } finally {
                            setProcessingId(null);
                        }
                    }
                }
            ]
        );
    };

    const handleReject = async (id, title) => {
        Alert.alert(
            "Reject Research",
            `Are you sure you want to reject "${title}"?`,
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Reject",
                    style: "destructive",
                    onPress: async () => {
                        setProcessingId(id);
                        try {
                            const token = await AsyncStorage.getItem('userToken');
                            const res = await fetch(`${API_BASE_URL}/thesis/${id}/disapprove`, {
                                method: 'PATCH',
                                headers: { 'Authorization': `Bearer ${token}` }
                            });
                            if (res.ok) {
                                Alert.alert("Success", "Research rejected successfully");
                                fetchAssignedTheses();
                            } else {
                                Alert.alert("Error", "Failed to reject research");
                            }
                        } catch (err) {
                            Alert.alert("Error", "Could not connect to server");
                        } finally {
                            setProcessingId(null);
                        }
                    }
                }
            ]
        );
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
            {isFocused && (
                <GridMenu isVisible={isMenuVisible} onClose={() => setIsMenuVisible(false)} navigation={navigation} />
            )}

            <ScrollView
                style={styles.scroll}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchAssignedTheses(); }} tintColor={Colors.primary} />}
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
                            <Text style={styles.headerTag}>FACULTY PANEL</Text>
                            <Text style={styles.headerTitle}>Pending Approvals</Text>
                        </View>
                    </View>
                    <View style={styles.countBadge}>
                        <Text style={styles.countBadgeText}>{theses.length} Items</Text>
                    </View>
                </View>

                {isLoading ? (
                    <View style={styles.loadingBox}>
                        <ActivityIndicator size="large" color={Colors.primary} />
                    </View>
                ) : theses.length > 0 ? (
                    theses.map((thesis) => (
                        <View key={thesis._id} style={styles.thesisCard}>
                            {/* Category + Status */}
                            <View style={styles.cardTopRow}>
                                <View style={styles.categoryPill}>
                                    <Text style={styles.categoryPillText}>{thesis.course || 'General'}</Text>
                                </View>
                                <View style={[styles.statusPill, thesis.isProfApproved ? styles.statusApproved : styles.statusPending]}>
                                    <Text style={[styles.statusPillText, thesis.isProfApproved ? styles.statusApprovedText : styles.statusPendingText]}>
                                        {thesis.isProfApproved ? 'Approved' : 'Pending'}
                                    </Text>
                                </View>
                            </View>

                            {/* Title */}
                            <Text style={styles.thesisTitle} numberOfLines={2}>{thesis.title}</Text>

                            {/* Author + Year */}
                            <Text style={styles.thesisAuthor}>{thesis.author} • {thesis.year_range || 'Unknown Year'}</Text>

                            {/* Abstract Preview */}
                            <Text style={styles.thesisAbstract} numberOfLines={3}>{thesis.abstract}</Text>

                            {/* Action Buttons */}
                            <View style={styles.cardFooter}>
                                <TouchableOpacity
                                    style={styles.viewBtn}
                                    onPress={() => navigation.navigate('ThesisDetail', { thesisId: thesis._id })}
                                >
                                    <View style={styles.docIcon}>
                                        <Ionicons name="eye" size={16} color={Colors.primary} />
                                    </View>
                                    <Text style={styles.viewBtnText}>Details</Text>
                                </TouchableOpacity>

                                <View style={styles.actionRow}>
                                    <TouchableOpacity
                                        style={[styles.rejectBtn, processingId === thesis._id && { opacity: 0.5 }]}
                                        onPress={() => handleReject(thesis._id, thesis.title)}
                                        disabled={processingId === thesis._id}
                                    >
                                        <Ionicons name="close" size={16} color="#ef4444" />
                                        <Text style={styles.rejectBtnText}>Reject</Text>
                                    </TouchableOpacity>

                                    {!thesis.isProfApproved && (
                                        <TouchableOpacity
                                            style={[styles.approveBtn, processingId === thesis._id && { opacity: 0.5 }]}
                                            onPress={() => handleApprove(thesis._id, thesis.title)}
                                            disabled={processingId === thesis._id}
                                        >
                                            <Ionicons name="checkmark" size={16} color="#fff" />
                                            <Text style={styles.approveBtnText}>Approve</Text>
                                        </TouchableOpacity>
                                    )}
                                </View>
                            </View>
                        </View>
                    ))
                ) : (
                    <View style={styles.emptyCard}>
                        <View style={styles.emptyIconBox}>
                            <Ionicons name="folder-open" size={32} color="#9ca3af" />
                        </View>
                        <Text style={styles.emptyTitle}>All caught up!</Text>
                        <Text style={styles.emptyDesc}>No research papers currently awaiting your approval.</Text>
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

    headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 },
    headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    headerBar: { width: 4, height: 40, borderRadius: 2, backgroundColor: Colors.primary },
    headerTag: { fontSize: 10, fontWeight: '900', color: Colors.textSecondary, letterSpacing: 2 },
    headerTitle: { fontSize: 22, fontWeight: '900', color: Colors.foreground, textTransform: 'uppercase' },
    countBadge: { backgroundColor: `${Colors.primary}15`, paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20, borderWidth: 1, borderColor: `${Colors.primary}30` },
    countBadgeText: { fontSize: 9, fontWeight: '900', color: Colors.primary, letterSpacing: 1 },

    loadingBox: { paddingVertical: 60, alignItems: 'center' },

    thesisCard: {
        backgroundColor: Colors.card, borderRadius: 24, padding: 20, marginBottom: 16,
        borderWidth: 1, borderColor: Colors.border,
        ...Platform.select({
            ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.25, shadowRadius: 12 },
            android: { elevation: 6 }
        }),
    },
    cardTopRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
    categoryPill: { backgroundColor: `${Colors.primary}15`, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, borderWidth: 1, borderColor: `${Colors.primary}30` },
    categoryPillText: { fontSize: 9, fontWeight: '900', color: Colors.primary, letterSpacing: 1 },
    statusPill: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, borderWidth: 1 },
    statusApproved: { backgroundColor: 'rgba(34,197,94,0.1)', borderColor: 'rgba(34,197,94,0.3)' },
    statusPending: { backgroundColor: 'rgba(251,191,36,0.1)', borderColor: 'rgba(251,191,36,0.3)' },
    statusPillText: { fontSize: 8, fontWeight: '900', letterSpacing: 1, textTransform: 'uppercase' },
    statusApprovedText: { color: '#4ade80' },
    statusPendingText: { color: '#fbbf24' },

    thesisTitle: { fontSize: 15, fontWeight: '900', color: Colors.foreground, textTransform: 'uppercase', lineHeight: 22, marginBottom: 6 },
    thesisAuthor: { fontSize: 10, fontWeight: 'bold', color: Colors.textSecondary, letterSpacing: 1, marginBottom: 8 },
    thesisAbstract: { fontSize: 11, color: Colors.textDim, lineHeight: 18, marginBottom: 16 },

    cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderTopWidth: 1, borderTopColor: Colors.border, paddingTop: 16 },
    docIcon: { width: 32, height: 32, borderRadius: 8, backgroundColor: 'rgba(255,255,255,0.04)', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: Colors.border },
    viewBtn: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    viewBtnText: { fontSize: 10, fontWeight: '900', color: Colors.primary, letterSpacing: 1, textTransform: 'uppercase' },

    actionRow: { flexDirection: 'row', gap: 8 },
    rejectBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(239, 68, 68, 0.1)', paddingVertical: 8, paddingHorizontal: 12, borderRadius: 10, borderWidth: 1, borderColor: 'rgba(239, 68, 68, 0.2)' },
    rejectBtnText: { color: '#ef4444', fontSize: 9, fontWeight: '900', letterSpacing: 1, textTransform: 'uppercase' },
    approveBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: Colors.primary, paddingVertical: 8, paddingHorizontal: 12, borderRadius: 10 },
    approveBtnText: { color: '#fff', fontSize: 9, fontWeight: '900', letterSpacing: 1, textTransform: 'uppercase' },

    emptyCard: {
        backgroundColor: Colors.card, borderRadius: 28, padding: 40, alignItems: 'center',
        borderWidth: 1, borderColor: Colors.border,
    },
    emptyIconBox: { width: 64, height: 64, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.04)', alignItems: 'center', justifyContent: 'center', marginBottom: 16, borderWidth: 1, borderColor: Colors.border },
    emptyTitle: { fontSize: 15, fontWeight: '900', color: Colors.foreground, textTransform: 'uppercase', marginBottom: 4 },
    emptyDesc: { fontSize: 12, color: Colors.textSecondary, textAlign: 'center' },
});

export default Approvals;
