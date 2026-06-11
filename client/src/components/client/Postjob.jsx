import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  ScrollView, TextInput, Alert, ActivityIndicator,
  Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useDispatch, useSelector } from 'react-redux';
import { createJob } from '../../Redux/slices/jobSlice';

// ── Design Tokens ─────────────────────────────────────────────────────────────
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
// ─────────────────────────────────────────────────────────────────────────────

const TABS = [
  { key: 'Home',          label: 'Home',     icon: 'home',          iconOutline: 'home-outline'          },
  { key: 'PostJob',       label: 'Post Job', icon: 'add-circle',    iconOutline: 'add-circle-outline'    },
  { key: 'Hiredtalents',  label: 'Hired',    icon: 'people',        iconOutline: 'people-outline'        },
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
  { label: 'Entry',        value: 'Entry',        icon: 'star-outline'     },
  { label: 'Intermediate', value: 'Intermediate', icon: 'star-half-outline'},
  { label: 'Expert',       value: 'Expert',       icon: 'star-outline'     },
  { label: 'Senior',       value: 'Senior',       icon: 'trophy-outline'   },
  { label: 'Lead',         value: 'Lead',         icon: 'people-outline'   },
  { label: 'Director',     value: 'Director',     icon: 'business-outline' },
];

const BUDGET_TYPES = [
  { label: 'Fixed Price', value: 'fixed',  icon: 'cash-outline' },
  { label: 'Hourly Rate', value: 'hourly', icon: 'time-outline' },
];

