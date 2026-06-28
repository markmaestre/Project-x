import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  TextInput,
  StatusBar,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

// ── Design tokens ─────────────────────────────────────────────────────────────
const NAVY        = '#061630';
const NAVY2       = '#0A1F45';
const BLUE        = '#1A56DB';
const BLUE_SOFT   = '#EBF2FF';
const BLUE_MID    = '#2563EB';
const GOLD        = '#B8860B';
const GOLD_LT     = '#D4A017';
const GOLD_SOFT   = '#FDF6E3';
const GOLD_BORDER = '#E9C46A';
const WHITE       = '#FFFFFF';
const BG          = '#F0F4F8';
const SURFACE     = '#FFFFFF';
const TEXT_DARK   = '#0D1B2A';
const TEXT_MED    = '#3D5166';
const TEXT_MUTED  = '#8497AA';
const DIVIDER     = '#E2EAF3';
const GREEN       = '#0B7A4A';
const GREEN_SOFT  = '#E8F7F0';
const RED         = '#B91C1C';
const RED_SOFT    = '#FEF2F2';
const STAR_ON     = '#D4A017';
const STAR_OFF    = '#DDE6F0';
// ─────────────────────────────────────────────────────────────────────────────

const FREELANCER = {
  name: 'Mark Ranier Maestre',
  initials: 'MR',
  role: 'UI/UX Designer & Frontend Developer',
  project: 'Brand Identity Design',
  completed: 'July 13, 2025',
  avatarColor: BLUE_MID,
};

const CRITERIA = [
  {
    id: 'quality',
    label: 'Quality of Work',
    description: 'Deliverables met the agreed scope and standard',
    icon: 'diamond-outline',
  },
  {
    id: 'communication',
    label: 'Communication',
    description: 'Responsive, clear, and professional throughout',
    icon: 'chatbubble-ellipses-outline',
  },
  {
    id: 'timeliness',
    label: 'Timeliness',
    description: 'Delivered milestones on or ahead of schedule',
    icon: 'time-outline',
  },
  {
    id: 'expertise',
    label: 'Skill & Expertise',
    description: 'Demonstrated strong technical and creative ability',
    icon: 'ribbon-outline',
  },
  {
    id: 'professionalism',
    label: 'Professionalism',
    description: 'Conducted themselves in a respectful manner',
    icon: 'shield-checkmark-outline',
  },
];

const TAGS_POSITIVE = [
  'Great communicator',
  'Highly skilled',
  'Delivered on time',
  'Exceeded expectations',
  'Detail-oriented',
  'Creative problem solver',
  'Easy to work with',
  'Would hire again',
];

const TAGS_NEGATIVE = [
  'Missed deadlines',
  'Needed too many revisions',
  'Poor communication',
  'Below expected quality',
  'Unresponsive',
];

const STAR_LABELS = ['', 'Poor', 'Fair', 'Good', 'Very Good', 'Excellent'];

function StarRating({ value, onChange, size = 32 }) {
  return (
    <View style={{ flexDirection: 'row', gap: 6 }}>
      {[1, 2, 3, 4, 5].map(star => (
        <TouchableOpacity key={star} onPress={() => onChange(star)} activeOpacity={0.7}>
          <Ionicons
            name={star <= value ? 'star' : 'star-outline'}
            size={size}
            color={star <= value ? STAR_ON : STAR_OFF}
          />
        </TouchableOpacity>
      ))}
    </View>
  );
}

