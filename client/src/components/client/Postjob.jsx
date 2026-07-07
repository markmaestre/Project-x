// PostJobScreen.js - Full working version with Philippine provinces and cities

import React, { useState, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  ScrollView, TextInput, Alert, ActivityIndicator,
  Switch, BackHandler, Platform, Modal, FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useDispatch, useSelector } from 'react-redux';
import { createJob, clearJobSuccess } from '../../Redux/slices/jobSlice';
import DateTimePicker from '@react-native-community/datetimepicker';

// ── Design Tokens ─────────────────────────────────────────────────────────────
const NAVY       = '#071A3E';
const NAVY2      = '#0D2151';
const BLUE       = '#0055A5';
const BLUE_MD    = '#0073CF';
const BLUE_LT    = '#1E90FF';
const GOLD       = '#C89520';
const GOLD_LT    = '#E8B84B';
const GOLD_DK    = '#8A6410';
const WHITE      = '#FFFFFF';
const BG         = '#F0F4FA';
const CARD       = '#FFFFFF';
const TEXT_MAIN  = '#071A3E';
const TEXT_MUTED = '#3A5070';
const TEXT_LIGHT = '#7A90A8';
const BORDER     = '#C8D8E8';
const GREEN      = '#059669';
const GREEN_SOFT = '#D1FAE5';
const GREEN_MID  = '#86EFAC';
const GREEN_DARK = '#059669';

// ── Constants ──────────────────────────────────────────────────────────────────
const TABS = [
  { key: 'Home',          label: 'Home',     icon: 'home',          iconOutline: 'home-outline'          },
  { key: 'Hiredtalents',  label: 'Hired',    icon: 'people',        iconOutline: 'people-outline'        },
  { key: 'PostJob',       label: 'Post Job', icon: 'add-circle',    iconOutline: 'add-circle-outline'    },
  { key: 'Message',       label: 'Messages', icon: 'chatbubble',    iconOutline: 'chatbubble-outline'    },
  { key: 'ClientProfile', label: 'Profile',  icon: 'person',        iconOutline: 'person-outline'        },
];

const JOB_TYPES = [
  { label: 'Full Time',   value: 'full_time',   icon: 'briefcase-outline'      },
  { label: 'Part Time',   value: 'part_time',   icon: 'time-outline'           },
  { label: 'Project',     value: 'project',     icon: 'document-text-outline'  },
  { label: 'One Time',    value: 'one_time',    icon: 'flash-outline'          },
  { label: 'Long Term',   value: 'long_term',   icon: 'infinite-outline'       },
];

const WORK_SETUPS = [
  { label: 'Remote', value: 'remote', icon: 'wifi-outline'          },
  { label: 'Onsite', value: 'onsite', icon: 'business-outline'      },
  { label: 'Hybrid', value: 'hybrid', icon: 'phone-portrait-outline'},
];

const EXPERIENCE_LEVELS = [
  { label: 'Entry',        value: 'entry',        icon: 'star-outline'     },
  { label: 'Intermediate', value: 'intermediate', icon: 'star-half-outline'},
  { label: 'Expert',       value: 'expert',       icon: 'star-outline'     },
  { label: 'Senior',       value: 'senior',       icon: 'trophy-outline'   },
];

const BUDGET_TYPES = [
  { label: 'Fixed Price', value: 'fixed',  icon: 'cash-outline' },
  { label: 'Hourly Rate', value: 'hourly', icon: 'time-outline' },
];

const CURRENCIES = [
  { label: 'PHP', value: 'PHP', symbol: '₱' },
  { label: 'USD', value: 'USD', symbol: '$' },
  { label: 'EUR', value: 'EUR', symbol: '€' },
  { label: 'GBP', value: 'GBP', symbol: '£' },
];

const CONTACT_PREFERENCES = [
  { label: 'Chat',  value: 'chat',  icon: 'chatbubble-outline' },
  { label: 'Email', value: 'email', icon: 'mail-outline'       },
  { label: 'Phone', value: 'phone', icon: 'call-outline'       },
];

const DEGREE_LEVELS = [
  { label: 'None',        value: 'none'        },
  { label: 'High School', value: 'high_school' },
  { label: 'Vocational',  value: 'vocational'  },
  { label: 'College',     value: 'college'     },
  { label: 'Masters',     value: 'masters'     },
  { label: 'Doctorate',   value: 'doctorate'   },
];

const DURATION_UNITS = [
  { label: 'Hours', value: 'hours' },
  { label: 'Days',  value: 'days'  },
  { label: 'Weeks', value: 'weeks' },
  { label: 'Months', value: 'months' },
];

const SUGGESTED_TITLES = [
  'Senior React Native Developer',
  'Full Stack Developer',
  'UI/UX Designer',
  'Mobile App Developer',
  'Web Developer',
  'Data Analyst',
  'Project Manager',
  'Product Designer',
  'DevOps Engineer',
  'Quality Assurance Tester',
  'Backend Developer',
  'Frontend Developer',
  'iOS Developer',
  'Android Developer',
  'Machine Learning Engineer',
  'Cloud Architect',
  'Business Analyst',
  'Content Writer',
  'Digital Marketing Specialist',
  'Sales Representative',
];

const SUGGESTED_CATEGORIES = [
  'Technology',
  'Design',
  'Marketing',
  'Business',
  'Finance',
  'Healthcare',
  'Education',
  'Engineering',
  'Sales',
  'Customer Service',
  'Human Resources',
  'Legal',
  'Media',
  'Real Estate',
  'Consulting',
];

const SKILLS_SUGGESTIONS = [
  'React Native', 'JavaScript', 'Python', 'UI/UX Design',
  'Figma', 'Node.js', 'MongoDB', 'Firebase',
  'Swift', 'Kotlin', 'Flutter', 'PHP', 'Laravel',
  'AWS', 'Docker', 'GraphQL', 'TypeScript',
];

// ── Philippine Provinces ──────────────────────────────────────────────────────
const PHILIPPINE_PROVINCES = [
  'Abra', 'Agusan del Norte', 'Agusan del Sur', 'Aklan', 'Albay',
  'Antique', 'Apayao', 'Aurora', 'Basilan', 'Bataan',
  'Batanes', 'Batangas', 'Benguet', 'Biliran', 'Bohol',
  'Bukidnon', 'Bulacan', 'Cagayan', 'Camarines Norte', 'Camarines Sur',
  'Camiguin', 'Capiz', 'Catanduanes', 'Cavite', 'Cebu',
  'Cotabato', 'Davao de Oro', 'Davao del Norte', 'Davao del Sur', 'Davao Occidental',
  'Davao Oriental', 'Dinagat Islands', 'Eastern Samar', 'Guimaras', 'Ifugao',
  'Ilocos Norte', 'Ilocos Sur', 'Iloilo', 'Isabela', 'Kalinga',
  'La Union', 'Laguna', 'Lanao del Norte', 'Lanao del Sur', 'Leyte',
  'Maguindanao', 'Marinduque', 'Masbate', 'Metro Manila', 'Misamis Occidental',
  'Misamis Oriental', 'Mountain Province', 'Negros Occidental', 'Negros Oriental', 'Northern Samar',
  'Nueva Ecija', 'Nueva Vizcaya', 'Occidental Mindoro', 'Oriental Mindoro', 'Palawan',
  'Pampanga', 'Pangasinan', 'Quezon', 'Quirino', 'Rizal',
  'Romblon', 'Samar', 'Sarangani', 'Siquijor', 'Sorsogon',
  'South Cotabato', 'Southern Leyte', 'Sultan Kudarat', 'Sulu', 'Surigao del Norte',
  'Surigao del Sur', 'Tarlac', 'Tawi-Tawi', 'Zambales', 'Zamboanga del Norte',
  'Zamboanga del Sur', 'Zamboanga Sibugay',
];

// ── Philippine Cities (Major) ────────────────────────────────────────────────
const PHILIPPINE_CITIES = [
  'Manila', 'Quezon City', 'Caloocan', 'Davao City', 'Cebu City',
  'Zamboanga City', 'Taguig', 'Antipolo', 'Pasig', 'Cagayan de Oro',
  'Parañaque', 'Makati', 'Bacolod', 'Muntinlupa', 'Marikina',
  'Iloilo City', 'Pasay', 'Mandaluyong', 'Angeles City', 'San Jose del Monte',
  'Baguio', 'Lapu-Lapu City', 'Iligan', 'Mandaue', 'Butuan',
  'Tacloban', 'Dumaguete', 'Puerto Princesa', 'Naga', 'Ormoc',
  'Tarlac City', 'General Santos', 'Pagadian', 'Cabanatuan', 'Cagayan de Oro',
  'Dipolog', 'Ozamiz', 'Surigao City', 'Cotabato City', 'Kidapawan',
  'Koronadal', 'Digos', 'Tagum', 'Panabo', 'Gingoog',
  'Tangub', 'Oroquieta', 'Olongapo', 'Malaybalay', 'Valencia',
  'San Pablo', 'Biñan', 'Santa Rosa', 'Calamba', 'Cabuyao',
  'Bacoor', 'Imus', 'Dasmariñas', 'General Trias', 'Trece Martires',
  'Tanauan', 'Lipa', 'Batangas City', 'Lucena', 'Sorsogon City',
  'Legazpi', 'Tabaco', 'Naga City', 'Iriga', 'Masbate City',
  'Kalibo', 'Roxas City', 'Iloilo City', 'San Carlos', 'Bago',
  'Cadiz', 'Sagay', 'La Carlota', 'Himamaylan', 'Kabankalan',
  'Bayawan', 'Tanjay', 'Bais', 'Dumaguete', 'Canlaon',
];

const STEPS = [
  { key: 1, label: 'Job Details',   icon: 'document-text-outline' },
  { key: 2, label: 'Requirements',  icon: 'settings-outline'      },
  { key: 3, label: 'Review & Post', icon: 'checkmark-circle-outline' },
];

