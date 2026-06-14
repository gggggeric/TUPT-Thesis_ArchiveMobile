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
  Image,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import API_BASE_URL from '../../api';
import Colors from '../../utils/Colors';

const { width, height } = Dimensions.get('window');

const GridMenu = ({ isVisible, onClose, navigation }) => {
  const [user, setUser] = useState(null);
  const fadeAnim = React.useRef(new Animated.Value(0)).current;
  const slideAnim = React.useRef(new Animated.Value(height)).current;
  const [currentRoute, setCurrentRoute] = useState(null);

  useEffect(() => {
    if (isVisible) {
      loadUserData();
      detectCurrentRoute();
      // Reset values to initial state so animation plays every time
      fadeAnim.setValue(0);
      slideAnim.setValue(height);
      // Animation: Fade in backdrop and spring up sheet
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 1, duration: 200, useNativeDriver: true }),
        Animated.spring(slideAnim, {
          toValue: 0,
          tension: 65,
          friction: 11,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      // Fade out backdrop and slide down sheet
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 0, duration: 180, useNativeDriver: true }),
        Animated.timing(slideAnim, { toValue: height, duration: 200, useNativeDriver: true }),
      ]).start();
    }
  }, [isVisible]);

  const detectCurrentRoute = () => {
    try {
      if (navigation) {
        const state = navigation.getState();
        const routeName = state?.routes?.[state?.index]?.name;
        setCurrentRoute(routeName);
      }
    } catch (e) {
      console.log('Error detecting route in GridMenu:', e);
    }
  };

  const loadUserData = async () => {
    try {
      const userDataStr = await AsyncStorage.getItem('userData');
      const token = await AsyncStorage.getItem('userToken');
      if (userDataStr) {
        const cached = JSON.parse(userDataStr);
        setUser(cached);
        if (token && cached._id) {
          try {
            const res = await fetch(`${API_BASE_URL}/user/profile?userId=${cached._id}`, {
              headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
              const data = await res.json();
              if (data.success && data.data?.user) {
                setUser(data.data.user);
                await AsyncStorage.setItem('userData', JSON.stringify(data.data.user));
              }
            }
          } catch (fetchErr) {
            console.log('Could not refresh profile from API:', fetchErr.message);
          }
        }
      }
    } catch (error) {
      console.error('Error loading user data:', error);
    }
  };

  const handleMenuItemPress = (screen) => {
    onClose();
    if (navigation && screen) {
      navigation.navigate(screen);
    }
  };

  const gridItems = [
    { icon: 'home', iconOutline: 'home-outline', label: 'Home', screen: 'Home' },
    { icon: 'chatbubbles', iconOutline: 'chatbubbles-outline', label: 'Collaboration', screen: 'Collaboration' },
    { icon: 'folder', iconOutline: 'folder-outline', label: 'Submissions', screen: 'MySubmissions' },
    ...(user?.isProfessor ? [{ icon: 'checkmark-circle', iconOutline: 'checkmark-circle-outline', label: 'Approvals', screen: 'Approvals' }] : []),
    { icon: 'person', iconOutline: 'person-outline', label: 'Profile', screen: 'Profile' },
  ];

  return (
    <Modal
      transparent
      visible={isVisible}
      animationType="none"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        {/* Backdrop (Tapping dim closes sheet) */}
        <Animated.View style={[styles.backdrop, { opacity: fadeAnim }]}>
          <TouchableOpacity style={{ flex: 1 }} activeOpacity={1} onPress={onClose} />
        </Animated.View>

        {/* Bottom Sheet Container */}
        <Animated.View style={[styles.mainContainer, { transform: [{ translateY: slideAnim }] }]}>
          <LinearGradient
            colors={[Colors.background, '#161622']} 
            style={styles.gradientBg}
          >
            {/* Drag Handle */}
            <View style={styles.dragHandleContainer}>
              <View style={styles.dragHandle} />
            </View>

            {/* Header section */}
            <View style={styles.headerRow}>
              <View style={styles.logoContainer}>
                <Image
                  source={require('../../assets/tup-logo.png')}
                  style={styles.logoImage}
                />
                <Text style={styles.logoText}>TUPT Archive</Text>
              </View>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={onClose}
                activeOpacity={0.7}
              >
                <Ionicons name="close" size={20} color={Colors.foreground} />
              </TouchableOpacity>
            </View>



            {/* Grid Block */}
            <View style={styles.scrollContainer}>
              <View style={styles.gridContainer}>
                {gridItems.map((item, index) => {
                  const isActive = currentRoute === item.screen;
                  return (
                    <TouchableOpacity
                      key={index}
                      style={[
                        styles.gridCard,
                        isActive && styles.activeGridCard
                      ]}
                      onPress={() => handleMenuItemPress(item.screen)}
                      activeOpacity={0.8}
                    >
                      <View style={[
                        styles.iconContainer,
                        isActive && styles.activeIconContainer
                      ]}>
                        <Ionicons 
                          name={isActive ? item.icon : item.iconOutline} 
                          size={22} 
                          color={isActive ? Colors.primary : Colors.textSecondary} 
                        />
                      </View>
                      <Text style={[
                        styles.gridLabel,
                        isActive && styles.activeGridLabel
                      ]} numberOfLines={2}>
                        {item.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          </LinearGradient>
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end', // Aligns sheet to the bottom
    backgroundColor: 'transparent',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(10, 10, 15, 0.75)', // dim overlay backdrop
  },
  mainContainer: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.border,
    borderBottomWidth: 0,
    backgroundColor: '#161622',
  },
  gradientBg: {
    paddingHorizontal: 24,
    paddingBottom: Platform.OS === 'ios' ? 40 : 28,
  },
  dragHandleContainer: {
    width: '100%',
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 8,
  },
  dragHandle: {
    width: 38,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.border,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 8,
    marginBottom: 20,
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  logoImage: {
    width: 32,
    height: 32,
    resizeMode: 'contain',
  },
  logoText: {
    fontSize: 18,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileSummary: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
    paddingHorizontal: 4,
    flexWrap: 'wrap',
    gap: 10,
  },
  profileMeta: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  profileGreeting: {
    fontSize: 14,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  profileName: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
    maxWidth: width * 0.45,
  },
  idBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(45, 212, 191, 0.06)',
    borderWidth: 1,
    borderColor: 'rgba(45, 212, 191, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  profileId: {
    fontSize: 11,
    color: Colors.primary,
    fontWeight: '800',
    letterSpacing: 1,
  },
  scrollContainer: {
    paddingBottom: 24,
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  gridCard: {
    width: (width - 60) / 2, // 2 columns with gaps
    backgroundColor: Colors.surface,
    borderColor: Colors.border,
    borderWidth: 1,
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  activeGridCard: {
    borderColor: Colors.primary,
    backgroundColor: 'rgba(45, 212, 191, 0.02)',
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  activeIconContainer: {
    backgroundColor: 'rgba(45, 212, 191, 0.08)',
    borderColor: 'rgba(45, 212, 191, 0.2)',
    borderRadius: 10,
  },
  gridLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  activeGridLabel: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  logoutButton: {
    width: '100%',
    height: 48,
    borderRadius: 14,
    backgroundColor: 'rgba(243, 139, 168, 0.04)',
    borderColor: 'rgba(243, 139, 168, 0.15)',
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 8,
  },
  logoutText: {
    color: Colors.accent,
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  footer: {
    alignItems: 'center',
    paddingBottom: Platform.OS === 'ios' ? 20 : 12,
    paddingTop: 10,
  },
  footerText: {
    fontSize: 9,
    color: Colors.textDim,
    fontWeight: '800',
    letterSpacing: 2,
  },
});

export default GridMenu;
