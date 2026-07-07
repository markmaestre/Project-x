// screens/FreelancerScreen.jsx - UPDATED with Full Client Details

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
  Image,
  RefreshControl,
  ActivityIndicator,
  Modal,
  Dimensions,
  FlatList,
  TextInput,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useDispatch, useSelector } from 'react-redux';
import { logout } from '../../Redux/slices/authSlice';
import { getFreelancerJobs, getJobById } from '../../Redux/slices/jobSlice';
import { getFreelancerApplications } from '../../Redux/slices/applicationSlice';
import ApplyModal from '../ApplyModal';

// ── Vantara Design tokens ──────────────────────────────────────────────────────────
const NAVY       = '#071A3E';
const NAVY2      = '#0D2151';
const BLUE       = '#0055A5';
const BLUE_MD    = '#0073CF';
const BLUE_LT    = '#1E90FF';
const BLUE_SOFT  = '#E2EAF4';
const GOLD       = '#C89520';
const GOLD_LT    = '#E8B84B';
const GOLD_DK    = '#8A6410';
const GOLD_SOFT  = '#FDF3D7';
const GOLD_MID   = '#E6C56A';
const SILVER     = '#8899B0';
const SILVER2    = '#B8C8D8';
const WHITE      = '#FFFFFF';
const BG         = '#EEF4FA';
const CARD       = '#FFFFFF';
const TEXT_MAIN  = '#071A3E';
const TEXT_MUTED = '#3A5070';
const TEXT_LIGHT = '#7A90A8';
const BORDER     = '#C8D8E8';
const GREEN      = '#059669';
const GREEN_SOFT = '#D1FAE5';
const GREEN_MID  = '#86EFAC';
const RED        = '#EF4444';
const ORANGE     = '#F97316';
// ─────────────────────────────────────────────────────────────────────────────────

const { height: SCREEN_H } = Dimensions.get('window');

// ── Format Functions ───────────────────────────────────────────────────────────
const formatLocation = (location) => {
  if (!location) return null;
  if (typeof location === 'string') return location;
  const parts = [];
  if (location.address) parts.push(location.address);
  if (location.city) parts.push(location.city);
  if (location.province) parts.push(location.province);
  if (location.country && location.country !== 'Philippines') parts.push(location.country);
  if (location.zip_code) parts.push(location.zip_code);
  return parts.length > 0 ? parts.join(', ') : null;
};

const formatJobType = (type) => {
  const types = {
    full_time: 'Full Time', 
    part_time: 'Part Time', 
    project: 'Project',
    one_time: 'One Time', 
    long_term: 'Long Term',
  };
  return types[type] || type;
};

const formatWorkSetup = (setup) => {
  const setups = { remote: 'Remote', onsite: 'Onsite', hybrid: 'Hybrid' };
  return setups[setup] || setup;
};

const formatExperienceLevel = (level) => {
  const levels = {
    entry: 'Entry',
    intermediate: 'Intermediate',
    expert: 'Expert',
    senior: 'Senior',
  };
  return levels[level] || level;
};

const formatBudget = (budget) => {
  if (!budget) return null;
  const min = budget.min || 0;
  const max = budget.max || min;
  const currency = budget.currency || 'PHP';
  const type = budget.type || 'fixed';
  if (min && max && min !== max) {
    return `${currency} ${min.toLocaleString()} - ${max.toLocaleString()} (${type === 'hourly' ? 'per hour' : 'fixed'})`;
  }
  if (min) {
    return `${currency} ${min.toLocaleString()}+ (${type === 'hourly' ? 'per hour' : 'fixed'})`;
  }
  return null;
};

const formatDuration = (timeline) => {
  if (!timeline) return null;
  const duration_value = timeline.duration_value || timeline.durationValue || 1;
  const duration_unit = timeline.duration_unit || timeline.durationUnit || 'weeks';
  if (duration_value && duration_unit) {
    return `${duration_value} ${duration_unit}`;
  }
  return null;
};

const formatBudgetForCard = (job) => {
  if (job.budget) {
    const min = job.budget.min || 0;
    const max = job.budget.max || min;
    const currency = job.budget.currency || 'PHP';
    if (min && max && min !== max) return `${currency} ${min.toLocaleString()} - ${max.toLocaleString()}`;
    if (min) return `${currency} ${min.toLocaleString()}+`;
  }
  return null;
};