// ── Selection Modal Component ──────────────────────────────────────────────────
function SelectionModal({ 
  visible, 
  onClose, 
  onSelect, 
  data, 
  title, 
  searchPlaceholder,
  selectedValue,
  allowCustom = true,
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredData, setFilteredData] = useState(data);

  useEffect(() => {
    if (visible) {
      setSearchQuery('');
      setFilteredData(data);
    }
  }, [visible, data]);

  const handleSearch = (text) => {
    setSearchQuery(text);
    if (text.trim()) {
      const filtered = data.filter(item => 
        item.toLowerCase().includes(text.toLowerCase())
      );
      setFilteredData(filtered);
    } else {
      setFilteredData(data);
    }
  };

  const handleSelectItem = (item) => {
    onSelect(item);
    onClose();
  };

  const handleUseCustom = () => {
    if (searchQuery.trim()) {
      onSelect(searchQuery.trim());
      onClose();
    }
  };

  const renderItem = ({ item }) => (
    <TouchableOpacity 
      style={[
        s.selectionItem,
        item === selectedValue && s.selectionItemActive
      ]}
      onPress={() => handleSelectItem(item)}
    >
      <Text style={[
        s.selectionItemText,
        item === selectedValue && s.selectionItemTextActive
      ]}>
        {item}
      </Text>
      {item === selectedValue && (
        <Ionicons name="checkmark-circle" size={20} color={BLUE} />
      )}
    </TouchableOpacity>
  );

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <TouchableOpacity 
        style={s.selectionOverlay} 
        activeOpacity={1} 
        onPress={onClose}
      >
        <View style={s.selectionContainer}>
          <View style={s.selectionHeader}>
            <Text style={s.selectionTitle}>{title}</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color={TEXT_MUTED} />
            </TouchableOpacity>
          </View>
          
          <View style={s.selectionSearchBar}>
            <Ionicons name="search-outline" size={20} color={TEXT_LIGHT} />
            <TextInput
              style={s.selectionSearchInput}
              placeholder={searchPlaceholder}
              placeholderTextColor={TEXT_LIGHT}
              value={searchQuery}
              onChangeText={handleSearch}
              autoFocus={true}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => handleSearch('')}>
                <Ionicons name="close-circle" size={18} color={TEXT_LIGHT} />
              </TouchableOpacity>
            )}
          </View>

          {allowCustom && searchQuery.trim().length > 0 && filteredData.length === 0 && (
            <TouchableOpacity 
              style={s.selectionCustomOption}
              onPress={handleUseCustom}
            >
              <Ionicons name="create-outline" size={20} color={BLUE} />
              <Text style={s.selectionCustomText}>
                Type: "{searchQuery.trim()}"
              </Text>
              <View style={s.selectionCustomBadge}>
                <Text style={s.selectionCustomBadgeText}>Custom</Text>
              </View>
            </TouchableOpacity>
          )}

          {allowCustom && searchQuery.trim().length > 0 && filteredData.length > 0 && (
            <TouchableOpacity 
              style={s.selectionCustomOption}
              onPress={handleUseCustom}
            >
              <Ionicons name="create-outline" size={20} color={BLUE} />
              <Text style={s.selectionCustomText}>
                Type: "{searchQuery.trim()}"
              </Text>
              <View style={s.selectionCustomBadge}>
                <Text style={s.selectionCustomBadgeText}>Custom</Text>
              </View>
            </TouchableOpacity>
          )}

          <FlatList
            data={filteredData}
            keyExtractor={(item, index) => index.toString()}
            renderItem={renderItem}
            contentContainerStyle={s.selectionList}
            showsVerticalScrollIndicator={true}
            ListEmptyComponent={
              !searchQuery.trim() ? (
                <View style={s.selectionEmpty}>
                  <Ionicons name="search-outline" size={40} color={TEXT_LIGHT} />
                  <Text style={s.selectionEmptyText}>Type to search</Text>
                  <Text style={s.selectionEmptySub}>Or type your own value</Text>
                </View>
              ) : (
                <View style={s.selectionEmpty}>
                  <Ionicons name="create-outline" size={40} color={TEXT_LIGHT} />
                  <Text style={s.selectionEmptyText}>No matches found</Text>
                  <Text style={s.selectionEmptySub}>Type your own value above</Text>
                </View>
              )
            }
          />

          <TouchableOpacity style={s.selectionCloseBtn} onPress={onClose}>
            <Text style={s.selectionCloseBtnText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </Modal>
  );
}

// ── Step Progress Bar ─────────────────────────────────────────────────────────
function StepBar({ currentStep }) {
  return (
    <View style={sb.container}>
      {STEPS.map((step, idx) => {
        const done    = currentStep > step.key;
        const active  = currentStep === step.key;
        return (
          <React.Fragment key={step.key}>
            <View style={sb.stepWrap}>
              <View style={[
                sb.circle,
                active && sb.circleActive,
                done   && sb.circleDone,
              ]}>
                {done
                  ? <Ionicons name="checkmark" size={14} color={WHITE} />
                  : <Text style={[sb.num, active && sb.numActive, done && sb.numDone]}>
                      {step.key}
                    </Text>
                }
              </View>
              <Text style={[sb.label, active && sb.labelActive, done && sb.labelDone]}>
                {step.label}
              </Text>
            </View>
            {idx < STEPS.length - 1 && (
              <View style={[sb.line, done && sb.lineDone]} />
            )}
          </React.Fragment>
        );
      })}
    </View>
  );
}

const sb = StyleSheet.create({
  container: {
    flexDirection: 'row', alignItems: 'flex-start',
    paddingHorizontal: 20, paddingVertical: 16,
    backgroundColor: WHITE,
    borderBottomWidth: 1, borderBottomColor: BORDER,
  },
  stepWrap: { alignItems: 'center', gap: 6, width: 72 },
  circle: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: BG, borderWidth: 2, borderColor: BORDER,
    alignItems: 'center', justifyContent: 'center',
  },
  circleActive: { borderColor: BLUE, backgroundColor: BLUE },
  circleDone:   { borderColor: GREEN, backgroundColor: GREEN },
  num:      { fontSize: 13, fontWeight: '700', color: TEXT_LIGHT },
  numActive:{ color: WHITE },
  numDone:  { color: WHITE },
  label:      { fontSize: 10, fontWeight: '500', color: TEXT_LIGHT, textAlign: 'center' },
  labelActive:{ color: BLUE,  fontWeight: '700' },
  labelDone:  { color: GREEN, fontWeight: '600' },
  line: {
    flex: 1, height: 2, backgroundColor: BORDER,
    marginTop: 15, marginHorizontal: -4,
  },
  lineDone: { backgroundColor: GREEN },
});

// ── Reusable Field Components ─────────────────────────────────────────────────
function FieldLabel({ label, required }) {
  return (
    <Text style={f.label}>
      {label}{required && <Text style={{ color: '#EF4444' }}> *</Text>}
    </Text>
  );
}

