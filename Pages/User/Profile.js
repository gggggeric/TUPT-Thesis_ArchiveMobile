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
  Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation, useIsFocused } from '@react-navigation/native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import API_BASE_URL from '../../api';
import { useToast } from '../../utils/ToastContext';
import Colors from '../../utils/Colors';
import BottomNavBar from '../Navigation/BottomNavBar';
import GridMenu from '../Navigation/GridMenu';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');

const ProfileScreen = () => {
  const navigation = useNavigation();
  const isFocused = useIsFocused();
  const toast = useToast();
  const insets = useSafeAreaInsets();
  
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [isMenuVisible, setIsMenuVisible] = useState(false);

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

  const handleLogout = async () => {
    try {
      await AsyncStorage.removeItem('userData');
      await AsyncStorage.removeItem('userToken');
      setUser(null);
      navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
    } catch (error) {
      console.error('Error during logout:', error);
      toast.show('Error logging out', 'error');
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
      const token = await AsyncStorage.getItem('userToken');

      const response = await fetch(`${API_BASE_URL}/user/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
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

  const pickImage = async () => {
    try {
      let result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        await uploadProfileImage(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      toast.show('Failed to open image picker', 'error');
    }
  };

  const uploadProfileImage = async (uri) => {
    setIsLoading(true);
    try {
      const token = await AsyncStorage.getItem('userToken');
      
      let formData = new FormData();
      let filename = uri.split('/').pop();
      let match = /\.(\w+)$/.exec(filename);
      let type = match ? `image/${match[1]}` : `image`;

      formData.append('photo', { uri: uri, name: filename, type });

      const response = await fetch(`${API_BASE_URL}/user/profile-photo`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
        },
        body: formData,
      });

      const data = await response.json();

      if (response.ok) {
        const updatedPhoto = data.data?.profilePhoto || data.profilePhoto;
        if (updatedPhoto) {
          const updatedUser = { ...user, profilePhoto: updatedPhoto };
          await AsyncStorage.setItem('userData', JSON.stringify(updatedUser));
          setUser(updatedUser);
          toast.show('Profile photo updated!', 'success');
        }
      } else {
        toast.show(data.message || 'Failed to upload photo', 'error');
      }
    } catch (error) {
      console.error('Error uploading photo:', error);
      toast.show('Error uploading photo. Please try again.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  if (!user) {
    return (
      <View style={styles.gradientBackground}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading profile...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.gradientBackground}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView 
          contentContainerStyle={[styles.scrollContainer, { paddingTop: Math.max(insets.top + 16, 40) }]}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.profileSection}>
            {/* Header Section */}
            <View style={styles.headerSection}>
              <View style={styles.avatarContainer}>
                <TouchableOpacity 
                  onPress={pickImage} 
                  style={[styles.avatar, { backgroundColor: Colors.card, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: Colors.primary }]}
                  activeOpacity={0.85}
                >
                  {user.profilePhoto ? (
                    <Image source={{ uri: user.profilePhoto }} style={{ width: '100%', height: '100%' }} />
                  ) : (
                    <Ionicons name="person" size={48} color={Colors.primary} />
                  )}
                </TouchableOpacity>
                <TouchableOpacity 
                  onPress={pickImage} 
                  style={styles.cameraIconContainer}
                  activeOpacity={0.85}
                >
                  <Ionicons name="camera" size={16} color="#fff" />
                </TouchableOpacity>
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
                    <Ionicons name="create-outline" size={20} color={Colors.primary} />
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
                    textColor="#ffffff"
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
                    activeOpacity={0.85}
                  >
                    <View style={styles.updateGradient}>
                      {isLoading ? (
                        <Text style={styles.updateButtonText}>Updating...</Text>
                      ) : (
                        <>
                          <Text style={styles.updateButtonText}>Update Profile</Text>
                          <Ionicons name="checkmark-circle" size={20} color={Colors.background} />
                        </>
                      )}
                    </View>
                  </TouchableOpacity>
                )}
              </View>
            </View>

            {/* Logout Button (only visible when not editing) */}
            {!isEditing && (
              <TouchableOpacity
                style={styles.logoutButton}
                onPress={handleLogout}
                activeOpacity={0.85}
              >
                <Ionicons name="log-out-outline" size={20} color={Colors.accent} style={{ marginRight: 6 }} />
                <Text style={styles.logoutText}>Logout</Text>
              </TouchableOpacity>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Grid Menu */}
      {isFocused && (
        <GridMenu isVisible={isMenuVisible} onClose={() => setIsMenuVisible(false)} navigation={navigation} />
      )}

      {/* Bottom Nav Bar */}
      <BottomNavBar activeScreen="Profile" onGridPress={() => setIsMenuVisible(true)} />
    </View>
  );
};

const styles = StyleSheet.create({
  gradientBackground: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  container: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingTop: 40,
    paddingBottom: 110,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: Colors.textSecondary,
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
    backgroundColor: Colors.card,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  avatarContainer: {
    marginBottom: 16,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    overflow: 'hidden',
    ...Platform.select({
      ios: { shadowColor: Colors.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8 },
      android: { elevation: 8 },
    }),
  },
  cameraIconContainer: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: Colors.primary,
    borderRadius: 15,
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: Colors.background,
  },
  welcomeTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: Colors.foreground,
    marginBottom: 4,
  },
  welcomeSubtitle: {
    fontSize: 14,
    color: Colors.primary,
    fontWeight: '700',
    letterSpacing: 1,
  },
  profileBox: {
    width: width > 480 ? 420 : '100%',
    maxWidth: 420,
    padding: 24,
    borderRadius: 24,
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 12 }, shadowOpacity: 0.3, shadowRadius: 20 },
      android: { elevation: 8 },
    }),
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.foreground,
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  editButtonText: {
    fontSize: 13,
    color: Colors.primary,
    fontWeight: '700',
  },
  cancelButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  cancelButtonText: {
    fontSize: 13,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  formContainer: {
    width: '100%',
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 10,
    fontWeight: '900',
    color: Colors.textSecondary,
    marginBottom: 8,
    letterSpacing: 1.5,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: 14,
    minHeight: 50,
  },
  disabledInputWrapper: {
    opacity: 0.5,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 15,
    color: Colors.foreground,
  },
  dateText: {
    flex: 1,
    fontSize: 15,
    color: Colors.foreground,
    paddingVertical: 14,
  },
  placeholderText: {
    flex: 1,
    fontSize: 15,
    color: Colors.textDim,
    paddingVertical: 14,
  },
  passwordSection: {
    marginTop: 24,
    paddingTop: 24,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '900',
    color: Colors.foreground,
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 12,
    color: Colors.textDim,
    marginBottom: 16,
    fontStyle: 'italic',
  },
  updateButton: {
    marginTop: 24,
    borderRadius: 14,
    overflow: 'hidden',
    ...Platform.select({
      ios: { shadowColor: Colors.primary, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.4, shadowRadius: 12 },
      android: { elevation: 6 },
    }),
  },
  updateGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 8,
    backgroundColor: Colors.primary,
    borderRadius: 14,
  },
  updateButtonText: {
    color: Colors.background,
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 1,
  },
  disabledButton: {
    opacity: 0.6,
  },
  logoutButton: {
    width: width > 480 ? 420 : '100%',
    maxWidth: 420,
    height: 52,
    borderRadius: 16,
    backgroundColor: 'rgba(243, 139, 168, 0.05)',
    borderColor: 'rgba(243, 139, 168, 0.2)',
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
    marginBottom: 10,
    ...Platform.select({
      ios: { shadowColor: Colors.accent, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 6 },
      android: { elevation: 2 },
    }),
  },
  logoutText: {
    color: Colors.accent,
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
});

export default ProfileScreen;