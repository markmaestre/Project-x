import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  BackHandler,
  Image,
  Animated,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

// ── Vantara Design tokens — Navy / Royal Blue / Gold ────────────────────────
const NAVY        = '#071A3E';
const NAVY_SOFT   = '#0D2151';
const BLUE        = '#0055A5';
const BLUE_MD     = '#0073CF';
const BLUE_FAINT  = 'rgba(0,85,165,0.08)';
const BLUE_BORDER = 'rgba(0,85,165,0.20)';
const GOLD        = '#C89520';
const GOLD_LT     = '#E8B84B';
const GOLD_DK     = '#8A6410';
const GOLD_FAINT  = 'rgba(200,149,32,0.10)';
const GOLD_BORDER = 'rgba(200,149,32,0.24)';
const WHITE       = '#FFFFFF';
const BG          = '#F5F8FC';
const CARD        = '#FFFFFF';
const TEXT_MAIN   = '#071A3E';
const TEXT_MUTED  = '#48597A';
const TEXT_LIGHT  = '#8496AF';
const BORDER      = '#E2E9F2';
const GREEN       = '#0E9F6E';
const GREEN_BG    = '#ECFDF5';
const GREEN_BORDER = '#B7EFD4';
// ─────────────────────────────────────────────────────────────────────────

function RoleCard({
  accentColor,
  iconBg,
  iconBorder,
  icon,
  title,
  description,
  features,
  featureIconBg,
  featureIconColor,
  onPress,
}) {
  const scale = useRef(new Animated.Value(1)).current;
  const arrowX = useRef(new Animated.Value(0)).current;

  const pressIn = () => {
    Animated.parallel([
      Animated.spring(scale, { toValue: 1.015, useNativeDriver: true, speed: 40, bounciness: 6 }),
      Animated.spring(arrowX, { toValue: 4, useNativeDriver: true, speed: 30, bounciness: 8 }),
    ]).start();
  };

  const pressOut = () => {
    Animated.parallel([
      Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 40, bounciness: 6 }),
      Animated.spring(arrowX, { toValue: 0, useNativeDriver: true, speed: 30, bounciness: 8 }),
    ]).start();
  };

  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <TouchableOpacity
        style={[styles.roleCard, { borderLeftColor: accentColor }]}
        onPress={onPress}
        onPressIn={pressIn}
        onPressOut={pressOut}
        activeOpacity={0.92}
        accessibilityRole="button"
        accessibilityLabel={title}
      >
        <View style={styles.roleCardInner}>
          <View style={[styles.roleIconContainer, { backgroundColor: iconBg, borderColor: iconBorder }]}>
            <Ionicons name={icon} size={26} color={accentColor} />
          </View>
          <View style={styles.roleInfo}>
            <Text style={styles.roleTitle}>{title}</Text>
            <Text style={styles.roleDescription}>{description}</Text>
          </View>
          <Animated.View
            style={[
              styles.chevronWrap,
              { backgroundColor: iconBg, transform: [{ translateX: arrowX }] },
            ]}
          >
            <Ionicons name="arrow-forward" size={16} color={accentColor} />
          </Animated.View>
        </View>

        <View style={styles.featureRow}>
          {features.map((f) => (
            <View key={f.label} style={[styles.featureChip, { backgroundColor: featureIconBg, borderColor: iconBorder }]}>
              <Ionicons name={f.icon} size={12} color={featureIconColor} style={styles.featureChipIcon} />
              <Text style={[styles.featureChipText, { color: featureIconColor }]}>{f.label}</Text>
            </View>
          ))}
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