function ChipRow({ options, selected, onSelect, isMulti = false }) {
  return (
    <View style={f.chipRow}>
      {options.map((opt) => {
        const active = isMulti
          ? (Array.isArray(selected) && selected.includes(opt.value))
          : selected === opt.value;
        return (
          <TouchableOpacity
            key={opt.value}
            style={[f.chip, active && f.chipActive]}
            onPress={() => onSelect(opt.value)}
          >
            {opt.icon && (
              <Ionicons
                name={opt.icon}
                size={13}
                color={active ? (opt.color || BLUE) : TEXT_LIGHT}
              />
            )}
            <Text style={[f.chipTxt, active && { color: opt.color || BLUE, fontWeight: '700' }]}>
              {opt.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

function TagInput({ tags, onAdd, onRemove, placeholder, value, onChange, icon }) {
  return (
    <View style={{ gap: 10 }}>
      <View style={f.tagInputRow}>
        <View style={[f.inputBox, { flex: 1 }]}>
          {icon && <Ionicons name={icon} size={16} color={TEXT_LIGHT} style={{ marginRight: 8 }} />}
          <TextInput
            style={f.inputText}
            placeholder={placeholder}
            placeholderTextColor={TEXT_LIGHT}
            value={value}
            onChangeText={onChange}
            onSubmitEditing={onAdd}
          />
        </View>
        <TouchableOpacity style={f.addBtn} onPress={onAdd}>
          <Ionicons name="add" size={18} color={WHITE} />
        </TouchableOpacity>
      </View>
      {tags.length > 0 && (
        <View style={f.tagWrap}>
          {tags.map((tag, i) => {
            const tagLabel = typeof tag === 'object' ? tag.question || tag : tag;
            return (
              <View key={i} style={f.tag}>
                <Text style={f.tagTxt}>{tagLabel}</Text>
                <TouchableOpacity onPress={() => onRemove(tag)}>
                  <Ionicons name="close" size={13} color={BLUE} />
                </TouchableOpacity>
              </View>
            );
          })}
        </View>
      )}
    </View>
  );
}

function InputBox({ icon, placeholder, value, onChange, onFocus, onBlur, multiline, keyboardType, editable = true }) {
  return (
    <View style={[f.inputBox, multiline && { alignItems: 'flex-start', height: 110 }, !editable && { backgroundColor: BG }]}>
      {icon && <Ionicons name={icon} size={16} color={TEXT_LIGHT} style={[{ marginRight: 8 }, multiline && { marginTop: 14 }]} />}
      <TextInput
        style={[f.inputText, multiline && { textAlignVertical: 'top', paddingTop: 14, height: 90 }, !editable && { color: TEXT_MUTED }]}
        placeholder={placeholder}
        placeholderTextColor={TEXT_LIGHT}
        value={value}
        onChangeText={onChange}
        onFocus={onFocus}
        onBlur={onBlur}
        multiline={multiline}
        keyboardType={keyboardType}
        editable={editable}
      />
    </View>
  );
}

function SectionCard({ title, icon, children }) {
  return (
    <View style={f.sectionCard}>
      <View style={f.sectionHeader}>
        <View style={f.sectionIconBox}>
          <Ionicons name={icon} size={16} color={BLUE} />
        </View>
        <Text style={f.sectionTitle}>{title}</Text>
      </View>
      {children}
    </View>
  );
}

const f = StyleSheet.create({
  label:   { fontSize: 12, fontWeight: '700', color: TEXT_MUTED, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 12, paddingVertical: 8,
    borderRadius: 10, borderWidth: 1.5, borderColor: BORDER,
    backgroundColor: WHITE,
  },
  chipActive:   { borderColor: BLUE, backgroundColor: 'rgba(0,85,165,0.07)' },
  chipTxt:      { fontSize: 12, color: TEXT_MUTED, fontWeight: '500' },
  tagInputRow:  { flexDirection: 'row', gap: 8, alignItems: 'center' },
  inputBox: {
    flex: 1, flexDirection: 'row', alignItems: 'center',
    backgroundColor: WHITE, borderRadius: 12,
    borderWidth: 1.5, borderColor: BORDER,
    paddingHorizontal: 14,
  },
  inputText:    { flex: 1, fontSize: 14, color: TEXT_MAIN, paddingVertical: 12 },
  addBtn: {
    width: 44, height: 44, borderRadius: 12,
    backgroundColor: BLUE, alignItems: 'center', justifyContent: 'center',
  },
  tagWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  tag: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 10, paddingVertical: 6,
    borderRadius: 8, backgroundColor: 'rgba(0,85,165,0.07)',
    borderWidth: 1, borderColor: 'rgba(0,85,165,0.2)',
  },
  tagTxt: { fontSize: 12, color: BLUE, fontWeight: '600' },
  sectionCard: {
    backgroundColor: WHITE, borderRadius: 16, padding: 18,
    marginBottom: 16, borderWidth: 1, borderColor: BORDER,
    shadowColor: NAVY, shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04, shadowRadius: 8, elevation: 1,
  },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 18 },
  sectionIconBox: {
    width: 30, height: 30, borderRadius: 8,
    backgroundColor: 'rgba(0,85,165,0.08)',
    alignItems: 'center', justifyContent: 'center',
  },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: TEXT_MAIN },
  // Selection input styles
  selectionInput: {
    backgroundColor: WHITE,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 14,
    borderWidth: 1.5,
    borderColor: BORDER,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  selectionInputText: {
    fontSize: 14,
    color: TEXT_MAIN,
    flex: 1,
  },
  selectionInputPlaceholder: {
    color: TEXT_LIGHT,
  },
  skillPreviewTag: {
    backgroundColor: 'rgba(0,85,165,0.07)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(0,85,165,0.2)',
  },
  skillPreviewText: {
    fontSize: 12,
    color: BLUE,
    fontWeight: '500',
  },
});

// ── Step 1: Job Details ───────────────────────────────────────────────────────
function Step1({
  title, setTitle,
  description, setDescription,
  requiredSkills, setRequiredSkills,
  skillInput, setSkillInput,
  jobType, setJobType,
  workSetup, setWorkSetup,
  contactPreference, setContactPreference,
  category, setCategory,
  vacancies, setVacancies,
  timezone, setTimezone,
}) {
  // ── Modal states ────────────────────────────────────────────────────────────
  const [showTitleModal, setShowTitleModal] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showSkillModal, setShowSkillModal] = useState(false);

  return (
    <View>
      <SectionCard title="Job Information" icon="briefcase-outline">
        <View style={{ gap: 16 }}>
          {/* ── Job Title with Modal ── */}
          <View>
            <FieldLabel label="Job Title" required />
            <TouchableOpacity 
              style={f.selectionInput}
              onPress={() => setShowTitleModal(true)}
              activeOpacity={0.7}
            >
              <Text style={[
                f.selectionInputText,
                !title && f.selectionInputPlaceholder
              ]}>
                {title || 'Select or type job title...'}
              </Text>
              <Ionicons name="chevron-down" size={20} color={TEXT_LIGHT} />
            </TouchableOpacity>
          </View>

          {/* ── Category with Modal ── */}
          <View>
            <FieldLabel label="Category" required />
            <TouchableOpacity 
              style={f.selectionInput}
              onPress={() => setShowCategoryModal(true)}
              activeOpacity={0.7}
            >
              <Text style={[
                f.selectionInputText,
                !category && f.selectionInputPlaceholder
              ]}>
                {category || 'Select or type category...'}
              </Text>
              <Ionicons name="chevron-down" size={20} color={TEXT_LIGHT} />
            </TouchableOpacity>
          </View>

          {/* ── Description ── */}
          <View>
            <FieldLabel label="Description" required />
            <InputBox
              icon="document-text-outline"
              placeholder="Describe responsibilities, deliverables, and expectations..."
              value={description}
              onChange={setDescription}
              multiline
            />
          </View>

          {/* ── Required Skills with Modal ── */}
          <View>
            <FieldLabel label="Required Skills" />
            <TouchableOpacity 
              style={f.selectionInput}
              onPress={() => setShowSkillModal(true)}
              activeOpacity={0.7}
            >
              <View style={{ flex: 1, flexDirection: 'row', flexWrap: 'wrap', gap: 4 }}>
                {requiredSkills.length > 0 ? (
                  requiredSkills.slice(0, 3).map((skill, i) => (
                    <View key={i} style={f.skillPreviewTag}>
                      <Text style={f.skillPreviewText}>{skill}</Text>
                    </View>
                  ))
                ) : (
                  <Text style={f.selectionInputPlaceholder}>Select or type skills...</Text>
                )}
                {requiredSkills.length > 3 && (
                  <View style={f.skillPreviewTag}>
                    <Text style={f.skillPreviewText}>+{requiredSkills.length - 3}</Text>
                  </View>
                )}
              </View>
              <Ionicons name="chevron-down" size={20} color={TEXT_LIGHT} />
            </TouchableOpacity>
          </View>

          <View>
            <FieldLabel label="Number of Vacancies" />
            <InputBox
              icon="people-outline"
              placeholder="e.g. 1"
              value={vacancies}
              onChange={setVacancies}
              keyboardType="numeric"
            />
          </View>

          <View>
            <FieldLabel label="Timezone" />
            <InputBox
              icon="time-outline"
              placeholder="e.g. Asia/Manila"
              value={timezone}
              onChange={setTimezone}
            />
          </View>
        </View>
      </SectionCard>

      <SectionCard title="Job Type" icon="layers-outline">
        <View style={{ gap: 16 }}>
          <View>
            <FieldLabel label="Employment Type" />
            <ChipRow options={JOB_TYPES} selected={jobType} onSelect={setJobType} />
          </View>
          <View>
            <FieldLabel label="Work Setup" />
            <ChipRow options={WORK_SETUPS} selected={workSetup} onSelect={setWorkSetup} />
          </View>
          <View>
            <FieldLabel label="Contact Preference" />
            <ChipRow options={CONTACT_PREFERENCES} selected={contactPreference} onSelect={setContactPreference} />
          </View>
        </View>
      </SectionCard>

      {/* ── Selection Modals ── */}
      <SelectionModal
        visible={showTitleModal}
        onClose={() => setShowTitleModal(false)}
        onSelect={setTitle}
        data={SUGGESTED_TITLES}
        title="Select Job Title"
        searchPlaceholder="Search or type job title..."
        selectedValue={title}
        allowCustom={true}
      />

      <SelectionModal
        visible={showCategoryModal}
        onClose={() => setShowCategoryModal(false)}
        onSelect={setCategory}
        data={SUGGESTED_CATEGORIES}
        title="Select Category"
        searchPlaceholder="Search or type category..."
        selectedValue={category}
        allowCustom={true}
      />

      <SelectionModal
        visible={showSkillModal}
        onClose={() => setShowSkillModal(false)}
        onSelect={(skill) => {
          if (!requiredSkills.includes(skill)) {
            setRequiredSkills([...requiredSkills, skill]);
          }
        }}
        data={SKILLS_SUGGESTIONS}
        title="Select Skills"
        searchPlaceholder="Search or type skill..."
        selectedValue=""
        allowCustom={true}
      />
    </View>
  );
}

// ── Step 2: Requirements & Budget ─────────────────────────────────────────────
function Step2({
  budgetType, setBudgetType,
  budgetMin, setBudgetMin,
  budgetMax, setBudgetMax,
  budgetCurrency, setBudgetCurrency,
  budgetNegotiable, setBudgetNegotiable,
  hideBudget, setHideBudget,
  durationValue, setDurationValue,
  durationUnit, setDurationUnit,
  estimatedHours, setEstimatedHours,
  weeklyLimit, setWeeklyLimit,
  startDate, setStartDate,
  endDate, setEndDate,
  experienceLevel, setExperienceLevel,
  location, setLocation,
  workSetup,
  requirements, setRequirements,
  applicationSettings, setApplicationSettings,
  certificationInput, setCertificationInput,
  screeningQuestions, setScreeningQuestions,
  screeningInput, setScreeningInput,
  showAdvanced, setShowAdvanced,
}) {
  const [showStartDate, setShowStartDate] = useState(false);
  const [showEndDate, setShowEndDate] = useState(false);
  const [showDeadlinePicker, setShowDeadlinePicker] = useState(false);

  // ── Modal states for location ──────────────────────────────────────────────
  const [showProvinceModal, setShowProvinceModal] = useState(false);
  const [showCityModal, setShowCityModal] = useState(false);

  const formatDateDisplay = (date) => {
    if (!date) return 'Select date';
    return new Date(date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  return (
    <View>
      {/* ── BUDGET SECTION ── */}
      <SectionCard title="Budget" icon="cash-outline">
        <View style={{ gap: 16 }}>
          <View>
            <FieldLabel label="Budget Type" />
            <ChipRow options={BUDGET_TYPES} selected={budgetType} onSelect={setBudgetType} />
          </View>
          <View>
            <FieldLabel label="Currency" />
            <ChipRow options={CURRENCIES.map(c => ({ ...c, icon: undefined }))}
              selected={budgetCurrency}
              onSelect={setBudgetCurrency} />
          </View>
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <View style={{ flex: 1 }}>
              <FieldLabel label="Min Amount" required />
              <InputBox
                icon="wallet-outline"
                placeholder="e.g. 500"
                value={budgetMin}
                onChange={setBudgetMin}
                keyboardType="numeric"
              />
            </View>
            <View style={{ flex: 1 }}>
              <FieldLabel label="Max Amount" />
              <InputBox
                icon="wallet-outline"
                placeholder="e.g. 1000"
                value={budgetMax}
                onChange={setBudgetMax}
                keyboardType="numeric"
              />
            </View>
          </View>
          <View style={adv.switchRow}>
            <Text style={adv.switchLabel}>Negotiable</Text>
            <Switch
              value={budgetNegotiable}
              onValueChange={setBudgetNegotiable}
              trackColor={{ false: BORDER, true: GREEN_MID }}
              thumbColor={budgetNegotiable ? BLUE : TEXT_LIGHT}
            />
          </View>
          <View style={adv.switchRow}>
            <Text style={adv.switchLabel}>Hide Budget from Applicants</Text>
            <Switch
              value={hideBudget}
              onValueChange={setHideBudget}
              trackColor={{ false: BORDER, true: GREEN_MID }}
              thumbColor={hideBudget ? BLUE : TEXT_LIGHT}
            />
          </View>
        </View>
      </SectionCard>

      {/* ── LOCATION SECTION with Province and City Modals ── */}
      <SectionCard title="Location" icon="location-outline">
        <View style={{ gap: 12 }}>
          <View>
            <FieldLabel label="Country" />
            <InputBox 
              icon="location-outline" 
              placeholder="Country (e.g. Philippines)"
              value={location.country}
              onChange={(t) => setLocation({ ...location, country: t })} 
            />
          </View>
          
          {/* ── Province with Modal ── */}
          <View>
            <FieldLabel label="Province/State" />
            <TouchableOpacity 
              style={f.selectionInput}
              onPress={() => setShowProvinceModal(true)}
              activeOpacity={0.7}
            >
              <Text style={[
                f.selectionInputText,
                !location.province && f.selectionInputPlaceholder
              ]}>
                {location.province || 'Select or type province...'}
              </Text>
              <Ionicons name="chevron-down" size={20} color={TEXT_LIGHT} />
            </TouchableOpacity>
          </View>

          {/* ── City with Modal ── */}
          <View>
            <FieldLabel label="City" />
            <TouchableOpacity 
              style={f.selectionInput}
              onPress={() => setShowCityModal(true)}
              activeOpacity={0.7}
            >
              <Text style={[
                f.selectionInputText,
                !location.city && f.selectionInputPlaceholder
              ]}>
                {location.city || 'Select or type city...'}
              </Text>
              <Ionicons name="chevron-down" size={20} color={TEXT_LIGHT} />
            </TouchableOpacity>
          </View>

          <View>
            <FieldLabel label="Full Street Address" />
            <InputBox 
              icon="navigate-outline" 
              placeholder="Street number, street name, building, etc."
              value={location.address}
              onChange={(t) => setLocation({ ...location, address: t })} 
              multiline
            />
          </View>
          <View>
            <FieldLabel label="Zip/Postal Code" />
            <InputBox 
              icon="mail-outline" 
              placeholder="Zip Code"
              value={location.zip_code}
              onChange={(t) => setLocation({ ...location, zip_code: t })} 
            />
          </View>
        </View>
      </SectionCard>

      {/* ── TIMELINE SECTION ── */}
      <SectionCard title="Timeline" icon="hourglass-outline">
        <View style={{ gap: 16 }}>
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <View style={{ flex: 1 }}>
              <FieldLabel label="Duration Value" />
              <InputBox
                icon="number-outline"
                placeholder="e.g. 1"
                value={durationValue}
                onChange={setDurationValue}
                keyboardType="numeric"
              />
            </View>
            <View style={{ flex: 1 }}>
              <FieldLabel label="Duration Unit" />
              <ChipRow options={DURATION_UNITS} selected={durationUnit} onSelect={setDurationUnit} />
            </View>
          </View>
          <View>
            <FieldLabel label="Estimated Hours (Optional)" />
            <InputBox
              icon="time-outline"
              placeholder="e.g. 40"
              value={estimatedHours}
              onChange={setEstimatedHours}
              keyboardType="numeric"
            />
          </View>
          <View>
            <FieldLabel label="Weekly Hour Limit (Optional)" />
            <InputBox
              icon="calendar-outline"
              placeholder="e.g. 20"
              value={weeklyLimit}
              onChange={setWeeklyLimit}
              keyboardType="numeric"
            />
          </View>
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <View style={{ flex: 1 }}>
              <FieldLabel label="Start Date" />
              <TouchableOpacity
                style={s.datePickerBtn}
                onPress={() => setShowStartDate(true)}
                activeOpacity={0.7}
              >
                <Ionicons name="calendar-outline" size={18} color={BLUE} />
                <Text style={s.datePickerText}>
                  {startDate ? formatDateDisplay(startDate) : 'Select start date'}
                </Text>
              </TouchableOpacity>
              {showStartDate && (
                <DateTimePicker
                  value={startDate ? new Date(startDate) : new Date()}
                  mode="date"
                  display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                  onChange={(event, selectedDate) => {
                    setShowStartDate(false);
                    if (selectedDate) {
                      setStartDate(selectedDate.toISOString());
                    }
                  }}
                />
              )}
            </View>
            <View style={{ flex: 1 }}>
              <FieldLabel label="End Date" />
              <TouchableOpacity
                style={s.datePickerBtn}
                onPress={() => setShowEndDate(true)}
                activeOpacity={0.7}
              >
                <Ionicons name="calendar-outline" size={18} color={BLUE} />
                <Text style={s.datePickerText}>
                  {endDate ? formatDateDisplay(endDate) : 'Select end date'}
                </Text>
              </TouchableOpacity>
              {showEndDate && (
                <DateTimePicker
                  value={endDate ? new Date(endDate) : new Date()}
                  mode="date"
                  display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                  onChange={(event, selectedDate) => {
                    setShowEndDate(false);
                    if (selectedDate) {
                      setEndDate(selectedDate.toISOString());
                    }
                  }}
                />
              )}
            </View>
          </View>
        </View>
      </SectionCard>

      {/* ── EXPERIENCE LEVEL ── */}
      <SectionCard title="Experience Level" icon="trophy-outline">
        <FieldLabel label="Required Experience" />
        <ChipRow options={EXPERIENCE_LEVELS} selected={experienceLevel} onSelect={setExperienceLevel} />
      </SectionCard>

      {/* ── Advanced Options Toggle ── */}
      <TouchableOpacity
        style={adv.toggle}
        onPress={() => setShowAdvanced(!showAdvanced)}
        activeOpacity={0.7}
      >
        <Text style={adv.toggleTxt}>Advanced Options</Text>
        <View style={[adv.badge, showAdvanced && adv.badgeOpen]}>
          <Ionicons name={showAdvanced ? 'chevron-up' : 'chevron-down'} size={14} color={showAdvanced ? WHITE : BLUE} />
        </View>
      </TouchableOpacity>

      {showAdvanced && (
        <>
          {/* Requirements */}
          <SectionCard title="Requirements" icon="list-outline">
            <View style={{ gap: 16 }}>
              <View>
                <FieldLabel label="Education Level" />
                <ChipRow options={DEGREE_LEVELS.map(d => ({ ...d, icon: undefined }))}
                  selected={requirements.education}
                  onSelect={(v) => setRequirements({ ...requirements, education: v })} />
              </View>
              <View style={adv.switchRow}>
                <Text style={adv.switchLabel}>Portfolio Required</Text>
                <Switch
                  value={requirements.portfolio_required}
                  onValueChange={(v) => setRequirements({ ...requirements, portfolio_required: v })}
                  trackColor={{ false: BORDER, true: GREEN_MID }}
                  thumbColor={requirements.portfolio_required ? BLUE : TEXT_LIGHT}
                />
              </View>
              <View style={adv.switchRow}>
                <Text style={adv.switchLabel}>Resume Required</Text>
                <Switch
                  value={requirements.resume_required}
                  onValueChange={(v) => setRequirements({ ...requirements, resume_required: v })}
                  trackColor={{ false: BORDER, true: GREEN_MID }}
                  thumbColor={requirements.resume_required ? BLUE : TEXT_LIGHT}
                />
              </View>
              <View style={adv.switchRow}>
                <Text style={adv.switchLabel}>Cover Letter Required</Text>
                <Switch
                  value={requirements.cover_letter_required}
                  onValueChange={(v) => setRequirements({ ...requirements, cover_letter_required: v })}
                  trackColor={{ false: BORDER, true: GREEN_MID }}
                  thumbColor={requirements.cover_letter_required ? BLUE : TEXT_LIGHT}
                />
              </View>
              <View>
                <FieldLabel label="Preferred Languages" />
                <TagInput
                  tags={requirements.preferred_languages}
                  value={screeningInput}
                  onChange={setScreeningInput}
                  onAdd={() => {
                    if (screeningInput.trim() && !requirements.preferred_languages.includes(screeningInput.trim())) {
                      setRequirements({
                        ...requirements,
                        preferred_languages: [...requirements.preferred_languages, screeningInput.trim()]
                      });
                      setScreeningInput('');
                    }
                  }}
                  onRemove={(lang) => setRequirements({
                    ...requirements,
                    preferred_languages: requirements.preferred_languages.filter(x => x !== lang)
                  })}
                  placeholder="Add a language..."
                />
              </View>
              <View>
                <FieldLabel label="Preferred Certifications" />
                <TagInput
                  tags={requirements.preferred_certifications}
                  value={certificationInput}
                  onChange={setCertificationInput}
                  onAdd={() => {
                    if (certificationInput.trim() && !requirements.preferred_certifications.includes(certificationInput.trim())) {
                      setRequirements({
                        ...requirements,
                        preferred_certifications: [...requirements.preferred_certifications, certificationInput.trim()]
                      });
                      setCertificationInput('');
                    }
                  }}
                  onRemove={(cert) => setRequirements({
                    ...requirements,
                    preferred_certifications: requirements.preferred_certifications.filter(x => x !== cert)
                  })}
                  placeholder="Add a certification..."
                />
              </View>
            </View>
          </SectionCard>

          {/* Screening Questions */}
          <SectionCard title="Screening Questions" icon="help-circle-outline">
            <View style={{ gap: 12 }}>
              <TagInput
                tags={screeningQuestions}
                value={screeningInput}
                onChange={setScreeningInput}
                onAdd={() => {
                  if (screeningInput.trim()) {
                    setScreeningQuestions([...screeningQuestions, { question: screeningInput.trim(), required: true }]);
                    setScreeningInput('');
                  }
                }}
                onRemove={(q) => setScreeningQuestions(screeningQuestions.filter(x => x.question !== q.question))}
                placeholder="Add a screening question..."
              />
            </View>
          </SectionCard>

          {/* Application Settings */}
          <SectionCard title="Application Settings" icon="settings-outline">
            <View style={{ gap: 16 }}>
              <View>
                <FieldLabel label="Max Applicants" />
                <InputBox
                  icon="people-outline"
                  placeholder="100 (max 1000)"
                  value={applicationSettings.max_applicants}
                  onChange={(t) => setApplicationSettings({ ...applicationSettings, max_applicants: t })}
                  keyboardType="numeric"
                />
              </View>
              <View style={adv.switchRow}>
                <Text style={adv.switchLabel}>Auto Accept Applications</Text>
                <Switch
                  value={applicationSettings.auto_accept}
                  onValueChange={(v) => setApplicationSettings({ ...applicationSettings, auto_accept: v })}
                  trackColor={{ false: BORDER, true: GREEN_MID }}
                  thumbColor={applicationSettings.auto_accept ? BLUE : TEXT_LIGHT}
                />
              </View>
              <View style={adv.switchRow}>
                <Text style={adv.switchLabel}>Allow Multiple Hires</Text>
                <Switch
                  value={applicationSettings.allow_multiple_hires}
                  onValueChange={(v) => setApplicationSettings({ ...applicationSettings, allow_multiple_hires: v })}
                  trackColor={{ false: BORDER, true: GREEN_MID }}
                  thumbColor={applicationSettings.allow_multiple_hires ? BLUE : TEXT_LIGHT}
                />
              </View>
              <View>
                <FieldLabel label="Application Deadline" />
                <TouchableOpacity
                  style={s.datePickerBtn}
                  onPress={() => setShowDeadlinePicker(true)}
                  activeOpacity={0.7}
                >
                  <Ionicons name="calendar-outline" size={18} color={BLUE} />
                  <Text style={s.datePickerText}>
                    {applicationSettings.application_deadline
                      ? formatDateDisplay(applicationSettings.application_deadline)
                      : 'Select deadline (must be in future)'}
                  </Text>
                </TouchableOpacity>
                {showDeadlinePicker && (
                  <DateTimePicker
                    value={applicationSettings.application_deadline ? new Date(applicationSettings.application_deadline) : new Date()}
                    mode="date"
                    display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                    onChange={(event, selectedDate) => {
                      setShowDeadlinePicker(false);
                      if (selectedDate) {
                        if (selectedDate <= new Date()) {
                          Alert.alert('Invalid Date', 'Application deadline must be in the future');
                          return;
                        }
                        setApplicationSettings({
                          ...applicationSettings,
                          application_deadline: selectedDate.toISOString()
                        });
                      }
                    }}
                    minimumDate={new Date()}
                  />
                )}
              </View>
            </View>
          </SectionCard>

          {/* Job Features */}
          <SectionCard title="Job Features" icon="flag-outline">
            <View style={adv.switchRow}>
              <Text style={adv.switchLabel}>Featured Job</Text>
              <Switch
                value={applicationSettings.featured}
                onValueChange={(v) => setApplicationSettings({ ...applicationSettings, featured: v })}
                trackColor={{ false: BORDER, true: GREEN_MID }}
                thumbColor={applicationSettings.featured ? BLUE : TEXT_LIGHT}
              />
            </View>
            <View style={[adv.switchRow, { marginTop: 12 }]}>
              <Text style={adv.switchLabel}>Urgent Hiring</Text>
              <Switch
                value={applicationSettings.urgent}
                onValueChange={(v) => setApplicationSettings({ ...applicationSettings, urgent: v })}
                trackColor={{ false: BORDER, true: GREEN_MID }}
                thumbColor={applicationSettings.urgent ? BLUE : TEXT_LIGHT}
              />
            </View>
            <View style={[adv.switchRow, { marginTop: 12 }]}>
              <Text style={adv.switchLabel}>NDA Required</Text>
              <Switch
                value={applicationSettings.nda_required}
                onValueChange={(v) => setApplicationSettings({ ...applicationSettings, nda_required: v })}
                trackColor={{ false: BORDER, true: GREEN_MID }}
                thumbColor={applicationSettings.nda_required ? BLUE : TEXT_LIGHT}
              />
            </View>
          </SectionCard>
        </>
      )}

      {/* ── Province Selection Modal ── */}
      <SelectionModal
        visible={showProvinceModal}
        onClose={() => setShowProvinceModal(false)}
        onSelect={(province) => setLocation({ ...location, province: province })}
        data={PHILIPPINE_PROVINCES}
        title="Select Province"
        searchPlaceholder="Search or type province..."
        selectedValue={location.province}
        allowCustom={true}
      />

      {/* ── City Selection Modal ── */}
      <SelectionModal
        visible={showCityModal}
        onClose={() => setShowCityModal(false)}
        onSelect={(city) => setLocation({ ...location, city: city })}
        data={PHILIPPINE_CITIES}
        title="Select City"
        searchPlaceholder="Search or type city..."
        selectedValue={location.city}
        allowCustom={true}
      />
    </View>
  );
}

const adv = StyleSheet.create({
  toggle: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: WHITE, borderRadius: 12, padding: 16,
    borderWidth: 1, borderColor: BORDER, marginBottom: 16,
    borderStyle: 'dashed',
  },
  toggleTxt: { fontSize: 14, fontWeight: '600', color: BLUE },
  badge: {
    width: 28, height: 28, borderRadius: 8,
    backgroundColor: 'rgba(0,85,165,0.08)',
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: 'rgba(0,85,165,0.2)',
  },
  badgeOpen: { backgroundColor: BLUE, borderColor: BLUE },
  switchRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  switchLabel: { fontSize: 13, fontWeight: '600', color: TEXT_MAIN },
});

// ── Step 3: Review & Post ─────────────────────────────────────────────────────
function ReviewRow({ icon, label, value, accent }) {
  if (!value && value !== 0 && value !== false) return null;
  return (
    <View style={rv.row}>
      <View style={rv.iconBox}>
        <Ionicons name={icon} size={14} color={accent || BLUE} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={rv.rowLabel}>{label}</Text>
        <Text style={rv.rowValue}>{String(value)}</Text>
      </View>
    </View>
  );
}

function Step3({ title, description, requiredSkills, jobType, workSetup,
  experienceLevel, budgetType, budgetMin, budgetMax, budgetCurrency, budgetNegotiable,
  durationValue, durationUnit, estimatedHours, weeklyLimit, startDate, endDate,
  contactPreference, location, requirements, applicationSettings,
  category, vacancies, timezone, screeningQuestions }) {

  const experience = EXPERIENCE_LEVELS.find(e => e.value === experienceLevel);
  const budgetLabel = BUDGET_TYPES.find(b => b.value === budgetType)?.label;

  const formatDateDisplay = (date) => {
    if (!date) return null;
    return new Date(date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  const getStatusDisplay = () => {
    const statuses = [];
    if (applicationSettings.urgent) statuses.push('Urgent');
    if (applicationSettings.featured) statuses.push('Featured');
    if (applicationSettings.nda_required) statuses.push('NDA Required');
    return statuses.length > 0 ? statuses.join(' • ') : 'Open';
  };

  const getFullAddress = () => {
    if (!location) return null;
    const parts = [];
    if (location.address) parts.push(location.address);
    if (location.city) parts.push(location.city);
    if (location.province) parts.push(location.province);
    if (location.country && location.country !== 'Philippines') parts.push(location.country);
    if (location.zip_code) parts.push(location.zip_code);
    return parts.length > 0 ? parts.join(', ') : null;
  };

  return (
    <View>
      <View style={rv.hero}>
        <View style={rv.heroIcon}>
          <Ionicons name="briefcase" size={24} color={WHITE} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={rv.heroTitle}>{title || 'Untitled Job'}</Text>
          <View style={{ flexDirection: 'row', gap: 8, marginTop: 6, flexWrap: 'wrap' }}>
            {category && (
              <View style={rv.badge}>
                <Text style={rv.badgeTxt}>{category}</Text>
              </View>
            )}
            {jobType && (
              <View style={rv.badge}>
                <Text style={rv.badgeTxt}>{JOB_TYPES.find(j => j.value === jobType)?.label}</Text>
              </View>
            )}
            {workSetup && (
              <View style={rv.badge}>
                <Text style={rv.badgeTxt}>{WORK_SETUPS.find(w => w.value === workSetup)?.label}</Text>
              </View>
            )}
            {experienceLevel && (
              <View style={rv.badge}>
                <Text style={rv.badgeTxt}>{experience?.label}</Text>
              </View>
            )}
            {applicationSettings.urgent && (
              <View style={[rv.badge, { backgroundColor: '#FEE2E2', borderColor: '#FECACA' }]}>
                <Text style={[rv.badgeTxt, { color: '#DC2626' }]}>Urgent</Text>
              </View>
            )}
            {applicationSettings.featured && (
              <View style={[rv.badge, { backgroundColor: '#FEF3C7', borderColor: '#FDE68A' }]}>
                <Text style={[rv.badgeTxt, { color: '#D97706' }]}>Featured</Text>
              </View>
            )}
            {applicationSettings.nda_required && (
              <View style={[rv.badge, { backgroundColor: '#DBEAFE', borderColor: '#93C5FD' }]}>
                <Text style={[rv.badgeTxt, { color: '#2563EB' }]}>NDA</Text>
              </View>
            )}
          </View>
        </View>
      </View>

      <SectionCard title="Job Details" icon="document-text-outline">
        <View style={{ gap: 12 }}>
          <ReviewRow icon="grid-outline" label="Category" value={category} />
          <ReviewRow icon="briefcase-outline" label="Title" value={title} />
          <ReviewRow icon="people-outline" label="Vacancies" value={vacancies} />
          <ReviewRow icon="time-outline" label="Timezone" value={timezone} />
          <ReviewRow icon="document-text-outline" label="Description" value={description?.substring(0, 120) + (description?.length > 120 ? '...' : '')} />
          {requiredSkills?.length > 0 && (
            <View style={rv.row}>
              <View style={rv.iconBox}><Ionicons name="code-slash-outline" size={14} color={BLUE} /></View>
              <View style={{ flex: 1 }}>
                <Text style={rv.rowLabel}>Required Skills</Text>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 4 }}>
                  {requiredSkills.map(sk => (
                    <View key={sk} style={[f.tag, { paddingVertical: 4 }]}>
                      <Text style={[f.tagTxt, { fontSize: 11 }]}>{sk}</Text>
                    </View>
                  ))}
                </View>
              </View>
            </View>
          )}
          <ReviewRow icon="person-outline" label="Contact Preference" value={contactPreference} />
          {experienceLevel && <ReviewRow icon="trophy-outline" label="Experience Level" value={experience?.label} />}
          {screeningQuestions?.length > 0 && (
            <ReviewRow icon="help-circle-outline" label="Screening Questions" value={`${screeningQuestions.length} question(s)`} />
          )}
        </View>
      </SectionCard>

      <SectionCard title="Budget & Timeline" icon="cash-outline">
        <View style={{ gap: 12 }}>
          <ReviewRow icon="wallet-outline" label="Budget" value={`${budgetCurrency} ${budgetMin}${budgetMax ? ` - ${budgetCurrency} ${budgetMax}` : ''} (${budgetLabel})`} />
          <ReviewRow icon="checkmark-circle-outline" label="Negotiable" value={budgetNegotiable ? 'Yes' : 'No'} accent={budgetNegotiable ? GREEN : undefined} />
          <ReviewRow icon="time-outline" label="Duration" value={`${durationValue} ${durationUnit}`} />
          {estimatedHours && <ReviewRow icon="hourglass-outline" label="Est. Hours" value={`${estimatedHours} hrs`} />}
          {weeklyLimit && <ReviewRow icon="calendar-outline" label="Weekly Limit" value={`${weeklyLimit} hrs/week`} />}
          {startDate && <ReviewRow icon="calendar-outline" label="Start Date" value={formatDateDisplay(startDate)} />}
          {endDate && <ReviewRow icon="calendar-outline" label="End Date" value={formatDateDisplay(endDate)} />}
        </View>
      </SectionCard>

      {(location && (location.country || location.city || location.address)) && (
        <SectionCard title="Location" icon="location-outline">
          <View style={{ gap: 12 }}>
            {location.address && <ReviewRow icon="navigate-outline" label="Full Address" value={location.address} />}
            {location.city && <ReviewRow icon="map-outline" label="City" value={location.city} />}
            {location.province && <ReviewRow icon="business-outline" label="Province" value={location.province} />}
            {location.country && <ReviewRow icon="location-outline" label="Country" value={location.country} />}
            {location.zip_code && <ReviewRow icon="mail-outline" label="Zip Code" value={location.zip_code} />}
            {getFullAddress() && (
              <ReviewRow icon="location-outline" label="Full Address" value={getFullAddress()} accent={GREEN} />
            )}
          </View>
        </SectionCard>
      )}

      {requirements && (requirements.education !== 'none' || requirements.portfolio_required || requirements.resume_required || requirements.cover_letter_required || requirements.preferred_languages?.length > 0) && (
        <SectionCard title="Requirements" icon="list-outline">
          <View style={{ gap: 12 }}>
            {requirements.education && requirements.education !== 'none' && (
              <ReviewRow icon="school-outline" label="Education" value={DEGREE_LEVELS.find(d => d.value === requirements.education)?.label} />
            )}
            <ReviewRow icon="portfolio-outline" label="Portfolio Required" value={requirements.portfolio_required ? 'Yes' : 'No'} accent={requirements.portfolio_required ? GREEN : undefined} />
            <ReviewRow icon="document-text-outline" label="Resume Required" value={requirements.resume_required ? 'Yes' : 'No'} accent={requirements.resume_required ? GREEN : undefined} />
            <ReviewRow icon="chatbubble-outline" label="Cover Letter Required" value={requirements.cover_letter_required ? 'Yes' : 'No'} accent={requirements.cover_letter_required ? GREEN : undefined} />
            {requirements.preferred_languages?.length > 0 && (
              <ReviewRow icon="language-outline" label="Languages" value={requirements.preferred_languages.join(', ')} />
            )}
            {requirements.preferred_certifications?.length > 0 && (
              <ReviewRow icon="ribbon-outline" label="Certifications" value={requirements.preferred_certifications.join(', ')} />
            )}
          </View>
        </SectionCard>
      )}

      {applicationSettings && (
        <SectionCard title="Application Settings" icon="settings-outline">
          <View style={{ gap: 12 }}>
            <ReviewRow icon="people-outline" label="Max Applicants" value={applicationSettings.max_applicants} />
            <ReviewRow icon="checkmark-circle-outline" label="Auto Accept" value={applicationSettings.auto_accept ? 'Yes' : 'No'} accent={applicationSettings.auto_accept ? GREEN : undefined} />
            <ReviewRow icon="people-outline" label="Multiple Hires" value={applicationSettings.allow_multiple_hires ? 'Yes' : 'No'} accent={applicationSettings.allow_multiple_hires ? GREEN : undefined} />
            {applicationSettings.application_deadline && (
              <ReviewRow icon="calendar-outline" label="Application Deadline" value={formatDateDisplay(applicationSettings.application_deadline)} accent={new Date(applicationSettings.application_deadline) < new Date() ? '#EF4444' : GREEN} />
            )}
            <ReviewRow icon="flag-outline" label="Status" value={getStatusDisplay()} />
          </View>
        </SectionCard>
      )}

      <View style={rv.confirmBanner}>
        <Ionicons name="information-circle" size={18} color={BLUE} />
        <Text style={rv.confirmTxt}>
          Review all details above. Once posted, your job will be visible to freelancers immediately.
        </Text>
      </View>
    </View>
  );
}

const rv = StyleSheet.create({
  hero: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 14,
    backgroundColor: NAVY, borderRadius: 16, padding: 18, marginBottom: 16,
  },
  heroIcon: {
    width: 48, height: 48, borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center', justifyContent: 'center',
  },
  heroTitle: { fontSize: 18, fontWeight: '800', color: WHITE, lineHeight: 24 },
  badge: {
    paddingHorizontal: 8, paddingVertical: 3,
    borderRadius: 6, backgroundColor: 'rgba(255,255,255,0.12)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)',
  },
  badgeTxt: { fontSize: 10, color: 'rgba(255,255,255,0.85)', fontWeight: '600', textTransform: 'uppercase' },
  row: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  iconBox: {
    width: 28, height: 28, borderRadius: 7,
    backgroundColor: BG, alignItems: 'center', justifyContent: 'center', marginTop: 1,
  },
  rowLabel: { fontSize: 10, color: TEXT_LIGHT, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.3 },
  rowValue: { fontSize: 13, color: TEXT_MAIN, fontWeight: '500', marginTop: 2, lineHeight: 18 },
  confirmBanner: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 10,
    backgroundColor: 'rgba(0,85,165,0.06)', borderRadius: 12, padding: 14,
    borderWidth: 1, borderColor: 'rgba(0,85,165,0.15)', marginBottom: 8,
  },
  confirmTxt: { flex: 1, fontSize: 12, color: TEXT_MUTED, lineHeight: 18 },
});

// ── Main Screen ───────────────────────────────────────────────────────────────
export default function PostJobScreen({ onNavigate }) {
  const dispatch = useDispatch();
  const { isLoading, error, createJobSuccess } = useSelector((state) => state.jobs);
  const { token } = useSelector((state) => state.auth);

  const [activeTab, setActiveTab] = useState('PostJob');
  const [currentStep, setCurrentStep] = useState(1);
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Basic
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [requiredSkills, setRequiredSkills] = useState([]);
  const [skillInput, setSkillInput] = useState('');
  const [jobType, setJobType] = useState('project');
  const [workSetup, setWorkSetup] = useState('remote');
  const [experienceLevel, setExperienceLevel] = useState('entry');
  const [contactPreference, setContactPreference] = useState('chat');
  const [vacancies, setVacancies] = useState('1');
  const [timezone, setTimezone] = useState('Asia/Manila');

  // Budget
  const [budgetType, setBudgetType] = useState('fixed');
  const [budgetMin, setBudgetMin] = useState('');
  const [budgetMax, setBudgetMax] = useState('');
  const [budgetCurrency, setBudgetCurrency] = useState('PHP');
  const [budgetNegotiable, setBudgetNegotiable] = useState(false);
  const [hideBudget, setHideBudget] = useState(false);

  // Timeline
  const [durationValue, setDurationValue] = useState('1');
  const [durationUnit, setDurationUnit] = useState('weeks');
  const [estimatedHours, setEstimatedHours] = useState('');
  const [weeklyLimit, setWeeklyLimit] = useState('');
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);

  // Location
  const [location, setLocation] = useState({
    country: 'Philippines',
    province: '',
    city: '',
    address: '',
    zip_code: '',
  });

  // Requirements
  const [requirements, setRequirements] = useState({
    education: 'none',
    portfolio_required: false,
    resume_required: false,
    cover_letter_required: false,
    preferred_languages: [],
    preferred_certifications: [],
  });

  // Screening Questions
  const [screeningQuestions, setScreeningQuestions] = useState([]);
  const [screeningInput, setScreeningInput] = useState('');
  const [certificationInput, setCertificationInput] = useState('');

  // Application Settings
  const [applicationSettings, setApplicationSettings] = useState({
    max_applicants: '100',
    auto_accept: false,
    allow_multiple_hires: false,
    featured: false,
    urgent: false,
    nda_required: false,
    application_deadline: null,
  });

  // Handle Android hardware back button
  useEffect(() => {
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      if (onNavigate) {
        onNavigate('ClientDashboard');
        return true;
      }
      return false;
    });

    return () => backHandler.remove();
  }, [onNavigate]);

  // Reset success state when component unmounts
  useEffect(() => {
    return () => {
      dispatch(clearJobSuccess());
    };
  }, [dispatch]);

  // Handle successful job creation
  useEffect(() => {
    if (createJobSuccess) {
      Alert.alert('Posted!', 'Your job is now live.', [
        { text: 'View My Postings', onPress: () => { resetForm(); onNavigate('Mypostings'); } },
        { text: 'Post Another',     onPress: () => resetForm() },
        { text: 'Dashboard',        onPress: () => { resetForm(); onNavigate('ClientDashboard'); } },
      ]);
      dispatch(clearJobSuccess());
    }
  }, [createJobSuccess]);

  const handleTabPress = (key) => {
    setActiveTab(key);
    if (key === 'Home')          onNavigate('ClientDashboard');
    if (key === 'PostJob')       onNavigate('PostJob');
    if (key === 'Hiredtalents')  onNavigate('Hiredtalents');
    if (key === 'Message')       onNavigate('Message');
    if (key === 'ClientProfile') onNavigate('ClientProfile');
  };

  const validateStep1 = () => {
    if (!title.trim())       { Alert.alert('Missing Info', 'Please enter a job title'); return false; }
    if (!category.trim())    { Alert.alert('Missing Info', 'Please enter a job category'); return false; }
    if (!description.trim()) { Alert.alert('Missing Info', 'Please enter a job description'); return false; }
    return true;
  };

  const validateStep2 = () => {
    if (!budgetMin || parseFloat(budgetMin) <= 0) {
      Alert.alert('Missing Info', 'Please enter a valid budget minimum amount');
      return false;
    }
    const maxApps = parseInt(applicationSettings.max_applicants);
    if (maxApps < 1 || maxApps > 1000) {
      Alert.alert('Invalid', 'Max applicants must be between 1 and 1000');
      return false;
    }
    return true;
  };

  const handleNext = () => {
    if (currentStep === 1 && !validateStep1()) return;
    if (currentStep === 2 && !validateStep2()) return;
    if (currentStep < 3) setCurrentStep(currentStep + 1);
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    } else {
      if (onNavigate) {
        onNavigate('ClientDashboard');
      }
    }
  };

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setCategory('');
    setRequiredSkills([]);
    setSkillInput('');
    setJobType('project');
    setWorkSetup('remote');
    setExperienceLevel('entry');
    setContactPreference('chat');
    setVacancies('1');
    setTimezone('Asia/Manila');
    setBudgetType('fixed');
    setBudgetMin('');
    setBudgetMax('');
    setBudgetCurrency('PHP');
    setBudgetNegotiable(false);
    setHideBudget(false);
    setDurationValue('1');
    setDurationUnit('weeks');
    setEstimatedHours('');
    setWeeklyLimit('');
    setStartDate(null);
    setEndDate(null);
    setLocation({
      country: 'Philippines',
      province: '',
      city: '',
      address: '',
      zip_code: '',
    });
    setRequirements({
      education: 'none',
      portfolio_required: false,
      resume_required: false,
      cover_letter_required: false,
      preferred_languages: [],
      preferred_certifications: [],
    });
    setScreeningQuestions([]);
    setScreeningInput('');
    setCertificationInput('');
    setApplicationSettings({
      max_applicants: '100',
      auto_accept: false,
      allow_multiple_hires: false,
      featured: false,
      urgent: false,
      nda_required: false,
      application_deadline: null,
    });
    setCurrentStep(1);
    setShowAdvanced(false);
    dispatch(clearJobSuccess());
  };

  const handlePost = async () => {
    if (!token) {
      Alert.alert('Error', 'You must be logged in to post a job');
      return;
    }

    const maxApps = parseInt(applicationSettings.max_applicants);
    if (maxApps < 1 || maxApps > 1000) {
      Alert.alert('Invalid', 'Max applicants must be between 1 and 1000');
      return;
    }

    if (applicationSettings.application_deadline) {
      const deadline = new Date(applicationSettings.application_deadline);
      if (deadline <= new Date()) {
        Alert.alert('Invalid', 'Application deadline must be in the future');
        return;
      }
    }

    const jobData = {
      title: title.trim(),
      description: description.trim(),
      category: category.trim(),
      subcategory: null,
      required_skills: requiredSkills,
      tags: [],
      job_type: jobType,
      work_setup: workSetup,
      experience_level: experienceLevel,
      vacancies: parseInt(vacancies) || 1,
      contact_preference: contactPreference,
      location: {
        country: location.country || 'Philippines',
        province: location.province || '',
        city: location.city || '',
        address: location.address || '',
        zip_code: location.zip_code || '',
      },
      timezone: timezone || 'Asia/Manila',
      budget_type: budgetType,
      budget_min: parseFloat(budgetMin) || 0,
      budget_max: budgetMax ? parseFloat(budgetMax) : (parseFloat(budgetMin) || 0),
      budget_currency: budgetCurrency || 'PHP',
      budget_negotiable: budgetNegotiable,
      hide_budget: hideBudget,
      duration_value: parseInt(durationValue) || 1,
      duration_unit: durationUnit || 'weeks',
      estimated_hours: estimatedHours ? parseInt(estimatedHours) : null,
      weekly_limit: weeklyLimit ? parseInt(weeklyLimit) : null,
      start_date: startDate || null,
      end_date: endDate || null,
      requirements: {
        education: requirements.education || 'none',
        portfolio_required: requirements.portfolio_required || false,
        resume_required: requirements.resume_required || false,
        cover_letter_required: requirements.cover_letter_required || false,
        preferred_languages: requirements.preferred_languages || [],
        preferred_certifications: requirements.preferred_certifications || [],
        min_years: 0,
      },
      screening_questions: screeningQuestions.map(q => ({
        question: typeof q === 'string' ? q : q.question,
        required: typeof q === 'object' ? (q.required !== undefined ? q.required : true) : true
      })),
      hiring: {
        max_applicants: parseInt(applicationSettings.max_applicants) || 100,
        auto_accept: applicationSettings.auto_accept || false,
        allow_multiple_hires: applicationSettings.allow_multiple_hires || false,
      },
      featured: applicationSettings.featured || false,
      urgent: applicationSettings.urgent || false,
      nda_required: applicationSettings.nda_required || false,
      visibility: 'public',
      application_deadline: applicationSettings.application_deadline || null,
    };

    console.log('=== JOB DATA BEING SENT ===');
    console.log('Location with address:', jobData.location);
    console.log('Full Job Data:', JSON.stringify(jobData, null, 2));

    try {
      const result = await dispatch(createJob(jobData)).unwrap();
      console.log('Job created successfully:', result);
    } catch (error) {
      console.error('Post job error:', error);
      Alert.alert('Error', typeof error === 'string' ? error : (error?.message || 'Failed to post job. Please try again.'));
    }
  };

  // Step props
  const stepProps = {
    title, setTitle,
    description, setDescription,
    category, setCategory,
    requiredSkills, setRequiredSkills,
    skillInput, setSkillInput,
    jobType, setJobType,
    workSetup, setWorkSetup,
    contactPreference, setContactPreference,
    vacancies, setVacancies,
    timezone, setTimezone,
    budgetType, setBudgetType,
    budgetMin, setBudgetMin,
    budgetMax, setBudgetMax,
    budgetCurrency, setBudgetCurrency,
    budgetNegotiable, setBudgetNegotiable,
    hideBudget, setHideBudget,
    durationValue, setDurationValue,
    durationUnit, setDurationUnit,
    estimatedHours, setEstimatedHours,
    weeklyLimit, setWeeklyLimit,
    startDate, setStartDate,
    endDate, setEndDate,
    experienceLevel, setExperienceLevel,
    location, setLocation,
    requirements, setRequirements,
    applicationSettings, setApplicationSettings,
    certificationInput, setCertificationInput,
    screeningQuestions, setScreeningQuestions,
    screeningInput, setScreeningInput,
    showAdvanced, setShowAdvanced,
  };

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <View style={s.root}>

        {/* TOP BAR */}
        <View style={s.topbar}>
          <View style={s.topbarLeft}>
            <View style={s.logoBox}>
              <Ionicons name="flash-outline" size={15} color={NAVY} />
            </View>
            <View>
              <Text style={s.topbarBrand}>Taskra</Text>
              <Text style={s.topbarTagline}>Client Portal</Text>
            </View>
          </View>
          <TouchableOpacity style={s.postingsBtn} onPress={() => onNavigate('Mypostings')}>
            <Ionicons name="document-text-outline" size={16} color={WHITE} />
            <Text style={s.postingsBtnText}>My Posts</Text>
          </TouchableOpacity>
        </View>

        {/* STEP PROGRESS */}
        <StepBar currentStep={currentStep} />

        {/* SCROLL CONTENT */}
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={s.scroll}
          keyboardShouldPersistTaps="handled"
        >
          <View style={s.stepHeader}>
            <View style={s.stepHeaderIcon}>
              <Ionicons name={STEPS[currentStep - 1].icon} size={18} color={BLUE} />
            </View>
            <View>
              <Text style={s.stepHeaderNum}>Step {currentStep} of {STEPS.length}</Text>
              <Text style={s.stepHeaderTitle}>{STEPS[currentStep - 1].label}</Text>
            </View>
          </View>

          {currentStep === 1 && <Step1 {...stepProps} />}
          {currentStep === 2 && <Step2 {...stepProps} />}
          {currentStep === 3 && <Step3 {...stepProps} />}

          <View style={s.navRow}>
            {currentStep > 1 ? (
              <TouchableOpacity style={s.backNavBtn} onPress={handleBack}>
                <Ionicons name="arrow-back" size={18} color={BLUE} />
                <Text style={s.backNavBtnTxt}>Back</Text>
              </TouchableOpacity>
            ) : (
              <View style={{ flex: 1 }} />
            )}

            {currentStep < 3 ? (
              <TouchableOpacity style={s.nextBtn} onPress={handleNext} activeOpacity={0.85}>
                <Text style={s.nextBtnTxt}>Continue</Text>
                <Ionicons name="arrow-forward" size={18} color={WHITE} />
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={[s.postBtn, isLoading && { opacity: 0.6 }]}
                onPress={handlePost}
                disabled={isLoading}
                activeOpacity={0.85}
              >
                {isLoading
                  ? <ActivityIndicator color={WHITE} size="small" />
                  : <>
                      <Ionicons name="checkmark-circle-outline" size={20} color={WHITE} />
                      <Text style={s.postBtnTxt}>Post Job</Text>
                    </>
                }
              </TouchableOpacity>
            )}
          </View>

          {error && (
            <View style={s.errorContainer}>
              <Ionicons name="alert-circle-outline" size={18} color="#EF4444" />
              <Text style={s.errorText}>{typeof error === 'string' ? error : error.message || 'An error occurred'}</Text>
            </View>
          )}
        </ScrollView>

        {/* BOTTOM TAB BAR */}
        <SafeAreaView edges={['bottom']} style={s.tabSafe}>
          <View style={s.tabBar}>
            {TABS.map(tab => {
              const active = activeTab === tab.key;
              const isPost = tab.key === 'PostJob';
              return (
                <TouchableOpacity
                  key={tab.key}
                  style={s.tabItem}
                  onPress={() => handleTabPress(tab.key)}
                  activeOpacity={0.7}
                >
                  {active && <View style={s.tabActiveBar} />}
                  {isPost ? (
                    <View style={s.tabFab}>
                      <Ionicons name={active ? tab.icon : tab.iconOutline} size={22} color={WHITE} />
                    </View>
                  ) : (
                    <View style={s.tabIconWrap}>
                      <Ionicons name={active ? tab.icon : tab.iconOutline} size={23} color={active ? BLUE : TEXT_LIGHT} />
                    </View>
                  )}
                  <Text style={[s.tabLabel, active && s.tabLabelActive, isPost && s.tabLabelPost]}>
                    {tab.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </SafeAreaView>
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: WHITE },
  root: { flex: 1, backgroundColor: BG },

  topbar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingVertical: 12, backgroundColor: NAVY,
  },
  topbarLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  logoBox: {
    width: 32, height: 32, backgroundColor: GOLD, borderRadius: 9,
    alignItems: 'center', justifyContent: 'center',
  },
  topbarBrand: { fontSize: 15, fontWeight: '800', color: WHITE, letterSpacing: -0.2 },
  topbarTagline: { fontSize: 9, fontWeight: '500', color: GOLD_LT, letterSpacing: 1.4, textTransform: 'uppercase', marginTop: 1 },
  postingsBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 12, paddingVertical: 7,
    borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.1)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)',
  },
  postingsBtnText: { fontSize: 12, fontWeight: '600', color: WHITE },

  scroll: { padding: 16, paddingBottom: 40 },

  stepHeader: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    marginBottom: 16,
  },
  stepHeaderIcon: {
    width: 40, height: 40, borderRadius: 12,
    backgroundColor: 'rgba(0,85,165,0.08)',
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: 'rgba(0,85,165,0.15)',
  },
  stepHeaderNum:   { fontSize: 11, color: TEXT_LIGHT, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5 },
  stepHeaderTitle: { fontSize: 20, fontWeight: '800', color: TEXT_MAIN, marginTop: 1 },

  navRow: { flexDirection: 'row', gap: 12, marginTop: 24, alignItems: 'center' },
  backNavBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    paddingVertical: 14, borderRadius: 12,
    borderWidth: 1.5, borderColor: BORDER, backgroundColor: WHITE,
  },
  backNavBtnTxt: { fontSize: 15, fontWeight: '600', color: BLUE },
  nextBtn: {
    flex: 2, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    paddingVertical: 14, borderRadius: 12,
    backgroundColor: BLUE,
    shadowColor: BLUE, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25, shadowRadius: 12, elevation: 4,
  },
  nextBtnTxt: { fontSize: 15, fontWeight: '700', color: WHITE },
  postBtn: {
    flex: 2, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    paddingVertical: 14, borderRadius: 12,
    backgroundColor: GREEN,
    shadowColor: GREEN, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, shadowRadius: 12, elevation: 4,
  },
  postBtnTxt: { fontSize: 15, fontWeight: '700', color: WHITE },

  errorContainer: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: '#FEF2F2', padding: 12, borderRadius: 10,
    marginTop: 12, borderWidth: 1, borderColor: '#FECACA',
  },
  errorText: { flex: 1, fontSize: 13, color: '#991B1B', lineHeight: 18 },

  datePickerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: WHITE,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: BORDER,
    paddingHorizontal: 14,
    paddingVertical: 13,
  },
  datePickerText: {
    flex: 1,
    fontSize: 14,
    color: TEXT_MAIN,
  },

  tabSafe: { backgroundColor: WHITE },
  tabBar: {
    flexDirection: 'row', backgroundColor: WHITE,
    borderTopWidth: 1.5, borderTopColor: BORDER,
    paddingTop: 6, paddingBottom: 4, paddingHorizontal: 8,
  },
  tabItem: {
    flex: 1, alignItems: 'center', justifyContent: 'flex-start',
    paddingVertical: 4, position: 'relative',
  },
  tabActiveBar: {
    position: 'absolute', top: 0,
    width: 24, height: 3,
    backgroundColor: BLUE, borderRadius: 999,
  },
  tabIconWrap: { position: 'relative', marginBottom: 3, marginTop: 6 },
  tabFab: {
    width: 44, height: 36, borderRadius: 12,
    backgroundColor: GOLD,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 3, marginTop: 2,
    shadowColor: GOLD_DK,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.28, shadowRadius: 5, elevation: 3,
    borderWidth: 1, borderColor: GOLD_LT,
  },
  tabLabel:     { fontSize: 10, color: TEXT_LIGHT, fontWeight: '500' },
  tabLabelActive: { color: BLUE, fontWeight: '700' },
  tabLabelPost: { color: GOLD, fontWeight: '700' },

  // ── Selection Modal Styles ──────────────────────────────────────────────
  selectionOverlay: {
    flex: 1,
    backgroundColor: 'rgba(7,26,62,0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  selectionContainer: {
    backgroundColor: WHITE,
    borderRadius: 20,
    width: '100%',
    maxWidth: 400,
    maxHeight: '80%',
    padding: 20,
    borderWidth: 1.5,
    borderColor: BORDER,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 12,
  },
  selectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  selectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: TEXT_MAIN,
  },
  selectionSearchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: BG,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1.5,
    borderColor: BORDER,
    marginBottom: 12,
  },
  selectionSearchInput: {
    flex: 1,
    fontSize: 14,
    color: TEXT_MAIN,
    paddingVertical: 6,
    paddingHorizontal: 8,
  },
  selectionList: {
    paddingVertical: 4,
  },
  selectionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
  },
  selectionItemActive: {
    backgroundColor: `${BLUE}5`,
  },
  selectionItemText: {
    fontSize: 14,
    color: TEXT_MAIN,
    flex: 1,
  },
  selectionItemTextActive: {
    color: BLUE,
    fontWeight: '600',
  },
  selectionEmpty: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  selectionEmptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: TEXT_MUTED,
    marginTop: 12,
  },
  selectionEmptySub: {
    fontSize: 13,
    color: TEXT_LIGHT,
    marginTop: 4,
  },
  selectionCloseBtn: {
    marginTop: 12,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: BORDER,
  },
  selectionCloseBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: TEXT_MUTED,
  },
  selectionCustomOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    backgroundColor: `${BLUE}5`,
    borderRadius: 10,
    marginBottom: 8,
    borderWidth: 1.5,
    borderColor: BLUE,
    borderStyle: 'dashed',
  },
  selectionCustomText: {
    flex: 1,
    fontSize: 14,
    color: BLUE,
    fontWeight: '500',
    marginLeft: 8,
  },
  selectionCustomBadge: {
    backgroundColor: BLUE,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  selectionCustomBadgeText: {
    fontSize: 10,
    color: WHITE,
    fontWeight: '600',
  },
});