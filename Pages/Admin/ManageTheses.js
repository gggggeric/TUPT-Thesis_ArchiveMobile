import React, { useState, useEffect } from 'react';
import {
    View, Text, StyleSheet, ScrollView, TouchableOpacity,
    TextInput, Platform, ActivityIndicator, RefreshControl, Alert, Modal, Dimensions
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, useIsFocused } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import CustomHeader from '../Navigation/CustomHeader';
import GridMenu from '../Navigation/GridMenu';
import API_BASE_URL from '../../api';
import Colors from '../../utils/Colors';

const { width } = Dimensions.get('window');

const ManageTheses = () => {
    const navigation = useNavigation();
    const route = useRoute();
    const isFocused = useIsFocused();
    
    // Initial parameter mapping (e.g. from clicking stats card)
    const initialStatus = route.params?.status || 'all';

    const [isMenuVisible, setIsMenuVisible] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterStatus, setFilterStatus] = useState(initialStatus); // 'all' | 'approved' | 'pending'

    const [theses, setTheses] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [selectedThesis, setSelectedThesis] = useState(null);

    useEffect(() => {
        if (isFocused) {
            fetchTheses();
        }
    }, [isFocused, filterStatus, searchQuery]);

    const fetchTheses = async () => {
        setIsLoading(true);
        try {
            const token = await AsyncStorage.getItem('userToken');
            if (!token) {
                setIsLoading(false);
                return;
            }

            const params = [];
            if (searchQuery.trim()) params.push(`search=${encodeURIComponent(searchQuery.trim())}`);
            if (filterStatus && filterStatus !== 'all') params.push(`status=${filterStatus}`);
            params.push('limit=50'); // Pull top 50 for quick scroll

            const res = await fetch(`${API_BASE_URL}/admin/theses?${params.join('&')}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setTheses(data.data || []);
            }
        } catch (err) {
            console.error('Error fetching admin theses:', err);
            Alert.alert('Error', 'Failed to fetch cataloged theses');
        } finally {
            setIsLoading(false);
            setRefreshing(false);
        }
    };

    return (
        <LinearGradient colors={[Colors.background, Colors.surface, Colors.background]} style={styles.container}>
            <CustomHeader
                showSearch={false}
                onMenuPress={() => setIsMenuVisible(true)}
            />
            {/* Grid Menu */}
            {isFocused && (
                <GridMenu isVisible={isMenuVisible} onClose={() => setIsMenuVisible(false)} navigation={navigation} />
            )}

            <ScrollView 
                style={styles.scroll} 
                contentContainerStyle={styles.scrollContent} 
                showsVerticalScrollIndicator={false}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchTheses(); }} tintColor={Colors.primary} />}
            >
                {/* Back Button */}
                <TouchableOpacity style={styles.backRow} onPress={() => navigation.navigate('AdminDashboard')}>
                    <Ionicons name="arrow-back" size={16} color={Colors.primary} />
                    <Text style={styles.backText}>Back to Dashboard</Text>
                </TouchableOpacity>

                {/* Header */}
                <View style={styles.headerRow}>
                    <View style={styles.headerLeft}>
                        <View style={styles.headerBar} />
                        <View>
                            <Text style={styles.headerTag}>DATABASE REPOSITORY</Text>
                            <Text style={styles.headerTitle}>Archived Theses</Text>
                        </View>
                    </View>
                </View>

                {/* Search Bar */}
                <View style={styles.searchBarWrapper}>
                    <Ionicons name="search" size={18} color="rgba(255,255,255,0.4)" style={{ marginRight: 10 }} />
                    <TextInput 
                        style={styles.searchInput}
                        placeholder="Search by title, author..."
                        placeholderTextColor="rgba(255,255,255,0.3)"
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                    />
                </View>

                {/* Filters Row */}
                <View style={styles.filtersRow}>
                    {['all', 'approved', 'pending'].map((status) => (
                        <TouchableOpacity
                            key={status}
                            style={[styles.filterTab, filterStatus === status && styles.filterTabActive]}
                            onPress={() => setFilterStatus(status)}
                        >
                            <Text style={[styles.filterTabText, filterStatus === status && styles.filterTabTextActive]}>
                                {status.toUpperCase()}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>

                {isLoading ? (
                    <View style={styles.loadingBox}>
                        <ActivityIndicator size="large" color={Colors.primary} />
                    </View>
                ) : theses.length > 0 ? (
                    theses.map((thesis) => (
                        <TouchableOpacity 
                            key={thesis._id} 
                            style={styles.thesisCard}
                            onPress={() => setSelectedThesis(thesis)}
                            activeOpacity={0.8}
                        >
                            <View style={styles.cardHeader}>
                                <Text style={styles.courseText}>{thesis.course || 'General'}</Text>
                                <View style={[styles.statusPill, thesis.isApproved ? styles.statusApproved : styles.statusPending]}>
                                    <Text style={[styles.statusPillText, thesis.isApproved ? styles.statusApprovedText : styles.statusPendingText]}>
                                        {thesis.isApproved ? 'Approved' : 'Pending'}
                                    </Text>
                                </View>
                            </View>

                            <Text style={styles.thesisTitle} numberOfLines={2}>{thesis.title}</Text>
                            <Text style={styles.thesisMeta}>Author: {thesis.author}</Text>
                            <Text style={styles.thesisMeta}>Year: {thesis.year_range || 'N/A'}</Text>
                        </TouchableOpacity>
                    ))
                ) : (
                    <View style={styles.emptyCard}>
                        <Ionicons name="folder-open" size={32} color={Colors.textDim} />
                        <Text style={styles.emptyTitle}>No matching theses</Text>
                        <Text style={styles.emptyDesc}>Try adjusting your search query or filters.</Text>
                    </View>
                )}
            </ScrollView>

            {/* Details Modal */}
            <Modal
                visible={!!selectedThesis}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setSelectedThesis(null)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContainer}>
                        {/* Modal Header */}
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalHeaderTag}>RESEARCH OVERVIEW</Text>
                            <TouchableOpacity onPress={() => setSelectedThesis(null)} style={styles.modalCloseBtn}>
                                <Ionicons name="close" size={24} color="#fff" />
                            </TouchableOpacity>
                        </View>

                        <ScrollView style={styles.modalScroll} contentContainerStyle={{ paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
                            {selectedThesis && (
                                <>
                                    <Text style={styles.modalTitle}>{selectedThesis.title}</Text>
                                    
                                    <View style={styles.divider} />
                                    
                                    {/* Stats grid */}
                                    <View style={styles.metaGrid}>
                                        <View style={styles.metaCell}>
                                            <Text style={styles.metaCellLabel}>AUTHOR</Text>
                                            <Text style={styles.metaCellValue}>{selectedThesis.author}</Text>
                                        </View>
                                        <View style={styles.metaCell}>
                                            <Text style={styles.metaCellLabel}>YEAR</Text>
                                            <Text style={styles.metaCellValue}>{selectedThesis.year_range || 'N/A'}</Text>
                                        </View>
                                        <View style={styles.metaCell}>
                                            <Text style={styles.metaCellLabel}>COURSE</Text>
                                            <Text style={styles.metaCellValue}>{selectedThesis.course || 'General'}</Text>
                                        </View>
                                        <View style={styles.metaCell}>
                                            <Text style={styles.metaCellLabel}>STATUS</Text>
                                            <Text style={[styles.metaCellValue, { color: selectedThesis.isApproved ? '#4ade80' : '#fbbf24' }]}>
                                                {selectedThesis.isApproved ? 'Approved' : 'Pending'}
                                            </Text>
                                        </View>
                                    </View>

                                    <View style={styles.divider} />

                                    {/* Abstract */}
                                    <Text style={styles.abstractLabel}>ABSTRACT</Text>
                                    <Text style={styles.abstractText}>{selectedThesis.abstract}</Text>
                                </>
                            )}
                        </ScrollView>
                    </View>
                </View>
            </Modal>
        </LinearGradient>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },
    scroll: { flex: 1 },
    scrollContent: { paddingTop: 20, paddingBottom: 60, paddingHorizontal: 20 },
    backRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 20 },
    backText: { color: Colors.primary, fontSize: 10, fontWeight: '900', letterSpacing: 2, textTransform: 'uppercase' },

    headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 },
    headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    headerBar: { width: 4, height: 40, borderRadius: 2, backgroundColor: Colors.primary },
    headerTag: { fontSize: 10, fontWeight: '900', color: Colors.textSecondary, letterSpacing: 2 },
    headerTitle: { fontSize: 22, fontWeight: '900', color: Colors.foreground, textTransform: 'uppercase' },

    // Search Bar
    searchBarWrapper: { 
        flexDirection: 'row', 
        alignItems: 'center', 
        backgroundColor: 'rgba(255,255,255,0.03)', 
        borderWidth: 1, 
        borderColor: Colors.border, 
        borderRadius: 16, 
        paddingHorizontal: 16, 
        height: 52, 
        marginBottom: 16 
    },
    searchInput: { flex: 1, color: '#fff', fontSize: 14, fontWeight: '500' },

    // Filter Row
    filtersRow: { flexDirection: 'row', gap: 8, marginBottom: 24 },
    filterTab: { 
        flex: 1, 
        paddingVertical: 10, 
        borderRadius: 12, 
        backgroundColor: 'rgba(255,255,255,0.03)', 
        borderWidth: 1, 
        borderColor: Colors.border, 
        alignItems: 'center' 
    },
    filterTabActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
    filterTabText: { fontSize: 10, fontWeight: '900', color: Colors.textSecondary, letterSpacing: 1 },
    filterTabTextActive: { color: Colors.background, fontWeight: '900' },

    loadingBox: { paddingVertical: 60, alignItems: 'center' },

    // Cards
    thesisCard: {
        backgroundColor: Colors.card, borderRadius: 24, padding: 20, marginBottom: 16,
        borderWidth: 1, borderColor: Colors.border,
    },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
    courseText: { fontSize: 10, fontWeight: '900', color: Colors.primary, letterSpacing: 1 },
    statusPill: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, borderWidth: 1 },
    statusApproved: { backgroundColor: 'rgba(34,197,94,0.1)', borderColor: 'rgba(34,197,94,0.3)' },
    statusPending: { backgroundColor: 'rgba(251,191,36,0.1)', borderColor: 'rgba(251,191,36,0.3)' },
    statusPillText: { fontSize: 8, fontWeight: '900', letterSpacing: 1, textTransform: 'uppercase' },
    statusApprovedText: { color: '#4ade80' },
    statusPendingText: { color: '#fbbf24' },
    thesisTitle: { fontSize: 15, fontWeight: '900', color: Colors.foreground, textTransform: 'uppercase', lineHeight: 22, marginBottom: 12 },
    thesisMeta: { fontSize: 11, color: Colors.textSecondary, fontWeight: '500', marginBottom: 4 },

    // Empty state
    emptyCard: { backgroundColor: Colors.card, borderRadius: 24, padding: 40, alignItems: 'center', borderWidth: 1, borderColor: Colors.border },
    emptyTitle: { fontSize: 15, fontWeight: '900', color: Colors.foreground, textTransform: 'uppercase', marginTop: 12, marginBottom: 4 },
    emptyDesc: { fontSize: 12, color: Colors.textSecondary, textAlign: 'center' },

    // Modals
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'flex-end' },
    modalContainer: { 
        backgroundColor: Colors.surface, 
        borderTopLeftRadius: 32, 
        borderTopRightRadius: 32, 
        borderWidth: 1, 
        borderColor: Colors.border, 
        maxHeight: '90%', 
        paddingHorizontal: 24, 
        paddingTop: 24 
    },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
    modalHeaderTag: { fontSize: 10, fontWeight: '900', color: Colors.primary, letterSpacing: 2 },
    modalCloseBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.08)', alignItems: 'center', justifyContent: 'center' },
    modalScroll: { flexGrow: 0 },
    modalTitle: { fontSize: 20, fontWeight: '900', color: '#fff', textTransform: 'uppercase', lineHeight: 28, marginBottom: 16 },
    divider: { height: 1, backgroundColor: 'rgba(255,255,255,0.05)', w: '100%', marginVertical: 16 },
    metaGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
    metaCell: { width: (width - 70) / 2 },
    metaCellLabel: { fontSize: 8, fontWeight: '900', color: Colors.textDim, letterSpacing: 1.5, marginBottom: 4 },
    metaCellValue: { fontSize: 12, fontWeight: 'bold', color: Colors.foreground },
    abstractLabel: { fontSize: 10, fontWeight: '900', color: '#fff', letterSpacing: 2, marginBottom: 8 },
    abstractText: { fontSize: 13, color: Colors.textSecondary, lineHeight: 22, textAlign: 'justify' }
});

export default ManageTheses;
