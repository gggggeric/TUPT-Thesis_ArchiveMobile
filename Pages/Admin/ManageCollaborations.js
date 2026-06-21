import React, { useState, useEffect } from 'react';
import {
    View, Text, StyleSheet, ScrollView, TouchableOpacity,
    TextInput, Platform, ActivityIndicator, RefreshControl, Alert, Dimensions
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useIsFocused } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import CustomHeader from '../Navigation/CustomHeader';
import GridMenu from '../Navigation/GridMenu';
import API_BASE_URL from '../../api';
import Colors from '../../utils/Colors';

const { width } = Dimensions.get('window');

const ManageCollaborations = () => {
    const navigation = useNavigation();
    const isFocused = useIsFocused();

    const [isMenuVisible, setIsMenuVisible] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('all'); // 'all' | 'accepted' | 'pending' | 'declined'

    const [collaborations, setCollaborations] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    useEffect(() => {
        if (isFocused) {
            fetchCollaborations();
        }
    }, [isFocused, statusFilter, searchQuery]);

    const fetchCollaborations = async () => {
        setIsLoading(true);
        try {
            const token = await AsyncStorage.getItem('userToken');
            if (!token) {
                setIsLoading(false);
                return;
            }

            const res = await fetch(`${API_BASE_URL}/admin/collaborations`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (res.ok) {
                const data = await res.json();
                let list = data.data || [];

                // Filter by status locally
                if (statusFilter !== 'all') {
                    list = list.filter(c => c.status === statusFilter);
                }

                // Filter by search query locally
                if (searchQuery.trim()) {
                    const query = searchQuery.trim().toLowerCase();
                    list = list.filter(c => 
                        (c.alumni?.name || '').toLowerCase().includes(query) ||
                        (c.undergrad?.name || '').toLowerCase().includes(query) ||
                        (c.thesis?.title || '').toLowerCase().includes(query)
                    );
                }

                setCollaborations(list);
            }
        } catch (err) {
            console.error('Error fetching admin collaborations:', err);
            Alert.alert('Error', 'Failed to fetch collaboration requests');
        } finally {
            setIsLoading(false);
            setRefreshing(false);
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'accepted': return '#10b981';
            case 'declined': return '#ef4444';
            default: return '#fbbf24';
        }
    };

    const getStatusIcon = (status) => {
        switch (status) {
            case 'accepted': return 'checkmark-circle';
            case 'declined': return 'close-circle';
            default: return 'time';
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
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchCollaborations(); }} tintColor={Colors.primary} />}
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
                            <Text style={styles.headerTag}>RESEARCH EXCHANGE</Text>
                            <Text style={styles.headerTitle}>Joint Collaborations</Text>
                        </View>
                    </View>
                </View>

                {/* Search Bar */}
                <View style={styles.searchBarWrapper}>
                    <Ionicons name="search" size={18} color="rgba(255,255,255,0.4)" style={{ marginRight: 10 }} />
                    <TextInput 
                        style={styles.searchInput}
                        placeholder="Search by alumni, student, title..."
                        placeholderTextColor="rgba(255,255,255,0.3)"
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                    />
                </View>

                {/* Status Tabs Filter */}
                <View style={styles.filtersRow}>
                    {['all', 'accepted', 'pending', 'declined'].map((status) => (
                        <TouchableOpacity
                            key={status}
                            style={[styles.filterTab, statusFilter === status && styles.filterTabActive]}
                            onPress={() => setStatusFilter(status)}
                        >
                            <Text style={[styles.filterTabText, statusFilter === status && styles.filterTabTextActive]}>
                                {status.toUpperCase()}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>

                {isLoading ? (
                    <View style={styles.loadingBox}>
                        <ActivityIndicator size="large" color={Colors.primary} />
                    </View>
                ) : collaborations.length > 0 ? (
                    collaborations.map((collab) => {
                        const statusColor = getStatusColor(collab.status);
                        return (
                            <View key={collab._id} style={styles.collabCard}>
                                <View style={styles.cardHeader}>
                                    <View style={[styles.statusBadge, { borderColor: `${statusColor}40`, backgroundColor: `${statusColor}15` }]}>
                                        <Ionicons name={getStatusIcon(collab.status)} size={10} color={statusColor} />
                                        <Text style={[styles.statusText, { color: statusColor }]}>{collab.status.toUpperCase()}</Text>
                                    </View>
                                    <Text style={styles.dateText}>
                                        {new Date(collab.createdAt).toLocaleDateString()}
                                    </Text>
                                </View>

                                {/* Alumni -> Undergrad Users */}
                                <View style={styles.usersBox}>
                                    <View style={styles.userRow}>
                                        <View style={[styles.userDot, { backgroundColor: '#10b981' }]} />
                                        <Text style={styles.userLabel}>Alumni: </Text>
                                        <Text style={styles.userName} numberOfLines={1}>{collab.alumni?.name || 'Unknown'}</Text>
                                    </View>
                                    <View style={styles.userRow}>
                                        <View style={[styles.userDot, { backgroundColor: '#3b82f6' }]} />
                                        <Text style={styles.userLabel}>Student: </Text>
                                        <Text style={styles.userName} numberOfLines={1}>{collab.undergrad?.name || 'Unknown'}</Text>
                                    </View>
                                </View>

                                {/* Thesis Title */}
                                <View style={styles.thesisBox}>
                                    <Text style={styles.thesisLabel}>THESIS TARGET</Text>
                                    <Text style={styles.thesisTitle} numberOfLines={2}>{collab.thesis?.title || 'Untitled Thesis'}</Text>
                                </View>
                            </View>
                        );
                    })
                ) : (
                    <View style={styles.emptyCard}>
                        <Ionicons name="git-pull-request" size={32} color={Colors.textDim} />
                        <Text style={styles.emptyTitle}>No collaboration requests</Text>
                        <Text style={styles.emptyDesc}>Try adjusting your search query or status filter.</Text>
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

    // Filter Tabs
    filtersRow: { flexDirection: 'row', gap: 6, marginBottom: 24 },
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
    filterTabText: { fontSize: 9, fontWeight: '900', color: Colors.textSecondary, letterSpacing: 0.5 },
    filterTabTextActive: { color: Colors.background, fontWeight: '900' },

    loadingBox: { paddingVertical: 60, alignItems: 'center' },

    // Collab Cards
    collabCard: {
        backgroundColor: Colors.card, 
        borderRadius: 24, 
        padding: 20, 
        marginBottom: 16,
        borderWidth: 1, 
        borderColor: Colors.border,
    },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
    statusBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
        borderWidth: 1,
    },
    statusText: { fontSize: 8, fontWeight: '900', letterSpacing: 1 },
    dateText: { fontSize: 11, color: Colors.textDim, fontWeight: '500' },

    usersBox: { gap: 8, marginBottom: 16, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.03)', paddingBottom: 16 },
    userRow: { flexDirection: 'row', alignItems: 'center' },
    userDot: { width: 6, height: 6, borderRadius: 3, marginRight: 8 },
    userLabel: { fontSize: 11, color: Colors.textDim, fontWeight: 'bold' },
    userName: { fontSize: 13, color: '#fff', fontWeight: 'bold', flex: 1 },

    thesisBox: {},
    thesisLabel: { fontSize: 8, fontWeight: '900', color: Colors.textDim, letterSpacing: 1.5, marginBottom: 4 },
    thesisTitle: { fontSize: 13, fontWeight: 'bold', color: Colors.foreground, lineHeight: 18 },

    // Empty state
    emptyCard: { backgroundColor: Colors.card, borderRadius: 24, padding: 40, alignItems: 'center', borderWidth: 1, borderColor: Colors.border },
    emptyTitle: { fontSize: 15, fontWeight: '900', color: Colors.foreground, textTransform: 'uppercase', marginTop: 12, marginBottom: 4 },
    emptyDesc: { fontSize: 12, color: Colors.textSecondary, textAlign: 'center' },
});

export default ManageCollaborations;
