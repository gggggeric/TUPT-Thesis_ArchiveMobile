import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Dimensions,
  ImageBackground,
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
    outputRange: [20, 0],
  });

  return (
    <ScrollView
      style={styles.container}
      showsVerticalScrollIndicator={false}
      bounces={false}
    >
      {/* ════ HERO SECTION ════ */}
      <View style={styles.heroSection}>
          <LinearGradient
            colors={['#0a0a0f', '#1e1e2e', '#0a0a0f']}
            style={styles.heroGradient}
          >
            <View style={[styles.heroSafeArea, { paddingTop: insets.top }]}>
              {/* Header Nav */}
              <Animated.View style={[styles.headerNav, { 
                top: insets.top, 
                opacity: secondaryActionsAnim, 
                transform: [{ translateY: translateY(secondaryActionsAnim) }] 
              }]}>
                <View style={styles.headerLogoContainer}>
                  <View style={styles.headerLogoCircle}>
                    <Image source={require('../assets/tup-logo.png')} style={styles.headerLogo} resizeMode="contain" />
                  </View>
                  <View>
                    <Text style={styles.headerBrand}>TUPT LIBRARY</Text>
                    <Text style={styles.headerBrandSub}>ACTIVE SYSTEM</Text>
                  </View>
                </View>

                <View style={styles.headerAuthContainer}>
                  <TouchableOpacity onPress={() => navigation.navigate('Login')} style={styles.headerSignInBtn}>
                    <Text style={styles.headerSignInText}>SIGN IN</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => navigation.navigate('Register')} style={styles.headerRegisterBtn}>
                    <Text style={styles.headerRegisterText}>REGISTER</Text>
                  </TouchableOpacity>
                </View>
              </Animated.View>

              {/* Hero Content - Adjusted for iPhone */}
              <View style={[styles.heroContent, { paddingTop: 80 }]}>
                <View style={styles.heroTextContainer}>
                  <Animated.Text style={[
                    styles.heroTitle,
                    { opacity: titleAnim, transform: [{ translateY: translateY(titleAnim) }] }
                  ]}>
                    TUP DIGITAL RESEARCH LIBRARY
                  </Animated.Text>

                  <Animated.Text style={[
                    styles.heroSubtitle,
                    { opacity: subtitleAnim, transform: [{ translateY: translateY(subtitleAnim) }] }
                  ]}>
                    A central library for TUP students. Store, search, and check your research with university standards.
                  </Animated.Text>

                  <Animated.View style={{ 
                    opacity: primaryBtnAnim, 
                    transform: [{ translateY: translateY(primaryBtnAnim) }],
                    width: '100%',
                    alignItems: 'center',
                    marginTop: 10
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
              </View>

              {/* Lottie Animation - More compact for iPhone */}
              <View style={styles.lottieContainer}>
                <LottieView
                  source={require('../assets/animations/Man and robot with computers sitting together in workplace.json')}
                  autoPlay
                  loop
                  style={[styles.lottieBackground, { height: width * 0.7 }]}
                />
              </View>
            </View>
          </LinearGradient>
      </View>

      {/* ════ FEATURE SECTIONS ════ */}
      <View style={styles.featuresContainer}>
        {features.map((feat) => (
          <View key={feat.number} style={styles.featureBlock}>
            <View style={styles.featureHeader}>
              <Text style={[styles.featureNumberLabel, { color: feat.color }]}>FEATURE {feat.number}</Text>
              <Text style={styles.featureMainTitle}>{feat.title}</Text>
              <View style={[styles.featureTitleUnderline, { backgroundColor: feat.color }]} />
            </View>

            <View style={styles.featureCard}>
              <View style={[styles.featureIconBox, { backgroundColor: `${feat.color}18`, borderColor: `${feat.color}30` }]}>
                <Ionicons name={feat.icon} size={30} color={feat.color} />
              </View>

              <View style={[styles.featureBadge, { borderColor: `${feat.color}40` }]}>
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
            { title: 'Trusted Source', desc: 'Secure library endorsed by TUP-Taguig leadership.', icon: 'shield-checkmark' },
            { title: 'Modern Tools', desc: 'Next-gen search and analysis interface.', icon: 'rocket' },
            { title: 'Simple Design', desc: 'A simple, clean student experience.', icon: 'bulb' },
            { title: 'Verified Quality', desc: 'AI checking for academic standards.', icon: 'checkmark-circle' },
          ].map((item, i) => (
            <View key={i} style={styles.benefitCard}>
              <Ionicons name={item.icon} size={28} color={Colors.primary} style={styles.benefitIcon} />
              <Text style={styles.benefitTitle}>{item.title}</Text>
              <Text style={styles.benefitDesc}>{item.desc}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* ════ CORE FUNCTIONS SECTION ════ */}
      <LinearGradient
        colors={[Colors.card, Colors.background]}
        style={styles.coreFunctionsSection}
      >
        <Text style={styles.sectionSubtitleSecondary}>WHAT THE APP DOES</Text>
        <Text style={styles.sectionTitleWhite}>WHAT DOES IT DO?</Text>

        <View style={styles.coreFunctionsList}>
          {[
            { icon: 'search', title: 'QUICK SEARCH', desc: 'Search thousands of student papers in milliseconds with our advanced search system.' },
            { icon: 'checkmark-circle', title: 'AI HELP', desc: 'Ensure your research title meets quality standards before submitting.' },
            { icon: 'document-text', title: 'RESEARCH COLLECTION', desc: 'Digitally store your approved thesis with details to inspire future students.' },
          ].map((item, i) => (
            <View key={i} style={styles.coreFuncItem}>
              <View style={styles.coreFuncIconBox}>
                <Ionicons name={item.icon} size={36} color={Colors.secondary} />
              </View>
              <Text style={styles.coreFuncTitle}>{item.title}</Text>
              <Text style={styles.coreFuncDesc}>{item.desc}</Text>
            </View>
          ))}
        </View>
      </LinearGradient>

      {/* ════ HOW IT WORKS SECTION ════ */}
      <View style={styles.howItWorksSection}>
        <Text style={styles.sectionSubtitle}>HOW IT WORKS</Text>
        <Text style={[styles.sectionTitle, { color: Colors.foreground }]}>HOW DOES IT WORK?</Text>

        <View style={styles.workflowGrid}>
          {[
            { step: '01', title: 'REGISTER', desc: 'Securely create your student account using your TUP ID.' },
            { step: '02', title: 'EXPLORE', desc: 'Search previous research to find inspiration for your project.' },
            { step: '03', title: 'CHECK', desc: 'Upload your title and summary to get feedback.' },
            { step: '04', title: 'SAVE', desc: 'Save your research in the official TUP digital library.' },
          ].map((item, i) => (
            <View key={i} style={styles.workflowCard}>
              <Text style={styles.workflowStepNum}>{item.step}</Text>
              <Text style={styles.workflowTitle}>{item.title}</Text>
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
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },

  // -- Hero --
  heroSection: {
    height: height,
    width: '100%',
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  heroGradient: {
    flex: 1,
  },
  heroSafeArea: {
    flex: 1,
  },
  lottieContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  lottieBackground: {
    width: width,
    height: width * 0.8, // Adjust aspect ratio to fit below text
  },
  headerNav: {
    position: 'absolute',
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 0,
    paddingBottom: 10,
    zIndex: 100,
  },
  headerLogoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  headerLogoCircle: {
    width: 36,
    height: 36,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 4,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerLogo: {
    width: 24,
    height: 24,
  },
  headerBrand: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 1,
  },
  headerBrandSub: {
    color: Colors.primary,
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 2,
  },
  headerAuthContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  headerSignInBtn: {
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  headerSignInText: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 11,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  headerRegisterBtn: {
    backgroundColor: Colors.primary,
    paddingVertical: 9,
    paddingHorizontal: 16,
    borderRadius: 4,
  },
  headerRegisterText: {
    color: Colors.background,
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 1,
  },
  heroContent: {
    paddingTop: 100, // Make room for absolute header
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  heroTextContainer: {
    alignItems: 'center',
  },
  heroTitle: {
    fontSize: 36,
    fontWeight: '900',
    color: '#fff',
    textAlign: 'center',
    lineHeight: 40,
    marginBottom: 20,
    letterSpacing: -0.5,
  },
  heroSubtitle: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.65)',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
    fontWeight: '500',
    paddingHorizontal: 10,
  },
  btnHeroPrimary: {
    backgroundColor: Colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    paddingHorizontal: 32,
    borderRadius: 4,
    width: '100%',
    maxWidth: 320,
    gap: 12,
    ...Platform.select({
      ios: { shadowColor: Colors.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8 },
      android: { elevation: 6 }
    }),
  },
  btnHeroPrimaryText: {
    color: Colors.background,
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 2,
  },

  // -- Features --
  featuresContainer: {
    backgroundColor: Colors.background,
    paddingVertical: 20,
  },
  featureBlock: {
    paddingHorizontal: 24,
    paddingVertical: 32,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  featureHeader: {
    marginBottom: 20,
  },
  featureNumberLabel: {
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 3,
    marginBottom: 10,
  },
  featureMainTitle: {
    fontSize: 28,
    fontWeight: '900',
    color: Colors.foreground,
    textTransform: 'uppercase',
    lineHeight: 31,
    letterSpacing: -0.5,
    marginBottom: 14,
  },
  featureTitleUnderline: {
    height: 3,
    width: 50,
    borderRadius: 1,
  },
  featureCard: {
    borderRadius: 4,
    padding: 20,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.card,
  },
  featureIconBox: {
    width: 56,
    height: 56,
    borderRadius: 4,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  featureBadge: {
    alignSelf: 'flex-start',
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 4,
    marginBottom: 12,
  },
  featureBadgeText: {
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  featureDesc: {
    fontSize: 14,
    lineHeight: 22,
    color: Colors.textSecondary,
    fontWeight: '500',
  },

  // -- Why Choose --
  whyChooseSection: {
    backgroundColor: Colors.surface,
    paddingTop: 60,
    paddingBottom: 60,
    paddingHorizontal: 24,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  sectionSubtitle: {
    color: Colors.primary,
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 3,
    marginBottom: 12,
  },
  sectionSubtitleSecondary: {
    color: Colors.secondary,
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 3,
    marginBottom: 12,
    textAlign: 'center',
  },
  sectionTitle: {
    fontSize: 36,
    fontWeight: '900',
    color: Colors.foreground,
    textTransform: 'uppercase',
    lineHeight: 38,
    letterSpacing: -1,
    marginBottom: 20,
  },
  sectionTitleAccent: {
    color: Colors.primary,
  },
  sectionDesc: {
    fontSize: 16,
    lineHeight: 24,
    color: Colors.textSecondary,
    fontWeight: '500',
    marginBottom: 36,
  },
  benefitsGrid: {
    gap: 14,
  },
  benefitCard: {
    backgroundColor: Colors.card,
    padding: 20,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  benefitIcon: {
    marginBottom: 12,
  },
  benefitTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: Colors.foreground,
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  benefitDesc: {
    fontSize: 13,
    color: Colors.textSecondary,
    fontWeight: '500',
    lineHeight: 18,
  },

  // -- Core Functions --
  coreFunctionsSection: {
    paddingVertical: 60,
    paddingHorizontal: 24,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  sectionTitleWhite: {
    fontSize: 34,
    fontWeight: '900',
    color: Colors.foreground,
    textTransform: 'uppercase',
    lineHeight: 36,
    letterSpacing: -1,
    marginBottom: 40,
    textAlign: 'center',
  },
  coreFunctionsList: {
    gap: 40,
  },
  coreFuncItem: {
    alignItems: 'center',
  },
  coreFuncIconBox: {
    width: 80,
    height: 80,
    borderRadius: 6,
    backgroundColor: 'rgba(103,232,249,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(103,232,249,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  coreFuncTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: Colors.foreground,
    textTransform: 'uppercase',
    marginBottom: 10,
  },
  coreFuncDesc: {
    fontSize: 14,
    color: Colors.textSecondary,
    fontWeight: '500',
    lineHeight: 20,
    textAlign: 'center',
  },

  // -- How It Works --
  howItWorksSection: {
    backgroundColor: Colors.background,
    paddingVertical: 60,
    paddingHorizontal: 24,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  workflowGrid: {
    gap: 14,
    marginBottom: 40,
  },
  workflowCard: {
    backgroundColor: Colors.card,
    padding: 20,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  workflowStepNum: {
    fontSize: 44,
    fontWeight: '900',
    color: 'rgba(255,255,255,0.06)',
    marginBottom: 12,
    letterSpacing: -2,
  },
  workflowTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: Colors.foreground,
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  workflowDesc: {
    fontSize: 13,
    color: Colors.textSecondary,
    fontWeight: '500',
    lineHeight: 18,
  },
  btnFooterPrimary: {
    backgroundColor: Colors.primary,
    paddingVertical: 18,
    borderRadius: 4,
    alignItems: 'center',
    ...Platform.select({
      ios: { shadowColor: Colors.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8 },
      android: { elevation: 6 }
    }),
  },
  btnFooterPrimaryText: {
    color: Colors.background,
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 2,
  },
});

export default LandingScreen;