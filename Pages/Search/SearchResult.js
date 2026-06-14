import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Animated,
  Platform,
  Dimensions,
  Image,
  Modal,
} from 'react-native';
import LottieView from 'lottie-react-native';
import { Picker } from '@react-native-picker/picker';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Colors from '../../utils/Colors';
import API_BASE_URL from '../../api';

const { width } = Dimensions.get('window');

// Filter Modal Component
const FilterModal = ({ 
  visible, onClose, onApply, onClear,
  selectedYear, onYearChange,
  selectedCourse, onCourseChange,
  availableYears, availableCourses
}) => {
  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={modalStyles.modalOverlay}>
        <View style={modalStyles.modalContainer}>
          <View style={modalStyles.modalHeader}>
            <Text style={modalStyles.modalTitle}>Refine Search</Text>
            <TouchableOpacity onPress={onClose} style={modalStyles.closeBtn}>
              <Ionicons name="close" size={24} color="#ffffff" />
            </TouchableOpacity>
          </View>

          <ScrollView 
            style={modalStyles.modalContent}
            contentContainerStyle={{ paddingBottom: Platform.OS === 'ios' ? 100 : 40 }}
            showsVerticalScrollIndicator={false}
          >
            {/* Year Filter */}
            <Text style={modalStyles.filterLabel}>Academic Year</Text>
            <View style={modalStyles.pickerContainer}>
              <Picker
                selectedValue={selectedYear}
                onValueChange={(val) => onYearChange(val)}
                style={modalStyles.picker}
                itemStyle={{ color: '#ffffff' }}
                dropdownIconColor="#ffffff"
              >
                {availableYears.map(y => (
                    <Picker.Item key={y} label={y === 'all' ? 'All Years' : y} value={y} color={Platform.OS === 'ios' ? '#ffffff' : '#ffffff'} />
                ))}
              </Picker>
            </View>

            {/* Course Filter */}
            <Text style={modalStyles.filterLabel}>Course</Text>
            <View style={modalStyles.pickerContainer}>
              <Picker
                selectedValue={selectedCourse}
                onValueChange={(val) => onCourseChange(val)}
                style={modalStyles.picker}
                itemStyle={{ color: '#ffffff' }}
                dropdownIconColor="#ffffff"
              >
                {availableCourses.map(c => (
                    <Picker.Item key={c} label={c === 'all' ? 'All Courses' : c} value={c} color={Platform.OS === 'ios' ? '#ffffff' : '#ffffff'} />
                ))}
              </Picker>
            </View>
          </ScrollView>

          <View style={modalStyles.modalFooter}>
            <TouchableOpacity style={modalStyles.clearBtn} onPress={onClear}>
              <Text style={modalStyles.clearBtnText}>Clear All</Text>
            </TouchableOpacity>
            <TouchableOpacity style={modalStyles.applyBtn} onPress={onApply}>
              <Text style={modalStyles.applyBtnText}>Apply Filters</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const IntelligenceModal = ({ visible, onClose, isLoading, data, type }) => {
  const isSimilarity = type === 'similarity';
  
  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={modalStyles.modalOverlay}>
        <View style={[modalStyles.modalContainer, { minHeight: 450 }]}>
          <View style={modalStyles.modalHeader}>
            <View>
              <Text style={modalStyles.modalTitle}>
                {isSimilarity ? 'Match Check' : 'AI Suggestion'}
              </Text>
              <Text style={{ fontSize: 10, color: Colors.primary, fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: 1 }}>
                {isSimilarity ? 'Searching library...' : 'Generating suggestions...'}
              </Text>
            </View>
            <TouchableOpacity onPress={onClose} style={modalStyles.closeBtn}>
              <Ionicons name="close" size={24} color={Colors.foreground} />
            </TouchableOpacity>
          </View>
          <ScrollView style={modalStyles.modalContent} showsVerticalScrollIndicator={false}>
            {isLoading ? (
              <View style={{ paddingVertical: 40, alignItems: 'center' }}>
                <Text style={{ marginBottom: 10, color: Colors.textSecondary, fontWeight: 'bold', fontSize: 13, textTransform: 'uppercase', letterSpacing: 1 }}>
                   {isSimilarity ? 'Searching for matches...' : 'Generating suggestions...'}
                </Text>
                <LottieView 
                  source={require('../../assets/animations/Ai Loading Thinking.json')}
                  autoPlay
                  loop
                  style={{ width: 180, height: 180 }}
                />
                <Text style={{ marginTop: -10, color: Colors.textDim, fontSize: 11, textAlign: 'center' }}>Please wait a moment</Text>
              </View>
            ) : data ? (
              <View style={{ paddingVertical: 20 }}>
                {isSimilarity ? (
                  <>
                    <View style={{ alignItems: 'center', marginBottom: 30 }}>
                      <View style={{ width: 120, height: 120, borderRadius: 60, borderWidth: 8, borderColor: `${Colors.primary}20`, alignItems: 'center', justifyContent: 'center' }}>
                        <Text style={{ fontSize: 32, fontWeight: '900', color: Colors.primary }}>{Math.round(data.similarity)}%</Text>
                        <Text style={{ fontSize: 10, fontWeight: 'bold', color: Colors.textSecondary, textTransform: 'uppercase' }}>Similarity</Text>
                      </View>
                    </View>
                    {data.match && (
                      <View style={{ backgroundColor: 'rgba(255,255,255,0.03)', padding: 20, borderRadius: 20, borderWidth: 1, borderColor: Colors.border, marginBottom: 25 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12, gap: 10 }}>
                          <Ionicons name="alert-circle" size={20} color={Colors.primary} />
                          <Text style={{ fontSize: 13, fontWeight: '900', color: Colors.foreground, textTransform: 'uppercase', letterSpacing: 1 }}>Similar Title Found</Text>
                        </View>
                        <Text style={{ fontSize: 14, color: Colors.textSecondary, fontWeight: 'bold', fontStyle: 'italic', lineHeight: 20 }}>"{data.match.title}"</Text>
                      </View>
                    )}
                    <View style={{ marginBottom: 30 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 15, gap: 10 }}>
                        <Ionicons name="bulb-outline" size={20} color={Colors.primary} />
                        <Text style={{ fontSize: 13, fontWeight: '900', color: Colors.foreground, textTransform: 'uppercase', letterSpacing: 1 }}>AI Suggestion</Text>
                      </View>
                      <View style={{ backgroundColor: 'rgba(255,255,255,0.03)', padding: 20, borderRadius: 20, borderWidth: 1, borderColor: Colors.border }}>
                        <Text style={{ fontSize: 14, color: Colors.textSecondary, lineHeight: 24 }}>{data.recommendation}</Text>
                      </View>
                    </View>
                  </>
                ) : (
                  <View style={{ marginBottom: 30 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 15, gap: 10 }}>
                      <Ionicons name="sparkles" size={20} color={Colors.primary} />
                      <Text style={{ fontSize: 13, fontWeight: '900', color: Colors.foreground, textTransform: 'uppercase', letterSpacing: 1 }}>AI Suggestions</Text>
                    </View>
                    <View style={{ backgroundColor: 'rgba(255,255,255,0.03)', padding: 20, borderRadius: 20, borderWidth: 1, borderColor: Colors.border }}>
                      <Text style={{ fontSize: 14, color: Colors.textSecondary, lineHeight: 24 }}>{data}</Text>
                    </View>
                  </View>
                )}
              </View>
            ) : null}
          </ScrollView>
          {!isLoading && data && (
            <View style={modalStyles.modalFooter}>
              <TouchableOpacity style={[modalStyles.applyBtn, { flex: 1 }]} onPress={onClose}>
                <Text style={modalStyles.applyBtnText}>Done</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
};

const SearchResultScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  
  const initialParams = route.params || {};
  const { query } = initialParams;
  
  const [results, setResults] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Filter States
  const [isFilterVisible, setIsFilterVisible] = useState(false);
  const [selectedYear, setSelectedYear] = useState(initialParams.year || 'all');
  const [selectedCourse, setSelectedCourse] = useState(initialParams.course || initialParams.category || 'all');
  const [selectedType, setSelectedType] = useState(initialParams.type || 'all');

  const [availableYears, setAvailableYears] = useState(['all']);
  const [availableCourses, setAvailableCourses] = useState(['all']);

  const [aiRecommendation, setAiRecommendation] = useState(null);
  const [localComparison, setLocalComparison] = useState(null);
  const [isIntelligenceLoading, setIsIntelligenceLoading] = useState(false);
  const [intelligenceType, setIntelligenceType] = useState('similarity'); 
  const [isIntelligenceModalOpen, setIsIntelligenceModalOpen] = useState(false);

  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    fetchFilters();
  }, []);

  const fetchFilters = async () => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      const headers = { 'Authorization': `Bearer ${token}` };

      const [yearsRes, coursesRes] = await Promise.all([
        fetch(`${API_BASE_URL}/thesis/years`, { headers }),
        fetch(`${API_BASE_URL}/thesis/courses`, { headers })
      ]);

      if (yearsRes.ok) {
        const years = await yearsRes.json();
        setAvailableYears(['all', ...years]);
      }
      if (coursesRes.ok) {
        const courses = await coursesRes.json();
        setAvailableCourses(['all', ...courses]);
      }
    } catch (err) {
      console.error('Error fetching filters:', err);
    }
  };

  useEffect(() => {
    fetchSearchResults();
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();
  }, [query, selectedYear, selectedCourse, selectedType]);

  const fetchSearchResults = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const token = await AsyncStorage.getItem('userToken');
      const headers = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;
      
      const params = [];
      if (query) params.push(`query=${encodeURIComponent(query)}`);
      if (selectedYear && selectedYear !== 'all') params.push(`year=${encodeURIComponent(selectedYear)}`);
      if (selectedCourse && selectedCourse !== 'all') params.push(`course=${encodeURIComponent(selectedCourse)}`);
      if (selectedType && selectedType !== 'all') params.push(`type=${encodeURIComponent(selectedType)}`);

      const response = await fetch(`${API_BASE_URL}/thesis/search?${params.join('&')}`, {
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

  const applyFilters = () => {
    setIsFilterVisible(false);
    // fetchSearchResults is triggered by dependency array in useEffect
  };

  const clearFilters = () => {
    setSelectedYear('all');
    setSelectedCourse('all');
    setSelectedType('all');
    setIsFilterVisible(false);
  };

  const handleRecommendByAi = async () => {
    if (!query) return;
    
    setIntelligenceType('ai');
    setIsIntelligenceModalOpen(true);
    setIsIntelligenceLoading(true);
    setAiRecommendation(null);

    try {
      const token = await AsyncStorage.getItem('userToken');
      const headers = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;
      
      const response = await fetch(`${API_BASE_URL}/thesis/recommendations`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          query,
          prompt: query
        })
      });

      const data = await response.json();
      
      if (response.ok) {
          setAiRecommendation(data.recommendation);
          
          if (token) {
              fetch(`${API_BASE_URL}/user/ai-history`, {
                  method: 'POST',
                  headers,
                  body: JSON.stringify({ prompt: query, recommendation: data.recommendation })
              }).catch(e => console.log('Silently failed to save AI history'));
          }
      } else {
          alert('Failed to get recommendation');
      }
    } catch (error) {
      console.error('AI Recommendation error:', error);
      alert('Network error while getting AI recommendation.');
    } finally {
      setIsIntelligenceLoading(false);
    }
  };

  const handleCompareLocal = async (thesisTitle) => {
    const targetQuery = thesisTitle || query;
    if (!targetQuery || targetQuery.trim().split(/\s+/).length < 3) {
      alert('The title/content must be at least 3 words to check similarity.');
      return;
    }

    setAiRecommendation(null);
    setLocalComparison(null);
    setIntelligenceType('similarity');
    setIsIntelligenceLoading(true);
    setIsIntelligenceModalOpen(true);

    try {
      const token = await AsyncStorage.getItem('userToken');
      const headers = { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}` 
      };
      
      const response = await fetch(`${API_BASE_URL}/thesis/compare-local`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ title: targetQuery })
      });

      const data = await response.json();
      
      if (response.ok) {
        setLocalComparison(data);
      } else {
        alert(data.message || 'Failed to check similarity');
        setIsIntelligenceModalOpen(false);
      }
    } catch (error) {
      console.error('Local Comparison error:', error);
      alert('Network error while checking similarity.');
      setIsIntelligenceModalOpen(false);
    } finally {
      setIsIntelligenceLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Intelligence Modal (Shared for AI and Similarity) */}
      <IntelligenceModal 
        visible={isIntelligenceModalOpen}
        onClose={() => setIsIntelligenceModalOpen(false)}
        isLoading={isIntelligenceLoading}
        data={intelligenceType === 'similarity' ? localComparison : aiRecommendation}
        type={intelligenceType}
      />

      {/* Header Area */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={Colors.foreground} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Search Results</Text>
        <TouchableOpacity style={styles.filterTrigger} onPress={() => setIsFilterVisible(true)}>
          <Ionicons name="options" size={22} color={Colors.foreground} />
        </TouchableOpacity>
      </View>

      <FilterModal 
        visible={isFilterVisible}
        onClose={() => setIsFilterVisible(false)}
        selectedYear={selectedYear}
        onYearChange={setSelectedYear}
        selectedCourse={selectedCourse}
        onCourseChange={setSelectedCourse}
        onApply={applyFilters}
        onClear={clearFilters}
        availableYears={availableYears}
        availableCourses={availableCourses}
      />

      <LinearGradient colors={[Colors.background, Colors.surface, Colors.background]} style={styles.gradientBackground}>
        <ScrollView 
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* Main Search Loading */}
          {isLoading && (
            <View style={{ paddingVertical: 80, alignItems: 'center' }}>
               <Text style={{ color: Colors.textSecondary, fontWeight: '900', fontSize: 12, letterSpacing: 2, marginBottom: 10 }}>ARCHIVE QUERY IN PROGRESS</Text>
               <LottieView 
                  source={require('../../assets/animations/Ai Loading Thinking.json')}
                  autoPlay
                  loop
                  style={{ width: 220, height: 220 }}
               />
            </View>
          )}

          {!isLoading && (
            <Animated.View style={{ opacity: fadeAnim }}>
            
            {/* Active Filters / Query Info */}
            <View style={styles.infoContainer}>
                <View style={styles.infoTopRow}>
                    {query && (
                        <View style={styles.queryTag}>
                            <Text style={styles.queryTagText}>Search: "{query}"</Text>
                        </View>
                    )}
                    <TouchableOpacity style={styles.pageFilterBtn} onPress={() => setIsFilterVisible(true)}>
                        <Ionicons name="filter" size={16} color="#fff" />
                        <Text style={styles.pageFilterBtnText}>Filters</Text>
                    </TouchableOpacity>
                </View>

                <View style={styles.filterRow}>
                    {selectedYear !== 'all' && (
                        <View style={styles.filterBadge}>
                            <Text style={styles.filterBadgeText}>Year: {selectedYear}</Text>
                        </View>
                    )}
                    {selectedCourse !== 'all' && (
                        <View style={styles.filterBadge}>
                            <Text style={styles.filterBadgeText}>Dept: {selectedCourse}</Text>
                        </View>
                    )}
                </View>
            </View>

            {/* AI Panel - Only if query exists */}
            {query && !isLoading && (
              <View style={styles.aiPanel}>
                <View style={styles.aiHeader}>
                  <View style={styles.aiIconContainer}>
                    <Ionicons name="hardware-chip" size={22} color="#7f0000" />
                  </View>
                  <View style={styles.aiHeaderTextContainer}>
                     <Text style={styles.aiTitle}>Research Intelligence Portal</Text>
                     <Text style={styles.aiSubtitle}>Search-driven analysis and title recommendations</Text>
                  </View>
                </View>
                
                 {aiRecommendation ? (
                    <View style={styles.aiResultContainer}>
                        <Text style={styles.aiResultText}>{aiRecommendation}</Text>
                    </View>
                ) : (
                    <View style={{ flexDirection: 'row', gap: 10 }}>
                        <TouchableOpacity 
                            style={[styles.aiButton, { flex: 1, backgroundColor: `${Colors.primary}15`, borderWidth: 1, borderColor: `${Colors.primary}30` }]}
                            onPress={() => handleCompareLocal()}
                            disabled={isIntelligenceLoading && intelligenceType === 'similarity'}
                        >
                            <Ionicons name="search" size={18} color={Colors.primary} style={{ marginRight: 8 }} />
                            <Text style={[styles.aiButtonText, { color: Colors.primary }]}>Check Similarity</Text>
                        </TouchableOpacity>

                        <TouchableOpacity 
                            style={[styles.aiButton, { flex: 1 }]}
                            onPress={handleRecommendByAi}
                            disabled={isIntelligenceLoading && intelligenceType === 'ai'}
                        >
                            <Ionicons name="sparkles" size={18} color="#fff" style={{ marginRight: 8 }} />
                            <Text style={styles.aiButtonText}>AI Suggest</Text>
                        </TouchableOpacity>
                    </View>
                )}
              </View>
            )}

            {/* Error Message */}
            {error && (
              <View style={styles.errorContainer}>
                 <Ionicons name="alert-circle" size={24} color="#fecaca" />
                 <Text style={styles.errorText}>{error}</Text>
              </View>
            )}

             {/* Results List */}
             <View style={styles.resultsContainer}>
                 {results.length > 0 ? (
                    results.map((thesis) => (
                        <TouchableOpacity 
                            key={thesis.id} 
                            style={styles.thesisCard}
                            onPress={() => navigation.navigate('ThesisDetail', { thesisId: thesis._id })}
                            activeOpacity={0.8}
                        >
                            <View style={styles.thesisCardHeader}>
                               <View style={styles.yearBadge}>
                                  <Text style={styles.yearText}>
                                      {thesis.year_range && thesis.year_range.toLowerCase() !== 'unknown' ? thesis.year_range : 'N/A'}
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
                    <View style={styles.emptyContainer}>
                       <View style={styles.emptyIconContainer}>
                           <Ionicons name="document-outline" size={48} color="rgba(255,255,255,0.3)" />
                       </View>
                       <Text style={styles.emptyTitle}>No results found</Text>
                       <Text style={styles.emptySubtitle}>Try adjusting your search query or filters.</Text>
                    </View>
                 )}
               </View>
            </Animated.View>
           )}
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
  filterTrigger: { padding: 5, marginRight: -5 },
  gradientBackground: { flex: 1 },
  scrollContent: { paddingHorizontal: 20, paddingVertical: 20 },
  infoContainer: { marginBottom: 20 },
  infoTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  pageFilterBtn: { 
      flexDirection: 'row', 
      alignItems: 'center', 
      backgroundColor: `${Colors.primary}15`, 
      paddingHorizontal: 10, 
      paddingVertical: 6, 
      borderRadius: 8,
      borderWidth: 1,
      borderColor: `${Colors.primary}30`
  },
  pageFilterBtnText: { color: Colors.primary, fontSize: 12, fontWeight: 'bold', marginLeft: 4 },
  queryTag: {
      backgroundColor: Colors.card,
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: Colors.border,
  },
  queryTagText: { color: Colors.foreground, fontWeight: 'bold', fontSize: 12 },
  filterRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  filterBadge: {
      backgroundColor: `${Colors.primary}15`,
      borderWidth: 1,
      borderColor: `${Colors.primary}30`,
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 20,
  },
  filterBadgeText: { color: Colors.primary, fontSize: 11, fontWeight: 'bold', textTransform: 'uppercase' },
  aiPanel: {
      backgroundColor: Colors.card,
      borderRadius: 20,
      padding: 20,
      marginBottom: 20,
      borderWidth: 1,
      borderColor: Colors.border,
      ...Platform.select({
          ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8 },
          android: { elevation: 5 },
      }),
  },
  aiHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 15 },
  aiIconContainer: { width: 40, height: 40, borderRadius: 12, backgroundColor: `${Colors.primary}15`, borderWidth: 1, borderColor: `${Colors.primary}30`, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  aiHeaderTextContainer: { flex: 1 },
  aiTitle: { fontSize: 15, fontWeight: 'bold', color: Colors.foreground, marginBottom: 2 },
  aiSubtitle: { fontSize: 12, color: Colors.textSecondary },
  aiButton: { flexDirection: 'row', backgroundColor: Colors.primary, borderRadius: 12, paddingVertical: 12, alignItems: 'center', justifyContent: 'center' },
  aiButtonText: { color: Colors.background, fontWeight: 'bold', fontSize: 14 },
  aiResultContainer: { backgroundColor: 'rgba(255,255,255,0.03)', padding: 15, borderRadius: 12, borderWidth: 1, borderColor: Colors.border },
  aiResultText: { fontSize: 14, color: Colors.textSecondary, lineHeight: 22 },
  errorContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(239,68,68,0.1)', padding: 15, borderRadius: 12, marginBottom: 20, borderWidth: 1, borderColor: 'rgba(239,68,68,0.2)' },
  errorText: { color: '#f87171', marginLeft: 10, flex: 1 },
  loadingContainer: { alignItems: 'center', paddingVertical: 60 },
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
          android: { elevation: 4 },
      }),
  },
  thesisCardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  yearBadge: { backgroundColor: `${Colors.primary}15`, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, borderWidth: 1, borderColor: `${Colors.primary}30` },
  yearText: { color: Colors.primary, fontSize: 10, fontWeight: 'bold', textTransform: 'uppercase' },
  thesisTitle: { fontSize: 15, fontWeight: 'bold', color: Colors.foreground, marginBottom: 8, lineHeight: 22 },
  thesisAbstract: { fontSize: 13, color: Colors.textSecondary, lineHeight: 18, marginBottom: 15 },
  thesisFooter: { flexDirection: 'row', alignItems: 'center' },
  thesisId: { fontSize: 11, fontWeight: 'bold', color: Colors.textDim, marginLeft: 6, textTransform: 'uppercase', letterSpacing: 1 },
  emptyContainer: { alignItems: 'center', paddingVertical: 80 },
  emptyIconContainer: { width: 80, height: 80, borderRadius: 40, backgroundColor: Colors.card, alignItems: 'center', justifyContent: 'center', marginBottom: 15, borderWidth: 1, borderColor: Colors.border },
  emptyTitle: { fontSize: 20, fontWeight: 'bold', color: Colors.foreground, marginBottom: 8 },
  emptySubtitle: { fontSize: 14, color: Colors.textSecondary, textAlign: 'center' }
});

const modalStyles = StyleSheet.create({
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
    modalContainer: { 
        backgroundColor: Colors.surface, 
        borderTopLeftRadius: 30, 
        borderTopRightRadius: 30, 
        borderTopWidth: 1,
        borderColor: Colors.border,
        minHeight: Platform.OS === 'ios' ? 500 : 400,
        maxHeight: '92%' 
    },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 25, borderBottomWidth: 1, borderBottomColor: Colors.border },
    modalTitle: { fontSize: 18, fontWeight: '900', color: Colors.foreground },
    closeBtn: { padding: 5 },
    modalContent: { paddingHorizontal: 25 },
    filterLabel: { fontSize: 11, fontWeight: '900', color: Colors.textSecondary, marginBottom: 12, marginTop: 10, textTransform: 'uppercase', letterSpacing: 2 },
    pickerContainer: { 
        backgroundColor: Colors.card, 
        borderRadius: 12, 
        borderWidth: 1, 
        borderColor: Colors.border, 
        marginBottom: 25, 
        overflow: Platform.OS === 'ios' ? 'visible' : 'hidden',
        minHeight: Platform.OS === 'ios' ? 200 : 58,
        justifyContent: 'center',
    },
    picker: { 
        height: Platform.OS === 'ios' ? 200 : 58, 
        width: '100%',
        color: Colors.foreground,
    },
    modalFooter: { 
        flexDirection: 'row', 
        paddingHorizontal: 25, 
        gap: 12, 
        paddingTop: 15, 
        paddingBottom: Platform.OS === 'ios' ? 45 : 25,
        backgroundColor: Colors.surface,
        borderTopWidth: 1,
        borderTopColor: Colors.border,
    },
    clearBtn: { flex: 1, paddingVertical: 15, alignItems: 'center', justifyContent: 'center', borderRadius: 12, borderWidth: 1, borderColor: Colors.border },
    clearBtnText: { color: Colors.textSecondary, fontWeight: 'bold' },
    applyBtn: { flex: 2, backgroundColor: Colors.primary, paddingVertical: 15, alignItems: 'center', justifyContent: 'center', borderRadius: 12 },
    applyBtnText: { color: Colors.background, fontWeight: 'bold' },
});

export default SearchResultScreen;