export default function FeedbackScreen({ onNavigate }) {
  const [overallRating, setOverallRating]     = useState(0);
  const [criteriaRatings, setCriteriaRatings] = useState({});
  const [selectedTags, setSelectedTags]       = useState([]);
  const [reviewText, setReviewText]           = useState('');
  const [recommend, setRecommend]             = useState(null); // true | false | null
  const [submitted, setSubmitted]             = useState(false);
  const [step, setStep]                       = useState(1); // 1 = rating, 2 = review, 3 = confirm

  const setCriteria = (id, val) =>
    setCriteriaRatings(prev => ({ ...prev, [id]: val }));

  const toggleTag = (tag) =>
    setSelectedTags(prev =>
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    );

  const canProceedStep1 = overallRating > 0;
  const canProceedStep2 = reviewText.trim().length >= 20;
  const canSubmit       = canProceedStep1 && recommend !== null;

  const handleSubmit = () => {
    Alert.alert(
      'Submit Review',
      'Your review will be posted publicly on Mark Ranier\'s profile. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Submit Review', onPress: () => setSubmitted(true) },
      ]
    );
  };

  // ── Success screen ──────────────────────────────────────────────────────────
  if (submitted) {
    return (
      <SafeAreaView style={ss.safe} edges={['top']}>
        <StatusBar barStyle="light-content" backgroundColor={NAVY} />
        <View style={ss.header}>
          <View style={{ width: 36 }} />
          <Text style={ss.headerTitle}>Review Submitted</Text>
          <View style={{ width: 36 }} />
        </View>
        <ScrollView contentContainerStyle={ss.content}>
          <View style={ss.successIcon}>
            <Ionicons name="checkmark-circle" size={64} color={GREEN} />
          </View>
          <Text style={ss.successTitle}>Thank you for your review!</Text>
          <Text style={ss.successBody}>
            Your feedback for Mark Ranier Maestre has been posted to his public Vantara profile.
            Reviews like yours help build a trustworthy community for clients and freelancers.
          </Text>

          {/* Review summary card */}
          <View style={ss.summaryCard}>
            <View style={ss.summaryHeader}>
              <View style={[ss.summaryAvatar, { backgroundColor: FREELANCER.avatarColor }]}>
                <Text style={ss.summaryAvatarText}>{FREELANCER.initials}</Text>
              </View>
              <View>
                <Text style={ss.summaryName}>{FREELANCER.name}</Text>
                <Text style={ss.summaryRole}>{FREELANCER.role}</Text>
              </View>
            </View>
            <View style={ss.summaryDivider} />
            <View style={ss.summaryStars}>
              {[1,2,3,4,5].map(s => (
                <Ionicons
                  key={s}
                  name={s <= overallRating ? 'star' : 'star-outline'}
                  size={22}
                  color={s <= overallRating ? STAR_ON : STAR_OFF}
                />
              ))}
              <Text style={ss.summaryRatingLabel}>{STAR_LABELS[overallRating]}</Text>
            </View>
            {reviewText.trim().length > 0 && (
              <Text style={ss.summaryReviewText} numberOfLines={4}>
                "{reviewText.trim()}"
              </Text>
            )}
          </View>

          <TouchableOpacity
            style={ss.doneBtn}
            onPress={() => onNavigate?.('ClientDashboard')}
            activeOpacity={0.8}
          >
            <Text style={ss.doneBtnText}>Back to Dashboard</Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor={NAVY} />

      {/* ── Header ── */}
      <View style={s.header}>
        <TouchableOpacity style={s.backBtn} onPress={() => onNavigate?.('ClientDashboard')} activeOpacity={0.7}>
          <Ionicons name="arrow-back" size={20} color={WHITE} />
        </TouchableOpacity>
        <Text style={s.headerTitle}>Leave a Review</Text>
        <View style={{ width: 36 }} />
      </View>

      {/* ── Step indicator ── */}
      <View style={s.stepBar}>
        {[1, 2, 3].map(n => (
          <React.Fragment key={n}>
            <View style={[s.stepDot, step >= n && s.stepDotActive]}>
              {step > n
                ? <Ionicons name="checkmark" size={12} color={WHITE} />
                : <Text style={[s.stepNum, step >= n && s.stepNumActive]}>{n}</Text>
              }
            </View>
            {n < 3 && <View style={[s.stepLine, step > n && s.stepLineActive]} />}
          </React.Fragment>
        ))}
      </View>
      <View style={s.stepLabels}>
        <Text style={[s.stepLabel, step === 1 && s.stepLabelActive]}>Rating</Text>
        <Text style={[s.stepLabel, step === 2 && s.stepLabelActive]}>Review</Text>
        <Text style={[s.stepLabel, step === 3 && s.stepLabelActive]}>Confirm</Text>
      </View>

      <ScrollView
        style={s.scroll}
        contentContainerStyle={s.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* ── Freelancer card ── */}
        <View style={s.freelancerCard}>
          <View style={[s.freelancerAvatar, { backgroundColor: FREELANCER.avatarColor }]}>
            <Text style={s.freelancerInitials}>{FREELANCER.initials}</Text>
          </View>
          <View style={s.freelancerInfo}>
            <Text style={s.freelancerName}>{FREELANCER.name}</Text>
            <Text style={s.freelancerRole}>{FREELANCER.role}</Text>
            <View style={s.projectPill}>
              <Ionicons name="folder-outline" size={11} color={GOLD} />
              <Text style={s.projectPillText}>{FREELANCER.project}</Text>
            </View>
          </View>
          <View style={s.completedBadge}>
            <Ionicons name="checkmark-circle" size={14} color={GREEN} />
            <Text style={s.completedText}>Done</Text>
          </View>
        </View>

        {/* ══ STEP 1: Overall + Criteria ratings ══ */}
        {step === 1 && (
          <>
            {/* Overall rating */}
            <View style={s.sectionCard}>
              <Text style={s.sectionTitle}>Overall Rating</Text>
              <Text style={s.sectionSub}>How would you rate your overall experience?</Text>
              <View style={s.overallStars}>
                <StarRating value={overallRating} onChange={setOverallRating} size={40} />
                {overallRating > 0 && (
                  <Text style={s.starLabel}>{STAR_LABELS[overallRating]}</Text>
                )}
              </View>
            </View>

            {/* Per-criteria ratings */}
            <View style={s.sectionCard}>
              <Text style={s.sectionTitle}>Detailed Ratings</Text>
              <Text style={s.sectionSub}>Rate Mark Ranier on each area (optional)</Text>
              {CRITERIA.map((c, idx) => (
                <View key={c.id} style={[s.criteriaRow, idx < CRITERIA.length - 1 && s.criteriaRowBorder]}>
                  <View style={s.criteriaLeft}>
                    <View style={s.criteriaIconWrap}>
                      <Ionicons name={c.icon} size={16} color={BLUE} />
                    </View>
                    <View style={s.criteriaText}>
                      <Text style={s.criteriaLabel}>{c.label}</Text>
                      <Text style={s.criteriaDesc}>{c.description}</Text>
                    </View>
                  </View>
                  <StarRating
                    value={criteriaRatings[c.id] || 0}
                    onChange={val => setCriteria(c.id, val)}
                    size={20}
                  />
                </View>
              ))}
            </View>

            <TouchableOpacity
              style={[s.nextBtn, !canProceedStep1 && s.nextBtnDisabled]}
              onPress={() => canProceedStep1 && setStep(2)}
              activeOpacity={0.8}
            >
              <Text style={s.nextBtnText}>Continue</Text>
              <Ionicons name="arrow-forward" size={16} color={WHITE} />
            </TouchableOpacity>
          </>
        )}

        {/* ══ STEP 2: Written review + tags ══ */}
        {step === 2 && (
          <>
            {/* Highlights */}
            <View style={s.sectionCard}>
              <Text style={s.sectionTitle}>Highlights</Text>
              <Text style={s.sectionSub}>Select tags that describe Mark Ranier (optional)</Text>

              <Text style={s.tagGroupLabel}>
                <Ionicons name="thumbs-up-outline" size={12} color={GREEN} />
                {'  Strengths'}
              </Text>
              <View style={s.tagsWrap}>
                {TAGS_POSITIVE.map(tag => {
                  const active = selectedTags.includes(tag);
                  return (
                    <TouchableOpacity
                      key={tag}
                      style={[s.tagChip, active && s.tagChipActive]}
                      onPress={() => toggleTag(tag)}
                      activeOpacity={0.75}
                    >
                      {active && <Ionicons name="checkmark" size={11} color={WHITE} style={{ marginRight: 3 }} />}
                      <Text style={[s.tagChipText, active && s.tagChipTextActive]}>{tag}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <Text style={[s.tagGroupLabel, { marginTop: 14 }]}>
                <Ionicons name="thumbs-down-outline" size={12} color={RED} />
                {'  Areas to improve'}
              </Text>
              <View style={s.tagsWrap}>
                {TAGS_NEGATIVE.map(tag => {
                  const active = selectedTags.includes(tag);
                  return (
                    <TouchableOpacity
                      key={tag}
                      style={[s.tagChip, active && s.tagChipNegActive]}
                      onPress={() => toggleTag(tag)}
                      activeOpacity={0.75}
                    >
                      {active && <Ionicons name="checkmark" size={11} color={WHITE} style={{ marginRight: 3 }} />}
                      <Text style={[s.tagChipText, active && s.tagChipTextActive]}>{tag}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Written review */}
            <View style={s.sectionCard}>
              <Text style={s.sectionTitle}>Written Review</Text>
              <Text style={s.sectionSub}>Share your experience in your own words</Text>
              <TextInput
                style={s.textInput}
                placeholder="Tell other clients what it was like working with Mark Ranier — the quality of his work, how he communicated, whether you'd hire him again..."
                placeholderTextColor={TEXT_MUTED}
                multiline
                numberOfLines={6}
                value={reviewText}
                onChangeText={setReviewText}
                textAlignVertical="top"
              />
              <View style={s.charRow}>
                <Text style={[s.charCount, reviewText.length < 20 && s.charCountWarn]}>
                  {reviewText.length < 20
                    ? `${20 - reviewText.length} more characters needed`
                    : `${reviewText.length} characters`}
                </Text>
              </View>
            </View>

            <View style={s.navRow}>
              <TouchableOpacity style={s.backStepBtn} onPress={() => setStep(1)} activeOpacity={0.75}>
                <Ionicons name="arrow-back" size={16} color={TEXT_MED} />
                <Text style={s.backStepText}>Back</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[s.nextBtn, { flex: 1 }, !canProceedStep2 && s.nextBtnDisabled]}
                onPress={() => canProceedStep2 && setStep(3)}
                activeOpacity={0.8}
              >
                <Text style={s.nextBtnText}>Continue</Text>
                <Ionicons name="arrow-forward" size={16} color={WHITE} />
              </TouchableOpacity>
            </View>
          </>
        )}

        {/* ══ STEP 3: Confirm + recommend ══ */}
        {step === 3 && (
          <>
            {/* Preview card */}
            <View style={s.sectionCard}>
              <Text style={s.sectionTitle}>Review Preview</Text>
              <Text style={s.sectionSub}>This is how your review will appear publicly</Text>

              <View style={s.previewCard}>
                {/* Reviewer */}
                <View style={s.previewHeader}>
                  <View style={s.previewAvatar}>
                    <Ionicons name="person" size={18} color={WHITE} />
                  </View>
                  <View>
                    <Text style={s.previewReviewerName}>You (Client)</Text>
                    <Text style={s.previewDate}>Posted just now</Text>
                  </View>
                  <View style={s.previewVerified}>
                    <Ionicons name="shield-checkmark" size={12} color={BLUE} />
                    <Text style={s.previewVerifiedText}>Verified</Text>
                  </View>
                </View>

                {/* Stars */}
                <View style={s.previewStars}>
                  {[1,2,3,4,5].map(star => (
                    <Ionicons
                      key={star}
                      name={star <= overallRating ? 'star' : 'star-outline'}
                      size={18}
                      color={star <= overallRating ? STAR_ON : STAR_OFF}
                    />
                  ))}
                  <Text style={s.previewRatingText}>{STAR_LABELS[overallRating]}</Text>
                </View>

                {/* Project label */}
                <View style={s.previewProjectRow}>
                  <Ionicons name="folder-outline" size={12} color={TEXT_MUTED} />
                  <Text style={s.previewProjectText}>{FREELANCER.project}</Text>
                </View>

                {/* Review text */}
                {reviewText.trim().length > 0 && (
                  <Text style={s.previewBody}>"{reviewText.trim()}"</Text>
                )}

                {/* Tags */}
                {selectedTags.length > 0 && (
                  <View style={s.previewTags}>
                    {selectedTags.map(tag => (
                      <View key={tag} style={s.previewTag}>
                        <Text style={s.previewTagText}>{tag}</Text>
                      </View>
                    ))}
                  </View>
                )}
              </View>
            </View>

            {/* Criteria summary */}
            {Object.keys(criteriaRatings).length > 0 && (
              <View style={s.sectionCard}>
                <Text style={s.sectionTitle}>Detailed Scores</Text>
                {CRITERIA.filter(c => criteriaRatings[c.id]).map(c => (
                  <View key={c.id} style={s.criteriaPreviewRow}>
                    <Text style={s.criteriaPreviewLabel}>{c.label}</Text>
                    <View style={{ flexDirection: 'row', gap: 3 }}>
                      {[1,2,3,4,5].map(star => (
                        <Ionicons
                          key={star}
                          name={star <= criteriaRatings[c.id] ? 'star' : 'star-outline'}
                          size={14}
                          color={star <= criteriaRatings[c.id] ? STAR_ON : STAR_OFF}
                        />
                      ))}
                    </View>
                  </View>
                ))}
              </View>
            )}

            {/* Recommend */}
            <View style={s.sectionCard}>
              <Text style={s.sectionTitle}>Would you hire Mark Ranier again?</Text>
              <View style={s.recommendRow}>
                <TouchableOpacity
                  style={[s.recommendBtn, recommend === true && s.recommendBtnYes]}
                  onPress={() => setRecommend(true)}
                  activeOpacity={0.8}
                >
                  <Ionicons
                    name="thumbs-up-outline"
                    size={22}
                    color={recommend === true ? WHITE : TEXT_MUTED}
                  />
                  <Text style={[s.recommendText, recommend === true && s.recommendTextActive]}>
                    Yes, definitely
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[s.recommendBtn, recommend === false && s.recommendBtnNo]}
                  onPress={() => setRecommend(false)}
                  activeOpacity={0.8}
                >
                  <Ionicons
                    name="thumbs-down-outline"
                    size={22}
                    color={recommend === false ? WHITE : TEXT_MUTED}
                  />
                  <Text style={[s.recommendText, recommend === false && s.recommendTextActive]}>
                    Not likely
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Disclaimer */}
            <View style={s.disclaimer}>
              <Ionicons name="information-circle-outline" size={14} color={TEXT_MUTED} />
              <Text style={s.disclaimerText}>
                Reviews are public and permanent. Mark Ranier will see your review after both parties have submitted. By submitting, you confirm that this review reflects your honest experience.
              </Text>
            </View>

            <View style={s.navRow}>
              <TouchableOpacity style={s.backStepBtn} onPress={() => setStep(2)} activeOpacity={0.75}>
                <Ionicons name="arrow-back" size={16} color={TEXT_MED} />
                <Text style={s.backStepText}>Back</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[s.submitBtn, !canSubmit && s.nextBtnDisabled]}
                onPress={() => canSubmit && handleSubmit()}
                activeOpacity={0.8}
              >
                <Ionicons name="star-outline" size={16} color={WHITE} />
                <Text style={s.submitBtnText}>Submit Review</Text>
              </TouchableOpacity>
            </View>
          </>
        )}

        <View style={{ height: 48 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: NAVY },

  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 14, backgroundColor: NAVY,
    borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.07)',
  },
  backBtn: {
    width: 36, height: 36, borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.07)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center', justifyContent: 'center',
  },
  headerTitle: { fontSize: 17, fontWeight: '700', color: WHITE },

  // Step bar
  stepBar: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 48, paddingTop: 16, paddingBottom: 4,
    backgroundColor: NAVY,
  },
  stepDot: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center', justifyContent: 'center',
  },
  stepDotActive: {
    backgroundColor: GOLD, borderColor: GOLD,
  },
  stepNum: { fontSize: 12, fontWeight: '700', color: 'rgba(255,255,255,0.4)' },
  stepNumActive: { color: WHITE },
  stepLine: { flex: 1, height: 2, backgroundColor: 'rgba(255,255,255,0.1)', marginHorizontal: 4 },
  stepLineActive: { backgroundColor: GOLD },
  stepLabels: {
    flexDirection: 'row', justifyContent: 'space-between',
    paddingHorizontal: 34, paddingBottom: 14, backgroundColor: NAVY,
  },
  stepLabel: { fontSize: 11, color: 'rgba(255,255,255,0.35)', fontWeight: '500', width: 60, textAlign: 'center' },
  stepLabelActive: { color: GOLD_LT, fontWeight: '700' },

  scroll: { flex: 1, backgroundColor: BG },
  scrollContent: { padding: 16, gap: 12 },

  // Freelancer card
  freelancerCard: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: SURFACE, borderRadius: 14, padding: 14,
    borderWidth: 1, borderColor: DIVIDER, gap: 12,
  },
  freelancerAvatar: {
    width: 52, height: 52, borderRadius: 26,
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  freelancerInitials: { fontSize: 18, fontWeight: '800', color: WHITE },
  freelancerInfo: { flex: 1 },
  freelancerName: { fontSize: 15, fontWeight: '700', color: TEXT_DARK },
  freelancerRole: { fontSize: 12, color: TEXT_MUTED, marginTop: 2, marginBottom: 6 },
  projectPill: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: GOLD_SOFT, borderRadius: 8,
    paddingHorizontal: 8, paddingVertical: 3,
    alignSelf: 'flex-start',
    borderWidth: 1, borderColor: GOLD_BORDER + '50',
  },
  projectPillText: { fontSize: 10, fontWeight: '600', color: GOLD },
  completedBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: GREEN_SOFT, borderRadius: 8,
    paddingHorizontal: 8, paddingVertical: 4,
    borderWidth: 1, borderColor: GREEN + '30',
  },
  completedText: { fontSize: 11, fontWeight: '700', color: GREEN },

  // Section card
  sectionCard: {
    backgroundColor: SURFACE, borderRadius: 14, padding: 16,
    borderWidth: 1, borderColor: DIVIDER,
  },
  sectionTitle: { fontSize: 14, fontWeight: '700', color: TEXT_DARK, marginBottom: 4 },
  sectionSub: { fontSize: 12, color: TEXT_MUTED, marginBottom: 16, lineHeight: 17 },

  // Overall stars
  overallStars: { alignItems: 'center', gap: 10, paddingVertical: 8 },
  starLabel: { fontSize: 16, fontWeight: '700', color: GOLD, marginTop: 4 },

  // Criteria
  criteriaRow: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', paddingVertical: 12,
  },
  criteriaRowBorder: { borderBottomWidth: 1, borderBottomColor: DIVIDER },
  criteriaLeft: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1, marginRight: 12 },
  criteriaIconWrap: {
    width: 32, height: 32, borderRadius: 8,
    backgroundColor: BLUE_SOFT, alignItems: 'center', justifyContent: 'center',
  },
  criteriaText: { flex: 1 },
  criteriaLabel: { fontSize: 13, fontWeight: '600', color: TEXT_DARK },
  criteriaDesc: { fontSize: 11, color: TEXT_MUTED, marginTop: 1 },

  // Tags
  tagGroupLabel: { fontSize: 12, fontWeight: '600', color: TEXT_MED, marginBottom: 10 },
  tagsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  tagChip: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 12, paddingVertical: 7,
    borderRadius: 20, borderWidth: 1.5,
    borderColor: DIVIDER, backgroundColor: SURFACE,
  },
  tagChipActive: { backgroundColor: BLUE_MID, borderColor: BLUE_MID },
  tagChipNegActive: { backgroundColor: RED, borderColor: RED },
  tagChipText: { fontSize: 12, fontWeight: '500', color: TEXT_MED },
  tagChipTextActive: { color: WHITE, fontWeight: '600' },

  // Text input
  textInput: {
    borderWidth: 1.5, borderColor: DIVIDER, borderRadius: 10,
    padding: 14, fontSize: 13.5, color: TEXT_DARK,
    lineHeight: 21, minHeight: 130, backgroundColor: BG,
  },
  charRow: { alignItems: 'flex-end', marginTop: 6 },
  charCount: { fontSize: 11, color: TEXT_MUTED },
  charCountWarn: { color: ORANGE_C },

  // Nav row
  navRow: { flexDirection: 'row', gap: 10 },
  backStepBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 16, paddingVertical: 14,
    borderRadius: 12, borderWidth: 1.5, borderColor: DIVIDER,
    backgroundColor: SURFACE,
  },
  backStepText: { fontSize: 13, fontWeight: '600', color: TEXT_MED },

  // Buttons
  nextBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, backgroundColor: BLUE_MID, borderRadius: 12,
    paddingVertical: 14, paddingHorizontal: 24,
  },
  nextBtnDisabled: { backgroundColor: DIVIDER },
  nextBtnText: { fontSize: 14, fontWeight: '700', color: WHITE },

  submitBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, backgroundColor: NAVY, borderRadius: 12,
    paddingVertical: 14,
    borderWidth: 1.5, borderColor: GOLD + '40',
  },
  submitBtnText: { fontSize: 14, fontWeight: '700', color: WHITE },

  // Preview card
  previewCard: {
    backgroundColor: BG, borderRadius: 12, padding: 14,
    borderWidth: 1, borderColor: DIVIDER, marginTop: 4,
  },
  previewHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
  previewAvatar: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: NAVY, alignItems: 'center', justifyContent: 'center',
  },
  previewReviewerName: { fontSize: 13, fontWeight: '700', color: TEXT_DARK },
  previewDate: { fontSize: 11, color: TEXT_MUTED },
  previewVerified: {
    flexDirection: 'row', alignItems: 'center', gap: 3,
    marginLeft: 'auto', backgroundColor: BLUE_SOFT,
    paddingHorizontal: 7, paddingVertical: 3, borderRadius: 6,
  },
  previewVerifiedText: { fontSize: 10, fontWeight: '600', color: BLUE },
  previewStars: { flexDirection: 'row', alignItems: 'center', gap: 3, marginBottom: 6 },
  previewRatingText: { fontSize: 13, fontWeight: '700', color: GOLD, marginLeft: 4 },
  previewProjectRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 10 },
  previewProjectText: { fontSize: 11, color: TEXT_MUTED },
  previewBody: { fontSize: 13, color: TEXT_MED, lineHeight: 20, fontStyle: 'italic', marginBottom: 10 },
  previewTags: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  previewTag: {
    backgroundColor: BLUE_SOFT, borderRadius: 6,
    paddingHorizontal: 8, paddingVertical: 3,
  },
  previewTagText: { fontSize: 10, fontWeight: '600', color: BLUE_MID },

  // Criteria preview
  criteriaPreviewRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: 7, borderBottomWidth: 1, borderBottomColor: DIVIDER,
  },
  criteriaPreviewLabel: { fontSize: 13, color: TEXT_MED, fontWeight: '500' },

  // Recommend
  recommendRow: { flexDirection: 'row', gap: 12, marginTop: 4 },
  recommendBtn: {
    flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8,
    paddingVertical: 16, borderRadius: 12,
    borderWidth: 1.5, borderColor: DIVIDER, backgroundColor: BG,
  },
  recommendBtnYes: { backgroundColor: GREEN, borderColor: GREEN },
  recommendBtnNo: { backgroundColor: RED, borderColor: RED },
  recommendText: { fontSize: 13, fontWeight: '600', color: TEXT_MUTED },
  recommendTextActive: { color: WHITE },

  // Disclaimer
  disclaimer: {
    flexDirection: 'row', gap: 8, alignItems: 'flex-start',
    backgroundColor: SURFACE, borderRadius: 10, padding: 12,
    borderWidth: 1, borderColor: DIVIDER,
  },
  disclaimerText: { fontSize: 11, color: TEXT_MUTED, lineHeight: 16, flex: 1 },
});

