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

const ManageUsers = () => {
    const navigation = useNavigation();
    const isFocused = useIsFocused();

    const [isMenuVisible, setIsMenuVisible] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [roleFilter, setRoleFilter] = useState('all'); // 'all' | 'students' | 'alumni' | 'professors' | 'admins'

    const [users, setUsers] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    useEffect(() => {
        if (isFocused) {
            fetchUsers();
        }
    }, [isFocused, roleFilter, searchQuery]);

    const fetchUsers = async () => {
        setIsLoading(true);
        try {
            const token = await AsyncStorage.getItem('userToken');
            if (!token) {
                setIsLoading(false);
                return;
            }

            const params = [];
            if (searchQuery.trim()) params.push(`search=${encodeURIComponent(searchQuery.trim())}`);
            params.push('limit=100'); // Grab a large batch for smooth scroll

            const res = await fetch(`${API_BASE_URL}/admin/users?${params.join('&')}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (res.ok) {
                const data = await res.json();
                let list = data.data || [];

                // Perform role filtering locally since the backend paginates all roles together
                if (roleFilter !== 'all') {
                    list = list.filter(u => {
                        if (roleFilter === 'admins') return u.isAdmin;
                        if (roleFilter === 'professors') return u.isProfessor;
                        if (roleFilter === 'alumni') return u.isGraduate;
                        // Students: none of the above are true
                        return !u.isAdmin && !u.isProfessor && !u.isGraduate;
                    });
                }
                setUsers(list);
            }
        } catch (err) {
            console.error('Error fetching admin users:', err);
            Alert.alert('Error', 'Failed to fetch registered users');
        } finally {
            setIsLoading(false);
            setRefreshing(false);
        }
    };

    const getRoleBadge = (user) => {
        if (user.isAdmin) return { label: 'Admin', color: '#ef4444', bg: 'rgba(239,68,68,0.1)' };
        if (user.isProfessor) return { label: 'Faculty', color: '#a855f7', bg: 'rgba(168,85,247,0.1)' };
        if (user.isGraduate) return { label: 'Alumni', color: '#10b981', bg: 'rgba(16,185,129,0.1)' };
        return { label: 'Student', color: '#3b82f6', bg: 'rgba(59,130,246,0.1)' };
    };

    const getRoleIcon = (user) => {
        if (user.isAdmin) return 'shield-checkmark';
        if (user.isProfessor) return 'school';
        if (user.isGraduate) return 'ribbon';
        return 'person';
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
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchUsers(); }} tintColor={Colors.primary} />}
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
                            <Text style={styles.headerTag}>SYSTEM USERS</Text>
                            <Text style={styles.headerTitle}>Registered Accounts</Text>
                        </View>
                    </View>
                </View>

                {/* Search Bar */}
                <View style={styles.searchBarWrapper}>
                    <Ionicons name="search" size={18} color="rgba(255,255,255,0.4)" style={{ marginRight: 10 }} />
                    <TextInput 
                        style={styles.searchInput}
                        placeholder="Search by name, ID number..."
                        placeholderTextColor="rgba(255,255,255,0.3)"
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                    />
                </View>

                {/* Role Tabs Filter */}
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filtersScroll}>
                    <View style={styles.filtersRow}>
                        {['all', 'students', 'alumni', 'professors', 'admins'].map((role) => (
                            <TouchableOpacity
                                key={role}
                                style={[styles.filterTab, roleFilter === role && styles.filterTabActive]}
                                onPress={() => setRoleFilter(role)}
                            >
                                <Text style={[styles.filterTabText, roleFilter === role && styles.filterTabTextActive]}>
                                    {role.toUpperCase()}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </ScrollView>

                {isLoading ? (
                    <View style={styles.loadingBox}>
                        <ActivityIndicator size="large" color={Colors.primary} />
                    </View>
                ) : users.length > 0 ? (
                    users.map((user) => {
                        const badge = getRoleBadge(user);
                        return (
                            <View key={user._id} style={styles.userCard}>
                                <View style={styles.cardLeft}>
                                    <View style={[styles.avatarBox, { backgroundColor: badge.bg, borderColor: `${badge.color}30` }]}>
                                        <Ionicons name={getRoleIcon(user)} size={20} color={badge.color} />
                                    </View>
                                    <View style={styles.userInfo}>
                                        <Text style={styles.userName} numberOfLines={1}>{user.name}</Text>
                                        <Text style={styles.userId}>ID: {user.idNumber}</Text>
                                        {user.birthdate && (
                                            <Text style={styles.userSub}>Born: {new Date(user.birthdate).toLocaleDateString()}</Text>
                                        )}
                                    </View>
                                </View>

                                <View style={[styles.roleBadge, { backgroundColor: badge.bg, borderColor: `${badge.color}40` }]}>
                                    <Text style={[styles.roleText, { color: badge.color }]}>{badge.label}</Text>
                                </View>
                            </View>
                        );
                    })
                ) : (
                    <View style={styles.emptyCard}>
                        <Ionicons name="people-outline" size={32} color={Colors.textDim} />
                        <Text style={styles.emptyTitle}>No matching users</Text>
                        <Text style={styles.emptyDesc}>Try adjusting your search query or role filter.</Text>
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

    // Filters Horizontal Scroll
    filtersScroll: { marginBottom: 24 },
    filtersRow: { flexDirection: 'row', gap: 8, paddingRight: 20 },
    filterTab: { 
        paddingHorizontal: 16,
        paddingVertical: 10, 
        borderRadius: 12, 
        backgroundColor: 'rgba(255,255,255,0.03)', 
        borderWidth: 1, 
        borderColor: Colors.border, 
        alignItems: 'center',
        minWidth: 80
    },
    filterTabActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
    filterTabText: { fontSize: 10, fontWeight: '900', color: Colors.textSecondary, letterSpacing: 1 },
    filterTabTextActive: { color: Colors.background, fontWeight: '900' },

    loadingBox: { paddingVertical: 60, alignItems: 'center' },

    // User Cards
    userCard: {
        backgroundColor: Colors.card, 
        borderRadius: 24, 
        padding: 16, 
        marginBottom: 12,
        borderWidth: 1, 
        borderColor: Colors.border,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between'
    },
    cardLeft: { flexDirection: 'row', alignItems: 'center', flex: 1, marginRight: 12 },
    avatarBox: { 
        width: 44, 
        height: 44, 
        borderRadius: 14, 
        borderWidth: 1, 
        alignItems: 'center', 
        justifyContent: 'center',
        marginRight: 12
    },
    userInfo: { flex: 1 },
    userName: { fontSize: 14, fontWeight: 'bold', color: '#fff', marginBottom: 2 },
    userId: { fontSize: 11, color: Colors.textSecondary, fontWeight: '500' },
    userSub: { fontSize: 10, color: Colors.textDim, marginTop: 2 },

    roleBadge: { 
        paddingHorizontal: 10, 
        paddingVertical: 6, 
        borderRadius: 8, 
        borderWidth: 1 
    },
    roleText: { fontSize: 9, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 0.5 },

    // Empty state
    emptyCard: { backgroundColor: Colors.card, borderRadius: 24, padding: 40, alignItems: 'center', borderWidth: 1, borderColor: Colors.border },
    emptyTitle: { fontSize: 15, fontWeight: '900', color: Colors.foreground, textTransform: 'uppercase', marginTop: 12, marginBottom: 4 },
    emptyDesc: { fontSize: 12, color: Colors.textSecondary, textAlign: 'center' },
});

export default ManageUsers;
