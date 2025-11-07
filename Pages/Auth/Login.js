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
  Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import API_BASE_URL from '../../api';
import { useToast } from '../../utils/ToastContext';

const { width } = Dimensions.get('window');

const LoginScreen = () => {
  const navigation = useNavigation();
  const [idNumber, setIdNumber] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const toast = useToast();

  const handleInputChange = (value) => {
    // Format ID number as user types
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
    
    setIdNumber(formattedValue);
  };

  const validateIDNumber = (idNumber) => {
    // Validate format: TUPT-XX-XXXX
    const idRegex = /^TUPT-\d{2}-\d{4}$/;
    return idRegex.test(idNumber);
  };

  const handleLogin = async () => {
    if (!idNumber || !password) {
      toast.show('Please fill in all fields', 'error');
      return;
    }

    if (!validateIDNumber(idNumber)) {
      toast.show('Please enter a valid ID number in format: TUPT-XX-XXXX', 'error');
      return;
    }
    
    setIsLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          idNumber: idNumber,
          password: password
        }),
      });

      const data = await response.json();

      if (response.ok) {
        // Store user data in AsyncStorage
        const userData = {
          _id: data.user._id,
          name: data.user.name,
          idNumber: data.user.idNumber,
          birthdate: data.user.birthdate,
          age: data.user.age,
          createdAt: data.user.createdAt,
        };
        
        await AsyncStorage.setItem('userData', JSON.stringify(userData));
        
        toast.show(data.message || 'Logged in successfully!', 'success');
        console.log('User data stored:', userData);
        navigation.navigate('Home');
      } else {
        toast.show(data.message || 'Login failed', 'error');
      }
    } catch (error) {
      console.error('Login error:', error);
      toast.show('Cannot connect to server. Please try again.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClear = () => {
    setIdNumber('');
    setPassword('');
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
            {/* Logo/Header Section */}
            <View style={styles.headerSection}>
              <View style={styles.logoContainer}>
                <Image 
                  source={require('../../assets/tup-logo.png')} 
                  style={styles.logoImage}
                  resizeMode="contain"
                />
              </View>
              <Text style={styles.welcomeTitle}>TUPT-Thesis Archive</Text>
              <Text style={styles.welcomeSubtitle}>Sign in</Text>
            </View>

            {/* Login Card */}
            <View style={styles.loginBox}>
              {/* ID Number Input */}
              <View style={styles.inputContainer}>
                <Text style={styles.label}>ID Number</Text>
                <View style={styles.inputWrapper}>
                  <Ionicons name="card-outline" size={20} color="#6b7280" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="TUPT-XX-XXXX"
                    placeholderTextColor="#9ca3af"
                    value={idNumber}
                    onChangeText={handleInputChange}
                    autoCapitalize="characters"
                    keyboardType="default"
                    maxLength={12}
                  />
                </View>
                <Text style={styles.hintText}>Format: TUPT-XX-XXXX</Text>
              </View>

              {/* Password Input */}
              <View style={styles.inputContainer}>
                <Text style={styles.label}>Password</Text>
                <View style={styles.inputWrapper}>
                  <Ionicons name="lock-closed-outline" size={20} color="#6b7280" style={styles.inputIcon} />
                  <TextInput
                    style={[styles.input, styles.passwordInput]}
                    placeholder="Enter your password"
                    placeholderTextColor="#9ca3af"
                    value={password}
                    onChangeText={setPassword}
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
              </View>

              {/* Forgot Password Link */}
              <TouchableOpacity style={styles.forgotPassword}>
                <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
              </TouchableOpacity>

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
                  style={[styles.btnLogin, isLoading && styles.disabledButton]}
                  onPress={handleLogin}
                  disabled={isLoading}
                  activeOpacity={0.8}
                >
                  <LinearGradient
                    colors={['#c7242c', '#991b1b']}
                    style={styles.loginGradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                  >
                    {isLoading ? (
                      <Text style={styles.loginButtonText}>Logging in...</Text>
                    ) : (
                      <>
                        <Text style={styles.loginButtonText}>Login</Text>
                        <Ionicons name="arrow-forward" size={18} color="white" />
                      </>
                    )}
                  </LinearGradient>
                </TouchableOpacity>
              </View>

              {/* Sign Up Link */}
              <View style={styles.signUpContainer}>
                <Text style={styles.signUpText}>Don't have an account? </Text>
                <TouchableOpacity onPress={() => navigation.navigate('Register')}>
                  <Text style={styles.signUpLink}>Sign up</Text>
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
  logoImage: {
    width: 70,
    height: 70,
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
  hintText: {
    fontSize: 12,
    color: '#9ca3af',
    marginTop: 6,
    fontStyle: 'italic',
  },
  forgotPassword: {
    alignSelf: 'flex-end',
    marginBottom: 24,
  },
  forgotPasswordText: {
    fontSize: 14,
    color: '#c7242c',
    fontWeight: '600',
  },
  buttons: {
    flexDirection: 'row',
    gap: 12,
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
  btnLogin: {
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
  loginGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    gap: 8,
  },
  loginButtonText: {
    color: 'white',
    fontSize: 15,
    fontWeight: 'bold',
  },
  disabledButton: {
    opacity: 0.6,
  },
  signUpContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  signUpText: {
    fontSize: 14,
    color: '#6b7280',
  },
  signUpLink: {
    fontSize: 14,
    color: '#c7242c',
    fontWeight: '600',
  },
});

export default LoginScreen;