// success screen styles
const ss = StyleSheet.create({
  safe: { flex: 1, backgroundColor: NAVY },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 14, backgroundColor: NAVY,
  },
  headerTitle: { fontSize: 17, fontWeight: '700', color: WHITE },
  content: { padding: 24, alignItems: 'center', paddingTop: 48 },
  successIcon: {
    width: 100, height: 100, borderRadius: 50,
    backgroundColor: GREEN_SOFT, alignItems: 'center', justifyContent: 'center',
    borderWidth: 1.5, borderColor: GREEN + '30', marginBottom: 20,
  },
  successTitle: { fontSize: 22, fontWeight: '800', color: WHITE, marginBottom: 12, textAlign: 'center' },
  successBody: { fontSize: 14, color: 'rgba(255,255,255,0.6)', textAlign: 'center', lineHeight: 21, marginBottom: 28 },
  summaryCard: {
    backgroundColor: SURFACE, borderRadius: 16, padding: 18,
    borderWidth: 1, borderColor: DIVIDER, width: '100%', marginBottom: 24,
  },
  summaryHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 14 },
  summaryAvatar: {
    width: 48, height: 48, borderRadius: 24,
    alignItems: 'center', justifyContent: 'center',
  },
  summaryAvatarText: { fontSize: 16, fontWeight: '800', color: WHITE },
  summaryName: { fontSize: 15, fontWeight: '700', color: TEXT_DARK },
  summaryRole: { fontSize: 12, color: TEXT_MUTED, marginTop: 2 },
  summaryDivider: { height: 1, backgroundColor: DIVIDER, marginBottom: 14 },
  summaryStars: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 12 },
  summaryRatingLabel: { fontSize: 14, fontWeight: '700', color: GOLD, marginLeft: 6 },
  summaryReviewText: { fontSize: 13, color: TEXT_MED, lineHeight: 20, fontStyle: 'italic' },
  doneBtn: {
    backgroundColor: BLUE_MID, borderRadius: 12,
    paddingVertical: 14, paddingHorizontal: 40, width: '100%', alignItems: 'center',
  },
  doneBtnText: { fontSize: 15, fontWeight: '700', color: WHITE },
});

const ORANGE_C = '#C45B0A';