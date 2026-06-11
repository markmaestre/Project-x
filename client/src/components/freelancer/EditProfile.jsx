import React, { useState, useCallback, useEffect } from 'react';
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
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useDispatch, useSelector } from 'react-redux';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import * as Sharing from 'expo-sharing';
import { Directory, File, Paths } from 'expo-file-system';
import { updateProfile, deleteProfilePicture } from '../../Redux/slices/authSlice';

// ── Vantara Design tokens ──────────────────────────────────────────────────────────
const NAVY       = '#071A3E';
const NAVY2      = '#0D2151';
const BLUE       = '#0055A5';
const BLUE_MD    = '#0073CF';
const BLUE_LT    = '#1E90FF';
const GOLD       = '#C89520';
const GOLD_LT    = '#E8B84B';
const GOLD_DK    = '#8A6410';
const SILVER     = '#8899B0';
const SILVER2    = '#B8C8D8';
const WHITE      = '#FFFFFF';
const BG         = '#EEF4FA';
const CARD       = '#FFFFFF';
const TEXT_MAIN  = '#071A3E';
const TEXT_MUTED = '#3A5070';
const TEXT_LIGHT = '#7A90A8';
const BORDER     = '#C8D8E8';
const GREEN      = '#059669';
const GREEN_SOFT = '#D1FAE5';
const GREEN_MID  = '#86EFAC';
const GREEN_DARK = '#059669';
// ─────────────────────────────────────────────────────────────────────────────────

const EXPERIENCE_LEVELS = ['Entry', 'Intermediate', 'Expert', 'Senior'];

const SKILL_SUGGESTIONS = [
  'React Native', 'React.js', 'Node.js', 'UI/UX Design', 'Figma',
  'Python', 'Laravel', 'WordPress', 'SEO', 'Copywriting',
  'Video Editing', 'Graphic Design', 'Social Media', 'Data Entry',
];

// Local CV directory
const CV_DIRECTORY = new Directory(Paths.document, 'cvs');

