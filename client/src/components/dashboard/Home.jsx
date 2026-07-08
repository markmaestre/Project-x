import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  Dimensions,
  Animated,
  Platform,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Path, Circle, Defs, LinearGradient, Stop, Rect } from 'react-native-svg';

// ─── Palette — Taskra Branding ────────────────────────────────────────────
const NAVY          = '#0A1F3D';
const NAVY_DEEP     = '#071630';
const ROYAL         = '#1E4FD6';
const ROYAL_LIGHT   = '#3B6BF0';
const GOLD          = '#C89520';
const GOLD_LIGHT    = '#E5B84D';
const WHITE         = '#FFFFFF';

// Adjust this path if your project structure differs
const TASKRA_LOGO = require('../../../assets/taskra.png');

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');
const AUTOPLAY_MS = 5000;

// ─── Slide Content ─────────────────────────────────────────────────────────
const SLIDES = [
  {
    id: '1',
    eyebrow: 'FOR CLIENTS',
    title: 'Find Top\nFreelancers',
    description: 'Hire highly skilled professionals for your next project.',
    cta: 'Browse Talent',
    colors: [NAVY, ROYAL],
    icon: 'talent',
  },
  {
    id: '2',
    eyebrow: 'FOR CLIENTS',
    title: 'Post Projects\nFaster',
    description: 'Create projects and receive qualified proposals within minutes.',
    cta: 'Post a Job',
    colors: [ROYAL, ROYAL_LIGHT],
    icon: 'post',
  },
  {
    id: '3',
    eyebrow: 'POWERED BY AI',
    title: 'AI Talent\nMatching',
    description: 'Receive intelligent freelancer recommendations powered by AI.',
    cta: 'Explore AI Match',
    colors: [NAVY_DEEP, NAVY],
    icon: 'ai',
  },
  {
    id: '4',
    eyebrow: 'STAY ON TRACK',
    title: 'Track\nProjects',
    description: 'Monitor milestones, team progress, contracts, and deadlines from one dashboard.',
    cta: 'View Dashboard',
    colors: [ROYAL, NAVY],
    icon: 'track',
  },
  {
    id: '5',
    eyebrow: 'PEACE OF MIND',
    title: 'Secure\nPayments',
    description: 'Pay freelancers safely with milestone-based payment protection.',
    cta: 'Learn More',
    colors: [NAVY, ROYAL_LIGHT],
    icon: 'secure',
  },
];

// ─── Slide Illustration (lightweight inline SVG per icon type) ────────────
function SlideIllustration({ type }) {
  const size = 180;
  switch (type) {
    case 'talent':
      return (
        <Svg width={size} height={size} viewBox="0 0 180 180">
          <Circle cx="90" cy="62" r="34" fill="rgba(255,255,255,0.16)" />
          <Circle cx="90" cy="62" r="22" fill="rgba(255,255,255,0.92)" />
          <Path
            d="M36 156c0-32 24-52 54-52s54 20 54 52"
            stroke="rgba(255,255,255,0.55)"
            strokeWidth="9"
            strokeLinecap="round"
            fill="none"
          />
          <Circle cx="90" cy="156" r="8" fill={GOLD_LIGHT} />
        </Svg>
      );
    case 'post':
      return (
        <Svg width={size} height={size} viewBox="0 0 180 180">
          <Rect x="32" y="26" width="116" height="126" rx="20" fill="rgba(255,255,255,0.14)" />
          <Rect x="52" y="56" width="76" height="10" rx="5" fill="rgba(255,255,255,0.85)" />
          <Rect x="52" y="80" width="76" height="10" rx="5" fill="rgba(255,255,255,0.5)" />
          <Rect x="52" y="104" width="42" height="10" rx="5" fill="rgba(255,255,255,0.5)" />
          <Circle cx="132" cy="132" r="24" fill={GOLD_LIGHT} />
          <Path d="M132 120v24M120 132h24" stroke={NAVY} strokeWidth="5" strokeLinecap="round" />
        </Svg>
      );
    case 'ai':
      return (
        <Svg width={size} height={size} viewBox="0 0 180 180">
          <Circle cx="90" cy="90" r="62" fill="rgba(255,255,255,0.1)" />
          <Circle cx="90" cy="90" r="16" fill={GOLD_LIGHT} />
          <Circle cx="90" cy="36" r="8" fill="rgba(255,255,255,0.9)" />
          <Circle cx="138" cy="64" r="8" fill="rgba(255,255,255,0.9)" />
          <Circle cx="138" cy="116" r="8" fill="rgba(255,255,255,0.9)" />
          <Circle cx="90" cy="144" r="8" fill="rgba(255,255,255,0.9)" />
          <Circle cx="42" cy="116" r="8" fill="rgba(255,255,255,0.9)" />
          <Circle cx="42" cy="64" r="8" fill="rgba(255,255,255,0.9)" />
          <Path
            d="M90 90L90 36M90 90L138 64M90 90L138 116M90 90L90 144M90 90L42 116M90 90L42 64"
            stroke="rgba(255,255,255,0.4)"
            strokeWidth="3"
          />
        </Svg>
      );
    case 'track':
      return (
        <Svg width={size} height={size} viewBox="0 0 180 180">
          <Rect x="28" y="36" width="124" height="108" rx="20" fill="rgba(255,255,255,0.12)" />
          <Path
            d="M46 118 C62 98 74 106 86 86 C98 66 110 78 134 50"
            stroke={GOLD_LIGHT}
            strokeWidth="8"
            strokeLinecap="round"
            fill="none"
          />
          <Circle cx="134" cy="50" r="9" fill={GOLD_LIGHT} />
          <Circle cx="46" cy="118" r="9" fill="rgba(255,255,255,0.9)" />
        </Svg>
      );
    case 'secure':
    default:
      return (
        <Svg width={size} height={size} viewBox="0 0 180 180">
          <Path
            d="M90 24 L144 44 V86 C144 122 120 148 90 160 C60 148 36 122 36 86 V44 Z"
            fill="rgba(255,255,255,0.14)"
          />
          <Path
            d="M90 38 L130 54 V86 C130 114 112 134 90 145 C68 134 50 114 50 86 V54 Z"
            fill="rgba(255,255,255,0.1)"
          />
          <Path
            d="M68 90 L84 104 L114 70"
            stroke={GOLD_LIGHT}
            strokeWidth="9"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
        </Svg>
      );
  }
}

