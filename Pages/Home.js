// Pages/Home.js
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Dimensions,
  Animated,
  Platform,
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
  const fadeAnim = useState(new Animated.Value(0))[0];

  // Load user data
  useEffect(() => {
    loadUserData();
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
    }).start();
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
      description: 'Advanced analysis tools for your research papers',
      gradient: ['#6366f1', '#4f46e5'],
    },
    {
      icon: 'document-text',
      title: 'Document Management',
      description: 'Organize and manage all your thesis documents',
      gradient: ['#ec4899', '#db2777'],
    },
    {
      icon: 'search',
      title: 'Smart Search',
      description: 'Find relevant research papers quickly',
      gradient: ['#8b5cf6', '#7c3aed'],
    },
    {
      icon: 'stats-chart',
      title: 'Progress Tracking',
      description: 'Monitor your research progress and milestones',
      gradient: ['#14b8a6', '#0d9488'],
    },
    {
      icon: 'library',
      title: 'Thesis Library',
      description: 'Access comprehensive thesis database',
      gradient: ['#f59e0b', '#d97706'],
    },
    {
      icon: 'trending-up',
      title: 'Research Trends',
      description: 'Discover latest research trends and patterns',
      gradient: ['#10b981', '#059669'],
    }
  ];

  const stats = [
    { label: 'Active Projects', value: '12', icon: 'folder-open' },
    { label: 'Completed', value: '48', icon: 'checkmark-circle' },
    { label: 'In Progress', value: '8', icon: 'timer' },
  ];

  const handleSearch = () => {
    if (searchQuery) {
      console.log('Searching for:', searchQuery);
    }
  };

  const handleFeaturePress = (feature) => {
    console.log('Feature pressed:', feature.title);
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
        colors={['#fef2f2', '#fee2e2', '#fecaca']}
        style={styles.gradientBackground}
      >
        <ScrollView 
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
        >
          <Animated.View style={{ opacity: fadeAnim }}>
            {/* Hero Section */}
            <LinearGradient
              colors={['#c7242c', '#991b1b']}
              style={styles.heroSection}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <View style={styles.heroContent}>
                <View style={styles.greetingContainer}>
                  <Text style={styles.greetingText}>Hello,</Text>
                  <Text style={styles.heroName}>{user?.name || 'Researcher'}</Text>
                  <Text style={styles.heroSubtitle}>
                    {searchQuery ? `Searching for "${searchQuery}"` : 'What would you like to explore today?'}
                  </Text>
                </View>
                
                {/* Stats Cards - Only show when not searching */}
                {!searchQuery && (
                  <View style={styles.statsContainer}>
                    {stats.map((stat, index) => (
                      <View key={index} style={styles.statCard}>
                        <Ionicons name={stat.icon} size={20} color="#c7242c" />
                        <Text style={styles.statValue}>{stat.value}</Text>
                        <Text style={styles.statLabel}>{stat.label}</Text>
                      </View>
                    ))}
                  </View>
                )}
              </View>
            </LinearGradient>

            {/* Search Results Count */}
            {searchQuery && (
              <View style={styles.searchResultsSection}>
                <Ionicons name="filter" size={16} color="#991b1b" />
                <Text style={styles.searchResultsText}>
                  {filteredFeatures.length} result{filteredFeatures.length !== 1 ? 's' : ''} found
                </Text>
              </View>
            )}

            {/* Features Section */}
            <View style={styles.featuresSection}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>
                  {searchQuery ? 'Search Results' : 'Quick Actions'}
                </Text>
                {!searchQuery && (
                  <TouchableOpacity>
                    <Text style={styles.seeAllText}>See All</Text>
                  </TouchableOpacity>
                )}
              </View>
              
              <View style={styles.featuresGrid}>
                {filteredFeatures.map((feature, index) => (
                  <TouchableOpacity 
                    key={index} 
                    style={styles.featureCard}
                    onPress={() => handleFeaturePress(feature)}
                    activeOpacity={0.8}
                  >
                    <LinearGradient
                      colors={feature.gradient}
                      style={styles.featureGradient}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                    >
                      <View style={styles.featureIconContainer}>
                        <Ionicons name={feature.icon} size={28} color="white" />
                      </View>
                      <Text style={styles.featureTitle}>{feature.title}</Text>
                      <Text style={styles.featureDescription}>{feature.description}</Text>
                      <View style={styles.featureArrow}>
                        <Ionicons name="arrow-forward" size={16} color="rgba(255,255,255,0.7)" />
                      </View>
                    </LinearGradient>
                  </TouchableOpacity>
                ))}
              </View>

              {/* No Results */}
              {searchQuery && filteredFeatures.length === 0 && (
                <View style={styles.noResults}>
                  <View style={styles.noResultsIconContainer}>
                    <Ionicons name="search-outline" size={60} color="#d1d5db" />
                  </View>
                  <Text style={styles.noResultsText}>No results found</Text>
                  <Text style={styles.noResultsSubtext}>
                    Try adjusting your search terms or browse all features
                  </Text>
                  <TouchableOpacity 
                    style={styles.clearSearchButton}
                    onPress={() => setSearchQuery('')}
                  >
                    <Text style={styles.clearSearchText}>Clear Search</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>

            {/* Recent Activity - Only show when not searching */}
            {!searchQuery && (
              <View style={styles.activitySection}>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>Recent Activity</Text>
                  <TouchableOpacity>
                    <Text style={styles.seeAllText}>View All</Text>
                  </TouchableOpacity>
                </View>
                
                <View style={styles.activityList}>
                  <TouchableOpacity style={styles.activityItem} activeOpacity={0.7}>
                    <View style={[styles.activityIcon, { backgroundColor: '#dbeafe' }]}>
                      <Ionicons name="document-text" size={22} color="#2563eb" />
                    </View>
                    <View style={styles.activityContent}>
                      <Text style={styles.activityTitle}>Thesis Updated</Text>
                      <Text style={styles.activityDescription}>"AI in Education" document modified</Text>
                    </View>
                    <View style={styles.activityTimeContainer}>
                      <Text style={styles.activityTime}>2h</Text>
                      <Ionicons name="chevron-forward" size={16} color="#9ca3af" />
                    </View>
                  </TouchableOpacity>

                  <TouchableOpacity style={styles.activityItem} activeOpacity={0.7}>
                    <View style={[styles.activityIcon, { backgroundColor: '#d1fae5' }]}>
                      <Ionicons name="analytics" size={22} color="#059669" />
                    </View>
                    <View style={styles.activityContent}>
                      <Text style={styles.activityTitle}>Analysis Complete</Text>
                      <Text style={styles.activityDescription}>Research paper analysis finished</Text>
                    </View>
                    <View style={styles.activityTimeContainer}>
                      <Text style={styles.activityTime}>1d</Text>
                      <Ionicons name="chevron-forward" size={16} color="#9ca3af" />
                    </View>
                  </TouchableOpacity>

                  <TouchableOpacity style={styles.activityItem} activeOpacity={0.7}>
                    <View style={[styles.activityIcon, { backgroundColor: '#fef3c7' }]}>
                      <Ionicons name="library" size={22} color="#d97706" />
                    </View>
                    <View style={styles.activityContent}>
                      <Text style={styles.activityTitle}>Library Updated</Text>
                      <Text style={styles.activityDescription}>3 new theses added to collection</Text>
                    </View>
                    <View style={styles.activityTimeContainer}>
                      <Text style={styles.activityTime}>2d</Text>
                      <Ionicons name="chevron-forward" size={16} color="#9ca3af" />
                    </View>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {/* Quick Tips Section - Only show when not searching */}
            {!searchQuery && (
              <View style={styles.tipsSection}>
                <LinearGradient
                  colors={['#f3f4f6', '#e5e7eb']}
                  style={styles.tipCard}
                >
                  <Ionicons name="bulb" size={24} color="#f59e0b" />
                  <View style={styles.tipContent}>
                    <Text style={styles.tipTitle}>Pro Tip</Text>
                    <Text style={styles.tipText}>
                      Use Smart Search to find relevant papers based on keywords and citations
                    </Text>
                  </View>
                </LinearGradient>
              </View>
            )}

            <View style={{ height: 30 }} />
          </Animated.View>
        </ScrollView>
      </LinearGradient>

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
    backgroundColor: '#fff',
  },
  gradientBackground: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  heroSection: {
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    paddingTop: 25,
    paddingBottom: 30,
    paddingHorizontal: 25,
    marginBottom: 20,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  heroContent: {
    gap: 20,
  },
  greetingContainer: {
    marginBottom: 10,
  },
  greetingText: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 4,
  },
  heroName: {
    fontSize: 32,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 8,
  },
  heroSubtitle: {
    fontSize: 15,
    color: 'rgba(255, 255, 255, 0.9)',
    lineHeight: 22,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
    marginTop: 8,
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 11,
    color: '#6b7280',
    textAlign: 'center',
  },
  searchResultsSection: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 25,
    marginBottom: 15,
    gap: 8,
  },
  searchResultsText: {
    fontSize: 14,
    color: '#991b1b',
    fontWeight: '600',
  },
  featuresSection: {
    marginBottom: 25,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 25,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  seeAllText: {
    fontSize: 14,
    color: '#c7242c',
    fontWeight: '600',
  },
  featuresGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 15,
    gap: 15,
  },
  featureCard: {
    width: (width - 45) / 2,
    borderRadius: 20,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
      },
      android: {
        elevation: 6,
      },
    }),
  },
  featureGradient: {
    padding: 20,
    minHeight: 180,
    justifyContent: 'space-between',
  },
  featureIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  featureTitle: {
    color: 'white',
    fontSize: 17,
    fontWeight: 'bold',
    marginBottom: 6,
  },
  featureDescription: {
    color: 'rgba(255, 255, 255, 0.85)',
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 12,
  },
  featureArrow: {
    alignSelf: 'flex-end',
  },
  noResults: {
    alignItems: 'center',
    paddingVertical: 50,
    paddingHorizontal: 30,
  },
  noResultsIconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#f3f4f6',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  noResultsText: {
    fontSize: 20,
    color: '#374151',
    fontWeight: 'bold',
    marginBottom: 8,
  },
  noResultsSubtext: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 20,
  },
  clearSearchButton: {
    backgroundColor: '#c7242c',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  clearSearchText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 14,
  },
  activitySection: {
    marginBottom: 25,
  },
  activityList: {
    paddingHorizontal: 25,
    gap: 12,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 16,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 6,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  activityIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activityContent: {
    flex: 1,
    marginLeft: 14,
  },
  activityTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 4,
  },
  activityDescription: {
    fontSize: 13,
    color: '#6b7280',
    lineHeight: 18,
  },
  activityTimeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  activityTime: {
    fontSize: 12,
    color: '#9ca3af',
    fontWeight: '500',
  },
  tipsSection: {
    paddingHorizontal: 25,
    marginBottom: 20,
  },
  tipCard: {
    flexDirection: 'row',
    padding: 20,
    borderRadius: 16,
    alignItems: 'flex-start',
    gap: 16,
  },
  tipContent: {
    flex: 1,
  },
  tipTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 6,
  },
  tipText: {
    fontSize: 14,
    color: '#4b5563',
    lineHeight: 20,
  },
});

export default HomeScreen;