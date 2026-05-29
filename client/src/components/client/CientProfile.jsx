import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Image,
  Alert,
  ActivityIndicator,
  RefreshControl,
  TextInput,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useDispatch, useSelector } from 'react-redux';
import * as ImagePicker from 'expo-image-picker';
import { updateProfile, getProfile } from '../../Redux/slices/authSlice';

const GOLD = '#D4AF37';
const BG = '#0a0a0a';
const CARD_BG = '#141414';
const BORDER = 'rgba(255,255,255,0.07)';
const INPUT_BG = 'rgba(255,255,255,0.05)';

export default function ClientProfile({ onNavigate }) {
  const dispatch = useDispatch();
  const { user, token, isLoading } = useSelector((state) => state.auth);
  
  const [refreshing, setRefreshing] = useState(false);
  const [editing, setEditing] = useState(false);
  const [profileData, setProfileData] = useState({
    first_name: '',
    last_name: '',
    company_name: '',
    phone_number: '',
    email_address: '',
    country: '',
    city: '',
    address: '',
    business_type: '',
    industry: '',
    bio_about: '',
    website: '',
    budget_range: '',
    preferred_communication_method: '',
  });
  const [selectedImage, setSelectedImage] = useState(null);

  useEffect(() => {
    if (user) {
      setProfileData({
        first_name: user.first_name || '',
        last_name: user.last_name || '',
        company_name: user.company_name || '',
        phone_number: user.phone_number || '',
        email_address: user.email_address || '',
        country: user.country || '',
        city: user.city || '',
        address: user.address || '',
        business_type: user.business_type || '',
        industry: user.industry || '',
        bio_about: user.bio_about || '',
        website: user.website || '',
        budget_range: user.budget_range || '',
        preferred_communication_method: user.preferred_communication_method || '',
      });
    }
  }, [user]);

  const fetchProfile = useCallback(async () => {
    try {
      await dispatch(getProfile()).unwrap();
    } catch (error) {
      console.error('Error fetching profile:', error);
      Alert.alert('Error', 'Failed to load profile');
    }
  }, [dispatch]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchProfile();
    setRefreshing(false);
  }, [fetchProfile]);

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please grant camera roll permissions to change profile picture');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled) {
      setSelectedImage(result.assets[0]);
    }
  };

  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please grant camera permissions to take a photo');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled) {
      setSelectedImage(result.assets[0]);
    }
  };

  const handleChangeProfilePicture = () => {
    Alert.alert(
      'Change Profile Picture',
      'Choose an option',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Take Photo', onPress: takePhoto },
        { text: 'Choose from Library', onPress: pickImage },
      ]
    );
  };

  const handleSave = async () => {
    if (!profileData.first_name.trim()) {
      Alert.alert('Error', 'First name is required');
      return;
    }
    if (!profileData.last_name.trim()) {
      Alert.alert('Error', 'Last name is required');
      return;
    }

    try {
      await dispatch(updateProfile({ 
        profileData, 
        profilePicture: selectedImage 
      })).unwrap();
      
      Alert.alert('Success', 'Profile updated successfully');
      setEditing(false);
      setSelectedImage(null);
      await fetchProfile();
    } catch (error) {
      Alert.alert('Error', error.message || 'Failed to update profile');
    }
  };

  const handleCancel = () => {
    setEditing(false);
    setSelectedImage(null);
    if (user) {
      setProfileData({
        first_name: user.first_name || '',
        last_name: user.last_name || '',
        company_name: user.company_name || '',
        phone_number: user.phone_number || '',
        email_address: user.email_address || '',
        country: user.country || '',
        city: user.city || '',
        address: user.address || '',
        business_type: user.business_type || '',
        industry: user.industry || '',
        bio_about: user.bio_about || '',
        website: user.website || '',
        budget_range: user.budget_range || '',
        preferred_communication_method: user.preferred_communication_method || '',
      });
    }
  };

  const getInitials = () => {
    return `${profileData.first_name?.[0] || ''}${profileData.last_name?.[0] || ''}`.toUpperCase();
  };

  const renderField = (label, key, placeholder, multiline = false) => (
    <View style={styles.fieldContainer}>
      <Text style={styles.fieldLabel}>{label}</Text>
      {editing ? (
        <TextInput
          style={[styles.fieldInput, multiline && styles.textArea]}
          value={profileData[key]}
          onChangeText={(text) => setProfileData({ ...profileData, [key]: text })}
          placeholder={placeholder}
          placeholderTextColor="rgba(255,255,255,0.2)"
          multiline={multiline}
          numberOfLines={multiline ? 3 : 1}
        />
      ) : (
        <Text style={styles.fieldValue}>
          {profileData[key] || 'Not specified'}
        </Text>
      )}
    </View>
  );

  const renderReadOnlyField = (label, key, placeholder) => (
    <View style={styles.fieldContainer}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <Text style={styles.fieldValue}>
        {profileData[key] || 'Not specified'}
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.topbar}>
        <TouchableOpacity style={styles.backBtn} onPress={() => onNavigate('ClientDashboard')} activeOpacity={0.7}>
          <Ionicons name="arrow-back" size={20} color="rgba(255,255,255,0.7)" />
        </TouchableOpacity>
        <Text style={styles.topbarTitle}>My <Text style={styles.gold}>Profile</Text></Text>
        {!editing ? (
          <TouchableOpacity style={styles.editBtn} onPress={() => setEditing(true)} activeOpacity={0.7}>
            <Ionicons name="create-outline" size={18} color={GOLD} />
            <Text style={styles.editBtnText}>Edit</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.editActions}>
            <TouchableOpacity style={styles.cancelBtn} onPress={handleCancel} activeOpacity={0.7}>
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.saveBtn} onPress={handleSave} activeOpacity={0.7}>
              {isLoading ? (
                <ActivityIndicator size="small" color="#0a0a0a" />
              ) : (
                <Text style={styles.saveBtnText}>Save</Text>
              )}
            </TouchableOpacity>
          </View>
        )}
      </View>

      <ScrollView 
        showsVerticalScrollIndicator={false} 
        contentContainerStyle={styles.scroll}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={GOLD} />
        }
      >
        {/* Profile Picture Section */}
        <View style={styles.profileImageSection}>
          <TouchableOpacity 
            style={styles.avatarContainer} 
            onPress={editing ? handleChangeProfilePicture : null}
            activeOpacity={editing ? 0.7 : 1}
          >
            {selectedImage ? (
              <Image source={{ uri: selectedImage.uri }} style={styles.avatarImage} />
            ) : user?.profile_picture ? (
              <Image source={{ uri: user.profile_picture }} style={styles.avatarImage} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Text style={styles.avatarInitials}>{getInitials()}</Text>
              </View>
            )}
            {editing && (
              <View style={styles.editIconOverlay}>
                <Ionicons name="camera" size={20} color="#fff" />
              </View>
            )}
          </TouchableOpacity>
          {editing && (
            <Text style={styles.editPhotoText}>Tap to change profile picture</Text>
          )}
        </View>

        {/* Personal Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Personal Information</Text>
          <View style={styles.sectionContent}>
            {renderField('First Name', 'first_name', 'Enter first name')}
            {renderField('Last Name', 'last_name', 'Enter last name')}
            {renderReadOnlyField('Email Address', 'email_address', 'Email address')}
            {renderField('Phone Number', 'phone_number', 'Enter phone number')}
          </View>
        </View>

        {/* Company Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Company Information</Text>
          <View style={styles.sectionContent}>
            {renderField('Company Name', 'company_name', 'Enter company name')}
            {renderField('Business Type', 'business_type', 'e.g., Corporation, Sole Proprietorship')}
            {renderField('Industry', 'industry', 'e.g., Technology, Retail, Healthcare')}
            {renderField('Website', 'website', 'https://yourcompany.com')}
          </View>
        </View>

        {/* Location */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Location</Text>
          <View style={styles.sectionContent}>
            {renderField('Country', 'country', 'Enter country')}
            {renderField('City', 'city', 'Enter city')}
            {renderField('Address', 'address', 'Enter street address')}
          </View>
        </View>

        {/* Business Details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Business Details</Text>
          <View style={styles.sectionContent}>
            {renderField('About / Bio', 'bio_about', 'Tell us about your business', true)}
            {renderField('Budget Range', 'budget_range', 'e.g., ₱10k - ₱50k')}
            {renderField('Preferred Communication', 'preferred_communication_method', 'e.g., Email, Phone, Chat')}
          </View>
        </View>

        {/* Account Actions */}
        <View style={styles.actionsSection}>
          <TouchableOpacity 
            style={styles.passwordBtn}
            onPress={() => onNavigate('ChangePassword')}
          >
            <Ionicons name="key-outline" size={18} color={GOLD} />
            <Text style={styles.passwordBtnText}>Change Password</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: BG },
  topbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: CARD_BG,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: BORDER,
  },
  topbarTitle: {
    fontSize: 16,
    fontWeight: '300',
    color: '#fff',
  },
  gold: {
    color: GOLD,
    fontStyle: 'italic',
    fontWeight: '400',
  },
  editBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(212,175,55,0.1)',
    borderWidth: 0.5,
    borderColor: GOLD,
  },
  editBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: GOLD,
  },
  editActions: {
    flexDirection: 'row',
    gap: 8,
  },
  cancelBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: BORDER,
  },
  cancelBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.7)',
  },
  saveBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: GOLD,
  },
  saveBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#0a0a0a',
  },
  scroll: {
    paddingBottom: 40,
  },
  profileImageSection: {
    alignItems: 'center',
    paddingVertical: 24,
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
  },
  avatarContainer: {
    position: 'relative',
  },
  avatarImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  avatarPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: GOLD,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitials: {
    fontSize: 36,
    fontWeight: '700',
    color: '#0a0a0a',
  },
  editIconOverlay: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: GOLD,
    borderRadius: 20,
    padding: 6,
    borderWidth: 2,
    borderColor: BG,
  },
  editPhotoText: {
    marginTop: 8,
    fontSize: 11,
    color: GOLD,
  },
  section: {
    marginTop: 20,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: GOLD,
    marginBottom: 12,
    letterSpacing: 0.5,
  },
  sectionContent: {
    backgroundColor: CARD_BG,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: BORDER,
    overflow: 'hidden',
  },
  fieldContainer: {
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
  },
  fieldLabel: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.4)',
    marginBottom: 4,
    letterSpacing: 0.5,
  },
  fieldValue: {
    fontSize: 14,
    color: '#fff',
  },
  fieldInput: {
    fontSize: 14,
    color: '#fff',
    padding: 0,
    margin: 0,
    backgroundColor: INPUT_BG,
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  actionsSection: {
    marginTop: 24,
    paddingHorizontal: 16,
    marginBottom: 20,
  },
  passwordBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: 'rgba(212,175,55,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(212,175,55,0.3)',
  },
  passwordBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: GOLD,
  },
});