import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Dimensions,
  Platform,
  SafeAreaView,
  Image,
  Animated
} from 'react-native';
import LottieView from 'lottie-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation, useIsFocused } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Colors from '../utils/Colors';

const { width, height } = Dimensions.get('window');

const features = [
  {
    number: '01',
    badge: 'Smart Search',
    title: 'Find Any Paper in Seconds',
    desc: 'Advanced smart search indexes thousands of university papers. Search by title, author, or keywords — results ranked by relevance in milliseconds.',
    icon: 'search',
    color: Colors.blue,
  },
  {
    number: '02',
    badge: 'AI Assistance',
    title: 'Get AI-Powered Title Ideas',
    desc: 'Use our AI engine to generate title ideas and research directions — tailored to your department and interests.',
    icon: 'hardware-chip',
    color: Colors.purple,
  },
  {
    number: '03',
    badge: 'Advanced Filtering',
    title: 'Narrow Down with Precision',
    desc: 'Filter by department, year, author, or course. Combine filters to pinpoint exactly the research you need.',
    icon: 'options',
    color: Colors.orange,
  },
  {
    number: '04',
    badge: 'Document Analysis',
    title: 'Upload & Extract Details',
    desc: 'Upload your thesis PDF and our system automatically extracts title, authors, and details. No manual entry needed.',
    icon: 'cloud-upload',
    color: Colors.green,
  },
];

