// Navigation/HamburgerMenu.js
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width } = Dimensions.get('window');

const HamburgerMenu = ({ isVisible, onClose, navigation }) => {
  const slideAnim = React.useRef(new Animated.Value(-width)).current;
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
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(slideAnim, {
        toValue: -width,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  }, [isVisible]);

  const menuItems = [
    { icon: 'home', label: 'Home', screen: 'Home' },
    { icon: 'document-text', label: 'My Theses', screen: 'Theses' },
    { icon: 'analytics', label: 'Analysis', screen: 'Analysis' },
    { icon: 'settings', label: 'Settings', screen: 'Settings' },
    { icon: 'help-circle', label: 'Help & Support', screen: 'Help' },
    { icon: 'information-circle', label: 'About', screen: 'About' },
  ];

  const handleMenuItemPress = (screen) => {
    onClose();
    // You can add navigation logic here
    console.log(`Navigate to: ${screen}`);
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
      <TouchableOpacity 
        style={styles.overlay}
        onPress={onClose}
        activeOpacity={1}
      />
      
      {/* Menu */}
      <Animated.View 
        style={[
          styles.menuContainer,
          { transform: [{ translateX: slideAnim }] }
        ]}
      >
        <LinearGradient
          colors={['#605051', '#3a2c2d']}
          style={styles.menuGradient}
        >
          {/* User Profile Section */}
          <View style={styles.userSection}>
            <View style={styles.userAvatar}>
              <Ionicons name="person" size={40} color="white" />
            </View>
            <Text style={styles.userName}>
              {user?.name || 'Guest User'}
            </Text>
            <Text style={styles.userId}>
              {user?.idNumber || 'TUPT-00-0000'}
            </Text>
            {user?.age && (
              <Text style={styles.userAge}>
                Age: {user.age}
              </Text>
            )}
          </View>

          {/* Menu Items */}
          <View style={styles.menuItems}>
            {menuItems.map((item, index) => (
              <TouchableOpacity
                key={index}
                style={styles.menuItem}
                onPress={() => handleMenuItemPress(item.screen)}
              >
                <View style={styles.menuItemContent}>
                  <Ionicons 
                    name={item.icon} 
                    size={24} 
                    color="rgba(255, 255, 255, 0.9)" 
                  />
                  <Text style={styles.menuItemText}>{item.label}</Text>
                </View>
                <Ionicons 
                  name="chevron-forward" 
                  size={20} 
                  color="rgba(255, 255, 255, 0.6)" 
                />
              </TouchableOpacity>
            ))}
          </View>

          {/* Logout Button - Only show if user is logged in */}
          {user && (
            <TouchableOpacity 
              style={styles.logoutButton}
              onPress={handleLogout}
            >
              <LinearGradient
                colors={['#c7242c', '#a51c23']}
                style={styles.logoutGradient}
              >
                <Ionicons name="log-out" size={20} color="white" />
                <Text style={styles.logoutText}>Logout</Text>
              </LinearGradient>
            </TouchableOpacity>
          )}

          {/* Login Button - Show if user is not logged in */}
          {!user && (
            <TouchableOpacity 
              style={styles.loginButton}
              onPress={() => {
                onClose();
                navigation.navigate('Login');
              }}
            >
              <LinearGradient
                colors={['#c7242c', '#a51c23']}
                style={styles.loginGradient}
              >
                <Ionicons name="log-in" size={20} color="white" />
                <Text style={styles.loginText}>Login</Text>
              </LinearGradient>
            </TouchableOpacity>
          )}
        </LinearGradient>
      </Animated.View>
    </>
  );
};

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    zIndex: 999,
  },
  menuContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: width * 0.8,
    height: '100%',
    zIndex: 1000,
  },
  menuGradient: {
    flex: 1,
    paddingTop: 60,
  },
  userSection: {
    alignItems: 'center',
    paddingVertical: 30,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.2)',
    marginBottom: 20,
  },
  userAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 15,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  userName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 5,
  },
  userId: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
    marginBottom: 3,
  },
  userAge: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.6)',
    fontStyle: 'italic',
  },
  menuItems: {
    flex: 1,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 15,
    paddingHorizontal: 25,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  menuItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  menuItemText: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    marginLeft: 15,
    fontWeight: '500',
  },
  logoutButton: {
    margin: 20,
    borderRadius: 10,
    overflow: 'hidden',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  logoutGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 15,
    paddingHorizontal: 20,
  },
  logoutText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 10,
  },
  loginButton: {
    margin: 20,
    borderRadius: 10,
    overflow: 'hidden',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  loginGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 15,
    paddingHorizontal: 20,
  },
  loginText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 10,
  },
});

export default HamburgerMenu;