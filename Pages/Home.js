// Pages/Home.js
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import CustomHeader from './Navigation/CustomHeader';
import HamburgerMenu from './Navigation/HamburgerMenu';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width, height } = Dimensions.get('window');

const HomeScreen = () => {
  const navigation = useNavigation();
  const [isMenuVisible, setIsMenuVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [user, setUser] = useState(null);
  const [filteredFeatures, setFilteredFeatures] = useState([]);

  // Load user data
  useEffect(() => {
    loadUserData();
  }, []);

  // Filter features based on search query
  useEffect(() => {
    if (searchQuery) {
      const filtered = features.filter(feature =>
        feature.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        feature.description.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredFeatures(filtered);
    } else {
      setFilteredFeatures(features);
    }
  }, [searchQuery]);

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

  const features = [
    {
      icon: 'analytics',
      title: 'Thesis Analysis',
      description: 'Advanced analysis tools for your research papers'
    },
    {
      icon: 'document-text',
      title: 'Document Management',
      description: 'Organize and manage all your thesis documents'
    },
    {
      icon: 'search',
      title: 'Smart Search',
      description: 'Find relevant research papers quickly'
    },
    {
      icon: 'stats-chart',
      title: 'Progress Tracking',
      description: 'Monitor your research progress and milestones'
    },
    {
      icon: 'library',
      title: 'Thesis Library',
      description: 'Access comprehensive thesis database'
    },
    {
      icon: 'trending-up',
      title: 'Research Trends',
      description: 'Discover latest research trends and patterns'
    }
  ];

  const handleSearch = () => {
    if (searchQuery) {
      console.log('Searching for:', searchQuery);
      // Implement your search logic here
    }
  };

  const handleFeaturePress = (feature) => {
    console.log('Feature pressed:', feature.title);
    // Add navigation logic for each feature
  };

  return (
    <View style={styles.container}>
      <CustomHeader
        onMenuPress={() => setIsMenuVisible(true)}
        onSearch={handleSearch}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
      />
      
      <LinearGradient
        colors={['#f9e8e9', '#c7242c']}
        style={styles.gradientBackground}
      >
        <ScrollView 
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
        >
          {/* Welcome Section */}
          <View style={styles.welcomeSection}>
            <Text style={styles.welcomeText}>Welcome back,</Text>
            <Text style={styles.userName}>
              {user?.name || 'Researcher'}
            </Text>
            <Text style={styles.welcomeSubtitle}>
              {searchQuery ? `Search results for "${searchQuery}"` : 'Ready to continue your research?'}
            </Text>
          </View>

          {/* Search Results Count */}
          {searchQuery && (
            <View style={styles.searchResultsSection}>
              <Text style={styles.searchResultsText}>
                Found {filteredFeatures.length} result{filteredFeatures.length !== 1 ? 's' : ''}
              </Text>
            </View>
          )}

          {/* Features Grid */}
          <View style={styles.featuresSection}>
            <Text style={styles.sectionTitle}>
              {searchQuery ? 'Search Results' : 'Quick Actions'}
            </Text>
            <View style={styles.featuresGrid}>
              {filteredFeatures.map((feature, index) => (
                <TouchableOpacity 
                  key={index} 
                  style={styles.featureCard}
                  onPress={() => handleFeaturePress(feature)}
                >
                  <LinearGradient
                    colors={['#605051', '#3a2c2d']}
                    style={styles.featureGradient}
                  >
                    <Ionicons name={feature.icon} size={32} color="white" />
                    <Text style={styles.featureTitle}>{feature.title}</Text>
                    <Text style={styles.featureDescription}>{feature.description}</Text>
                  </LinearGradient>
                </TouchableOpacity>
              ))}
            </View>

            {/* No Results Message */}
            {searchQuery && filteredFeatures.length === 0 && (
              <View style={styles.noResults}>
                <Ionicons name="search" size={50} color="#605051" />
                <Text style={styles.noResultsText}>No results found</Text>
                <Text style={styles.noResultsSubtext}>
                  Try different keywords or browse all features
                </Text>
              </View>
            )}
          </View>

          {/* Recent Activity - Only show when not searching */}
          {!searchQuery && (
            <View style={styles.activitySection}>
              <Text style={styles.sectionTitle}>Recent Activity</Text>
              <View style={styles.activityList}>
                <View style={styles.activityItem}>
                  <Ionicons name="document-text" size={20} color="#c7242c" />
                  <Text style={styles.activityText}>Thesis "AI in Education" updated</Text>
                  <Text style={styles.activityTime}>2 hours ago</Text>
                </View>
                <View style={styles.activityItem}>
                  <Ionicons name="analytics" size={20} color="#c7242c" />
                  <Text style={styles.activityText}>Analysis completed for Research Paper</Text>
                  <Text style={styles.activityTime}>1 day ago</Text>
                </View>
                <View style={styles.activityItem}>
                  <Ionicons name="library" size={20} color="#c7242c" />
                  <Text style={styles.activityText}>3 new theses added to your library</Text>
                  <Text style={styles.activityTime}>2 days ago</Text>
                </View>
              </View>
            </View>
          )}
        </ScrollView>
      </LinearGradient>

      {/* Hamburger Menu */}
      <HamburgerMenu
        isVisible={isMenuVisible}
        onClose={() => setIsMenuVisible(false)}
        navigation={navigation}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradientBackground: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  welcomeSection: {
    padding: 25,
    paddingTop: 30,
  },
  welcomeText: {
    fontSize: 18,
    color: '#605051',
    marginBottom: 5,
  },
  userName: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#c7242c',
    marginBottom: 10,
  },
  welcomeSubtitle: {
    fontSize: 16,
    color: '#605051',
  },
  searchResultsSection: {
    paddingHorizontal: 25,
    marginBottom: 10,
  },
  searchResultsText: {
    fontSize: 14,
    color: '#605051',
    fontStyle: 'italic',
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#605051',
    marginBottom: 20,
    marginLeft: 25,
  },
  featuresSection: {
    marginBottom: 30,
  },
  featuresGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: 15,
    gap: 15,
  },
  featureCard: {
    width: (width - 45) / 2,
    borderRadius: 15,
    overflow: 'hidden',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    marginBottom: 15,
  },
  featureGradient: {
    padding: 20,
    alignItems: 'center',
    minHeight: 140,
    justifyContent: 'center',
  },
  featureTitle: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 10,
    marginBottom: 5,
    textAlign: 'center',
  },
  featureDescription: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 16,
  },
  noResults: {
    alignItems: 'center',
    padding: 40,
  },
  noResultsText: {
    fontSize: 18,
    color: '#605051',
    fontWeight: 'bold',
    marginTop: 10,
  },
  noResultsSubtext: {
    fontSize: 14,
    color: '#605051',
    textAlign: 'center',
    marginTop: 5,
  },
  activitySection: {
    marginBottom: 40,
  },
  activityList: {
    paddingHorizontal: 25,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  activityText: {
    flex: 1,
    marginLeft: 10,
    color: '#605051',
    fontSize: 14,
  },
  activityTime: {
    color: '#c7242c',
    fontSize: 12,
    fontWeight: '500',
  },
});

export default HomeScreen;