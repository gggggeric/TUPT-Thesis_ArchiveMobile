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
  Alert,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import DateTimePicker from '@react-native-community/datetimepicker';

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

  const handleInputChange = (field, value) => {
    // Format ID number as user types
    if (field === 'idNumber') {
      // Remove all non-alphanumeric characters
      let formattedValue = value.replace(/[^a-zA-Z0-9]/g, '');
      
      // Convert to uppercase
      formattedValue = formattedValue.toUpperCase();
      
      // Add TUPT- prefix if not present
      if (!formattedValue.startsWith('TUPT') && formattedValue.length > 0) {
        formattedValue = 'TUPT' + formattedValue;
      }
      
      // Format as TUPT-XX-XXXX
      if (formattedValue.length > 4) {
        formattedValue = formattedValue.slice(0, 4) + '-' + formattedValue.slice(4);
      }
      if (formattedValue.length > 7) {
        formattedValue = formattedValue.slice(0, 7) + '-' + formattedValue.slice(7, 11);
      }
      // Limit total length to 12 characters (TUPT-XX-XXXX)
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
      // Format date as YYYY-MM-DD
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
      case 'weak': return '#ff5252';
      case 'medium': return '#ffb142';
      case 'strong': return '#2ed573';
      default: return 'transparent';
    }
  };

  const getPasswordStrengthWidth = () => {
    switch (passwordStrength) {
      case 'weak': return '25%';
      case 'medium': return '50%';
      case 'strong': return '100%';
      default: return '0%';
    }
  };

  const validateIDNumber = (idNumber) => {
    // Validate format: TUPT-XX-XXXX
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

  const handleRegister = () => {
    const { fullName, idNumber, birthdate, password, confirmPassword } = formData;

    if (!fullName || !idNumber || !birthdate || !password || !confirmPassword) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    if (!validateIDNumber(idNumber)) {
      Alert.alert('Error', 'Please enter a valid ID number in format: TUPT-XX-XXXX');
      return;
    }

    const age = calculateAge(birthdate);
    if (age < 16) {
      Alert.alert('Error', 'You must be at least 16 years old to register');
      return;
    }

    if (age > 100) {
      Alert.alert('Error', 'Please enter a valid birthdate');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }

    if (password.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters long');
      return;
    }

    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      Alert.alert('Success', 'Account created successfully!');
      navigation.navigate('Login');
    }, 1500);
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
      colors={['#f9e8e9', '#c7242c']}
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
            <View style={styles.loginBox}>
              <Text style={styles.loginTitle}>Create Account</Text>
              <Text style={styles.loginSubtitle}>Join Thesis Analysis System</Text>

              <Text style={styles.label}>Full Name</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter your full name"
                placeholderTextColor="rgba(255, 255, 255, 0.6)"
                value={formData.fullName}
                onChangeText={(value) => handleInputChange('fullName', value)}
                autoCapitalize="words"
              />

              <Text style={styles.label}>ID Number</Text>
              <TextInput
                style={styles.input}
                placeholder="TUPT-XX-XXXX"
                placeholderTextColor="rgba(255, 255, 255, 0.6)"
                value={formData.idNumber}
                onChangeText={(value) => handleInputChange('idNumber', value)}
                autoCapitalize="characters"
                keyboardType="default"
                maxLength={12}
              />
              <Text style={styles.hintText}>Format: TUPT-XX-XXXX</Text>

              <Text style={styles.label}>Birthdate</Text>
              <TouchableOpacity style={styles.dateInput} onPress={showDatepicker}>
                <Text style={formData.birthdate ? styles.dateText : styles.placeholderText}>
                  {formData.birthdate ? formatDisplayDate(formData.birthdate) : 'Select your birthdate'}
                </Text>
              </TouchableOpacity>

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

              <Text style={styles.label}>Password</Text>
              <TextInput
                style={styles.input}
                placeholder="Create a password"
                placeholderTextColor="rgba(255, 255, 255, 0.6)"
                value={formData.password}
                onChangeText={(value) => handleInputChange('password', value)}
                secureTextEntry
                autoCapitalize="none"
              />
              
              {passwordStrength ? (
                <View style={styles.passwordStrengthContainer}>
                  <View 
                    style={[
                      styles.passwordStrength,
                      {
                        backgroundColor: getPasswordStrengthColor(),
                        width: getPasswordStrengthWidth(),
                      }
                    ]} 
                  />
                  <Text style={styles.strengthText}>
                    Strength: {passwordStrength}
                  </Text>
                </View>
              ) : null}

              <Text style={styles.label}>Confirm Password</Text>
              <TextInput
                style={styles.input}
                placeholder="Confirm your password"
                placeholderTextColor="rgba(255, 255, 255, 0.6)"
                value={formData.confirmPassword}
                onChangeText={(value) => handleInputChange('confirmPassword', value)}
                secureTextEntry
                autoCapitalize="none"
              />

              <View style={styles.buttons}>
                <TouchableOpacity 
                  style={[styles.btnClear, isLoading && styles.disabledButton]}
                  onPress={handleClear}
                  disabled={isLoading}
                >
                  <Text style={styles.buttonText}>Clear</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={[styles.btnLogin, isLoading && styles.disabledButton]}
                  onPress={handleRegister}
                  disabled={isLoading}
                >
                  <Text style={styles.buttonText}>
                    {isLoading ? 'Creating...' : 'Register'}
                  </Text>
                </TouchableOpacity>
              </View>

              <View style={styles.moreInfoContainer}>
                <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                  <Text style={styles.moreInfoLink}>
                    Already have an account? Sign in
                  </Text>
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
  loginBox: {
    width: width > 480 ? 420 : '100%',
    maxWidth: 420,
    padding: 25,
    borderRadius: 4,
    backgroundColor: '#605051',
    shadowColor: '#000',
    shadowOffset: {
      width: 8,
      height: 8,
    },
    shadowOpacity: 0.9,
    shadowRadius: 25,
    elevation: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  loginTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
    color: 'white',
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
    borderBottomWidth: 2,
    borderBottomColor: '#c62828',
    paddingBottom: 10,
  },
  loginSubtitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#b5b5b5',
    paddingBottom: 5,
    color: 'white',
  },
  label: {
    fontSize: 14,
    marginVertical: 10,
    color: 'white',
  },
  input: {
    width: '100%',
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 2,
    marginBottom: 5,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    color: 'white',
    fontSize: 16,
  },
  dateInput: {
    width: '100%',
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 2,
    marginBottom: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
  },
  dateText: {
    color: 'white',
    fontSize: 16,
  },
  placeholderText: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 16,
  },
  hintText: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.5)',
    marginBottom: 10,
    fontStyle: 'italic',
  },
  passwordStrengthContainer: {
    marginBottom: 10,
  },
  passwordStrength: {
    height: 5,
    borderRadius: 2,
    marginBottom: 5,
  },
  strengthText: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'center',
  },
  buttons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 15,
  },
  btnClear: {
    backgroundColor: '#c62828',
    borderWidth: 1,
    borderColor: '#b71c1c',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 2,
    minWidth: 80,
  },
  btnLogin: {
    backgroundColor: '#c62828',
    borderWidth: 1,
    borderColor: '#b71c1c',
    paddingVertical: 10,
    paddingHorizontal: 25,
    borderRadius: 2,
    minWidth: 100,
  },
  disabledButton: {
    opacity: 0.6,
  },
  buttonText: {
    color: 'white',
    fontSize: 14,
    textAlign: 'center',
    fontWeight: '600',
  },
  moreInfoContainer: {
    marginTop: 20,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.3)',
    alignItems: 'center',
  },
  moreInfoLink: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.7)',
    textDecorationLine: 'underline',
  },
});

export default RegisterScreen;