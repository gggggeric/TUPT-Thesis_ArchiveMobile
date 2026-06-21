import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import CustomHeader from '../Navigation/CustomHeader';
import GridMenu from '../Navigation/GridMenu';
import BottomNavBar from '../Navigation/BottomNavBar';
import Colors from '../../utils/Colors';

const { width } = Dimensions.get('window');

const DocumentsHub = () => {
    const navigation = useNavigation();
    const [isMenuVisible, setIsMenuVisible] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    const handleSearch = () => {
        if (searchQuery.trim()) {
            navigation.navigate('SmartSearch', { initialQuery: searchQuery.trim() });
            setSearchQuery('');
        }
    };

    return (
        <LinearGradient colors={[Colors.background, Colors.surface, Colors.background]} style={styles.container}>
            <CustomHeader
                onMenuPress={() => setIsMenuVisible(true)}
                onSearch={handleSearch}
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
            />
            {/* Grid Menu */}
            <GridMenu isVisible={isMenuVisible} onClose={() => setIsMenuVisible(false)} navigation={navigation} />

            <ScrollView 
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                {/* Hero Minimal Header */}
                <View style={styles.heroSection}>
                    <Text style={styles.heroTagline}>WORKSPACE</Text>
                    <Text style={styles.heroTitle}>Documents Hub</Text>
                    <Text style={styles.heroDesc}>
                        Analyze documents for thesis compatibility, track your drafts, or submit finalized research.
                    </Text>
                </View>

                {/* Main Action Cards matching Web Features */}
                <View style={styles.cardsContainer}>
                    
                    {/* 1. Analysis Workspace equivalent */}
                    <TouchableOpacity 
                        style={styles.actionCard}
                        onPress={() => navigation.navigate('AnalysisWorkspace')}
                        activeOpacity={0.8}
                    >
                        <View style={[styles.cardIconBox, { backgroundColor: `${Colors.primary}15`, borderColor: `${Colors.primary}30` }]}>
                            <Ionicons name="document-text" size={28} color={Colors.primary} />
                        </View>
                        <View style={styles.cardTextContainer}>
                            <Text style={styles.cardTitle}>Analysis Workspace</Text>
                            <Text style={styles.cardDescription}>Upload a PDF/DOCX to check scope, grammar, and methodology issues against the archive.</Text>
                        </View>
                        <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
                    </TouchableOpacity>

                    {/* 2. My Submissions / Drafts */}
                    <TouchableOpacity 
                        style={styles.actionCard}
                        onPress={() => navigation.navigate('MySubmissions')}
                        activeOpacity={0.8}
                    >
                        <View style={[styles.cardIconBox, { backgroundColor: `${Colors.purple}15`, borderColor: `${Colors.purple}30` }]}>
                            <Ionicons name="folder-open" size={28} color={Colors.purple} />
                        </View>
                        <View style={styles.cardTextContainer}>
                            <Text style={styles.cardTitle}>My Submissions / Drafts</Text>
                            <Text style={styles.cardDescription}>View your previously processed thesis drafts and saved analyses.</Text>
                        </View>
                        <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
                    </TouchableOpacity>

                    {/* 3. Submit Thesis */}
                    <TouchableOpacity 
                        style={styles.actionCard}
                        onPress={() => navigation.navigate('SubmitThesis')}
                        activeOpacity={0.8}
                    >
                        <View style={[styles.cardIconBox, { backgroundColor: `${Colors.orange}15`, borderColor: `${Colors.orange}30` }]}>
                            <Ionicons name="cloud-upload" size={28} color={Colors.orange} />
                        </View>
                        <View style={styles.cardTextContainer}>
                            <Text style={styles.cardTitle}>Submit Thesis</Text>
                            <Text style={styles.cardDescription}>Contribute your completed research thesis into the university portal database.</Text>
                        </View>
                        <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
                    </TouchableOpacity>

                </View>

                {/* Instructions / How it works (matches web HowItWorks component) */}
                <View style={styles.infoSection}>
                    <Text style={styles.infoSectionTitle}>How It Works</Text>
                    
                    <View style={styles.stepItem}>
                        <View style={styles.stepNumber}><Text style={styles.stepNumberText}>1</Text></View>
                        <View style={styles.stepTextContent}>
                            <Text style={styles.stepTitle}>Upload Document</Text>
                            <Text style={styles.stepDesc}>Submit your draft in the Analysis Workspace.</Text>
                        </View>
                    </View>
                    
                    <View style={styles.stepItem}>
                         <View style={styles.stepNumber}><Text style={styles.stepNumberText}>2</Text></View>
                         <View style={styles.stepTextContent}>
                              <Text style={styles.stepTitle}>AI Processing</Text>
                              <Text style={styles.stepDesc}>Our engine checks formatting, vocabulary, and redundancy.</Text>
                         </View>
                    </View>

                    <View style={styles.stepItem}>
                         <View style={styles.stepNumber}><Text style={styles.stepNumberText}>3</Text></View>
                         <View style={styles.stepTextContent}>
                              <Text style={styles.stepTitle}>Review & Submit</Text>
                              <Text style={styles.stepDesc}>Fix identified issues and use Submit Thesis to finalize.</Text>
                         </View>
                    </View>
                </View>

            </ScrollView>

            {/* Bottom Nav Bar */}
            <BottomNavBar activeScreen="DocumentsHub" onGridPress={() => setIsMenuVisible(true)} />
        </LinearGradient>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        paddingTop: 40,
        paddingBottom: 110,
    },
    heroSection: {
        paddingHorizontal: 24,
        marginBottom: 32,
    },
    heroTagline: {
        fontSize: 10,
        fontWeight: '900',
        color: Colors.primary,
        letterSpacing: 2,
        marginBottom: 8,
    },
    heroTitle: {
        fontSize: 32,
        fontWeight: '900',
        color: Colors.foreground,
        marginBottom: 8,
    },
    heroDesc: {
        fontSize: 14,
        color: Colors.textSecondary,
        fontWeight: '500',
        lineHeight: 20,
    },
    cardsContainer: {
        paddingHorizontal: 24,
        gap: 16,
        marginBottom: 40,
    },
    actionCard: {
        backgroundColor: Colors.card,
        borderRadius: 24,
        padding: 20,
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: Colors.border,
        ...Platform.select({
            ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.3, shadowRadius: 12 },
            android: { elevation: 6 }
        }),
    },
    cardIconBox: {
        width: 52,
        height: 52,
        borderRadius: 14,
        borderWidth: 1,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 16,
    },
    cardTextContainer: {
        flex: 1,
        marginRight: 10,
    },
    cardTitle: {
        fontSize: 15,
        fontWeight: '900',
        color: Colors.foreground,
        marginBottom: 4,
    },
    cardDescription: {
        fontSize: 12,
        color: Colors.textSecondary,
        lineHeight: 16,
    },
    infoSection: {
        paddingHorizontal: 24,
        backgroundColor: 'rgba(0,0,0,0.2)', // translucent dark box
        marginHorizontal: 24,
        borderRadius: 24,
        paddingVertical: 24,
    },
    infoSectionTitle: {
        fontSize: 12,
        fontWeight: '900',
        color: '#fff',
        letterSpacing: 1.5,
        marginBottom: 20,
        textTransform: 'uppercase',
    },
    stepItem: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        marginBottom: 16,
    },
    stepNumber: {
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: Colors.primary,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
        marginTop: 2,
    },
    stepNumberText: {
        fontSize: 10,
        fontWeight: 'bold',
        color: '#fff',
    },
    stepTextContent: {
        flex: 1,
    },
    stepTitle: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#fff',
        marginBottom: 2,
    },
    stepDesc: {
        fontSize: 12,
        color: 'rgba(255,255,255,0.6)',
        lineHeight: 18,
    }
});

export default DocumentsHub;
