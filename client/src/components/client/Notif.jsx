import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  RefreshControl,
  StatusBar,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

// ── Design tokens ─────────────────────────────────────────────────────────────
const NAVY        = '#061630';
const BLUE        = '#1A56DB';
const BLUE_SOFT   = '#EBF2FF';
const BLUE_MID    = '#2563EB';
const GOLD        = '#B8860B';
const GOLD_LT     = '#D4A017';
const GOLD_SOFT   = '#FDF6E3';
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
const ORANGE      = '#C45B0A';
const ORANGE_SOFT = '#FFF3E4';
const PURPLE      = '#5B21B6';
const PURPLE_SOFT = '#F5F3FF';
// ─────────────────────────────────────────────────────────────────────────────

// YOU are the CLIENT. Mark Ranier Maestre is the FREELANCER messaging/applying to you.
const CLIENT = { name: 'You (Client Account)' };

const MOCK_NOTIFICATIONS = [
  // ── TODAY ──
  {
    id: 'n1',
    type: 'message',
    category: 'today',
    title: 'New Message',
    sender: 'Mark Ranier Maestre',
    senderSub: 'UI/UX Designer · Re: Brand Identity Project',
    preview: 'Hi! I just finished the first draft of the logo concepts. I\'ve uploaded 3 variations for your review. Please let me know which direction you prefer.',
    time: '9:41 AM',
    fullDate: 'Friday, June 13, 2025 at 9:41 AM',
    read: false,
    icon: 'mail-outline',
    accentColor: BLUE,
    bgColor: BLUE_SOFT,
    tag: 'Message',
    tagColor: BLUE,
    tagBg: BLUE_SOFT,
    senderInitials: 'MR',
    senderAvatarColor: BLUE,
    detail: {
      subject: 'Re: Brand Identity Project — Logo Draft Ready for Review',
      greeting: 'Hi!',
      body: `I just finished the first draft of the logo concepts for the Brand Identity Project and wanted to share them with you right away.

I've uploaded 3 logo variations to the project board, each exploring a different visual direction based on our initial brief:

  Concept A   Clean wordmark — modern, minimalist, corporate feel
  Concept B   Icon + wordmark — versatile for both print and digital
  Concept C   Monogram mark — strong, premium, memorable

All three are provided in full color, reversed (white), and single-color (black) formats. I've also attached a quick rationale PDF explaining the thinking behind each concept.

Could you please review them at your earliest convenience and let me know which direction resonates most? Once you pick a direction, I can move into refinements and start working on the brand color palette and typography selection.

Looking forward to your feedback!`,
      closing: 'Best regards,',
      sigName: 'Mark Ranier Maestre',
      sigRole: 'UI/UX Designer & Frontend Developer',
      actions: [
        { label: 'Reply',          icon: 'arrow-undo-outline',    color: BLUE,  bg: BLUE_SOFT },
        { label: 'View Project',   icon: 'folder-open-outline',   color: GOLD,  bg: GOLD_SOFT },
        { label: 'View Files',     icon: 'document-outline',      color: PURPLE, bg: PURPLE_SOFT },
      ],
    },
  },
  {
    id: 'n2',
    type: 'application',
    category: 'today',
    title: 'New Application',
    sender: 'Mark Ranier Maestre',
    senderSub: 'Applied for Senior UI/UX Designer',
    preview: 'Mark Ranier Maestre submitted a proposal for your Senior UI/UX Designer job posting. Bid: ₱120/hr.',
    time: '8:05 AM',
    fullDate: 'Friday, June 13, 2025 at 8:05 AM',
    read: false,
    icon: 'person-add-outline',
    accentColor: PURPLE,
    bgColor: PURPLE_SOFT,
    tag: 'New Applicant',
    tagColor: PURPLE,
    tagBg: PURPLE_SOFT,
    senderInitials: 'MR',
    senderAvatarColor: PURPLE,
    detail: {
      subject: 'New Application — Senior UI/UX Designer · Mark Ranier Maestre',
      greeting: 'Hello,',
      body: `Mark Ranier Maestre has submitted a proposal for your job posting: Senior UI/UX Designer.

Applicant Details:
  Name             Mark Ranier Maestre
  Rating           4.9 / 5.0  (47 reviews)
  Completed Jobs   63 on Vantara
  Top Skills       UI/UX Design, Figma, React Native, Design Systems
  Vantara Badge    Verified · Top Rated

Proposal Summary:
  Bid Rate         ₱120.00 / hour
  Availability     Full-time, immediate start
  Cover Letter     (excerpt below)

"Hi! I came across your Senior UI/UX Designer posting and I'm very excited about the opportunity. I have 5+ years of experience designing mobile and web products for clients across fintech, e-commerce, and SaaS. I've attached my portfolio and I'd love to walk you through some relevant case studies on a quick call. I'm confident I can bring both strong design thinking and clean execution to your team."

You can view Mark Ranier's full profile, portfolio, and complete proposal from the Applications tab on your job posting.`,
      closing: 'Vantara Jobs Team',
      sigName: '',
      sigRole: 'jobs@vantara.ph',
      actions: [
        { label: 'View Application', icon: 'document-text-outline', color: PURPLE, bg: PURPLE_SOFT },
        { label: 'Message Applicant', icon: 'chatbubble-outline',   color: BLUE,   bg: BLUE_SOFT },
        { label: 'Shortlist',         icon: 'ribbon-outline',       color: GOLD,   bg: GOLD_SOFT },
      ],
    },
  },
  {
    id: 'n3',
    type: 'milestone',
    category: 'today',
    title: 'Milestone Submitted',
    sender: 'Mark Ranier Maestre',
    senderSub: 'Project Alpha · Milestone 2 — UI Screens',
    preview: 'Mark Ranier submitted Milestone 2 for your review: UI Screens Delivery. Release payment once approved.',
    time: '7:30 AM',
    fullDate: 'Friday, June 13, 2025 at 7:30 AM',
    read: false,
    icon: 'flag-outline',
    accentColor: ORANGE,
    bgColor: ORANGE_SOFT,
    tag: 'Needs Review',
    tagColor: ORANGE,
    tagBg: ORANGE_SOFT,
    senderInitials: 'MR',
    senderAvatarColor: ORANGE,
    detail: {
      subject: 'Milestone Submitted for Review — Project Alpha · Milestone 2',
      greeting: 'Hi,',
      body: `Mark Ranier Maestre has submitted Milestone 2 of Project Alpha for your review and approval.

Milestone Details:
  Project          Project Alpha — E-commerce Redesign
  Milestone        Milestone 2 — UI Screens Delivery (Final)
  Submitted        June 13, 2025 at 7:30 AM
  Deliverables     28 Figma screens + handoff specs
  Milestone Value  ₱18,500.00
  Note from Mark   "All 28 screens are complete and uploaded to the shared Figma file. I've also included an interaction prototype, component notes, and a developer handoff guide. Please review at your convenience — I'm available for a walkthrough call anytime this week."

Next Steps:
  — Review the submitted deliverables in the project board
  — If satisfied, approve the milestone to release the payment of ₱18,500.00 to Mark Ranier
  — If revisions are needed, you may request changes with a note

Note: Milestone payments are held in escrow and will only be released upon your approval. If you have a dispute, please contact Vantara Support within 5 business days of submission.`,
      closing: 'Vantara Milestone System',
      sigName: '',
      sigRole: 'milestones@vantara.ph',
      actions: [
        { label: 'Review & Approve', icon: 'checkmark-circle-outline', color: GREEN,  bg: GREEN_SOFT },
        { label: 'Request Revision', icon: 'create-outline',           color: ORANGE, bg: ORANGE_SOFT },
        { label: 'View Files',       icon: 'folder-open-outline',      color: BLUE,   bg: BLUE_SOFT },
      ],
    },
  },

  // ── YESTERDAY ──
  {
    id: 'n4',
    type: 'offer_accepted',
    category: 'yesterday',
    title: 'Offer Accepted',
    sender: 'Mark Ranier Maestre',
    senderSub: 'Senior UI/UX Designer · Job Offer',
    preview: 'Mark Ranier Maestre has accepted your job offer. The contract is now pending your signature.',
    time: 'Yesterday, 4:15 PM',
    fullDate: 'Thursday, June 12, 2025 at 4:15 PM',
    read: true,
    icon: 'checkmark-circle-outline',
    accentColor: GREEN,
    bgColor: GREEN_SOFT,
    tag: 'Accepted',
    tagColor: GREEN,
    tagBg: GREEN_SOFT,
    senderInitials: 'MR',
    senderAvatarColor: GREEN,
    detail: {
      subject: 'Offer Accepted — Mark Ranier Maestre · Senior UI/UX Designer',
      greeting: 'Great news!',
      body: `Mark Ranier Maestre has accepted your job offer for the Senior UI/UX Designer position. You're one step away from getting started.

Offer Summary:
  Freelancer       Mark Ranier Maestre
  Position         Senior UI/UX Designer
  Rate             ₱120.00 / hour
  Duration         3 months (with option to extend)
  Start Date       June 20, 2025
  Accepted On      June 12, 2025 at 4:15 PM

Next Steps:
  1. Review and sign the auto-generated freelance contract in your Contracts tab
  2. Fund the first milestone escrow to officially kick off the project
  3. Mark Ranier will be notified once the contract is signed and funds are in escrow

The contract must be signed within 48 hours or the offer will expire. Mark Ranier has been notified that the ball is now in your court.`,
      closing: 'Vantara Jobs Team',
      sigName: '',
      sigRole: 'jobs@vantara.ph',
      actions: [
        { label: 'Sign Contract',   icon: 'document-text-outline', color: BLUE,  bg: BLUE_SOFT },
        { label: 'Fund Escrow',     icon: 'wallet-outline',        color: GREEN, bg: GREEN_SOFT },
        { label: 'Message Mark',    icon: 'chatbubble-outline',    color: GOLD,  bg: GOLD_SOFT },
      ],
    },
  },
  {
    id: 'n5',
    type: 'interview',
    category: 'yesterday',
    title: 'Interview Confirmed',
    sender: 'Mark Ranier Maestre',
    senderSub: 'Product Designer Role · Interview',
    preview: 'Mark Ranier confirmed your interview request for tomorrow, June 13 at 10:00 AM.',
    time: 'Yesterday, 2:00 PM',
    fullDate: 'Thursday, June 12, 2025 at 2:00 PM',
    read: true,
    icon: 'calendar-outline',
    accentColor: GOLD,
    bgColor: GOLD_SOFT,
    tag: 'Confirmed',
    tagColor: GOLD,
    tagBg: GOLD_SOFT,
    senderInitials: 'MR',
    senderAvatarColor: GOLD,
    detail: {
      subject: 'Interview Confirmed — Mark Ranier Maestre · June 13 at 10:00 AM',
      greeting: 'Hi,',
      body: `Mark Ranier Maestre has confirmed your interview invitation for the Product Designer role.

Interview Details:
  Candidate        Mark Ranier Maestre
  Position         Product Designer
  Date             Friday, June 13, 2025
  Time             10:00 AM (Philippine Standard Time)
  Format           Video Call via Google Meet
  Meeting Link     meet.google.com/vnt-nxd-2025
  Duration         ~45 minutes

Mark Ranier's note: "Confirmed! Looking forward to the conversation. I'll have my portfolio and a few relevant case studies ready to walk through. See you then!"

A calendar invite has been sent to your registered email. You will also receive a reminder 30 minutes before the call.

Tip: Review Mark Ranier's profile and portfolio beforehand for a more productive conversation.`,
      closing: 'Vantara Scheduling',
      sigName: '',
      sigRole: 'scheduling@vantara.ph',
      actions: [
        { label: 'Join Meeting',    icon: 'videocam-outline',        color: GOLD,  bg: GOLD_SOFT },
        { label: 'View Profile',    icon: 'person-outline',          color: BLUE,  bg: BLUE_SOFT },
        { label: 'Reschedule',      icon: 'calendar-outline',        color: ORANGE, bg: ORANGE_SOFT },
      ],
    },
  },
  {
    id: 'n6',
    type: 'message',
    category: 'yesterday',
    title: 'New Message',
    sender: 'Mark Ranier Maestre',
    senderSub: 'Re: React Native Developer Role',
    preview: 'Just wanted to follow up on my proposal. Happy to hop on a quick call if you have questions about my background or the project approach.',
    time: 'Yesterday, 10:20 AM',
    fullDate: 'Thursday, June 12, 2025 at 10:20 AM',
    read: true,
    icon: 'mail-outline',
    accentColor: BLUE,
    bgColor: BLUE_SOFT,
    tag: 'Message',
    tagColor: BLUE,
    tagBg: BLUE_SOFT,
    senderInitials: 'MR',
    senderAvatarColor: BLUE,
    detail: {
      subject: 'Follow-up — React Native Developer Proposal',
      greeting: 'Hi!',
      body: `I wanted to follow up on the proposal I submitted for your React Native Developer position a couple of days ago. I know you're probably reviewing a lot of applications, so I'll keep this brief.

I've worked on 8 React Native projects in the past 2 years — ranging from fintech apps to marketplace platforms — and I feel like this role is a strong fit for what I can offer. I'd love to share a couple of relevant case studies if you're interested.

If you have any questions about my background, tech stack, or approach to the project, I'm happy to jump on a quick 20-minute intro call at your convenience. Just send me a time and I'll be there.

Either way, I appreciate you considering my application and I hope to hear from you soon!`,
      closing: 'Thanks,',
      sigName: 'Mark Ranier Maestre',
      sigRole: 'UI/UX Designer & Frontend Developer · Vantara',
      actions: [
        { label: 'Reply',            icon: 'arrow-undo-outline',    color: BLUE,   bg: BLUE_SOFT },
        { label: 'View Application', icon: 'document-text-outline', color: PURPLE, bg: PURPLE_SOFT },
      ],
    },
  },

  // ── OLDER ──
  {
    id: 'n7',
    type: 'contract',
    category: 'older',
    title: 'Contract Signed by Freelancer',
    sender: 'Mark Ranier Maestre',
    senderSub: 'Brand Identity Project · Contract',
    preview: 'Mark Ranier has signed the contract for Brand Identity Project. Project is now active.',
    time: 'Jun 9',
    fullDate: 'Monday, June 9, 2025',
    read: true,
    icon: 'document-text-outline',
    accentColor: BLUE,
    bgColor: BLUE_SOFT,
    tag: 'Contract Active',
    tagColor: BLUE,
    tagBg: BLUE_SOFT,
    senderInitials: 'MR',
    senderAvatarColor: BLUE,
    detail: {
      subject: 'Contract Signed — Brand Identity Project · Now Active',
      greeting: 'Hi,',
      body: `Mark Ranier Maestre has signed the freelance contract for the Brand Identity Project. Since both parties have now signed, the contract is officially active and the project has begun.

Contract Summary:
  Contract ID      VNT-CTR-20250609-004
  Project          Brand Identity Design
  Client           Your Account
  Freelancer       Mark Ranier Maestre
  Type             Fixed Price
  Total Value      ₱45,000.00
  Start Date       June 13, 2025
  End Date         July 13, 2025

Milestone Schedule:
  Milestone 1   Logo & Visual Identity     ₱15,000  · Due June 20
  Milestone 2   Brand Guidelines Doc       ₱15,000  · Due June 30
  Milestone 3   Final Assets & Handoff     ₱15,000  · Due July 13

All client-freelancer communications must be done through Vantara Messages to ensure coverage under our Payment & Dispute Protection policy.`,
      closing: 'Vantara Contracts Team',
      sigName: '',
      sigRole: 'contracts@vantara.ph',
      actions: [
        { label: 'View Project',    icon: 'folder-open-outline',    color: BLUE, bg: BLUE_SOFT },
        { label: 'View Contract',   icon: 'document-text-outline',  color: GOLD, bg: GOLD_SOFT },
        { label: 'Message Mark',    icon: 'chatbubble-outline',     color: PURPLE, bg: PURPLE_SOFT },
      ],
    },
  },
  {
    id: 'n8',
    type: 'review_request',
    category: 'older',
    title: 'Leave a Review',
    sender: 'Mark Ranier Maestre',
    senderSub: 'E-commerce UI Redesign · Project Completed',
    preview: 'The project has been marked complete. Share your experience working with Mark Ranier by leaving a review.',
    time: 'Jun 7',
    fullDate: 'Saturday, June 7, 2025',
    read: true,
    icon: 'star-outline',
    accentColor: GOLD,
    bgColor: GOLD_SOFT,
    tag: 'Review Pending',
    tagColor: GOLD,
    tagBg: GOLD_SOFT,
    senderInitials: 'MR',
    senderAvatarColor: GOLD,
    detail: {
      subject: 'How was your experience with Mark Ranier Maestre?',
      greeting: 'Hi,',
      body: `Your project with Mark Ranier Maestre has been marked as completed. We'd love to hear about your experience!

Project:  E-commerce Mobile UI Redesign
Freelancer:  Mark Ranier Maestre
Completed:  June 7, 2025

Leaving a review helps:
  — Other clients make informed hiring decisions
  — Recognize freelancers for great work
  — Build a trustworthy community on Vantara

Your review is completely within your control. You can rate Mark Ranier on overall quality, communication, timeliness, and whether you'd hire him again. Reviews are public and visible on his Vantara profile.

Note: Mark Ranier has already submitted a review of his experience working with you. You'll be able to see his review only after you submit yours (to ensure fairness).

Please take 2 minutes to leave your review — it means a lot to freelancers like Mark Ranier.`,
      closing: 'Thank you for using Vantara,',
      sigName: 'Vantara Review Team',
      sigRole: 'reviews@vantara.ph',
      actions: [
        { label: 'Leave a Review',  icon: 'star-outline',           color: GOLD,  bg: GOLD_SOFT },
        { label: 'View Project',    icon: 'folder-open-outline',    color: BLUE,  bg: BLUE_SOFT },
      ],
    },
  },
  {
    id: 'n9',
    type: 'payment',
    category: 'older',
    title: 'Payment Released to Freelancer',
    sender: 'Vantara Payments',
    senderSub: 'Milestone 1 — Logo & Visual Identity',
    preview: '₱15,000.00 has been released to Mark Ranier Maestre for Milestone 1 approval.',
    time: 'Jun 5',
    fullDate: 'Thursday, June 5, 2025',
    read: true,
    icon: 'wallet-outline',
    accentColor: GREEN,
    bgColor: GREEN_SOFT,
    tag: '₱15,000 Released',
    tagColor: GREEN,
    tagBg: GREEN_SOFT,
    senderInitials: 'VP',
    senderAvatarColor: GREEN,
    detail: {
      subject: 'Payment Released — ₱15,000.00 to Mark Ranier Maestre · Milestone 1',
      greeting: 'Hi,',
      body: `A milestone payment has been successfully released from escrow to Mark Ranier Maestre following your approval.

Payment Summary:
  Freelancer       Mark Ranier Maestre
  Project          Brand Identity Design
  Milestone        Milestone 1 — Logo & Visual Identity
  Amount Released  ₱15,000.00
  Transaction ID   VNT-20250605-00781
  Date             June 5, 2025
  Released By      Your Account (Milestone Approved)

The funds have been transferred to Mark Ranier's Vantara Wallet. This transaction is now final.

Remaining Milestones:
  Milestone 2   Brand Guidelines Doc       ₱15,000  · Pending
  Milestone 3   Final Assets & Handoff     ₱15,000  · Pending

For any questions regarding this payment, please contact Vantara Support.`,
      closing: 'Vantara Payments Team',
      sigName: '',
      sigRole: 'payments@vantara.ph',
      actions: [
        { label: 'Download Receipt', icon: 'download-outline',      color: GREEN, bg: GREEN_SOFT },
        { label: 'View Project',     icon: 'folder-open-outline',   color: BLUE,  bg: BLUE_SOFT },
      ],
    },
  },
  {
    id: 'n10',
    type: 'system',
    category: 'older',
    title: 'Job Posting Expiring Soon',
    sender: 'Vantara Jobs',
    senderSub: 'Senior React Developer · Job Post',
    preview: 'Your job posting "Senior React Developer" will expire in 3 days. Renew now to keep receiving applications.',
    time: 'Jun 3',
    fullDate: 'Tuesday, June 3, 2025',
    read: true,
    icon: 'alert-circle-outline',
    accentColor: ORANGE,
    bgColor: ORANGE_SOFT,
    tag: 'Expiring Soon',
    tagColor: ORANGE,
    tagBg: ORANGE_SOFT,
    senderInitials: 'VJ',
    senderAvatarColor: ORANGE,
    detail: {
      subject: 'Your Job Posting Expires in 3 Days — Senior React Developer',
      greeting: 'Hi,',
      body: `Your job posting "Senior React Developer" is set to expire on June 6, 2025 — that's 3 days from now.

Job Posting Summary:
  Title            Senior React Developer
  Posted           May 23, 2025
  Expires          June 6, 2025
  Applications     14 received
  Status           Active (Expiring Soon)

To continue receiving applications and keep your post visible to top freelancers on Vantara, please renew your posting before it expires.

Alternatively, if you've already found the right candidate or no longer need to fill this role, you can close the posting from your Jobs Dashboard.

Note: Once a posting expires, it will be removed from search results and freelancers will no longer be able to apply. Existing applications will remain accessible in your account.`,
      closing: 'Vantara Jobs Team',
      sigName: '',
      sigRole: 'jobs@vantara.ph',
      actions: [
        { label: 'Renew Posting',   icon: 'refresh-outline',        color: ORANGE, bg: ORANGE_SOFT },
        { label: 'View Applicants', icon: 'people-outline',         color: BLUE,   bg: BLUE_SOFT },
        { label: 'Close Post',      icon: 'close-circle-outline',   color: RED,    bg: RED_SOFT },
      ],
    },
  },
];