const formatFullDate = (date) => {
  if (!date) return null;
  try {
    const d = new Date(date);
    if (isNaN(d.getTime())) return null;
    return d.toLocaleDateString('en-PH', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  } catch (error) {
    return null;
  }
};

const getTimeAgo = (date) => {
  if (!date) return null;
  try {
    const now = new Date();
    const past = new Date(date);
    if (isNaN(past.getTime())) return null;
    const diffInSeconds = Math.floor((now - past) / 1000);
    if (diffInSeconds < 60) return 'Just now';
    const diffInMinutes = Math.floor(diffInSeconds / 60);
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h ago`;
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays}d ago`;
    const diffInWeeks = Math.floor(diffInDays / 7);
    if (diffInWeeks < 4) return `${diffInWeeks}w ago`;
    const diffInMonths = Math.floor(diffInDays / 30);
    if (diffInMonths < 12) return `${diffInMonths}mo ago`;
    const diffInYears = Math.floor(diffInDays / 365);
    return `${diffInYears}y ago`;
  } catch (error) {
    return null;
  }
};

// ── Skeleton Card ──────────────────────────────────────────────────────────────
function SkeletonCard() {
  return (
    <View style={styles.jobCard}>
      <View style={styles.jobCardContent}>
        <View style={styles.jobCardTop}>
          <View style={[styles.skeletonLine, { width: 60, height: 22, borderRadius: 999 }]} />
          <View style={[styles.skeletonLine, { width: 20, height: 20, borderRadius: 6 }]} />
        </View>
        <View style={[styles.skeletonLine, { width: '75%', height: 17, marginBottom: 8 }]} />
        <View style={[styles.skeletonLine, { width: '50%', height: 13, marginBottom: 10 }]} />
        <View style={[styles.skeletonLine, { width: '40%', height: 12, marginBottom: 12 }]} />
        <View style={[styles.skeletonLine, { width: 110, height: 28, borderRadius: 20, marginBottom: 12 }]} />
        <View style={{ flexDirection: 'row', gap: 6 }}>
          <View style={[styles.skeletonLine, { width: 64, height: 28, borderRadius: 999 }]} />
          <View style={[styles.skeletonLine, { width: 72, height: 28, borderRadius: 999 }]} />
          <View style={[styles.skeletonLine, { width: 56, height: 28, borderRadius: 999 }]} />
        </View>
      </View>
      <View style={styles.saveButton}>
        <View style={[styles.skeletonLine, { width: 24, height: 24, borderRadius: 6 }]} />
      </View>
    </View>
  );
}

// ── Client Profile Modal with FULL CONTACT DETAILS ──────────────────────────
function ClientProfileModal({ visible, client, onClose }) {
  if (!client) return null;

  const getInitials = () => {
    if (client.first_name && client.last_name) {
      return `${client.first_name[0]}${client.last_name[0]}`.toUpperCase();
    }
    if (client.company_name) {
      return client.company_name.substring(0, 2).toUpperCase();
    }
    if (client.business_name) {
      return client.business_name.substring(0, 2).toUpperCase();
    }
    if (client.name) {
      return client.name.substring(0, 2).toUpperCase();
    }
    return 'C';
  };

  const getFullName = () => {
    if (client.first_name && client.last_name) {
      return `${client.first_name} ${client.last_name}`;
    }
    if (client.company_name) return client.company_name;
    if (client.business_name) return client.business_name;
    if (client.name) return client.name;
    return 'Client';
  };

  const getCompanyName = () => {
    return client.company_name || client.business_name || client.name || 'Independent Client';
  };

  const getEmail = () => client.email_address || client.email || null;
  const getPhone = () => client.phone_number || client.contact_number || client.phone || null;
  const getBio = () => client.bio_about_me || client.about || client.bio || client.description || client.bio_about || null;
  
  const getMemberSince = () => {
    const date = client.member_since || client.createdAt || client.created_at || client.join_date;
    if (date) {
      try {
        return new Date(date).toLocaleDateString('en-PH', { month: 'short', year: 'numeric' });
      } catch (e) {
        return null;
      }
    }
    return null;
  };

  const getIndustry = () => client.industry || client.industry_type || client.business_type || null;
  const getWebsite = () => client.website || client.website_url || client.web_url || null;
  const getCompanySize = () => client.company_size || client.team_size || null;
  const getBusinessType = () => client.business_type || client.client_type || null;

  const getLocationDisplay = () => {
    if (typeof client.location === 'string') return client.location;
    if (client.location?.city) {
      const parts = [];
      if (client.location.address) parts.push(client.location.address);
      if (client.location.city) parts.push(client.location.city);
      if (client.location.province) parts.push(client.location.province);
      if (client.location.country) parts.push(client.location.country);
      return parts.join(', ');
    }
    if (client.city || client.province || client.country) {
      const parts = [];
      if (client.address) parts.push(client.address);
      if (client.city) parts.push(client.city);
      if (client.province) parts.push(client.province);
      if (client.country) parts.push(client.country);
      return parts.join(', ');
    }
    return null;
  };

  const locationDisplay = getLocationDisplay();

  const handleEmailPress = () => {
    if (getEmail()) {
      Linking.openURL(`mailto:${getEmail()}`);
    }
  };

  const handlePhonePress = () => {
    if (getPhone()) {
      Linking.openURL(`tel:${getPhone()}`);
    }
  };

  const handleWebsitePress = () => {
    if (getWebsite()) {
      const url = getWebsite().startsWith('http') ? getWebsite() : `https://${getWebsite()}`;
      Linking.openURL(url);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={clientProfileStyles.overlay}>
        <TouchableOpacity style={clientProfileStyles.backdrop} activeOpacity={1} onPress={onClose} />
        <View style={clientProfileStyles.container}>
          <View style={clientProfileStyles.handle} />
          
          <View style={clientProfileStyles.header}>
            <View style={clientProfileStyles.avatarLarge}>
              {client.profile_picture ? (
                <Image source={{ uri: client.profile_picture }} style={clientProfileStyles.avatarImage} />
              ) : (
                <Text style={clientProfileStyles.avatarInitials}>{getInitials()}</Text>
              )}
            </View>
            <Text style={clientProfileStyles.clientName}>{getFullName()}</Text>
            <Text style={clientProfileStyles.companyName}>{getCompanyName()}</Text>
            
            {/* Rating */}
            {client.rating && client.rating.average > 0 && (
              <View style={clientProfileStyles.ratingContainer}>
                <View style={clientProfileStyles.ratingStars}>
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Ionicons
                      key={star}
                      name={star <= Math.round(client.rating.average) ? 'star' : 'star-outline'}
                      size={14}
                      color={star <= Math.round(client.rating.average) ? GOLD : TEXT_LIGHT}
                    />
                  ))}
                </View>
                <Text style={clientProfileStyles.ratingText}>
                  {client.rating.average.toFixed(1)} ({client.rating.count} reviews)
                </Text>
              </View>
            )}

            {client.total_jobs_completed > 0 && (
              <Text style={clientProfileStyles.jobsCompleted}>
                {client.total_jobs_completed} jobs completed
              </Text>
            )}

            <TouchableOpacity style={clientProfileStyles.closeBtn} onPress={onClose}>
              <Ionicons name="close" size={20} color={TEXT_MUTED} />
            </TouchableOpacity>
          </View>

          <ScrollView style={clientProfileStyles.body} showsVerticalScrollIndicator={false}>
            {/* Bio/About */}
            {getBio() && (
              <View style={clientProfileStyles.section}>
                <View style={clientProfileStyles.sectionHeader}>
                  <Ionicons name="person-outline" size={16} color={BLUE} />
                  <Text style={clientProfileStyles.sectionLabel}>About</Text>
                </View>
                <Text style={clientProfileStyles.bioText}>{getBio()}</Text>
              </View>
            )}

            {/* CONTACT DETAILS - Main Section */}
            <View style={clientProfileStyles.section}>
              <View style={clientProfileStyles.sectionHeader}>
                <Ionicons name="call-outline" size={16} color={GOLD_DK} />
                <Text style={[clientProfileStyles.sectionLabel, { color: GOLD_DK }]}>Contact Details</Text>
              </View>
              <View style={clientProfileStyles.contactCard}>
                {getEmail() && (
                  <TouchableOpacity style={clientProfileStyles.contactItem} onPress={handleEmailPress} activeOpacity={0.7}>
                    <View style={clientProfileStyles.contactIconWrap}>
                      <Ionicons name="mail-outline" size={18} color={WHITE} />
                    </View>
                    <View style={clientProfileStyles.contactInfo}>
                      <Text style={clientProfileStyles.contactLabel}>Email Address</Text>
                      <Text style={clientProfileStyles.contactValue}>{getEmail()}</Text>
                    </View>
                    <Ionicons name="open-outline" size={16} color={BLUE} />
                  </TouchableOpacity>
                )}
                {getPhone() && (
                  <TouchableOpacity style={clientProfileStyles.contactItem} onPress={handlePhonePress} activeOpacity={0.7}>
                    <View style={[clientProfileStyles.contactIconWrap, { backgroundColor: GREEN }]}>
                      <Ionicons name="call-outline" size={18} color={WHITE} />
                    </View>
                    <View style={clientProfileStyles.contactInfo}>
                      <Text style={clientProfileStyles.contactLabel}>Phone Number</Text>
                      <Text style={clientProfileStyles.contactValue}>{getPhone()}</Text>
                    </View>
                    <Ionicons name="open-outline" size={16} color={BLUE} />
                  </TouchableOpacity>
                )}
                {getWebsite() && (
                  <TouchableOpacity style={clientProfileStyles.contactItem} onPress={handleWebsitePress} activeOpacity={0.7}>
                    <View style={[clientProfileStyles.contactIconWrap, { backgroundColor: BLUE_MD }]}>
                      <Ionicons name="globe-outline" size={18} color={WHITE} />
                    </View>
                    <View style={clientProfileStyles.contactInfo}>
                      <Text style={clientProfileStyles.contactLabel}>Website</Text>
                      <Text style={clientProfileStyles.contactValue}>{getWebsite()}</Text>
                    </View>
                    <Ionicons name="open-outline" size={16} color={BLUE} />
                  </TouchableOpacity>
                )}
              </View>
            </View>

            {/* Company Details */}
            <View style={clientProfileStyles.section}>
              <View style={clientProfileStyles.sectionHeader}>
                <Ionicons name="business-outline" size={16} color={BLUE} />
                <Text style={clientProfileStyles.sectionLabel}>Company Details</Text>
              </View>
              <View style={clientProfileStyles.detailGrid}>
                {getBusinessType() && (
                  <View style={clientProfileStyles.detailItem}>
                    <Ionicons name="business-outline" size={16} color={BLUE} />
                    <View style={{ flex: 1 }}>
                      <Text style={clientProfileStyles.detailLabel}>Business Type</Text>
                      <Text style={clientProfileStyles.detailValue}>{getBusinessType()}</Text>
                    </View>
                  </View>
                )}
                {getIndustry() && (
                  <View style={clientProfileStyles.detailItem}>
                    <Ionicons name="pricetag-outline" size={16} color={BLUE} />
                    <View style={{ flex: 1 }}>
                      <Text style={clientProfileStyles.detailLabel}>Industry</Text>
                      <Text style={clientProfileStyles.detailValue}>{getIndustry()}</Text>
                    </View>
                  </View>
                )}
                {getCompanySize() && (
                  <View style={clientProfileStyles.detailItem}>
                    <Ionicons name="people-outline" size={16} color={BLUE} />
                    <View style={{ flex: 1 }}>
                      <Text style={clientProfileStyles.detailLabel}>Company Size</Text>
                      <Text style={clientProfileStyles.detailValue}>{getCompanySize()}</Text>
                    </View>
                  </View>
                )}
                {locationDisplay && (
                  <View style={clientProfileStyles.detailItem}>
                    <Ionicons name="location-outline" size={16} color={BLUE} />
                    <View style={{ flex: 1 }}>
                      <Text style={clientProfileStyles.detailLabel}>Location</Text>
                      <Text style={clientProfileStyles.detailValue} numberOfLines={2}>{locationDisplay}</Text>
                    </View>
                  </View>
                )}
                {getMemberSince() && (
                  <View style={clientProfileStyles.detailItem}>
                    <Ionicons name="calendar-outline" size={16} color={BLUE} />
                    <View style={{ flex: 1 }}>
                      <Text style={clientProfileStyles.detailLabel}>Member Since</Text>
                      <Text style={clientProfileStyles.detailValue}>{getMemberSince()}</Text>
                    </View>
                  </View>
                )}
                {client.verification_status && (
                  <View style={clientProfileStyles.detailItem}>
                    <Ionicons name="shield-checkmark-outline" size={16} color={GREEN} />
                    <View style={{ flex: 1 }}>
                      <Text style={clientProfileStyles.detailLabel}>Verification</Text>
                      <Text style={[clientProfileStyles.detailValue, { color: client.verification_status === 'verified' ? GREEN : ORANGE }]}>
                        {client.verification_status === 'verified' ? 'Verified' : 'Unverified'}
                      </Text>
                    </View>
                  </View>
                )}
              </View>
            </View>

            {/* Skills */}
            {client.skills && client.skills.length > 0 && (
              <View style={clientProfileStyles.section}>
                <View style={clientProfileStyles.sectionHeader}>
                  <Ionicons name="bulb-outline" size={16} color={BLUE} />
                  <Text style={clientProfileStyles.sectionLabel}>Skills & Expertise</Text>
                </View>
                <View style={clientProfileStyles.skillRow}>
                  {client.skills.map((skill, index) => (
                    <View key={index} style={clientProfileStyles.skillTag}>
                      <Text style={clientProfileStyles.skillTagText}>{skill}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {/* Recent Projects */}
            {client.recent_projects && client.recent_projects.length > 0 && (
              <View style={clientProfileStyles.section}>
                <View style={clientProfileStyles.sectionHeader}>
                  <Ionicons name="folder-outline" size={16} color={BLUE} />
                  <Text style={clientProfileStyles.sectionLabel}>Recent Projects</Text>
                </View>
                <View style={clientProfileStyles.projectContainer}>
                  {client.recent_projects.slice(0, 5).map((project, index) => (
                    <View key={index} style={clientProfileStyles.projectItem}>
                      <Ionicons name="folder-outline" size={16} color={BLUE} />
                      <Text style={clientProfileStyles.projectText}>{project}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {/* No Details */}
            {!getBio() && !getEmail() && !getPhone() && !getWebsite() && !locationDisplay && !client.skills?.length && (
              <View style={clientProfileStyles.emptyState}>
                <Ionicons name="person-outline" size={48} color={TEXT_LIGHT} />
                <Text style={clientProfileStyles.emptyStateTitle}>No Profile Details</Text>
                <Text style={clientProfileStyles.emptyStateText}>
                  This client hasn't added any additional profile information yet.
                </Text>
              </View>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

// ── Application Status Modal ─────────────────────────────────────────────────────
function ApplicationStatusModal({ visible, jobTitle, onClose }) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={statusStyles.overlay}>
        <View style={statusStyles.container}>
          <View style={statusStyles.iconContainer}>
            <Ionicons name="checkmark-circle" size={64} color={GREEN} />
          </View>
          <Text style={statusStyles.title}>Application Submitted!</Text>
          <Text style={statusStyles.message}>
            Your application for "{jobTitle}" has been sent successfully.
          </Text>
          <View style={statusStyles.infoBox}>
            <Ionicons name="information-circle-outline" size={20} color={BLUE} />
            <Text style={statusStyles.infoText}>
              The client will review your application and contact you if shortlisted.
            </Text>
          </View>
          <TouchableOpacity style={statusStyles.button} onPress={onClose}>
            <Text style={statusStyles.buttonText}>Done</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

function AlreadyAppliedModal({ visible, jobTitle, onClose }) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={statusStyles.overlay}>
        <View style={statusStyles.container}>
          <View style={[statusStyles.iconContainer, { backgroundColor: `${ORANGE}15` }]}>
            <Ionicons name="alert-circle" size={64} color={ORANGE} />
          </View>
          <Text style={[statusStyles.title, { color: ORANGE }]}>Already Applied</Text>
          <Text style={statusStyles.message}>
            You have already submitted an application for "{jobTitle}".
          </Text>
          <View style={statusStyles.infoBox}>
            <Ionicons name="time-outline" size={20} color={ORANGE} />
            <Text style={[statusStyles.infoText, { color: ORANGE }]}>
              Please wait for the client's response. You will be notified when there's an update.
            </Text>
          </View>
          <TouchableOpacity style={[statusStyles.button, { backgroundColor: ORANGE }]} onPress={onClose}>
            <Text style={statusStyles.buttonText}>Got it</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

// ── Job Detail Modal ──────────────────────────────────────────────────────────
function JobDetailModal({ visible, job, onClose, isLoading, onViewClient, onApply, hasApplied }) {
  if (!job && !isLoading) return null;

  const locationText = formatLocation(job?.location);
  const budgetText = formatBudget(job?.budget);
  const durationText = formatDuration(job?.timeline);
  const experienceText = formatExperienceLevel(job?.experience_level);
  const skills = job?.required_skills || [];
  const tags = job?.tags || [];
  const client = job?.client_id || {};
  const timeAgo = getTimeAgo(job?.createdAt);
  const fullDate = formatFullDate(job?.createdAt);

  const getClientName = () => {
    if (client.company_name) return client.company_name;
    if (client.business_name) return client.business_name;
    if (client.first_name && client.last_name) {
      return `${client.first_name} ${client.last_name}`;
    }
    if (client.name) return client.name;
    return 'Client';
  };

  const getClientInitials = () => {
    if (client.first_name && client.last_name) {
      return `${client.first_name[0]}${client.last_name[0]}`.toUpperCase();
    }
    if (client.company_name) {
      return client.company_name.substring(0, 2).toUpperCase();
    }
    if (client.business_name) {
      return client.business_name.substring(0, 2).toUpperCase();
    }
    return 'C';
  };

  const getClientEmail = () => {
    return client.email_address || client.email || null;
  };

  const getClientPhone = () => {
    return client.phone_number || client.contact_number || client.phone || null;
  };

  const getClientLocation = () => {
    if (typeof client.location === 'string') return client.location;
    if (client.location?.city) {
      const parts = [];
      if (client.location.address) parts.push(client.location.address);
      if (client.location.city) parts.push(client.location.city);
      if (client.location.province) parts.push(client.location.province);
      if (client.location.country) parts.push(client.location.country);
      return parts.join(', ');
    }
    if (client.city || client.province || client.country) {
      const parts = [];
      if (client.address) parts.push(client.address);
      if (client.city) parts.push(client.city);
      if (client.province) parts.push(client.province);
      if (client.country) parts.push(client.country);
      return parts.join(', ');
    }
    return null;
  };

  const handleApply = () => {
    if (onApply && !hasApplied) {
      onApply(job);
    }
  };

  const hasLocation = job?.location && (
    job.location.address || 
    job.location.city || 
    job.location.province || 
    job.location.country
  );

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={detailStyles.overlay}>
        <TouchableOpacity style={detailStyles.backdrop} activeOpacity={1} onPress={onClose} />
        <View style={detailStyles.container}>
          <View style={detailStyles.handle} />
          
          {isLoading ? (
            <View style={detailStyles.loadingContainer}>
              <ActivityIndicator size="large" color={BLUE} />
              <Text style={detailStyles.loadingText}>Loading job details...</Text>
            </View>
          ) : job ? (
            <>
              <View style={detailStyles.header}>
                <View style={detailStyles.companyLogo}>
                  <Ionicons name="briefcase-outline" size={24} color={BLUE} />
                </View>
                <View style={detailStyles.headerInfo}>
                  <Text style={detailStyles.jobTitle} numberOfLines={2}>{job.title || 'Job Title'}</Text>
                  <TouchableOpacity 
                    style={detailStyles.clientNameLink} 
                    onPress={() => onViewClient && onViewClient(client)}
                    activeOpacity={0.7}
                  >
                    <Text style={detailStyles.jobCompany}>{getClientName()}</Text>
                    <Ionicons name="chevron-forward" size={14} color={BLUE} />
                  </TouchableOpacity>
                  {timeAgo && (
                    <View style={detailStyles.timeBadge}>
                      <Ionicons name="time-outline" size={12} color={TEXT_LIGHT} />
                      <Text style={detailStyles.timeText}>Posted {timeAgo}</Text>
                    </View>
                  )}
                </View>
                <TouchableOpacity style={detailStyles.closeBtn} onPress={onClose}>
                  <Ionicons name="close" size={20} color={TEXT_MUTED} />
                </TouchableOpacity>
              </View>

              {/* Features Badges */}
              <View style={detailStyles.featuresWrap}>
                {job.urgent && (
                  <View style={[detailStyles.featureBadge, { backgroundColor: '#FEE2E2', borderColor: '#FECACA' }]}>
                    <Ionicons name="flame-outline" size={14} color={RED} />
                    <Text style={[detailStyles.featureText, { color: RED }]}>Urgent</Text>
                  </View>
                )}
                {job.featured && (
                  <View style={[detailStyles.featureBadge, { backgroundColor: GOLD_SOFT, borderColor: GOLD_MID }]}>
                    <Ionicons name="star-outline" size={14} color={GOLD_DK} />
                    <Text style={[detailStyles.featureText, { color: GOLD_DK }]}>Featured</Text>
                  </View>
                )}
                {job.nda_required && (
                  <View style={[detailStyles.featureBadge, { backgroundColor: '#DBEAFE', borderColor: '#93C5FD' }]}>
                    <Ionicons name="document-text-outline" size={14} color={BLUE} />
                    <Text style={[detailStyles.featureText, { color: BLUE }]}>NDA</Text>
                  </View>
                )}
              </View>

              {/* Client Info Card - With Contact Details */}
              <TouchableOpacity 
                style={detailStyles.clientInfoCard} 
                onPress={() => onViewClient && onViewClient(client)}
                activeOpacity={0.8}
              >
                <View style={detailStyles.clientAvatar}>
                  {client.profile_picture ? (
                    <Image source={{ uri: client.profile_picture }} style={detailStyles.clientAvatarImg} />
                  ) : (
                    <Text style={detailStyles.clientAvatarText}>{getClientInitials()}</Text>
                  )}
                </View>
                <View style={detailStyles.clientInfo}>
                  <Text style={detailStyles.clientName}>{getClientName()}</Text>
                  {getClientEmail() && (
                    <View style={detailStyles.clientContactRow}>
                      <Ionicons name="mail-outline" size={12} color={TEXT_MUTED} />
                      <Text style={detailStyles.clientDetail}>{getClientEmail()}</Text>
                    </View>
                  )}
                  {getClientPhone() && (
                    <View style={detailStyles.clientContactRow}>
                      <Ionicons name="call-outline" size={12} color={TEXT_MUTED} />
                      <Text style={detailStyles.clientDetail}>{getClientPhone()}</Text>
                    </View>
                  )}
                  {getClientLocation() && (
                    <View style={detailStyles.clientContactRow}>
                      <Ionicons name="location-outline" size={12} color={TEXT_MUTED} />
                      <Text style={detailStyles.clientDetail} numberOfLines={1}>{getClientLocation()}</Text>
                    </View>
                  )}
                </View>
                <View style={detailStyles.clientInfoAction}>
                  <Text style={detailStyles.viewProfileText}>View Profile</Text>
                  <Ionicons name="chevron-forward" size={18} color={BLUE} />
                </View>
              </TouchableOpacity>

              <View style={detailStyles.metaRow}>
                {locationText && (
                  <View style={detailStyles.metaChip}>
                    <Ionicons name="location-outline" size={13} color={TEXT_MUTED} />
                    <Text style={detailStyles.metaText}>{locationText}</Text>
                  </View>
                )}
                {job.job_type && (
                  <View style={detailStyles.metaChip}>
                    <Ionicons name="briefcase-outline" size={13} color={TEXT_MUTED} />
                    <Text style={detailStyles.metaText}>{formatJobType(job.job_type)}</Text>
                  </View>
                )}
                {job.work_setup && (
                  <View style={detailStyles.metaChip}>
                    <Ionicons name="wifi-outline" size={13} color={TEXT_MUTED} />
                    <Text style={detailStyles.metaText}>{formatWorkSetup(job.work_setup)}</Text>
                  </View>
                )}
                {budgetText && (
                  <View style={[detailStyles.metaChip, detailStyles.metaChipGold]}>
                    <Ionicons name="cash-outline" size={13} color={GOLD_DK} />
                    <Text style={[detailStyles.metaText, { color: GOLD_DK, fontWeight: '600' }]}>{budgetText}</Text>
                  </View>
                )}
                {job.contact_preference && (
                  <View style={detailStyles.metaChip}>
                    <Ionicons name="chatbubble-outline" size={13} color={TEXT_MUTED} />
                    <Text style={detailStyles.metaText}>Contact: {job.contact_preference}</Text>
                  </View>
                )}
              </View>

              <View style={detailStyles.divider} />

              <ScrollView style={detailStyles.body} showsVerticalScrollIndicator={false}>
                <View style={detailStyles.section}>
                  <View style={detailStyles.sectionHeader}>
                    <Ionicons name="document-text-outline" size={16} color={BLUE} />
                    <Text style={detailStyles.sectionLabel}>Job Description</Text>
                  </View>
                  <Text style={detailStyles.descText}>{job.description || 'No description provided.'}</Text>
                </View>

                {skills.length > 0 && (
                  <View style={detailStyles.section}>
                    <View style={detailStyles.sectionHeader}>
                      <Ionicons name="bulb-outline" size={16} color={BLUE} />
                      <Text style={detailStyles.sectionLabel}>Required Skills</Text>
                    </View>
                    <View style={detailStyles.tagRow}>
                      {skills.map((s, i) => (
                        <View key={i} style={detailStyles.tag}>
                          <Text style={detailStyles.tagText}>{s}</Text>
                        </View>
                      ))}
                    </View>
                  </View>
                )}

                {tags.length > 0 && (
                  <View style={detailStyles.section}>
                    <View style={detailStyles.sectionHeader}>
                      <Ionicons name="pricetag-outline" size={16} color={BLUE} />
                      <Text style={detailStyles.sectionLabel}>Tags</Text>
                    </View>
                    <View style={detailStyles.tagRow}>
                      {tags.map((tag, i) => (
                        <View key={i} style={[detailStyles.tag, { backgroundColor: GOLD_SOFT, borderColor: GOLD_MID }]}>
                          <Text style={[detailStyles.tagText, { color: GOLD_DK }]}>#{tag}</Text>
                        </View>
                      ))}
                    </View>
                  </View>
                )}

                {/* Location Section - FULL DETAILS */}
                {hasLocation && (
                  <View style={detailStyles.section}>
                    <View style={detailStyles.sectionHeader}>
                      <Ionicons name="location-outline" size={16} color={BLUE} />
                      <Text style={detailStyles.sectionLabel}>Location Details</Text>
                    </View>
                    <View style={detailStyles.locationCard}>
                      {job.location.address && (
                        <View style={detailStyles.locationRow}>
                          <Ionicons name="navigate-outline" size={16} color={BLUE} />
                          <Text style={detailStyles.locationText}>{job.location.address}</Text>
                        </View>
                      )}
                      {job.location.city && (
                        <View style={detailStyles.locationRow}>
                          <Ionicons name="map-outline" size={16} color={BLUE} />
                          <Text style={detailStyles.locationText}>{job.location.city}</Text>
                        </View>
                      )}
                      {job.location.province && (
                        <View style={detailStyles.locationRow}>
                          <Ionicons name="business-outline" size={16} color={BLUE} />
                          <Text style={detailStyles.locationText}>{job.location.province}</Text>
                        </View>
                      )}
                      {job.location.country && (
                        <View style={detailStyles.locationRow}>
                          <Ionicons name="location-outline" size={16} color={BLUE} />
                          <Text style={detailStyles.locationText}>{job.location.country}</Text>
                        </View>
                      )}
                      {job.location.zip_code && (
                        <View style={detailStyles.locationRow}>
                          <Ionicons name="mail-outline" size={16} color={BLUE} />
                          <Text style={detailStyles.locationText}>Zip: {job.location.zip_code}</Text>
                        </View>
                      )}
                      {locationText && (
                        <View style={[detailStyles.locationRow, detailStyles.locationFull]}>
                          <Ionicons name="pin-outline" size={16} color={GOLD} />
                          <Text style={[detailStyles.locationText, detailStyles.locationFullText]}>
                            Full: {locationText}
                          </Text>
                        </View>
                      )}
                    </View>
                  </View>
                )}

                {job.requirements && (
                  <View style={detailStyles.section}>
                    <View style={detailStyles.sectionHeader}>
                      <Ionicons name="list-outline" size={16} color={BLUE} />
                      <Text style={detailStyles.sectionLabel}>Requirements</Text>
                    </View>
                    <View style={{ gap: 6 }}>
                      {job.requirements.education && job.requirements.education !== 'none' && (
                        <Text style={detailStyles.descText}>• Education: {job.requirements.education.replace('_', ' ').toUpperCase()}</Text>
                      )}
                      {job.requirements.portfolio_required && (
                        <Text style={detailStyles.descText}>• Portfolio required</Text>
                      )}
                      {job.requirements.resume_required && (
                        <Text style={detailStyles.descText}>• Resume required</Text>
                      )}
                      {job.requirements.cover_letter_required && (
                        <Text style={detailStyles.descText}>• Cover letter required</Text>
                      )}
                      {job.requirements.preferred_languages?.length > 0 && (
                        <Text style={detailStyles.descText}>• Languages: {job.requirements.preferred_languages.join(', ')}</Text>
                      )}
                      {job.requirements.preferred_certifications?.length > 0 && (
                        <Text style={detailStyles.descText}>• Certifications: {job.requirements.preferred_certifications.join(', ')}</Text>
                      )}
                    </View>
                  </View>
                )}

                {job.screening_questions?.length > 0 && (
                  <View style={detailStyles.section}>
                    <View style={detailStyles.sectionHeader}>
                      <Ionicons name="help-circle-outline" size={16} color={BLUE} />
                      <Text style={detailStyles.sectionLabel}>Screening Questions</Text>
                    </View>
                    {job.screening_questions.map((q, i) => (
                      <View key={i} style={detailStyles.questionItem}>
                        <Text style={detailStyles.questionNumber}>{i + 1}.</Text>
                        <Text style={detailStyles.questionText}>{q.question}</Text>
                        {q.required && (
                          <View style={detailStyles.requiredBadge}>
                            <Text style={detailStyles.requiredBadgeText}>Required</Text>
                          </View>
                        )}
                      </View>
                    ))}
                  </View>
                )}

                {/* Application Settings */}
                {job.hiring && (
                  <View style={detailStyles.section}>
                    <View style={detailStyles.sectionHeader}>
                      <Ionicons name="settings-outline" size={16} color={BLUE} />
                      <Text style={detailStyles.sectionLabel}>Application Settings</Text>
                    </View>
                    <View style={{ gap: 4 }}>
                      <Text style={detailStyles.descText}>• Max Applicants: {job.hiring.max_applicants || 100}</Text>
                      <Text style={detailStyles.descText}>• Auto Accept: {job.hiring.auto_accept ? 'Yes' : 'No'}</Text>
                      <Text style={detailStyles.descText}>• Multiple Hires: {job.hiring.allow_multiple_hires ? 'Yes' : 'No'}</Text>
                      {job.application_deadline && (
                        <Text style={detailStyles.descText}>• Deadline: {formatFullDate(job.application_deadline)}</Text>
                      )}
                    </View>
                  </View>
                )}

                {job.timeline && (job.timeline.duration_value || job.timeline.estimated_hours || job.timeline.weekly_limit) && (
                  <View style={detailStyles.section}>
                    <View style={detailStyles.sectionHeader}>
                      <Ionicons name="time-outline" size={16} color={BLUE} />
                      <Text style={detailStyles.sectionLabel}>Timeline</Text>
                    </View>
                    <View style={detailStyles.timelineGrid}>
                      {job.timeline.duration_value && job.timeline.duration_unit && (
                        <View style={detailStyles.timelineItem}>
                          <Ionicons name="hourglass-outline" size={16} color={BLUE} />
                          <View>
                            <Text style={detailStyles.timelineLabel}>Duration</Text>
                            <Text style={detailStyles.timelineValue}>
                              {job.timeline.duration_value} {job.timeline.duration_unit}
                            </Text>
                          </View>
                        </View>
                      )}
                      {job.timeline.estimated_hours && (
                        <View style={detailStyles.timelineItem}>
                          <Ionicons name="time-outline" size={16} color={BLUE} />
                          <View>
                            <Text style={detailStyles.timelineLabel}>Estimated Hours</Text>
                            <Text style={detailStyles.timelineValue}>{job.timeline.estimated_hours} hrs</Text>
                          </View>
                        </View>
                      )}
                      {job.timeline.weekly_limit && (
                        <View style={detailStyles.timelineItem}>
                          <Ionicons name="calendar-outline" size={16} color={BLUE} />
                          <View>
                            <Text style={detailStyles.timelineLabel}>Weekly Limit</Text>
                            <Text style={detailStyles.timelineValue}>{job.timeline.weekly_limit} hrs/week</Text>
                          </View>
                        </View>
                      )}
                      {job.timeline.start_date && (
                        <View style={detailStyles.timelineItem}>
                          <Ionicons name="calendar-outline" size={16} color={BLUE} />
                          <View>
                            <Text style={detailStyles.timelineLabel}>Start Date</Text>
                            <Text style={detailStyles.timelineValue}>{formatFullDate(job.timeline.start_date)}</Text>
                          </View>
                        </View>
                      )}
                      {job.timeline.end_date && (
                        <View style={detailStyles.timelineItem}>
                          <Ionicons name="calendar-outline" size={16} color={BLUE} />
                          <View>
                            <Text style={detailStyles.timelineLabel}>End Date</Text>
                            <Text style={detailStyles.timelineValue}>{formatFullDate(job.timeline.end_date)}</Text>
                          </View>
                        </View>
                      )}
                    </View>
                  </View>
                )}

                <View style={detailStyles.detailGrid}>
                  {experienceText && (
                    <View style={detailStyles.detailItem}>
                      <Ionicons name="bar-chart-outline" size={16} color={BLUE} />
                      <View>
                        <Text style={detailStyles.detailLabel}>Experience Level</Text>
                        <Text style={detailStyles.detailValue}>{experienceText}</Text>
                      </View>
                    </View>
                  )}
                  {job.job_type && (
                    <View style={detailStyles.detailItem}>
                      <Ionicons name="briefcase-outline" size={16} color={BLUE} />
                      <View>
                        <Text style={detailStyles.detailLabel}>Job Type</Text>
                        <Text style={detailStyles.detailValue}>{formatJobType(job.job_type)}</Text>
                      </View>
                    </View>
                  )}
                  {job.work_setup && (
                    <View style={detailStyles.detailItem}>
                      <Ionicons name="wifi-outline" size={16} color={BLUE} />
                      <View>
                        <Text style={detailStyles.detailLabel}>Work Setup</Text>
                        <Text style={detailStyles.detailValue}>{formatWorkSetup(job.work_setup)}</Text>
                      </View>
                    </View>
                  )}
                  {job.vacancies && job.vacancies > 0 && (
                    <View style={detailStyles.detailItem}>
                      <Ionicons name="people-outline" size={16} color={BLUE} />
                      <View>
                        <Text style={detailStyles.detailLabel}>Vacancies</Text>
                        <Text style={detailStyles.detailValue}>{job.vacancies}</Text>
                      </View>
                    </View>
                  )}
                  {job.timezone && (
                    <View style={detailStyles.detailItem}>
                      <Ionicons name="time-outline" size={16} color={BLUE} />
                      <View>
                        <Text style={detailStyles.detailLabel}>Timezone</Text>
                        <Text style={detailStyles.detailValue}>{job.timezone}</Text>
                      </View>
                    </View>
                  )}
                  {job.nda_required && (
                    <View style={detailStyles.detailItem}>
                      <Ionicons name="document-text-outline" size={16} color={BLUE} />
                      <View>
                        <Text style={detailStyles.detailLabel}>NDA</Text>
                        <Text style={detailStyles.detailValue}>Required</Text>
                      </View>
                    </View>
                  )}
                  {job.category && (
                    <View style={detailStyles.detailItem}>
                      <Ionicons name="pricetag-outline" size={16} color={BLUE} />
                      <View>
                        <Text style={detailStyles.detailLabel}>Category</Text>
                        <Text style={detailStyles.detailValue}>{job.category}</Text>
                      </View>
                    </View>
                  )}
                  {job.subcategory && (
                    <View style={detailStyles.detailItem}>
                      <Ionicons name="pricetag-outline" size={16} color={BLUE} />
                      <View>
                        <Text style={detailStyles.detailLabel}>Subcategory</Text>
                        <Text style={detailStyles.detailValue}>{job.subcategory}</Text>
                      </View>
                    </View>
                  )}
                  {fullDate && (
                    <View style={detailStyles.detailItem}>
                      <Ionicons name="calendar-outline" size={16} color={BLUE} />
                      <View>
                        <Text style={detailStyles.detailLabel}>Posted</Text>
                        <Text style={detailStyles.detailValue}>{fullDate}</Text>
                      </View>
                    </View>
                  )}
                  {job.contact_preference && (
                    <View style={detailStyles.detailItem}>
                      <Ionicons name="chatbubble-outline" size={16} color={BLUE} />
                      <View>
                        <Text style={detailStyles.detailLabel}>Contact</Text>
                        <Text style={detailStyles.detailValue}>{job.contact_preference}</Text>
                      </View>
                    </View>
                  )}
                </View>

                <View style={{ height: 80 }} />
              </ScrollView>

              <View style={detailStyles.applyContainer}>
                <TouchableOpacity 
                  style={[
                    detailStyles.applyButton,
                    hasApplied && detailStyles.applyButtonDisabled
                  ]}
                  onPress={handleApply}
                  disabled={hasApplied}
                  activeOpacity={0.8}
                >
                  <Ionicons 
                    name={hasApplied ? 'checkmark-circle' : 'paper-plane-outline'} 
                    size={20} 
                    color={WHITE} 
                    style={detailStyles.applyIcon}
                  />
                  <Text style={detailStyles.applyButtonText}>
                    {hasApplied ? 'Already Applied' : 'Apply Now'}
                  </Text>
                </TouchableOpacity>
              </View>
            </>
          ) : null}
        </View>
      </View>
    </Modal>
  );
}

// ── Bottom Tab Bar ─────────────────────────────────────────────────────────────────
function BottomTabBar({ activeTab, onTabPress }) {
  const tabs = [
    { key: 'Home', label: 'Home', icon: 'home-outline', activeIcon: 'home' },
    { key: 'Messages', label: 'Messages', icon: 'chatbubble-outline', activeIcon: 'chatbubble' },
    { key: 'MyJobs', label: 'My Jobs', icon: 'briefcase-outline', activeIcon: 'briefcase' },
    { key: 'MyApplications', label: 'Applications', icon: 'checkmark-circle-outline', activeIcon: 'checkmark-circle' },
    { key: 'Profile', label: 'Profile', icon: 'person-outline', activeIcon: 'person' },
  ];

  return (
    <SafeAreaView edges={['bottom']} style={styles.tabSafe}>
      <View style={styles.tabBar}>
        {tabs.map((tab) => {
          const isActive = activeTab === tab.key;
          const isMyJobs = tab.key === 'MyJobs';
          
          return (
            <TouchableOpacity
              key={tab.key}
              style={[
                styles.tabItem,
                isMyJobs && styles.tabItemCenter,
              ]}
              onPress={() => onTabPress(tab.key)}
              activeOpacity={0.7}
            >
              {isMyJobs ? (
                <View style={[styles.centerButton, isActive && styles.centerButtonActive]}>
                  <Ionicons
                    name={isActive ? tab.activeIcon : tab.icon}
                    size={26}
                    color={isActive ? WHITE : BLUE}
                  />
                </View>
              ) : (
                <>
                  <View style={styles.tabIconWrap}>
                    <Ionicons
                      name={isActive ? tab.activeIcon : tab.icon}
                      size={22}
                      color={isActive ? BLUE : TEXT_LIGHT}
                    />
                  </View>
                  <Text style={[styles.tabLabel, isActive && styles.tabLabelActive]}>
                    {tab.label}
                  </Text>
                  {isActive && <View style={styles.tabIndicator} />}
                </>
              )}
            </TouchableOpacity>
          );
        })}
      </View>
    </SafeAreaView>
  );
}

// ── Main Screen ────────────────────────────────────────────────────────────────
export default function FreelancerScreen({ onNavigate, route }) {
  const dispatch = useDispatch();
  const { user } = useSelector(s => s.auth);
  
  const jobsSlice = useSelector(s => s.jobs);
  const jobs = jobsSlice?.jobs?.list || [];
  const jobsLoading = jobsSlice?.jobs?.isLoading || false;
  const jobsError = jobsSlice?.jobs?.error || null;
  
  const applicationsSlice = useSelector(s => s.applications);
  const applySuccess = applicationsSlice?.applySuccess || false;
  
  const [activeTab, setActiveTab] = useState('Home');
  const [refreshing, setRefreshing] = useState(false);
  const [selectedJob, setSelectedJob] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [loadingJobDetail, setLoadingJobDetail] = useState(false);
  const [showClientProfile, setShowClientProfile] = useState(false);
  const [selectedClient, setSelectedClient] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [savedJobs, setSavedJobs] = useState([]);
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showAlreadyAppliedModal, setShowAlreadyAppliedModal] = useState(false);
  const [appliedJobIds, setAppliedJobIds] = useState([]);

  const initials = `${user?.first_name?.[0] ?? ''}${user?.last_name?.[0] ?? ''}`;
  const fullName = `${user?.first_name ?? ''} ${user?.last_name ?? ''}`.trim();

  useEffect(() => {
    if (route?.params?.returnState?.activeTab) {
      setActiveTab(route.params.returnState.activeTab);
    }
  }, [route?.params]);

  const fetchJobs = useCallback(async () => {
    try {
      const result = await dispatch(getFreelancerJobs({ limit: 20 })).unwrap();
      console.log('✅ Jobs fetched:', result?.jobs?.length || 0);
    } catch (e) { 
      console.error('❌ Fetch jobs error:', e); 
    }
  }, [dispatch]);

  const fetchApplications = useCallback(async () => {
    try {
      const result = await dispatch(getFreelancerApplications({})).unwrap();
      const list = result?.applications || result?.data || result || [];
      const appliedIds = list.map(app => app.job_id?._id || app.job_id).filter(id => id);
      setAppliedJobIds(appliedIds);
      console.log('✅ Applications fetched:', appliedIds.length);
    } catch (e) { 
      console.error('❌ Error fetching applications:', e); 
    }
  }, [dispatch]);

  useEffect(() => {
    fetchJobs();
    fetchApplications();
  }, [fetchJobs, fetchApplications]);

  useEffect(() => {
    if (applySuccess) {
      fetchApplications();
    }
  }, [applySuccess, fetchApplications]);

  const isInitialLoading = jobsLoading && !refreshing && (!jobs || jobs.length === 0);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([fetchJobs(), fetchApplications()]);
    setRefreshing(false);
  }, [fetchJobs, fetchApplications]);

  const handleTabPress = (key) => {
    if (key === 'Home') {
      setActiveTab(key);
    } else {
      const returnState = { activeTab: key };
      if (key === 'MyJobs') {
        onNavigate('MyJobs', { returnState });
      } else if (key === 'Messages') {
        onNavigate('Messages', { returnState });
      } else if (key === 'Profile') {
        onNavigate('FreelancerProfile', { returnState });
      } else if (key === 'MyApplications') {
        onNavigate('MyApplications', { returnState });
      }
    }
  };

  const handleLogout = () =>
    Alert.alert('Logout', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Logout', style: 'destructive', onPress: async () => { 
        await dispatch(logout()); 
        onNavigate('Login'); 
      } },
    ]);

  const openJobDetail = async (job) => {
    setSelectedJob(job);
    setModalVisible(true);
    setLoadingJobDetail(true);
    
    try {
      const result = await dispatch(getJobById(job._id)).unwrap();
      setSelectedJob(result.job);
    } catch (error) {
      console.error('Error fetching job details:', error);
    } finally {
      setLoadingJobDetail(false);
    }
  };

  const handleViewClient = (client) => {
    if (client && Object.keys(client).length > 0) {
      setSelectedClient(client);
      setShowClientProfile(true);
    }
  };

  const handleApply = (job) => {
    if (appliedJobIds.includes(job._id)) {
      setSelectedJob(job);
      setShowAlreadyAppliedModal(true);
      return;
    }
    setModalVisible(false);
    setSelectedJob(job);
    setShowApplyModal(true);
  };

  const handleApplySuccess = () => {
    setShowApplyModal(false);
    setShowSuccessModal(true);
    fetchApplications();
  };

  const toggleSaveJob = (jobId) => {
    setSavedJobs(prev => {
      if (prev.includes(jobId)) {
        return prev.filter(id => id !== jobId);
      } else {
        return [...prev, jobId];
      }
    });
  };

  const isJobSaved = (jobId) => savedJobs.includes(jobId);

  const filteredJobs = jobs?.filter(job => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase().trim();
    const title = job.title?.toLowerCase() || '';
    const description = job.description?.toLowerCase() || '';
    const skills = job.required_skills?.join(' ').toLowerCase() || '';
    const company = job.client_id?.company_name?.toLowerCase() || '';
    const business = job.client_id?.business_name?.toLowerCase() || '';
    const category = job.category?.toLowerCase() || '';
    
    return title.includes(query) || 
           description.includes(query) || 
           skills.includes(query) ||
           company.includes(query) ||
           business.includes(query) ||
           category.includes(query);
  });

  console.log('📊 Jobs in render:', jobs?.length || 0, 'Filtered:', filteredJobs?.length || 0);

  const renderJobItem = useCallback(({ item: job }) => {
    const locationDisplay = formatLocation(job.location) || 'Remote';
    const budgetDisplay = formatBudgetForCard(job);
    const skills = job.required_skills || [];
    const workSetup = formatWorkSetup(job.work_setup);
    const client = job.client_id || {};
    const timeAgo = getTimeAgo(job.createdAt);
    const isSaved = isJobSaved(job._id);
    const hasApplied = appliedJobIds.includes(job._id);
    const hasLocation = job.location && (job.location.address || job.location.city || job.location.country);
    
    const getClientName = () => {
      if (client.company_name) return client.company_name;
      if (client.business_name) return client.business_name;
      if (client.first_name && client.last_name) {
        return `${client.first_name} ${client.last_name}`;
      }
      if (client.name) return client.name;
      return 'Client';
    };

    const getClientInitials = () => {
      if (client.first_name && client.last_name) {
        return `${client.first_name[0]}${client.last_name[0]}`.toUpperCase();
      }
      if (client.company_name) {
        return client.company_name.substring(0, 2).toUpperCase();
      }
      if (client.business_name) {
        return client.business_name.substring(0, 2).toUpperCase();
      }
      return 'C';
    };

    return (
      <View style={styles.jobCard}>
        <TouchableOpacity 
          style={styles.jobCardContent}
          onPress={() => openJobDetail(job)} 
          activeOpacity={0.85}
        >
          <View style={styles.jobCardTop}>
            {job.urgent && (
              <View style={styles.badgeUrgent}>
                <Ionicons name="flame" size={10} color="#D97706" />
                <Text style={styles.badgeUrgentText}>Urgent</Text>
              </View>
            )}
            {job.featured && (
              <View style={styles.badgeFeatured}>
                <Ionicons name="star" size={10} color={GOLD} />
                <Text style={styles.badgeFeaturedText}>Featured</Text>
              </View>
            )}
            {job.nda_required && (
              <View style={styles.badgeNda}>
                <Ionicons name="document-text" size={10} color={BLUE} />
                <Text style={styles.badgeNdaText}>NDA</Text>
              </View>
            )}
            {job.status === 'open' && (
              <View style={styles.badgeOpen}>
                <Text style={styles.badgeOpenText}>Open</Text>
              </View>
            )}
            {workSetup && (
              <View style={styles.badgeWorkSetup}>
                <Ionicons name={job.work_setup === 'remote' ? 'wifi' : 'business'} size={10} color={BLUE} />
                <Text style={styles.badgeWorkSetupText}>{workSetup}</Text>
              </View>
            )}
            {timeAgo && (
              <View style={styles.badgeTime}>
                <Ionicons name="time-outline" size={10} color={TEXT_LIGHT} />
                <Text style={styles.badgeTimeText}>{timeAgo}</Text>
              </View>
            )}
            {hasApplied && (
              <View style={styles.badgeApplied}>
                <Ionicons name="checkmark-circle" size={10} color={GREEN} />
                <Text style={styles.badgeAppliedText}>Applied</Text>
              </View>
            )}
          </View>

          <Text style={styles.jobTitle} numberOfLines={2}>{job.title || 'Job Title'}</Text>
          
          <TouchableOpacity 
            style={styles.clientInfoRow} 
            onPress={(e) => {
              e.stopPropagation();
              handleViewClient(client);
            }}
            activeOpacity={0.7}
          >
            <View style={styles.clientAvatarSmall}>
              {client.profile_picture ? (
                <Image source={{ uri: client.profile_picture }} style={styles.clientAvatarSmallImg} />
              ) : (
                <Text style={styles.clientAvatarSmallText}>{getClientInitials()}</Text>
              )}
            </View>
            <Text style={styles.jobCompany} numberOfLines={1}>{getClientName()}</Text>
            <Ionicons name="chevron-forward" size={14} color={TEXT_LIGHT} />
          </TouchableOpacity>

          {hasLocation ? (
            <View style={styles.jobMetaRow}>
              <Ionicons name="location-outline" size={12} color={TEXT_MUTED} />
              <Text style={styles.jobLocation} numberOfLines={1}>{locationDisplay}</Text>
            </View>
          ) : (
            <View style={styles.jobMetaRow}>
              <Ionicons name="wifi-outline" size={12} color={TEXT_MUTED} />
              <Text style={styles.jobLocation}>Remote</Text>
            </View>
          )}

          {job.description && (
            <Text style={styles.descriptionPreview} numberOfLines={2}>
              {job.description}
            </Text>
          )}

          {budgetDisplay && (
            <View style={styles.budgetChip}>
              <Ionicons name="cash-outline" size={13} color={GOLD_DK} />
              <Text style={styles.budgetText}>{budgetDisplay}</Text>
            </View>
          )}

          {job.category && (
            <View style={styles.categoryChip}>
              <Text style={styles.categoryText}>{job.category}</Text>
            </View>
          )}

          {skills.length > 0 && (
            <View style={styles.tagRow}>
              {skills.slice(0, 3).map((s, i) => (
                <View key={i} style={styles.tag}>
                  <Text style={styles.tagText}>{s}</Text>
                </View>
              ))}
              {skills.length > 3 && (
                <View style={styles.tag}>
                  <Text style={styles.tagText}>+{skills.length - 3}</Text>
                </View>
              )}
            </View>
          )}
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.saveButton}
          onPress={(e) => {
            e.stopPropagation();
            toggleSaveJob(job._id);
          }}
          activeOpacity={0.7}
        >
          <Ionicons 
            name={isSaved ? 'bookmark' : 'bookmark-outline'} 
            size={24} 
            color={isSaved ? BLUE : TEXT_LIGHT} 
          />
        </TouchableOpacity>
      </View>
    );
  }, [savedJobs, appliedJobIds]);

  const ListHeader = (
    <>
      <View style={styles.welcomeHeader}>
        <View style={styles.userInfoContainer}>
          <Text style={styles.greetingText}>Welcome back</Text>
          <View style={styles.nameRow}>
            <Text style={styles.welcomeName}>{fullName || 'Freelancer'}</Text>
          </View>
          <Text style={styles.userEmail}>{user?.email || ''}</Text>
        </View>
        <TouchableOpacity onPress={handleLogout} style={styles.avatarBtn}>
          {user?.profile_picture
            ? <Image source={{ uri: user.profile_picture }} style={styles.avatarImg} />
            : <Text style={styles.avatarInitials}>{initials}</Text>
          }
        </TouchableOpacity>
      </View>

      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Ionicons name="search-outline" size={20} color={TEXT_LIGHT} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search jobs by title, skills, or company..."
            placeholderTextColor={TEXT_LIGHT}
            value={searchQuery}
            onChangeText={setSearchQuery}
            returnKeyType="search"
            clearButtonMode="while-editing"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')} style={styles.clearSearchBtn}>
              <Ionicons name="close-circle" size={18} color={TEXT_LIGHT} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <View style={styles.statsRow}>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{jobs?.length || 0}</Text>
          <Text style={styles.statLabel}>Available Jobs</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{appliedJobIds.length}</Text>
          <Text style={styles.statLabel}>Applications</Text>
        </View>
      </View>

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>
          Available Jobs
          {!isInitialLoading && filteredJobs?.length > 0 && (
            <Text style={styles.sectionCount}> ({filteredJobs.length})</Text>
          )}
          {searchQuery.length > 0 && (
            <Text style={styles.searchResultText}> • Results for "{searchQuery}"</Text>
          )}
        </Text>
      </View>
    </>
  );

  const SkeletonList = (
    <View style={styles.jobsListContainer}>
      {[1, 2, 3].map(i => <SkeletonCard key={i} />)}
    </View>
  );

  const EmptyComponent = (
    <View style={styles.emptyCard}>
      <Ionicons name="briefcase-outline" size={40} color={SILVER2} />
      <Text style={styles.emptyTitle}>
        {searchQuery.length > 0 ? 'No matching jobs found' : 'No jobs available'}
      </Text>
      <Text style={styles.emptySub}>
        {searchQuery.length > 0 
          ? `Try adjusting your search for "${searchQuery}"` 
          : 'Check back later for new opportunities'}
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.root}>
        <View style={styles.topbar}>
          <View style={styles.topbarLeft}>
            <View style={styles.logoBox}>
              <Image 
                source={require('../../../assets/taskra.png')} 
                style={styles.logoImage}
                resizeMode="contain"
              />
            </View>
            <View>
              <Text style={styles.topbarBrand}>Taskra</Text>
              <Text style={styles.topbarTagline}>Freelancer Hub</Text>
            </View>
          </View>
          <TouchableOpacity style={styles.notifBtn} onPress={() => onNavigate('Notification')}>
            <Ionicons name="notifications-outline" size={22} color={WHITE} />
          </TouchableOpacity>
        </View>

        {isInitialLoading ? (
          <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 24 }} showsVerticalScrollIndicator={false}>
            {ListHeader}
            {SkeletonList}
          </ScrollView>
        ) : (
          <FlatList
            data={filteredJobs || []}
            keyExtractor={(item, index) => item._id || index.toString()}
            renderItem={renderJobItem}
            ListHeaderComponent={ListHeader}
            ListEmptyComponent={EmptyComponent}
            contentContainerStyle={styles.jobsListContainer}
            showsVerticalScrollIndicator={false}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={BLUE} />}
          />
        )}

        <BottomTabBar 
          activeTab={activeTab} 
          onTabPress={handleTabPress}
        />
      </View>

      <JobDetailModal
        visible={modalVisible}
        job={selectedJob}
        onClose={() => {
          setModalVisible(false);
          setSelectedJob(null);
        }}
        isLoading={loadingJobDetail}
        onViewClient={handleViewClient}
        onApply={handleApply}
        hasApplied={selectedJob ? appliedJobIds.includes(selectedJob._id) : false}
      />

      <ClientProfileModal
        visible={showClientProfile}
        client={selectedClient}
        onClose={() => {
          setShowClientProfile(false);
          setSelectedClient(null);
        }}
      />

      <ApplyModal
        visible={showApplyModal}
        job={selectedJob}
        onClose={() => setShowApplyModal(false)}
        onSuccess={handleApplySuccess}
        userProfile={user}
      />

      <ApplicationStatusModal
        visible={showSuccessModal}
        jobTitle={selectedJob?.title || ''}
        onClose={() => setShowSuccessModal(false)}
      />

      <AlreadyAppliedModal
        visible={showAlreadyAppliedModal}
        jobTitle={selectedJob?.title || ''}
        onClose={() => setShowAlreadyAppliedModal(false)}
      />
    </SafeAreaView>
  );
}