// ─── Full-Screen Slide ─────────────────────────────────────────────────────
function Slide({ item, onNavigate, index }) {
  return (
    <View style={styles.slide}>
      <Svg width={SCREEN_W} height={SCREEN_H} style={StyleSheet.absoluteFill}>
        <Defs>
          <LinearGradient id={`grad-${item.id}`} x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor={item.colors[0]} stopOpacity="1" />
            <Stop offset="1" stopColor={item.colors[1]} stopOpacity="1" />
          </LinearGradient>
        </Defs>
        <Rect x="0" y="0" width={SCREEN_W} height={SCREEN_H} fill={`url(#grad-${item.id})`} />
        <Circle cx={SCREEN_W - 60} cy={SCREEN_H * 0.16} r={130} fill="rgba(255,255,255,0.05)" />
        <Circle cx={40} cy={SCREEN_H * 0.78} r={90} fill="rgba(255,255,255,0.04)" />
      </Svg>

      <SafeAreaView style={styles.slideSafe} edges={['top', 'bottom']}>
        {/* Logo row — repeated consistently on every slide */}
        <View style={styles.logoRow}>
          <Image source={TASKRA_LOGO} style={styles.logoMark} resizeMode="contain" />
          <Text style={styles.logoText}>Taskra</Text>
        </View>

        {/* Center illustration + copy */}
        <View style={styles.slideBody}>
          <View style={styles.illustrationWrap}>
            <SlideIllustration type={item.icon} />
          </View>

          <Text style={styles.slideEyebrow}>{item.eyebrow}</Text>
          <Text style={styles.slideTitle}>{item.title}</Text>
          <Text style={styles.slideDescription}>{item.description}</Text>
        </View>

        {/* Spacer to keep body vertically balanced above the fixed footer */}
        <View style={styles.footerSpacer} />
      </SafeAreaView>
    </View>
  );
}

// ─── Animated Pagination Dot ───────────────────────────────────────────────
function PaginationDots({ scrollX }) {
  return (
    <View style={styles.dotsRow}>
      {SLIDES.map((_, i) => {
        const inputRange = [(i - 1) * SCREEN_W, i * SCREEN_W, (i + 1) * SCREEN_W];
        const dotWidth = scrollX.interpolate({
          inputRange,
          outputRange: [7, 24, 7],
          extrapolate: 'clamp',
        });
        const opacity = scrollX.interpolate({
          inputRange,
          outputRange: [0.4, 1, 0.4],
          extrapolate: 'clamp',
        });
        return (
          <Animated.View key={i} style={[styles.dot, { width: dotWidth, opacity }]} />
        );
      })}
    </View>
  );
}

