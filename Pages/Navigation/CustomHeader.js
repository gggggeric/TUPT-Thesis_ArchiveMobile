// Navigation/CustomHeader.js
import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  Animated,
  Alert,
  Linking,
  Dimensions,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Colors from '../../utils/Colors';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const CustomHeader = ({ onMenuPress, onSearch, searchQuery, onSearchChange }) => {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const searchInputRef = React.useRef(null);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [history, setHistory] = useState([]);

  React.useEffect(() => {
    loadSearchHistory();
  }, []);

  const loadSearchHistory = async () => {
    try {
      const historyStr = await AsyncStorage.getItem('search_query_history');
      if (historyStr) {
        setHistory(JSON.parse(historyStr));
      }
    } catch (err) {
      console.log('Error loading search history:', err);
    }
  };

  const saveSearchQuery = async (query) => {
    if (!query.trim()) return;
    try {
      const historyStr = await AsyncStorage.getItem('search_query_history');
      let currentHistory = historyStr ? JSON.parse(historyStr) : [];
      
      // Remove existing and add to top
      currentHistory = currentHistory.filter(q => q !== query.trim());
      currentHistory.unshift(query.trim());
      
      // Limit to 5
      currentHistory = currentHistory.slice(0, 5);
      
      await AsyncStorage.setItem('search_query_history', JSON.stringify(currentHistory));
      setHistory(currentHistory);
    } catch (err) {
      console.log('Error saving search query:', err);
    }
  };

  const clearSearch = () => {
    onSearchChange('');
  };

  const handleSearchSubmit = () => {
    if (searchQuery.trim()) {
        saveSearchQuery(searchQuery);
        navigation.navigate('SearchResult', { query: searchQuery.trim() });
        setIsSearchFocused(false);
        searchInputRef.current?.blur();
    }
  };

  const handleQuickSearch = () => {
     navigation.navigate('SearchResult', { query: searchQuery });
  };

  const handleHistoryTap = (item) => {
    onSearchChange(item);
    saveSearchQuery(item);
    navigation.navigate('SearchResult', { query: item });
    setIsSearchFocused(false);
    searchInputRef.current?.blur();
  };

  return (
    <View style={[styles.header, { paddingTop: insets.top > 0 ? insets.top + 8 : 16 }]}>
      <StatusBar backgroundColor="transparent" translucent={true} barStyle="light-content" />
      

      {/* Static Search Bar */}
      <View style={styles.searchWrapper}>
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={18} color="rgba(255, 255, 255, 0.7)" style={styles.searchIcon} />
          
          <TextInput
            ref={searchInputRef}
            style={styles.searchInput}
            placeholder="Search research papers..."
            placeholderTextColor="rgba(255, 255, 255, 0.7)"
            value={searchQuery}
            onChangeText={onSearchChange}
            onFocus={() => {
                setIsSearchFocused(true);
                loadSearchHistory();
            }}
            onBlur={() => {
                // Delay hiding to allow taps on history
                setTimeout(() => setIsSearchFocused(false), 200);
            }}
            onSubmitEditing={handleSearchSubmit}
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="search"
          />

          {searchQuery ? (
            <TouchableOpacity onPress={clearSearch} style={styles.clearButton}>
              <Ionicons name="close" size={18} color="white" />
            </TouchableOpacity>
          ) : null}
        </View>

        {/* Search History Dropdown */}
        {isSearchFocused && history.length > 0 && (
            <View style={styles.historyDropdown}>
                {history.map((item, index) => (
                    <TouchableOpacity 
                        key={index} 
                        style={styles.historyItem}
                        onPress={() => handleHistoryTap(item)}
                    >
                        <Ionicons name="time-outline" size={16} color="#9ca3af" style={{ marginRight: 10 }} />
                        <Text style={styles.historyText} numberOfLines={1}>{item}</Text>
                        <Ionicons name="arrow-back" size={14} color="#d1d5db" style={{ transform: [{ rotate: '135deg' }] }} />
                    </TouchableOpacity>
                ))}
            </View>
        )}
      </View>

      {/* Action Buttons */}
      <View style={styles.searchActions}>
        <TouchableOpacity 
          onPress={handleSearchSubmit} 
          style={styles.actionIcon}
        >
          <Ionicons name="search" size={24} color="white" />
        </TouchableOpacity>
        <TouchableOpacity 
          onPress={handleQuickSearch} 
          style={styles.actionIcon}
        >
          <Ionicons name="options" size={24} color="white" />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'transparent',
    paddingHorizontal: 12,
    paddingBottom: 12,
    zIndex: 1000,
  },
  menuButton: {
    padding: 8,
  },
  searchWrapper: {
    flex: 1,
    marginHorizontal: 8,
    zIndex: 1000,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 42,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  searchIcon: {
    marginRight: 6,
  },
  searchInput: {
    flex: 1,
    color: 'white',
    fontSize: 14,
    paddingVertical: 8,
    includeFontPadding: false,
  },
  clearButton: {
    padding: 4,
  },
  searchActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionIcon: {
    padding: 8,
  },
  historyDropdown: {
    position: 'absolute',
    top: 48,
    left: 0,
    right: 0,
    backgroundColor: Colors.card,
    borderRadius: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Platform.select({
        ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8 },
        android: { elevation: 8 }
    }),
    zIndex: 1000,
  },
  historyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  historyText: {
    flex: 1,
    fontSize: 14,
    color: Colors.textSecondary,
  },
});

export default CustomHeader;