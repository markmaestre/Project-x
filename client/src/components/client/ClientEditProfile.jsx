import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Image,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useDispatch, useSelector } from 'react-redux';
import { updateProfile, deleteProfilePicture } from '../../Redux/slices/authSlice';

// ── Vantara Design tokens (same as ClientProfile) ──────────────────────────────
const NAVY       = '#071A3E';
const BLUE       = '#0055A5';
const GOLD       = '#C89520';
const WHITE      = '#FFFFFF';
const BG         = '#EEF4FA';
const CARD       = '#FFFFFF';
const TEXT_MAIN  = '#071A3E';
const TEXT_MUTED = '#3A5070';
const TEXT_LIGHT = '#7A90A8';
const BORDER     = '#C8D8E8';
const RED        = '#DC2626';
const RED_SOFT   = '#FEF2F2';
const RED_BORDER = '#FECACA';
// ─────────────────────────────────────────────────────────────────────────────

const BUSINESS_TYPES = ['Sole Proprietorship', 'Partnership', 'Corporation', 'Startup', 'Non-Profit', 'Other'];
const BUDGET_RANGES  = ['Under $500', '$500 - $1,000', '$1,000 - $5,000', '$5,000 - $10,000', '$10,000+'];
const COMM_METHODS   = ['Email', 'Phone Call', 'Message / Chat', 'Video Call'];

