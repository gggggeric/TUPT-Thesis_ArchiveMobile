import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Dimensions,
  Platform,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width, height } = Dimensions.get('window');

const HamburgerMenu = ({ isVisible, onClose, navigation }) => {
  const slideAnim = React.useRef(new Animated.Value(-width)).current;
  const fadeAnim = React.useRef(new Animated.Value(0)).current;
  const [user, setUser] = useState(null);

  // Load user data from AsyncStorage when menu becomes visible
  useEffect(() => {
    if (isVisible) {
      loadUserData();
    }
  }, [isVisible]);

  const loadUserData = async () => {
    try {
      const userData = await AsyncStorage.getItem('userData');
      if (userData) {
        setUser(JSON.parse(userData));
      }
    } catch (error) {
      console.error('Error loading user data:', error);
    }
  };

  React.useEffect(() => {
    if (isVisible) {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: -width,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [isVisible]);

  const menuItems = [
    { icon: 'home', label: 'Home', screen: 'Home', gradient: ['#6366f1', '#4f46e5'] },
    { icon: 'document-text', label: 'My Documents', screen: 'ThesisAnalysis', gradient: ['#ec4899', '#db2777'] },
    { icon: 'analytics', label: 'Analysis', screen: 'Analysis', gradient: ['#8b5cf6', '#7c3aed'] },
    { icon: 'library', label: 'Library', screen: 'Library', gradient: ['#f59e0b', '#d97706'] },
    { icon: 'settings', label: 'Settings', screen: 'Settings', gradient: ['#14b8a6', '#0d9488'] },
    { icon: 'help-circle', label: 'Help & Support', screen: 'Help', gradient: ['#10b981', '#059669'] },
  ];

  const handleMenuItemPress = (screen) => {
    onClose();
    // Navigate to the specified screen
    if (navigation && screen) {
      navigation.navigate(screen);
    }
  };

  const handleLogout = async () => {
    try {
      // Remove user data from AsyncStorage
      await AsyncStorage.removeItem('userData');
      setUser(null);
      onClose();
      // Navigate to login screen
      navigation.navigate('Login');
      console.log('User logged out successfully');
    } catch (error) {
      console.error('Error during logout:', error);
    }
  };

  if (!isVisible) return null;

  return (
    <>
      {/* Overlay */}
      <Animated.View 
        style={[
          styles.overlay,
          { opacity: fadeAnim }
        ]}
      >
        <TouchableOpacity 
          style={StyleSheet.absoluteFill}
          onPress={onClose}
          activeOpacity={1}
        />
      </Animated.View>
      
      {/* Menu */}
      <Animated.View 
        style={[
          styles.menuContainer,
          { transform: [{ translateX: slideAnim }] }
        ]}
      >
        <LinearGradient
          colors={['#ffffff', '#fef2f2']}
          style={styles.menuGradient}
        >
          {/* Header Section with Red Gradient */}
          <LinearGradient
            colors={['#c7242c', '#991b1b']}
            style={styles.headerSection}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            {/* User Profile Section */}
            <TouchableOpacity 
              style={styles.userSection}
              onPress={() => {
                onClose();
                navigation.navigate('Profile');
              }}
              activeOpacity={0.8}
            >
              <View style={styles.userAvatarContainer}>
                <LinearGradient
                  colors={['rgba(255, 255, 255, 0.3)', 'rgba(255, 255, 255, 0.1)']}
                  style={styles.userAvatar}
                >
                  <Ionicons name="person" size={36} color="white" />
                </LinearGradient>
                <View style={styles.editIconContainer}>
                  <Ionicons name="create-outline" size={16} color="white" />
                </View>
              </View>
              <Text style={styles.userName}>
                {user?.name || 'Guest User'}
              </Text>
              <View style={styles.userInfoBadge}>
                <Text style={styles.userId}>
                  {user?.idNumber || 'TUPT-00-0000'}
                </Text>
              </View>
              {user?.age && (
                <Text style={styles.userAge}>
                  Age: {user.age}
                </Text>
              )}
              <View style={styles.viewProfileHint}>
                <Text style={styles.viewProfileText}>Tap to view profile</Text>
              </View>
            </TouchableOpacity>
          </LinearGradient>

          {/* Scrollable Content */}
          <ScrollView 
            style={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContentContainer}
          >
            {/* Menu Items */}
            <View style={styles.menuItems}>
              {menuItems.map((item, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.menuItem}
                  onPress={() => handleMenuItemPress(item.screen)}
                  activeOpacity={0.7}
                >
                  <View style={styles.menuItemContent}>
                    <LinearGradient
                      colors={item.gradient}
                      style={styles.menuIconContainer}
                    >
                      <Ionicons 
                        name={item.icon} 
                        size={20} 
                        color="white" 
                      />
                    </LinearGradient>
                    <Text style={styles.menuItemText}>{item.label}</Text>
                  </View>
                  <Ionicons 
                    name="chevron-forward" 
                    size={18} 
                    color="#9ca3af" 
                  />
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>

          {/* Bottom Section */}
          <View style={styles.bottomSection}>
            {/* App Version */}
            <View style={styles.versionContainer}>
              <Ionicons name="information-circle-outline" size={16} color="#9ca3af" />
              <Text style={styles.versionText}>Version 1.0.0</Text>
            </View>

            {/* Logout Button - Only show if user is logged in */}
            {user && (
              <TouchableOpacity 
                style={styles.actionButton}
                onPress={handleLogout}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={['#c7242c', '#991b1b']}
                  style={styles.actionGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                >
                  <Ionicons name="log-out-outline" size={20} color="white" />
                  <Text style={styles.actionText}>Logout</Text>
                </LinearGradient>
              </TouchableOpacity>
            )}

            {/* Login Button - Show if user is not logged in */}
            {!user && (
              <TouchableOpacity 
                style={styles.actionButton}
                onPress={() => {
                  onClose();
                  navigation.navigate('Login');
                }}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={['#c7242c', '#991b1b']}
                  style={styles.actionGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                >
                  <Ionicons name="log-in-outline" size={20} color="white" />
                  <Text style={styles.actionText}>Login</Text>
                </LinearGradient>
              </TouchableOpacity>
            )}
          </View>
        </LinearGradient>
      </Animated.View>
    </>
  );
};

// ... keep your existing styles the same ...
const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    zIndex: 999,
  },
  menuContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: width * 0.85,
    height: '100%',
    zIndex: 1000,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 2, height: 0 },
        shadowOpacity: 0.3,
        shadowRadius: 10,
      },
      android: {
        elevation: 16,
      },
    }),
  },
  menuGradient: {
    flex: 1,
  },
  headerSection: {
    paddingTop: Platform.OS === 'ios' ? 60 : 50,
    paddingBottom: 30,
    borderBottomRightRadius: 30,
  },
  userSection: {
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  userAvatarContainer: {
    marginBottom: 16,
    position: 'relative',
  },
  userAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: 'rgba(255, 255, 255, 0.5)',
  },
  editIconContainer: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#c7242c',
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'white',
  },
  userName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 10,
    textAlign: 'center',
  },
  userInfoBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
    marginBottom: 6,
  },
  userId: {
    fontSize: 13,
    color: 'white',
    fontWeight: '600',
  },
  userAge: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
    fontStyle: 'italic',
    marginBottom: 8,
  },
  viewProfileHint: {
    marginTop: 4,
  },
  viewProfileText: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.7)',
    fontStyle: 'italic',
  },
  scrollContent: {
    flex: 1,
  },
  scrollContentContainer: {
    flexGrow: 1,
  },
  menuItems: {
    paddingTop: 20,
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 16,
    marginBottom: 8,
    backgroundColor: 'white',
    borderRadius: 16,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 3,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  menuItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  menuIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  menuItemText: {
    fontSize: 16,
    color: '#1f2937',
    fontWeight: '600',
    flex: 1,
  },
  bottomSection: {
    paddingHorizontal: 20,
    paddingBottom: Platform.OS === 'ios' ? 40 : 20,
    paddingTop: 10,
  },
  versionContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    marginBottom: 12,
    gap: 6,
  },
  versionText: {
    fontSize: 12,
    color: '#9ca3af',
    fontWeight: '500',
  },
  actionButton: {
    borderRadius: 16,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#c7242c',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
      },
      android: {
        elevation: 6,
      },
    }),
  },
  actionGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    gap: 10,
  },
  actionText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default HamburgerMenu;