// ── Styles ─────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: NAVY },
  root: { flex: 1, backgroundColor: BG },

  topbar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingVertical: 12, backgroundColor: NAVY,
  },
  topbarLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  logoBox: {
    width: 34,
    height: 34,
    backgroundColor: WHITE,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.15)',
    overflow: 'hidden',
  },
  logoImage: {
    width: 28,
    height: 28,
    borderRadius: 6,
  },
  topbarBrand: { fontSize: 16, fontWeight: '800', color: WHITE, letterSpacing: -0.2 },
  topbarTagline: { fontSize: 9, fontWeight: '500', color: GOLD_LT, letterSpacing: 1.44, textTransform: 'uppercase', marginTop: 1 },
  notifBtn: { position: 'relative', padding: 4 },

  welcomeHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
  },
  userInfoContainer: {
    flex: 1,
  },
  greetingText: {
    fontSize: 13,
    color: TEXT_MUTED,
    fontWeight: '500',
    marginBottom: 2,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 2,
  },
  welcomeName: {
    fontSize: 24,
    fontWeight: '700',
    color: TEXT_MAIN,
  },
  userEmail: {
    fontSize: 13,
    color: TEXT_MUTED,
  },
  avatarBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: GOLD,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: GOLD_LT,
  },
  avatarImg: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  avatarInitials: {
    fontSize: 16,
    fontWeight: '700',
    color: NAVY,
  },

  searchContainer: {
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: WHITE,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: BORDER,
    paddingHorizontal: 14,
    paddingVertical: 2,
    height: 46,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: TEXT_MAIN,
    paddingVertical: 10,
  },
  clearSearchBtn: {
    padding: 4,
  },

  statsRow: {
    flexDirection: 'row',
    marginHorizontal: 20,
    marginBottom: 16,
    backgroundColor: WHITE,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: BORDER,
    paddingVertical: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statNumber: {
    fontSize: 20,
    fontWeight: '700',
    color: TEXT_MAIN,
  },
  statLabel: {
    fontSize: 11,
    color: TEXT_MUTED,
    fontWeight: '500',
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 30,
    backgroundColor: BORDER,
  },

  sectionHeader: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    paddingHorizontal: 20, 
    marginBottom: 12 
  },
  sectionTitle: { 
    fontSize: 18, 
    fontWeight: '700', 
    color: TEXT_MAIN 
  },
  sectionCount: { 
    fontSize: 14, 
    fontWeight: '500', 
    color: TEXT_MUTED 
  },
  searchResultText: {
    fontSize: 13,
    fontWeight: '400',
    color: TEXT_MUTED,
  },

  jobsListContainer: { 
    paddingHorizontal: 16, 
    paddingBottom: 80 
  },

  jobCard: {
    backgroundColor: CARD, 
    marginBottom: 12, 
    borderRadius: 18, 
    borderWidth: 1.5, 
    borderColor: BORDER,
    shadowColor: '#000', 
    shadowOffset: { width: 0, height: 1 }, 
    shadowOpacity: 0.05, 
    shadowRadius: 4, 
    elevation: 1,
    flexDirection: 'row',
    overflow: 'hidden',
  },
  jobCardContent: {
    flex: 1,
    padding: 16,
  },
  saveButton: {
    paddingHorizontal: 12,
    paddingVertical: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderLeftWidth: 1,
    borderLeftColor: BORDER,
  },
  jobCardTop: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    marginBottom: 10, 
    gap: 6, 
    flexWrap: 'wrap' 
  },
  badgeUrgent: { 
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FEF3C7', 
    paddingHorizontal: 10, 
    paddingVertical: 4, 
    borderRadius: 999 
  },
  badgeUrgentText: { 
    fontSize: 11, 
    fontWeight: '600', 
    color: '#D97706' 
  },
  badgeFeatured: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: GOLD_SOFT,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: GOLD_MID,
  },
  badgeFeaturedText: {
    fontSize: 11,
    fontWeight: '600',
    color: GOLD_DK,
  },
  badgeNda: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#DBEAFE',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#93C5FD',
  },
  badgeNdaText: {
    fontSize: 11,
    fontWeight: '600',
    color: BLUE,
  },
  badgeOpen: {
    backgroundColor: `${GREEN}15`,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  badgeOpenText: {
    fontSize: 11,
    fontWeight: '600',
    color: GREEN,
  },
  badgeWorkSetup: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 4, 
    backgroundColor: `${BLUE}10`, 
    paddingHorizontal: 8, 
    paddingVertical: 4, 
    borderRadius: 999 
  },
  badgeWorkSetupText: { 
    fontSize: 10, 
    fontWeight: '600', 
    color: BLUE 
  },
  badgeTime: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: BG,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
  },
  badgeTimeText: {
    fontSize: 10,
    color: TEXT_LIGHT,
    fontWeight: '500',
  },
  badgeApplied: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: `${GREEN}15`,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
  },
  badgeAppliedText: {
    fontSize: 10,
    color: GREEN,
    fontWeight: '600',
  },
  jobTitle: { 
    fontSize: 17, 
    fontWeight: '700', 
    color: TEXT_MAIN, 
    marginBottom: 4, 
    lineHeight: 23 
  },
  
  clientInfoRow: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 8, 
    marginBottom: 6 
  },
  clientAvatarSmall: { 
    width: 20, 
    height: 20, 
    borderRadius: 10, 
    backgroundColor: `${BLUE}15`, 
    alignItems: 'center', 
    justifyContent: 'center', 
    overflow: 'hidden' 
  },
  clientAvatarSmallImg: { 
    width: 20, 
    height: 20, 
    borderRadius: 10 
  },
  clientAvatarSmallText: { 
    fontSize: 8, 
    fontWeight: '700', 
    color: BLUE 
  },
  jobCompany: { 
    fontSize: 13, 
    color: BLUE, 
    fontWeight: '500', 
    flex: 1 
  },
  
  jobMetaRow: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 5, 
    marginBottom: 8 
  },
  jobLocation: { 
    fontSize: 12, 
    color: TEXT_MUTED 
  },
  
  descriptionPreview: {
    fontSize: 13,
    color: TEXT_MUTED,
    lineHeight: 18,
    marginBottom: 8,
  },
  
  budgetChip: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 5, 
    backgroundColor: 'rgba(200,149,32,0.08)', 
    alignSelf: 'flex-start', 
    paddingHorizontal: 10, 
    paddingVertical: 5, 
    borderRadius: 20, 
    borderWidth: 1, 
    borderColor: 'rgba(200,149,32,0.2)', 
    marginBottom: 8 
  },
  budgetText: { 
    fontSize: 12, 
    color: GOLD_DK, 
    fontWeight: '600' 
  },
  categoryChip: {
    backgroundColor: `${BLUE}10`,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
    marginBottom: 8,
  },
  categoryText: {
    fontSize: 11,
    color: BLUE,
    fontWeight: '500',
  },
  tagRow: { 
    flexDirection: 'row', 
    flexWrap: 'wrap', 
    gap: 6 
  },
  tag: { 
    paddingVertical: 5, 
    paddingHorizontal: 12, 
    backgroundColor: BG, 
    borderRadius: 999, 
    borderWidth: 1.5, 
    borderColor: BORDER 
  },
  tagText: { 
    fontSize: 12, 
    color: TEXT_MUTED, 
    fontWeight: '500' 
  },

  skeletonLine: { 
    backgroundColor: BORDER, 
    borderRadius: 6, 
    marginBottom: 6, 
    opacity: 0.6 
  },

  emptyCard: { 
    backgroundColor: CARD, 
    marginHorizontal: 0, 
    borderRadius: 18, 
    borderWidth: 1.5, 
    borderColor: BORDER, 
    padding: 36, 
    alignItems: 'center', 
    marginBottom: 20 
  },
  emptyTitle: { 
    fontSize: 16, 
    fontWeight: '700', 
    color: TEXT_MAIN, 
    marginTop: 14, 
    marginBottom: 6 
  },
  emptySub: { 
    fontSize: 13, 
    color: TEXT_MUTED, 
    textAlign: 'center', 
    paddingHorizontal: 20 
  },

  tabSafe: { 
    backgroundColor: CARD,
    borderTopWidth: 1,
    borderTopColor: BORDER,
    paddingBottom: 0,
  },
  tabBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingTop: 8,
    paddingBottom: 12,
    paddingHorizontal: 8,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    position: 'relative',
  },
  tabItemCenter: {
    flex: 0,
    marginHorizontal: 8,
    marginTop: -16,
  },
  centerButton: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: WHITE,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: BLUE,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
    borderWidth: 2.5,
    borderColor: WHITE,
  },
  centerButtonActive: {
    backgroundColor: BLUE,
    transform: [{ scale: 1.02 }],
  },
  tabIconWrap: {
    position: 'relative',
    marginBottom: 4,
  },
  tabLabel: {
    fontSize: 10,
    color: TEXT_LIGHT,
    fontWeight: '500',
    marginTop: 2,
  },
  tabLabelActive: {
    color: BLUE,
    fontWeight: '700',
  },
  tabIndicator: {
    position: 'absolute',
    bottom: -8,
    width: 20,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: BLUE,
  },
});