export default function ClientEditProfile({ onNavigate }) {
  const dispatch = useDispatch();
  const { user, isLoading } = useSelector((s) => s.auth);

  const [form, setForm] = useState({
    first_name: user?.first_name || '',
    last_name: user?.last_name || '',
    email_address: user?.email_address || '',
    phone_number: user?.phone_number || '',
    city: user?.city || '',
    country: user?.country || '',
    website: user?.website || '',
    company_name: user?.company_name || '',
    business_type: user?.business_type || '',
    industry: user?.industry || '',
    budget_range: user?.budget_range || '',
    bio_about: user?.bio_about || '',
    preferred_communication_method: user?.preferred_communication_method || '',
  });

  const [newProfilePicture, setNewProfilePicture] = useState(null); // { uri, type, fileName }
  const [saving, setSaving] = useState(false);
  const [removingPicture, setRemovingPicture] = useState(false);

  const updateField = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  const getInitials = () => {
    const f = form.first_name?.[0] || '';
    const l = form.last_name?.[0] || '';
    return `${f}${l}`.toUpperCase() || '?';
  };

  // ── Image picking ─────────────────────────────────────────────────────────
  const handlePickImage = async () => {
    try {
      const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!perm.granted) {
        Alert.alert('Permission needed', 'Please allow access to your photos to change your profile picture.');
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });
      if (!result.canceled && result.assets?.length) {
        const asset = result.assets[0];
        setNewProfilePicture({
          uri: asset.uri,
          type: asset.mimeType || 'image/jpeg',
          fileName: asset.fileName || `profile_${Date.now()}.jpg`,
        });
      }
    } catch (e) {
      Alert.alert('Error', 'Could not open photo library.');
    }
  };

  const handleRemovePicture = () => {
    Alert.alert('Remove Photo', 'Remove your current profile picture?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: async () => {
          setRemovingPicture(true);
          try {
            await dispatch(deleteProfilePicture()).unwrap();
            setNewProfilePicture(null);
          } catch (err) {
            Alert.alert('Error', err?.message || 'Failed to remove profile picture.');
          } finally {
            setRemovingPicture(false);
          }
        },
      },
    ]);
  };

  // ── Validation ───────────────────────────────────────────────────────────
  const validate = () => {
    if (!form.first_name.trim() || !form.last_name.trim()) {
      Alert.alert('Missing info', 'First and last name are required.');
      return false;
    }
    if (!form.email_address.trim()) {
      Alert.alert('Missing info', 'Email address is required.');
      return false;
    }
    return true;
  };

  // ── Save ─────────────────────────────────────────────────────────────────
  const handleSave = async () => {
    if (!validate()) return;
    setSaving(true);
    try {
      await dispatch(updateProfile({ profileData: form, profilePicture: newProfilePicture })).unwrap();
      Alert.alert('Success', 'Your profile has been updated.', [
        { text: 'OK', onPress: () => onNavigate('ClientProfile') },
      ]);
    } catch (err) {
      Alert.alert('Error', err?.message || 'Failed to update profile. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => onNavigate('ClientProfile');

  const avatarUri = newProfilePicture?.uri || user?.profile_picture;

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <View style={s.root}>
      <SafeAreaView style={s.safe} edges={['top']}>

        {/* ── Top bar ── */}
        <View style={s.topbar}>
          <TouchableOpacity onPress={handleCancel} activeOpacity={0.7} style={s.topbarBtn}>
            <Text style={s.topbarBtnText}>Cancel</Text>
          </TouchableOpacity>
          <Text style={s.topbarTitle}>Edit Profile</Text>
          <TouchableOpacity onPress={handleSave} activeOpacity={0.7} style={s.topbarBtn} disabled={saving || isLoading}>
            {saving ? (
              <ActivityIndicator size="small" color={GOLD} />
            ) : (
              <Text style={[s.topbarBtnText, s.topbarSaveText]}>Save</Text>
            )}
          </TouchableOpacity>
        </View>

        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={s.scroll}
            keyboardShouldPersistTaps="handled"
          >
            {/* ── Avatar ── */}
            <View style={s.avatarSection}>
              <TouchableOpacity onPress={handlePickImage} activeOpacity={0.8} style={s.avatarWrap}>
                {avatarUri ? (
                  <Image source={{ uri: avatarUri }} style={s.avatarImg} />
                ) : (
                  <View style={s.avatarPlaceholder}>
                    <Text style={s.avatarInitials}>{getInitials()}</Text>
                  </View>
                )}
                <View style={s.avatarEditBadge}>
                  <Ionicons name="camera" size={14} color={WHITE} />
                </View>
              </TouchableOpacity>

              <View style={s.avatarActions}>
                <TouchableOpacity onPress={handlePickImage} activeOpacity={0.7}>
                  <Text style={s.avatarActionText}>Change Photo</Text>
                </TouchableOpacity>
                {avatarUri ? (
                  <>
                    <Text style={s.avatarActionDivider}>·</Text>
                    <TouchableOpacity onPress={handleRemovePicture} activeOpacity={0.7} disabled={removingPicture}>
                      {removingPicture ? (
                        <ActivityIndicator size="small" color={RED} />
                      ) : (
                        <Text style={[s.avatarActionText, s.avatarActionRemove]}>Remove</Text>
                      )}
                    </TouchableOpacity>
                  </>
                ) : null}
              </View>
            </View>

            {/* ── Personal Information ── */}
            <Section title="Personal Information">
              <Row>
                <Field label="First Name" value={form.first_name} onChangeText={(v) => updateField('first_name', v)} placeholder="Juan" half />
                <Field label="Last Name" value={form.last_name} onChangeText={(v) => updateField('last_name', v)} placeholder="Dela Cruz" half />
              </Row>
              <Field
                label="Email Address"
                value={form.email_address}
                onChangeText={(v) => updateField('email_address', v)}
                placeholder="you@example.com"
                keyboardType="email-address"
                autoCapitalize="none"
              />
              <Field
                label="Phone Number"
                value={form.phone_number}
                onChangeText={(v) => updateField('phone_number', v)}
                placeholder="+63 900 000 0000"
                keyboardType="phone-pad"
              />
            </Section>

            {/* ── Location ── */}
            <Section title="Location">
              <Row>
                <Field label="City" value={form.city} onChangeText={(v) => updateField('city', v)} placeholder="Quezon City" half />
                <Field label="Country" value={form.country} onChangeText={(v) => updateField('country', v)} placeholder="Philippines" half />
              </Row>
            </Section>

            {/* ── Company Information ── */}
            <Section title="Company Information">
              <Field
                label="Company Name"
                value={form.company_name}
                onChangeText={(v) => updateField('company_name', v)}
                placeholder="Your company"
              />
              <Field
                label="Website"
                value={form.website}
                onChangeText={(v) => updateField('website', v)}
                placeholder="https://yourcompany.com"
                keyboardType="url"
                autoCapitalize="none"
              />
              <Field
                label="Industry"
                value={form.industry}
                onChangeText={(v) => updateField('industry', v)}
                placeholder="e.g. E-commerce, Tech, Retail"
              />

              <Text style={s.fieldLabel}>Business Type</Text>
              <ChipGroup
                options={BUSINESS_TYPES}
                selected={form.business_type}
                onSelect={(v) => updateField('business_type', v)}
              />

              <Text style={[s.fieldLabel, { marginTop: 14 }]}>Budget Range</Text>
              <ChipGroup
                options={BUDGET_RANGES}
                selected={form.budget_range}
                onSelect={(v) => updateField('budget_range', v)}
              />
            </Section>

            {/* ── About ── */}
            <Section title="About">
              <TextInput
                style={s.textarea}
                value={form.bio_about}
                onChangeText={(v) => updateField('bio_about', v)}
                placeholder="Tell freelancers a bit about you or your business..."
                placeholderTextColor={TEXT_LIGHT}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
            </Section>

            {/* ── Preferences ── */}
            <Section title="Preferences" last>
              <Text style={s.fieldLabel}>Preferred Communication Method</Text>
              <ChipGroup
                options={COMM_METHODS}
                selected={form.preferred_communication_method}
                onSelect={(v) => updateField('preferred_communication_method', v)}
              />
            </Section>

            {/* ── Save button (bottom, mirrors top Save) ── */}
            <TouchableOpacity
              style={[s.saveBtn, (saving || isLoading) && s.saveBtnDisabled]}
              onPress={handleSave}
              activeOpacity={0.85}
              disabled={saving || isLoading}
            >
              {saving ? (
                <ActivityIndicator size="small" color={WHITE} />
              ) : (
                <>
                  <Ionicons name="checkmark-circle-outline" size={18} color={WHITE} />
                  <Text style={s.saveBtnText}>Save Changes</Text>
                </>
              )}
            </TouchableOpacity>

            <View style={{ height: 24 }} />
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

// ─── Section wrapper ─────────────────────────────────────────────────────────
function Section({ title, children, last }) {
  return (
    <View style={[s.section, last && { marginBottom: 0 }]}>
      <Text style={s.sectionTitle}>{title}</Text>
      {children}
    </View>
  );
}

// ─── Row wrapper (for side-by-side fields) ────────────────────────────────────
function Row({ children }) {
  return <View style={s.row}>{children}</View>;
}

// ─── Field input ───────────────────────────────────────────────────────────
function Field({ label, half, ...inputProps }) {
  return (
    <View style={[s.fieldWrap, half && { flex: 1 }]}>
      <Text style={s.fieldLabel}>{label}</Text>
      <TextInput
        style={s.input}
        placeholderTextColor={TEXT_LIGHT}
        {...inputProps}
      />
    </View>
  );
}

// ─── Chip selector group ──────────────────────────────────────────────────────
function ChipGroup({ options, selected, onSelect }) {
  return (
    <View style={s.chipWrap}>
      {options.map((opt) => {
        const active = selected === opt;
        return (
          <TouchableOpacity
            key={opt}
            style={[s.chip, active && s.chipActive]}
            onPress={() => onSelect(active ? '' : opt)}
            activeOpacity={0.7}
          >
            <Text style={[s.chipText, active && s.chipTextActive]}>{opt}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  root: { flex: 1 },
  safe: { flex: 1, backgroundColor: BG },

  // Top bar
  topbar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 12, paddingVertical: 13,
    backgroundColor: NAVY,
  },
  topbarTitle: { fontSize: 15, fontWeight: '600', color: WHITE },
  topbarBtn: { paddingHorizontal: 8, paddingVertical: 6, minWidth: 56, alignItems: 'center' },
  topbarBtnText: { fontSize: 14, color: 'rgba(255,255,255,0.8)', fontWeight: '500' },
  topbarSaveText: { color: GOLD, fontWeight: '700' },

  scroll: { paddingBottom: 24 },

  // Avatar
  avatarSection: { alignItems: 'center', paddingVertical: 24, backgroundColor: CARD, borderBottomWidth: 1.5, borderBottomColor: BORDER },
  avatarWrap: { position: 'relative' },
  avatarImg: { width: 96, height: 96, borderRadius: 48 },
  avatarPlaceholder: {
    width: 96, height: 96, borderRadius: 48,
    backgroundColor: BLUE, alignItems: 'center', justifyContent: 'center',
  },
  avatarInitials: { fontSize: 30, fontWeight: '700', color: WHITE },
  avatarEditBadge: {
    position: 'absolute', bottom: 0, right: 0,
    width: 30, height: 30, borderRadius: 15,
    backgroundColor: BLUE, alignItems: 'center', justifyContent: 'center',
    borderWidth: 2.5, borderColor: CARD,
  },
  avatarActions: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 14 },
  avatarActionText: { fontSize: 13, fontWeight: '600', color: BLUE },
  avatarActionRemove: { color: RED },
  avatarActionDivider: { fontSize: 13, color: TEXT_LIGHT },

  // Section
  section: {
    backgroundColor: CARD, marginTop: 10,
    paddingHorizontal: 16, paddingVertical: 16,
  },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: TEXT_MAIN, marginBottom: 12 },

  row: { flexDirection: 'row', gap: 12 },

  // Field
  fieldWrap: { marginBottom: 14 },
  fieldLabel: { fontSize: 12, fontWeight: '600', color: TEXT_MUTED, marginBottom: 6 },
  input: {
    backgroundColor: BG,
    borderWidth: 1.5, borderColor: BORDER, borderRadius: 10,
    paddingHorizontal: 12, paddingVertical: 11,
    fontSize: 14, color: TEXT_MAIN,
  },
  textarea: {
    backgroundColor: BG,
    borderWidth: 1.5, borderColor: BORDER, borderRadius: 10,
    paddingHorizontal: 12, paddingVertical: 11,
    fontSize: 14, color: TEXT_MAIN,
    minHeight: 96,
  },

  // Chips
  chipWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    paddingHorizontal: 12, paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: BG, borderWidth: 1.5, borderColor: BORDER,
  },
  chipActive: { backgroundColor: BLUE, borderColor: BLUE },
  chipText: { fontSize: 12.5, fontWeight: '600', color: TEXT_MUTED },
  chipTextActive: { color: WHITE },

  // Save button (bottom)
  saveBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, marginTop: 18, marginHorizontal: 16,
    backgroundColor: BLUE, borderRadius: 12, paddingVertical: 14,
    shadowColor: BLUE, shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2, shadowRadius: 6, elevation: 2,
  },
  saveBtnDisabled: { opacity: 0.6 },
  saveBtnText: { fontSize: 15, fontWeight: '700', color: WHITE },
});