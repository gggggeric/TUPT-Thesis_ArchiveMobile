import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  TextInput,
  ActivityIndicator,
  Animated,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import API_BASE_URL from '../../api';
import Colors from '../../utils/Colors';

const SmartSearchScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  
  const initialQuery = route.params?.query || '';
  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [results, setResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // AI Feature States
  const [aiRecommendation, setAiRecommendation] = useState(null);
  const [isLoadingAi, setIsLoadingAi] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();
    
    if (initialQuery) {
        handleSearch();
    }
  }, [initialQuery]);

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    
    setIsLoading(true);
    setError(null);
    setAiRecommendation(null); // Reset AI rec on new search

    try {
      const token = await AsyncStorage.getItem('userToken'); // Assuming this is how auth is stored
      const headers = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;
      
      const response = await fetch(`${API_BASE_URL}/thesis/search?query=${encodeURIComponent(searchQuery)}`, {
          headers
      });
      
      const data = await response.json();
      
      if (response.ok) {
          setResults(data);
      } else {
          setError(data.message || 'Error occurred during search');
      }
    } catch (err) {
      console.error('Search error:', err);
      setError('Network error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRecommendByAi = async () => {
    if (!searchQuery.trim()) return;
    
    setIsLoadingAi(true);
    setAiRecommendation(null);

    try {
      const token = await AsyncStorage.getItem('userToken');
      const headers = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;
      
      const response = await fetch(`${API_BASE_URL}/thesis/recommendations`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          prompt: `I am looking for theses related to "${searchQuery}". Based on this query, please recommend a better or more specific thesis title. Your response MUST include three distinct sections formatted exactly like this:\n\nFunctional Requirements:\n[Your text here]\n\nConclusion:\n[Your text here]\n\nRecommendations:\n[Your text here]`
        })
      });

      const data = await response.json();
      
      if (response.ok) {
          setAiRecommendation(data.recommendation);
          
          if (token) {
              // Try to save to history quietly
              fetch(`${API_BASE_URL}/user/ai-history`, {
                  method: 'POST',
                  headers,
                  body: JSON.stringify({ prompt: searchQuery, recommendation: data.recommendation })
              }).catch(e => console.log('Silently failed to save AI history'));
          }
      } else {
          alert('Failed to get recommendation: ' + (data.message || 'Unknown error'));
      }
    } catch (error) {
      console.error('AI Recommendation error:', error);
      alert('Network error while getting AI recommendation.');
    } finally {
      setIsLoadingAi(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={Colors.foreground} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>AI Search</Text>
        <View style={{ width: 24 }} />
      </View>

      <LinearGradient colors={[Colors.background, Colors.surface]} style={styles.gradientBackground}>
        {/* Search Input Area */}
        <View style={styles.searchContainer}>
          <View style={styles.searchInputWrapper}>
            <Ionicons name="search" size={20} color="#9ca3af" style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search by title, abstract, author..."
              placeholderTextColor="#9ca3af"
              value={searchQuery}
              onChangeText={setSearchQuery}
              onSubmitEditing={handleSearch}
              returnKeyType="search"
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')} style={styles.clearIcon}>
                <Ionicons name="close-circle" size={18} color="#9ca3af" />
              </TouchableOpacity>
            )}
          </View>
        </View>

        <ScrollView 
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          <Animated.View style={{ opacity: fadeAnim }}>
              
            {/* AI Recommendation Feature Panel */}
            {searchQuery.length > 0 && !isLoading && (
              <View style={styles.aiPanel}>
                <View style={styles.aiHeader}>
                  <View style={styles.aiIconContainer}>
                    <Ionicons name="hardware-chip" size={22} color={Colors.primary} />
                  </View>
                  <View style={styles.aiHeaderTextContainer}>
                     <Text style={styles.aiTitle}>AI Suggestions</Text>
                     <Text style={styles.aiSubtitle}>Get title ideas based on your search</Text>
                  </View>
                </View>
                
                {aiRecommendation ? (
                    <View style={styles.aiResultContainer}>
                        <Text style={styles.aiResultText}>{aiRecommendation}</Text>
                    </View>
                ) : (
                    <TouchableOpacity 
                        style={styles.aiButton}
                        onPress={handleRecommendByAi}
                        disabled={isLoadingAi}
                    >
                        {isLoadingAi ? (
                            <ActivityIndicator size="small" color="#fff" style={{ marginRight: 8 }} />
                        ) : (
                            <Ionicons name="sparkles" size={18} color="#fff" style={{ marginRight: 8 }} />
                        )}
                        <Text style={styles.aiButtonText}>
                            {isLoadingAi ? 'Creating suggestions...' : 'Get AI Suggestions'}
                        </Text>
                    </TouchableOpacity>
                )}
              </View>
            )}

            {/* Error Message */}
            {error && (
              <View style={styles.errorContainer}>
                 <Ionicons name="alert-circle" size={24} color="#ef4444" />
                 <Text style={styles.errorText}>{error}</Text>
              </View>
            )}

            {/* Loading Indicator */}
            {isLoading ? (
               <View style={styles.loadingContainer}>
                   <ActivityIndicator size="large" color={Colors.primary} />
                   <Text style={styles.loadingText}>Searching theses...</Text>
               </View>
            ) : (
               // Results List
               <View style={styles.resultsContainer}>
                 {results.length > 0 ? (
                    results.map((thesis) => (
                        <TouchableOpacity 
                            key={thesis.id} 
                            style={styles.thesisCard}
                            onPress={() => navigation.navigate('ThesisDetail', { thesisId: thesis.id })}
                            activeOpacity={0.7}
                        >
                            <View style={styles.thesisCardHeader}>
                               <View style={styles.yearBadge}>
                                  <Text style={styles.yearText}>
                                      {thesis.year_range && thesis.year_range.toLowerCase() !== 'unknown' ? thesis.year_range : 'Unknown'}
                                  </Text>
                               </View>
                               <Ionicons name="school-outline" size={18} color="#9ca3af" />
                            </View>
                            <Text style={styles.thesisTitle} numberOfLines={2}>{thesis.title}</Text>
                            <Text style={styles.thesisAbstract} numberOfLines={3}>{thesis.abstract}</Text>
                            <View style={styles.thesisFooter}>
                                <Ionicons name="document-text-outline" size={14} color="#9ca3af" />
                                <Text style={styles.thesisId}>{thesis.id}</Text>
                            </View>
                        </TouchableOpacity>
                    ))
                 ) : (
                    // Initial State / Empty State
                    searchQuery.length > 0 && !error ? (
                        <View style={styles.emptyContainer}>
                           <View style={styles.emptyIconContainer}>
                               <Ionicons name="document-outline" size={48} color="#d1d5db" />
                           </View>
                           <Text style={styles.emptyTitle}>No results found</Text>
                           <Text style={styles.emptySubtitle}>Try adjusting your search query.</Text>
                        </View>
                    ) : null
                 )}
               </View>
            )}

          </Animated.View>
        </ScrollView>
      </LinearGradient>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: Platform.OS === 'ios' ? 50 : 30,
    paddingBottom: 15,
    paddingHorizontal: 20,
    backgroundColor: Colors.background,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  backButton: { padding: 5, marginLeft: -5 },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: Colors.foreground },
  gradientBackground: { flex: 1 },
  searchContainer: { padding: 20 },
  searchInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.card,
    borderRadius: 16,
    paddingHorizontal: 15,
    height: 50,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Platform.select({
        ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 4 },
        android: { elevation: 4 }
    })
  },
  searchIcon: { marginRight: 10 },
  searchInput: { flex: 1, fontSize: 16, color: Colors.foreground },
  clearIcon: { padding: 5 },
  scrollContent: { paddingHorizontal: 20, paddingBottom: 40 },
  aiPanel: {
      backgroundColor: Colors.card,
      borderRadius: 20,
      padding: 20,
      marginBottom: 20,
      borderWidth: 1,
      borderColor: Colors.border,
      ...Platform.select({
          ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8 },
          android: { elevation: 5 }
      })
  },
  aiHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 15 },
  aiIconContainer: { width: 40, height: 40, borderRadius: 12, backgroundColor: `${Colors.primary}15`, borderWidth: 1, borderColor: `${Colors.primary}30`, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  aiHeaderTextContainer: { flex: 1 },
  aiTitle: { fontSize: 15, fontWeight: 'bold', color: Colors.foreground, marginBottom: 2 },
  aiSubtitle: { fontSize: 12, color: Colors.textSecondary },
  aiButton: { flexDirection: 'row', backgroundColor: Colors.primary, borderRadius: 12, paddingVertical: 12, alignItems: 'center', justifyContent: 'center' },
  aiButtonText: { color: Colors.background, fontWeight: 'bold', fontSize: 14 },
  aiResultContainer: { backgroundColor: 'rgba(255,255,255,0.04)', padding: 15, borderRadius: 12, borderWidth: 1, borderColor: Colors.border },
  aiResultText: { fontSize: 14, color: Colors.textSecondary, lineHeight: 22 },
  errorContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(239,68,68,0.1)', padding: 15, borderRadius: 12, marginBottom: 20, borderWidth: 1, borderColor: 'rgba(239,68,68,0.2)' },
  errorText: { color: '#f87171', marginLeft: 10, flex: 1 },
  loadingContainer: { alignItems: 'center', paddingVertical: 40 },
  loadingText: { marginTop: 15, color: Colors.textSecondary, fontWeight: '600' },
  resultsContainer: { gap: 15 },
  thesisCard: {
      backgroundColor: Colors.card,
      borderRadius: 16,
      padding: 20,
      borderWidth: 1,
      borderColor: Colors.border,
      ...Platform.select({
          ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 6 },
          android: { elevation: 4 }
      })
  },
  thesisCardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  yearBadge: { backgroundColor: `${Colors.primary}15`, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, borderWidth: 1, borderColor: `${Colors.primary}30` },
  yearText: { color: Colors.primary, fontSize: 10, fontWeight: 'bold', textTransform: 'uppercase' },
  thesisTitle: { fontSize: 15, fontWeight: 'bold', color: Colors.foreground, marginBottom: 8, lineHeight: 22 },
  thesisAbstract: { fontSize: 13, color: Colors.textSecondary, lineHeight: 18, marginBottom: 15 },
  thesisFooter: { flexDirection: 'row', alignItems: 'center' },
  thesisId: { fontSize: 11, fontWeight: 'bold', color: Colors.textDim, marginLeft: 6, textTransform: 'uppercase', letterSpacing: 1 },
  emptyContainer: { alignItems: 'center', paddingVertical: 50 },
  emptyIconContainer: { width: 80, height: 80, borderRadius: 40, backgroundColor: Colors.card, alignItems: 'center', justifyContent: 'center', marginBottom: 15, borderWidth: 1, borderColor: Colors.border },
  emptyTitle: { fontSize: 20, fontWeight: 'bold', color: Colors.foreground, marginBottom: 8 },
  emptySubtitle: { fontSize: 14, color: Colors.textSecondary }
});

export default SmartSearchScreen;
