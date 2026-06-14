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
  Modal,
  SafeAreaView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation, useIsFocused } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import CustomHeader from '../Navigation/CustomHeader';
import GridMenu from '../Navigation/GridMenu';

const { width, height } = Dimensions.get('window');
const isSmallDevice = width < 375;

// Use your IP address
const API_BASE_URL = 'http://10.81.7.28:5001';

const MyDocuments = () => {
  const navigation = useNavigation();
  const isFocused = useIsFocused();
  const [isMenuVisible, setIsMenuVisible] = useState(false);
  const [uploadedFile, setUploadedFile] = useState(null);
  const [analysisResults, setAnalysisResults] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [showResults, setShowResults] = useState(false);
  const [expandedCategories, setExpandedCategories] = useState({});
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
        type: [
          'application/pdf',
          'application/msword', 
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          'text/plain'
        ],
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const file = result.assets[0];
        setUploadedFile(file);
        await analyzeThesis(file);
      }
    } catch (error) {
      console.error('Error picking document:', error);
      Alert.alert('Error', 'Failed to pick document: ' + error.message);
    }
  };

  const analyzeThesis = async (file) => {
    if (!file) {
      Alert.alert('Error', 'No file selected');
      return;
    }

    setIsAnalyzing(true);
    setUploadProgress(0);
    setAnalysisResults(null);

    try {
      // Simulate progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 300);

      // Test connection first
      try {
        const healthCheck = await fetch(`${API_BASE_URL}/api/health`, {
          method: 'GET',
        });
        
        if (!healthCheck.ok) {
          throw new Error('Server health check failed');
        }
      } catch (err) {
        throw new Error(`Cannot connect to server: ${err.message}`);
      }

      // Create FormData for file upload
      const formData = new FormData();
      
      const fileUri = file.uri;
      const fileType = file.mimeType || 'application/octet-stream';
      const fileName = file.name;

      formData.append('thesis', {
        uri: fileUri,
        type: fileType,
        name: fileName,
      });

      // Call your Flask API
      const apiResponse = await fetch(`${API_BASE_URL}/api/analyze-thesis`, {
        method: 'POST',
        body: formData,
      });

      clearInterval(progressInterval);
      setUploadProgress(100);

      if (!apiResponse.ok) {
        let errorMessage = `Server returned ${apiResponse.status}`;
        try {
          const errorText = await apiResponse.text();
          try {
            const errorData = JSON.parse(errorText);
            errorMessage = errorData.error || errorMessage;
          } catch (e) {
            errorMessage = errorText || errorMessage;
          }
        } catch (e) {
          errorMessage = apiResponse.statusText || errorMessage;
        }
        throw new Error(errorMessage);
      }

      const responseText = await apiResponse.text();
      let data;
      try {
        data = JSON.parse(responseText);
      } catch (e) {
        throw new Error('Invalid JSON response from server');
      }

      if (!data.success) {
        throw new Error(data.error || 'Analysis failed');
      }

      const transformedResults = {
        overallScore: data.overallScore,
        statistics: data.statistics,
        recommendations: data.recommendations || []
      };

      setAnalysisResults(transformedResults);
      Alert.alert('Success', 'Thesis analysis completed successfully!');
      
    } catch (error) {
      console.error('Analysis error:', error);
      
      if (error.message.includes('Failed to fetch') || 
          error.message.includes('Network request failed') ||
          error.message.includes('Cannot connect to server')) {
        Alert.alert(
          'Connection Error', 
          `Cannot connect to the analysis server.\n\nMake sure:\n• Flask backend is running\n• Same WiFi network\n• Correct IP address`,
          [
            {
              text: 'Use Demo Data',
              onPress: () => loadDemoData(file)
            },
            {
              text: 'Cancel',
              style: 'cancel'
            }
          ]
        );
      } else {
        Alert.alert('Analysis Failed', error.message);
      }
    } finally {
      setIsAnalyzing(false);
      setTimeout(() => setUploadProgress(0), 1000);
    }
  };

  const loadDemoData = (file) => {
    const fileType = file.name.split('.').pop().toUpperCase();
    const fileSize = (file.size / (1024 * 1024)).toFixed(2);
    
    const demoResults = {
      overallScore: Math.floor(Math.random() * 30) + 70,
      statistics: {
        wordCount: Math.floor(Math.random() * 5000) + 3000,
        sentenceCount: Math.floor(Math.random() * 200) + 150,
        paragraphCount: Math.floor(Math.random() * 50) + 40,
        readabilityScore: Math.floor(Math.random() * 30) + 65,
        fileType: fileType,
        fileSize: fileSize
      },
      recommendations: [
        {
          category: 'Grammar',
          title: 'Subject-Verb Agreement',
          description: 'Inconsistent subject-verb agreement detected in 3 instances',
          suggestion: 'Review and correct verb forms to match subjects throughout the document',
          severity: 'medium',
          count: 3,
        },
        {
          category: 'Structure',
          title: 'Thesis Statement',
          description: 'Thesis statement could be more specific and focused',
          suggestion: 'Make thesis statement more focused and clearly state your research question',
          severity: 'high',
          count: 1,
        },
        {
          category: 'Content',
          title: 'Literature Review',
          description: 'Could include more recent studies from the last 3 years',
          suggestion: 'Add references from the last 3 years to strengthen current relevance',
          severity: 'medium',
          count: 2,
        },
      ]
    };
    setAnalysisResults(demoResults);
  };

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'critical': return '#dc2626';
      case 'high': return '#ea580c';
      case 'medium': return '#d97706';
      case 'low': return '#059669';
      default: return '#6b7280';
    }
  };

  const getFileIcon = (fileName) => {
    if (fileName?.toLowerCase().endsWith('.pdf')) return 'document';
    if (fileName?.toLowerCase().endsWith('.doc') || fileName?.toLowerCase().endsWith('.docx')) return 'document-text';
    return 'document-attach';
  };

  const groupRecommendationsByCategory = (recommendations) => {
    const grouped = {};
    
    recommendations.forEach(rec => {
      if (!grouped[rec.category]) {
        grouped[rec.category] = [];
      }
      grouped[rec.category].push(rec);
    });
    
    return Object.entries(grouped).map(([category, issues]) => ({
      category,
      issues
    }));
  };

  const toggleCategory = (category) => {
    setExpandedCategories(prev => ({
      ...prev,
      [category]: !prev[category]
    }));
  };

  const downloadReport = () => {
    if (!analysisResults) return;
    
    Alert.alert(
      'Export Report', 
      'PDF report with analysis results would be generated.',
      [
        {
          text: 'Generate PDF',
          onPress: () => Alert.alert('Success', 'PDF report generated!')
        },
        { text: 'Cancel', style: 'cancel' }
      ]
    );
  };

  const resetAnalysis = () => {
    setAnalysisResults(null);
    setUploadedFile(null);
    setShowResults(false);
    setExpandedCategories({});
  };

  const handleSearch = () => {
    if (searchQuery) {
      Alert.alert('Search', `Searching for: ${searchQuery}`);
    }
  };

  const shareResults = () => {
    Alert.alert('Share', 'Share analysis results with colleagues.');
  };

  const stats = [
    { label: 'Documents', value: analysisResults ? '1' : '0', icon: 'folder-open' },
    { label: 'Analyzed', value: analysisResults ? '1' : '0', icon: 'checkmark-circle' },
    { label: 'In Queue', value: isAnalyzing ? '1' : '0', icon: 'timer' },
  ];

  return (
    <SafeAreaView style={styles.container}>
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
            
            {/* Hero Section */}
            <LinearGradient
              colors={['#c7242c', '#991b1b']}
              style={styles.heroSection}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <View style={styles.heroContent}>
                <View style={styles.greetingContainer}>
                  <Text style={styles.greetingText}>Thesis Checker</Text>
                  <Text style={styles.heroName}>Document Checker</Text>
                  <Text style={styles.heroSubtitle}>
                    {analysisResults 
                      ? 'Analysis complete! View your results' 
                      : isAnalyzing 
                      ? 'Analyzing your document...' 
                      : 'Upload thesis to get AI feedback'
                    }
                  </Text>
                </View>
                
                {/* Stats Cards */}
                <View style={styles.statsContainer}>
                  {stats.map((stat, index) => (
                    <View key={index} style={styles.statCard}>
                      <Ionicons name={stat.icon} size={isSmallDevice ? 18 : 20} color="#c7242c" />
                      <Text style={styles.statValue}>{stat.value}</Text>
                      <Text style={styles.statLabel}>{stat.label}</Text>
                    </View>
                  ))}
                </View>
              </View>
            </LinearGradient>

            {/* Upload Section */}
            <View style={styles.featuresSection}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>
                  {analysisResults ? 'Check Complete' : 'Upload Thesis'}
                </Text>
              </View>
              
              <View style={styles.featuresGrid}>
                <TouchableOpacity 
                  style={styles.featureCard}
                  onPress={pickDocument}
                  disabled={isAnalyzing}
                  activeOpacity={0.8}
                >
                  <LinearGradient
                    colors={[
                      isAnalyzing ? ['#f59e0b', '#d97706'] : 
                      analysisResults ? ['#10b981', '#059669'] : 
                      ['#6366f1', '#4f46e5']
                    ]}
                    style={styles.featureGradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                  >
                    <View style={styles.featureIconContainer}>
                      {isAnalyzing ? (
                        <ActivityIndicator color="white" size="small" />
                      ) : analysisResults ? (
                        <Ionicons name="checkmark-circle" size={isSmallDevice ? 24 : 28} color="white" />
                      ) : (
                        <Ionicons name="cloud-upload" size={isSmallDevice ? 24 : 28} color="white" />
                      )}
                    </View>
                    <Text style={styles.featureTitle}>
                      {isAnalyzing ? 'Checking...' : 
                       analysisResults ? 'Complete' : 
                       'Upload Thesis'}
                    </Text>
                    <Text style={styles.featureDescription}>
                      {isAnalyzing ? 'Checking document' :
                       analysisResults ? 'View suggestions' :
                       'PDF, DOC, DOCX, TXT files'}
                    </Text>
                  </LinearGradient>
                </TouchableOpacity>

                {/* Quick Actions */}
                {analysisResults && (
                  <TouchableOpacity 
                    style={styles.featureCard}
                    onPress={() => setShowResults(true)}
                    activeOpacity={0.8}
                  >
                    <LinearGradient
                      colors={['#8b5cf6', '#7c3aed']}
                      style={styles.featureGradient}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                    >
                      <View style={styles.featureIconContainer}>
                        <Ionicons name="stats-chart" size={isSmallDevice ? 24 : 28} color="white" />
                      </View>
                      <Text style={styles.featureTitle}>View Results</Text>
                      <Text style={styles.featureDescription}>
                        Detailed suggestions and feedback
                      </Text>
                    </LinearGradient>
                  </TouchableOpacity>
                )}
              </View>

              {/* Uploaded File Info */}
              {uploadedFile && (
                <View style={styles.activityList}>
                  <View style={styles.activityItem}>
                    <View style={[styles.activityIcon, { backgroundColor: '#dbeafe' }]}>
                      <Ionicons name={getFileIcon(uploadedFile.name)} size={isSmallDevice ? 20 : 22} color="#2563eb" />
                    </View>
                    <View style={styles.activityContent}>
                      <Text style={styles.activityTitle} numberOfLines={1} ellipsizeMode="middle">
                        {uploadedFile.name}
                      </Text>
                      <Text style={styles.activityDescription}>
                        {(uploadedFile.size / (1024 * 1024)).toFixed(2)} MB • {isAnalyzing ? 'Checking...' : 'Ready'}
                      </Text>
                    </View>
                    <View style={styles.activityTimeContainer}>
                      {analysisResults && (
                        <TouchableOpacity 
                          style={styles.viewResultsButton}
                          onPress={() => setShowResults(true)}
                        >
                          <Text style={styles.viewResultsText}>View</Text>
                        </TouchableOpacity>
                      )}
                      {!isAnalyzing && (
                        <TouchableOpacity 
                          style={styles.clearButton}
                          onPress={resetAnalysis}
                        >
                          <Ionicons name="close" size={16} color="#9ca3af" />
                        </TouchableOpacity>
                      )}
                    </View>
                  </View>

                  {isAnalyzing && (
                    <View style={styles.activityItem}>
                      <View style={styles.activityContent}>
                        <View style={styles.progressContainer}>
                          <View style={styles.progressBar}>
                            <View 
                              style={[
                                styles.progressFill,
                                { width: `${uploadProgress}%` }
                              ]} 
                            />
                          </View>
                          <Text style={styles.progressText}>Checking... {uploadProgress}%</Text>
                        </View>
                      </View>
                    </View>
                  )}
                </View>
              )}

              {/* Quick Tips */}
              {!analysisResults && !isAnalyzing && (
                <View style={styles.tipsSection}>
                  <View style={styles.tipCard}>
                    <Ionicons name="information-circle" size={isSmallDevice ? 22 : 24} color="#3b82f6" />
                    <View style={styles.tipContent}>
                      <Text style={styles.tipTitle}>Supported Formats</Text>
                      <Text style={styles.tipText}>
                        Upload PDF, Word documents, or text files. Max 50MB.
                      </Text>
                    </View>
                  </View>
                </View>
              )}
            </View>

            <View style={{ height: 20 }} />
          </Animated.View>
        </ScrollView>
      </LinearGradient>

      {/* Results Modal */}
      <Modal
        visible={showResults}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowResults(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          {/* Header */}
          <View style={styles.modalHeader}>
            <View style={styles.modalTitleSection}>
              <Text style={styles.modalTitle}>Feedback Results</Text>
              <Text style={styles.modalSubtitle} numberOfLines={1}>
                {uploadedFile?.name}
              </Text>
            </View>
            <TouchableOpacity 
              style={styles.modalClose}
              onPress={() => setShowResults(false)}
            >
              <Ionicons name="close" size={24} color="#6b7280" />
            </TouchableOpacity>
          </View>

          {/* Content */}
          <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
            {analysisResults && (
              <>
                {/* Score Section */}
                <View style={styles.scoreSection}>
                  <View style={styles.scoreCircle}>
                    <Text style={styles.scoreNumber}>{analysisResults.overallScore}</Text>
                    <Text style={styles.scoreLabel}>/100</Text>
                  </View>
                  <View style={styles.scoreInfo}>
                    <Text style={styles.scoreInfoTitle}>Overall Score</Text>
                    <Text style={styles.scoreInfoSubtitle}>Review feedback score</Text>
                  </View>
                </View>

                {/* Stats */}
                <View style={styles.statsGrid}>
                  <View style={styles.statItem}>
                    <Text style={styles.statNumber}>{analysisResults.statistics.wordCount?.toLocaleString() || '0'}</Text>
                    <Text style={styles.statLabel}>Words</Text>
                  </View>
                  <View style={styles.statItem}>
                    <Text style={styles.statNumber}>{analysisResults.statistics.sentenceCount || '0'}</Text>
                    <Text style={styles.statLabel}>Sentences</Text>
                  </View>
                  <View style={styles.statItem}>
                    <Text style={styles.statNumber}>{analysisResults.statistics.paragraphCount || '0'}</Text>
                    <Text style={styles.statLabel}>Paragraphs</Text>
                  </View>
                  <View style={styles.statItem}>
                    <Text style={styles.statNumber}>{analysisResults.statistics.readabilityScore || '0'}</Text>
                    <Text style={styles.statLabel}>Readability</Text>
                  </View>
                </View>

                {/* Recommendations */}
                <View style={styles.recommendations}>
                  <View style={styles.recommendationsHeader}>
                    <Text style={styles.recommendationsTitle}>Suggestions</Text>
                    <Text style={styles.recommendationsCount}>
                      {analysisResults.recommendations?.length || 0} areas
                    </Text>
                  </View>
                  <View style={styles.recommendationsList}>
                    {analysisResults.recommendations && groupRecommendationsByCategory(analysisResults.recommendations).map((category, index) => (
                      <View key={index} style={styles.category}>
                        <TouchableOpacity 
                          style={styles.categoryHeader}
                          onPress={() => toggleCategory(category.category)}
                        >
                          <View style={styles.categoryInfo}>
                            <View 
                              style={[
                                styles.categoryDot,
                                { backgroundColor: getSeverityColor(category.issues[0]?.severity || 'medium') }
                              ]} 
                            />
                            <Text style={styles.categoryName}>{category.category}</Text>
                            <Text style={styles.categoryCount}>({category.issues.length})</Text>
                          </View>
                          <Ionicons 
                            name={expandedCategories[category.category] ? "chevron-up" : "chevron-down"} 
                            size={20} 
                            color="#6b7280" 
                          />
                        </TouchableOpacity>
                        
                        {expandedCategories[category.category] && (
                          <View style={styles.categoryContent}>
                            {category.issues.map((issue, issueIndex) => (
                              <View key={issueIndex} style={styles.recommendation}>
                                <View style={styles.recommendationHeader}>
                                  <Text style={styles.issueTitle}>{issue.title}</Text>
                                  <View style={styles.issueMeta}>
                                    <View 
                                      style={[
                                        styles.severityBadge,
                                        { backgroundColor: getSeverityColor(issue.severity) }
                                      ]}
                                    >
                                      <Text style={styles.severityText}>{issue.severity}</Text>
                                    </View>
                                  </View>
                                </View>
                                <Text style={styles.issueDescription}>{issue.description}</Text>
                                <View style={styles.suggestion}>
                                  <Ionicons name="bulb-outline" size={16} color="#f59e0b" />
                                  <Text style={styles.suggestionText}>{issue.suggestion}</Text>
                                </View>
                              </View>
                            ))}
                          </View>
                        )}
                      </View>
                    ))}
                  </View>
                </View>
              </>
            )}
          </ScrollView>

          {/* Actions */}
          <View style={styles.modalActions}>
            <TouchableOpacity style={styles.secondaryBtn} onPress={downloadReport}>
              <Ionicons name="download" size={20} color="#c7242c" />
              <Text style={styles.secondaryBtnText}>Save Report</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.primaryBtn} onPress={resetAnalysis}>
              <Ionicons name="refresh" size={20} color="white" />
              <Text style={styles.primaryBtnText}>New Check</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </Modal>

      {isFocused && (
        <GridMenu
          isVisible={isMenuVisible}
          onClose={() => setIsMenuVisible(false)}
          navigation={navigation}
        />
      )}
    </SafeAreaView>
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
    paddingBottom: 20,
  },
  content: {
    flex: 1,
  },
  // Hero Section
  heroSection: {
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    paddingTop: Platform.OS === 'ios' ? 50 : 20,
    paddingBottom: 25,
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  heroContent: {
    gap: 16,
  },
  greetingContainer: {
    marginBottom: 8,
  },
  greetingText: {
    fontSize: isSmallDevice ? 14 : 16,
    color: 'rgba(255, 255, 255, 0.9)',
    marginBottom: 4,
    fontWeight: '600',
  },
  heroName: {
    fontSize: isSmallDevice ? 26 : 32,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 6,
  },
  heroSubtitle: {
    fontSize: isSmallDevice ? 14 : 15,
    color: 'rgba(255, 255, 255, 0.9)',
    lineHeight: 20,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
  },
  statCard: {
    flex: 1,
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 14,
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
    fontSize: isSmallDevice ? 20 : 24,
    fontWeight: 'bold',
    color: '#1f2937',
    marginTop: 6,
    marginBottom: 2,
  },
  statLabel: {
    fontSize: isSmallDevice ? 10 : 11,
    color: '#6b7280',
    textAlign: 'center',
  },
  // Features Section
  featuresSection: {
    marginBottom: 20,
  },
  sectionHeader: {
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: isSmallDevice ? 20 : 22,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  featuresGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 15,
    gap: 12,
  },
  featureCard: {
    width: (width - 54) / 2,
    borderRadius: 16,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.15,
        shadowRadius: 6,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  featureGradient: {
    padding: isSmallDevice ? 16 : 18,
    minHeight: isSmallDevice ? 140 : 160,
    justifyContent: 'space-between',
  },
  featureIconContainer: {
    width: isSmallDevice ? 48 : 56,
    height: isSmallDevice ? 48 : 56,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  featureTitle: {
    color: 'white',
    fontSize: isSmallDevice ? 16 : 17,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  featureDescription: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: isSmallDevice ? 12 : 13,
    lineHeight: 16,
  },
  // Activity List
  activityList: {
    paddingHorizontal: 20,
    gap: 10,
    marginTop: 12,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    padding: 14,
    borderRadius: 12,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.08,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  activityIcon: {
    width: isSmallDevice ? 42 : 48,
    height: isSmallDevice ? 42 : 48,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activityContent: {
    flex: 1,
    marginLeft: 12,
  },
  activityTitle: {
    fontSize: isSmallDevice ? 14 : 15,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 2,
  },
  activityDescription: {
    fontSize: isSmallDevice ? 12 : 13,
    color: '#6b7280',
    lineHeight: 16,
  },
  activityTimeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  viewResultsButton: {
    backgroundColor: '#c7242c',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  viewResultsText: {
    color: 'white',
    fontWeight: '600',
    fontSize: isSmallDevice ? 11 : 12,
  },
  clearButton: {
    padding: 6,
  },
  // Progress Bar
  progressContainer: {
    width: '100%',
  },
  progressBar: {
    width: '100%',
    height: 6,
    backgroundColor: '#e5e7eb',
    borderRadius: 8,
    marginBottom: 6,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#c7242c',
    borderRadius: 8,
  },
  progressText: {
    fontSize: isSmallDevice ? 11 : 12,
    color: '#6b7280',
    textAlign: 'center',
  },
  // Tips Section
  tipsSection: {
    paddingHorizontal: 20,
    marginTop: 12,
  },
  tipCard: {
    flexDirection: 'row',
    padding: 16,
    borderRadius: 12,
    alignItems: 'flex-start',
    gap: 12,
    backgroundColor: '#f8fafc',
    borderLeftWidth: 4,
    borderLeftColor: '#3b82f6',
  },
  tipContent: {
    flex: 1,
  },
  tipTitle: {
    fontSize: isSmallDevice ? 15 : 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 4,
  },
  tipText: {
    fontSize: isSmallDevice ? 13 : 14,
    color: '#4b5563',
    lineHeight: 18,
  },
  // Modal Styles
  modalContainer: {
    flex: 1,
    backgroundColor: 'white',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  modalTitleSection: {
    flex: 1,
    marginRight: 12,
  },
  modalTitle: {
    fontSize: isSmallDevice ? 20 : 22,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  modalSubtitle: {
    fontSize: isSmallDevice ? 13 : 14,
    color: '#6b7280',
    marginTop: 4,
  },
  modalClose: {
    padding: 4,
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
  // Score Section
  scoreSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
    gap: 16,
  },
  scoreCircle: {
    width: isSmallDevice ? 70 : 80,
    height: isSmallDevice ? 70 : 80,
    borderRadius: 35,
    backgroundColor: '#f8fafc',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#e2e8f0',
  },
  scoreNumber: {
    fontSize: isSmallDevice ? 26 : 32,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  scoreLabel: {
    fontSize: isSmallDevice ? 12 : 14,
    color: '#64748b',
    fontWeight: '600',
  },
  scoreInfo: {
    flex: 1,
  },
  scoreInfoTitle: {
    fontSize: isSmallDevice ? 18 : 20,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 4,
  },
  scoreInfoSubtitle: {
    fontSize: isSmallDevice ? 13 : 14,
    color: '#64748b',
  },
  // Stats Grid
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
    gap: 10,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    padding: isSmallDevice ? 12 : 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  statNumber: {
    fontSize: isSmallDevice ? 16 : 18,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: isSmallDevice ? 11 : 12,
    color: '#64748b',
    textAlign: 'center',
  },
  // Recommendations
  recommendations: {
    marginBottom: 20,
  },
  recommendationsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  recommendationsTitle: {
    fontSize: isSmallDevice ? 18 : 20,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  recommendationsCount: {
    fontSize: isSmallDevice ? 13 : 14,
    color: '#64748b',
    fontWeight: '500',
  },
  recommendationsList: {
    gap: 10,
  },
  category: {
    backgroundColor: '#f8fafc',
    borderRadius: 10,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  categoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: isSmallDevice ? 14 : 16,
  },
  categoryInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  categoryDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  categoryName: {
    fontSize: isSmallDevice ? 15 : 16,
    fontWeight: '600',
    color: '#1f2937',
    flex: 1,
  },
  categoryCount: {
    fontSize: isSmallDevice ? 13 : 14,
    color: '#64748b',
    fontWeight: '500',
  },
  categoryContent: {
    padding: isSmallDevice ? 12 : 14,
    paddingTop: 0,
  },
  recommendation: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: isSmallDevice ? 10 : 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  recommendationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 6,
  },
  issueTitle: {
    fontSize: isSmallDevice ? 14 : 15,
    fontWeight: '600',
    color: '#1f2937',
    flex: 1,
    marginRight: 8,
  },
  issueMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  severityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  severityText: {
    fontSize: isSmallDevice ? 10 : 11,
    fontWeight: '600',
    color: 'white',
    textTransform: 'capitalize',
  },
  issueDescription: {
    fontSize: isSmallDevice ? 13 : 14,
    color: '#475569',
    lineHeight: 18,
    marginBottom: 8,
  },
  suggestion: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: '#fffbeb',
    padding: 10,
    borderRadius: 6,
    borderLeftWidth: 3,
    borderLeftColor: '#f59e0b',
  },
  suggestionText: {
    flex: 1,
    fontSize: isSmallDevice ? 13 : 14,
    color: '#92400e',
    lineHeight: 18,
  },
  // Modal Actions
  modalActions: {
    flexDirection: 'row',
    padding: 20,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    backgroundColor: '#f8fafc',
  },
  secondaryBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    paddingVertical: isSmallDevice ? 12 : 14,
    borderRadius: 10,
    gap: 6,
  },
  secondaryBtnText: {
    color: '#c7242c',
    fontSize: isSmallDevice ? 14 : 16,
    fontWeight: '600',
  },
  primaryBtn: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#c7242c',
    paddingVertical: isSmallDevice ? 12 : 14,
    borderRadius: 10,
    gap: 6,
  },
  primaryBtnText: {
    color: 'white',
    fontSize: isSmallDevice ? 14 : 16,
    fontWeight: '600',
  },
});

export default MyDocuments;