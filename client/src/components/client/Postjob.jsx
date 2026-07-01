import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  ScrollView, TextInput, Alert, ActivityIndicator,
  Switch, BackHandler, Platform, Modal, Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useDispatch, useSelector } from 'react-redux';
import { createJob } from '../../Redux/slices/jobSlice';
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
const BORDER     = '#DCE6F2';
const BORDER_SOFT= '#EAF0F8';
const GREEN      = '#059669';
const GREEN_SOFT = '#D1FAE5';
const GREEN_MID  = '#86EFAC';
const GREEN_DARK = '#059669';
const RED        = '#EF4444';
// ─────────────────────────────────────────────────────────────────────────────

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
  { label: 'Contract',    value: 'contract',    icon: 'document-text-outline'  },
  { label: 'One Time',    value: 'one_time',    icon: 'flash-outline'          },
  { label: 'Internship',  value: 'internship',  icon: 'school-outline'         },
  { label: 'Freelance',   value: 'freelance',   icon: 'person-outline'         },
];

const WORK_SETUPS = [
  { label: 'Remote', value: 'remote', icon: 'wifi-outline'          },
  { label: 'Onsite', value: 'onsite', icon: 'business-outline'      },
  { label: 'Hybrid', value: 'hybrid', icon: 'phone-portrait-outline'},
];

const URGENCY_LEVELS = [
  { label: 'Low',       value: 'low',       icon: 'thermometer-outline',  color: '#10B981' },
  { label: 'Normal',    value: 'normal',    icon: 'thermometer-outline',  color: '#F59E0B' },
  { label: 'Urgent',    value: 'urgent',    icon: 'flame-outline',        color: '#EF4444' },
  { label: 'Immediate', value: 'immediate', icon: 'alert-circle-outline', color: '#DC2626' },
];

const EXPERIENCE_LEVELS = [
  { label: 'Entry',        value: 'entry',        icon: 'star-outline'     },
  { label: 'Intermediate', value: 'intermediate', icon: 'star-half-outline'},
  { label: 'Expert',       value: 'expert',       icon: 'star-outline'     },
  { label: 'Senior',       value: 'senior',       icon: 'trophy-outline'   },
  { label: 'Lead',         value: 'lead',         icon: 'people-outline'   },
  { label: 'Director',     value: 'director',     icon: 'business-outline' },
];

const BUDGET_TYPES = [
  { label: 'Fixed Price', value: 'fixed',  icon: 'cash-outline' },
  { label: 'Hourly Rate', value: 'hourly', icon: 'time-outline' },
];

const PAYMENT_FREQUENCIES = [
  { label: 'Hourly',    value: 'hourly',    icon: 'time-outline'     },
  { label: 'Daily',     value: 'daily',     icon: 'sunny-outline'    },
  { label: 'Weekly',    value: 'weekly',    icon: 'calendar-outline' },
  { label: 'Bi-Weekly', value: 'bi-weekly', icon: 'calendar-outline' },
  { label: 'Monthly',   value: 'monthly',   icon: 'calendar-outline' },
  { label: 'One-Time',  value: 'one-time',  icon: 'flash-outline'    },
];

const CURRENCIES = [
  { label: 'PHP · Philippine Peso', value: 'PHP', symbol: '₱' },
  { label: 'USD · US Dollar',       value: 'USD', symbol: '$' },
  { label: 'EUR · Euro',            value: 'EUR', symbol: '€' },
  { label: 'GBP · British Pound',   value: 'GBP', symbol: '£' },
];

const CONTACT_PREFERENCES = [
  { label: 'Chat',  value: 'chat',  icon: 'chatbubble-outline' },
  { label: 'Email', value: 'email', icon: 'mail-outline'       },
  { label: 'Phone', value: 'phone', icon: 'call-outline'       },
];

const BENEFITS_OPTIONS = [
  { label: 'Health Insurance',       value: 'health_insurance',       icon: 'medkit-outline'    },
  { label: 'Paid Time Off',          value: 'paid_time_off',          icon: 'calendar-outline'  },
  { label: 'Remote Stipend',         value: 'remote_stipend',         icon: 'wifi-outline'      },
  { label: 'Equipment Provided',     value: 'equipment_provided',     icon: 'desktop-outline'   },
  { label: 'Bonus Eligible',         value: 'bonus_eligible',         icon: 'gift-outline'      },
  { label: 'Retirement Plan',        value: 'retirement_plan',        icon: 'shield-outline'    },
  { label: 'Professional Development', value: 'professional_development', icon: 'school-outline'},
];

const DEGREE_LEVELS = [
  { label: 'None',        value: 'none',        icon: 'close-circle-outline' },
  { label: 'High School', value: 'high_school', icon: 'book-outline'         },
  { label: 'Associate',   value: 'associate',   icon: 'ribbon-outline'       },
  { label: 'Bachelor',    value: 'bachelor',    icon: 'school-outline'       },
  { label: 'Master',      value: 'master',      icon: 'school-outline'       },
  { label: 'Doctorate',   value: 'doctorate',   icon: 'trophy-outline'       },
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

const STEPS = [
  { key: 1, label: 'Job Details',   icon: 'document-text-outline' },
  { key: 2, label: 'Requirements',  icon: 'settings-outline'      },
  { key: 3, label: 'Review & Post', icon: 'checkmark-circle-outline' },
];

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
              <Text style={[sb.label, active && sb.labelActive, done && sb.labelDone]} numberOfLines={1}>
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
    paddingHorizontal: 20, paddingVertical: 18,
    backgroundColor: WHITE,
    borderBottomWidth: 1, borderBottomColor: BORDER_SOFT,
  },
  stepWrap: { alignItems: 'center', gap: 7, width: 72 },
  circle: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: BG, borderWidth: 2, borderColor: BORDER,
    alignItems: 'center', justifyContent: 'center',
  },
  circleActive: {
    borderColor: BLUE, backgroundColor: BLUE,
    shadowColor: BLUE, shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3, shadowRadius: 6, elevation: 3,
  },
  circleDone:   { borderColor: GREEN, backgroundColor: GREEN },
  num:      { fontSize: 13, fontWeight: '700', color: TEXT_LIGHT },
  numActive:{ color: WHITE },
  numDone:  { color: WHITE },
  label:      { fontSize: 10, fontWeight: '600', color: TEXT_LIGHT, textAlign: 'center' },
  labelActive:{ color: BLUE,  fontWeight: '700' },
  labelDone:  { color: GREEN, fontWeight: '600' },
  line: {
    flex: 1, height: 2, backgroundColor: BORDER,
    marginTop: 15, marginHorizontal: -4, borderRadius: 1,
  },
  lineDone: { backgroundColor: GREEN },
});

