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
  SafeAreaView,
  Modal,
} from 'react-native';
import LottieView from 'lottie-react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import API_BASE_URL from '../../api';
import { useToast } from '../../utils/ToastContext';
import Colors from '../../utils/Colors';

const LoginScreen = () => {
  const navigation = useNavigation();
  const [idNumber, setIdNumber] = useState('');
  const [password, setPassword] = useState('');
  const [isStudent, setIsStudent] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const toast = useToast();
 
  const handleInputChange = (value) => {
    if (isStudent) {
      let formattedValue = value.toUpperCase();
      if (formattedValue.length < idNumber.length) {
        setIdNumber(formattedValue);
        return;
      }
      let clean = formattedValue.replace(/[^A-Z0-9]/g, '');
      if (clean.length > 0 && !clean.startsWith('TUPT')) {
        if (!'TUPT'.startsWith(clean)) {
          clean = 'TUPT' + clean;
        }
      }
      let formatted = clean;
      if (clean.length > 4) formatted = clean.slice(0, 4) + '-' + clean.slice(4);
      if (formatted.length > 7) formatted = formatted.slice(0, 7) + '-' + formatted.slice(7, 11);
      setIdNumber(formatted.slice(0, 12));
    } else {
      setIdNumber(value);
    }
  };
 
  const validateIDNumber = (id) => {
    if (isStudent) {
      const idRegex = /^TUPT-\d{2}-\d{4}$/;
      return idRegex.test(id);
    }
    return id.trim().length > 0;
  };
 
  const handleLogin = async () => {
    if (!idNumber || !password) {
      toast.show('Please fill in all fields', 'error');
      return;
    }
    if (!validateIDNumber(idNumber)) {
      toast.show(isStudent ? 'Please enter a valid ID number format: TUPT-XX-XXXX' : 'Please enter a valid ID number', 'error');
      return;
    }
 
    setIsLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idNumber, password }),
      });
      const data = await response.json();
      if (response.ok) {
        const userData = data.user;
        await AsyncStorage.setItem('userData', JSON.stringify(userData));
        if (data.token) await AsyncStorage.setItem('userToken', data.token);
        toast.show(data.message || 'Logged in successfully!', 'success');
        if (userData.isAdmin) {
          navigation.reset({ index: 0, routes: [{ name: 'AdminDashboard' }] });
        } else {
          navigation.reset({ index: 0, routes: [{ name: 'Home' }] });
        }
      } else {
        toast.show(data.message || 'Login failed', 'error');
      }
    } catch (error) {
      toast.show('Cannot connect to server. Please try again.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Loading Overlay */}
      <Modal transparent={true} visible={isLoading} animationType="fade">
        <View style={{ flex: 1, backgroundColor: 'rgba(10,10,15,0.9)', justifyContent: 'center', alignItems: 'center', padding: 40 }}>
            <Text style={{ color: Colors.primary, fontWeight: '900', fontSize: 12, letterSpacing: 3, marginBottom: 20, textTransform: 'uppercase' }}>Secure Authentication</Text>
            <LottieView 
              source={require('../../assets/animations/Mapping for machine learning.json')}
              autoPlay
              loop
              style={{ width: 250, height: 250 }}
            />
            <Text style={{ color: Colors.foreground, fontWeight: 'bold', fontSize: 16, marginTop: 10 }}>logging in please wait</Text>
            <Text style={{ color: Colors.textDim, fontSize: 11, marginTop: 8, letterSpacing: 1 }}>Synchronizing with institutional records...</Text>
        </View>
      </Modal>

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
            <Text style={styles.headerEyebrow}>TUPT-THESIS ARCHIVE</Text>
            <Text style={styles.headerTitle}>SIGN IN</Text>
            <View style={styles.headerAccentLine} />
            <Text style={styles.headerSub}>
              Sign in to your TUPT-Thesis Archive account
            </Text>
          </View>

          {/* Card */}
          <View style={styles.card}>
            {/* ID Number */}
            <View style={styles.inputGroup}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text style={styles.label}>ID NUMBER</Text>
                <TouchableOpacity onPress={() => { setIsStudent(!isStudent); setIdNumber(''); }} activeOpacity={0.7}>
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
                  value={idNumber}
                  onChangeText={handleInputChange}
                  autoCapitalize={isStudent ? "characters" : "none"}
                  keyboardType="default"
                  maxLength={isStudent ? 12 : 50}
                />
              </View>
            </View>

            {/* Password */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>PASSWORD</Text>
              <View style={styles.inputWrapper}>
                <Ionicons name="lock-closed-outline" size={16} color={Colors.primary} style={styles.inputIcon} />
                <TextInput
                  style={[styles.input, { flex: 1 }]}
                  placeholder="Enter your password"
                  placeholderTextColor={Colors.textDim}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                />
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeButton}>
                  <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={18} color={Colors.textDim} />
                </TouchableOpacity>
              </View>
            </View>

            {/* Submit */}
            <TouchableOpacity
              style={[styles.submitBtn, isLoading && styles.disabledBtn]}
              onPress={handleLogin}
              disabled={isLoading}
              activeOpacity={0.85}
            >
              {isLoading ? (
                <ActivityIndicator size="small" color={Colors.background} />
              ) : (
                <>
                  <Text style={styles.submitBtnText}>SIGN IN</Text>
                  <Ionicons name="arrow-forward" size={16} color={Colors.background} />
                </>
              )}
            </TouchableOpacity>

            {/* Forgot */}
            <TouchableOpacity style={styles.forgotBtn} onPress={() => navigation.navigate('Forgot')}>
              <Text style={styles.forgotText}>FORGOT PASSWORD?</Text>
            </TouchableOpacity>
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>Don't have an account? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Register')}>
              <Text style={styles.footerLink}>Register here</Text>
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
    marginBottom: 32,
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
    fontSize: 40,
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
    marginBottom: 16,
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
    gap: 20,
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
    height: 54,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    color: Colors.foreground,
    fontSize: 15,
    fontWeight: '600',
  },
  inputText: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
  },
  eyeButton: {
    padding: 4,
  },
  submitBtn: {
    backgroundColor: Colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 14,
    gap: 10,
    marginTop: 4,
    ...Platform.select({
      ios: { shadowColor: Colors.primary, shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.4, shadowRadius: 16 },
      android: { elevation: 8 }
    }),
  },
  submitBtnText: {
    color: Colors.background,
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 2,
  },
  disabledBtn: {
    opacity: 0.6,
  },
  forgotBtn: {
    alignItems: 'center',
    paddingVertical: 4,
  },
  forgotText: {
    color: Colors.textDim,
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 2,
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

export default LoginScreen;