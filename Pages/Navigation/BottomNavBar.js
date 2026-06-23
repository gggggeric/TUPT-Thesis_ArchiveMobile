import React, { useState, useEffect } from 'react';
import { View, TouchableOpacity, StyleSheet, Dimensions, Platform, Modal, FlatList, Image, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Colors from '../../utils/Colors';
import API_BASE_URL from '../../api';

const { width } = Dimensions.get('window');

const BottomNavBar = ({ activeScreen, onGridPress }) => {
  const navigation = useNavigation();

  // Notification states
  const [currentUser, setCurrentUser] = useState(null);
  const [token, setToken] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);

  useEffect(() => {
    initNotifications();
  }, []);

  const initNotifications = async () => {
    try {
      const userToken = await AsyncStorage.getItem('userToken');
      const userData = await AsyncStorage.getItem('userData');
      if (userToken) {
        setToken(userToken);
        fetchNotifications(userToken);
      }
      if (userData) {
        setCurrentUser(JSON.parse(userData));
      }
    } catch (err) {
      console.log('Error initializing notifications:', err);
    }
  };

  // Poll for notifications
  useEffect(() => {
    if (!token) return;
    const interval = setInterval(() => {
      fetchNotifications(token);
    }, 10000);
    return () => clearInterval(interval);
  }, [token]);

  const fetchNotifications = async (userToken) => {
    const activeToken = userToken || token;
    if (!activeToken) return;
    try {
      const res = await fetch(`${API_BASE_URL}/notifications`, {
        headers: {
          'Authorization': `Bearer ${activeToken}`
        }
      });
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.data || []);
      }
    } catch (err) {
      console.log('Error fetching notifications:', err);
    }
  };

  const markAsRead = async (id) => {
    if (!token) return;
    try {
      const res = await fetch(`${API_BASE_URL}/notifications/${id}/read`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (res.ok) {
        setNotifications(prev => prev.map(n => n._id === id ? { ...n, isRead: true } : n));
      }
    } catch (err) {
      console.log('Error marking notification as read:', err);
    }
  };

  const markAllAsRead = async () => {
    if (!token) return;
    try {
      const res = await fetch(`${API_BASE_URL}/notifications/read-all`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (res.ok) {
        setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      }
    } catch (err) {
      console.log('Error marking all as read:', err);
    }
  };

  const deleteNotification = async (id) => {
    if (!token) return;
    try {
      const res = await fetch(`${API_BASE_URL}/notifications/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (res.ok) {
        setNotifications(prev => prev.filter(n => n._id !== id));
      }
    } catch (err) {
      console.log('Error deleting notification:', err);
    }
  };

  const clearAllNotifications = async () => {
    if (!token) return;
    try {
      const res = await fetch(`${API_BASE_URL}/notifications`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (res.ok) {
        setNotifications([]);
      }
    } catch (err) {
      console.log('Error clearing notifications:', err);
    }
  };

  const handleNotificationPress = async (notif) => {
    await markAsRead(notif._id);
    setShowNotifications(false);
    if (notif.link) {
      if (notif.link.includes('/collaboration')) {
        navigation.navigate('Collaboration');
      } else if (notif.link.includes('/documents/submissions')) {
        navigation.navigate('MySubmissions');
      } else if (notif.link.includes('/approvals')) {
        navigation.navigate('Approvals');
      }
    }
  };

  const formatTime = (dateStr) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHrs = Math.floor(diffMins / 60);
    if (diffHrs < 24) return `${diffHrs}h ago`;
    const diffDays = Math.floor(diffHrs / 24);
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  };

  const handleNavigation = (screenName) => {
    if (activeScreen === screenName) return;
    navigation.navigate(screenName);
  };

  const renderTab = (screenName, activeIcon, inactiveIcon) => {
    const isActive = activeScreen === screenName;
    return (
      <TouchableOpacity 
        style={styles.tabButton} 
        onPress={() => handleNavigation(screenName)}
        activeOpacity={0.7}
      >
        <Ionicons 
          name={isActive ? activeIcon : inactiveIcon} 
          size={24} 
          color={isActive ? Colors.primary : Colors.textSecondary} 
        />
        {isActive && <View style={styles.activeDot} />}
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.outerContainer}>
      <View style={styles.barContainer}>
        {currentUser?.isAdmin ? (
          renderTab('AdminDashboard', 'grid', 'grid-outline')
        ) : (
          <>
            {/* Tab 1: Home */}
            {renderTab('Home', 'home', 'home-outline')}

            {/* Tab 2: Collaboration or Approvals */}
            {currentUser?.isProfessor ? (
              renderTab('Approvals', 'checkmark-circle', 'checkmark-circle-outline')
            ) : (
              renderTab('Collaboration', 'chatbubble', 'chatbubble-outline')
            )}
          </>
        )}

        {/* Tab 3: Notifications */}
        {token ? (
          <TouchableOpacity 
            style={styles.tabButton} 
            onPress={() => setShowNotifications(true)}
            activeOpacity={0.7}
          >
            <Ionicons 
              name="notifications-outline" 
              size={24} 
              color={Colors.textSecondary} 
            />
            {notifications.filter(n => !n.isRead).length > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>
                  {notifications.filter(n => !n.isRead).length}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        ) : null}

        {/* Tab 4: Profile */}
        {renderTab('Profile', 'person', 'person-outline')}

        {/* Tab 5: Grid Menu Trigger */}
        <TouchableOpacity 
          style={styles.tabButton} 
          onPress={onGridPress}
          activeOpacity={0.7}
        >
          <Ionicons 
            name="apps-outline" 
            size={24} 
            color={Colors.textSecondary} 
          />
        </TouchableOpacity>
      </View>

      {/* Notifications Drawer Modal */}
      <Modal
        visible={showNotifications}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowNotifications(false)}
      >
        <TouchableOpacity 
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowNotifications(false)}
        >
          <View style={styles.modalContent} onStartShouldSetResponder={() => true}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Notifications</Text>
              <TouchableOpacity onPress={() => setShowNotifications(false)} style={styles.closeModalButton}>
                <Ionicons name="close" size={24} color="white" />
              </TouchableOpacity>
            </View>

            {/* Quick Actions Row */}
            {notifications.length > 0 && (
              <View style={styles.actionsRow}>
                {notifications.some(n => !n.isRead) && (
                  <TouchableOpacity onPress={markAllAsRead} style={styles.actionTextButton}>
                    <Ionicons name="checkmark-done" size={14} color={Colors.primary} style={{ marginRight: 2 }} />
                    <Text style={[styles.actionTextButtonText, { color: Colors.primary }]}>Read All</Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity onPress={clearAllNotifications} style={styles.actionTextButton}>
                  <Ionicons name="trash-outline" size={14} color="#f43f5e" style={{ marginRight: 2 }} />
                  <Text style={[styles.actionTextButtonText, { color: '#f43f5e' }]}>Clear All</Text>
                </TouchableOpacity>
              </View>
            )}

            <FlatList
              data={notifications}
              keyExtractor={(item) => item._id}
              contentContainerStyle={{ flexGrow: 1, paddingBottom: 24 }}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[styles.notifItem, !item.isRead && styles.unreadNotifItem]}
                  onPress={() => handleNotificationPress(item)}
                  activeOpacity={0.7}
                >
                  <View style={styles.notifLeft}>
                    <View style={[styles.avatarBox, !item.isRead && styles.unreadAvatarBox]}>
                      {item.sender?.profilePhoto ? (
                        <Image
                          source={{
                            uri: item.sender.profilePhoto.startsWith('http')
                              ? item.sender.profilePhoto
                              : `${API_BASE_URL}${item.sender.profilePhoto}`
                          }}
                          style={styles.notifAvatar}
                        />
                      ) : (
                        <Ionicons name="notifications" size={18} color={!item.isRead ? Colors.primary : Colors.textSecondary} />
                      )}
                    </View>
                    {!item.isRead && <View style={styles.unreadIndicator} />}
                  </View>

                  <View style={styles.notifCenter}>
                    <View style={styles.notifHeaderRow}>
                      <Text style={[styles.notifTitle, !item.isRead && styles.unreadNotifTitle]} numberOfLines={1}>
                        {item.title}
                      </Text>
                      <Text style={styles.notifTime}>{formatTime(item.createdAt)}</Text>
                    </View>
                    <Text style={styles.notifMessage} numberOfLines={2}>
                      {item.message}
                    </Text>
                  </View>

                  <TouchableOpacity
                    onPress={() => deleteNotification(item._id)}
                    style={styles.deleteNotifButton}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  >
                    <Ionicons name="trash-outline" size={16} color="#6b7280" />
                  </TouchableOpacity>
                </TouchableOpacity>
              )}
              ListEmptyComponent={() => (
                <View style={styles.emptyContainer}>
                  <View style={styles.emptyIconContainer}>
                    <Ionicons name="notifications-off-outline" size={48} color="#4b5563" />
                  </View>
                  <Text style={styles.emptyTitle}>No Notifications</Text>
                  <Text style={styles.emptySubtitle}>You're all caught up!</Text>
                </View>
              )}
            />
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  outerContainer: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 34 : 24,
    left: 0,
    right: 0,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
    paddingHorizontal: 20,
    zIndex: 999,
  },
  barContainer: {
    flexDirection: 'row',
    width: '100%',
    maxWidth: 500,
    height: 66,
    backgroundColor: Colors.surface,
    borderRadius: 33,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: 16,
    ...Platform.select({
      ios: {
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.3,
        shadowRadius: 10,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  tabButton: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    paddingBottom: 2,
  },
  activeDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.primary,
    position: 'absolute',
    bottom: 6,
  },
  badge: {
    position: 'absolute',
    top: 2,
    right: 2,
    backgroundColor: '#ef4444',
    borderRadius: 8,
    width: 16,
    height: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeText: {
    color: 'white',
    fontSize: 9,
    fontWeight: 'bold',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: Colors.card,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    borderWidth: 1,
    borderColor: Colors.border,
    height: '75%',
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: 'white',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  closeModalButton: {
    padding: 4,
  },
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 16,
    marginBottom: 16,
  },
  actionTextButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  actionTextButtonText: {
    fontSize: 12,
    fontWeight: '700',
  },
  notifItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: 16,
    marginBottom: 8,
    backgroundColor: 'rgba(255,255,255,0.02)',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  unreadNotifItem: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderColor: 'rgba(45, 212, 191, 0.1)',
  },
  notifLeft: {
    position: 'relative',
    marginRight: 12,
  },
  avatarBox: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.05)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    overflow: 'hidden',
  },
  unreadAvatarBox: {
    backgroundColor: 'rgba(45, 212, 191, 0.1)',
    borderColor: 'rgba(45, 212, 191, 0.2)',
  },
  notifAvatar: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  unreadIndicator: {
    position: 'absolute',
    left: -2,
    top: -2,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.primary,
  },
  notifCenter: {
    flex: 1,
  },
  notifHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  notifTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#9ca3af',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    flex: 1,
    marginRight: 8,
  },
  unreadNotifTitle: {
    color: Colors.primary,
    fontWeight: '900',
  },
  notifTime: {
    fontSize: 10,
    color: '#6b7280',
  },
  notifMessage: {
    fontSize: 12,
    color: '#d1d5db',
    lineHeight: 16,
  },
  deleteNotifButton: {
    padding: 8,
    marginLeft: 8,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.02)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 4,
  },
  emptySubtitle: {
    fontSize: 12,
    color: '#4b5563',
  },
});

export default BottomNavBar;
