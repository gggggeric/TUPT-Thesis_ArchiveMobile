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
      <LinearGradient colors={['#fef2f2', '#fee2e2', '#fecaca']} style={styles.gradientBackground}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading profile...</Text>
        </View>
      </LinearGradient>
    );
  }

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
          <View style={styles.profileSection}>
            {/* Header Section */}
            <View style={styles.headerSection}>
              <TouchableOpacity 
                style={styles.backButton}
                onPress={() => navigation.goBack()}
              >
                <Ionicons name="arrow-back" size={24} color="#1f2937" />
              </TouchableOpacity>
              
              <View style={styles.avatarContainer}>
                <LinearGradient
                  colors={['#c7242c', '#991b1b']}
                  style={styles.avatar}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <Ionicons name="person" size={48} color="white" />
                </LinearGradient>
              </View>
              
              <Text style={styles.welcomeTitle}>{user.name}</Text>
              <Text style={styles.welcomeSubtitle}>{user.idNumber}</Text>
            </View>

            {/* Profile Card */}
            <View style={styles.profileBox}>
              {/* Edit/Cancel Button Header */}
              <View style={styles.cardHeader}>
                <Text style={styles.cardTitle}>Profile Information</Text>
                {!isEditing ? (
                  <TouchableOpacity 
                    style={styles.editButton}
                    onPress={() => setIsEditing(true)}
                  >
                    <Ionicons name="create-outline" size={20} color="#c7242c" />
                    <Text style={styles.editButtonText}>Edit</Text>
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity 
                    style={styles.cancelButton}
                    onPress={handleCancelEdit}
                  >
                    <Ionicons name="close-circle-outline" size={20} color="#6b7280" />
                    <Text style={styles.cancelButtonText}>Cancel</Text>
                  </TouchableOpacity>
                )}
              </View>

              {/* Profile Form */}
              <View style={styles.formContainer}>
                {/* Name Field */}
                <View style={styles.inputContainer}>
                  <Text style={styles.label}>Full Name</Text>
                  <View style={[styles.inputWrapper, !isEditing && styles.disabledInputWrapper]}>
                    <Ionicons name="person-outline" size={20} color="#6b7280" style={styles.inputIcon} />
                    <TextInput
                      style={styles.input}
                      value={formData.name}
                      onChangeText={(value) => handleInputChange('name', value)}
                      editable={isEditing}
                      placeholder="Enter your full name"
                      placeholderTextColor="#9ca3af"
                    />
                  </View>
                </View>

                {/* ID Number (Read-only) */}
                <View style={styles.inputContainer}>
                  <Text style={styles.label}>ID Number</Text>
                  <View style={[styles.inputWrapper, styles.disabledInputWrapper]}>
                    <Ionicons name="card-outline" size={20} color="#6b7280" style={styles.inputIcon} />
                    <TextInput
                      style={styles.input}
                      value={user.idNumber}
                      editable={false}
                      placeholderTextColor="#9ca3af"
                    />
                  </View>
                </View>

                {/* Birthdate Field */}
                <View style={styles.inputContainer}>
                  <Text style={styles.label}>Birthdate</Text>
                  {isEditing ? (
                    <TouchableOpacity 
                      style={styles.inputWrapper}
                      onPress={() => setShowDatePicker(true)}
                    >
                      <Ionicons name="calendar-outline" size={20} color="#6b7280" style={styles.inputIcon} />
                      <Text style={formData.birthdate ? styles.dateText : styles.placeholderText}>
                        {formData.birthdate ? formatDisplayDate(formData.birthdate) : 'Select birthdate'}
                      </Text>
                    </TouchableOpacity>
                  ) : (
                    <View style={[styles.inputWrapper, styles.disabledInputWrapper]}>
                      <Ionicons name="calendar-outline" size={20} color="#6b7280" style={styles.inputIcon} />
                      <Text style={styles.dateText}>
                        {formatDisplayDate(user.birthdate)}
                      </Text>
                    </View>
                  )}
                </View>

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
                <View style={styles.inputContainer}>
                  <Text style={styles.label}>Age</Text>
                  <View style={[styles.inputWrapper, styles.disabledInputWrapper]}>
                    <Ionicons name="time-outline" size={20} color="#6b7280" style={styles.inputIcon} />
                    <Text style={styles.dateText}>{user.age} years old</Text>
                  </View>
                </View>

                {/* Password Change Section */}
                {isEditing && (
                  <View style={styles.passwordSection}>
                    <Text style={styles.sectionTitle}>Change Password</Text>
                    <Text style={styles.sectionSubtitle}>Leave blank if you don't want to change</Text>
                    
                    <View style={styles.inputContainer}>
                      <Text style={styles.label}>Current Password</Text>
                      <View style={styles.inputWrapper}>
                        <Ionicons name="lock-closed-outline" size={20} color="#6b7280" style={styles.inputIcon} />
                        <TextInput
                          style={styles.input}
                          value={formData.currentPassword}
                          onChangeText={(value) => handleInputChange('currentPassword', value)}
                          secureTextEntry
                          placeholder="Enter current password"
                          placeholderTextColor="#9ca3af"
                        />
                      </View>
                    </View>

                    <View style={styles.inputContainer}>
                      <Text style={styles.label}>New Password</Text>
                      <View style={styles.inputWrapper}>
                        <Ionicons name="lock-closed-outline" size={20} color="#6b7280" style={styles.inputIcon} />
                        <TextInput
                          style={styles.input}
                          value={formData.newPassword}
                          onChangeText={(value) => handleInputChange('newPassword', value)}
                          secureTextEntry
                          placeholder="Enter new password"
                          placeholderTextColor="#9ca3af"
                        />
                      </View>
                    </View>

                    <View style={styles.inputContainer}>
                      <Text style={styles.label}>Confirm New Password</Text>
                      <View style={styles.inputWrapper}>
                        <Ionicons name="lock-closed-outline" size={20} color="#6b7280" style={styles.inputIcon} />
                        <TextInput
                          style={styles.input}
                          value={formData.confirmPassword}
                          onChangeText={(value) => handleInputChange('confirmPassword', value)}
                          secureTextEntry
                          placeholder="Confirm new password"
                          placeholderTextColor="#9ca3af"
                        />
                      </View>
                    </View>
                  </View>
                )}

                {/* Update Button */}
                {isEditing && (
                  <TouchableOpacity 
                    style={[styles.updateButton, isLoading && styles.disabledButton]}
                    onPress={handleUpdateProfile}
                    disabled={isLoading}
                    activeOpacity={0.8}
                  >
                    <LinearGradient
                      colors={['#c7242c', '#991b1b']}
                      style={styles.updateGradient}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                    >
                      {isLoading ? (
                        <Text style={styles.updateButtonText}>Updating...</Text>
                      ) : (
                        <>
                          <Text style={styles.updateButtonText}>Update Profile</Text>
                          <Ionicons name="checkmark-circle" size={20} color="white" />
                        </>
                      )}
                    </LinearGradient>
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
    paddingHorizontal: 20,
    paddingVertical: 40,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#6b7280',
    fontSize: 18,
  },
  profileSection: {
    width: '100%',
    alignItems: 'center',
  },
  headerSection: {
    alignItems: 'center',
    marginBottom: 30,
    width: '100%',
  },
  backButton: {
    alignSelf: 'flex-start',
    padding: 8,
    marginBottom: 20,
  },
  avatarContainer: {
    marginBottom: 16,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
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
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 4,
  },
  welcomeSubtitle: {
    fontSize: 16,
    color: '#6b7280',
  },
  profileBox: {
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
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  editButtonText: {
    fontSize: 14,
    color: '#c7242c',
    fontWeight: '600',
  },
  cancelButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  cancelButtonText: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '600',
  },
  formContainer: {
    width: '100%',
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
  disabledInputWrapper: {
    backgroundColor: '#f3f4f6',
    opacity: 0.7,
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
  passwordSection: {
    marginTop: 24,
    paddingTop: 24,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 12,
    color: '#9ca3af',
    marginBottom: 16,
    fontStyle: 'italic',
  },
  updateButton: {
    marginTop: 24,
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
  updateGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    gap: 8,
  },
  updateButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  disabledButton: {
    opacity: 0.6,
  },
});

export default ProfileScreen;