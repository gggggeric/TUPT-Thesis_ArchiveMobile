import React, { useState } from 'react';
import {
    View, Text, StyleSheet, ScrollView, TouchableOpacity,
    TextInput, Platform, Alert, ActivityIndicator, Modal, FlatList,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import CustomHeader from '../../Navigation/CustomHeader';
import GridMenu from '../../Navigation/GridMenu';
import API_BASE_URL from '../../../api';
import Colors from '../../../utils/Colors';

const COURSES = [
    'BENG',
    'BET',
    'BETEM',
    'BETICT',
    'BETMC',
    'BETMT',
    'BETNT',
    'BSCE',
    'BSECE',
    'BSEE',
    'BSES',
    'BSIT',
    'BSME',
    'BTAU',
    'BTTE',
    'BTVED',
    'BTVTED',
];

const SubmitThesis = () => {
    const navigation = useNavigation();
    const [isMenuVisible, setIsMenuVisible] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showCoursePicker, setShowCoursePicker] = useState(false);
    const [showProfessorPicker, setShowProfessorPicker] = useState(false);
    const [professors, setProfessors] = useState([]);

    const [formData, setFormData] = useState({
        title: '',
        abstract: '',
        author: '',
        year_range: '',
        course: '',
        professorId: '',
    });

    React.useEffect(() => {
        fetchProfessors();
    }, []);

    const fetchProfessors = async () => {
        try {
            const token = await AsyncStorage.getItem('userToken');
            const res = await fetch(`${API_BASE_URL}/user/professors`, {
                headers: { 'Authorization': `Bearer ${token}` },
            });
            const data = await res.json();
            if (data.success) {
                setProfessors(data.data);
            }
        } catch (err) {
            console.error('Error fetching professors:', err);
        }
    };

    const updateField = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleSubmit = async () => {
        const { title, abstract, author, year_range, course } = formData;
        if (!title || !abstract || !author || !year_range || !course) {
            return Alert.alert('Incomplete', 'Please fill in all fields before submitting.');
        }

        setIsSubmitting(true);
        try {
            const token = await AsyncStorage.getItem('userToken');
            const res = await fetch(`${API_BASE_URL}/user/theses`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData),
            });

            if (res.ok) {
                Alert.alert('Success', 'Thesis submitted for approval!', [
                    { text: 'OK', onPress: () => navigation.navigate('MySubmissions') }
                ]);
            } else {
                const data = await res.json();
                Alert.alert('Error', data.message || 'Failed to submit thesis');
            }
        } catch (err) {
            Alert.alert('Error', 'Could not connect to server');
        } finally {
            setIsSubmitting(false);
        }
    };

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

            <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                {/* Back Button */}
                <TouchableOpacity style={styles.backRow} onPress={() => navigation.navigate('Home')}>
                    <Ionicons name="arrow-back" size={16} color={Colors.primary} />
                    <Text style={styles.backText}>Back to Dashboard</Text>
                </TouchableOpacity>

                {/* Form Card */}
                <View style={styles.formCard}>
                    <View style={styles.formHeader}>
                        <Text style={styles.formTitle}>Submit Thesis</Text>
                        <Text style={styles.formSubtitle}>UPLOAD NEW DOCUMENT</Text>
                    </View>

                    {/* Research Title */}
                    <View style={styles.fieldGroup}>
                        <Text style={styles.fieldLabel}>RESEARCH TITLE</Text>
                        <TextInput
                            style={styles.input}
                            value={formData.title}
                            onChangeText={v => updateField('title', v)}
                            placeholder="Enter full thesis title"
                            placeholderTextColor="#9ca3af"
                        />
                    </View>

                    {/* Author */}
                    <View style={styles.fieldGroup}>
                        <Text style={styles.fieldLabel}>AUTHOR</Text>
                        <TextInput
                            style={styles.input}
                            value={formData.author}
                            onChangeText={v => updateField('author', v)}
                            placeholder="Last Name, First Name"
                            placeholderTextColor="#9ca3af"
                        />
                    </View>

                    {/* Year + Category Row */}
                    <View style={styles.rowGroup}>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.fieldLabel}>PUBLICATION YEAR</Text>
                            <TextInput
                                style={styles.input}
                                value={formData.year_range}
                                onChangeText={v => updateField('year_range', v)}
                                placeholder="e.g. 2023-2024"
                                placeholderTextColor="#9ca3af"
                            />
                        </View>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.fieldLabel}>DEPARTMENT</Text>
                            <TouchableOpacity
                                style={styles.dropdownBtn}
                                onPress={() => setShowCoursePicker(true)}
                                activeOpacity={0.7}
                            >
                                <Text style={[styles.dropdownBtnText, !formData.course && { color: '#9ca3af' }]}>
                                    {formData.course || 'Select Department'}
                                </Text>
                                <Ionicons name="chevron-down" size={16} color="#6b7280" />
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* Professor Picker */}
                    <View style={styles.fieldGroup}>
                        <Text style={styles.fieldLabel}>ASSIGN PROFESSOR FOR APPROVAL</Text>
                        <TouchableOpacity
                            style={styles.dropdownBtn}
                            onPress={() => setShowProfessorPicker(true)}
                            activeOpacity={0.7}
                        >
                            <Text style={[styles.dropdownBtnText, !formData.professorId && { color: '#9ca3af' }]}>
                                {formData.professorId ? professors.find(p => p._id === formData.professorId)?.name : 'Select Professor'}
                            </Text>
                            <Ionicons name="person" size={16} color={Colors.primary} />
                        </TouchableOpacity>
                    </View>

                    {/* Abstract */}
                    <View style={styles.fieldGroup}>
                        <Text style={styles.fieldLabel}>ABSTRACT</Text>
                        <TextInput
                            style={[styles.input, styles.inputMultiline]}
                            value={formData.abstract}
                            onChangeText={v => updateField('abstract', v)}
                            placeholder="Paste the abstract here..."
                            placeholderTextColor="#9ca3af"
                            multiline
                            numberOfLines={6}
                            textAlignVertical="top"
                        />
                    </View>

                    {/* Buttons */}
                    <View style={styles.formActions}>
                        <TouchableOpacity style={styles.cancelBtn} onPress={() => navigation.navigate('Home')}>
                            <Text style={styles.cancelBtnText}>Cancel</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.submitBtn, isSubmitting && styles.btnDisabled]}
                            onPress={handleSubmit}
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? (
                                <ActivityIndicator color="#fff" size="small" />
                            ) : (
                                <>
                                    <Ionicons name="cloud-upload" size={18} color="#fff" />
                                    <Text style={styles.submitBtnText}>Submit</Text>
                                </>
                            )}
                        </TouchableOpacity>
                    </View>
                </View>
            </ScrollView>

            {/* Course Picker Modal */}
            <Modal visible={showCoursePicker} transparent animationType="fade">
                <TouchableOpacity
                    style={styles.modalOverlay}
                    activeOpacity={1}
                    onPress={() => setShowCoursePicker(false)}
                >
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Select Course</Text>
                        {COURSES.map((course) => (
                            <TouchableOpacity
                                key={course}
                                style={[styles.modalItem, formData.course === course && styles.modalItemActive]}
                                onPress={() => { updateField('course', course); setShowCoursePicker(false); }}
                            >
                                <Text style={[styles.modalItemText, formData.course === course && styles.modalItemTextActive]}>{course}</Text>
                                {formData.course === course && <Ionicons name="checkmark" size={18} color="#7f0000" />}
                            </TouchableOpacity>
                        ))}
                    </View>
                </TouchableOpacity>
            </Modal>

            {/* Professor Picker Modal */}
            <Modal visible={showProfessorPicker} transparent animationType="slide">
                <TouchableOpacity
                    style={styles.modalOverlay}
                    activeOpacity={1}
                    onPress={() => setShowProfessorPicker(false)}
                >
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Choose Professor</Text>
                        <FlatList
                            data={professors}
                            keyExtractor={(item) => item._id}
                            renderItem={({ item }) => (
                                <TouchableOpacity
                                    style={[styles.modalItem, formData.professorId === item._id && styles.modalItemActive]}
                                    onPress={() => { updateField('professorId', item._id); setShowProfessorPicker(false); }}
                                >
                                    <View>
                                        <Text style={[styles.modalItemText, formData.professorId === item._id && styles.modalItemTextActive]}>{item.name}</Text>
                                        <Text style={{ fontSize: 10, color: '#6b7280' }}>ID: {item.idNumber}</Text>
                                    </View>
                                    {formData.professorId === item._id && <Ionicons name="checkmark" size={18} color={Colors.primary} />}
                                </TouchableOpacity>
                            )}
                            ListEmptyComponent={() => (
                                <Text style={{ textAlign: 'center', padding: 20, color: '#6b7280' }}>No professors available</Text>
                            )}
                            style={{ maxHeight: 400 }}
                        />
                    </View>
                </TouchableOpacity>
            </Modal>
        </LinearGradient>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },
    scroll: { flex: 1 },
    scrollContent: { paddingTop: 20, paddingBottom: 60, paddingHorizontal: 20 },
    backRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 20 },
    backText: { color: Colors.primary, fontSize: 10, fontWeight: '900', letterSpacing: 2, textTransform: 'uppercase' },

    formCard: {
        backgroundColor: Colors.card, borderRadius: 28, padding: 24, overflow: 'hidden',
        borderWidth: 1, borderColor: Colors.border,
        ...Platform.select({
            ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 12 }, shadowOpacity: 0.4, shadowRadius: 24 },
            android: { elevation: 8 }
        }),
    },
    formHeader: { borderBottomWidth: 1, borderBottomColor: Colors.border, paddingBottom: 16, marginBottom: 24 },
    formTitle: { fontSize: 20, fontWeight: '900', color: Colors.foreground, textTransform: 'uppercase', marginBottom: 4 },
    formSubtitle: { fontSize: 9, fontWeight: '900', color: Colors.primary, letterSpacing: 2 },

    fieldGroup: { marginBottom: 20 },
    fieldLabel: { fontSize: 8, fontWeight: '900', color: Colors.textDim, letterSpacing: 1.5, marginBottom: 8 },
    input: {
        backgroundColor: 'rgba(255,255,255,0.03)', borderWidth: 1, borderColor: Colors.border, borderRadius: 16, paddingHorizontal: 20, paddingVertical: 16,
        fontSize: 14, color: Colors.foreground, fontWeight: '500',
    },
    inputMultiline: { minHeight: 120, textAlignVertical: 'top' },

    rowGroup: { flexDirection: 'row', gap: 12, marginBottom: 20 },
    dropdownBtn: {
        backgroundColor: 'rgba(255,255,255,0.03)', borderWidth: 1, borderColor: Colors.border, borderRadius: 16,
        paddingHorizontal: 20, paddingVertical: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    },
    dropdownBtnText: { fontSize: 13, color: Colors.foreground, fontWeight: '500', flex: 1 },

    formActions: { flexDirection: 'row', gap: 12, paddingTop: 24, borderTopWidth: 1, borderTopColor: Colors.border, marginTop: 12 },
    cancelBtn: { flex: 1, padding: 18, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
    cancelBtnText: { color: Colors.textSecondary, fontWeight: '900', fontSize: 10, letterSpacing: 1, textTransform: 'uppercase' },
    submitBtn: {
        flex: 2, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
        backgroundColor: Colors.primary, borderRadius: 16, padding: 18,
    },
    submitBtnText: { color: '#fff', fontWeight: '900', fontSize: 10, letterSpacing: 1, textTransform: 'uppercase' },
    btnDisabled: { opacity: 0.6 },

    // Modal
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', alignItems: 'center', padding: 24 },
    modalContent: { backgroundColor: Colors.card, borderRadius: 32, padding: 24, width: '100%', maxWidth: 360, borderWidth: 1, borderColor: Colors.border },
    modalTitle: { fontSize: 12, fontWeight: '900', color: Colors.foreground, textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 20, textAlign: 'center' },
    modalItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 14, paddingHorizontal: 20, borderRadius: 14, marginBottom: 6 },
    modalItemActive: { backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1, borderColor: Colors.primary },
    modalItemText: { fontSize: 14, color: Colors.textSecondary, fontWeight: '500' },
    modalItemTextActive: { color: Colors.primary, fontWeight: '900' },
});

export default SubmitThesis;
