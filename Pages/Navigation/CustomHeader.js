// Navigation/CustomHeader.js
import React, { useState } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const CustomHeader = ({ onMenuPress, onSearch, searchQuery, onSearchChange }) => {
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const searchWidth = React.useRef(new Animated.Value(60)).current;

  const handleSearchFocus = () => {
    setIsSearchFocused(true);
    Animated.timing(searchWidth, {
      toValue: 250,
      duration: 300,
      useNativeDriver: false,
    }).start();
  };

  const handleSearchBlur = () => {
    if (!searchQuery) {
      setIsSearchFocused(false);
      Animated.timing(searchWidth, {
        toValue: 60,
        duration: 300,
        useNativeDriver: false,
      }).start();
    }
  };

  const clearSearch = () => {
    onSearchChange('');
    setIsSearchFocused(false);
    Animated.timing(searchWidth, {
      toValue: 60,
      duration: 300,
      useNativeDriver: false,
    }).start();
  };

  return (
    <View style={styles.header}>
      <StatusBar backgroundColor="#c7242c" barStyle="light-content" />
      
      {/* Menu Button */}
      <TouchableOpacity onPress={onMenuPress} style={styles.menuButton}>
        <Ionicons name="menu" size={28} color="white" />
      </TouchableOpacity>

      {/* Search Bar */}
      <Animated.View style={[styles.searchContainer, { width: searchWidth }]}>
        {isSearchFocused || searchQuery ? (
          <TextInput
            style={styles.searchInput}
            placeholder="Search theses, documents..."
            placeholderTextColor="rgba(255, 255, 255, 0.7)"
            value={searchQuery}
            onChangeText={onSearchChange}
            onFocus={handleSearchFocus}
            onBlur={handleSearchBlur}
            onSubmitEditing={onSearch}
            autoCapitalize="none"
            autoCorrect={false}
          />
        ) : (
          <TouchableOpacity 
            style={styles.searchPlaceholder}
            onPress={handleSearchFocus}
          >
            <Ionicons name="search" size={20} color="white" />
          </TouchableOpacity>
        )}

        {/* Clear Search Button */}
        {(isSearchFocused || searchQuery) && (
          <TouchableOpacity onPress={clearSearch} style={styles.clearButton}>
            <Ionicons name="close" size={18} color="white" />
          </TouchableOpacity>
        )}
      </Animated.View>

      {/* Profile/Notification Button */}
      <TouchableOpacity style={styles.profileButton}>
        <Ionicons name="notifications" size={24} color="white" />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#c7242c',
    paddingHorizontal: 15,
    paddingVertical: 12,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  menuButton: {
    padding: 5,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 25,
    paddingHorizontal: 15,
    height: 40,
  },
  searchInput: {
    flex: 1,
    color: 'white',
    fontSize: 16,
    paddingVertical: 8,
  },
  searchPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  clearButton: {
    padding: 5,
    marginLeft: 5,
  },
  profileButton: {
    padding: 5,
  },
});

export default CustomHeader;