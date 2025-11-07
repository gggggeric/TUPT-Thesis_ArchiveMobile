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
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import API_BASE_URL from '../../api';
import { useToast } from '../../utils/ToastContext';

const { width } = Dimensions.get('window');

const RegisterScreen = () => {
  const navigation = useNavigation();
  const [formData, setFormData] = useState({
    fullName: '',
    idNumber: '',
    birthdate: '',
    password: '',
    confirmPassword: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState('');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const toast = useToast();

  const handleInputChange = (field, value) => {
    if (field === 'idNumber') {
      let formattedValue = value.replace(/[^a-zA-Z0-9]/g, '');
      formattedValue = formattedValue.toUpperCase();
      
      if (!formattedValue.startsWith('TUPT') && formattedValue.length > 0) {
        formattedValue = 'TUPT' + formattedValue;
      }
      
      if (formattedValue.length > 4) {
        formattedValue = formattedValue.slice(0, 4) + '-' + formattedValue.slice(4);
      }
      if (formattedValue.length > 7) {
        formattedValue = formattedValue.slice(0, 7) + '-' + formattedValue.slice(7, 11);
      }
      formattedValue = formattedValue.slice(0, 12);
      
      value = formattedValue;
    }
    
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));

    if (field === 'password') {
      checkPasswordStrength(value);
    }
  };

  const handleDateChange = (event, date) => {
    setShowDatePicker(false);
    if (date) {
      setSelectedDate(date);
      const formattedDate = date.toISOString().split('T')[0];
      setFormData(prev => ({
        ...prev,
        birthdate: formattedDate
      }));
    }
  };

  const showDatepicker = () => {
    setShowDatePicker(true);
  };

  const formatDisplayDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const checkPasswordStrength = (password) => {
    if (password.length === 0) {
      setPasswordStrength('');
      return;
    }

    if (password.length < 6) {
      setPasswordStrength('weak');
    } else if (password.length < 8) {
      setPasswordStrength('medium');
    } else {
      const strongRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/;
      setPasswordStrength(strongRegex.test(password) ? 'strong' : 'medium');
    }
  };

  const getPasswordStrengthColor = () => {
    switch (passwordStrength) {
      case 'weak': return '#ef4444';
      case 'medium': return '#f59e0b';
      case 'strong': return '#10b981';
      default: return 'transparent';
    }
  };

  const getPasswordStrengthWidth = () => {
    switch (passwordStrength) {
      case 'weak': return '33%';
      case 'medium': return '66%';
      case 'strong': return '100%';
      default: return '0%';
    }
  };

  const validateIDNumber = (idNumber) => {
    const idRegex = /^TUPT-\d{2}-\d{4}$/;
    return idRegex.test(idNumber);
  };

  const calculateAge = (birthdate) => {
    const today = new Date();
    const birthDate = new Date(birthdate);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  const handleRegister = async () => {
    const { fullName, idNumber, birthdate, password, confirmPassword } = formData;

    if (!fullName || !idNumber || !birthdate || !password || !confirmPassword) {
      toast.show('Please fill in all fields', 'error');
      return;
    }

    if (!validateIDNumber(idNumber)) {
      toast.show('Please enter a valid ID number in format: TUPT-XX-XXXX', 'error');
      return;
    }

    const age = calculateAge(birthdate);
    if (age < 16) {
      toast.show('You must be at least 16 years old to register', 'error');
      return;
    }

    if (age > 100) {
      toast.show('Please enter a valid birthdate', 'error');
      return;
    }

    if (password !== confirmPassword) {
      toast.show('Passwords do not match', 'error');
      return;
    }

    if (password.length < 6) {
      toast.show('Password must be at least 6 characters long', 'error');
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: fullName,
          idNumber: idNumber,
          birthdate: birthdate,
          password: password
        }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.show(data.message || 'Account created successfully!', 'success');
        setTimeout(() => {
          navigation.navigate('Login');
        }, 1500);
      } else {
        toast.show(data.message || 'Registration failed', 'error');
      }
    } catch (error) {
      console.error('Registration error:', error);
      toast.show('Cannot connect to server. Please try again.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClear = () => {
    setFormData({
      fullName: '',
      idNumber: '',
      birthdate: '',
      password: '',
      confirmPassword: '',
    });
    setSelectedDate(new Date());
    setPasswordStrength('');
  };

  return (
    <LinearGradient
      colors={['#fef2f2', '#fee2e2', '#fecaca']}
      style={styles.gradientBackground}
    >
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView 
          contentContainerStyle={styles.scrollContainer}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.loginSection}>
            {/* Header Section */}
            <View style={styles.headerSection}>
              <LinearGradient
                colors={['#c7242c', '#991b1b']}
                style={styles.logoContainer}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <Ionicons name="person-add" size={48} color="white" />
              </LinearGradient>
              <Text style={styles.welcomeTitle}>Create Account</Text>
              <Text style={styles.welcomeSubtitle}>Join our research community</Text>
            </View>

            {/* Register Card */}
            <View style={styles.loginBox}>
              {/* Full Name Input */}
              <View style={styles.inputContainer}>
                <Text style={styles.label}>Full Name</Text>
                <View style={styles.inputWrapper}>
                  <Ionicons name="person-outline" size={20} color="#6b7280" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="Enter your full name"
                    placeholderTextColor="#9ca3af"
                    value={formData.fullName}
                    onChangeText={(value) => handleInputChange('fullName', value)}
                    autoCapitalize="words"
                  />
                </View>
              </View>

              {/* ID Number Input */}
              <View style={styles.inputContainer}>
                <Text style={styles.label}>ID Number</Text>
                <View style={styles.inputWrapper}>
                  <Ionicons name="card-outline" size={20} color="#6b7280" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="TUPT-XX-XXXX"
                    placeholderTextColor="#9ca3af"
                    value={formData.idNumber}
                    onChangeText={(value) => handleInputChange('idNumber', value)}
                    autoCapitalize="characters"
                    keyboardType="default"
                    maxLength={12}
                  />
                </View>
                <Text style={styles.hintText}>Format: TUPT-XX-XXXX</Text>
              </View>

              {/* Birthdate Input */}
              <View style={styles.inputContainer}>
                <Text style={styles.label}>Birthdate</Text>
                <TouchableOpacity 
                  style={styles.inputWrapper} 
                  onPress={showDatepicker}
                  activeOpacity={0.7}
                >
                  <Ionicons name="calendar-outline" size={20} color="#6b7280" style={styles.inputIcon} />
                  <Text style={formData.birthdate ? styles.dateText : styles.placeholderText}>
                    {formData.birthdate ? formatDisplayDate(formData.birthdate) : 'Select your birthdate'}
                  </Text>
                </TouchableOpacity>
              </View>

              {showDatePicker && (
                <DateTimePicker
                  value={selectedDate}
                  mode="date"
                  display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                  onChange={handleDateChange}
                  maximumDate={new Date()}
                  minimumDate={new Date(1900, 0, 1)}
                />
              )}

              {/* Password Input */}
              <View style={styles.inputContainer}>
                <Text style={styles.label}>Password</Text>
                <View style={styles.inputWrapper}>
                  <Ionicons name="lock-closed-outline" size={20} color="#6b7280" style={styles.inputIcon} />
                  <TextInput
                    style={[styles.input, styles.passwordInput]}
                    placeholder="Create a password"
                    placeholderTextColor="#9ca3af"
                    value={formData.password}
                    onChangeText={(value) => handleInputChange('password', value)}
                    secureTextEntry={!showPassword}
                    autoCapitalize="none"
                  />
                  <TouchableOpacity 
                    style={styles.eyeIcon}
                    onPress={() => setShowPassword(!showPassword)}
                  >
                    <Ionicons 
                      name={showPassword ? "eye-outline" : "eye-off-outline"} 
                      size={20} 
                      color="#6b7280" 
                    />
                  </TouchableOpacity>
                </View>
                
                {passwordStrength ? (
                  <View style={styles.passwordStrengthContainer}>
                    <View style={styles.strengthBarContainer}>
                      <View 
                        style={[
                          styles.passwordStrength,
                          {
                            backgroundColor: getPasswordStrengthColor(),
                            width: getPasswordStrengthWidth(),
                          }
                        ]} 
                      />
                    </View>
                    <Text style={[styles.strengthText, { color: getPasswordStrengthColor() }]}>
                      {passwordStrength.charAt(0).toUpperCase() + passwordStrength.slice(1)}
                    </Text>
                  </View>
                ) : null}
              </View>

              {/* Confirm Password Input */}
              <View style={styles.inputContainer}>
                <Text style={styles.label}>Confirm Password</Text>
                <View style={styles.inputWrapper}>
                  <Ionicons name="lock-closed-outline" size={20} color="#6b7280" style={styles.inputIcon} />
                  <TextInput
                    style={[styles.input, styles.passwordInput]}
                    placeholder="Confirm your password"
                    placeholderTextColor="#9ca3af"
                    value={formData.confirmPassword}
                    onChangeText={(value) => handleInputChange('confirmPassword', value)}
                    secureTextEntry={!showConfirmPassword}
                    autoCapitalize="none"
                  />
                  <TouchableOpacity 
                    style={styles.eyeIcon}
                    onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    <Ionicons 
                      name={showConfirmPassword ? "eye-outline" : "eye-off-outline"} 
                      size={20} 
                      color="#6b7280" 
                    />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Buttons */}
              <View style={styles.buttons}>
                <TouchableOpacity 
                  style={[styles.btnClear, isLoading && styles.disabledButton]}
                  onPress={handleClear}
                  disabled={isLoading}
                  activeOpacity={0.8}
                >
                  <Ionicons name="close-circle-outline" size={18} color="#c7242c" />
                  <Text style={styles.clearButtonText}>Clear</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={[styles.btnRegister, isLoading && styles.disabledButton]}
                  onPress={handleRegister}
                  disabled={isLoading}
                  activeOpacity={0.8}
                >
                  <LinearGradient
                    colors={['#c7242c', '#991b1b']}
                    style={styles.registerGradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                  >
                    {isLoading ? (
                      <Text style={styles.registerButtonText}>Creating...</Text>
                    ) : (
                      <>
                        <Text style={styles.registerButtonText}>Register</Text>
                        <Ionicons name="arrow-forward" size={18} color="white" />
                      </>
                    )}
                  </LinearGradient>
                </TouchableOpacity>
              </View>

              {/* Sign In Link */}
              <View style={styles.signInContainer}>
                <Text style={styles.signInText}>Already have an account? </Text>
                <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                  <Text style={styles.signInLink}>Sign in</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  gradientBackground: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingVertical: 40,
  },
  loginSection: {
    width: '100%',
    alignItems: 'center',
  },
  headerSection: {
    alignItems: 'center',
    marginBottom: 30,
  },
  logoContainer: {
    width: 80,
    height: 80,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
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
  },
  welcomeSubtitle: {
    fontSize: 16,
    color: '#6b7280',
  },
  loginBox: {
    width: width > 480 ? 420 : '100%',
    maxWidth: 420,
    padding: 30,
    borderRadius: 24,
    backgroundColor: 'white',
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
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    paddingHorizontal: 16,
    minHeight: 50,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    paddingVertical: 14,
    fontSize: 16,
    color: '#1f2937',
  },
  passwordInput: {
    paddingRight: 40,
  },
  eyeIcon: {
    position: 'absolute',
    right: 16,
    padding: 4,
  },
  dateText: {
    flex: 1,
    fontSize: 16,
    color: '#1f2937',
    paddingVertical: 14,
  },
  placeholderText: {
    flex: 1,
    fontSize: 16,
    color: '#9ca3af',
    paddingVertical: 14,
  },
  hintText: {
    fontSize: 12,
    color: '#9ca3af',
    marginTop: 6,
    fontStyle: 'italic',
  },
  passwordStrengthContainer: {
    marginTop: 8,
  },
  strengthBarContainer: {
    height: 4,
    backgroundColor: '#e5e7eb',
    borderRadius: 2,
    overflow: 'hidden',
    marginBottom: 6,
  },
  passwordStrength: {
    height: '100%',
    borderRadius: 2,
    transition: 'width 0.3s ease',
  },
  strengthText: {
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'right',
  },
  buttons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 10,
    marginBottom: 20,
  },
  btnClear: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    gap: 6,
  },
  clearButtonText: {
    color: '#c7242c',
    fontSize: 15,
    fontWeight: '600',
  },
  btnRegister: {
    flex: 2,
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
  registerGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    gap: 8,
  },
  registerButtonText: {
    color: 'white',
    fontSize: 15,
    fontWeight: 'bold',
  },
  disabledButton: {
    opacity: 0.6,
  },
  signInContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  signInText: {
    fontSize: 14,
    color: '#6b7280',
  },
  signInLink: {
    fontSize: 14,
    color: '#c7242c',
    fontWeight: '600',
  },
});

export default RegisterScreen;