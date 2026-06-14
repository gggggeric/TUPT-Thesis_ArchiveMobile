import React, { useState, useEffect } from 'react';
import {
    View, Text, StyleSheet, ScrollView, TouchableOpacity,
    Platform, ActivityIndicator, Alert, Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useIsFocused } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import CustomHeader from '../Navigation/CustomHeader';
import GridMenu from '../Navigation/GridMenu';
import BottomNavBar from '../Navigation/BottomNavBar';
import API_BASE_URL from '../../api';
import Colors from '../../utils/Colors';
import { useToast } from '../../utils/ToastContext';

const CollaborationScreen = () => {
    const navigation = useNavigation();
    const isFocused = useIsFocused();
    const toast = useToast();
    const [isMenuVisible, setIsMenuVisible] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [currentUser, setCurrentUser] = useState(null);
    const [incomingRequests, setIncomingRequests] = useState([]);
    const [myRequests, setMyRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const fadeAnim = React.useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }).start();
        loadUser();
    }, []);

    const loadUser = async () => {
        try {
            const userData = await AsyncStorage.getItem('userData');
            if (userData) {
                const user = JSON.parse(userData);
                setCurrentUser(user);
                fetchData(user);
            }
        } catch (err) {
            console.error(err);
        }
    };

    const fetchData = async (user) => {
        setLoading(true);
        try {
            const token = await AsyncStorage.getItem('userToken');
            const headers = { 'Authorization': `Bearer ${token}` };

            if (user.isGraduate) {
                const res = await fetch(`${API_BASE_URL}/collaboration/my-requests`, { headers });
                const data = await res.json();
                if (res.ok) setMyRequests(data.data || []);
            } else {
                const res = await fetch(`${API_BASE_URL}/collaboration/incoming`, { headers });
                const data = await res.json();
                if (res.ok) setIncomingRequests(data.data || []);
            }
        } catch (err) {
            console.error(err);
            toast.show('Failed to fetch collaboration data', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateStatus = async (requestId, status) => {
        Alert.alert(
            `${status === 'accepted' ? 'Accept' : 'Decline'} Request`,
            `Are you sure you want to ${status === 'accepted' ? 'accept' : 'decline'} this collaboration request?`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: status === 'accepted' ? 'Accept' : 'Decline',
                    style: status === 'accepted' ? 'default' : 'destructive',
                    onPress: async () => {
                        try {
                            const token = await AsyncStorage.getItem('userToken');
                            const res = await fetch(`${API_BASE_URL}/collaboration/${requestId}`, {
                                method: 'PATCH',
                                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                                body: JSON.stringify({ status })
                            });
                            if (res.ok) {
                                toast.show(`Request ${status} successfully`, 'success');
                                setIncomingRequests(prev =>
                                    prev.map(req => req._id === requestId ? { ...req, status } : req)
                                );
                            } else {
                                const data = await res.json();
                                toast.show(data.message || 'Failed to update request', 'error');
                            }
                        } catch (err) {
                            toast.show('An error occurred', 'error');
                        }
                    }
                }
            ]
        );
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'accepted': return Colors.primary;
            case 'declined': return '#f87171';
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

    const handleSearch = () => {
        if (searchQuery.trim()) {
            navigation.navigate('SearchResult', { query: searchQuery.trim() });
            setSearchQuery('');
        }
    };

    const renderIncomingCard = (req, index) => (
        <View key={req._id} style={styles.card}>
            {/* Alumni Info */}
            <View style={styles.cardUserRow}>
                <View style={styles.avatarBox}>
                    <Ionicons name="person" size={22} color={Colors.textDim} />
                </View>
                <View style={{ flex: 1 }}>
                    <Text style={styles.cardUserName} numberOfLines={1}>{req.alumni?.name || 'Unknown'}</Text>
                    <Text style={styles.cardUserRole}>GRADUATE STUDENT</Text>
                </View>
                <View style={[styles.statusBadge, { borderColor: `${getStatusColor(req.status)}40`, backgroundColor: `${getStatusColor(req.status)}15` }]}>
                    <Ionicons name={getStatusIcon(req.status)} size={10} color={getStatusColor(req.status)} />
                    <Text style={[styles.statusText, { color: getStatusColor(req.status) }]}>{req.status.toUpperCase()}</Text>
                </View>
            </View>

            {/* Thesis */}
            <View style={styles.thesisBox}>
                <View style={styles.thesisLabelRow}>
                    <Ionicons name="book-outline" size={10} color={Colors.textDim} />
                    <Text style={styles.thesisLabel}>THESIS TITLE</Text>
                </View>
                <Text style={styles.thesisTitle} numberOfLines={2}>{req.thesis?.title || 'No title'}</Text>
            </View>

            {/* Message */}
            <View style={styles.messageBox}>
                <View style={styles.thesisLabelRow}>
                    <Ionicons name="mail-open-outline" size={10} color={Colors.primary} />
                    <Text style={[styles.thesisLabel, { color: Colors.primary }]}>MESSAGE</Text>
                </View>
                <Text style={styles.messageText}>"{req.message}"</Text>
            </View>

            {/* Actions */}
            {req.status === 'pending' && (
                <View style={styles.actionRow}>
                    <TouchableOpacity
                        style={styles.declineBtn}
                        onPress={() => handleUpdateStatus(req._id, 'declined')}
                        activeOpacity={0.8}
                    >
                        <Text style={styles.declineBtnText}>DECLINE</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={styles.acceptBtn}
                        onPress={() => handleUpdateStatus(req._id, 'accepted')}
                        activeOpacity={0.85}
                    >
                        <Text style={styles.acceptBtnText}>ACCEPT</Text>
                    </TouchableOpacity>
                </View>
            )}
        </View>
    );

    const renderMyRequestCard = (req) => (
        <View key={req._id} style={styles.card}>
            {/* Status + ID */}
            <View style={styles.cardHeaderRow}>
                <View style={[styles.statusBadge, { borderColor: `${getStatusColor(req.status)}40`, backgroundColor: `${getStatusColor(req.status)}15` }]}>
                    <Ionicons name={getStatusIcon(req.status)} size={10} color={getStatusColor(req.status)} />
                    <Text style={[styles.statusText, { color: getStatusColor(req.status) }]}>{req.status.toUpperCase()}</Text>
                </View>
                <Text style={styles.proposalId}>ID: {req._id?.slice(-6)}</Text>
            </View>

            {/* Sent to */}
            <View style={styles.cardUserRow}>
                <View style={styles.avatarBox}>
                    <Ionicons name="person" size={22} color={Colors.textDim} />
                </View>
                <View style={{ flex: 1 }}>
                    <Text style={styles.requestToLabel}>REQUEST TO</Text>
                    <Text style={styles.cardUserName} numberOfLines={1}>{req.undergrad?.name || 'Unknown'}</Text>
                </View>
            </View>

            {/* Thesis */}
            <View style={styles.thesisBox}>
                <Text style={[styles.thesisTitle, { color: Colors.primary }]} numberOfLines={2}>{req.thesis?.title || 'No title'}</Text>
            </View>

            {/* Message */}
            <View style={[styles.messageBox, { borderTopWidth: 1, borderTopColor: Colors.border, paddingTop: 16 }]}>
                <Text style={styles.thesisLabel}>SENT MESSAGE</Text>
                <Text style={styles.messageText}>"{req.message}"</Text>
            </View>
        </View>
    );

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
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                <Animated.View style={{ opacity: fadeAnim }}>
                    {/* Header */}
                    <View style={styles.pageHeader}>
                        <View style={styles.headerIconBox}>
                            <Ionicons name="people" size={24} color={Colors.primary} />
                        </View>
                        <View>
                            <Text style={styles.pageTitle}>COLLABORATION HUB</Text>
                            <Text style={styles.pageSubtitle}>Research Collaboration</Text>
                        </View>
                    </View>

                    {/* Section Title */}
                    <View style={styles.sectionTitleRow}>
                        <View style={styles.titleAccent} />
                        <Text style={styles.sectionTitle}>
                            {currentUser?.isGraduate ? 'MY REQUESTS' : 'INCOMING REQUESTS'}
                        </Text>
                        <View style={styles.countBadge}>
                            <Text style={styles.countText}>
                                {currentUser?.isGraduate ? myRequests.length : incomingRequests.length}
                            </Text>
                        </View>
                    </View>

                    {/* Content */}
                    {loading ? (
                        <View style={styles.emptyState}>
                            <ActivityIndicator size="large" color={Colors.primary} />
                            <Text style={styles.emptyText}>Loading requests...</Text>
                        </View>
                    ) : currentUser?.isGraduate ? (
                        myRequests.length > 0 ? (
                            myRequests.map((req) => renderMyRequestCard(req))
                        ) : (
                            <View style={styles.emptyState}>
                                <View style={styles.emptyIconBox}>
                                    <Ionicons name="people-outline" size={40} color={Colors.textDim} />
                                </View>
                                <Text style={styles.emptyText}>No collaboration requests sent yet.</Text>
                                <Text style={styles.emptySubText}>Find a thesis and send a collaboration request from its detail page.</Text>
                            </View>
                        )
                    ) : (
                        incomingRequests.length > 0 ? (
                            incomingRequests.map((req, idx) => renderIncomingCard(req, idx))
                        ) : (
                            <View style={styles.emptyState}>
                                <View style={styles.emptyIconBox}>
                                    <Ionicons name="mail-outline" size={40} color={Colors.textDim} />
                                </View>
                                <Text style={styles.emptyText}>No incoming requests found.</Text>
                                <Text style={styles.emptySubText}>When a graduate student requests to collaborate on your thesis, it will appear here.</Text>
                            </View>
                        )
                    )}
                </Animated.View>
            </ScrollView>

            {/* Bottom Nav Bar */}
            <BottomNavBar activeScreen="Collaboration" onGridPress={() => setIsMenuVisible(true)} />
        </LinearGradient>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },
    scrollView: { flex: 1 },
    scrollContent: { paddingHorizontal: 20, paddingTop: 30, paddingBottom: 110 },

    pageHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
        marginBottom: 32,
    },
    headerIconBox: {
        width: 52,
        height: 52,
        backgroundColor: `${Colors.primary}15`,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: `${Colors.primary}30`,
        alignItems: 'center',
        justifyContent: 'center',
    },
    pageTitle: {
        fontSize: 20,
        fontWeight: '900',
        color: Colors.foreground,
        letterSpacing: 1,
    },
    pageSubtitle: {
        fontSize: 9,
        fontWeight: '900',
        color: Colors.primary,
        letterSpacing: 3,
        textTransform: 'uppercase',
        marginTop: 2,
    },

    sectionTitleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        marginBottom: 20,
    },
    titleAccent: {
        width: 4,
        height: 18,
        backgroundColor: Colors.primary,
        borderRadius: 2,
    },
    sectionTitle: {
        fontSize: 11,
        fontWeight: '900',
        color: Colors.foreground,
        letterSpacing: 2,
    },
    countBadge: {
        backgroundColor: `${Colors.primary}20`,
        borderWidth: 1,
        borderColor: `${Colors.primary}30`,
        paddingHorizontal: 10,
        paddingVertical: 3,
        borderRadius: 8,
    },
    countText: {
        fontSize: 10,
        fontWeight: '900',
        color: Colors.primary,
    },

    card: {
        backgroundColor: Colors.card,
        borderRadius: 24,
        padding: 20,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: Colors.border,
        ...Platform.select({
            ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.25, shadowRadius: 12 },
            android: { elevation: 6 }
        }),
    },

    cardHeaderRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 16,
    },
    proposalId: {
        fontSize: 9,
        fontWeight: '900',
        color: Colors.textDim,
        letterSpacing: 1,
        textTransform: 'uppercase',
    },

    cardUserRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        marginBottom: 16,
    },
    avatarBox: {
        width: 44,
        height: 44,
        borderRadius: 12,
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderWidth: 1,
        borderColor: Colors.border,
        alignItems: 'center',
        justifyContent: 'center',
    },
    cardUserName: {
        fontSize: 14,
        fontWeight: 'bold',
        color: Colors.foreground,
    },
    cardUserRole: {
        fontSize: 9,
        fontWeight: '900',
        color: Colors.primary,
        letterSpacing: 2,
        marginTop: 2,
    },
    requestToLabel: {
        fontSize: 9,
        fontWeight: '900',
        color: Colors.textDim,
        letterSpacing: 2,
        textTransform: 'uppercase',
    },

    statusBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
        borderWidth: 1,
    },
    statusText: {
        fontSize: 8,
        fontWeight: '900',
        letterSpacing: 1,
    },

    thesisBox: {
        backgroundColor: 'rgba(255,255,255,0.03)',
        borderRadius: 14,
        padding: 14,
        borderWidth: 1,
        borderColor: Colors.border,
        marginBottom: 14,
    },
    thesisLabelRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
        marginBottom: 6,
    },
    thesisLabel: {
        fontSize: 9,
        fontWeight: '900',
        color: Colors.textDim,
        letterSpacing: 2,
        textTransform: 'uppercase',
    },
    thesisTitle: {
        fontSize: 12,
        fontWeight: 'bold',
        color: Colors.foreground,
        lineHeight: 18,
    },

    messageBox: {
        marginBottom: 16,
    },
    messageText: {
        fontSize: 12,
        color: Colors.textSecondary,
        fontStyle: 'italic',
        lineHeight: 18,
        marginTop: 6,
        borderLeftWidth: 2,
        borderLeftColor: `${Colors.primary}40`,
        paddingLeft: 10,
    },

    actionRow: {
        flexDirection: 'row',
        gap: 10,
    },
    declineBtn: {
        flex: 1,
        paddingVertical: 12,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: Colors.border,
        alignItems: 'center',
    },
    declineBtnText: {
        fontSize: 10,
        fontWeight: '900',
        color: Colors.textSecondary,
        letterSpacing: 2,
    },
    acceptBtn: {
        flex: 1,
        paddingVertical: 12,
        borderRadius: 12,
        backgroundColor: Colors.primary,
        alignItems: 'center',
    },
    acceptBtnText: {
        fontSize: 10,
        fontWeight: '900',
        color: Colors.background,
        letterSpacing: 2,
    },

    emptyState: {
        alignItems: 'center',
        paddingVertical: 60,
    },
    emptyIconBox: {
        width: 80,
        height: 80,
        borderRadius: 24,
        backgroundColor: Colors.card,
        borderWidth: 1,
        borderColor: Colors.border,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 20,
    },
    emptyText: {
        fontSize: 14,
        fontWeight: 'bold',
        color: Colors.textSecondary,
        marginBottom: 8,
        textAlign: 'center',
    },
    emptySubText: {
        fontSize: 12,
        color: Colors.textDim,
        textAlign: 'center',
        lineHeight: 18,
        paddingHorizontal: 20,
    },
});

export default CollaborationScreen;