// ─── Main Home Screen — Full-View Carousel ─────────────────────────────────
export default function Home({ onNavigate }) {
  const scrollX = useRef(new Animated.Value(0)).current;
  const listRef = useRef(null);
  const currentIndex = useRef(0);
  const [pressedGetStarted, setPressedGetStarted] = useState(false);

  // ── Autoplay every 5s, infinite loop ──
  useEffect(() => {
    const timer = setInterval(() => {
      currentIndex.current = (currentIndex.current + 1) % SLIDES.length;
      listRef.current?.scrollToOffset({
        offset: currentIndex.current * SCREEN_W,
        animated: true,
      });
    }, AUTOPLAY_MS);
    return () => clearInterval(timer);
  }, []);

  const onMomentumScrollEnd = useCallback((e) => {
    const idx = Math.round(e.nativeEvent.contentOffset.x / SCREEN_W);
    currentIndex.current = Math.max(0, Math.min(idx, SLIDES.length - 1));
  }, []);

  const renderSlide = useCallback(
    ({ item, index }) => <Slide item={item} onNavigate={onNavigate} index={index} />,
    [onNavigate]
  );

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={NAVY} />

      <Animated.FlatList
        ref={listRef}
        data={SLIDES}
        keyExtractor={(item) => item.id}
        renderItem={renderSlide}
        horizontal
        pagingEnabled
        decelerationRate="fast"
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={onMomentumScrollEnd}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { x: scrollX } } }],
          { useNativeDriver: false }
        )}
        scrollEventThrottle={16}
      />

      {/* ── Fixed overlay footer: pagination + CTAs, sits above every slide ── */}
      <SafeAreaView style={styles.overlayFooter} edges={['bottom']} pointerEvents="box-none">
        <PaginationDots scrollX={scrollX} />

        <TouchableOpacity
          style={[styles.btnPrimary, pressedGetStarted && styles.btnPrimaryPressed]}
          onPress={() => onNavigate('Login')}
          onPressIn={() => setPressedGetStarted(true)}
          onPressOut={() => setPressedGetStarted(false)}
          activeOpacity={0.9}
        >
          <Text style={styles.btnPrimaryText}>Get Started</Text>
        </TouchableOpacity>

        <View style={styles.loginRow}>
          <Text style={styles.loginText}>Already have an account? </Text>
          <TouchableOpacity onPress={() => onNavigate('Login')} activeOpacity={0.7}>
            <Text style={styles.loginLink}>Sign in</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </View>
  );
}

// ─── Styles ─────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: NAVY,
  },

  // ── Slide ─────────────────────────────────────────────────────
  slide: {
    width: SCREEN_W,
    height: SCREEN_H,
  },
  slideSafe: {
    flex: 1,
    paddingHorizontal: 28,
  },

  // Logo
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Platform.OS === 'android' ? 16 : 6,
  },
  logoMark: {
    width: 32,
    height: 32,
    borderRadius: 9,
    marginRight: 9,
  },
  logoText: {
    fontSize: 18,
    fontWeight: '800',
    color: WHITE,
    letterSpacing: 0.2,
  },

  // Body
  slideBody: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  illustrationWrap: {
    width: 180,
    height: 180,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 28,
    alignSelf: 'center',
  },
  slideEyebrow: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 2,
    color: 'rgba(255,255,255,0.7)',
    marginBottom: 12,
  },
  slideTitle: {
    fontSize: 34,
    fontWeight: '800',
    color: WHITE,
    lineHeight: 40,
    marginBottom: 14,
  },
  slideDescription: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.85)',
    lineHeight: 22,
    paddingRight: 12,
  },

  footerSpacer: {
    height: 210,
  },

  // ── Fixed Overlay Footer ──────────────────────────────────────
  overlayFooter: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 28,
    paddingTop: 18,
  },
  dotsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    marginBottom: 22,
  },
  dot: {
    height: 7,
    borderRadius: 3.5,
    backgroundColor: WHITE,
  },
  btnPrimary: {
    backgroundColor: GOLD_LIGHT,
    borderRadius: 14,
    paddingVertical: 17,
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 8,
  },
  btnPrimaryPressed: {
    backgroundColor: GOLD,
    transform: [{ scale: 0.98 }],
  },
  btnPrimaryText: {
    fontSize: 16,
    fontWeight: '800',
    color: NAVY,
    letterSpacing: 0.3,
  },
  loginRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 8,
  },
  loginText: {
    fontSize: 13.5,
    color: 'rgba(255,255,255,0.75)',
    fontWeight: '500',
  },
  loginLink: {
    fontSize: 13.5,
    fontWeight: '800',
    color: WHITE,
    textDecorationLine: 'underline',
  },
});