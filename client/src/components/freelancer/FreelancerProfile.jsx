import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  TextInput,
  Image,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useDispatch, useSelector } from 'react-redux';
import * as ImagePicker from 'expo-image-picker';
import { updateProfile, deleteProfilePicture } from '../../Redux/slices/authSlice';

const GOLD = '#D4AF37';
const BG = '#0a0a0a';
const CARD_BG = '#141414';
const BORDER = 'rgba(255,255,255,0.07)';
const INPUT_BG = '#111111';

const EXPERIENCE_LEVELS = ['Entry', 'Intermediate', 'Expert', 'Senior'];

const SKILL_SUGGESTIONS = [
  'React Native', 'React.js', 'Node.js', 'UI/UX Design', 'Figma',
  'Python', 'Laravel', 'WordPress', 'SEO', 'Copywriting',
  'Video Editing', 'Graphic Design', 'Social Media', 'Data Entry',
];

export default function FreelancerProfile({ onNavigate }) {
  const dispatch = useDispatch();
  const { user, isLoading } = useSelector((state) => state.auth);

  const [skillInput, setSkillInput] = useState('');
  const [imageModalVisible, setImageModalVisible] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);

  // Store all form fields in individual useState calls
  const [firstName, setFirstName] = useState(user?.first_name ?? '');
  const [lastName, setLastName] = useState(user?.last_name ?? '');
  const [username, setUsername] = useState(user?.username ?? '');
  const [phone, setPhone] = useState(user?.phone_number ?? '');
  const [bio, setBio] = useState(user?.bio_about_me ?? '');
  const [skills, setSkills] = useState(user?.skills ?? []);
  const [experienceLevel, setExperienceLevel] = useState(user?.experience_level ?? '');
  const [yearsExp, setYearsExp] = useState(user?.years_of_experience?.toString() ?? '');
  const [hourlyRate, setHourlyRate] = useState(user?.hourly_rate?.toString() ?? '');
  const [fixedRate, setFixedRate] = useState(user?.fixed_rate?.toString() ?? '');
  const [city, setCity] = useState(user?.city ?? '');
  const [country, setCountry] = useState(user?.country ?? '');
  const [portfolioUrl, setPortfolioUrl] = useState(user?.portfolio_link ?? '');

  const initials = `${firstName?.[0] ?? ''}${lastName?.[0] ?? ''}`.toUpperCase();

  // Request permission for image picker
  const requestPermission = async () => {
    if (Platform.OS !== 'web') {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Needed', 'Please grant permission to access your photos to change your profile picture.');
        return false;
      }
      return true;
    }
    return true;
  };

  // Pick image from gallery
  const pickImage = async () => {
    const hasPermission = await requestPermission();
    if (!hasPermission) return;

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'], 
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
      base64: false,
    });

    if (!result.canceled) {
      await uploadProfilePicture(result.assets[0]);
    }
  };

  // Take photo with camera
  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Needed', 'Please grant permission to access your camera.');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled) {
      await uploadProfilePicture(result.assets[0]);
    }
  };

  // Upload profile picture
  const uploadProfilePicture = async (imageAsset) => {
    setUploadingImage(true);
    try {
      const imageFile = {
        uri: imageAsset.uri,
        type: 'image/jpeg',
        name: `profile_${Date.now()}.jpg`,
      };

      const result = await dispatch(updateProfile({ 
        profileData: {}, 
        profilePicture: imageFile 
      }));

      if (updateProfile.fulfilled.match(result)) {
        Alert.alert('Success', 'Profile picture updated successfully!');
        setImageModalVisible(false);
      } else {
        Alert.alert('Error', result.payload?.message || 'Failed to update profile picture');
      }
    } catch (error) {
      console.error('Error uploading image:', error);
      Alert.alert('Error', 'Failed to upload profile picture');
    } finally {
      setUploadingImage(false);
    }
  };

  // Delete profile picture
  const handleDeleteProfilePicture = async () => {
    Alert.alert(
      'Delete Profile Picture',
      'Are you sure you want to delete your profile picture?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setUploadingImage(true);
            try {
              const result = await dispatch(deleteProfilePicture());
              if (deleteProfilePicture.fulfilled.match(result)) {
                Alert.alert('Success', 'Profile picture deleted successfully');
                setImageModalVisible(false);
              } else {
                Alert.alert('Error', result.payload?.message || 'Failed to delete profile picture');
              }
            } catch (error) {
              Alert.alert('Error', 'Failed to delete profile picture');
            } finally {
              setUploadingImage(false);
            }
          }
        }
      ]
    );
  };

  const addSkill = useCallback((skill) => {
    const trimmed = skill.trim();
    if (!trimmed) return;
    setSkills((prev) => {
      if (prev.includes(trimmed)) return prev;
      return [...prev, trimmed];
    });
    setSkillInput('');
  }, []);

  const removeSkill = useCallback((skill) => {
    setSkills((prev) => prev.filter((s) => s !== skill));
  }, []);

  const handleSave = async () => {
    // Validation
    if (!firstName.trim() || !lastName.trim()) {
      Alert.alert('Validation Error', 'First and last name are required.');
      return;
    }

    if (!experienceLevel) {
      Alert.alert('Validation Error', 'Please select your experience level.');
      return;
    }

    // Map fields to match backend expectations
    const profileData = {
      first_name: firstName.trim(),
      last_name: lastName.trim(),
      username: username.trim() || undefined,
      phone_number: phone.trim() || undefined,
      bio_about_me: bio.trim() || undefined,
      skills: skills.length > 0 ? skills : undefined,
      experience_level: experienceLevel,
      years_of_experience: yearsExp ? parseInt(yearsExp, 10) : null,
      hourly_rate: hourlyRate ? parseFloat(hourlyRate) : null,
      fixed_rate: fixedRate ? parseFloat(fixedRate) : null,
      city: city.trim() || undefined,
      country: country.trim() || undefined,
      portfolio_link: portfolioUrl.trim() || undefined,
    };

    // Remove undefined values
    Object.keys(profileData).forEach(key => {
      if (profileData[key] === undefined) {
        delete profileData[key];
      }
    });

    console.log('Updating profile with data:', profileData);

    try {
      const result = await dispatch(updateProfile({ profileData, profilePicture: null }));
      
      console.log('Update result:', result);

      if (updateProfile.fulfilled.match(result)) {
        Alert.alert('Success', 'Your profile has been updated!', [
          { text: 'OK', onPress: () => onNavigate('Freelancer') },
        ]);
      } else {
        const errMsg = result.payload?.message || result.payload?.error || 'Failed to update profile. Please try again.';
        Alert.alert('Error', errMsg);
      }
    } catch (error) {
      console.error('Update error:', error);
      Alert.alert('Error', 'An unexpected error occurred. Please try again.');
    }
  };

  const Label = ({ text, required }) => (
    <Text style={styles.label}>
      {text}
      {required && <Text style={styles.labelRequired}> *</Text>}
    </Text>
  );

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
      >
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => onNavigate('Freelancer')}
            activeOpacity={0.7}
          >
            <Ionicons name="arrow-back" size={20} color={GOLD} />
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>My Profile</Text>
            <Text style={styles.headerSub}>Edit your information</Text>
          </View>
          <TouchableOpacity
            style={[styles.saveBtn, isLoading && styles.saveBtnDisabled]}
            onPress={handleSave}
            disabled={isLoading}
            activeOpacity={0.8}
          >
            {isLoading ? (
              <ActivityIndicator size="small" color="#0a0a0a" />
            ) : (
              <Text style={styles.saveBtnText}>Save</Text>
            )}
          </TouchableOpacity>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="none"
        >
          {/* Avatar Section - Made clickable */}
          <TouchableOpacity 
            style={styles.avatarSection}
            onPress={() => setImageModalVisible(true)}
            activeOpacity={0.9}
          >
            <View style={styles.avatarWrap}>
              {user?.profile_picture ? (
                <Image source={{ uri: user.profile_picture }} style={styles.avatar} />
              ) : (
                <View style={styles.avatarPlaceholder}>
                  <Text style={styles.avatarInitials}>{initials || '?'}</Text>
                </View>
              )}
              <View style={styles.avatarEditBtn}>
                <Ionicons name="camera-outline" size={16} color="#0a0a0a" />
              </View>
            </View>
            <Text style={styles.avatarName}>{firstName} {lastName}</Text>
            <Text style={styles.avatarUsername}>@{username}</Text>
            <Text style={styles.changePhotoText}>Tap to change photo</Text>
          </TouchableOpacity>

          {/* BASIC INFO */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="person-outline" size={16} color={GOLD} />
              <Text style={styles.sectionTitle}>Basic Information</Text>
            </View>

            <View style={styles.row}>
              <View style={styles.halfField}>
                <Label text="First Name" required />
                <TextInput
                  style={styles.input}
                  placeholder="First name"
                  placeholderTextColor="rgba(255,255,255,0.2)"
                  value={firstName}
                  onChangeText={setFirstName}
                  autoCorrect={false}
                  blurOnSubmit={false}
                />
              </View>
              <View style={styles.halfField}>
                <Label text="Last Name" required />
                <TextInput
                  style={styles.input}
                  placeholder="Last name"
                  placeholderTextColor="rgba(255,255,255,0.2)"
                  value={lastName}
                  onChangeText={setLastName}
                  autoCorrect={false}
                  blurOnSubmit={false}
                />
              </View>
            </View>

            <View style={styles.fieldGroup}>
              <Label text="Username" />
              <TextInput
                style={styles.input}
                placeholder="@username"
                placeholderTextColor="rgba(255,255,255,0.2)"
                value={username}
                onChangeText={setUsername}
                autoCapitalize="none"
                autoCorrect={false}
                blurOnSubmit={false}
              />
            </View>

            <View style={styles.fieldGroup}>
              <Label text="Email Address" />
              <TextInput
                style={[styles.input, styles.inputDisabled]}
                value={user?.email_address ?? ''}
                editable={false}
                placeholderTextColor="rgba(255,255,255,0.2)"
              />
            </View>

            <View style={styles.fieldGroup}>
              <Label text="Phone Number" />
              <TextInput
                style={styles.input}
                placeholder="+63 9XX XXX XXXX"
                placeholderTextColor="rgba(255,255,255,0.2)"
                value={phone}
                onChangeText={setPhone}
                keyboardType="phone-pad"
                blurOnSubmit={false}
              />
            </View>

            <View style={styles.fieldGroup}>
              <Label text="About Me" />
              <TextInput
                style={[styles.input, styles.inputMultiline]}
                placeholder="Tell clients about yourself..."
                placeholderTextColor="rgba(255,255,255,0.2)"
                value={bio}
                onChangeText={setBio}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
                blurOnSubmit={false}
                autoCorrect={false}
              />
            </View>
          </View>

          {/* SKILLS */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="code-slash-outline" size={16} color={GOLD} />
              <Text style={styles.sectionTitle}>Skills</Text>
            </View>

            <View style={styles.skillInputRow}>
              <TextInput
                style={styles.skillInput}
                placeholder="Add a skill..."
                placeholderTextColor="rgba(255,255,255,0.2)"
                value={skillInput}
                onChangeText={setSkillInput}
                onSubmitEditing={() => addSkill(skillInput)}
                returnKeyType="done"
                blurOnSubmit={false}
                autoCorrect={false}
              />
              <TouchableOpacity
                style={styles.skillAddBtn}
                onPress={() => addSkill(skillInput)}
                activeOpacity={0.8}
              >
                <Ionicons name="add" size={20} color="#0a0a0a" />
              </TouchableOpacity>
            </View>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.suggestionRow}
              keyboardShouldPersistTaps="handled"
            >
              {SKILL_SUGGESTIONS.filter((s) => !skills.includes(s)).map((s) => (
                <TouchableOpacity
                  key={s}
                  style={styles.suggestionChip}
                  onPress={() => addSkill(s)}
                  activeOpacity={0.7}
                >
                  <Ionicons name="add" size={12} color="rgba(255,255,255,0.4)" />
                  <Text style={styles.suggestionText}>{s}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {skills.length > 0 && (
              <View style={styles.skillsWrap}>
                {skills.map((skill) => (
                  <View key={skill} style={styles.skillChip}>
                    <Text style={styles.skillChipText}>{skill}</Text>
                    <TouchableOpacity
                      onPress={() => removeSkill(skill)}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    >
                      <Ionicons name="close" size={14} color={GOLD} />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            )}
          </View>

          {/* EXPERIENCE */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="briefcase-outline" size={16} color={GOLD} />
              <Text style={styles.sectionTitle}>Experience</Text>
            </View>

            <Label text="Experience Level" required />
            <View style={styles.pillRow}>
              {EXPERIENCE_LEVELS.map((level) => (
                <TouchableOpacity
                  key={level}
                  style={[styles.pill, experienceLevel === level && styles.pillActive]}
                  onPress={() => setExperienceLevel(level)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.pillText, experienceLevel === level && styles.pillTextActive]}>
                    {level}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            {!experienceLevel && (
              <Text style={styles.errorText}>Please select your experience level</Text>
            )}

            <View style={styles.fieldGroup}>
              <Label text="Years of Experience" />
              <TextInput
                style={styles.input}
                placeholder="e.g. 3"
                placeholderTextColor="rgba(255,255,255,0.2)"
                value={yearsExp}
                onChangeText={setYearsExp}
                keyboardType="numeric"
                blurOnSubmit={false}
              />
            </View>
          </View>

          {/* RATES */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="cash-outline" size={16} color={GOLD} />
              <Text style={styles.sectionTitle}>Rates</Text>
            </View>
            <View style={styles.row}>
              <View style={styles.halfField}>
                <Label text="Hourly Rate (₱)" />
                <TextInput
                  style={styles.input}
                  placeholder="e.g. 500"
                  placeholderTextColor="rgba(255,255,255,0.2)"
                  value={hourlyRate}
                  onChangeText={setHourlyRate}
                  keyboardType="numeric"
                  blurOnSubmit={false}
                />
              </View>
              <View style={styles.halfField}>
                <Label text="Fixed Rate (₱)" />
                <TextInput
                  style={styles.input}
                  placeholder="e.g. 15000"
                  placeholderTextColor="rgba(255,255,255,0.2)"
                  value={fixedRate}
                  onChangeText={setFixedRate}
                  keyboardType="numeric"
                  blurOnSubmit={false}
                />
              </View>
            </View>
          </View>

          {/* LOCATION */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="location-outline" size={16} color={GOLD} />
              <Text style={styles.sectionTitle}>Location</Text>
            </View>
            <View style={styles.row}>
              <View style={styles.halfField}>
                <Label text="City" />
                <TextInput
                  style={styles.input}
                  placeholder="e.g. Manila"
                  placeholderTextColor="rgba(255,255,255,0.2)"
                  value={city}
                  onChangeText={setCity}
                  autoCorrect={false}
                  blurOnSubmit={false}
                />
              </View>
              <View style={styles.halfField}>
                <Label text="Country" />
                <TextInput
                  style={styles.input}
                  placeholder="e.g. Philippines"
                  placeholderTextColor="rgba(255,255,255,0.2)"
                  value={country}
                  onChangeText={setCountry}
                  autoCorrect={false}
                  blurOnSubmit={false}
                />
              </View>
            </View>
          </View>

          {/* PORTFOLIO LINK */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="link-outline" size={16} color={GOLD} />
              <Text style={styles.sectionTitle}>Portfolio</Text>
            </View>

            <View style={styles.fieldGroup}>
              <Label text="Portfolio URL" />
              <View style={styles.linkInputWrap}>
                <Ionicons name="globe-outline" size={16} color="rgba(255,255,255,0.3)" style={styles.linkIcon} />
                <TextInput
                  style={styles.linkInput}
                  placeholder="https://yourportfolio.com"
                  placeholderTextColor="rgba(255,255,255,0.2)"
                  value={portfolioUrl}
                  onChangeText={setPortfolioUrl}
                  keyboardType="url"
                  autoCapitalize="none"
                  autoCorrect={false}
                  blurOnSubmit={false}
                />
              </View>
            </View>
          </View>

          {/* BOTTOM SAVE BUTTON */}
          <TouchableOpacity
            style={[styles.bottomSaveBtn, isLoading && styles.saveBtnDisabled]}
            onPress={handleSave}
            disabled={isLoading}
            activeOpacity={0.85}
          >
            {isLoading ? (
              <ActivityIndicator size="small" color="#0a0a0a" />
            ) : (
              <>
                <Ionicons name="checkmark-circle-outline" size={18} color="#0a0a0a" />
                <Text style={styles.bottomSaveBtnText}>Save Profile</Text>
              </>
            )}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Image Picker Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={imageModalVisible}
        onRequestClose={() => setImageModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Profile Picture</Text>
              <TouchableOpacity onPress={() => setImageModalVisible(false)}>
                <Ionicons name="close" size={24} color="#fff" />
              </TouchableOpacity>
            </View>

            <TouchableOpacity style={styles.modalOption} onPress={pickImage}>
              <Ionicons name="images-outline" size={24} color={GOLD} />
              <Text style={styles.modalOptionText}>Choose from Gallery</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.modalOption} onPress={takePhoto}>
              <Ionicons name="camera-outline" size={24} color={GOLD} />
              <Text style={styles.modalOptionText}>Take Photo</Text>
            </TouchableOpacity>

            {user?.profile_picture && (
              <TouchableOpacity 
                style={[styles.modalOption, styles.modalOptionDanger]} 
                onPress={handleDeleteProfilePicture}
              >
                <Ionicons name="trash-outline" size={24} color="#ff4444" />
                <Text style={[styles.modalOptionText, styles.modalOptionTextDanger]}>Delete Picture</Text>
              </TouchableOpacity>
            )}

            {uploadingImage && (
              <View style={styles.uploadingContainer}>
                <ActivityIndicator size="large" color={GOLD} />
                <Text style={styles.uploadingText}>Updating profile picture...</Text>
              </View>
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: BG },
  flex: { flex: 1 },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
    gap: 12,
  },
  backBtn: {
    width: 36, height: 36,
    borderRadius: 10,
    backgroundColor: CARD_BG,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: BORDER,
  },
  headerCenter: { flex: 1 },
  headerTitle: { fontSize: 16, fontWeight: '600', color: '#fff' },
  headerSub: { fontSize: 11, color: 'rgba(255,255,255,0.3)', marginTop: 1 },
  saveBtn: {
    paddingHorizontal: 18, paddingVertical: 8,
    backgroundColor: GOLD,
    borderRadius: 10,
    minWidth: 60,
    alignItems: 'center',
  },
  saveBtnDisabled: { opacity: 0.6 },
  saveBtnText: { fontSize: 13, fontWeight: '600', color: '#0a0a0a' },

  scroll: { paddingBottom: 60 },

  avatarSection: {
    alignItems: 'center',
    paddingVertical: 28,
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
    marginBottom: 8,
  },
  avatarWrap: { position: 'relative', marginBottom: 12 },
  avatar: {
    width: 90, height: 90,
    borderRadius: 45,
    borderWidth: 2, borderColor: GOLD,
  },
  avatarPlaceholder: {
    width: 90, height: 90,
    borderRadius: 45,
    backgroundColor: GOLD,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: GOLD,
  },
  avatarInitials: { fontSize: 32, fontWeight: '700', color: '#0a0a0a' },
  avatarEditBtn: {
    position: 'absolute', bottom: 0, right: 0,
    width: 28, height: 28,
    borderRadius: 14,
    backgroundColor: GOLD,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: BG,
  },
  avatarName: { fontSize: 18, fontWeight: '600', color: '#fff', marginBottom: 2 },
  avatarUsername: { fontSize: 13, color: 'rgba(255,255,255,0.4)' },
  changePhotoText: {
    fontSize: 12,
    color: GOLD,
    marginTop: 8,
    opacity: 0.7,
  },

  section: {
    marginHorizontal: 16,
    marginTop: 20,
    backgroundColor: CARD_BG,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1, borderColor: BORDER,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
  },
  sectionTitle: { fontSize: 14, fontWeight: '600', color: '#fff' },

  fieldGroup: { marginBottom: 14 },
  label: { fontSize: 12, fontWeight: '500', color: 'rgba(255,255,255,0.5)', marginBottom: 6 },
  labelRequired: { color: GOLD },
  input: {
    backgroundColor: INPUT_BG,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
    borderRadius: 10,
    paddingHorizontal: 14, paddingVertical: 11,
    fontSize: 14, color: '#fff',
  },
  inputMultiline: { height: 100, paddingTop: 11 },
  inputDisabled: { opacity: 0.45 },
  row: { flexDirection: 'row', gap: 12, marginBottom: 14 },
  halfField: { flex: 1 },

  skillInputRow: { flexDirection: 'row', gap: 8, marginBottom: 10 },
  skillInput: {
    flex: 1,
    backgroundColor: INPUT_BG,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
    borderRadius: 10,
    paddingHorizontal: 14, paddingVertical: 10,
    fontSize: 14, color: '#fff',
  },
  skillAddBtn: {
    width: 42, height: 42,
    borderRadius: 10,
    backgroundColor: GOLD,
    alignItems: 'center', justifyContent: 'center',
  },
  suggestionRow: { paddingBottom: 10, gap: 6 },
  suggestionChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10, paddingVertical: 6,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 999,
    borderWidth: 0.5, borderColor: 'rgba(255,255,255,0.1)',
  },
  suggestionText: { fontSize: 11, color: 'rgba(255,255,255,0.4)' },
  skillsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 4 },
  skillChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12, paddingVertical: 7,
    backgroundColor: 'rgba(212,175,55,0.1)',
    borderRadius: 999,
    borderWidth: 1, borderColor: 'rgba(212,175,55,0.3)',
  },
  skillChipText: { fontSize: 12, color: GOLD, fontWeight: '500' },

  pillRow: { flexDirection: 'row', gap: 8, marginBottom: 14, marginTop: 6 },
  pill: {
    flex: 1, paddingVertical: 9,
    borderRadius: 10,
    backgroundColor: INPUT_BG,
    alignItems: 'center',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
  },
  pillActive: {
    backgroundColor: 'rgba(212,175,55,0.12)',
    borderColor: 'rgba(212,175,55,0.4)',
  },
  pillText: { fontSize: 12, color: 'rgba(255,255,255,0.4)', fontWeight: '500' },
  pillTextActive: { color: GOLD },

  linkInputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: INPUT_BG,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
    borderRadius: 10,
    paddingHorizontal: 12,
  },
  linkIcon: { marginRight: 8 },
  linkInput: { flex: 1, paddingVertical: 11, fontSize: 14, color: '#fff' },

  bottomSaveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginHorizontal: 16,
    marginTop: 24,
    marginBottom: 20,
    paddingVertical: 15,
    backgroundColor: GOLD,
    borderRadius: 14,
  },
  bottomSaveBtnText: { fontSize: 15, fontWeight: '600', color: '#0a0a0a' },
  
  errorText: {
    fontSize: 11,
    color: '#ff4444',
    marginTop: -8,
    marginBottom: 12,
    marginLeft: 4,
  },

  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: CARD_BG,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: BORDER,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
  },
  modalOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
  },
  modalOptionDanger: {
    borderBottomWidth: 0,
  },
  modalOptionText: {
    fontSize: 16,
    color: '#fff',
  },
  modalOptionTextDanger: {
    color: '#ff4444',
  },
  uploadingContainer: {
    alignItems: 'center',
    paddingVertical: 20,
    gap: 12,
  },
  uploadingText: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.6)',
  },
});