const PAYMENT_FREQUENCIES = [
  { label: 'Hourly',    value: 'hourly'    },
  { label: 'Daily',     value: 'daily'     },
  { label: 'Weekly',    value: 'weekly'    },
  { label: 'Bi-Weekly', value: 'bi-weekly' },
  { label: 'Monthly',   value: 'monthly'   },
  { label: 'One-Time',  value: 'one-time'  },
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

const BENEFITS_OPTIONS = [
  { label: 'Health Insurance',       value: 'health_insurance',       icon: 'medkit-outline'    },
  { label: 'Paid Time Off',          value: 'paid_time_off',          icon: 'beach-outline'     },
  { label: 'Remote Stipend',         value: 'remote_stipend',         icon: 'wifi-outline'      },
  { label: 'Equipment Provided',     value: 'equipment_provided',     icon: 'desktop-outline'   },
  { label: 'Bonus Eligible',         value: 'bonus_eligible',         icon: 'gift-outline'      },
  { label: 'Retirement Plan',        value: 'retirement_plan',        icon: 'shield-outline'    },
  { label: 'Professional Development', value: 'professional_development', icon: 'school-outline'},
];

const DEGREE_LEVELS = [
  { label: 'None',       value: 'none'        },
  { label: 'High School',value: 'high_school' },
  { label: 'Associate',  value: 'associate'   },
  { label: 'Bachelor',   value: 'bachelor'    },
  { label: 'Master',     value: 'master'      },
  { label: 'Doctorate',  value: 'doctorate'   },
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
          {tags.map((tag, i) => (
            <View key={i} style={f.tag}>
              <Text style={f.tagTxt}>{typeof tag === 'object' ? `${tag.language} (${tag.proficiency})` : tag}</Text>
              <TouchableOpacity onPress={() => onRemove(typeof tag === 'object' ? i : tag)}>
                <Ionicons name="close" size={13} color={BLUE} />
              </TouchableOpacity>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

function InputBox({ icon, placeholder, value, onChange, multiline, keyboardType }) {
  return (
    <View style={[f.inputBox, multiline && { alignItems: 'flex-start', height: 110 }]}>
      {icon && <Ionicons name={icon} size={16} color={TEXT_LIGHT} style={[{ marginRight: 8 }, multiline && { marginTop: 14 }]} />}
      <TextInput
        style={[f.inputText, multiline && { textAlignVertical: 'top', paddingTop: 14, height: 90 }]}
        placeholder={placeholder}
        placeholderTextColor={TEXT_LIGHT}
        value={value}
        onChangeText={onChange}
        multiline={multiline}
        keyboardType={keyboardType}
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
}) {
  return (
    <View>
      <SectionCard title="Job Information" icon="briefcase-outline">
        <View style={{ gap: 16 }}>
          <View>
            <FieldLabel label="Job Title" required />
            <InputBox
              icon="briefcase-outline"
              placeholder="e.g. Senior React Native Developer"
              value={title}
              onChange={setTitle}
            />
          </View>
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
            <Text style={{ fontSize: 11, color: TEXT_LIGHT, marginBottom: 8, fontWeight: '500' }}>SUGGESTED</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
              {SKILLS_SUGGESTIONS.slice(0, 10).map(s => (
                <TouchableOpacity
                  key={s}
                  style={[f.chip, { paddingHorizontal: 10, paddingVertical: 6 }, requiredSkills.includes(s) && f.chipActive]}
                  onPress={() => {
                    if (!requiredSkills.includes(s)) setRequiredSkills([...requiredSkills, s]);
                  }}
                >
                  <Text style={[{ fontSize: 11, color: TEXT_LIGHT }, requiredSkills.includes(s) && { color: BLUE }]}>{s}</Text>
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

  const toggleBenefit = (b) => {
    setPayInformation({
      ...payInformation,
      benefits: payInformation.benefits.includes(b)
        ? payInformation.benefits.filter(x => x !== b)
        : [...payInformation.benefits, b],
    });
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
            <ChipRow options={EXPERIENCE_LEVELS} selected={experienceLevel} onSelect={setExperienceLevel} />
          </View>
        </View>
      </SectionCard>

      {/* Advanced Toggle */}
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
                <ChipRow options={CURRENCIES.map(c => ({ ...c, icon: undefined }))}
                  selected={payInformation.salary_range.currency}
                  onSelect={(v) => setPayInformation({ ...payInformation, salary_range: { ...payInformation.salary_range, currency: v } })} />
              </View>
              <View>
                <FieldLabel label="Payment Frequency" />
                <ChipRow options={PAYMENT_FREQUENCIES.map(p => ({ ...p, icon: undefined }))}
                  selected={payInformation.payment_frequency}
                  onSelect={(v) => setPayInformation({ ...payInformation, payment_frequency: v })} />
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
                  thumbColor={payInformation.negotiable ? BLUE : TEXT_LIGHT}
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
                  }}>
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
                        }}>
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
                <ChipRow options={DEGREE_LEVELS.map(d => ({ ...d, icon: undefined }))}
                  selected={educationRequirements.minimum_degree}
                  onSelect={(v) => setEducationRequirements({ ...educationRequirements, minimum_degree: v })} />
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
                  thumbColor={applicationSettings.auto_accept ? BLUE : TEXT_LIGHT}
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
                <InputBox icon="calendar-outline" placeholder="YYYY-MM-DD"
                  value={applicationSettings.application_deadline}
                  onChange={(t) => setApplicationSettings({ ...applicationSettings, application_deadline: t })} />
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

function Step3({ title, description, requiredSkills, jobType, workSetup, urgencyLevel,
  experienceLevel, budgetType, budgetAmount, estimatedDuration, contactPreference,
  payInformation, location, requirements, educationRequirements, applicationSettings }) {

  const urgency = URGENCY_LEVELS.find(u => u.value === urgencyLevel);

  return (
    <View>
      {/* Hero summary */}
      <View style={rv.hero}>
        <View style={rv.heroIcon}>
          <Ionicons name="briefcase" size={24} color={WHITE} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={rv.heroTitle}>{title || 'Untitled Job'}</Text>
          <View style={{ flexDirection: 'row', gap: 8, marginTop: 6, flexWrap: 'wrap' }}>
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
              <View style={[rv.badge, { backgroundColor: `${urgency?.color}18`, borderColor: `${urgency?.color}40` }]}>
                <Text style={[rv.badgeTxt, { color: urgency?.color }]}>{urgency?.label}</Text>
              </View>
            )}
          </View>
        </View>
      </View>

      <SectionCard title="Job Details" icon="document-text-outline">
        <View style={{ gap: 12 }}>
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
          {experienceLevel && <ReviewRow icon="trophy-outline" label="Experience Level" value={experienceLevel} />}
        </View>
      </SectionCard>

      <SectionCard title="Budget & Payment" icon="cash-outline">
        <View style={{ gap: 12 }}>
          <ReviewRow icon="wallet-outline" label="Budget" value={budgetAmount ? `${payInformation.salary_range.currency} ${budgetAmount} (${BUDGET_TYPES.find(b => b.value === budgetType)?.label})` : null} />
          <ReviewRow icon="hourglass-outline" label="Duration" value={estimatedDuration} />
          {(payInformation.salary_range.min || payInformation.salary_range.max) && (
            <ReviewRow icon="receipt-outline" label="Salary Range"
              value={`${payInformation.salary_range.currency} ${payInformation.salary_range.min || '?'} – ${payInformation.salary_range.max || '?'} / ${payInformation.payment_frequency}`} />
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

      <SectionCard title="Application Settings" icon="settings-outline">
        <View style={{ gap: 12 }}>
          <ReviewRow icon="people-outline" label="Max Applicants" value={applicationSettings.max_applicants} />
          <ReviewRow icon="checkmark-circle-outline" label="Auto Accept" value={applicationSettings.auto_accept ? 'Yes' : 'No'} />
          {applicationSettings.application_deadline && (
            <ReviewRow icon="calendar-outline" label="Deadline" value={applicationSettings.application_deadline} />
          )}
        </View>
      </SectionCard>

      {/* Confirmation Banner */}
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
  const { isLoading } = useSelector((state) => state.jobs);
  const { token } = useSelector((state) => state.auth);

  const [activeTab, setActiveTab] = useState('PostJob');
  const [currentStep, setCurrentStep] = useState(1);

  // Basic
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
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
    if (currentStep > 1) setCurrentStep(currentStep - 1);
  };

  const resetForm = () => {
    setTitle(''); setDescription(''); setRequiredSkills([]); setBudgetAmount('');
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
    if (!token) { Alert.alert('Error', 'You must be logged in to post a job'); return; }

    const jobData = {
      title: title.trim(),
      description: description.trim(),
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
          currency: payInformation.salary_range.currency,
        },
        payment_frequency: payInformation.payment_frequency,
        benefits: payInformation.benefits,
        negotiable: payInformation.negotiable,
        display_pay: payInformation.display_pay,
      },
      location: {
        address: location.address || null,
        city: location.city || null,
        state: location.state || null,
        country: location.country,
        zip_code: location.zip_code || null,
        specific_area: location.specific_area || null,
        landmark: location.landmark || null,
        work_address: location.work_address || null,
      },
      education_requirements: {
        minimum_degree: educationRequirements.minimum_degree,
        preferred_field: educationRequirements.preferred_field || null,
        required_certifications: educationRequirements.required_certifications,
        years_of_experience: parseInt(educationRequirements.years_of_experience) || 0,
      },
      requirements: {
        min_years_experience: parseInt(requirements.min_years_experience) || 0,
        preferred_tools: requirements.preferred_tools,
        languages_required: requirements.languages_required,
        additional_requirements: requirements.additional_requirements || null,
      },
      application_settings: {
        auto_accept: applicationSettings.auto_accept,
        max_applicants: parseInt(applicationSettings.max_applicants) || 100,
        application_deadline: applicationSettings.application_deadline || null,
        questions_for_applicants: [],
      },
    };

    try {
      await dispatch(createJob(jobData)).unwrap();
      Alert.alert('Posted!', 'Your job is now live.', [
        { text: 'View My Postings', onPress: () => { resetForm(); onNavigate('Mypostings'); } },
        { text: 'Post Another',     onPress: () => resetForm() },
        { text: 'Dashboard',        onPress: () => { resetForm(); onNavigate('ClientDashboard'); } },
      ]);
    } catch (error) {
      Alert.alert('Error', error?.message || 'Failed to post job. Please try again.');
    }
  };

  const stepProps = {
    title, setTitle, description, setDescription,
    requiredSkills, setRequiredSkills, skillInput, setSkillInput,
    jobType, setJobType, workSetup, setWorkSetup,
    urgencyLevel, setUrgencyLevel, experienceLevel, setExperienceLevel,
    budgetType, setBudgetType, budgetAmount, setBudgetAmount,
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
            <TouchableOpacity onPress={() => currentStep > 1 ? handleBack() : onNavigate('ClientDashboard')} style={s.backBtn}>
              <Ionicons name="arrow-back" size={22} color={WHITE} />
            </TouchableOpacity>
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
  backBtn: { padding: 4 },
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
});