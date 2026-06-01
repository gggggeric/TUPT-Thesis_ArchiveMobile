import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  SafeAreaView
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import API_BASE_URL from '../../api';
import { useToast } from '../../utils/ToastContext';
import Colors from '../../utils/Colors';

const RegisterScreen = () => {
  const navigation = useNavigation();
  const [formData, setFormData] = useState({
    fullName: '',
    idNumber: '',
    birthdate: '',
    password: '',
    confirmPassword: '',
    isGraduate: false,
    isProfessor: false,
  });
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const toast = useToast();

  const handleInputChange = (field, value) => {
    if (field === 'idNumber') {
      let formattedValue = value.toUpperCase();
      if (formattedValue.length < formData.idNumber.length) {
        setFormData(prev => ({ ...prev, [field]: formattedValue }));
        return;
      }
      let clean = formattedValue.replace(/[^A-Z0-9]/g, '');
      if (clean.length > 0 && !clean.startsWith('TUPT')) clean = 'TUPT' + clean;
      let result = clean;
      if (clean.length > 4) result = clean.slice(0, 4) + '-' + clean.slice(4);
      if (result.length > 7) result = result.slice(0, 7) + '-' + result.slice(7, 11);
      setFormData(prev => ({ ...prev, [field]: result.slice(0, 12) }));
      return;
    }
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleDateChange = (event, date) => {
    setShowDatePicker(Platform.OS === 'ios');
    if (date) {
      setSelectedDate(date);
      if (Platform.OS !== 'ios') setShowDatePicker(false);
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      setFormData(prev => ({ ...prev, birthdate: `${year}-${month}-${day}` }));
    } else {
      setShowDatePicker(false);
    }
  };

  const validateIDNumber = (idNumber) => /^TUPT-\d{2}-\d{4}$/.test(idNumber);

  const handleRegister = async () => {
    const { fullName, idNumber, birthdate, password, confirmPassword } = formData;
    if (!fullName || !idNumber || !birthdate || !password || !confirmPassword) {
      toast.show('Please fill in all fields', 'error');
      return;
    }
    if (!validateIDNumber(idNumber)) {
      toast.show('Please enter a valid ID number: TUPT-XX-XXXX', 'error');
      return;
    }

    // Age validation (Must be at least 18)
    const today = new Date();
    const birth = new Date(birthdate);
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    if (age < 18) {
      toast.show('You must be at least 18 years old to register', 'error');
      return;
    }
    if (password !== confirmPassword) {
      toast.show('Passwords do not match', 'error');
      return;
    }
    if (password.length < 6) {
      toast.show('Password must be at least 6 characters', 'error');
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: fullName,
          idNumber,
          birthdate,
          password,
          isGraduate: formData.isGraduate,
          isProfessor: formData.isProfessor
        }),
      });
      const data = await response.json();
      if (response.ok) {
        toast.show(data.message || 'Account created successfully!', 'success');
        setTimeout(() => navigation.navigate('Login'), 1500);
      } else {
        const errorDetail = data.error ? `\nDetails: ${data.error}` : '';
        toast.show(`${data.message || 'Registration failed'}${errorDetail}`, 'error');
      }
    } catch (error) {
      toast.show('Cannot connect to server. Please try again.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClear = () => {
    setFormData({ fullName: '', idNumber: '', birthdate: '', password: '', confirmPassword: '', isGraduate: false, isProfessor: false });
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContainer}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerEyebrow}>TUP RESEARCH LIBRARY</Text>
            <Text style={styles.headerTitle}>CREATE ACCOUNT</Text>
            <View style={styles.headerAccentLine} />
            <Text style={styles.headerSub}>Join the TUP research community</Text>
          </View>

          {/* Card */}
          <View style={styles.card}>

            {/* Full Name */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>FULL NAME</Text>
              <View style={styles.inputWrapper}>
                <Ionicons name="person-outline" size={16} color={Colors.primary} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Enter your full name"
                  placeholderTextColor={Colors.textDim}
                  value={formData.fullName}
                  onChangeText={(v) => handleInputChange('fullName', v)}
                />
              </View>
            </View>

            {/* ID Number */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>ID NUMBER</Text>
              <View style={styles.inputWrapper}>
                <Ionicons name="id-card-outline" size={16} color={Colors.primary} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="TUPT-XX-XXXX"
                  placeholderTextColor={Colors.textDim}
                  value={formData.idNumber}
                  onChangeText={(v) => handleInputChange('idNumber', v)}
                  autoCapitalize="characters"
                  maxLength={12}
                />
              </View>
            </View>

            {/* Birthdate */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>BIRTHDATE</Text>
              <TouchableOpacity onPress={() => setShowDatePicker(true)} style={styles.inputWrapper} activeOpacity={0.7}>
                <Ionicons name="calendar-outline" size={16} color={Colors.primary} style={styles.inputIcon} />
                <Text style={[styles.inputText, { color: formData.birthdate ? Colors.foreground : Colors.textDim }]}>
                  {formData.birthdate || 'YYYY-MM-DD'}
                </Text>
              </TouchableOpacity>
              {showDatePicker && (
                <DateTimePicker
                  value={selectedDate}
                  mode="date"
                  display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                  onChange={handleDateChange}
                  maximumDate={new Date()}
                  textColor="#ffffff"
                />
              )}
            </View>

             <View style={styles.inputGroup}>
               <Text style={styles.label}>ACCOUNT TYPE</Text>
               <View style={styles.radioGroup}>
                 {['Student', 'Graduate', 'Professor'].map((role) => (
                   <TouchableOpacity
                     key={role}
                     style={[
                       styles.radioOption,
                       (role === 'Student' && !formData.isGraduate && !formData.isProfessor) ||
                       (role === 'Graduate' && formData.isGraduate) ||
                       (role === 'Professor' && formData.isProfessor)
                         ? styles.radioOptionActive
                         : null
                     ]}
                     onPress={() => {
                        if (role === 'Student') setFormData(prev => ({ ...prev, isGraduate: false, isProfessor: false }));
                        else if (role === 'Graduate') setFormData(prev => ({ ...prev, isGraduate: true, isProfessor: false }));
                        else if (role === 'Professor') setFormData(prev => ({ ...prev, isGraduate: false, isProfessor: true }));
                     }}
                     activeOpacity={0.7}
                   >
                     <View style={[
                       styles.radioCircle,
                       ((role === 'Student' && !formData.isGraduate && !formData.isProfessor) ||
                       (role === 'Graduate' && formData.isGraduate) ||
                       (role === 'Professor' && formData.isProfessor)) && styles.radioCircleChecked
                     ]}>
                       {((role === 'Student' && !formData.isGraduate && !formData.isProfessor) ||
                       (role === 'Graduate' && formData.isGraduate) ||
                       (role === 'Professor' && formData.isProfessor)) && (
                         <View style={styles.radioInnerCircle} />
                       )}
                     </View>
                     <Text style={[
                        styles.radioLabel,
                        ((role === 'Student' && !formData.isGraduate && !formData.isProfessor) ||
                        (role === 'Graduate' && formData.isGraduate) ||
                        (role === 'Professor' && formData.isProfessor)) && styles.radioLabelActive
                     ]}>{role}</Text>
                   </TouchableOpacity>
                 ))}
               </View>
             </View>

            {/* Password */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>PASSWORD</Text>
              <View style={styles.inputWrapper}>
                <Ionicons name="lock-closed-outline" size={16} color={Colors.primary} style={styles.inputIcon} />
                <TextInput
                  style={[styles.input, { flex: 1 }]}
                  placeholder="Minimum 6 characters"
                  placeholderTextColor={Colors.textDim}
                  value={formData.password}
                  onChangeText={(v) => handleInputChange('password', v)}
                  secureTextEntry={!showPassword}
                />
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeButton}>
                  <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={18} color={Colors.textDim} />
                </TouchableOpacity>
              </View>
            </View>

            {/* Confirm Password */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>CONFIRM PASSWORD</Text>
              <View style={styles.inputWrapper}>
                <Ionicons name="lock-closed-outline" size={16} color={Colors.primary} style={styles.inputIcon} />
                <TextInput
                  style={[styles.input, { flex: 1 }]}
                  placeholder="Repeat your password"
                  placeholderTextColor={Colors.textDim}
                  value={formData.confirmPassword}
                  onChangeText={(v) => handleInputChange('confirmPassword', v)}
                  secureTextEntry={!showConfirmPassword}
                />
                <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)} style={styles.eyeButton}>
                  <Ionicons name={showConfirmPassword ? 'eye-off-outline' : 'eye-outline'} size={18} color={Colors.textDim} />
                </TouchableOpacity>
              </View>
            </View>

            {/* Action Row */}
            <View style={styles.buttonRow}>
              <TouchableOpacity style={styles.clearBtn} onPress={handleClear} activeOpacity={0.7}>
                <Text style={styles.clearBtnText}>Clear</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.submitBtn, isLoading && styles.disabledBtn]}
                onPress={handleRegister}
                disabled={isLoading}
                activeOpacity={0.85}
              >
                {isLoading ? (
                  <ActivityIndicator size="small" color={Colors.background} />
                ) : (
                  <>
                    <Text style={styles.submitBtnText}>REGISTER</Text>
                    <Ionicons name="checkmark" size={16} color={Colors.background} />
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>Already have an account? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Login')}>
              <Text style={styles.footerLink}>Sign in here</Text>
            </TouchableOpacity>
          </View>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 48,
  },
  header: {
    marginBottom: 28,
  },
  headerEyebrow: {
    color: Colors.primary,
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 3,
    marginBottom: 8,
  },
  headerTitle: {
    color: Colors.foreground,
    fontSize: 36,
    fontWeight: '900',
    letterSpacing: -1,
    textTransform: 'uppercase',
    marginBottom: 12,
  },
  headerAccentLine: {
    height: 3,
    width: 48,
    backgroundColor: Colors.primary,
    borderRadius: 2,
    marginBottom: 14,
  },
  headerSub: {
    color: Colors.textSecondary,
    fontSize: 14,
    fontWeight: '500',
    lineHeight: 20,
  },
  card: {
    backgroundColor: Colors.card,
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 18,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 20 }, shadowOpacity: 0.3, shadowRadius: 30 },
      android: { elevation: 12 }
    }),
  },
  inputGroup: {
    gap: 8,
  },
  label: {
    color: Colors.textSecondary,
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 2,
    marginLeft: 4,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 14,
    paddingHorizontal: 14,
    height: 52,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    color: Colors.foreground,
    fontSize: 14,
    fontWeight: '600',
  },
  inputText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
  },
  eyeButton: {
    padding: 4,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 4,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: Colors.border,
    backgroundColor: 'rgba(255,255,255,0.04)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  checkboxLabel: {
    color: Colors.textSecondary,
    fontSize: 13,
    fontWeight: '600',
    flex: 1,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
    marginTop: 4,
  },
  clearBtn: {
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: 'rgba(255,255,255,0.03)',
  },
  clearBtnText: {
    color: Colors.textSecondary,
    fontSize: 12,
    fontWeight: '700',
  },
  submitBtn: {
    flex: 1,
    backgroundColor: Colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
    ...Platform.select({
      ios: { shadowColor: Colors.primary, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.4, shadowRadius: 12 },
      android: { elevation: 6 }
    }),
  },
  submitBtnText: {
    color: Colors.background,
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 1.5,
  },
  disabledBtn: {
    opacity: 0.6,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 28,
  },
  footerText: {
    color: Colors.textSecondary,
    fontSize: 13,
    fontWeight: '500',
  },
  footerLink: {
    color: Colors.primary,
    fontSize: 13,
    fontWeight: '900',
  },
  radioGroup: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
  },
  radioOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 10,
  },
  radioOptionActive: {
    borderColor: Colors.primary,
    backgroundColor: 'rgba(45, 212, 191, 0.05)',
  },
  radioCircle: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 1.5,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioCircleChecked: {
    borderColor: Colors.primary,
  },
  radioInnerCircle: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.primary,
  },
  radioLabel: {
    color: Colors.textSecondary,
    fontSize: 11,
    fontWeight: '700',
  },
  radioLabelActive: {
    color: Colors.foreground,
  },
});

export default RegisterScreen;