export default function RoleSelection({ onNavigate, navigation }) {
  const pageAnim = useRef(new Animated.Value(0)).current;
  const backScale = useRef(new Animated.Value(1)).current;
  const signInScale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.timing(pageAnim, {
      toValue: 1,
      duration: 460,
      useNativeDriver: true,
    }).start();
  }, []);

  // Handle back navigation
  const handleBack = () => {
    // Navigate back to Login screen
    if (onNavigate) {
      onNavigate('Login');
    } else if (navigation) {
      navigation.goBack();
    }
  };

  // Handle Android hardware back button
  React.useEffect(() => {
    const backHandler = BackHandler.addEventListener(
      'hardwareBackPress',
      () => {
        handleBack();
        return true; // Prevent default behavior
      }
    );

    return () => backHandler.remove();
  }, []);

  const pressScale = (anim, to) => {
    Animated.spring(anim, { toValue: to, useNativeDriver: true, speed: 40, bounciness: 6 }).start();
  };

  const pageTranslateY = pageAnim.interpolate({ inputRange: [0, 1], outputRange: [14, 0] });

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor={BG} />
      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
        bounces={true}
      >
      <Animated.View style={[styles.container, { opacity: pageAnim, transform: [{ translateY: pageTranslateY }] }]}>

        {/* Ambient depth shapes */}
        <View pointerEvents="none" style={styles.blobBlue} />
        <View pointerEvents="none" style={styles.blobGold} />

        {/* Back */}
        <Animated.View style={{ alignSelf: 'flex-start', transform: [{ scale: backScale }] }}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={handleBack}
            onPressIn={() => pressScale(backScale, 0.92)}
            onPressOut={() => pressScale(backScale, 1)}
            activeOpacity={0.85}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            accessibilityLabel="Go back"
            accessibilityRole="button"
          >
            <Ionicons name="arrow-back" size={19} color={BLUE} />
          </TouchableOpacity>
        </Animated.View>

        {/* Header */}
        <View style={styles.header}>
          <View style={styles.logoBox}>
            <Image
              source={require('../../../assets/taskra.png')}
              style={styles.logoImage}
              resizeMode="contain"
            />
          </View>
          <View style={styles.logoGoldUnderline} />
          <Text style={styles.logoWordmark}>TASKRA</Text>
          <Text style={styles.title}>Join Taskra</Text>
          <Text style={styles.subtitle}>Tell us how you'll use the platform, and we'll{'\n'}tailor your experience from here</Text>
        </View>

        {/* Freelancer Card */}
        <RoleCard
          accentColor={BLUE}
          iconBg={BLUE_FAINT}
          iconBorder={BLUE_BORDER}
          icon="briefcase-outline"
          title="I'm a Freelancer"
          description="Find projects, grow your portfolio, and get paid securely for your skills"
          featureIconBg={BLUE_FAINT}
          featureIconColor={BLUE}
          features={[
            { label: 'Find Projects', icon: 'search-outline' },
            { label: 'Grow Portfolio', icon: 'trending-up-outline' },
            { label: 'Secure Payments', icon: 'shield-checkmark-outline' },
            { label: 'Work Remotely', icon: 'globe-outline' },
          ]}
          onPress={() => onNavigate('FreelancerRegistration')}
        />

        {/* Client Card */}
        <RoleCard
          accentColor={GOLD_DK}
          iconBg={GOLD_FAINT}
          iconBorder={GOLD_BORDER}
          icon="people-outline"
          title="I'm a Client"
          description="Hire vetted professionals, manage projects, and track progress in one place"
          featureIconBg={GOLD_FAINT}
          featureIconColor={GOLD_DK}
          features={[
            { label: 'Hire Professionals', icon: 'person-add-outline' },
            { label: 'Manage Projects', icon: 'clipboard-outline' },
            { label: 'Secure Contracts', icon: 'document-lock-outline' },
            { label: 'Track Progress', icon: 'bar-chart-outline' },
          ]}
          onPress={() => onNavigate('ClientRegistration')}
        />

        {/* Info strip */}
        <View style={styles.infoStrip}>
          <View style={styles.infoIconWrap}>
            <Ionicons name="shield-checkmark" size={16} color={GREEN} />
          </View>
          <Text style={styles.infoText}>Free to join · No hidden fees · Secure payments</Text>
        </View>

        {/* Login prompt */}
        <View style={styles.loginPrompt}>
          <Text style={styles.loginPromptText}>Already have an account?</Text>
          <Animated.View style={{ transform: [{ scale: signInScale }] }}>
            <TouchableOpacity
              onPress={() => onNavigate('Login')}
              onPressIn={() => pressScale(signInScale, 0.94)}
              onPressOut={() => pressScale(signInScale, 1)}
              hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
            >
              <Text style={styles.loginPromptLink}> Sign In</Text>
            </TouchableOpacity>
          </Animated.View>
        </View>

      </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:      { flex: 1, backgroundColor: BG },
  scrollContainer: { flexGrow: 1 },
  container: { padding: 22, paddingTop: 8, paddingBottom: 28, position: 'relative' },

  blobBlue: {
    position: 'absolute',
    top: -50, right: -60,
    width: 200, height: 200,
    borderRadius: 100,
    backgroundColor: BLUE_FAINT,
  },
  blobGold: {
    position: 'absolute',
    top: 220, left: -70,
    width: 170, height: 170,
    borderRadius: 85,
    backgroundColor: GOLD_FAINT,
  },

  // Back
  backButton: {
    width: 40, height: 40,
    backgroundColor: WHITE,
    borderRadius: 12,
    borderWidth: 1, borderColor: BORDER,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 18,
    shadowColor: NAVY,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06, shadowRadius: 3, elevation: 1,
  },

  // Header
  header: { alignItems: 'center', marginBottom: 28 },
  logoBox: {
    width: 92, height: 92,
    backgroundColor: WHITE,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1, borderColor: BORDER,
    shadowColor: NAVY,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 14,
    elevation: 3,
  },
  logoImage: { width: 60, height: 60, borderRadius: 13 },
  logoGoldUnderline: {
    width: 28, height: 3, borderRadius: 2,
    backgroundColor: GOLD_LT,
    marginTop: 14, marginBottom: 10,
  },
  logoWordmark: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 4.5,
    color: BLUE,
    marginBottom: 16,
  },
  title: {
    fontSize: 25,
    fontWeight: '700',
    color: TEXT_MAIN,
    marginBottom: 8,
    letterSpacing: -0.4,
  },
  subtitle: {
    fontSize: 14.5,
    color: TEXT_MUTED,
    textAlign: 'center',
    lineHeight: 21,
  },

  // Role cards
  roleCard: {
    backgroundColor: CARD,
    borderRadius: 20,
    borderLeftWidth: 4,
    padding: 18,
    marginBottom: 14,
    shadowColor: NAVY,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 18,
    elevation: 4,
    borderWidth: 1,
    borderColor: 'rgba(7,26,62,0.05)',
  },
  roleCardInner: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  roleIconContainer: {
    width: 54, height: 54,
    borderRadius: 15,
    borderWidth: 1.4,
    alignItems: 'center', justifyContent: 'center',
    marginRight: 14,
  },
  roleInfo: { flex: 1 },
  roleTitle: { fontSize: 17, fontWeight: '700', color: TEXT_MAIN, marginBottom: 4, letterSpacing: -0.2 },
  roleDescription: { fontSize: 12.5, color: TEXT_MUTED, lineHeight: 18 },
  chevronWrap: {
    width: 32, height: 32,
    borderRadius: 10,
    alignItems: 'center', justifyContent: 'center',
  },

  // Feature chips
  featureRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  featureChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 5, paddingHorizontal: 10,
    borderRadius: 999,
    borderWidth: 1,
  },
  featureChipIcon: { marginRight: 5 },
  featureChipText: { fontSize: 11, fontWeight: '700' },

  // Info strip
  infoStrip: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 9, marginTop: 6, marginBottom: 4,
    paddingVertical: 12, paddingHorizontal: 16,
    backgroundColor: GREEN_BG,
    borderRadius: 14, borderWidth: 1, borderColor: GREEN_BORDER,
  },
  infoIconWrap: {
    width: 24, height: 24,
    alignItems: 'center', justifyContent: 'center',
  },
  infoText: { fontSize: 12.5, color: '#046C4E', fontWeight: '600', flexShrink: 1 },

  // Login prompt
  loginPrompt: {
    flexDirection: 'row', justifyContent: 'center', alignItems: 'center',
    marginTop: 22, paddingVertical: 8,
  },
  loginPromptText: { fontSize: 14, color: TEXT_MUTED },
  loginPromptLink: { fontSize: 14, color: NAVY, fontWeight: '700' },
});