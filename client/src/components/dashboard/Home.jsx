import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  Svg,
  Path,
  Circle,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg2, { Path as SvgPath, Circle as SvgCircle } from 'react-native-svg';

// ─── Palette ─────────────────────────────────────────────────────────────────
const ELECTRIC      = '#2375e0';   // sky blue — main color
const ELECTRIC_MID  = '#2375e0';   // lighter sky blue
const SIDEBAR_DARK  = '#0A2A3A';   // dark teal-navy sidebar
const WHITE         = '#FFFFFF';
const TEXT_MAIN     = '#0B1929';
const TEXT_BODY     = '#3D4F63';
const TEXT_MUTED    = '#6B7A8D';
const CARD_LINE     = '#E8EDF3';
const BLUE_ICON_BG  = '#E0F7FA';
const GREEN_ICON_BG = '#E6F7EE';
const GOLD_ICON_BG  = '#FEF3DD';
const GREEN         = '#22A55B';
const GOLD          = '#E29E0A';
const PILL_GREEN_BG = '#E6F7EE';
const PILL_GREEN_TX = '#1A7A4B';
const PILL_BLUE_BG  = '#E0F7FA';
const PILL_BLUE_TX  = '#00B4C6';
const PILL_GOLD_BG  = '#FEF3DD';
const PILL_GOLD_TX  = '#9A6A00';
// ─────────────────────────────────────────────────────────────────────────────

