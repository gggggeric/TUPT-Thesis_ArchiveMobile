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

const { width } = Dimensions.get('window');

const LoginScreen = () => {
  const navigation = useNavigation();
  const [idNumber, setIdNumber] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

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

  const handleLogin = () => {
    if (!idNumber || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    if (!validateIDNumber(idNumber)) {
      Alert.alert('Error', 'Please enter a valid ID number in format: TUPT-XX-XXXX');
      return;
    }
    
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      Alert.alert('Success', 'Logged in successfully!');
    }, 1500);
  };

  const handleClear = () => {
    setIdNumber('');
    setPassword('');
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
              <Text style={styles.loginTitle}>Welcome Back</Text>
              <Text style={styles.loginSubtitle}>Sign in to Thesis Analysis System</Text>

              <Text style={styles.label}>ID Number</Text>
              <TextInput
                style={styles.input}
                placeholder="TUPT-XX-XXXX"
                placeholderTextColor="rgba(255, 255, 255, 0.6)"
                value={idNumber}
                onChangeText={handleInputChange}
                autoCapitalize="characters"
                keyboardType="default"
                maxLength={12}
              />
              <Text style={styles.hintText}>Format: TUPT-XX-XXXX</Text>

              <Text style={styles.label}>Password</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter your password"
                placeholderTextColor="rgba(255, 255, 255, 0.6)"
                value={password}
                onChangeText={setPassword}
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
                  onPress={handleLogin}
                  disabled={isLoading}
                >
                  <Text style={styles.buttonText}>
                    {isLoading ? 'Logging in...' : 'Login'}
                  </Text>
                </TouchableOpacity>
              </View>

              <TouchableOpacity style={styles.link}>
                <Text style={styles.linkText}>Forgot Password?</Text>
              </TouchableOpacity>

              <View style={styles.moreInfoContainer}>
                <TouchableOpacity onPress={() => navigation.navigate('Register')}>
                  <Text style={styles.moreInfoLink}>
                    Don't have an account? Sign up
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
  hintText: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.5)',
    marginBottom: 10,
    fontStyle: 'italic',
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
  link: {
    marginTop: 10,
  },
  linkText: {
    color: 'white',
    fontSize: 13,
    textDecorationLine: 'underline',
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

export default LoginScreen;