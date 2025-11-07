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
  Alert,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import API_BASE_URL from '../../api';
import { useToast } from '../../utils/ToastContext';

const { width } = Dimensions.get('window');

const ProfileScreen = () => {
  const navigation = useNavigation();
  const toast = useToast();
  
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    birthdate: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  // Load user data on component mount
  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      const userData = await AsyncStorage.getItem('userData');
      if (userData) {
        const parsedUser = JSON.parse(userData);
        setUser(parsedUser);
        setFormData({
          name: parsedUser.name,
          birthdate: parsedUser.birthdate,
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        });
      }
    } catch (error) {
      console.error('Error loading user data:', error);
      toast.show('Error loading profile data', 'error');
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleDateChange = (event, date) => {
    setShowDatePicker(false);
    if (date) {
      const formattedDate = date.toISOString().split('T')[0];
      setFormData(prev => ({
        ...prev,
        birthdate: formattedDate
      }));
    }
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

  const validateForm = () => {
    if (!formData.name.trim()) {
      toast.show('Name is required', 'error');
      return false;
    }

    if (!formData.birthdate) {
      toast.show('Birthdate is required', 'error');
      return false;
    }

    // Check if password is being changed
    if (formData.newPassword) {
      if (!formData.currentPassword) {
        toast.show('Current password is required to change password', 'error');
        return false;
      }

      if (formData.newPassword.length < 6) {
        toast.show('New password must be at least 6 characters', 'error');
        return false;
      }

      if (formData.newPassword !== formData.confirmPassword) {
        toast.show('New passwords do not match', 'error');
        return false;
      }
    }

    return true;
  };

  const handleUpdateProfile = async () => {
    if (!validateForm()) return;

    setIsLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/user/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user._id,
          name: formData.name.trim(),
          birthdate: formData.birthdate,
          currentPassword: formData.currentPassword,
          newPassword: formData.newPassword
        }),
      });

      const data = await response.json();

      if (response.ok) {
        // Update local storage with new user data
        const updatedUser = { ...user, ...data.data.user };
        await AsyncStorage.setItem('userData', JSON.stringify(updatedUser));
        
        setUser(updatedUser);
        setIsEditing(false);
        toast.show('Profile updated successfully!', 'success');
        
        // Clear password fields
        setFormData(prev => ({
          ...prev,
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        }));
      } else {
        toast.show(data.message || 'Failed to update profile', 'error');
      }
    } catch (error) {
      console.error('Update profile error:', error);
      toast.show('Cannot connect to server. Please try again.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    // Reset form to original user data
    setFormData({
      name: user.name,
      birthdate: user.birthdate,
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    });
  };

  if (!user) {
    return (
      <LinearGradient colors={['#f9e8e9', '#c7242c']} style={styles.gradientBackground}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading profile...</Text>
        </View>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={['#f9e8e9', '#c7242c']} style={styles.gradientBackground}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView 
          contentContainerStyle={styles.scrollContainer}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.profileSection}>
            <View style={styles.profileBox}>
              {/* Header */}
              <View style={styles.header}>
                <TouchableOpacity 
                  style={styles.backButton}
                  onPress={() => navigation.goBack()}
                >
                  <Ionicons name="arrow-back" size={24} color="white" />
                </TouchableOpacity>
                <Text style={styles.title}>Profile Settings</Text>
                {!isEditing ? (
                  <TouchableOpacity 
                    style={styles.editButton}
                    onPress={() => setIsEditing(true)}
                  >
                    <Ionicons name="create" size={24} color="white" />
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity 
                    style={styles.cancelButton}
                    onPress={handleCancelEdit}
                  >
                    <Text style={styles.cancelButtonText}>Cancel</Text>
                  </TouchableOpacity>
                )}
              </View>

              {/* User Avatar */}
              <View style={styles.avatarContainer}>
                <View style={styles.avatar}>
                  <Ionicons name="person" size={50} color="white" />
                </View>
                <Text style={styles.userId}>{user.idNumber}</Text>
              </View>

              {/* Profile Form */}
              <View style={styles.formContainer}>
                {/* Name Field */}
                <Text style={styles.label}>Full Name</Text>
                <TextInput
                  style={[styles.input, !isEditing && styles.disabledInput]}
                  value={formData.name}
                  onChangeText={(value) => handleInputChange('name', value)}
                  editable={isEditing}
                  placeholder="Enter your full name"
                  placeholderTextColor="rgba(255, 255, 255, 0.6)"
                />

                {/* ID Number (Read-only) */}
                <Text style={styles.label}>ID Number</Text>
                <TextInput
                  style={[styles.input, styles.disabledInput]}
                  value={user.idNumber}
                  editable={false}
                  placeholderTextColor="rgba(255, 255, 255, 0.6)"
                />

                {/* Birthdate Field */}
                <Text style={styles.label}>Birthdate</Text>
                {isEditing ? (
                  <TouchableOpacity 
                    style={styles.dateInput}
                    onPress={() => setShowDatePicker(true)}
                  >
                    <Text style={formData.birthdate ? styles.dateText : styles.placeholderText}>
                      {formData.birthdate ? formatDisplayDate(formData.birthdate) : 'Select birthdate'}
                    </Text>
                  </TouchableOpacity>
                ) : (
                  <Text style={styles.readOnlyText}>
                    {formatDisplayDate(user.birthdate)}
                  </Text>
                )}

                {showDatePicker && (
                  <DateTimePicker
                    value={formData.birthdate ? new Date(formData.birthdate) : new Date()}
                    mode="date"
                    display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                    onChange={handleDateChange}
                    maximumDate={new Date()}
                    minimumDate={new Date(1900, 0, 1)}
                  />
                )}

                {/* Age (Read-only) */}
                <Text style={styles.label}>Age</Text>
                <Text style={styles.readOnlyText}>{user.age} years old</Text>

                {/* Password Change Section */}
                {isEditing && (
                  <View style={styles.passwordSection}>
                    <Text style={styles.sectionTitle}>Change Password</Text>
                    
                    <Text style={styles.label}>Current Password</Text>
                    <TextInput
                      style={styles.input}
                      value={formData.currentPassword}
                      onChangeText={(value) => handleInputChange('currentPassword', value)}
                      secureTextEntry
                      placeholder="Enter current password"
                      placeholderTextColor="rgba(255, 255, 255, 0.6)"
                    />

                    <Text style={styles.label}>New Password</Text>
                    <TextInput
                      style={styles.input}
                      value={formData.newPassword}
                      onChangeText={(value) => handleInputChange('newPassword', value)}
                      secureTextEntry
                      placeholder="Enter new password"
                      placeholderTextColor="rgba(255, 255, 255, 0.6)"
                    />

                    <Text style={styles.label}>Confirm New Password</Text>
                    <TextInput
                      style={styles.input}
                      value={formData.confirmPassword}
                      onChangeText={(value) => handleInputChange('confirmPassword', value)}
                      secureTextEntry
                      placeholder="Confirm new password"
                      placeholderTextColor="rgba(255, 255, 255, 0.6)"
                    />

                    <Text style={styles.passwordHint}>
                      Leave password fields empty if you don't want to change password
                    </Text>
                  </View>
                )}

                {/* Update Button */}
                {isEditing && (
                  <TouchableOpacity 
                    style={[styles.updateButton, isLoading && styles.disabledButton]}
                    onPress={handleUpdateProfile}
                    disabled={isLoading}
                  >
                    <Text style={styles.updateButtonText}>
                      {isLoading ? 'Updating...' : 'Update Profile'}
                    </Text>
                  </TouchableOpacity>
                )}
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
    paddingVertical: 40,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#605051',
    fontSize: 18,
  },
  profileSection: {
    width: '100%',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  profileBox: {
    width: width > 480 ? 420 : '100%',
    maxWidth: 420,
    padding: 25,
    borderRadius: 4,
    backgroundColor: '#605051',
    shadowColor: '#000',
    shadowOffset: { width: 8, height: 8 },
    shadowOpacity: 0.9,
    shadowRadius: 25,
    elevation: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 30,
  },
  backButton: {
    padding: 5,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
  },
  editButton: {
    padding: 5,
  },
  cancelButton: {
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  cancelButtonText: {
    color: 'white',
    fontSize: 16,
  },
  avatarContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  userId: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    fontWeight: '500',
  },
  formContainer: {
    width: '100%',
  },
  label: {
    fontSize: 14,
    marginVertical: 8,
    color: 'white',
    fontWeight: '500',
  },
  input: {
    width: '100%',
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 2,
    marginBottom: 15,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    color: 'white',
    fontSize: 16,
  },
  disabledInput: {
    opacity: 0.7,
  },
  dateInput: {
    width: '100%',
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 2,
    marginBottom: 15,
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
  readOnlyText: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 16,
    marginBottom: 15,
    paddingVertical: 12,
  },
  passwordSection: {
    marginTop: 20,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.2)',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 15,
    textAlign: 'center',
  },
  passwordHint: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.6)',
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: 10,
  },
  updateButton: {
    backgroundColor: '#c7242c',
    paddingVertical: 15,
    borderRadius: 2,
    alignItems: 'center',
    marginTop: 20,
  },
  disabledButton: {
    opacity: 0.6,
  },
  updateButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default ProfileScreen;