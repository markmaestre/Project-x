import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  Dimensions,
  Animated,
  Image,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ── Vantara Design tokens ──────────────────────────────────────────────────────────
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
const BG         = '#EEF4FA';
const TEXT_MAIN  = '#071A3E';
const TEXT_MUTED = '#3A5070';
// ─────────────────────────────────────────────────────────────────────────────────

const { width, height } = Dimensions.get('window');

const ONBOARDING_DATA = [
  {
    id: '1',
    title: 'Hey there,\nFind Top Talent\nRight Here',
    subtitle: 'Post jobs and connect with the best Filipino freelancers. Fast, fair, and built for results.',
    icon: 'people-outline',
    color: BLUE,
  },
  {
    id: '2',
    title: 'Receive Offers\nReal Proposals,\nVetted Professionals',
    subtitle: 'Get competitive offers from skilled freelancers within hours. Review, compare, and hire with confidence.',
    icon: 'gift-outline',
    color: GOLD,
  },
  {
    id: '3',
    title: 'Work Smarter\nManage Jobs,\nMessages & Contracts',
    subtitle: 'Everything in one place. Chat, track progress, send payments, and grow your business seamlessly.',
    icon: 'rocket-outline',
    color: BLUE_MD,
  },
];

export default function OnboardingScreen({ onComplete }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const scrollX = useRef(new Animated.Value(0)).current;
  const slidesRef = useRef(null);

  const viewableItemsChanged = useRef(({ viewableItems }) => {
    setCurrentIndex(viewableItems[0]?.index || 0);
  }).current;

  const viewConfig = useRef({ viewAreaCoveragePercentThreshold: 50 }).current;

  const scrollTo = () => {
    if (currentIndex < ONBOARDING_DATA.length - 1) {
      slidesRef.current.scrollToIndex({ index: currentIndex + 1 });
    } else {
      handleComplete();
    }
  };

  const handleComplete = async () => {
    try {
      await AsyncStorage.setItem('hasSeenOnboarding', 'true');
      if (onComplete) onComplete();
    } catch (error) {
      console.error('Error saving onboarding status:', error);
      if (onComplete) onComplete();
    }
  };

  const handleSkip = () => {
    handleComplete();
  };

  const renderItem = ({ item, index }) => {
    return (
      <View style={styles.slide}>
        {/* Background decorative elements */}
        <View style={styles.bgGradient}>
          <View style={[styles.bgBlob1, { backgroundColor: `${item.color}15` }]} />
          <View style={[styles.bgBlob2, { backgroundColor: `${item.color}10` }]} />
        </View>

        {/* Illustration / Icon Area */}
        <View style={styles.illustrationContainer}>
          <View style={[styles.iconCircle, { backgroundColor: `${item.color}20`, borderColor: item.color }]}>
            <Ionicons name={item.icon} size={64} color={item.color} />
          </View>
        </View>

        {/* Content */}
        <View style={styles.contentContainer}>
          <View style={styles.eyebrow}>
            <View style={[styles.eyebrowLine, { backgroundColor: item.color }]} />
            <Text style={[styles.eyebrowText, { color: item.color }]}>
              {index === 0 ? 'Welcome to Taskra' : index === 1 ? 'Get Started' : 'Ready to Go'}
            </Text>
          </View>
          <Text style={styles.title}>{item.title}</Text>
          <Text style={styles.subtitle}>{item.subtitle}</Text>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={NAVY} />
      
      {/* Skip Button */}
      <TouchableOpacity style={styles.skipButton} onPress={handleSkip}>
        <Text style={styles.skipText}>Skip</Text>
      </TouchableOpacity>

      {/* Carousel */}
      <Animated.FlatList
        ref={slidesRef}
        data={ONBOARDING_DATA}
        renderItem={renderItem}
        horizontal
        showsHorizontalScrollIndicator={false}
        pagingEnabled
        bounces={false}
        keyExtractor={(item) => item.id}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { x: scrollX } } }],
          { useNativeDriver: false }
        )}
        onViewableItemsChanged={viewableItemsChanged}
        viewabilityConfig={viewConfig}
      />

      {/* Bottom Controls */}
      <View style={styles.bottomContainer}>
        {/* Dots */}
        <View style={styles.dotsContainer}>
          {ONBOARDING_DATA.map((_, i) => {
            const inputRange = [(i - 1) * width, i * width, (i + 1) * width];
            const dotWidth = scrollX.interpolate({
              inputRange,
              outputRange: [6, 22, 6],
              extrapolate: 'clamp',
            });
            const opacity = scrollX.interpolate({
              inputRange,
              outputRange: [0.3, 1, 0.3],
              extrapolate: 'clamp',
            });
            const backgroundColor = scrollX.interpolate({
              inputRange,
              outputRange: [SILVER2, GOLD, SILVER2],
              extrapolate: 'clamp',
            });
            return (
              <Animated.View
                key={i.toString()}
                style={[
                  styles.dot,
                  {
                    width: dotWidth,
                    opacity,
                    backgroundColor,
                  },
                ]}
              />
            );
          })}
        </View>

        {/* Buttons */}
        <View style={styles.buttonsContainer}>
          {currentIndex === ONBOARDING_DATA.length - 1 ? (
            <TouchableOpacity style={styles.getStartedBtn} onPress={handleComplete} activeOpacity={0.85}>
              <Text style={styles.getStartedText}>Get Started</Text>
              <Ionicons name="arrow-forward" size={18} color={WHITE} />
            </TouchableOpacity>
          ) : (
            <>
              <TouchableOpacity style={styles.nextBtn} onPress={scrollTo} activeOpacity={0.85}>
                <Text style={styles.nextText}>Next</Text>
                <Ionicons name="arrow-forward" size={18} color={NAVY} />
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: NAVY,
  },
  skipButton: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 54 : 44,
    right: 20,
    zIndex: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  skipText: {
    fontSize: 13,
    fontWeight: '600',
    color: GOLD_LT,
  },
  slide: {
    width,
    flex: 1,
    position: 'relative',
  },
  bgGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  bgBlob1: {
    position: 'absolute',
    top: -50,
    right: -30,
    width: 180,
    height: 180,
    borderRadius: 90,
    opacity: 0.4,
  },
  bgBlob2: {
    position: 'absolute',
    bottom: -40,
    left: -20,
    width: 130,
    height: 130,
    borderRadius: 65,
    opacity: 0.3,
  },
  illustrationContainer: {
    flex: 1.2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconCircle: {
    width: 140,
    height: 140,
    borderRadius: 70,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
  },
  contentContainer: {
    flex: 1,
    paddingHorizontal: 28,
    paddingBottom: 40,
  },
  eyebrow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  eyebrowLine: {
    width: 24,
    height: 2,
    borderRadius: 1,
  },
  eyebrowText: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 1.8,
    textTransform: 'uppercase',
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: WHITE,
    lineHeight: 40,
    letterSpacing: -0.5,
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.7)',
    lineHeight: 22,
    fontWeight: '400',
  },
  bottomContainer: {
    paddingHorizontal: 28,
    paddingBottom: Platform.OS === 'ios' ? 34 : 24,
    paddingTop: 16,
  },
  dotsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginBottom: 24,
  },
  dot: {
    height: 6,
    borderRadius: 3,
    backgroundColor: GOLD,
  },
  buttonsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  nextBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: GOLD,
    paddingVertical: 16,
    borderRadius: 14,
    shadowColor: GOLD,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 5,
  },
  nextText: {
    fontSize: 16,
    fontWeight: '700',
    color: NAVY,
  },
  getStartedBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: GOLD,
    paddingVertical: 16,
    borderRadius: 14,
    shadowColor: GOLD,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 5,
  },
  getStartedText: {
    fontSize: 16,
    fontWeight: '800',
    color: NAVY,
  },
});