// ── Detail Modal Styles ────────────────────────────────────────────────────────
const detailStyles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'flex-end' },
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(7,26,62,0.55)' },
  container: { 
    backgroundColor: WHITE, 
    borderTopLeftRadius: 24, 
    borderTopRightRadius: 24, 
    maxHeight: SCREEN_H * 0.92, 
    paddingTop: 12,
    position: 'relative',
  },
  handle: { 
    width: 40, 
    height: 4, 
    borderRadius: 999, 
    backgroundColor: BORDER, 
    alignSelf: 'center', 
    marginBottom: 16 
  },
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: TEXT_MUTED,
  },
  header: { 
    flexDirection: 'row', 
    alignItems: 'flex-start', 
    paddingHorizontal: 20, 
    marginBottom: 14, 
    gap: 12 
  },
  companyLogo: { 
    width: 48, 
    height: 48, 
    borderRadius: 14, 
    backgroundColor: `${BLUE}10`, 
    borderWidth: 1.5, 
    borderColor: `${BLUE}18`, 
    alignItems: 'center', 
    justifyContent: 'center', 
    flexShrink: 0 
  },
  headerInfo: { 
    flex: 1 
  },
  jobTitle: { 
    fontSize: 17, 
    fontWeight: '700', 
    color: TEXT_MAIN, 
    lineHeight: 23, 
    marginBottom: 3 
  },
  clientNameLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  jobCompany: { 
    fontSize: 13, 
    color: BLUE, 
    fontWeight: '500' 
  },
  timeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  timeText: {
    fontSize: 11,
    color: TEXT_LIGHT,
    fontWeight: '500',
  },
  closeBtn: { 
    width: 32, 
    height: 32, 
    borderRadius: 10, 
    backgroundColor: BG, 
    alignItems: 'center', 
    justifyContent: 'center' 
  },
  
  featuresWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginHorizontal: 20, marginBottom: 12 },
  featureBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, borderWidth: 1 },
  featureText: { fontSize: 11, fontWeight: '600' },
  
  clientInfoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: `${BLUE}5`,
    borderRadius: 12,
    padding: 12,
    marginHorizontal: 20,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: `${BLUE}15`,
  },
  clientAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: `${BLUE}15`,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  clientAvatarImg: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  clientAvatarText: {
    fontSize: 16,
    fontWeight: '700',
    color: BLUE,
  },
  clientInfo: {
    flex: 1,
  },
  clientName: {
    fontSize: 15,
    fontWeight: '600',
    color: TEXT_MAIN,
    marginBottom: 2,
  },
  clientContactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  clientDetail: {
    fontSize: 12,
    color: TEXT_MUTED,
    lineHeight: 16,
  },
  clientInfoAction: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  viewProfileText: {
    fontSize: 10,
    color: BLUE,
    fontWeight: '600',
    marginBottom: 2,
  },
  
  metaRow: { 
    flexDirection: 'row', 
    flexWrap: 'wrap', 
    gap: 8, 
    paddingHorizontal: 20, 
    marginBottom: 16 
  },
  metaChip: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 5, 
    backgroundColor: BG, 
    paddingHorizontal: 10, 
    paddingVertical: 6, 
    borderRadius: 999, 
    borderWidth: 1.5, 
    borderColor: BORDER 
  },
  metaChipGold: { 
    backgroundColor: 'rgba(200,149,32,0.08)', 
    borderColor: 'rgba(200,149,32,0.2)' 
  },
  metaText: { 
    fontSize: 12, 
    color: TEXT_MUTED, 
    fontWeight: '500' 
  },
  divider: { 
    height: 1.5, 
    backgroundColor: BORDER, 
    marginHorizontal: 20, 
    marginBottom: 16 
  },
  body: { 
    paddingHorizontal: 20,
    maxHeight: SCREEN_H * 0.45,
  },
  section: { 
    marginBottom: 20 
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 10,
  },
  sectionLabel: { 
    fontSize: 11, 
    fontWeight: '700', 
    color: BLUE, 
    textTransform: 'uppercase', 
    letterSpacing: 0.8, 
  },
  tagRow: { 
    flexDirection: 'row', 
    flexWrap: 'wrap', 
    gap: 6 
  },
  tag: { 
    paddingVertical: 6, 
    paddingHorizontal: 12, 
    backgroundColor: `${BLUE}10`, 
    borderRadius: 999, 
    borderWidth: 1.5, 
    borderColor: `${BLUE}22` 
  },
  tagText: { 
    fontSize: 12, 
    color: BLUE, 
    fontWeight: '600' 
  },
  descText: { 
    fontSize: 14, 
    color: TEXT_MUTED, 
    lineHeight: 22,
  },
  questionItem: { 
    flexDirection: 'row', 
    gap: 8, 
    marginBottom: 8,
    alignItems: 'flex-start',
    backgroundColor: '#F5F7FA',
    borderRadius: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: BORDER,
  },
  questionNumber: { 
    fontSize: 14, 
    color: BLUE, 
    fontWeight: '600', 
    width: 24 
  },
  questionText: { 
    fontSize: 14, 
    color: TEXT_MAIN, 
    flex: 1, 
    lineHeight: 20 
  },
  requiredBadge: {
    backgroundColor: BLUE_SOFT,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    alignSelf: 'flex-start',
  },
  requiredBadgeText: {
    fontSize: 9,
    color: BLUE,
    fontWeight: '600',
  },
  
  locationCard: {
    backgroundColor: '#F5F7FA',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: BORDER,
    gap: 8,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 4,
  },
  locationFull: {
    borderTopWidth: 1,
    borderTopColor: BORDER,
    paddingTop: 8,
    marginTop: 4,
  },
  locationText: {
    fontSize: 13,
    color: TEXT_MAIN,
    flex: 1,
  },
  locationFullText: {
    fontWeight: '600',
    color: GOLD_DK,
  },
  
  timelineGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    backgroundColor: '#F5F7FA',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: BORDER,
  },
  timelineItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    width: '47%',
  },
  timelineLabel: {
    fontSize: 10,
    color: TEXT_LIGHT,
    fontWeight: '500',
    marginBottom: 1,
  },
  timelineValue: {
    fontSize: 12,
    color: TEXT_MAIN,
    fontWeight: '600',
  },
  detailGrid: { 
    flexDirection: 'row', 
    flexWrap: 'wrap', 
    gap: 12, 
    backgroundColor: BG, 
    borderRadius: 16, 
    padding: 16, 
    borderWidth: 1.5, 
    borderColor: BORDER,
    marginBottom: 20,
  },
  detailItem: { 
    flexDirection: 'row', 
    alignItems: 'flex-start', 
    gap: 10, 
    width: '45%' 
  },
  detailLabel: { 
    fontSize: 10, 
    color: TEXT_LIGHT, 
    fontWeight: '500', 
    marginBottom: 2 
  },
  detailValue: { 
    fontSize: 13, 
    color: TEXT_MAIN, 
    fontWeight: '600' 
  },

  applyContainer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: WHITE,
    borderTopWidth: 1,
    borderTopColor: BORDER,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  applyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: BLUE,
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 20,
    shadowColor: BLUE,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  applyButtonDisabled: {
    backgroundColor: `${GREEN}80`,
    shadowOpacity: 0.1,
  },
  applyIcon: {
    marginRight: 10,
  },
  applyButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: WHITE,
    letterSpacing: 0.3,
  },
});

