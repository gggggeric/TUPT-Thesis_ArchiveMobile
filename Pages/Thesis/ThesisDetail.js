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
  Image,
  Dimensions,
  Modal,
} from 'react-native';
import LottieView from 'lottie-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import API_BASE_URL from '../../api';
import Colors from '../../utils/Colors';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const DOC_WIDTH = 600; // Logical width of the document

const ThesisDetailScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { thesisId } = route.params;

  const [thesis, setThesis] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isZoomed, setIsZoomed] = useState(false);
  const [isLoadingLocal, setIsLoadingLocal] = useState(false);
  const [localComparison, setLocalComparison] = useState(null);
  const [isComparisonModalOpen, setIsComparisonModalOpen] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  // Calculate scaling to fit screen
  const horizontalPadding = 30;
  const availableWidth = SCREEN_WIDTH - horizontalPadding;
  const fitScale = availableWidth / DOC_WIDTH;
  const currentScale = isZoomed ? 1 : fitScale;

  useEffect(() => {
    fetchThesisDetails();
  }, [thesisId]);

  const fetchThesisDetails = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const token = await AsyncStorage.getItem('userToken');
      const headers = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const response = await fetch(`${API_BASE_URL}/thesis/find-one/${thesisId}`, { headers });
      const data = await response.json();

      if (response.ok) {
        setThesis(data);
        saveToRecentHistory(data); // Save to history when loaded
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }).start();
      } else {
        setError(data.message || 'Thesis not found');
      }
    } catch (err) {
      console.error('Error fetching thesis:', err);
      setError('Network error getting thesis details');
    } finally {
      setIsLoading(false);
    }
  };

  const saveToRecentHistory = async (thesisData) => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      
      // 1. Save to Backend (Database)
      if (token) {
        fetch(`${API_BASE_URL}/user/session-history`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            id: thesisData._id || thesisData.id,
            title: thesisData.title,
            year: thesisData.year_range || thesisData.year || 'Unknown'
          })
        }).catch(err => console.log('Silently failed to save session history to DB', err));
      }

      // 2. Save to Local fallback (AsyncStorage)
      const recentStr = await AsyncStorage.getItem('recent_theses');
      let recentList = recentStr ? JSON.parse(recentStr) : [];
      
      const newItem = {
        id: thesisData._id || thesisData.id,
        title: thesisData.title,
        year: thesisData.year_range || thesisData.year || 'Unknown'
      };

      recentList = recentList.filter(item => item.id !== newItem.id);
      recentList.unshift(newItem);
      recentList = recentList.slice(0, 10);

      await AsyncStorage.setItem('recent_theses', JSON.stringify(recentList));
    } catch (err) {
      console.log('Error saving thesis to history:', err);
    }
  };

  const handleCompareLocal = async () => {
    if (!thesis || !thesis.title) return;
    
    setIsLoadingLocal(true);
    setIsComparisonModalOpen(true);
    setLocalComparison(null);

    try {
      const token = await AsyncStorage.getItem('userToken');
      const response = await fetch(`${API_BASE_URL}/thesis/compare-local`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ title: thesis.title })
      });

      const data = await response.json();
      if (response.ok) {
        setLocalComparison(data);
      } else {
        alert(data.message || 'Failed to check similarity');
        setIsComparisonModalOpen(false);
      }
    } catch (error) {
      console.error('Local Comparison error:', error);
      alert('Network error while checking similarity.');
      setIsComparisonModalOpen(false);
    } finally {
      setIsLoadingLocal(false);
    }
  };

  const extractAuthors = (t) => {
    if (!t) return 'Unknown Author';
    if (t.author) return t.author;
    const match = t.abstract?.match(/(?:Researcher|Author|By|Researchers):\s*([^.]+)/i);
    return match ? match[1].trim() : 'Academic Research Group';
  };

  const toggleZoom = () => {
    setIsZoomed(!isZoomed);
  };

  if (isLoading) {
      return (
          <View style={[styles.container, styles.centerAll, { backgroundColor: Colors.background }]}>
             <ActivityIndicator size="large" color={Colors.primary} />
          </View>
      )
  }

  if (error || !thesis) {
      return (
          <View style={[styles.container, styles.centerAll]}>
              <Ionicons name="alert-circle" size={48} color="#ef4444" style={{marginBottom: 10}}/>
              <Text style={styles.errorText}>{error || 'Could not load thesis'}</Text>
              <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
                  <Text style={styles.backBtnText}>Go Back</Text>
              </TouchableOpacity>
          </View>
      )
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerBackBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={Colors.foreground} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Document Viewer</Text>
        <View style={{ flexDirection: 'row', gap: 15 }}>
          <TouchableOpacity onPress={handleCompareLocal}>
            <Ionicons name="shield-checkmark-outline" size={22} color={Colors.primary} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.zoomToggle} onPress={toggleZoom}>
            <Ionicons name={isZoomed ? "contract" : "expand"} size={22} color={Colors.foreground} />
          </TouchableOpacity>
        </View>
      </View>

      <LinearGradient colors={[Colors.background, Colors.surface]} style={styles.gradientBackground}>
        <ScrollView 
          showsVerticalScrollIndicator={false}
          showsHorizontalScrollIndicator={false}
          maximumZoomScale={2}
          minimumZoomScale={0.5}
          contentContainerStyle={[
            styles.scrollContent,
            { width: isZoomed ? DOC_WIDTH + 60 : SCREEN_WIDTH }
          ]}
        >
          <IntelligenceModal 
            visible={isComparisonModalOpen}
            onClose={() => setIsComparisonModalOpen(false)}
            isLoading={isLoadingLocal}
            data={localComparison}
            type="similarity"
          />

          <Animated.View style={{ 
            opacity: fadeAnim, 
            alignItems: 'center',
            transform: [{ scale: currentScale }],
            width: DOC_WIDTH,
          }}>
            
            {/* Skeuomorphic Paper Card */}
            <View style={[styles.paperCard, { width: DOC_WIDTH }]}>
                
                {/* TUP Watermark */}
                <View style={styles.watermarkContainer} pointerEvents="none">
                    <Image 
                       source={require('../../assets/tup-logo.png')} 
                       style={styles.watermarkImage} 
                    />
                </View>

                {/* Staple Mark */}
                <View style={styles.stapleMark} />

                {/* Institutional Letterhead */}
                <View style={styles.letterhead}>
                    <Image source={require('../../assets/tup-logo.png')} style={styles.letterheadLogo} />
                    <Text style={styles.letterheadTitle}>Technological University of the Philippines</Text>
                    <Text style={styles.letterheadSubtitle}>Taguig City Campus</Text>
                    <View style={styles.letterheadDivider} />
                    <Text style={styles.letterheadFooter}>Office of the University Registrar • TUPT-Thesis Archive</Text>
                    
                    {/* Archive Stamp */}
                    <View style={styles.archiveStamp}>
                        <Text style={styles.archiveStampText}>APPROVED COPY</Text>
                    </View>
                </View>

                {/* Metadata Row */}
                <View style={styles.metadataRow}>
                    <View style={styles.metaCol}>
                        <Text style={styles.metaLabel}>Reference ID</Text>
                        <Text style={styles.metaValue}>{thesis.id}</Text>
                    </View>
                    <View style={[styles.metaCol, {alignItems: 'flex-end'}]}>
                        <Text style={styles.metaLabel}>Certified Date</Text>
                        <Text style={styles.metaValue}>
                            {new Date(thesis.createdAt || Date.now()).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                        </Text>
                    </View>
                </View>

                {/* Main Title Section */}
                <View style={styles.titleSection}>
                    <Text style={styles.thesisTitleMain}>{thesis.title}</Text>
                    <View style={styles.extractBadgeContainer}>
                        <View style={styles.extractDivider} />
                        <Text style={styles.extractText}>Abstract Overview</Text>
                        <View style={styles.extractDivider} />
                    </View>
                    <View style={styles.categoryBadge}>
                        <Text style={styles.categoryText}>{thesis.course || 'Information Technology Department'}</Text>
                    </View>
                </View>

                {/* Author Section */}
                <View style={styles.authorSection}>
                    <View style={styles.sectionDividerRow}>
                        <Text style={styles.sectionDividerText}>RESEARCHERS / AUTHORS</Text>
                        <View style={styles.sectionDividerLine} />
                    </View>
                    <Text style={styles.authorText}>{extractAuthors(thesis)}</Text>
                    <Text style={styles.facultyText}>Faculty of Computing and Engineering</Text>
                </View>

                {/* Abstract Section */}
                <View style={styles.abstractSection}>
                    <View style={styles.sectionDividerRow}>
                        <Text style={styles.sectionDividerText}>SUMMARY</Text>
                        <View style={styles.sectionDividerLine} />
                    </View>
                    
                    {thesis.abstract?.split('\n').map((para, i) => (
                        <View key={i} style={styles.paragraphContainer}>
                            {i === 0 && para.length > 0 ? (
                                <Text style={styles.abstractText}>
                                    <Text style={styles.dropCap}>{para.charAt(0)}</Text>
                                    {para.substring(1)}
                                </Text>
                            ) : (
                                <Text style={[styles.abstractText, { marginLeft: 20 }]}>{para}</Text>
                            )}
                        </View>
                    ))}
                </View>

                {/* Footer Security Mark */}
                <View style={styles.securityMark}>
                    <View style={styles.securityDot} />
                    <Text style={styles.securityText}>SYSTEM CERTIFIED</Text>
                </View>

            </View>

          </Animated.View>
        </ScrollView>
      </LinearGradient>
    </View>
  );
};
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  centerAll: { justifyContent: 'center', alignItems: 'center', padding: 20 },
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
    zIndex: 10,
  },
  headerBackBtn: { padding: 5, marginLeft: -5 },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: Colors.foreground },
  zoomToggle: { padding: 5, marginRight: -5 },
  gradientBackground: { flex: 1 },
  scrollContent: { paddingVertical: 30, paddingHorizontal: 15, alignItems: 'center' },
  errorText: { color: Colors.foreground, fontSize: 16, fontWeight: 'bold', marginBottom: 20 },
  backBtn: { backgroundColor: Colors.primary, paddingHorizontal: 20, paddingVertical: 10, borderRadius: 8 },
  backBtnText: { color: Colors.background, fontWeight: 'bold' },
  
  // Paper styles
  paperCard: {
      backgroundColor: '#fcfcfa', // Keep paper white-ish for readability but with premium feel
      minHeight: 800,
      borderRadius: 4,
      padding: 30,
      ...Platform.select({
          ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.2, shadowRadius: 20 },
          android: { elevation: 15 }
      }),
      position: 'relative',
      overflow: 'hidden'
  },
  watermarkContainer: {
      position: 'absolute',
      top: 0, left: 0, right: 0, bottom: 0,
      justifyContent: 'center',
      alignItems: 'center',
      opacity: 0.04,
      zIndex: 0
  },
  watermarkImage: {
      width: 300,
      height: 300,
      transform: [{ rotate: '-15deg' }]
  },
  stapleMark: {
      position: 'absolute',
      top: 20,
      left: 20,
      width: 30,
      height: 8,
      backgroundColor: 'rgba(209, 213, 219, 0.5)',
      transform: [{ rotate: '-45deg' }],
      borderWidth: 1,
      borderColor: 'rgba(156, 163, 175, 0.3)',
      borderRadius: 2,
      zIndex: 2
  },
  letterhead: {
      alignItems: 'center',
      borderBottomWidth: 3,
      borderBottomColor: '#111827',
      paddingBottom: 20,
      marginBottom: 30,
      position: 'relative',
      zIndex: 1
  },
  letterheadLogo: { width: 60, height: 60, marginBottom: 12, opacity: 0.8 },
  letterheadTitle: { fontSize: 10, fontWeight: '900', color: '#111827', textTransform: 'uppercase', letterSpacing: 1.5, textAlign: 'center' },
  letterheadSubtitle: { fontSize: 9, fontWeight: 'bold', color: '#6b7280', textTransform: 'uppercase', letterSpacing: 1, marginTop: 4 },
  letterheadDivider: { width: 60, height: 2, backgroundColor: '#111827', marginVertical: 12 },
  letterheadFooter: { fontSize: 8, fontWeight: '800', color: '#888', textTransform: 'uppercase', letterSpacing: 3, textAlign: 'center' },
  
  archiveStamp: {
      position: 'absolute',
      right: -20,
      top: 10,
      borderWidth: 3,
      borderColor: 'rgba(185, 28, 28, 0.2)',
      paddingHorizontal: 12,
      paddingVertical: 4,
      transform: [{ rotate: '15deg' }]
  },
  archiveStampText: {
      color: 'rgba(185, 28, 28, 0.2)',
      fontSize: 18,
      fontWeight: '900',
      textTransform: 'uppercase',
      letterSpacing: 4,
      fontStyle: 'italic'
  },
  
  metadataRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      borderBottomWidth: 1,
      borderBottomColor: 'rgba(17, 24, 39, 0.1)',
      paddingBottom: 15,
      marginBottom: 30
  },
  metaCol: { flex: 1 },
  metaLabel: {
    fontSize: 8,
    color: '#6b7280',
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    marginBottom: 4,
    fontWeight: '800',
  },
  metaValue: {
    fontSize: 11,
    color: '#111827',
    fontWeight: '800',
  },
  titleSection: {
    alignItems: 'center',
    marginBottom: 24,
  },
  thesisTitleMain: {
    fontSize: 16,
    fontWeight: '900',
    color: '#111827',
    textAlign: 'center',
    lineHeight: 22,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 10,
  },
  extractBadgeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 4,
  },
  extractDivider: {
    width: 24,
    height: 1,
    backgroundColor: 'rgba(17, 24, 39, 0.15)',
    marginHorizontal: 8,
  },
  extractText: {
    fontSize: 8,
    fontWeight: '800',
    color: '#6b7280',
    textTransform: 'uppercase',
    letterSpacing: 1.5,
  },
  categoryBadge: {
    borderWidth: 1,
    borderColor: 'rgba(17, 24, 39, 0.15)',
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    marginTop: 8,
  },
  categoryText: {
    fontSize: 8,
    fontWeight: '800',
    color: '#374151',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  authorSection: {
    marginBottom: 24,
    alignItems: 'center',
  },
  sectionDividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    marginBottom: 10,
  },
  sectionDividerText: {
    fontSize: 8,
    fontWeight: '900',
    color: '#6b7280',
    letterSpacing: 1.5,
    marginRight: 8,
  },
  sectionDividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(17, 24, 39, 0.1)',
  },
  authorText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#111827',
    textAlign: 'center',
    lineHeight: 16,
    marginBottom: 4,
  },
  facultyText: {
    fontSize: 8,
    fontWeight: '700',
    color: '#6b7280',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  abstractSection: {
    width: '100%',
    marginBottom: 40,
  },
  paragraphContainer: {
    marginBottom: 10,
  },
  abstractText: {
    fontSize: 11,
    color: '#374151',
    lineHeight: 18,
    textAlign: 'justify',
  },
  dropCap: {
    fontSize: 20,
    fontWeight: '900',
    color: '#111827',
  },
  securityMark: { position: 'absolute', bottom: 20, left: 0, right: 0, alignItems: 'center', opacity: 0.3 },
  securityDot: { width: 4, height: 4, borderRadius: 2, backgroundColor: '#111827', marginBottom: 4 },
  securityText: { fontSize: 6, fontWeight: '900', color: '#111827', letterSpacing: 2 },
});

// Define ComparisonModal locally
const modalStyles = StyleSheet.create({
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
    modalContainer: { 
        backgroundColor: Colors.surface, 
        borderTopLeftRadius: 30, 
        borderTopRightRadius: 30, 
        borderTopWidth: 1,
        borderColor: Colors.border,
        maxHeight: '92%' 
    },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 25, borderBottomWidth: 1, borderBottomColor: Colors.border },
    modalTitle: { fontSize: 18, fontWeight: '900', color: Colors.foreground },
    closeBtn: { padding: 5 },
    modalContent: { paddingHorizontal: 25 },
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
    applyBtn: { backgroundColor: Colors.primary, paddingVertical: 15, alignItems: 'center', justifyContent: 'center', borderRadius: 12 },
    applyBtnText: { color: Colors.background, fontWeight: 'bold' },
});

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
              <TouchableOpacity style={[modalStyles.applyBtn, { flex: 1, backgroundColor: Colors.primary }]} onPress={onClose}>
                <Text style={modalStyles.applyBtnText}>Done</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
};

export default ThesisDetailScreen;
