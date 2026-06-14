import React from 'react';
import { View, TouchableOpacity, StyleSheet, Dimensions, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import Colors from '../../utils/Colors';

const { width } = Dimensions.get('window');

const BottomNavBar = ({ activeScreen, onGridPress }) => {
  const navigation = useNavigation();

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
        {/* Tab 1: Home */}
        {renderTab('Home', 'home', 'home-outline')}

        {/* Tab 2: Collaboration */}
        {renderTab('Collaboration', 'chatbubble', 'chatbubble-outline')}

        {/* Tab 3: Profile */}
        {renderTab('Profile', 'person', 'person-outline')}

        {/* Tab 4: Grid Menu Trigger */}
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
});

export default BottomNavBar;
