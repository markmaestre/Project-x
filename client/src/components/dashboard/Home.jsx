import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

// ─── Palette ─────────────────────────────────────────────────────────────────
const TEAL         = '#00B4C6';
const TEAL_DARK    = '#0099A8';
const ELECTRIC     = '#0059FF';
const ELECTRIC_DIM = '#3378FF';
const ELECTRIC_BG  = '#EBF0FF';
const GOLD         = '#C89A0A';
const NAVY_SOFT    = '#E8EDF3';
const WHITE        = '#FFFFFF';
const TEXT_MAIN    = '#0B1929';
const TEXT_BODY    = '#3D4F63';
const TEXT_MUTED   = '#6B7A8D';
// ─────────────────────────────────────────────────────────────────────────────

export default function SplashScreen({ onNavigate }) {
  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <StatusBar barStyle="light-content" backgroundColor={TEAL_DARK} />

      {/* ── Illustration Area ─────────────────────────────────────── */}
      <View style={styles.illustrationArea}>
        <View style={styles.bgCircle1} />
        <View style={styles.bgCircle2} />

        <View style={styles.illustrationWrapper}>
          {/* Stacked cards behind */}
          <View style={[styles.stackCard, styles.stackCard1]} />
          <View style={[styles.stackCard, styles.stackCard2]} />

          {/* Main document card */}
          <View style={styles.mainCard}>
            <View style={styles.cardLine} />
            <View style={[styles.cardLine, { width: 60, marginTop: 8 }]} />
            <View style={styles.cardContentBlock}>
              <View style={[styles.cardMiniLine, { opacity: 0.7 }]} />
              <View style={[styles.cardMiniLine, { width: 70, opacity: 0.45, marginTop: 6 }]} />
              <View style={[styles.cardMiniLine, { width: 50, opacity: 0.3, marginTop: 6 }]} />
            </View>
            <View style={[styles.cardLine, { marginTop: 10 }]} />
            <View style={[styles.cardLine, { width: 70, marginTop: 8 }]} />
          </View>

          {/* Gold checkmark badge — top right */}
          <View style={styles.goldBadge}>
            <View style={styles.goldBadgeInner}>
              {/* checkmark using lines instead of emoji */}
              <View style={styles.checkShort} />
              <View style={styles.checkLong} />
            </View>
          </View>

          {/* Task approved pill — bottom left */}
          <View style={styles.taskPill}>
            <View style={styles.taskPillDot} />
            <Text style={styles.taskPillText}>Task approved</Text>
          </View>

          {/* Mini floating card — bottom right */}
          <View style={styles.miniCard}>
            <View style={[styles.miniCardLine, { width: 55 }]} />
            <View style={[styles.miniCardLine, { width: 40, marginTop: 6 }]} />
            <View style={styles.miniCardBtn} />
          </View>
        </View>
      </View>

      {/* ── Bottom Sheet ──────────────────────────────────────────── */}
      <View style={styles.bottomSheet}>
        {/* Progress dots */}
        <View style={styles.dotsRow}>
          <View style={[styles.dot, styles.dotActive]} />
          <View style={styles.dot} />
          <View style={styles.dot} />
        </View>

        <Text style={styles.eyebrow}>FILIPINO FREELANCE NETWORK</Text>
        <Text style={styles.headline}>
          {"Let's Get You Set Up\n"}
          <Text style={styles.headlineGold}>for Success.</Text>
        </Text>
        <Text style={styles.subtext}>
          Find work you love, manage your gigs, and get paid on time — built for Filipino professionals.
        </Text>

        {/* Get Started → Login */}
        <TouchableOpacity
          style={styles.btnPrimary}
          onPress={() => onNavigate('Login')}
          activeOpacity={0.85}
        >
          <Text style={styles.btnPrimaryText}>Get Started</Text>
        </TouchableOpacity>

        {/* Sign in → Login */}
        <View style={styles.loginRow}>
          <Text style={styles.loginText}>Already have an account? </Text>
          <TouchableOpacity
            onPress={() => onNavigate('Login')}
            activeOpacity={0.7}
          >
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
    backgroundColor: TEAL,
  },

  // ── Illustration ──────────────────────────────────────────────
  illustrationArea: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    paddingTop: 40,
    paddingBottom: 20,
  },
  bgCircle1: {
    position: 'absolute',
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: 'rgba(255,255,255,0.08)',
    top: 20,
    alignSelf: 'center',
  },
  bgCircle2: {
    position: 'absolute',
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: 'rgba(255,255,255,0.07)',
    top: 60,
    alignSelf: 'center',
  },
  illustrationWrapper: {
    width: 280,
    height: 280,
    position: 'relative',
  },

  // Stacked cards
  stackCard: {
    position: 'absolute',
    width: 160,
    height: 200,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  stackCard1: {
    top: 15,
    left: 50,
    transform: [{ rotate: '8deg' }],
  },
  stackCard2: {
    top: 10,
    left: 45,
    transform: [{ rotate: '-4deg' }],
    backgroundColor: 'rgba(0,89,255,0.22)',
  },

  // Main card
  mainCard: {
    position: 'absolute',
    width: 160,
    height: 200,
    backgroundColor: WHITE,
    borderRadius: 16,
    padding: 20,
    top: 5,
    left: 40,
    zIndex: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 20,
    elevation: 10,
  },
  cardLine: {
    height: 10,
    borderRadius: 5,
    backgroundColor: NAVY_SOFT,
    width: '100%',
  },
  cardContentBlock: {
    backgroundColor: ELECTRIC_BG,
    borderRadius: 8,
    padding: 12,
    marginVertical: 14,
  },
  cardMiniLine: {
    height: 6,
    borderRadius: 3,
    backgroundColor: ELECTRIC_DIM,
    width: '100%',
  },

  // Gold checkmark badge
  goldBadge: {
    position: 'absolute',
    top: 0,
    right: 18,
    zIndex: 4,
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: 'rgba(200,154,10,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  goldBadgeInner: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: GOLD,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // checkmark drawn with two rotated views
  checkShort: {
    position: 'absolute',
    width: 7,
    height: 2.5,
    backgroundColor: WHITE,
    borderRadius: 2,
    bottom: 14,
    left: 8,
    transform: [{ rotate: '45deg' }],
  },
  checkLong: {
    position: 'absolute',
    width: 13,
    height: 2.5,
    backgroundColor: WHITE,
    borderRadius: 2,
    bottom: 13,
    left: 12,
    transform: [{ rotate: '-50deg' }],
  },

  // Task pill
  taskPill: {
    position: 'absolute',
    bottom: 28,
    left: 0,
    zIndex: 4,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: WHITE,
    borderRadius: 999,
    paddingVertical: 9,
    paddingHorizontal: 16,
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 6,
  },
  taskPillDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: ELECTRIC,
  },
  taskPillText: {
    fontSize: 13,
    fontWeight: '600',
    color: TEXT_MAIN,
  },

  // Mini card
  miniCard: {
    position: 'absolute',
    bottom: 48,
    right: 8,
    zIndex: 4,
    backgroundColor: WHITE,
    borderRadius: 12,
    padding: 14,
    width: 105,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 6,
  },
  miniCardLine: {
    height: 6,
    borderRadius: 3,
    backgroundColor: NAVY_SOFT,
    width: '100%',
  },
  miniCardBtn: {
    height: 24,
    borderRadius: 6,
    backgroundColor: GOLD,
    marginTop: 10,
  },

  // ── Bottom Sheet ──────────────────────────────────────────────
  bottomSheet: {
    backgroundColor: WHITE,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 28,
    paddingTop: 28,
    paddingBottom: 32,
  },
  dotsRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 20,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#D0D8E4',
  },
  dotActive: {
    width: 20,
    backgroundColor: GOLD,
  },
  eyebrow: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 2.5,
    color: GOLD,
    marginBottom: 12,
  },
  headline: {
    fontSize: 28,
    fontWeight: '300',
    color: TEXT_MAIN,
    lineHeight: 36,
    letterSpacing: -0.5,
    marginBottom: 12,
  },
  headlineGold: {
    color: GOLD,
    fontWeight: '800',
  },
  subtext: {
    fontSize: 14,
    color: TEXT_BODY,
    lineHeight: 22,
    marginBottom: 28,
  },
  btnPrimary: {
    backgroundColor: GOLD,
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