// ── Status Modal Styles ─────────────────────────────────────────────────────────
const statusStyles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(7,26,62,0.55)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  container: { backgroundColor: WHITE, borderRadius: 24, padding: 24, alignItems: 'center', width: '100%', maxWidth: 320 },
  iconContainer: { width: 80, height: 80, borderRadius: 40, backgroundColor: `${GREEN}15`, alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  title: { fontSize: 22, fontWeight: '700', color: GREEN, marginBottom: 12, textAlign: 'center' },
  message: { fontSize: 14, color: TEXT_MUTED, textAlign: 'center', marginBottom: 16, lineHeight: 20 },
  infoBox: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: `${BLUE}10`, padding: 12, borderRadius: 12, marginBottom: 20 },
  infoText: { fontSize: 12, color: BLUE, flex: 1, lineHeight: 16 },
  button: { backgroundColor: GREEN, paddingHorizontal: 32, paddingVertical: 12, borderRadius: 12, minWidth: 120, alignItems: 'center' },
  buttonText: { fontSize: 16, fontWeight: '600', color: WHITE },
});

// ── Client Profile Modal Styles ──────────────────────────────────────────────────
const clientProfileStyles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'flex-end' },
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(7,26,62,0.55)' },
  container: { 
    backgroundColor: WHITE, 
    borderTopLeftRadius: 24, 
    borderTopRightRadius: 24, 
    maxHeight: SCREEN_H * 0.85, 
    paddingTop: 12 
  },
  handle: { 
    width: 40, 
    height: 4, 
    borderRadius: 999, 
    backgroundColor: BORDER, 
    alignSelf: 'center', 
    marginBottom: 16 
  },
  header: { 
    alignItems: 'center', 
    paddingHorizontal: 20, 
    paddingBottom: 16, 
    borderBottomWidth: 1, 
    borderBottomColor: BORDER 
  },
  avatarLarge: { 
    width: 72, 
    height: 72, 
    borderRadius: 36, 
    backgroundColor: `${BLUE}15`, 
    alignItems: 'center', 
    justifyContent: 'center', 
    marginBottom: 12, 
    overflow: 'hidden' 
  },
  avatarImage: { 
    width: 72, 
    height: 72, 
    borderRadius: 36 
  },
  avatarInitials: { 
    fontSize: 28, 
    fontWeight: '700', 
    color: BLUE 
  },
  clientName: { 
    fontSize: 18, 
    fontWeight: '700', 
    color: TEXT_MAIN, 
    marginBottom: 2 
  },
  companyName: { 
    fontSize: 14, 
    color: TEXT_MUTED, 
    marginBottom: 6 
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
  },
  ratingStars: {
    flexDirection: 'row',
    gap: 2,
  },
  ratingText: {
    fontSize: 12,
    color: TEXT_MUTED,
    fontWeight: '500',
  },
  jobsCompleted: {
    fontSize: 12,
    color: GREEN,
    fontWeight: '600',
    marginTop: 2,
  },
  closeBtn: { 
    position: 'absolute', 
    top: 0, 
    right: 12, 
    width: 32, 
    height: 32, 
    borderRadius: 10, 
    backgroundColor: BG, 
    alignItems: 'center', 
    justifyContent: 'center' 
  },
  body: { 
    paddingHorizontal: 20, 
    paddingTop: 16, 
    paddingBottom: 20 
  },
  section: { 
    marginBottom: 20 
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 10,
  },
  sectionLabel: { 
    fontSize: 11, 
    fontWeight: '700', 
    color: BLUE, 
    textTransform: 'uppercase', 
    letterSpacing: 0.8, 
  },
  bioText: { 
    fontSize: 14, 
    color: TEXT_MUTED, 
    lineHeight: 22 
  },
  
  // Contact Card Styles
  contactCard: {
    backgroundColor: WHITE,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: BORDER,
    overflow: 'hidden',
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
  },
  contactIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: BLUE,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  contactInfo: {
    flex: 1,
  },
  contactLabel: {
    fontSize: 10,
    color: TEXT_LIGHT,
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  contactValue: {
    fontSize: 13,
    color: TEXT_MAIN,
    fontWeight: '500',
  },
  
  detailGrid: { 
    flexDirection: 'row', 
    flexWrap: 'wrap', 
    gap: 12, 
    backgroundColor: BG, 
    borderRadius: 16, 
    padding: 16, 
    borderWidth: 1.5, 
    borderColor: BORDER 
  },
  detailItem: { 
    flexDirection: 'row', 
    alignItems: 'flex-start', 
    gap: 10, 
    width: '45%' 
  },
  detailLabel: { 
    fontSize: 10, 
    color: TEXT_LIGHT, 
    fontWeight: '500', 
    marginBottom: 2 
  },
  detailValue: { 
    fontSize: 13, 
    color: TEXT_MAIN, 
    fontWeight: '500', 
    flexShrink: 1 
  },
  skillRow: { 
    flexDirection: 'row', 
    flexWrap: 'wrap', 
    gap: 6 
  },
  skillTag: { 
    paddingVertical: 6, 
    paddingHorizontal: 12, 
    backgroundColor: `${BLUE}10`, 
    borderRadius: 999, 
    borderWidth: 1.5, 
    borderColor: `${BLUE}22` 
  },
  skillTagText: { 
    fontSize: 12, 
    color: BLUE, 
    fontWeight: '500' 
  },
  projectContainer: {
    backgroundColor: BG,
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: BORDER,
  },
  projectItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
  },
  projectText: {
    fontSize: 13,
    color: TEXT_MAIN,
    flex: 1,
  },
  emptyState: { 
    alignItems: 'center', 
    paddingVertical: 40 
  },
  emptyStateTitle: { 
    fontSize: 16, 
    fontWeight: '600', 
    color: TEXT_MUTED, 
    marginTop: 12 
  },
  emptyStateText: { 
    fontSize: 13, 
    color: TEXT_LIGHT, 
    textAlign: 'center', 
    marginTop: 4, 
    paddingHorizontal: 20 
  },
});