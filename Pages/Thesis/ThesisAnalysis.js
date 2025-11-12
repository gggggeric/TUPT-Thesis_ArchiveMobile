import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Dimensions,
  Alert,
  ActivityIndicator,
  Animated,
  Platform,
  Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import CustomHeader from '../Navigation/CustomHeader';
import HamburgerMenu from '../Navigation/HamburgerMenu';

const { width } = Dimensions.get('window');

const ThesisAnalysisScreen = () => {
  const navigation = useNavigation();
  const [isMenuVisible, setIsMenuVisible] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const fadeAnim = useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();
  }, []);

  const pickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
        copyToCacheDirectory: true,
      });

      if (result.type === 'success') {
        setSelectedFile(result);
        setAnalysisResult(null);
      }
    } catch (error) {
      console.error('Error picking document:', error);
      Alert.alert('Error', 'Failed to pick document');
    }
  };

  const analyzeThesis = async () => {
    if (!selectedFile) {
      Alert.alert('No File Selected', 'Please select a thesis file first');
      return;
    }

    setIsAnalyzing(true);
    setAnalysisResult(null);

    try {
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      const mockResult = {
        summary: "This thesis explores the impact of artificial intelligence on modern education systems, focusing on personalized learning approaches and adaptive assessment methods. The research demonstrates significant improvements in student engagement and learning outcomes through AI-driven educational tools.",
        strengths: [
          "Comprehensive literature review covering recent AI applications in education",
          "Well-structured methodology with clear experimental design",
          "Strong statistical analysis supporting the findings",
          "Practical implications for educational institutions"
        ],
        weaknesses: [
          "Limited sample size in the experimental group",
          "Lack of longitudinal data on long-term effects",
          "Could benefit from more diverse demographic representation"
        ],
        recommendations: [
          "Expand the study to include multiple educational institutions",
          "Consider longitudinal tracking of participant outcomes",
          "Explore integration with existing learning management systems",
          "Include qualitative data from student and teacher interviews"
        ],
        keyFindings: [
          "AI-powered personalized learning increased student engagement by 45%",
          "Adaptive assessment reduced testing time by 30% while maintaining accuracy",
          "Teachers reported 60% reduction in administrative workload",
          "Students showed 25% improvement in retention rates"
        ],
        score: 82,
        confidence: "High"
      };

      setAnalysisResult(mockResult);
    } catch (error) {
      console.error('Analysis error:', error);
      Alert.alert('Analysis Failed', 'Failed to analyze the thesis. Please try again.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleSearch = () => {
    if (searchQuery) {
      console.log('Searching for:', searchQuery);
    }
  };

  const AnalysisSection = ({ title, icon, data, color }) => (
    <View style={styles.analysisSection}>
      <View style={styles.sectionHeader}>
        <View style={[styles.sectionIconContainer, { backgroundColor: color + '20' }]}>
          <Ionicons name={icon} size={20} color={color} />
        </View>
        <Text style={styles.sectionTitle}>{title}</Text>
      </View>
      {Array.isArray(data) ? (
        <View style={styles.listContainer}>
          {data.map((item, index) => (
            <View key={index} style={styles.listItem}>
              <View style={[styles.bullet, { backgroundColor: color }]} />
              <Text style={styles.listText}>{item}</Text>
            </View>
          ))}
        </View>
      ) : (
        <Text style={styles.sectionText}>{data}</Text>
      )}
    </View>
  );

  const ScoreMeter = ({ score, confidence }) => (
    <View style={styles.scoreCard}>
      <View style={styles.scoreHeader}>
        <Text style={styles.scoreTitle}>Overall Score</Text>
        <View style={styles.confidenceBadge}>
          <Ionicons name="shield-checkmark-outline" size={14} color="#10b981" />
          <Text style={styles.confidenceText}>{confidence} Confidence</Text>
        </View>
      </View>
      <View style={styles.scoreContent}>
        <View style={styles.scoreCircle}>
          <LinearGradient
            colors={['#c7242c', '#991b1b']}
            style={styles.scoreGradient}
          >
            <Text style={styles.scoreValue}>{score}</Text>
            <Text style={styles.scoreLabel}>/100</Text>
          </LinearGradient>
        </View>
        <View style={styles.scoreDescription}>
          <Text style={styles.scoreDescTitle}>Excellent Work!</Text>
          <Text style={styles.scoreDescText}>
            Your thesis demonstrates strong research methodology and clear presentation of findings.
          </Text>
        </View>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <CustomHeader
        onMenuPress={() => setIsMenuVisible(true)}
        onSearch={handleSearch}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        showBackButton={true}
        onBackPress={() => navigation.goBack()}
      />
      
      <LinearGradient
        colors={['#fef2f2', '#fee2e2', '#fecaca']}
        style={styles.gradientBackground}
      >
        <ScrollView 
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
            
            {/* Header Section */}
            <View style={styles.headerSection}>
              <View style={styles.logoContainer}>
                <Ionicons name="analytics" size={40} color="#c7242c" />
              </View>
              <Text style={styles.welcomeTitle}>Thesis Analysis</Text>
              <Text style={styles.welcomeSubtitle}>
                Upload your thesis and get comprehensive AI-powered analysis with actionable insights
              </Text>
            </View>

            {/* Upload Card */}
            <View style={styles.mainCard}>
              <View style={styles.cardHeader}>
                <Ionicons name="cloud-upload-outline" size={24} color="#c7242c" />
                <Text style={styles.cardTitle}>Upload Thesis</Text>
              </View>

              <TouchableOpacity 
                style={styles.uploadArea}
                onPress={pickDocument}
                activeOpacity={0.8}
              >
                {selectedFile ? (
                  <View style={styles.fileSelected}>
                    <View style={styles.fileIconContainer}>
                      <Ionicons name="document-text" size={48} color="#c7242c" />
                    </View>
                    <Text style={styles.fileName}>{selectedFile.name}</Text>
                    <Text style={styles.fileSize}>
                      {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
                    </Text>
                    <TouchableOpacity 
                      style={styles.changeFileButton}
                      onPress={pickDocument}
                    >
                      <Ionicons name="sync-outline" size={16} color="#c7242c" />
                      <Text style={styles.changeFileText}>Change File</Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  <View style={styles.uploadPrompt}>
                    <View style={styles.uploadIconContainer}>
                      <Ionicons name="document-attach-outline" size={48} color="#9ca3af" />
                    </View>
                    <Text style={styles.uploadTitle}>Select Thesis File</Text>
                    <Text style={styles.uploadSubtitle}>
                      Supported formats: PDF, DOC, DOCX
                    </Text>
                    <View style={styles.uploadButtonContainer}>
                      <Ionicons name="cloud-upload-outline" size={18} color="white" />
                      <Text style={styles.uploadButtonText}>Choose File</Text>
                    </View>
                  </View>
                )}
              </TouchableOpacity>

              <TouchableOpacity 
                style={[
                  styles.analyzeButton,
                  (!selectedFile || isAnalyzing) && styles.analyzeButtonDisabled
                ]}
                onPress={analyzeThesis}
                disabled={!selectedFile || isAnalyzing}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={['#c7242c', '#991b1b']}
                  style={styles.analyzeButtonGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                >
                  {isAnalyzing ? (
                    <View style={styles.analyzingContent}>
                      <ActivityIndicator color="white" size="small" />
                      <Text style={styles.analyzeButtonText}>Analyzing...</Text>
                    </View>
                  ) : (
                    <>
                      <Ionicons name="sparkles" size={20} color="white" />
                      <Text style={styles.analyzeButtonText}>Analyze with AI</Text>
                    </>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            </View>

            {/* Analysis Results */}
            {analysisResult && (
              <View style={styles.resultsContainer}>
                <View style={styles.resultsHeader}>
                  <Ionicons name="checkmark-circle" size={24} color="#10b981" />
                  <Text style={styles.resultsTitle}>Analysis Results</Text>
                </View>

                <ScoreMeter 
                  score={analysisResult.score} 
                  confidence={analysisResult.confidence} 
                />

                <AnalysisSection
                  title="Executive Summary"
                  icon="document-text-outline"
                  data={analysisResult.summary}
                  color="#c7242c"
                />

                <AnalysisSection
                  title="Key Findings"
                  icon="bulb-outline"
                  data={analysisResult.keyFindings}
                  color="#f59e0b"
                />

                <AnalysisSection
                  title="Strengths"
                  icon="thumbs-up-outline"
                  data={analysisResult.strengths}
                  color="#10b981"
                />

                <AnalysisSection
                  title="Areas for Improvement"
                  icon="alert-circle-outline"
                  data={analysisResult.weaknesses}
                  color="#ef4444"
                />

                <AnalysisSection
                  title="Recommendations"
                  icon="trending-up-outline"
                  data={analysisResult.recommendations}
                  color="#8b5cf6"
                />

                {/* Action Buttons */}
                <View style={styles.actionButtons}>
                  <TouchableOpacity style={styles.actionButton}>
                    <Ionicons name="download-outline" size={18} color="#c7242c" />
                    <Text style={styles.actionButtonText}>Export</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity style={styles.actionButton}>
                    <Ionicons name="share-social-outline" size={18} color="#c7242c" />
                    <Text style={styles.actionButtonText}>Share</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity style={styles.actionButton}>
                    <Ionicons name="refresh-outline" size={18} color="#c7242c" />
                    <Text style={styles.actionButtonText}>Re-analyze</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {/* Tips Card */}
            {!analysisResult && !isAnalyzing && (
              <View style={styles.tipsCard}>
                <View style={styles.tipsHeader}>
                  <Ionicons name="information-circle-outline" size={24} color="#c7242c" />
                  <Text style={styles.tipsTitle}>Getting Best Results</Text>
                </View>
                <View style={styles.tipsList}>
                  <View style={styles.tipItem}>
                    <View style={styles.tipBullet} />
                    <Text style={styles.tipText}>Ensure your thesis is complete and properly formatted</Text>
                  </View>
                  <View style={styles.tipItem}>
                    <View style={styles.tipBullet} />
                    <Text style={styles.tipText}>Include all chapters: Abstract, Introduction, Methodology, Results, Conclusion</Text>
                  </View>
                  <View style={styles.tipItem}>
                    <View style={styles.tipBullet} />
                    <Text style={styles.tipText}>Maximum file size: 50MB</Text>
                  </View>
                  <View style={styles.tipItem}>
                    <View style={styles.tipBullet} />
                    <Text style={styles.tipText}>Analysis typically takes 2-5 minutes</Text>
                  </View>
                </View>
              </View>
            )}

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
  scrollContent: {
    paddingHorizontal: 20,
    paddingVertical: 30,
  },
  content: {
    alignItems: 'center',
  },
  headerSection: {
    alignItems: 'center',
    marginBottom: 30,
    width: '100%',
  },
  logoContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'white',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    borderWidth: 3,
    borderColor: '#c7242c',
    ...Platform.select({
      ios: {
        shadowColor: '#c7242c',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  welcomeTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 8,
    textAlign: 'center',
  },
  welcomeSubtitle: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 20,
  },
  mainCard: {
    width: width > 480 ? 420 : '100%',
    maxWidth: 420,
    padding: 30,
    borderRadius: 24,
    backgroundColor: 'white',
    marginBottom: 20,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.15,
        shadowRadius: 16,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 20,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  uploadArea: {
    backgroundColor: '#f9fafb',
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#e5e7eb',
    borderStyle: 'dashed',
    padding: 30,
    alignItems: 'center',
    marginBottom: 20,
  },
  uploadPrompt: {
    alignItems: 'center',
  },
  uploadIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#f3f4f6',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  uploadTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 8,
  },
  uploadSubtitle: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 20,
  },
  uploadButtonContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#c7242c',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
  },
  uploadButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 15,
  },
  fileSelected: {
    alignItems: 'center',
  },
  fileIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#fee2e2',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  fileName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 4,
    textAlign: 'center',
  },
  fileSize: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 16,
  },
  changeFileButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    backgroundColor: '#f9fafb',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 12,
    gap: 6,
  },
  changeFileText: {
    color: '#c7242c',
    fontWeight: '600',
    fontSize: 14,
  },
  analyzeButton: {
    borderRadius: 12,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#c7242c',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  analyzeButtonDisabled: {
    opacity: 0.6,
  },
  analyzeButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 8,
  },
  analyzingContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  analyzeButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  resultsContainer: {
    width: width > 480 ? 420 : '100%',
    maxWidth: 420,
  },
  resultsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 20,
  },
  resultsTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  scoreCard: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 24,
    marginBottom: 16,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
      },
      android: {
        elevation: 6,
      },
    }),
  },
  scoreHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  scoreTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  confidenceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#d1fae5',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    gap: 4,
  },
  confidenceText: {
    color: '#10b981',
    fontSize: 12,
    fontWeight: '600',
  },
  scoreContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 20,
  },
  scoreCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    overflow: 'hidden',
  },
  scoreGradient: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scoreValue: {
    color: 'white',
    fontSize: 36,
    fontWeight: 'bold',
  },
  scoreLabel: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 14,
    fontWeight: '600',
  },
  scoreDescription: {
    flex: 1,
  },
  scoreDescTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 4,
  },
  scoreDescText: {
    fontSize: 14,
    color: '#6b7280',
    lineHeight: 20,
  },
  analysisSection: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 12,
  },
  sectionIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  sectionText: {
    fontSize: 15,
    color: '#4b5563',
    lineHeight: 22,
  },
  listContainer: {
    gap: 12,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  bullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginTop: 8,
    flexShrink: 0,
  },
  listText: {
    flex: 1,
    fontSize: 15,
    color: '#4b5563',
    lineHeight: 22,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    paddingVertical: 14,
    borderRadius: 12,
    gap: 6,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 3,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  actionButtonText: {
    color: '#c7242c',
    fontWeight: '600',
    fontSize: 14,
  },
  tipsCard: {
    width: width > 480 ? 420 : '100%',
    maxWidth: 420,
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 24,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
      },
      android: {
        elevation: 6,
      },
    }),
  },
  tipsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  tipsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  tipsList: {
    gap: 12,
  },
  tipItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  tipBullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#c7242c',
    marginTop: 8,
  },
  tipText: {
    flex: 1,
    fontSize: 14,
    color: '#6b7280',
    lineHeight: 20,
  },
});

export default ThesisAnalysisScreen;