export default function FreelancerProfile({ onNavigate }) {
  const dispatch = useDispatch();
  const { user, isLoading } = useSelector((state) => state.auth);

  const [skillInput, setSkillInput] = useState('');
  const [imageModalVisible, setImageModalVisible] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadingCV, setUploadingCV] = useState(false);
  const [savedCV, setSavedCV] = useState(null);

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

  // Load locally stored CV on component mount
  useEffect(() => {
    loadLocalCV();
  }, []);

  // Load saved CV from local storage using new File API
  const loadLocalCV = async () => {
    try {
      // Check if directory exists
      if (!CV_DIRECTORY.exists) {
        setSavedCV(null);
        return;
      }
      
      // List all files in the directory
      const files = CV_DIRECTORY.list();
      
      // Filter for CV files
      const cvFiles = files.filter(file => 
        file.name.endsWith('.pdf') || 
        file.name.endsWith('.doc') || 
        file.name.endsWith('.docx')
      );
      
      if (cvFiles.length > 0) {
        const latestCV = cvFiles[0];
        setSavedCV({
          uri: latestCV.uri,
          name: latestCV.name,
          size: latestCV.size,
        });
      } else {
        setSavedCV(null);
      }
    } catch (error) {
      console.error('Error loading local CV:', error);
      setSavedCV(null);
    }
  };

  // Upload CV to local storage using new File API
  const uploadCV = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
        copyToCacheDirectory: true,
      });

      if (result.canceled) {
        return;
      }

      const document = result.assets[0];
      
      // Validate file size (max 5MB)
      if (document.size && document.size > 5 * 1024 * 1024) {
        Alert.alert('Error', 'File size must be less than 5MB');
        return;
      }

      // Validate file extension
      const fileName = document.name;
      const fileExtension = fileName.split('.').pop().toLowerCase();
      const allowedExtensions = ['pdf', 'doc', 'docx'];
      
      if (!allowedExtensions.includes(fileExtension)) {
        Alert.alert('Error', 'Please upload PDF, DOC, or DOCX files only');
        return;
      }

      setUploadingCV(true);
      
      // Create directory if it doesn't exist
      if (!CV_DIRECTORY.exists) {
        CV_DIRECTORY.create({ intermediates: true });
      }
      
      // Create unique filename with timestamp
      const timestamp = Date.now();
      const savedFileName = `cv_${timestamp}_${fileName}`;
      const newFile = new File(CV_DIRECTORY, savedFileName);
      
      // Get the source file
      const sourceFile = new File(document.uri);
      
      // Copy the selected file to app's local storage
      sourceFile.copy(newFile);
      
      // Delete old CV if exists
      if (savedCV) {
        const oldFile = new File(savedCV.uri);
        if (oldFile.exists) {
          oldFile.delete();
        }
      }
      
      setSavedCV({
        uri: newFile.uri,
        name: savedFileName,
        size: newFile.size,
      });
      
      Alert.alert('Success', 'CV saved locally on your device!');
      
    } catch (error) {
      console.error('Error uploading CV:', error);
      Alert.alert('Error', 'Failed to save CV. Please try again.');
    } finally {
      setUploadingCV(false);
    }
  };

  // Delete CV from local storage
  const handleDeleteCV = async () => {
    Alert.alert(
      'Delete CV',
      'Are you sure you want to delete your CV from this device?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setUploadingCV(true);
            try {
              if (savedCV) {
                const file = new File(savedCV.uri);
                if (file.exists) {
                  file.delete();
                }
                setSavedCV(null);
                Alert.alert('Success', 'CV deleted successfully');
              }
            } catch (error) {
              console.error('Error deleting CV:', error);
              Alert.alert('Error', 'Failed to delete CV');
            } finally {
              setUploadingCV(false);
            }
          }
        }
      ]
    );
  };

  // View CV - opens with default app using expo-sharing
  const viewCV = async () => {
    if (savedCV && savedCV.uri) {
      try {
        const file = new File(savedCV.uri);
        if (file.exists) {
          // Check if sharing is available on the device
          const isAvailable = await Sharing.isAvailableAsync();
          
          if (isAvailable) {
            // Use expo-sharing to open the file (works on both iOS and Android)
            await Sharing.shareAsync(savedCV.uri, {
              mimeType: file.type || 'application/pdf',
              dialogTitle: 'Open CV',
              UTI: 'com.adobe.pdf',
            });
          } else {
            Alert.alert('Error', 'Sharing is not available on this device');
          }
        } else {
          Alert.alert('Error', 'CV file not found. Please upload again.');
          setSavedCV(null);
        }
      } catch (error) {
        console.error('Error opening CV:', error);
        Alert.alert('Error', 'Cannot open file. Please try again.');
      }
    }
  };

  // Format file size for display
  const formatFileSize = (bytes) => {
    if (!bytes) return 'Unknown size';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

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

  // Upload profile picture (this still goes to server)
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

    try {
      const result = await dispatch(updateProfile({ profileData, profilePicture: null, cv: null }));
      
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
      <StatusBar barStyle="light-content" backgroundColor={NAVY} />
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
            <View style={styles.iconWrap}>
              <Ionicons name="arrow-back" size={18} color={WHITE} />
            </View>
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
              <ActivityIndicator size="small" color={WHITE} />
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
          {/* Avatar Section */}
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
                <Ionicons name="camera-outline" size={14} color={TEXT_MAIN} />
              </View>
            </View>
            <Text style={styles.avatarName}>{firstName} {lastName}</Text>
            <Text style={styles.avatarUsername}>@{username}</Text>
            <Text style={styles.changePhotoText}>Tap to change photo</Text>
          </TouchableOpacity>

          {/* BASIC INFO */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="person-outline" size={16} color={BLUE} />
              <Text style={styles.sectionTitle}>Basic Information</Text>
            </View>

            <View style={styles.row}>
              <View style={styles.halfField}>
                <Label text="First Name" required />
                <TextInput
                  style={styles.input}
                  placeholder="First name"
                  placeholderTextColor={TEXT_LIGHT}
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
                  placeholderTextColor={TEXT_LIGHT}
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
                placeholderTextColor={TEXT_LIGHT}
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
                placeholderTextColor={TEXT_LIGHT}
              />
            </View>

            <View style={styles.fieldGroup}>
              <Label text="Phone Number" />
              <TextInput
                style={styles.input}
                placeholder="+63 9XX XXX XXXX"
                placeholderTextColor={TEXT_LIGHT}
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
                placeholderTextColor={TEXT_LIGHT}
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
              <Ionicons name="code-slash-outline" size={16} color={BLUE} />
              <Text style={styles.sectionTitle}>Skills</Text>
            </View>

            <View style={styles.skillInputRow}>
              <TextInput
                style={styles.skillInput}
                placeholder="Add a skill..."
                placeholderTextColor={TEXT_LIGHT}
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
                <Ionicons name="add" size={20} color={WHITE} />
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
                  <Ionicons name="add" size={12} color={BLUE} />
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
                      <Ionicons name="close" size={14} color={BLUE} />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            )}
          </View>

          {/* CV UPLOAD SECTION - Local Storage Only */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="document-text-outline" size={16} color={BLUE} />
              <Text style={styles.sectionTitle}>Resume / CV</Text>
            </View>

            <View style={styles.cvContainer}>
              {savedCV ? (
                <View style={styles.cvInfoContainer}>
                  <View style={styles.cvFileInfo}>
                    <Ionicons name="document-text" size={32} color={BLUE} />
                    <View style={styles.cvFileDetails}>
                      <Text style={styles.cvFileName} numberOfLines={1}>
                        {savedCV.name}
                      </Text>
                      <Text style={styles.cvFileStatus}>
                        Saved locally • {formatFileSize(savedCV.size)}
                      </Text>
                    </View>
                  </View>
                  
                  <View style={styles.cvActions}>
                    <TouchableOpacity 
                      style={[styles.cvActionBtn, styles.cvViewBtn]} 
                      onPress={viewCV}
                      activeOpacity={0.7}
                    >
                      <Ionicons name="eye-outline" size={16} color={BLUE} />
                      <Text style={styles.cvViewBtnText}>Open</Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity 
                      style={[styles.cvActionBtn, styles.cvDeleteBtn]} 
                      onPress={handleDeleteCV}
                      activeOpacity={0.7}
                    >
                      <Ionicons name="trash-outline" size={16} color="#ff4444" />
                      <Text style={styles.cvDeleteBtnText}>Delete</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ) : (
                <View style={styles.cvUploadArea}>
                  <Ionicons name="cloud-upload-outline" size={48} color={BLUE} />
                  <Text style={styles.cvUploadTitle}>Upload your CV/Resume</Text>
                  <Text style={styles.cvUploadSubtitle}>
                    PDF, DOC, or DOCX (Max 5MB)
                  </Text>
                  <Text style={styles.cvLocalNote}>
                    File will be stored locally on your device only
                  </Text>
                  <TouchableOpacity 
                    style={styles.cvUploadBtn}
                    onPress={uploadCV}
                    disabled={uploadingCV}
                    activeOpacity={0.8}
                  >
                    {uploadingCV ? (
                      <ActivityIndicator size="small" color={TEXT_MAIN} />
                    ) : (
                      <>
                        <Ionicons name="add" size={16} color={TEXT_MAIN} />
                        <Text style={styles.cvUploadBtnText}>Choose File</Text>
                      </>
                    )}
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </View>

          {/* EXPERIENCE */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="briefcase-outline" size={16} color={BLUE} />
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
                placeholderTextColor={TEXT_LIGHT}
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
              <Ionicons name="cash-outline" size={16} color={BLUE} />
              <Text style={styles.sectionTitle}>Rates</Text>
            </View>
            <View style={styles.row}>
              <View style={styles.halfField}>
                <Label text="Hourly Rate (₱)" />
                <TextInput
                  style={styles.input}
                  placeholder="e.g. 500"
                  placeholderTextColor={TEXT_LIGHT}
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
                  placeholderTextColor={TEXT_LIGHT}
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
              <Ionicons name="location-outline" size={16} color={BLUE} />
              <Text style={styles.sectionTitle}>Location</Text>
            </View>
            <View style={styles.row}>
              <View style={styles.halfField}>
                <Label text="City" />
                <TextInput
                  style={styles.input}
                  placeholder="e.g. Manila"
                  placeholderTextColor={TEXT_LIGHT}
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
                  placeholderTextColor={TEXT_LIGHT}
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
              <Ionicons name="link-outline" size={16} color={BLUE} />
              <Text style={styles.sectionTitle}>Portfolio</Text>
            </View>

            <View style={styles.fieldGroup}>
              <Label text="Portfolio URL" />
              <View style={styles.linkInputWrap}>
                <Ionicons name="globe-outline" size={16} color={TEXT_MUTED} style={styles.linkIcon} />
                <TextInput
                  style={styles.linkInput}
                  placeholder="https://yourportfolio.com"
                  placeholderTextColor={TEXT_LIGHT}
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
              <ActivityIndicator size="small" color={WHITE} />
            ) : (
              <>
                <Ionicons name="checkmark-circle-outline" size={18} color={WHITE} />
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
                <Ionicons name="close" size={24} color={TEXT_MUTED} />
              </TouchableOpacity>
            </View>

            <TouchableOpacity style={styles.modalOption} onPress={pickImage}>
              <Ionicons name="images-outline" size={24} color={BLUE} />
              <Text style={styles.modalOptionText}>Choose from Gallery</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.modalOption} onPress={takePhoto}>
              <Ionicons name="camera-outline" size={24} color={BLUE} />
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
                <ActivityIndicator size="large" color={BLUE} />
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
    borderBottomWidth: 1.5,
    borderBottomColor: BORDER,
    gap: 12,
    backgroundColor: NAVY,
  },
  backBtn: { alignSelf: 'flex-start' },
  iconWrap: {
    width: 38, height: 38,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 11,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center', justifyContent: 'center',
  },
  headerCenter: { flex: 1 },
  headerTitle: { fontSize: 16, fontWeight: '600', color: WHITE },
  headerSub: { fontSize: 11, color: GOLD_LT, marginTop: 1 },
  saveBtn: {
    paddingHorizontal: 18, paddingVertical: 8,
    backgroundColor: GOLD,
    borderRadius: 10,
    minWidth: 60,
    alignItems: 'center',
  },
  saveBtnDisabled: { opacity: 0.6 },
  saveBtnText: { fontSize: 13, fontWeight: '600', color: NAVY },

  scroll: { paddingBottom: 60 },

  avatarSection: {
    alignItems: 'center',
    paddingVertical: 28,
    borderBottomWidth: 1.5,
    borderBottomColor: BORDER,
    marginBottom: 8,
    backgroundColor: CARD,
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
  avatarInitials: { fontSize: 32, fontWeight: '700', color: NAVY },
  avatarEditBtn: {
    position: 'absolute', bottom: 0, right: 0,
    width: 28, height: 28,
    borderRadius: 14,
    backgroundColor: CARD,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: CARD,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1, shadowRadius: 4, elevation: 2,
  },
  avatarName: { fontSize: 18, fontWeight: '600', color: TEXT_MAIN, marginBottom: 2 },
  avatarUsername: { fontSize: 13, color: TEXT_MUTED },
  changePhotoText: {
    fontSize: 12,
    color: BLUE,
    marginTop: 8,
    opacity: 0.7,
  },

  section: {
    marginHorizontal: 16,
    marginTop: 16,
    backgroundColor: CARD,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1.5, borderColor: BORDER,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04, shadowRadius: 8, elevation: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1.5,
    borderBottomColor: BORDER,
  },
  sectionTitle: { fontSize: 14, fontWeight: '600', color: TEXT_MAIN },

  fieldGroup: { marginBottom: 14 },
  label: { fontSize: 12, fontWeight: '500', color: TEXT_MUTED, marginBottom: 6 },
  labelRequired: { color: BLUE },
  input: {
    backgroundColor: BG,
    borderWidth: 1.5, borderColor: BORDER,
    borderRadius: 10,
    paddingHorizontal: 14, paddingVertical: 11,
    fontSize: 14, color: TEXT_MAIN,
  },
  inputMultiline: { height: 100, paddingTop: 11 },
  inputDisabled: { opacity: 0.45 },
  row: { flexDirection: 'row', gap: 12, marginBottom: 14 },
  halfField: { flex: 1 },

  skillInputRow: { flexDirection: 'row', gap: 8, marginBottom: 10 },
  skillInput: {
    flex: 1,
    backgroundColor: BG,
    borderWidth: 1.5, borderColor: BORDER,
    borderRadius: 10,
    paddingHorizontal: 14, paddingVertical: 10,
    fontSize: 14, color: TEXT_MAIN,
  },
  skillAddBtn: {
    width: 42, height: 42,
    borderRadius: 10,
    backgroundColor: BLUE,
    alignItems: 'center', justifyContent: 'center',
  },
  suggestionRow: { paddingBottom: 10, gap: 6 },
  suggestionChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10, paddingVertical: 6,
    backgroundColor: BG,
    borderRadius: 999,
    borderWidth: 0.5, borderColor: BORDER,
  },
  suggestionText: { fontSize: 11, color: BLUE },
  skillsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 4 },
  skillChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12, paddingVertical: 7,
    backgroundColor: 'rgba(0,104,181,0.08)',
    borderRadius: 999,
    borderWidth: 1.5, borderColor: 'rgba(0,104,181,0.2)',
  },
  skillChipText: { fontSize: 12, color: BLUE, fontWeight: '500' },

  pillRow: { flexDirection: 'row', gap: 8, marginBottom: 14, marginTop: 6 },
  pill: {
    flex: 1, paddingVertical: 9,
    borderRadius: 10,
    backgroundColor: BG,
    alignItems: 'center',
    borderWidth: 1.5, borderColor: BORDER,
  },
  pillActive: {
    backgroundColor: 'rgba(0,104,181,0.08)',
    borderColor: BLUE,
  },
  pillText: { fontSize: 12, color: TEXT_MUTED, fontWeight: '500' },
  pillTextActive: { color: BLUE },

  linkInputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: BG,
    borderWidth: 1.5, borderColor: BORDER,
    borderRadius: 10,
    paddingHorizontal: 12,
  },
  linkIcon: { marginRight: 8 },
  linkInput: { flex: 1, paddingVertical: 11, fontSize: 14, color: TEXT_MAIN },

  bottomSaveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginHorizontal: 16,
    marginTop: 24,
    marginBottom: 20,
    paddingVertical: 15,
    backgroundColor: BLUE,
    borderRadius: 14,
    shadowColor: BLUE, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.28, shadowRadius: 20, elevation: 3,
  },
  bottomSaveBtnText: { fontSize: 15, fontWeight: '600', color: WHITE },
  
  errorText: {
    fontSize: 11,
    color: '#ff4444',
    marginTop: -8,
    marginBottom: 12,
    marginLeft: 4,
  },

  // CV Styles
  cvContainer: {
    marginTop: 4,
  },
  cvUploadArea: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 24,
    paddingHorizontal: 20,
    backgroundColor: BG,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: BORDER,
    borderStyle: 'dashed',
  },
  cvUploadTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: TEXT_MAIN,
    marginTop: 12,
    marginBottom: 4,
  },
  cvUploadSubtitle: {
    fontSize: 12,
    color: TEXT_MUTED,
    marginBottom: 8,
  },
  cvLocalNote: {
    fontSize: 10,
    color: BLUE,
    marginBottom: 16,
    fontStyle: 'italic',
  },
  cvUploadBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(0,104,181,0.08)',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: 'rgba(0,104,181,0.2)',
  },
  cvUploadBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: BLUE,
  },
  cvInfoContainer: {
    backgroundColor: BG,
    borderRadius: 12,
    padding: 12,
    borderWidth: 1.5,
    borderColor: BORDER,
  },
  cvFileInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  cvFileDetails: {
    flex: 1,
  },
  cvFileName: {
    fontSize: 13,
    fontWeight: '500',
    color: TEXT_MAIN,
    marginBottom: 2,
  },
  cvFileStatus: {
    fontSize: 10,
    color: BLUE,
  },
  cvActions: {
    flexDirection: 'row',
    gap: 10,
    borderTopWidth: 1.5,
    borderTopColor: BORDER,
    paddingTop: 12,
  },
  cvActionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
    borderRadius: 8,
  },
  cvViewBtn: {
    backgroundColor: 'rgba(0,104,181,0.08)',
    borderWidth: 1.5,
    borderColor: 'rgba(0,104,181,0.2)',
  },
  cvViewBtnText: {
    fontSize: 12,
    fontWeight: '500',
    color: BLUE,
  },
  cvDeleteBtn: {
    backgroundColor: '#ff444415',
    borderWidth: 1.5,
    borderColor: '#ff444430',
  },
  cvDeleteBtnText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#ff4444',
  },

  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(7,26,62,0.55)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: CARD,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    borderTopWidth: 1.5,
    borderTopColor: BORDER,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingBottom: 15,
    borderBottomWidth: 1.5,
    borderBottomColor: BORDER,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: TEXT_MAIN,
  },
  modalOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    gap: 12,
    borderBottomWidth: 1.5,
    borderBottomColor: BORDER,
  },
  modalOptionDanger: {
    borderBottomWidth: 0,
  },
  modalOptionText: {
    fontSize: 16,
    color: TEXT_MAIN,
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
    color: TEXT_MUTED,
  },
});