// ── Reusable Field Components ─────────────────────────────────────────────────
function FieldLabel({ label, required, hint }) {
  return (
    <View style={{ marginBottom: 8 }}>
      <Text style={f.label}>
        {label}{required && <Text style={{ color: RED }}> *</Text>}
      </Text>
      {hint ? <Text style={f.hint}>{hint}</Text> : null}
    </View>
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
            activeOpacity={0.75}
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

// ── Dropdown / Select ──────────────────────────────────────────────────────────
function Dropdown({ icon, options, value, onSelect, placeholder = 'Select an option' }) {
  const [open, setOpen] = useState(false);
  const selected = options.find(o => o.value === value);

  return (
    <View>
      <TouchableOpacity
        style={[dd.trigger, open && dd.triggerOpen]}
        onPress={() => setOpen(true)}
        activeOpacity={0.75}
      >
        {icon && (
          <Ionicons name={icon} size={16} color={selected ? BLUE : TEXT_LIGHT} style={{ marginRight: 10 }} />
        )}
        <Text style={[dd.triggerText, !selected && dd.placeholderText]} numberOfLines={1}>
          {selected ? selected.label : placeholder}
        </Text>
        <Ionicons name="chevron-down" size={16} color={TEXT_LIGHT} />
      </TouchableOpacity>

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable style={dd.overlay} onPress={() => setOpen(false)}>
          <Pressable style={dd.sheet} onPress={(e) => e.stopPropagation()}>
            <View style={dd.sheetHandle} />
            <Text style={dd.sheetTitle}>{placeholder}</Text>
            <ScrollView style={{ maxHeight: 340 }} showsVerticalScrollIndicator={false}>
              {options.map((opt) => {
                const active = opt.value === value;
                return (
                  <TouchableOpacity
                    key={opt.value}
                    style={[dd.item, active && dd.itemActive]}
                    onPress={() => { onSelect(opt.value); setOpen(false); }}
                    activeOpacity={0.7}
                  >
                    {opt.icon && (
                      <View style={[dd.itemIconBox, active && dd.itemIconBoxActive]}>
                        <Ionicons name={opt.icon} size={15} color={active ? WHITE : TEXT_MUTED} />
                      </View>
                    )}
                    <Text style={[dd.itemText, active && dd.itemTextActive]}>{opt.label}</Text>
                    {active && <Ionicons name="checkmark-circle" size={18} color={BLUE} />}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
            <TouchableOpacity style={dd.cancelBtn} onPress={() => setOpen(false)} activeOpacity={0.75}>
              <Text style={dd.cancelBtnTxt}>Cancel</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const dd = StyleSheet.create({
  trigger: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: WHITE, borderRadius: 12,
    borderWidth: 1.5, borderColor: BORDER,
    paddingHorizontal: 14, paddingVertical: 13,
  },
  triggerOpen: { borderColor: BLUE, backgroundColor: 'rgba(0,85,165,0.04)' },
  triggerText: { flex: 1, fontSize: 14, color: TEXT_MAIN, fontWeight: '500' },
  placeholderText: { color: TEXT_LIGHT, fontWeight: '400' },
  overlay: {
    flex: 1, backgroundColor: 'rgba(7,26,62,0.45)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: WHITE,
    borderTopLeftRadius: 22, borderTopRightRadius: 22,
    paddingHorizontal: 18, paddingTop: 10, paddingBottom: 24,
    shadowColor: NAVY, shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15, shadowRadius: 16, elevation: 12,
  },
  sheetHandle: {
    width: 40, height: 4, borderRadius: 2,
    backgroundColor: BORDER, alignSelf: 'center', marginBottom: 14,
  },
  sheetTitle: {
    fontSize: 13, fontWeight: '700', color: TEXT_LIGHT,
    textTransform: 'uppercase', letterSpacing: 0.6,
    marginBottom: 10, paddingHorizontal: 4,
  },
  item: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingVertical: 12, paddingHorizontal: 8,
    borderRadius: 12, marginBottom: 2,
  },
  itemActive: { backgroundColor: 'rgba(0,85,165,0.07)' },
  itemIconBox: {
    width: 28, height: 28, borderRadius: 8,
    backgroundColor: BG, alignItems: 'center', justifyContent: 'center',
  },
  itemIconBoxActive: { backgroundColor: BLUE },
  itemText: { flex: 1, fontSize: 14, color: TEXT_MAIN, fontWeight: '500' },
  itemTextActive: { color: BLUE, fontWeight: '700' },
  cancelBtn: {
    marginTop: 8, paddingVertical: 13, borderRadius: 12,
    alignItems: 'center', backgroundColor: BG,
  },
  cancelBtnTxt: { fontSize: 14, fontWeight: '700', color: TEXT_MUTED },
});

// ── Autocomplete text field ───────────────────────────────────────────────────
function AutocompleteField({ icon, placeholder, value, onChange, suggestions }) {
  const [focused, setFocused] = useState(false);
  const blurTimeout = useRef(null);

  const isExactMatch = suggestions.some(s => s.toLowerCase() === value.toLowerCase());
  const filtered = value.length > 0
    ? suggestions.filter(sug => sug.toLowerCase().includes(value.toLowerCase()))
    : suggestions;
  
  const showList = focused && !isExactMatch && filtered.length > 0;

  return (
    <View>
      <View style={[f.inputBox, focused && f.inputBoxFocused]}>
        {icon && <Ionicons name={icon} size={16} color={focused ? BLUE : TEXT_LIGHT} style={{ marginRight: 8 }} />}
        <TextInput
          style={f.inputText}
          placeholder={placeholder}
          placeholderTextColor={TEXT_LIGHT}
          value={value}
          onChangeText={onChange}
          onFocus={() => {
            if (blurTimeout.current) clearTimeout(blurTimeout.current);
            setFocused(true);
          }}
          onBlur={() => {
            blurTimeout.current = setTimeout(() => setFocused(false), 300);
          }}
        />
        {value.length > 0 && (
          <TouchableOpacity onPress={() => onChange('')} hitSlop={8}>
            <Ionicons name="close-circle" size={16} color={TEXT_LIGHT} />
          </TouchableOpacity>
        )}
      </View>
      {showList && (
        <View style={s.suggestionContainer}>
          <ScrollView
            style={{ maxHeight: 176 }}
            showsVerticalScrollIndicator={true}
            keyboardShouldPersistTaps="handled"
            nestedScrollEnabled
          >
            {filtered.slice(0, 10).map((suggestion) => (
              <TouchableOpacity
                key={suggestion}
                style={s.suggestionItem}
                onPress={() => {
                  onChange(suggestion);
                  setFocused(false);
                }}
                activeOpacity={0.7}
              >
                <Ionicons name="bulb-outline" size={15} color={GOLD} />
                <Text style={s.suggestionText}>{suggestion}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}
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
            returnKeyType="done"
          />
        </View>
        <TouchableOpacity style={f.addBtn} onPress={onAdd} activeOpacity={0.8}>
          <Ionicons name="add" size={18} color={WHITE} />
        </TouchableOpacity>
      </View>
      {tags.length > 0 && (
        <View style={f.tagWrap}>
          {tags.map((tag, i) => {
            const tagLabel = typeof tag === 'object' ? `${tag.language} (${tag.proficiency})` : tag;
            const tagValue = typeof tag === 'object' ? i : tag;
            return (
              <View key={i} style={f.tag}>
                <Text style={f.tagTxt}>{tagLabel}</Text>
                <TouchableOpacity onPress={() => onRemove(tagValue)} hitSlop={6}>
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

// ── FIXED InputBox component ───────────────────────────────────────────────────
function InputBox({ icon, placeholder, value, onChange, multiline, keyboardType, onFocus, onBlur }) {
  const [focused, setFocused] = useState(false);
  return (
    <View style={[
      f.inputBox,
      multiline && { alignItems: 'flex-start', minHeight: 120, paddingVertical: 6 },
      focused && f.inputBoxFocused,
    ]}>
      {icon && <Ionicons name={icon} size={16} color={focused ? BLUE : TEXT_LIGHT} style={[{ marginRight: 8 }, multiline && { marginTop: 6 }]} />}
      <TextInput
        style={[
          f.inputText, 
          multiline && { 
            textAlignVertical: 'top', 
            paddingTop: 8, 
            paddingBottom: 8,
            minHeight: 80,
            flex: 1,
            height: '100%',
          }
        ]}
        placeholder={placeholder}
        placeholderTextColor={TEXT_LIGHT}
        value={value}
        onChangeText={onChange}
        multiline={multiline}
        keyboardType={keyboardType}
        onFocus={(e) => { setFocused(true); onFocus && onFocus(e); }}
        onBlur={(e) => { setFocused(false); onBlur && onBlur(e); }}
      />
    </View>
  );
}

function SectionCard({ title, icon, children }) {
  return (
    <View style={f.sectionCard}>
      <View style={f.sectionAccent} />
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
  label:   { fontSize: 12, fontWeight: '700', color: TEXT_MUTED, textTransform: 'uppercase', letterSpacing: 0.6 },
  hint:    { fontSize: 11, color: TEXT_LIGHT, marginTop: 2, fontWeight: '400' },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 12, paddingVertical: 8,
    borderRadius: 10, borderWidth: 1.5, borderColor: BORDER,
    backgroundColor: WHITE,
  },
  chipActive:   {
    borderColor: BLUE, backgroundColor: 'rgba(0,85,165,0.07)',
    shadowColor: BLUE, shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.12, shadowRadius: 3, elevation: 1,
  },
  chipTxt:      { fontSize: 12, color: TEXT_MUTED, fontWeight: '500' },
  tagInputRow:  { flexDirection: 'row', gap: 8, alignItems: 'center' },
  inputBox: {
    flex: 1, 
    flexDirection: 'row', 
    alignItems: 'center',
    backgroundColor: WHITE, 
    borderRadius: 12,
    borderWidth: 1.5, 
    borderColor: BORDER,
    paddingHorizontal: 14,
    paddingVertical: 2,
  },
  inputBoxFocused: {
    borderColor: BLUE,
    shadowColor: BLUE, 
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.12, 
    shadowRadius: 5, 
    elevation: 1,
  },
  inputText: { 
    flex: 1, 
    fontSize: 14, 
    color: TEXT_MAIN, 
    paddingVertical: 10,
  },
  addBtn: {
    width: 44, height: 44, borderRadius: 12,
    backgroundColor: BLUE, alignItems: 'center', justifyContent: 'center',
    shadowColor: BLUE, shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2, shadowRadius: 5, elevation: 2,
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
    marginBottom: 16, borderWidth: 1, borderColor: BORDER_SOFT,
    shadowColor: NAVY, shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05, shadowRadius: 10, elevation: 2,
    overflow: 'hidden',
  },
  sectionAccent: {
    position: 'absolute', left: 0, top: 0, bottom: 0, width: 3,
    backgroundColor: BLUE, opacity: 0.85,
  },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 18 },
  sectionIconBox: {
    width: 30, height: 30, borderRadius: 8,
    backgroundColor: 'rgba(0,85,165,0.08)',
    alignItems: 'center', justifyContent: 'center',
  },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: TEXT_MAIN, letterSpacing: -0.1 },
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
}) {
  return (
    <View>
      <SectionCard title="Job Information" icon="briefcase-outline">
        <View style={{ gap: 16 }}>
          <View>
            <FieldLabel label="Job Title" required />
            <AutocompleteField
              icon="briefcase-outline"
              placeholder="e.g. Senior React Native Developer"
              value={title}
              onChange={setTitle}
              suggestions={SUGGESTED_TITLES}
            />
          </View>

          <View>
            <FieldLabel label="Category" required />
            <AutocompleteField
              icon="grid-outline"
              placeholder="e.g. Technology, Design, Marketing"
              value={category}
              onChange={setCategory}
              suggestions={SUGGESTED_CATEGORIES}
            />
          </View>

          <View>
            <FieldLabel label="Description" required hint="Responsibilities, deliverables, and expectations" />
            <InputBox
              icon="document-text-outline"
              placeholder="Describe responsibilities, deliverables, and expectations..."
              value={description}
              onChange={setDescription}
              multiline
            />
          </View>
        </View>
      </SectionCard>

      <SectionCard title="Required Skills" icon="code-slash-outline">
        <View style={{ gap: 12 }}>
          <TagInput
            tags={requiredSkills}
            value={skillInput}
            onChange={setSkillInput}
            onAdd={() => {
              if (skillInput.trim() && !requiredSkills.includes(skillInput.trim())) {
                setRequiredSkills([...requiredSkills, skillInput.trim()]);
                setSkillInput('');
              }
            }}
            onRemove={(s) => setRequiredSkills(requiredSkills.filter(x => x !== s))}
            placeholder="Add a skill..."
            icon="add-circle-outline"
          />
          <View>
            <Text style={{ fontSize: 11, color: TEXT_LIGHT, marginBottom: 8, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 }}>Suggested</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
              {SKILLS_SUGGESTIONS.slice(0, 10).map(s => (
                <TouchableOpacity
                  key={s}
                  style={[f.chip, { paddingHorizontal: 10, paddingVertical: 6 }, requiredSkills.includes(s) && f.chipActive]}
                  onPress={() => {
                    if (!requiredSkills.includes(s)) setRequiredSkills([...requiredSkills, s]);
                  }}
                  activeOpacity={0.75}
                >
                  <Text style={[{ fontSize: 11, color: TEXT_LIGHT }, requiredSkills.includes(s) && { color: BLUE, fontWeight: '700' }]}>{s}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>
      </SectionCard>

      <SectionCard title="Job Type" icon="layers-outline">
        <View style={{ gap: 16 }}>
          <View>
            <FieldLabel label="Employment Type" />
            <Dropdown
              icon="briefcase-outline"
              options={JOB_TYPES}
              value={jobType}
              onSelect={setJobType}
              placeholder="Select employment type"
            />
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
    </View>
  );
}

// ── Step 2: Requirements & Budget ─────────────────────────────────────────────
function Step2({
  budgetType, setBudgetType,
  budgetAmount, setBudgetAmount,
  estimatedDuration, setEstimatedDuration,
  urgencyLevel, setUrgencyLevel,
  experienceLevel, setExperienceLevel,
  payInformation, setPayInformation,
  location, setLocation,
  workSetup,
  educationRequirements, setEducationRequirements,
  requirements, setRequirements,
  applicationSettings, setApplicationSettings,
  certificationInput, setCertificationInput,
  toolInput, setToolInput,
  languageInput, setLanguageInput,
}) {
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [showDeadlineDate, setShowDeadlineDate] = useState(false);

  const toggleBenefit = (b) => {
    setPayInformation({
      ...payInformation,
      benefits: payInformation.benefits.includes(b)
        ? payInformation.benefits.filter(x => x !== b)
        : [...payInformation.benefits, b],
    });
  };

  const formatDateDisplay = (date) => {
    if (!date) return 'Select date';
    return new Date(date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  return (
    <View>
      <SectionCard title="Budget & Timeline" icon="cash-outline">
        <View style={{ gap: 16 }}>
          <View>
            <FieldLabel label="Budget Type" />
            <ChipRow options={BUDGET_TYPES} selected={budgetType} onSelect={setBudgetType} />
          </View>
          <View>
            <FieldLabel label={`Budget Amount (${budgetType === 'hourly' ? 'per hour' : 'fixed total'})`} required />
            <InputBox
              icon="wallet-outline"
              placeholder={budgetType === 'hourly' ? 'e.g. 500' : 'e.g. 25000'}
              value={budgetAmount}
              onChange={setBudgetAmount}
              keyboardType="numeric"
            />
          </View>
          <View>
            <FieldLabel label="Estimated Duration" />
            <InputBox
              icon="hourglass-outline"
              placeholder="e.g. 2 weeks, 1 month"
              value={estimatedDuration}
              onChange={setEstimatedDuration}
            />
          </View>
        </View>
      </SectionCard>

      <SectionCard title="Candidate Requirements" icon="person-circle-outline">
        <View style={{ gap: 16 }}>
          <View>
            <FieldLabel label="Urgency Level" />
            <ChipRow options={URGENCY_LEVELS} selected={urgencyLevel} onSelect={setUrgencyLevel} />
          </View>
          <View>
            <FieldLabel label="Experience Level" />
            <Dropdown
              icon="trophy-outline"
              options={EXPERIENCE_LEVELS}
              value={experienceLevel}
              onSelect={setExperienceLevel}
              placeholder="Select experience level"
            />
          </View>
        </View>
      </SectionCard>

      {/* Advanced Toggle */}
      <TouchableOpacity
        style={adv.toggle}
        onPress={() => setShowAdvanced(!showAdvanced)}
        activeOpacity={0.75}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Ionicons name="options-outline" size={16} color={BLUE} />
          <Text style={adv.toggleTxt}>Advanced Options</Text>
        </View>
        <View style={[adv.badge, showAdvanced && adv.badgeOpen]}>
          <Ionicons name={showAdvanced ? 'chevron-up' : 'chevron-down'} size={14} color={showAdvanced ? WHITE : BLUE} />
        </View>
      </TouchableOpacity>

      {showAdvanced && (
        <>
          {/* Pay Information */}
          <SectionCard title="Pay Information" icon="receipt-outline">
            <View style={{ gap: 16 }}>
              <View>
                <FieldLabel label="Salary Range (Optional)" />
                <View style={{ flexDirection: 'row', gap: 10 }}>
                  <View style={{ flex: 1 }}>
                    <InputBox placeholder="Min" value={payInformation.salary_range.min}
                      onChange={(t) => setPayInformation({ ...payInformation, salary_range: { ...payInformation.salary_range, min: t } })}
                      keyboardType="numeric" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <InputBox placeholder="Max" value={payInformation.salary_range.max}
                      onChange={(t) => setPayInformation({ ...payInformation, salary_range: { ...payInformation.salary_range, max: t } })}
                      keyboardType="numeric" />
                  </View>
                </View>
              </View>
              <View>
                <FieldLabel label="Currency" />
                <Dropdown
                  icon="cash-outline"
                  options={CURRENCIES}
                  value={payInformation.salary_range.currency}
                  onSelect={(v) => setPayInformation({ ...payInformation, salary_range: { ...payInformation.salary_range, currency: v } })}
                  placeholder="Select currency"
                />
              </View>
              <View>
                <FieldLabel label="Payment Frequency" />
                <Dropdown
                  icon="repeat-outline"
                  options={PAYMENT_FREQUENCIES}
                  value={payInformation.payment_frequency}
                  onSelect={(v) => setPayInformation({ ...payInformation, payment_frequency: v })}
                  placeholder="Select payment frequency"
                />
              </View>
              <View>
                <FieldLabel label="Benefits" />
                <ChipRow options={BENEFITS_OPTIONS} selected={payInformation.benefits} onSelect={toggleBenefit} isMulti />
              </View>
              <View style={adv.switchRow}>
                <Text style={adv.switchLabel}>Salary Negotiable</Text>
                <Switch
                  value={payInformation.negotiable}
                  onValueChange={(v) => setPayInformation({ ...payInformation, negotiable: v })}
                  trackColor={{ false: BORDER, true: GREEN_MID }}
                  thumbColor={payInformation.negotiable ? BLUE : WHITE}
                />
              </View>
            </View>
          </SectionCard>

          {/* Location */}
          {(workSetup === 'onsite' || workSetup === 'hybrid') && (
            <SectionCard title="Location" icon="location-outline">
              <View style={{ gap: 12 }}>
                <InputBox icon="map-outline" placeholder="Specific Area (e.g. Makati, Ortigas)"
                  value={location.specific_area}
                  onChange={(t) => setLocation({ ...location, specific_area: t })} />
                <InputBox icon="business-outline" placeholder="City"
                  value={location.city}
                  onChange={(t) => setLocation({ ...location, city: t })} />
                <InputBox icon="navigate-outline" placeholder="Full Work Address"
                  value={location.work_address}
                  onChange={(t) => setLocation({ ...location, work_address: t })} />
              </View>
            </SectionCard>
          )}

          {/* Requirements */}
          <SectionCard title="Detailed Requirements" icon="list-outline">
            <View style={{ gap: 16 }}>
              <View>
                <FieldLabel label="Minimum Years of Experience" />
                <InputBox icon="bar-chart-outline" placeholder="e.g. 2"
                  value={requirements.min_years_experience}
                  onChange={(t) => setRequirements({ ...requirements, min_years_experience: t })}
                  keyboardType="numeric" />
              </View>
              <View>
                <FieldLabel label="Preferred Tools" />
                <TagInput
                  tags={requirements.preferred_tools}
                  value={toolInput}
                  onChange={setToolInput}
                  onAdd={() => {
                    if (toolInput.trim() && !requirements.preferred_tools.includes(toolInput.trim())) {
                      setRequirements({ ...requirements, preferred_tools: [...requirements.preferred_tools, toolInput.trim()] });
                      setToolInput('');
                    }
                  }}
                  onRemove={(t) => setRequirements({ ...requirements, preferred_tools: requirements.preferred_tools.filter(x => x !== t) })}
                  placeholder="Add a tool..."
                />
              </View>
              <View>
                <FieldLabel label="Languages Required" />
                <View style={{ flexDirection: 'row', gap: 8, marginBottom: 8 }}>
                  <View style={{ flex: 2 }}>
                    <InputBox placeholder="Language" value={languageInput.language}
                      onChange={(t) => setLanguageInput({ ...languageInput, language: t })} />
                  </View>
                  <View style={{ flex: 1.5 }}>
                    <InputBox placeholder="Proficiency" value={languageInput.proficiency}
                      onChange={(t) => setLanguageInput({ ...languageInput, proficiency: t })} />
                  </View>
                  <TouchableOpacity style={f.addBtn} onPress={() => {
                    if (languageInput.language.trim()) {
                      setRequirements({ ...requirements, languages_required: [...requirements.languages_required, { ...languageInput }] });
                      setLanguageInput({ language: '', proficiency: 'professional' });
                    }
                  }} activeOpacity={0.8}>
                    <Ionicons name="add" size={18} color={WHITE} />
                  </TouchableOpacity>
                </View>
                {requirements.languages_required.length > 0 && (
                  <View style={f.tagWrap}>
                    {requirements.languages_required.map((lang, idx) => (
                      <View key={idx} style={f.tag}>
                        <Ionicons name="language-outline" size={12} color={BLUE} />
                        <Text style={f.tagTxt}>{lang.language} ({lang.proficiency})</Text>
                        <TouchableOpacity onPress={() => {
                          const arr = [...requirements.languages_required]; arr.splice(idx, 1);
                          setRequirements({ ...requirements, languages_required: arr });
                        }} hitSlop={6}>
                          <Ionicons name="close" size={13} color={BLUE} />
                        </TouchableOpacity>
                      </View>
                    ))}
                  </View>
                )}
              </View>
              <View>
                <FieldLabel label="Additional Requirements" />
                <InputBox placeholder="Any other requirements or special instructions..."
                  value={requirements.additional_requirements}
                  onChange={(t) => setRequirements({ ...requirements, additional_requirements: t })}
                  multiline />
              </View>
            </View>
          </SectionCard>

          {/* Education */}
          <SectionCard title="Education Requirements" icon="school-outline">
            <View style={{ gap: 16 }}>
              <View>
                <FieldLabel label="Minimum Degree" />
                <Dropdown
                  icon="school-outline"
                  options={DEGREE_LEVELS}
                  value={educationRequirements.minimum_degree}
                  onSelect={(v) => setEducationRequirements({ ...educationRequirements, minimum_degree: v })}
                  placeholder="Select minimum degree"
                />
              </View>
              <View>
                <FieldLabel label="Preferred Field of Study" />
                <InputBox icon="school-outline" placeholder="e.g. Computer Science, Business Administration"
                  value={educationRequirements.preferred_field}
                  onChange={(t) => setEducationRequirements({ ...educationRequirements, preferred_field: t })} />
              </View>
              <View>
                <FieldLabel label="Required Certifications" />
                <TagInput
                  tags={educationRequirements.required_certifications}
                  value={certificationInput}
                  onChange={setCertificationInput}
                  onAdd={() => {
                    if (certificationInput.trim()) {
                      setEducationRequirements({ ...educationRequirements, required_certifications: [...educationRequirements.required_certifications, certificationInput.trim()] });
                      setCertificationInput('');
                    }
                  }}
                  onRemove={(c) => setEducationRequirements({ ...educationRequirements, required_certifications: educationRequirements.required_certifications.filter(x => x !== c) })}
                  placeholder="Add a certification..."
                />
              </View>
              <View>
                <FieldLabel label="Years in Field" />
                <InputBox icon="time-outline" placeholder="e.g. 3"
                  value={educationRequirements.years_of_experience}
                  onChange={(t) => setEducationRequirements({ ...educationRequirements, years_of_experience: t })}
                  keyboardType="numeric" />
              </View>
            </View>
          </SectionCard>

          {/* Application Settings */}
          <SectionCard title="Application Settings" icon="settings-outline">
            <View style={{ gap: 16 }}>
              <View style={adv.switchRow}>
                <Text style={adv.switchLabel}>Auto Accept Applications</Text>
                <Switch
                  value={applicationSettings.auto_accept}
                  onValueChange={(v) => setApplicationSettings({ ...applicationSettings, auto_accept: v })}
                  trackColor={{ false: BORDER, true: GREEN_MID }}
                  thumbColor={applicationSettings.auto_accept ? BLUE : WHITE}
                />
              </View>
              <View>
                <FieldLabel label="Maximum Applicants" />
                <InputBox icon="people-outline" placeholder="100"
                  value={applicationSettings.max_applicants}
                  onChange={(t) => setApplicationSettings({ ...applicationSettings, max_applicants: t })}
                  keyboardType="numeric" />
              </View>
              <View>
                <FieldLabel label="Application Deadline (Optional)" />
                <TouchableOpacity
                  style={s.datePickerBtn}
                  onPress={() => setShowDeadlineDate(true)}
                  activeOpacity={0.75}
                >
                  <Ionicons name="calendar-outline" size={18} color={BLUE} />
                  <Text style={s.datePickerText}>
                    {applicationSettings.application_deadline
                      ? formatDateDisplay(applicationSettings.application_deadline)
                      : 'Select deadline date'}
                  </Text>
                  <Ionicons name="chevron-forward" size={16} color={TEXT_LIGHT} />
                </TouchableOpacity>
                {showDeadlineDate && (
                  <DateTimePicker
                    value={applicationSettings.application_deadline ? new Date(applicationSettings.application_deadline) : new Date()}
                    mode="date"
                    display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                    onChange={(event, selectedDate) => {
                      setShowDeadlineDate(false);
                      if (selectedDate) {
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
        </>
      )}
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
  toggleTxt: { fontSize: 14, fontWeight: '700', color: BLUE },
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

function Step3({ title, description, requiredSkills, jobType, workSetup, urgencyLevel,
  experienceLevel, budgetType, budgetAmount, estimatedDuration, contactPreference,
  payInformation, location, requirements, educationRequirements, applicationSettings,
  category }) {

  const urgency = URGENCY_LEVELS.find(u => u.value === urgencyLevel);
  const experience = EXPERIENCE_LEVELS.find(e => e.value === experienceLevel);
  const currencySymbol = CURRENCIES.find(c => c.value === payInformation.salary_range.currency)?.symbol || '';

  return (
    <View>
      <View style={rv.hero}>
        <View style={rv.heroIcon}>
          <Ionicons name="briefcase" size={24} color={WHITE} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={rv.heroTitle}>{title || 'Untitled Job'}</Text>
          <View style={{ flexDirection: 'row', gap: 8, marginTop: 8, flexWrap: 'wrap' }}>
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
            {urgencyLevel && (
              <View style={[rv.badge, { backgroundColor: `${urgency?.color}22`, borderColor: `${urgency?.color}55` }]}>
                <Text style={[rv.badgeTxt, { color: WHITE }]}>{urgency?.label}</Text>
              </View>
            )}
            {experienceLevel && (
              <View style={rv.badge}>
                <Text style={rv.badgeTxt}>{experience?.label}</Text>
              </View>
            )}
          </View>
        </View>
      </View>

      <SectionCard title="Job Details" icon="document-text-outline">
        <View style={{ gap: 12 }}>
          <ReviewRow icon="grid-outline" label="Category" value={category} />
          <ReviewRow icon="document-text-outline" label="Description" value={description?.substring(0, 120) + (description?.length > 120 ? '...' : '')} />
          {requiredSkills?.length > 0 && (
            <View style={rv.row}>
              <View style={rv.iconBox}><Ionicons name="code-slash-outline" size={14} color={BLUE} /></View>
              <View style={{ flex: 1 }}>
                <Text style={rv.rowLabel}>Required Skills</Text>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 4 }}>
                  {requiredSkills.map(s => (
                    <View key={s} style={[f.tag, { paddingVertical: 4 }]}>
                      <Text style={[f.tagTxt, { fontSize: 11 }]}>{s}</Text>
                    </View>
                  ))}
                </View>
              </View>
            </View>
          )}
          <ReviewRow icon="person-outline" label="Contact Preference" value={contactPreference} />
          {experienceLevel && <ReviewRow icon="trophy-outline" label="Experience Level" value={experience?.label} />}
        </View>
      </SectionCard>

      <SectionCard title="Budget & Payment" icon="cash-outline">
        <View style={{ gap: 12 }}>
          <ReviewRow icon="wallet-outline" label="Budget" value={budgetAmount ? `${currencySymbol}${budgetAmount} · ${BUDGET_TYPES.find(b => b.value === budgetType)?.label}` : null} />
          <ReviewRow icon="hourglass-outline" label="Duration" value={estimatedDuration} />
          {(payInformation.salary_range.min || payInformation.salary_range.max) && (
            <ReviewRow icon="receipt-outline" label="Salary Range"
              value={`${currencySymbol}${payInformation.salary_range.min || '?'} – ${currencySymbol}${payInformation.salary_range.max || '?'} / ${payInformation.payment_frequency}`} />
          )}
          {payInformation.benefits?.length > 0 && (
            <ReviewRow icon="gift-outline" label="Benefits" value={payInformation.benefits.length + ' benefit(s) included'} />
          )}
          {payInformation.negotiable && <ReviewRow icon="checkmark-circle-outline" label="Negotiable" value="Yes" accent={GREEN} />}
        </View>
      </SectionCard>

      {(requirements.min_years_experience || requirements.preferred_tools?.length > 0 ||
        requirements.languages_required?.length > 0 || requirements.additional_requirements ||
        educationRequirements.minimum_degree !== 'none') && (
        <SectionCard title="Requirements" icon="list-outline">
          <View style={{ gap: 12 }}>
            {requirements.min_years_experience ? <ReviewRow icon="bar-chart-outline" label="Min. Experience" value={`${requirements.min_years_experience} year(s)`} /> : null}
            {requirements.preferred_tools?.length > 0 && <ReviewRow icon="construct-outline" label="Preferred Tools" value={requirements.preferred_tools.join(', ')} />}
            {requirements.languages_required?.length > 0 && <ReviewRow icon="language-outline" label="Languages" value={requirements.languages_required.map(l => `${l.language} (${l.proficiency})`).join(', ')} />}
            {educationRequirements.minimum_degree && educationRequirements.minimum_degree !== 'none' && (
              <ReviewRow icon="school-outline" label="Minimum Degree" value={DEGREE_LEVELS.find(d => d.value === educationRequirements.minimum_degree)?.label} />
            )}
            {educationRequirements.preferred_field && <ReviewRow icon="ribbon-outline" label="Preferred Field" value={educationRequirements.preferred_field} />}
          </View>
        </SectionCard>
      )}

      {(workSetup === 'onsite' || workSetup === 'hybrid') && location.specific_area && (
        <SectionCard title="Location" icon="location-outline">
          <View style={{ gap: 12 }}>
            <ReviewRow icon="map-outline" label="Area" value={location.specific_area} />
            <ReviewRow icon="business-outline" label="City" value={location.city} />
            <ReviewRow icon="navigate-outline" label="Address" value={location.work_address} />
          </View>
        </SectionCard>
      )}

      {applicationSettings.application_deadline && (
        <SectionCard title="Application Settings" icon="settings-outline">
          <View style={{ gap: 12 }}>
            <ReviewRow icon="people-outline" label="Max Applicants" value={applicationSettings.max_applicants} />
            <ReviewRow icon="checkmark-circle-outline" label="Auto Accept" value={applicationSettings.auto_accept ? 'Yes' : 'No'} />
            <ReviewRow icon="calendar-outline" label="Deadline" value={new Date(applicationSettings.application_deadline).toLocaleDateString()} />
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
    backgroundColor: NAVY, borderRadius: 18, padding: 20, marginBottom: 16,
    shadowColor: NAVY, shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25, shadowRadius: 14, elevation: 5,
  },
  heroIcon: {
    width: 48, height: 48, borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.16)',
  },
  heroTitle: { fontSize: 18, fontWeight: '800', color: WHITE, lineHeight: 24, letterSpacing: -0.2 },
  badge: {
    paddingHorizontal: 9, paddingVertical: 4,
    borderRadius: 7, backgroundColor: 'rgba(255,255,255,0.12)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)',
  },
  badgeTxt: { fontSize: 10, color: 'rgba(255,255,255,0.9)', fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.3 },
  row: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  iconBox: {
    width: 28, height: 28, borderRadius: 7,
    backgroundColor: BG, alignItems: 'center', justifyContent: 'center', marginTop: 1,
  },
  rowLabel: { fontSize: 10, color: TEXT_LIGHT, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.4 },
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
  const { isLoading, error } = useSelector((state) => state.jobs);
  const { token } = useSelector((state) => state.auth);

  const [activeTab, setActiveTab] = useState('PostJob');
  const [currentStep, setCurrentStep] = useState(1);

  // Basic
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [requiredSkills, setRequiredSkills] = useState([]);
  const [skillInput, setSkillInput] = useState('');
  const [jobType, setJobType] = useState('one_time');
  const [workSetup, setWorkSetup] = useState('remote');
  const [urgencyLevel, setUrgencyLevel] = useState('normal');
  const [experienceLevel, setExperienceLevel] = useState('');
  const [budgetType, setBudgetType] = useState('fixed');
  const [budgetAmount, setBudgetAmount] = useState('');
  const [estimatedDuration, setEstimatedDuration] = useState('');
  const [contactPreference, setContactPreference] = useState('chat');

  // Pay
  const [payInformation, setPayInformation] = useState({
    salary_range: { min: '', max: '', currency: 'PHP' },
    payment_frequency: 'monthly',
    benefits: [],
    negotiable: false,
    display_pay: true,
  });

  // Location
  const [location, setLocation] = useState({
    address: '', city: '', state: '', country: 'Philippines',
    zip_code: '', specific_area: '', landmark: '', work_address: '',
  });

  // Education
  const [educationRequirements, setEducationRequirements] = useState({
    minimum_degree: 'none', preferred_field: '',
    required_certifications: [], years_of_experience: '',
  });
  const [certificationInput, setCertificationInput] = useState('');

  // Requirements
  const [requirements, setRequirements] = useState({
    min_years_experience: '', preferred_tools: [],
    languages_required: [], additional_requirements: '',
  });
  const [toolInput, setToolInput] = useState('');
  const [languageInput, setLanguageInput] = useState({ language: '', proficiency: 'professional' });

  // App Settings
  const [applicationSettings, setApplicationSettings] = useState({
    auto_accept: false, max_applicants: '100',
    application_deadline: '', questions_for_applicants: [],
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
    if (!budgetAmount || parseFloat(budgetAmount) <= 0) {
      Alert.alert('Missing Info', 'Please enter a valid budget amount');
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
    setTitle(''); setDescription(''); setCategory(''); setRequiredSkills([]); setBudgetAmount('');
    setEstimatedDuration(''); setJobType('one_time'); setWorkSetup('remote');
    setUrgencyLevel('normal'); setExperienceLevel(''); setBudgetType('fixed');
    setContactPreference('chat'); setSkillInput('');
    setPayInformation({ salary_range: { min: '', max: '', currency: 'PHP' }, payment_frequency: 'monthly', benefits: [], negotiable: false, display_pay: true });
    setLocation({ address: '', city: '', state: '', country: 'Philippines', zip_code: '', specific_area: '', landmark: '', work_address: '' });
    setEducationRequirements({ minimum_degree: 'none', preferred_field: '', required_certifications: [], years_of_experience: '' });
    setRequirements({ min_years_experience: '', preferred_tools: [], languages_required: [], additional_requirements: '' });
    setApplicationSettings({ auto_accept: false, max_applicants: '100', application_deadline: '', questions_for_applicants: [] });
    setCurrentStep(1);
  };

  const handlePost = async () => {
    if (!token) {
      Alert.alert('Error', 'You must be logged in to post a job');
      return;
    }

    const jobData = {
      title: title.trim(),
      description: description.trim(),
      category: category.trim(),
      required_skills: requiredSkills,
      job_type: jobType,
      work_setup: workSetup,
      urgency_level: urgencyLevel,
      experience_level: experienceLevel || null,
      budget_type: budgetType,
      budget_amount: parseFloat(budgetAmount),
      estimated_duration: estimatedDuration.trim() || null,
      contact_preference: contactPreference,
      pay_information: {
        salary_range: {
          min: payInformation.salary_range.min ? parseFloat(payInformation.salary_range.min) : null,
          max: payInformation.salary_range.max ? parseFloat(payInformation.salary_range.max) : null,
          currency: payInformation.salary_range.currency || 'PHP',
        },
        payment_frequency: payInformation.payment_frequency || 'monthly',
        benefits: payInformation.benefits || [],
        negotiable: payInformation.negotiable || false,
        display_pay: payInformation.display_pay !== undefined ? payInformation.display_pay : true,
      },
      location: {
        address: location.address || null,
        city: location.city || null,
        state: location.state || null,
        country: location.country || 'Philippines',
        zip_code: location.zip_code || null,
        specific_area: location.specific_area || null,
        landmark: location.landmark || null,
        work_address: location.work_address || null,
      },
      education_requirements: {
        minimum_degree: educationRequirements.minimum_degree || 'none',
        preferred_field: educationRequirements.preferred_field || null,
        required_certifications: educationRequirements.required_certifications || [],
        years_of_experience: parseInt(educationRequirements.years_of_experience) || 0,
      },
      requirements: {
        min_years_experience: parseInt(requirements.min_years_experience) || 0,
        preferred_tools: requirements.preferred_tools || [],
        languages_required: requirements.languages_required || [],
        additional_requirements: requirements.additional_requirements || null,
      },
      application_settings: {
        auto_accept: applicationSettings.auto_accept || false,
        max_applicants: parseInt(applicationSettings.max_applicants) || 100,
        application_deadline: applicationSettings.application_deadline || null,
        questions_for_applicants: applicationSettings.questions_for_applicants || [],
      },
    };

    try {
      const result = await dispatch(createJob(jobData)).unwrap();

      if (result && result.job) {
        Alert.alert('Posted!', 'Your job is now live.', [
          { text: 'View My Postings', onPress: () => { resetForm(); onNavigate('Mypostings'); } },
          { text: 'Post Another',     onPress: () => resetForm() },
          { text: 'Dashboard',        onPress: () => { resetForm(); onNavigate('ClientDashboard'); } },
        ]);
      } else {
        Alert.alert('Success', 'Your job has been posted successfully!');
        resetForm();
        onNavigate('ClientDashboard');
      }
    } catch (error) {
      console.error('Post job error:', error);
      Alert.alert('Error', error?.message || 'Failed to post job. Please try again.');
    }
  };

  const stepProps = {
    title, setTitle,
    description, setDescription,
    category, setCategory,
    requiredSkills, setRequiredSkills,
    skillInput, setSkillInput,
    jobType, setJobType,
    workSetup, setWorkSetup,
    urgencyLevel, setUrgencyLevel,
    experienceLevel, setExperienceLevel,
    budgetType, setBudgetType,
    budgetAmount, setBudgetAmount,
    estimatedDuration, setEstimatedDuration,
    contactPreference, setContactPreference,
    payInformation, setPayInformation,
    location, setLocation,
    educationRequirements, setEducationRequirements,
    requirements, setRequirements,
    applicationSettings, setApplicationSettings,
    certificationInput, setCertificationInput,
    toolInput, setToolInput,
    languageInput, setLanguageInput,
  };

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <View style={s.root}>

        {/* TOP BAR */}
        <View style={s.topbar}>
          <View style={s.topbarLeft}>
            <View style={s.logoBox}>
              <Ionicons name="flash-outline" size={16} color={NAVY} />
            </View>
            <View>
              <Text style={s.topbarBrand}>Taskra</Text>
              <Text style={s.topbarTagline}>Client Portal</Text>
            </View>
          </View>
          <TouchableOpacity style={s.postingsBtn} onPress={() => onNavigate('Mypostings')} activeOpacity={0.8}>
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
          {/* Step header */}
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

          {/* Navigation Buttons */}
          <View style={s.navRow}>
            {currentStep > 1 ? (
              <TouchableOpacity style={s.backNavBtn} onPress={handleBack} activeOpacity={0.8}>
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

          {/* Show error if any */}
          {error && (
            <View style={s.errorContainer}>
              <Ionicons name="alert-circle-outline" size={18} color={RED} />
              <Text style={s.errorText}>{typeof error === 'string' ? error : error.message || 'An error occurred'}</Text>
            </View>
          )}
        </ScrollView>

        {/* BOTTOM TAB BAR - Fixed position */}
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
    paddingHorizontal: 20, paddingVertical: 14, backgroundColor: NAVY,
    shadowColor: NAVY, shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2, shadowRadius: 8, elevation: 4,
  },
  topbarLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  logoBox: {
    width: 34, height: 34, backgroundColor: GOLD, borderRadius: 10,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: GOLD_DK, shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.35, shadowRadius: 4, elevation: 2,
  },
  topbarBrand: { fontSize: 16, fontWeight: '800', color: WHITE, letterSpacing: -0.3 },
  topbarTagline: { fontSize: 9, fontWeight: '600', color: GOLD_LT, letterSpacing: 1.4, textTransform: 'uppercase', marginTop: 1 },
  postingsBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 13, paddingVertical: 8,
    borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.1)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.18)',
  },
  postingsBtnText: { fontSize: 12, fontWeight: '700', color: WHITE },

  scroll: { padding: 16, paddingBottom: 20 },

  stepHeader: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    marginBottom: 18,
  },
  stepHeaderIcon: {
    width: 40, height: 40, borderRadius: 12,
    backgroundColor: 'rgba(0,85,165,0.08)',
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: 'rgba(0,85,165,0.15)',
  },
  stepHeaderNum:   { fontSize: 11, color: TEXT_LIGHT, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.6 },
  stepHeaderTitle: { fontSize: 20, fontWeight: '800', color: TEXT_MAIN, marginTop: 1, letterSpacing: -0.3 },

  navRow: { flexDirection: 'row', gap: 12, marginTop: 24, alignItems: 'center' },
  backNavBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    paddingVertical: 14, borderRadius: 12,
    borderWidth: 1.5, borderColor: BORDER, backgroundColor: WHITE,
  },
  backNavBtnTxt: { fontSize: 15, fontWeight: '700', color: BLUE },
  nextBtn: {
    flex: 2, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    paddingVertical: 14, borderRadius: 12,
    backgroundColor: BLUE,
    shadowColor: BLUE, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.28, shadowRadius: 12, elevation: 4,
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

  suggestionContainer: {
    backgroundColor: WHITE,
    borderWidth: 1.5,
    borderColor: BLUE,
    borderRadius: 12,
    marginTop: 6,
    maxHeight: 180,
    shadowColor: NAVY,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
    zIndex: 999,
    position: 'relative',
    overflow: 'hidden',
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: BORDER_SOFT,
    backgroundColor: WHITE,
  },
  suggestionText: {
    fontSize: 13,
    color: TEXT_MAIN,
    fontWeight: '500',
    flex: 1,
  },
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

  tabSafe: { 
    backgroundColor: WHITE,
    borderTopWidth: 1.5,
    borderTopColor: BORDER_SOFT,
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: WHITE,
    paddingTop: 6,
    paddingBottom: 4,
    paddingHorizontal: 8,
  },
  tabItem: {
    flex: 1, 
    alignItems: 'center', 
    justifyContent: 'flex-start',
    paddingVertical: 4, 
    position: 'relative',
  },
  tabActiveBar: {
    position: 'absolute', 
    top: 0,
    width: 24, 
    height: 3,
    backgroundColor: BLUE, 
    borderRadius: 999,
  },
  tabIconWrap: { 
    position: 'relative', 
    marginBottom: 3, 
    marginTop: 6 
  },
  tabFab: {
    width: 44, 
    height: 36, 
    borderRadius: 12,
    backgroundColor: GOLD,
    alignItems: 'center', 
    justifyContent: 'center',
    marginBottom: 3, 
    marginTop: 2,
    shadowColor: GOLD_DK,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.28, 
    shadowRadius: 5, 
    elevation: 3,
    borderWidth: 1, 
    borderColor: GOLD_LT,
  },
  tabLabel: { 
    fontSize: 10, 
    color: TEXT_LIGHT, 
    fontWeight: '600' 
  },
  tabLabelActive: { 
    color: BLUE, 
    fontWeight: '700' 
  },
  tabLabelPost: { 
    color: GOLD, 
    fontWeight: '700' 
  },
});