const FILTERS = [
  { key: 'All',        label: 'All',          types: null },
  { key: 'Unread',     label: 'Unread',       types: 'unread' },
  { key: 'Messages',   label: 'Messages',     types: ['message'] },
  { key: 'Applicants', label: 'Applicants',   types: ['application'] },
  { key: 'Projects',   label: 'Projects',     types: ['milestone', 'contract', 'offer_accepted', 'interview'] },
  { key: 'Payments',   label: 'Payments',     types: ['payment'] },
  { key: 'System',     label: 'System',       types: ['review_request', 'system'] },
];

const SECTION_LABELS = { today: 'Today', yesterday: 'Yesterday', older: 'Earlier' };

// ── Detail Screen ─────────────────────────────────────────────────────────────
function NotificationDetail({ notification: n, onBack }) {
  const d = n.detail;
  const avatarBg = n.senderAvatarColor || NAVY;

  return (
    <SafeAreaView style={ds.safe} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor={NAVY} />

      <View style={ds.header}>
        <TouchableOpacity style={ds.backBtn} onPress={onBack} activeOpacity={0.7}>
          <Ionicons name="arrow-back" size={20} color={WHITE} />
        </TouchableOpacity>
        <Text style={ds.headerTitle} numberOfLines={1}>{d.subject}</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView style={ds.scroll} contentContainerStyle={ds.scrollContent} showsVerticalScrollIndicator={false}>

        {/* Subject + tag */}
        <View style={ds.subjectCard}>
          <View style={[ds.typeIcon, { backgroundColor: n.bgColor }]}>
            <Ionicons name={n.icon} size={22} color={n.accentColor} />
          </View>
          <View style={ds.subjectMeta}>
            <Text style={ds.subjectText}>{d.subject}</Text>
            <View style={[ds.tag, { backgroundColor: n.tagBg, borderColor: n.tagColor + '40' }]}>
              <Text style={[ds.tagText, { color: n.tagColor }]}>{n.tag}</Text>
            </View>
          </View>
        </View>

        {/* Sender row */}
        <View style={ds.metaCard}>
          <View style={ds.senderRow}>
            <View style={[ds.avatar, { backgroundColor: avatarBg }]}>
              <Text style={ds.avatarText}>{n.senderInitials}</Text>
            </View>
            <View style={ds.senderMeta}>
              <Text style={ds.senderName}>{n.sender}</Text>
              <Text style={ds.senderSub}>{n.senderSub}</Text>
            </View>
            <Text style={ds.dateText}>{n.fullDate}</Text>
          </View>

          <View style={ds.innerDivider} />

          {/* To: You */}
          <View style={ds.toRow}>
            <Text style={ds.toLabel}>To</Text>
            <View style={ds.toChip}>
              <Ionicons name="person-circle-outline" size={14} color={GOLD} />
              <Text style={ds.toName}>You (Client Account)</Text>
            </View>
          </View>
        </View>

        {/* Body */}
        <View style={ds.bodyCard}>
          {d.greeting ? <Text style={ds.greeting}>{d.greeting}</Text> : null}
          <Text style={ds.bodyText}>{d.body}</Text>
          {d.closing ? <Text style={ds.closing}>{d.closing}</Text> : null}
          {d.sigName ? <Text style={ds.sigName}>{d.sigName}</Text> : null}
          {d.sigRole ? <Text style={ds.sigRole}>{d.sigRole}</Text> : null}
        </View>

        {/* Actions */}
        {d.actions && d.actions.length > 0 && (
          <View style={ds.actionsCard}>
            <Text style={ds.actionsLabel}>Quick Actions</Text>
            <View style={ds.actionsWrap}>
              {d.actions.map((a, i) => (
                <TouchableOpacity
                  key={i}
                  style={[ds.actionBtn, { backgroundColor: a.bg, borderColor: a.color + '35' }]}
                  activeOpacity={0.75}
                >
                  <Ionicons name={a.icon} size={15} color={a.color} />
                  <Text style={[ds.actionText, { color: a.color }]}>{a.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* Footer */}
        <View style={ds.footer}>
          <Ionicons name="shield-checkmark-outline" size={12} color={TEXT_MUTED} />
          <Text style={ds.footerText}>
            Sent via Vantara · Notification for your Client Account
          </Text>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

// ── List Screen ───────────────────────────────────────────────────────────────
export default function ClientNotifications({ onNavigate }) {
  const [notifications, setNotifications] = useState(MOCK_NOTIFICATIONS);
  const [refreshing, setRefreshing]       = useState(false);
  const [activeFilter, setActiveFilter]   = useState('All');
  const [selected, setSelected]           = useState(null);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1400);
  }, []);

  const markAsRead = (id) =>
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));

  const markAllAsRead = () => {
    Alert.alert('Mark All as Read', 'Mark all notifications as read?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Mark All Read', onPress: () => setNotifications(prev => prev.map(n => ({ ...n, read: true }))) },
    ]);
  };

  const handlePress = (n) => {
    if (!n.read) markAsRead(n.id);
    setSelected(n);
  };

  const getFiltered = () => {
    const f = FILTERS.find(f => f.key === activeFilter);
    if (!f || f.types === null) return notifications;
    if (f.types === 'unread') return notifications.filter(n => !n.read);
    return notifications.filter(n => f.types.includes(n.type));
  };

  const grouped = () => {
    const filtered = getFiltered();
    const out = {};
    filtered.forEach(n => {
      if (!out[n.category]) out[n.category] = [];
      out[n.category].push(n);
    });
    return out;
  };

  if (selected) {
    return <NotificationDetail notification={selected} onBack={() => setSelected(null)} />;
  }

  const unreadCount = notifications.filter(n => !n.read).length;
  const sections    = grouped();
  const sectionKeys = Object.keys(sections);

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor={NAVY} />

      <View style={s.header}>
        <TouchableOpacity style={s.backBtn} onPress={() => onNavigate?.('ClientDashboard')} activeOpacity={0.7}>
          <Ionicons name="arrow-back" size={20} color={WHITE} />
        </TouchableOpacity>
        <View style={s.headerCenter}>
          <Text style={s.headerTitle}>Notifications</Text>
          {unreadCount > 0 && (
            <View style={s.headerBadge}><Text style={s.headerBadgeText}>{unreadCount}</Text></View>
          )}
        </View>
        {unreadCount > 0 ? (
          <TouchableOpacity style={s.markAllBtn} onPress={markAllAsRead} activeOpacity={0.75}>
            <Ionicons name="checkmark-done-outline" size={14} color={GOLD_LT} />
            <Text style={s.markAllText}>Mark read</Text>
          </TouchableOpacity>
        ) : (
          <View style={{ width: 84 }} />
        )}
      </View>

      <View style={s.filterBar}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.filterScroll}>
          {FILTERS.map(f => {
            const active = activeFilter === f.key;
            return (
              <TouchableOpacity
                key={f.key}
                style={[s.filterChip, active && s.filterChipActive]}
                onPress={() => setActiveFilter(f.key)}
                activeOpacity={0.75}
              >
                <Text style={[s.filterChipText, active && s.filterChipTextActive]}>{f.label}</Text>
                {f.key === 'Unread' && unreadCount > 0 && (
                  <View style={[s.chipBadge, active && s.chipBadgeActive]}>
                    <Text style={s.chipBadgeText}>{unreadCount}</Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      <ScrollView
        style={s.list}
        contentContainerStyle={s.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={BLUE} />}
      >
        {sectionKeys.length === 0 ? (
          <View style={s.empty}>
            <View style={s.emptyIcon}>
              <Ionicons name="notifications-off-outline" size={40} color={TEXT_MUTED} />
            </View>
            <Text style={s.emptyTitle}>Nothing here</Text>
            <Text style={s.emptyBody}>
              {activeFilter === 'All' ? 'No notifications yet.' : `No ${activeFilter.toLowerCase()} notifications.`}
            </Text>
          </View>
        ) : (
          sectionKeys.map(sk => (
            <View key={sk}>
              <View style={s.sectionHeader}>
                <Text style={s.sectionLabel}>{SECTION_LABELS[sk] || sk}</Text>
                <View style={s.sectionLine} />
              </View>
              {sections[sk].map((n, idx) => (
                <NotifRow
                  key={n.id}
                  n={n}
                  isLast={idx === sections[sk].length - 1}
                  onPress={() => handlePress(n)}
                />
              ))}
            </View>
          ))
        )}
        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

function NotifRow({ n, isLast, onPress }) {
  return (
    <TouchableOpacity
      style={[s.row, !n.read && s.rowUnread, isLast && s.rowLast]}
      onPress={onPress}
      activeOpacity={0.72}
    >
      {!n.read && <View style={s.unreadBar} />}

      {/* Avatar with initials */}
      <View style={[s.avatar, { backgroundColor: n.senderAvatarColor || NAVY }]}>
        <Text style={s.avatarText}>{n.senderInitials}</Text>
      </View>

      <View style={s.body}>
        <View style={s.rowTop}>
          <Text style={[s.sender, !n.read && s.senderBold]} numberOfLines={1}>{n.sender}</Text>
          <Text style={s.time}>{n.time}</Text>
        </View>
        <Text style={[s.title, !n.read && s.titleBold]} numberOfLines={1}>{n.title}</Text>
        <Text style={s.preview} numberOfLines={2}>{n.preview}</Text>
        <View style={[s.tag, { backgroundColor: n.tagBg, borderColor: n.tagColor + '30' }]}>
          <Text style={[s.tagText, { color: n.tagColor }]}>{n.tag}</Text>
        </View>
      </View>

      {!n.read && <View style={[s.dot, { backgroundColor: n.accentColor }]} />}
    </TouchableOpacity>
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
  headerCenter: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  headerTitle: { fontSize: 17, fontWeight: '700', color: WHITE, letterSpacing: -0.2 },
  headerBadge: {
    backgroundColor: GOLD, borderRadius: 10,
    minWidth: 20, height: 20, paddingHorizontal: 5,
    alignItems: 'center', justifyContent: 'center',
  },
  headerBadgeText: { fontSize: 11, fontWeight: '700', color: WHITE },
  markAllBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: 'rgba(212,160,23,0.12)', borderRadius: 16,
    paddingHorizontal: 10, paddingVertical: 6,
    borderWidth: 1, borderColor: 'rgba(212,160,23,0.25)',
  },
  markAllText: { fontSize: 11, fontWeight: '600', color: GOLD_LT },
  filterBar: { backgroundColor: WHITE, borderBottomWidth: 1, borderBottomColor: DIVIDER },
  filterScroll: { paddingHorizontal: 14, paddingVertical: 10, gap: 8, flexDirection: 'row' },
  filterChip: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 13, paddingVertical: 6,
    borderRadius: 20, borderWidth: 1.5, borderColor: DIVIDER, backgroundColor: WHITE,
  },
  filterChipActive: { backgroundColor: NAVY, borderColor: NAVY },
  filterChipText: { fontSize: 13, fontWeight: '500', color: TEXT_MED },
  filterChipTextActive: { color: WHITE, fontWeight: '600' },
  chipBadge: {
    backgroundColor: BLUE, borderRadius: 8,
    minWidth: 16, height: 16, paddingHorizontal: 4,
    alignItems: 'center', justifyContent: 'center',
  },
  chipBadgeActive: { backgroundColor: GOLD },
  chipBadgeText: { fontSize: 9, fontWeight: '700', color: WHITE },
  list: { flex: 1, backgroundColor: BG },
  listContent: { paddingTop: 6 },
  sectionHeader: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingTop: 16, paddingBottom: 8, gap: 10,
  },
  sectionLabel: {
    fontSize: 11, fontWeight: '700', color: TEXT_MUTED,
    textTransform: 'uppercase', letterSpacing: 0.8,
  },
  sectionLine: { flex: 1, height: 1, backgroundColor: DIVIDER },
  row: {
    flexDirection: 'row', alignItems: 'flex-start',
    backgroundColor: SURFACE, marginHorizontal: 12, marginBottom: 2,
    paddingHorizontal: 14, paddingVertical: 14,
    borderRadius: 12, borderWidth: 1, borderColor: DIVIDER,
    position: 'relative', overflow: 'hidden',
  },
  rowUnread: {
    backgroundColor: WHITE, borderColor: '#D0DFF5',
    shadowColor: '#1A56DB', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06, shadowRadius: 4, elevation: 2,
  },
  rowLast: { marginBottom: 6 },
  unreadBar: {
    position: 'absolute', left: 0, top: 0, bottom: 0, width: 3,
    backgroundColor: BLUE, borderTopLeftRadius: 12, borderBottomLeftRadius: 12,
  },
  avatar: {
    width: 44, height: 44, borderRadius: 22,
    alignItems: 'center', justifyContent: 'center',
    marginRight: 12, marginTop: 2, flexShrink: 0,
  },
  avatarText: { fontSize: 14, fontWeight: '700', color: WHITE },
  body: { flex: 1 },
  rowTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 },
  sender: { fontSize: 13, fontWeight: '600', color: TEXT_DARK, flex: 1, marginRight: 8 },
  senderBold: { color: TEXT_DARK, fontWeight: '700' },
  time: { fontSize: 10, color: TEXT_MUTED, flexShrink: 0 },
  title: { fontSize: 12, fontWeight: '400', color: TEXT_MUTED, marginBottom: 3 },
  titleBold: { fontWeight: '600', color: TEXT_MED },
  preview: { fontSize: 12, color: TEXT_MUTED, lineHeight: 17, marginBottom: 8 },
  tag: {
    alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 3,
    borderRadius: 6, borderWidth: 1,
  },
  tagText: { fontSize: 10, fontWeight: '700', letterSpacing: 0.2, textTransform: 'uppercase' },
  dot: { width: 8, height: 8, borderRadius: 4, marginTop: 4, marginLeft: 8, flexShrink: 0 },
  empty: { alignItems: 'center', paddingTop: 80, paddingHorizontal: 40 },
  emptyIcon: {
    width: 72, height: 72, borderRadius: 36, backgroundColor: SURFACE,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: DIVIDER, marginBottom: 16,
  },
  emptyTitle: { fontSize: 17, fontWeight: '700', color: TEXT_DARK, marginBottom: 6 },
  emptyBody: { fontSize: 13, color: TEXT_MUTED, textAlign: 'center', lineHeight: 19 },
});

const ds = StyleSheet.create({
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
  headerTitle: { fontSize: 14, fontWeight: '600', color: WHITE, flex: 1, marginHorizontal: 10 },
  scroll: { flex: 1, backgroundColor: BG },
  scrollContent: { padding: 16, gap: 10 },
  subjectCard: {
    flexDirection: 'row', alignItems: 'flex-start',
    backgroundColor: SURFACE, borderRadius: 14, padding: 16,
    borderWidth: 1, borderColor: DIVIDER, gap: 14,
  },
  typeIcon: {
    width: 48, height: 48, borderRadius: 24,
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  subjectMeta: { flex: 1, gap: 8 },
  subjectText: { fontSize: 15, fontWeight: '700', color: TEXT_DARK, lineHeight: 21 },
  tag: {
    alignSelf: 'flex-start', paddingHorizontal: 9, paddingVertical: 4,
    borderRadius: 7, borderWidth: 1,
  },
  tagText: { fontSize: 10, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.3 },
  metaCard: {
    backgroundColor: SURFACE, borderRadius: 14,
    borderWidth: 1, borderColor: DIVIDER, overflow: 'hidden',
  },
  senderRow: { flexDirection: 'row', alignItems: 'center', padding: 14, gap: 12 },
  avatar: {
    width: 42, height: 42, borderRadius: 21,
    alignItems: 'center', justifyContent: 'center',
  },
  avatarText: { fontSize: 14, fontWeight: '700', color: WHITE },
  senderMeta: { flex: 1 },
  senderName: { fontSize: 13, fontWeight: '700', color: TEXT_DARK },
  senderSub: { fontSize: 11, color: TEXT_MUTED, marginTop: 2 },
  dateText: { fontSize: 10, color: TEXT_MUTED },
  innerDivider: { height: 1, backgroundColor: DIVIDER, marginHorizontal: 14 },
  toRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 14, paddingVertical: 10, gap: 10,
  },
  toLabel: { fontSize: 11, fontWeight: '600', color: TEXT_MUTED, width: 24 },
  toChip: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: GOLD_SOFT, borderRadius: 12,
    paddingHorizontal: 10, paddingVertical: 4,
    borderWidth: 1, borderColor: GOLD + '30',
  },
  toName: { fontSize: 12, fontWeight: '600', color: GOLD },
  bodyCard: {
    backgroundColor: SURFACE, borderRadius: 14, padding: 18,
    borderWidth: 1, borderColor: DIVIDER,
  },
  greeting: { fontSize: 14, fontWeight: '600', color: TEXT_DARK, marginBottom: 12 },
  bodyText: { fontSize: 13.5, color: TEXT_MED, lineHeight: 22, marginBottom: 20 },
  closing: { fontSize: 13, color: TEXT_MUTED, marginBottom: 4 },
  sigName: { fontSize: 14, fontWeight: '700', color: TEXT_DARK },
  sigRole: { fontSize: 12, color: TEXT_MUTED, marginTop: 2 },
  actionsCard: {
    backgroundColor: SURFACE, borderRadius: 14, padding: 16,
    borderWidth: 1, borderColor: DIVIDER,
  },
  actionsLabel: { fontSize: 11, fontWeight: '700', color: TEXT_MUTED, textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 12 },
  actionsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  actionBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 7,
    paddingHorizontal: 14, paddingVertical: 10,
    borderRadius: 10, borderWidth: 1,
  },
  actionText: { fontSize: 13, fontWeight: '700' },
  footer: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: SURFACE, borderRadius: 10, padding: 12,
    borderWidth: 1, borderColor: DIVIDER,
  },
  footerText: { fontSize: 10, color: TEXT_MUTED, flex: 1, lineHeight: 15 },
});