const LandingScreen = () => {
  const navigation = useNavigation();
  const isFocused = useIsFocused();
  const insets = useSafeAreaInsets();

  const titleAnim = React.useRef(new Animated.Value(0)).current;
  const subtitleAnim = React.useRef(new Animated.Value(0)).current;
  const primaryBtnAnim = React.useRef(new Animated.Value(0)).current;
  const secondaryActionsAnim = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    checkExistingSession();
  }, []);

  const checkExistingSession = async () => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      const userData = await AsyncStorage.getItem('userData');
      if (token && userData) {
        navigation.reset({ index: 0, routes: [{ name: 'Home' }] });
      }
    } catch (err) {
      console.log('Error checking existing session:', err);
    }
  };

  React.useEffect(() => {
    if (isFocused) {
      titleAnim.setValue(0);
      subtitleAnim.setValue(0);
      primaryBtnAnim.setValue(0);
      secondaryActionsAnim.setValue(0);

      Animated.stagger(150, [
        Animated.spring(titleAnim, { toValue: 1, tension: 50, friction: 8, useNativeDriver: true }),
        Animated.spring(subtitleAnim, { toValue: 1, tension: 50, friction: 8, useNativeDriver: true }),
        Animated.spring(primaryBtnAnim, { toValue: 1, tension: 50, friction: 8, useNativeDriver: true }),
        Animated.spring(secondaryActionsAnim, { toValue: 1, tension: 50, friction: 8, useNativeDriver: true }),
      ]).start();
    }
  }, [isFocused]);

  const translateY = (anim) => anim.interpolate({
    inputRange: [0, 1],
    outputRange: [25, 0],
  });

  return (
    <View style={styles.outerContainer}>
      {/* ════ Sleek Glowing Backgrounds ════ */}
      <LinearGradient
        colors={[`${Colors.primary}12`, 'transparent']}
        style={styles.glowOrb1}
      />
      <LinearGradient
        colors={[`${Colors.purple}08`, 'transparent']}
        style={styles.glowOrb2}
      />

      <ScrollView
        style={styles.container}
        showsVerticalScrollIndicator={false}
        bounces={true}
        contentContainerStyle={{ paddingBottom: 60 }}
      >
        {/* ════ HERO SECTION ════ */}
        <View style={styles.heroSection}>
          <View style={[styles.heroSafeArea, { paddingTop: insets.top + 16 }]}>
            
            {/* Floating Glassmorphic Header Nav */}
            <Animated.View style={[styles.headerNav, { 
              opacity: secondaryActionsAnim, 
              transform: [{ translateY: translateY(secondaryActionsAnim) }] 
            }]}>
              <View style={styles.headerLogoContainer}>
                <View style={styles.headerLogoCircle}>
                  <Image source={require('../assets/tup-logo.png')} style={styles.headerLogo} resizeMode="contain" />
                </View>
                <View>
                  <Text style={styles.headerBrand}>TUPT-THESIS</Text>
                  <Text style={styles.headerBrandSub}>ARCHIVE</Text>
                </View>
              </View>

              <View style={styles.headerAuthContainer}>
                <TouchableOpacity onPress={() => navigation.navigate('Login')} style={styles.headerSignInBtn} activeOpacity={0.7}>
                  <Text style={styles.headerSignInText}>SIGN IN</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => navigation.navigate('Register')} style={styles.headerRegisterBtn} activeOpacity={0.85}>
                  <Text style={styles.headerRegisterText}>REGISTER</Text>
                </TouchableOpacity>
              </View>
            </Animated.View>

            {/* Hero Content */}
            <View style={styles.heroContent}>
              {/* Premium Sparkles Tag */}
              <Animated.View style={[
                styles.tagBadge,
                { opacity: subtitleAnim, transform: [{ translateY: translateY(subtitleAnim) }] }
              ]}>
                <Ionicons name="sparkles-sharp" size={10} color={Colors.primary} />
                <Text style={styles.tagBadgeText}>TUP DIGITAL SYSTEM</Text>
              </Animated.View>

              <Animated.Text style={[
                styles.heroTitle,
                { opacity: titleAnim, transform: [{ translateY: translateY(titleAnim) }] }
              ]}>
                TUPT-Thesis{'\n'}
                <Text style={{ color: Colors.primary }}>Archive</Text>
              </Animated.Text>

              <Animated.Text style={[
                styles.heroSubtitle,
                { opacity: subtitleAnim, transform: [{ translateY: translateY(subtitleAnim) }] }
              ]}>
                A central library for TUP students. Store, search, and check your research with university standards.
              </Animated.Text>

              {/* Main Get Started Button */}
              <Animated.View style={{ 
                opacity: primaryBtnAnim, 
                transform: [{ translateY: translateY(primaryBtnAnim) }],
                width: '100%',
                alignItems: 'center',
                marginTop: 8
              }}>
                <TouchableOpacity
                  style={styles.btnHeroPrimary}
                  onPress={() => navigation.navigate('Register')}
                  activeOpacity={0.9}
                >
                  <Text style={styles.btnHeroPrimaryText}>GET STARTED</Text>
                  <Ionicons name="arrow-forward" size={16} color={Colors.background} />
                </TouchableOpacity>
              </Animated.View>
            </View>

            {/* Lottie Animation Illustration */}
            <Animated.View style={[styles.lottieContainer, { opacity: subtitleAnim }]}>
              <LottieView
                source={require('../assets/animations/Man and robot with computers sitting together in workplace.json')}
                autoPlay
                loop
                style={styles.lottieBackground}
              />
            </Animated.View>
          </View>
        </View>

        {/* ════ FEATURE SECTIONS ════ */}
        <View style={styles.featuresContainer}>
          <View style={styles.sectionHeaderCentered}>
            <Text style={styles.sectionSubtitle}>CORE ABILITIES</Text>
            <Text style={styles.sectionTitleCentered}>System Features</Text>
            <View style={styles.centeredAccentLine} />
          </View>

          {features.map((feat) => (
            <View key={feat.number} style={styles.featureBlock}>
              <View style={styles.featureHeader}>
                <Text style={[styles.featureNumberLabel, { color: feat.color }]}>FEATURE {feat.number}</Text>
                <Text style={styles.featureMainTitle}>{feat.title}</Text>
                <View style={[styles.featureTitleUnderline, { backgroundColor: feat.color }]} />
              </View>

              <View style={styles.featureCard}>
                <View style={[styles.featureIconBox, { backgroundColor: `${feat.color}12`, borderColor: `${feat.color}25` }]}>
                  <Ionicons name={feat.icon} size={28} color={feat.color} />
                </View>

                <View style={[styles.featureBadge, { borderColor: `${feat.color}25`, backgroundColor: `${feat.color}08` }]}>
                  <Text style={[styles.featureBadgeText, { color: feat.color }]}>{feat.badge}</Text>
                </View>

                <Text style={styles.featureDesc}>{feat.desc}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* ════ WHY CHOOSE SECTION ════ */}
        <View style={styles.whyChooseSection}>
          <Text style={styles.sectionSubtitle}>INNOVATION FIRST</Text>
          <Text style={styles.sectionTitle}>Library of{'\n'}<Text style={styles.sectionTitleAccent}>Knowledge</Text></Text>
          <Text style={styles.sectionDesc}>
            We've built more than just a storage system. A high-performance environment designed to protect student research while making it accessible for the next generation.
          </Text>

          <View style={styles.benefitsGrid}>
            {[
              { title: 'Trusted Source', desc: 'Secure library endorsed by TUP-Taguig leadership.', icon: 'shield-checkmark-outline' },
              { title: 'Modern Tools', desc: 'Next-gen search and analysis interface.', icon: 'rocket-outline' },
              { title: 'Simple Design', desc: 'A simple, clean student experience.', icon: 'bulb-outline' },
              { title: 'Verified Quality', desc: 'AI checking for academic standards.', icon: 'checkmark-circle-outline' },
            ].map((item, i) => (
              <View key={i} style={styles.benefitCard}>
                <View style={styles.benefitIconCircle}>
                  <Ionicons name={item.icon} size={24} color={Colors.primary} />
                </View>
                <Text style={styles.benefitTitle}>{item.title}</Text>
                <Text style={styles.benefitDesc}>{item.desc}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* ════ CORE FUNCTIONS SECTION ════ */}
        <View style={styles.coreFunctionsSection}>
          <Text style={styles.sectionSubtitleSecondary}>WHAT THE APP DOES</Text>
          <Text style={styles.sectionTitleWhite}>Core Functions</Text>
          <View style={[styles.centeredAccentLine, { backgroundColor: Colors.secondary }]} />

          <View style={styles.coreFunctionsList}>
            {[
              { icon: 'search', title: 'QUICK SEARCH', desc: 'Search thousands of student papers in milliseconds with our advanced search system.' },
              { icon: 'checkmark-circle', title: 'AI HELP', desc: 'Ensure your research title meets quality standards before submitting.' },
              { icon: 'document-text', title: 'RESEARCH COLLECTION', desc: 'Digitally store your approved thesis with details to inspire future students.' },
            ].map((item, i) => (
              <View key={i} style={styles.coreFuncItem}>
                <View style={styles.coreFuncIconBox}>
                  <Ionicons name={item.icon} size={30} color={Colors.secondary} />
                </View>
                <Text style={styles.coreFuncTitle}>{item.title}</Text>
                <Text style={styles.coreFuncDesc}>{item.desc}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* ════ HOW IT WORKS SECTION ════ */}
        <View style={styles.howItWorksSection}>
          <Text style={styles.sectionSubtitle}>HOW IT WORKS</Text>
          <Text style={[styles.sectionTitle, { color: Colors.foreground }]}>Simple Workflow</Text>

          <View style={styles.workflowGrid}>
            {[
              { step: '01', title: 'REGISTER', desc: 'Securely create your student account using your TUP ID.' },
              { step: '02', title: 'EXPLORE', desc: 'Search previous research to find inspiration for your project.' },
              { step: '03', title: 'CHECK', desc: 'Upload your title and summary to get feedback.' },
              { step: '04', title: 'SAVE', desc: 'Save your research in the official TUP digital library.' },
            ].map((item, i) => (
              <View key={i} style={styles.workflowCard}>
                <View style={styles.workflowHeader}>
                  <Text style={styles.workflowStepNum}>{item.step}</Text>
                  <Text style={styles.workflowTitle}>{item.title}</Text>
                </View>
                <Text style={styles.workflowDesc}>{item.desc}</Text>
              </View>
            ))}
          </View>

          <TouchableOpacity
            style={styles.btnFooterPrimary}
            onPress={() => navigation.navigate('Register')}
            activeOpacity={0.9}
          >
            <Text style={styles.btnFooterPrimaryText}>GET STARTED NOW</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  outerContainer: {
    flex: 1,
    backgroundColor: '#0C0C14', // Deep premium dark background
  },
  container: {
    flex: 1,
  },

  // Glowing Orbs
  glowOrb1: {
    position: 'absolute',
    top: height * 0.15,
    right: -width * 0.3,
    width: width * 0.9,
    height: width * 0.9,
    borderRadius: (width * 0.9) / 2,
    zIndex: 0,
  },
  glowOrb2: {
    position: 'absolute',
    bottom: height * 0.1,
    left: -width * 0.3,
    width: width * 0.9,
    height: width * 0.9,
    borderRadius: (width * 0.9) / 2,
    zIndex: 0,
  },

  // Hero Section
  heroSection: {
    minHeight: height * 0.95,
    width: '100%',
  },
  heroSafeArea: {
    flex: 1,
    justifyContent: 'space-between',
  },
  headerNav: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginHorizontal: 16,
    borderRadius: 20,
    backgroundColor: 'rgba(38, 38, 55, 0.45)', // Translucent glass header
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
    zIndex: 100,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 8 },
      android: { elevation: 4 }
    }),
  },
  headerLogoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerLogoCircle: {
    width: 32,
    height: 32,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerLogo: {
    width: 22,
    height: 22,
  },
  headerBrand: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  headerBrandSub: {
    color: Colors.primary,
    fontSize: 8,
    fontWeight: '900',
    letterSpacing: 1.5,
  },
  headerAuthContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  headerSignInBtn: {
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  headerSignInText: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
  },
  headerRegisterBtn: {
    backgroundColor: Colors.primary,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 12,
  },
  headerRegisterText: {
    color: Colors.background,
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.5,
  },

  heroContent: {
    paddingTop: 48,
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  tagBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(45, 212, 191, 0.06)',
    borderColor: 'rgba(45, 212, 191, 0.18)',
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginBottom: 16,
  },
  tagBadgeText: {
    fontSize: 9,
    fontWeight: '900',
    color: Colors.primary,
    letterSpacing: 1.5,
  },
  heroTitle: {
    fontSize: 32,
    fontWeight: '900',
    color: '#fff',
    textAlign: 'center',
    lineHeight: 38,
    marginBottom: 16,
    letterSpacing: -0.5,
    textTransform: 'uppercase',
  },
  heroSubtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
    fontWeight: '500',
    paddingHorizontal: 12,
  },
  btnHeroPrimary: {
    backgroundColor: Colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 15,
    paddingHorizontal: 26,
    borderRadius: 16,
    width: '100%',
    maxWidth: 260,
    gap: 8,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 6,
  },
  btnHeroPrimaryText: {
    color: Colors.background,
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 1.5,
  },

  lottieContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
    paddingBottom: 20,
  },
  lottieBackground: {
    width: width * 0.9,
    height: width * 0.65,
  },

  // Centered Section Header
  sectionHeaderCentered: {
    alignItems: 'center',
    paddingHorizontal: 24,
    marginBottom: 24,
  },
  sectionTitleCentered: {
    fontSize: 26,
    fontWeight: '900',
    color: Colors.foreground,
    textTransform: 'uppercase',
    letterSpacing: -0.5,
    marginTop: 4,
    marginBottom: 12,
  },
  centeredAccentLine: {
    width: 48,
    height: 3,
    backgroundColor: Colors.primary,
    borderRadius: 2,
  },

  // Features Container
  featuresContainer: {
    paddingVertical: 48,
    borderTopWidth: 1,
    borderColor: Colors.border,
  },
  featureBlock: {
    paddingHorizontal: 24,
    paddingVertical: 20,
  },
  featureHeader: {
    marginBottom: 14,
  },
  featureNumberLabel: {
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 2,
    marginBottom: 4,
  },
  featureMainTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: Colors.foreground,
    textTransform: 'uppercase',
    lineHeight: 24,
    letterSpacing: -0.5,
    marginBottom: 8,
  },
  featureTitleUnderline: {
    height: 2,
    width: 32,
    borderRadius: 1,
  },
  featureCard: {
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
    backgroundColor: 'rgba(38, 38, 55, 0.25)', // Elegant transparent cards
  },
  featureIconBox: {
    width: 48,
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 14,
  },
  featureBadge: {
    alignSelf: 'flex-start',
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    marginBottom: 10,
  },
  featureBadgeText: {
    fontSize: 8,
    fontWeight: '900',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  featureDesc: {
    fontSize: 13,
    lineHeight: 20,
    color: Colors.textSecondary,
    fontWeight: '500',
  },

  // Why Choose
  whyChooseSection: {
    paddingVertical: 48,
    paddingHorizontal: 24,
    borderTopWidth: 1,
    borderColor: Colors.border,
  },
  sectionTitle: {
    fontSize: 30,
    fontWeight: '900',
    color: Colors.foreground,
    textTransform: 'uppercase',
    lineHeight: 34,
    letterSpacing: -0.5,
    marginBottom: 16,
  },
  sectionTitleAccent: {
    color: Colors.primary,
  },
  sectionDesc: {
    fontSize: 14,
    lineHeight: 22,
    color: Colors.textSecondary,
    fontWeight: '500',
    marginBottom: 28,
  },
  benefitsGrid: {
    gap: 12,
  },
  benefitCard: {
    backgroundColor: 'rgba(38, 38, 55, 0.2)',
    padding: 20,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.04)',
  },
  benefitIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: 'rgba(45, 212, 191, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(45, 212, 191, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  benefitTitle: {
    fontSize: 14,
    fontWeight: '900',
    color: Colors.foreground,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  benefitDesc: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontWeight: '500',
    lineHeight: 18,
  },

  // Core Functions
  coreFunctionsSection: {
    paddingVertical: 48,
    paddingHorizontal: 24,
    borderTopWidth: 1,
    borderColor: Colors.border,
  },
  sectionTitleWhite: {
    fontSize: 26,
    fontWeight: '900',
    color: Colors.foreground,
    textTransform: 'uppercase',
    letterSpacing: -0.5,
    marginTop: 4,
    marginBottom: 12,
    textAlign: 'center',
  },
  coreFunctionsList: {
    gap: 28,
    marginTop: 32,
  },
  coreFuncItem: {
    alignItems: 'center',
    backgroundColor: 'rgba(38, 38, 55, 0.15)',
    padding: 24,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.03)',
  },
  coreFuncIconBox: {
    width: 64,
    height: 64,
    borderRadius: 16,
    backgroundColor: 'rgba(103,232,249,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(103,232,249,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  coreFuncTitle: {
    fontSize: 14,
    fontWeight: '900',
    color: Colors.foreground,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  coreFuncDesc: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontWeight: '500',
    lineHeight: 18,
    textAlign: 'center',
  },

  // How It Works
  howItWorksSection: {
    paddingVertical: 48,
    paddingHorizontal: 24,
    borderTopWidth: 1,
    borderColor: Colors.border,
  },
  workflowGrid: {
    gap: 12,
    marginBottom: 28,
  },
  workflowCard: {
    backgroundColor: 'rgba(38, 38, 55, 0.2)',
    padding: 20,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.04)',
  },
  workflowHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 8,
  },
  workflowStepNum: {
    fontSize: 20,
    fontWeight: '900',
    color: Colors.primary,
    opacity: 0.8,
  },
  workflowTitle: {
    fontSize: 14,
    fontWeight: '900',
    color: Colors.foreground,
    textTransform: 'uppercase',
  },
  workflowDesc: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontWeight: '500',
    lineHeight: 18,
  },
  btnFooterPrimary: {
    backgroundColor: Colors.primary,
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 6,
  },
  btnFooterPrimaryText: {
    color: Colors.background,
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 1.5,
  },
});

export default LandingScreen;