import React, { useState, useEffect } from 'react';
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

const ForgotScreen = () => {
  const navigation = useNavigation();
  const [formData, setFormData] = useState({
    idNumber: '',
    birthdate: '',
    newPassword: '',
    confirmPassword: '',
    secretAnswer: '',
  });
  const [isStudent, setIsStudent] = useState(true);
  const [verificationMethod, setVerificationMethod] = useState('birthdate'); // 'birthdate' or 'secretQuestion'
  const [secretQuestion, setSecretQuestion] = useState('');
  const [showSecretAnswer, setShowSecretAnswer] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const toast = useToast();

  useEffect(() => {
    const fetchSecretQuestion = async () => {
      const { idNumber } = formData;
      if (!idNumber) {
        setSecretQuestion('');
        return;
      }
      if (isStudent && idNumber.length < 12) {
        setSecretQuestion('');
        return;
      }
      try {
        const response = await fetch(`${API_BASE_URL}/auth/secret-question/${idNumber}`);
        if (response.ok) {
          const data = await response.json();
          setSecretQuestion(data.secretQuestion);
        } else {
          setSecretQuestion('');
        }
      } catch (error) {
        console.error("Error fetching secret question:", error);
        setSecretQuestion('');
      }
    };

    if (verificationMethod === 'secretQuestion') {
      fetchSecretQuestion();
    } else {
      setSecretQuestion('');
    }
  }, [formData.idNumber, verificationMethod, isStudent]);

  const handleInputChange = (field, value) => {
    if (field === 'idNumber') {
      if (isStudent) {
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
      } else {
        setFormData(prev => ({ ...prev, [field]: value }));
      }
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

  const validateIDNumber = (idNumber) => {
    if (isStudent) {
      return /^TUPT-\d{2}-\d{4}$/.test(idNumber);
    }
    return idNumber.trim().length > 0;
  };

  const handleResetPassword = async () => {
    const { idNumber, birthdate, newPassword, confirmPassword, secretAnswer } = formData;
    if (!idNumber || !newPassword || !confirmPassword) {
      toast.show('Please fill in all required fields', 'error');
      return;
    }
    if (!validateIDNumber(idNumber)) {
      toast.show(isStudent ? 'Please enter a valid ID number: TUPT-XX-XXXX' : 'Please enter a valid ID number', 'error');
      return;
    }
    if (verificationMethod === 'birthdate' && !birthdate) {
      toast.show('Please select your birthdate', 'error');
      return;
    }
    if (verificationMethod === 'secretQuestion' && !secretAnswer) {
      toast.show('Please enter your secret answer', 'error');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.show('Passwords do not match', 'error');
      return;
    }
    if (newPassword.length < 6) {
      toast.show('Password must be at least 6 characters', 'error');
      return;
    }

    setIsLoading(true);
    try {
      const body = {
        idNumber,
        newPassword,
        verificationMethod
      };
      if (verificationMethod === 'birthdate') {
        body.birthdate = birthdate;
      } else {
        body.secretAnswer = secretAnswer;
      }

      const response = await fetch(`${API_BASE_URL}/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await response.json();
      if (response.ok) {
        toast.show(data.message || 'Password reset successful!', 'success');
        setTimeout(() => navigation.navigate('Login'), 1500);
      } else {
        toast.show(data.message || 'Reset failed. Check your details.', 'error');
      }
    } catch (error) {
      toast.show('Cannot connect to server. Please try again.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClear = () => {
    setFormData({ idNumber: '', birthdate: '', newPassword: '', confirmPassword: '', secretAnswer: '' });
    setSecretQuestion('');
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
            <Text style={styles.headerEyebrow}>ACCOUNT RECOVERY</Text>
            <Text style={styles.headerTitle}>RESET PASSWORD</Text>
            <View style={styles.headerAccentLine} />
            <Text style={styles.headerSub}>
              Verify your identity to reset your password
            </Text>
          </View>

          {/* Card */}
          <View style={styles.card}>

            {/* ID Number */}
            <View style={styles.inputGroup}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text style={styles.label}>ID NUMBER</Text>
                <TouchableOpacity onPress={() => { setIsStudent(!isStudent); setFormData(p => ({ ...p, idNumber: '' })); }} activeOpacity={0.7}>
                  <Text style={{ color: Colors.primary, fontSize: 10, fontWeight: '900', letterSpacing: 1 }}>
                    {isStudent ? 'NOT A STUDENT?' : 'ARE YOU A STUDENT?'}
                  </Text>
                </TouchableOpacity>
              </View>
              <View style={styles.inputWrapper}>
                <Ionicons name="id-card-outline" size={16} color={Colors.primary} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder={isStudent ? "TUPT-XX-XXXX" : "Enter your ID number"}
                  placeholderTextColor={Colors.textDim}
                  value={formData.idNumber}
                  onChangeText={(v) => handleInputChange('idNumber', v)}
                  autoCapitalize={isStudent ? "characters" : "none"}
                  keyboardType="default"
                  maxLength={isStudent ? 12 : 50}
                />
              </View>
            </View>

            {/* Verification Method Toggle */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>VERIFY IDENTITY USING</Text>
              <View style={{ flexDirection: 'row', gap: 10 }}>
                <TouchableOpacity
                  style={{
                    flex: 1,
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: verificationMethod === 'birthdate' ? 'rgba(45, 212, 191, 0.15)' : 'rgba(255,255,255,0.03)',
                    borderWidth: 1.5,
                    borderColor: verificationMethod === 'birthdate' ? Colors.primary : Colors.border,
                    borderRadius: 12,
                    paddingVertical: 12,
                    gap: 6,
                  }}
                  onPress={() => setVerificationMethod('birthdate')}
                  activeOpacity={0.7}
                >
                  <Ionicons name="calendar-outline" size={14} color={verificationMethod === 'birthdate' ? Colors.primary : Colors.textDim} />
                  <Text style={{ color: verificationMethod === 'birthdate' ? Colors.foreground : Colors.textDim, fontSize: 11, fontWeight: '700' }}>
                    BIRTHDATE
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={{
                    flex: 1,
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: verificationMethod === 'secretQuestion' ? 'rgba(45, 212, 191, 0.15)' : 'rgba(255,255,255,0.03)',
                    borderWidth: 1.5,
                    borderColor: verificationMethod === 'secretQuestion' ? Colors.primary : Colors.border,
                    borderRadius: 12,
                    paddingVertical: 12,
                    gap: 6,
                  }}
                  onPress={() => setVerificationMethod('secretQuestion')}
                  activeOpacity={0.7}
                >
                  <Ionicons name="help-circle-outline" size={15} color={verificationMethod === 'secretQuestion' ? Colors.primary : Colors.textDim} />
                  <Text style={{ color: verificationMethod === 'secretQuestion' ? Colors.foreground : Colors.textDim, fontSize: 11, fontWeight: '700' }}>
                    SECRET QUESTION
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Birthdate Verification */}
            {verificationMethod === 'birthdate' && (
              <View style={styles.inputGroup}>
                <Text style={styles.label}>BIRTHDATE (FOR VERIFICATION)</Text>
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
            )}

            {/* Secret Question Verification */}
            {verificationMethod === 'secretQuestion' && (
              <View style={{ gap: 18 }}>
                <View style={{ backgroundColor: 'rgba(255,255,255,0.02)', padding: 16, borderRadius: 16, borderWidth: 1, borderColor: Colors.border }}>
                  <Text style={{ color: Colors.textSecondary, fontSize: 11, fontWeight: '600', lineHeight: 16, marginBottom: 8 }}>
                    Enter the answer to the secret question set during registration.
                  </Text>
                  {secretQuestion ? (
                    <Text style={{ color: Colors.foreground, fontSize: 13, fontWeight: '700', fontStyle: 'italic' }}>
                      "{secretQuestion}"
                    </Text>
                  ) : (
                    <Text style={{ color: Colors.textDim, fontSize: 12, fontStyle: 'italic' }}>
                      {formData.idNumber ? "No secret question found for this account." : "Enter your ID number to load secret question."}
                    </Text>
                  )}
                </View>

                {secretQuestion ? (
                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>YOUR ANSWER</Text>
                    <View style={styles.inputWrapper}>
                      <Ionicons name="key-outline" size={16} color={Colors.primary} style={styles.inputIcon} />
                      <TextInput
                        style={[styles.input, { flex: 1 }]}
                        placeholder="Enter your secret answer"
                        placeholderTextColor={Colors.textDim}
                        value={formData.secretAnswer}
                        onChangeText={(v) => handleInputChange('secretAnswer', v)}
                        secureTextEntry={!showSecretAnswer}
                        autoCapitalize="none"
                      />
                      <TouchableOpacity onPress={() => setShowSecretAnswer(!showSecretAnswer)} style={styles.eyeButton}>
                        <Ionicons name={showSecretAnswer ? 'eye-off-outline' : 'eye-outline'} size={18} color={Colors.textDim} />
                      </TouchableOpacity>
                    </View>
                  </View>
                ) : null}
              </View>
            )}

            {/* New Password */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>NEW PASSWORD</Text>
              <View style={styles.inputWrapper}>
                <Ionicons name="lock-closed-outline" size={16} color={Colors.primary} style={styles.inputIcon} />
                <TextInput
                  style={[styles.input, { flex: 1 }]}
                  placeholder="Minimum 6 characters"
                  placeholderTextColor={Colors.textDim}
                  value={formData.newPassword}
                  onChangeText={(v) => handleInputChange('newPassword', v)}
                  secureTextEntry={!showNewPassword}
                />
                <TouchableOpacity onPress={() => setShowNewPassword(!showNewPassword)} style={styles.eyeButton}>
                  <Ionicons name={showNewPassword ? 'eye-off-outline' : 'eye-outline'} size={18} color={Colors.textDim} />
                </TouchableOpacity>
              </View>
            </View>

            {/* Confirm Password */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>CONFIRM NEW PASSWORD</Text>
              <View style={styles.inputWrapper}>
                <Ionicons name="lock-closed-outline" size={16} color={Colors.primary} style={styles.inputIcon} />
                <TextInput
                  style={[styles.input, { flex: 1 }]}
                  placeholder="Repeat new password"
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

            {/* Buttons */}
            <View style={styles.buttonRow}>
              <TouchableOpacity style={styles.clearBtn} onPress={handleClear} activeOpacity={0.7}>
                <Text style={styles.clearBtnText}>Clear</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.submitBtn, isLoading && styles.disabledBtn]}
                onPress={handleResetPassword}
                disabled={isLoading}
                activeOpacity={0.85}
              >
                {isLoading ? (
                  <ActivityIndicator size="small" color={Colors.background} />
                ) : (
                  <>
                    <Text style={styles.submitBtnText}>RESET</Text>
                    <Ionicons name="key-outline" size={16} color={Colors.background} />
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>Remembered your password? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Login')}>
              <Text style={styles.footerLink}>Back to Login</Text>
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
    color: Colors.accent,
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
    backgroundColor: Colors.accent,
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
});

export default ForgotScreen;