export default function SplashScreen({ onNavigate }) {
  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <StatusBar barStyle="light-content" backgroundColor={ELECTRIC} />

      {/* ── Hero / Illustration Area ──────────────────────────────── */}
      <View style={styles.heroArea}>
        {/* Large translucent circle behind everything */}
        <View style={styles.bgCircle} />

        {/* ── Sidebar + Main dashboard card group ─────────────────── */}
        <View style={styles.dashGroup}>

          {/* Dark sidebar */}
          <View style={styles.sidebar}>
            {/* Grid icon */}
            <View style={styles.sidebarIconActive}>
              <View style={styles.grid2x2}>
                <View style={styles.gridDot} />
                <View style={styles.gridDot} />
                <View style={styles.gridDot} />
                <View style={styles.gridDot} />
              </View>
            </View>
            <View style={styles.sidebarIcon}><View style={styles.sidebarLine} /></View>
            <View style={styles.sidebarIcon}><View style={[styles.sidebarLine, { width: 18 }]} /></View>
            <View style={styles.sidebarIcon}><View style={styles.sidebarCircle} /></View>
          </View>

          {/* Main white dashboard card */}
          <View style={styles.mainCard}>
            {/* Card top bar */}
            <View style={styles.cardTopBar}>
              <View style={styles.cardBarBlue} />
              <View style={styles.cardTopRight}>
                <View style={styles.cardDotGray} />
                <View style={styles.cardAvatar}>
                  <View style={styles.cardAvatarCircle} />
                </View>
              </View>
            </View>

            {/* Stats row: 24 Projects | 12 In Progress | 5 Pending */}
            <View style={styles.statsRow}>
              <View style={styles.statBox}>
                <View style={[styles.statIconBg, { backgroundColor: BLUE_ICON_BG }]}>
                  <View style={styles.folderIcon}>
                    <View style={styles.folderTab} />
                    <View style={styles.folderBody} />
                  </View>
                </View>
                <Text style={styles.statNum}>24</Text>
                <Text style={styles.statLbl}>Projects</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statBox}>
                <View style={[styles.statIconBg, { backgroundColor: GREEN_ICON_BG }]}>
                  {/* Green checkmark circle */}
                  <View style={[styles.checkCircle, { backgroundColor: GREEN }]}>
                    <View style={styles.ckShort} />
                    <View style={styles.ckLong} />
                  </View>
                </View>
                <Text style={styles.statNum}>12</Text>
                <Text style={styles.statLbl}>In Progress</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statBox}>
                <View style={[styles.statIconBg, { backgroundColor: GOLD_ICON_BG }]}>
                  {/* Gold clock circle */}
                  <View style={[styles.checkCircle, { backgroundColor: GOLD }]}>
                    <View style={styles.clockDot} />
                    <View style={styles.clockHand} />
                  </View>
                </View>
                <Text style={styles.statNum}>5</Text>
                <Text style={styles.statLbl}>Pending</Text>
              </View>
            </View>

            {/* Divider */}
            <View style={styles.cardDivider} />

            {/* Recent Applications label */}
            <Text style={styles.recentLabel}>Recent Applications</Text>

            {/* App rows */}
            {[
              { label: 'A1', bg: ELECTRIC,  status: 'Approved', pillBg: PILL_GREEN_BG, pillTx: PILL_GREEN_TX, w1: '72%', w2: '50%' },
              { label: 'A2', bg: GREEN,     status: 'In Review', pillBg: PILL_BLUE_BG,  pillTx: PILL_BLUE_TX,  w1: '65%', w2: '45%' },
              { label: 'A3', bg: GOLD,      status: 'Pending',  pillBg: PILL_GOLD_BG,  pillTx: PILL_GOLD_TX,  w1: '60%', w2: '40%' },
            ].map((item) => (
              <View key={item.label} style={styles.appRow}>
                <View style={[styles.appAvatar, { backgroundColor: item.bg }]}>
                  <Text style={styles.appAvatarText}>{item.label}</Text>
                </View>
                <View style={styles.appLines}>
                  <View style={[styles.appLine, { width: item.w1 }]} />
                  <View style={[styles.appLine, { width: item.w2, marginTop: 5 }]} />
                </View>
                <View style={[styles.statusPill, { backgroundColor: item.pillBg }]}>
                  <Text style={[styles.statusPillText, { color: item.pillTx }]}>{item.status}</Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* ── Blue checkmark badge — top right ─────────────────────── */}
        <View style={styles.checkBadge}>
          <View style={styles.ckShort2} />
          <View style={styles.ckLong2} />
        </View>

        {/* ── "System Ready" pill — bottom left ────────────────────── */}
        <View style={styles.systemPill}>
          <View style={styles.systemDot} />
          <Text style={styles.systemText}>System Ready</Text>
        </View>

        {/* ── Progress Overview card — bottom right ─────────────────── */}
        <View style={styles.progressCard}>
          <Text style={styles.progressTitle}>Progress Overview</Text>
          {/* Simple SVG line chart */}
          <Svg2 width="120" height="52" viewBox="0 0 120 52">
            {/* Light area fill */}
            <SvgPath
              d="M4 46 C18 40 30 34 44 28 C58 22 70 24 84 16 C98 8 108 6 116 4 L116 52 L4 52 Z"
              fill={BLUE_ICON_BG}
            />
            {/* Line */}
            <SvgPath
              d="M4 46 C18 40 30 34 44 28 C58 22 70 24 84 16 C98 8 108 6 116 4"
              stroke={ELECTRIC}
              strokeWidth="2.5"
              strokeLinecap="round"
              fill="none"
            />
            {/* End dot */}
            <SvgCircle cx="116" cy="4" r="4" fill={ELECTRIC} />
          </Svg2>
          <View style={styles.progressLine} />
        </View>
      </View>

      {/* ── Bottom Sheet ──────────────────────────────────────────── */}
      <View style={styles.bottomSheet}>
        {/* Progress dots */}
        <View style={styles.dotsRow}>
          <View style={[styles.dot, styles.dotActive]} />
          <View style={styles.dot} />
          <View style={styles.dot} />
          <View style={styles.dot} />
        </View>

        <Text style={styles.eyebrow}>APPLICATIONS SYSTEM</Text>
        <Text style={styles.headline}>
          {'Manage. Track. Approve.\n'}
          <Text style={styles.headlineBlue}>All in One Place.</Text>
        </Text>
        <Text style={styles.subtext}>
          Streamline your workflow, monitor applications in real-time, and make smarter decisions.
        </Text>

        {/* Get Started button */}
        <TouchableOpacity
          style={styles.btnPrimary}
          onPress={() => onNavigate('Login')}
          activeOpacity={0.85}
        >
          <Text style={styles.btnPrimaryText}>Get Started</Text>
        </TouchableOpacity>

        {/* Sign in row */}
        <View style={styles.loginRow}>
          <Text style={styles.loginText}>Already have an account? </Text>
          <TouchableOpacity onPress={() => onNavigate('Login')} activeOpacity={0.7}>
            <Text style={styles.loginLink}>Sign in</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: ELECTRIC,
  },

  // ── Hero Area ─────────────────────────────────────────────────
  heroArea: {
    flex: 1,
    position: 'relative',
    overflow: 'hidden',
    paddingTop: 24,
    paddingHorizontal: 20,
    paddingBottom: 16,
  },

  // Large translucent circle
  bgCircle: {
    position: 'absolute',
    width: 340,
    height: 340,
    borderRadius: 170,
    backgroundColor: 'rgba(255,255,255,0.09)',
    top: 10,
    alignSelf: 'center',
  },

  // Sidebar + main card group
  dashGroup: {
    flexDirection: 'row',
    marginTop: 20,
    marginLeft: 8,
    zIndex: 2,
  },

  // ── Sidebar ───────────────────────────────────────────────────
  sidebar: {
    width: 44,
    backgroundColor: SIDEBAR_DARK,
    borderTopLeftRadius: 14,
    borderBottomLeftRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    gap: 18,
  },
  sidebarIconActive: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sidebarIcon: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  grid2x2: {
    width: 14,
    height: 14,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 3,
  },
  gridDot: {
    width: 5,
    height: 5,
    borderRadius: 1.5,
    backgroundColor: WHITE,
  },
  sidebarLine: {
    width: 22,
    height: 3,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.35)',
  },
  sidebarCircle: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2.5,
    borderColor: 'rgba(255,255,255,0.35)',
  },

  // ── Main dashboard card ───────────────────────────────────────
  mainCard: {
    flex: 1,
    backgroundColor: WHITE,
    borderTopRightRadius: 14,
    borderBottomRightRadius: 14,
    padding: 14,
  },
  cardTopBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  cardBarBlue: {
    height: 4,
    width: 56,
    borderRadius: 2,
    backgroundColor: ELECTRIC,
  },
  cardTopRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  cardDotGray: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: CARD_LINE,
  },
  cardAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: CARD_LINE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardAvatarCircle: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#BCC5D0',
  },

  // Stats
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  statBox: {
    flex: 1,
    alignItems: 'center',
  },
  statDivider: {
    width: 0.5,
    height: 40,
    backgroundColor: CARD_LINE,
  },
  statIconBg: {
    width: 30,
    height: 30,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  // Folder icon
  folderIcon: { alignItems: 'center' },
  folderTab: {
    width: 10,
    height: 4,
    borderTopLeftRadius: 2,
    borderTopRightRadius: 2,
    backgroundColor: ELECTRIC,
    alignSelf: 'flex-start',
    marginLeft: 2,
  },
  folderBody: {
    width: 16,
    height: 11,
    borderRadius: 2,
    backgroundColor: ELECTRIC,
  },
  // Check/clock circle
  checkCircle: {
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ckShort: {
    position: 'absolute',
    width: 5,
    height: 2,
    backgroundColor: WHITE,
    borderRadius: 1,
    bottom: 6,
    left: 4,
    transform: [{ rotate: '45deg' }],
  },
  ckLong: {
    position: 'absolute',
    width: 9,
    height: 2,
    backgroundColor: WHITE,
    borderRadius: 1,
    bottom: 5,
    left: 7,
    transform: [{ rotate: '-50deg' }],
  },
  clockDot: {
    position: 'absolute',
    width: 2,
    height: 2,
    borderRadius: 1,
    backgroundColor: WHITE,
    top: 8,
    left: 8,
  },
  clockHand: {
    position: 'absolute',
    width: 1.5,
    height: 6,
    borderRadius: 1,
    backgroundColor: WHITE,
    bottom: 8,
    left: 8,
    transform: [{ rotate: '30deg' }],
  },
  statNum: {
    fontSize: 14,
    fontWeight: '700',
    color: TEXT_MAIN,
  },
  statLbl: {
    fontSize: 8,
    color: TEXT_MUTED,
    marginTop: 1,
  },

  cardDivider: {
    height: 0.5,
    backgroundColor: CARD_LINE,
    marginBottom: 8,
  },
  recentLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: TEXT_MAIN,
    marginBottom: 8,
  },

  // App rows
  appRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 7,
  },
  appAvatar: {
    width: 22,
    height: 22,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  appAvatarText: {
    fontSize: 8,
    fontWeight: '800',
    color: WHITE,
  },
  appLines: {
    flex: 1,
    marginHorizontal: 8,
  },
  appLine: {
    height: 4,
    borderRadius: 2,
    backgroundColor: CARD_LINE,
  },
  statusPill: {
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 20,
  },
  statusPillText: {
    fontSize: 7.5,
    fontWeight: '700',
  },

  // ── Check badge (top right floating) ─────────────────────────
  checkBadge: {
    position: 'absolute',
    top: 30,
    right: 22,
    zIndex: 5,
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: ELECTRIC,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
  },
  ckShort2: {
    position: 'absolute',
    width: 8,
    height: 2.5,
    backgroundColor: WHITE,
    borderRadius: 2,
    bottom: 18,
    left: 11,
    transform: [{ rotate: '45deg' }],
  },
  ckLong2: {
    position: 'absolute',
    width: 14,
    height: 2.5,
    backgroundColor: WHITE,
    borderRadius: 2,
    bottom: 17,
    left: 17,
    transform: [{ rotate: '-50deg' }],
  },

  // ── System Ready pill ────────────────────────────────────────
  systemPill: {
    position: 'absolute',
    bottom: 28,
    left: 16,
    zIndex: 5,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: WHITE,
    borderRadius: 999,
    paddingVertical: 10,
    paddingHorizontal: 18,
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 6,
  },
  systemDot: {
    width: 9,
    height: 9,
    borderRadius: 5,
    backgroundColor: ELECTRIC,
  },
  systemText: {
    fontSize: 13,
    fontWeight: '700',
    color: TEXT_MAIN,
  },

  // ── Progress Overview card ────────────────────────────────────
  progressCard: {
    position: 'absolute',
    bottom: 16,
    right: 12,
    zIndex: 5,
    backgroundColor: WHITE,
    borderRadius: 14,
    padding: 12,
    width: 150,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 6,
  },
  progressTitle: {
    fontSize: 9.5,
    fontWeight: '700',
    color: TEXT_MAIN,
    marginBottom: 8,
  },
  progressLine: {
    height: 3,
    borderRadius: 2,
    backgroundColor: CARD_LINE,
    marginTop: 8,
    width: '70%',
  },

  // ── Bottom Sheet ──────────────────────────────────────────────
  bottomSheet: {
    backgroundColor: WHITE,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    paddingHorizontal: 28,
    paddingTop: 26,
    paddingBottom: 36,
  },
  dotsRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 18,
    alignItems: 'center',
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#D0D8E4',
  },
  dotActive: {
    width: 22,
    height: 6,
    borderRadius: 3,
    backgroundColor: ELECTRIC,
  },
  eyebrow: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 2.2,
    color: ELECTRIC,
    marginBottom: 10,
  },
  headline: {
    fontSize: 27,
    fontWeight: '400',
    color: TEXT_MAIN,
    lineHeight: 36,
    marginBottom: 12,
  },
  headlineBlue: {
    color: ELECTRIC,
    fontWeight: '800',
  },
  subtext: {
    fontSize: 14,
    color: TEXT_BODY,
    lineHeight: 22,
    marginBottom: 26,
  },
  btnPrimary: {
    backgroundColor: ELECTRIC,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 18,
  },
  btnPrimaryText: {
    fontSize: 15,
    fontWeight: '700',
    color: WHITE,
    letterSpacing: 0.3,
  },
  loginRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loginText: {
    fontSize: 13,
    color: TEXT_MUTED,
  },
  loginLink: {
    fontSize: 13,
    fontWeight: '700',
    color: ELECTRIC,
  },
});