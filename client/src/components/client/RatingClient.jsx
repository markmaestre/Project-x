// components/RatingClient.jsx - For FREELANCERS to rate CLIENTS
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useDispatch, useSelector } from 'react-redux';
import RatingStars from '../RatingStars';
import { rateClient, checkFreelancerCanRate } from '../../Redux/slices/ratingSlice';

const NAVY = '#071A3E';
const BLUE = '#0055A5';
const GOLD = '#C89520';
const WHITE = '#FFFFFF';
const BG = '#EEF4FA';
const CARD = '#FFFFFF';
const TEXT_MAIN = '#071A3E';
const TEXT_MUTED = '#3A5070';
const BORDER = '#C8D8E8';

const RatingClient = ({ 
  visible, 
  onClose, 
  clientId, 
  clientName,
  jobId,
  jobTitle,
  onSuccess 
}) => {
  const dispatch = useDispatch();
  const { isLoading } = useSelector((state) => state.ratings);
  
  const [rating, setRating] = useState(0);
  const [review, setReview] = useState('');
  const [communication, setCommunication] = useState(null);
  const [quality, setQuality] = useState(null);
  const [professionalism, setProfessionalism] = useState(null);
  const [onTime, setOnTime] = useState(null);
  const [canRate, setCanRate] = useState(true);
  const [checking, setChecking] = useState(true);

  // Check if freelancer can rate this client
  useEffect(() => {
    if (visible && jobId) {
      checkCanRate();
    }
  }, [visible, jobId]);

  const checkCanRate = async () => {
    setChecking(true);
    try {
      const result = await dispatch(checkFreelancerCanRate(jobId)).unwrap();
      setCanRate(result.canRate);
      if (!result.canRate) {
        Alert.alert('Info', result.message || 'You cannot rate this client');
        if (result.hasRated) {
          setTimeout(onClose, 1500);
        }
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to check if you can rate');
    } finally {
      setChecking(false);
    }
  };

  const handleSubmit = async () => {
    if (rating === 0) {
      Alert.alert('Error', 'Please select a rating');
      return;
    }

    if (review.trim().length < 10) {
      Alert.alert('Error', 'Please write at least 10 characters for your review');
      return;
    }

    try {
      const result = await dispatch(rateClient({
        client_id: clientId,
        job_id: jobId,
        rating,
        review: review.trim(),
        communication,
        quality,
        professionalism,
        on_time: onTime,
      })).unwrap();

      Alert.alert('Success', `You rated ${clientName || 'the client'} successfully!`);
      onSuccess && onSuccess(result);
      resetForm();
      onClose();
    } catch (error) {
      Alert.alert('Error', error.message || 'Failed to submit rating');
    }
  };

  const resetForm = () => {
    setRating(0);
    setReview('');
    setCommunication(null);
    setQuality(null);
    setProfessionalism(null);
    setOnTime(null);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const renderCategoryRating = (label, value, setValue) => (
    <View style={styles.categoryRow}>
      <Text style={styles.categoryLabel}>{label}</Text>
      <RatingStars
        rating={value || 0}
        size={20}
        editable={true}
        onPress={setValue}
        color={GOLD}
      />
      {value && (
        <Text style={styles.categoryValue}>{value}/5</Text>
      )}
    </View>
  );

  if (checking) {
    return (
      <Modal visible={visible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={BLUE} />
              <Text style={styles.loadingText}>Checking...</Text>
            </View>
          </View>
        </View>
      </Modal>
    );
  }

  if (!canRate) {
    return (
      <Modal visible={visible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.header}>
              <Text style={styles.title}>Cannot Rate</Text>
              <TouchableOpacity onPress={handleClose} style={styles.closeBtn}>
                <Ionicons name="close" size={24} color={TEXT_MUTED} />
              </TouchableOpacity>
            </View>
            <View style={styles.infoContainer}>
              <Ionicons name="information-circle" size={48} color={BLUE} />
              <Text style={styles.infoText}>
                You have already rated this client or the job is not yet completed.
              </Text>
              <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
                <Text style={styles.closeButtonText}>Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    );
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={handleClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.header}>
            <Text style={styles.title}>Rate Client</Text>
            <TouchableOpacity onPress={handleClose} style={styles.closeBtn}>
              <Ionicons name="close" size={24} color={TEXT_MUTED} />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            <View style={styles.jobInfo}>
              <Text style={styles.jobLabel}>Job</Text>
              <Text style={styles.jobTitle}>{jobTitle || 'Untitled Job'}</Text>
              <Text style={styles.recipientLabel}>Client</Text>
              <Text style={styles.recipientName}>{clientName || 'Client'}</Text>
            </View>

            <View style={styles.ratingSection}>
              <Text style={styles.sectionLabel}>Overall Rating *</Text>
              <RatingStars
                rating={rating}
                size={40}
                editable={true}
                onPress={setRating}
                color={GOLD}
              />
              {rating > 0 && (
                <Text style={styles.ratingText}>{rating} out of 5</Text>
              )}
            </View>

            <View style={styles.detailedSection}>
              <Text style={styles.sectionLabel}>Detailed Ratings (Optional)</Text>
              {renderCategoryRating('Communication', communication, setCommunication)}
              {renderCategoryRating('Professionalism', professionalism, setProfessionalism)}
              {renderCategoryRating('Payment Timeliness', onTime, setOnTime)}
              {renderCategoryRating('Clarity of Instructions', quality, setQuality)}
            </View>

            <View style={styles.reviewSection}>
              <Text style={styles.sectionLabel}>Review *</Text>
              <TextInput
                style={styles.reviewInput}
                placeholder="Share your experience working with this client..."
                placeholderTextColor="#A0B8D0"
                multiline
                numberOfLines={4}
                value={review}
                onChangeText={setReview}
                maxLength={1000}
              />
              <Text style={styles.charCount}>{review.length}/1000</Text>
            </View>

            <TouchableOpacity
              style={[styles.submitBtn, (!rating || isLoading) && styles.submitBtnDisabled]}
              onPress={handleSubmit}
              disabled={!rating || isLoading}
            >
              <Text style={styles.submitBtnText}>
                {isLoading ? 'Submitting...' : 'Submit Rating'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.skipBtn} onPress={handleClose}>
              <Text style={styles.skipBtnText}>Skip for now</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(7, 26, 62, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: CARD,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 30,
    maxHeight: '92%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: TEXT_MAIN,
  },
  closeBtn: {
    padding: 4,
  },
  jobInfo: {
    backgroundColor: BG,
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  jobLabel: {
    fontSize: 11,
    color: TEXT_MUTED,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  jobTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: TEXT_MAIN,
    marginTop: 2,
    marginBottom: 10,
  },
  recipientLabel: {
    fontSize: 11,
    color: TEXT_MUTED,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  recipientName: {
    fontSize: 16,
    fontWeight: '600',
    color: BLUE,
    marginTop: 2,
  },
  ratingSection: {
    alignItems: 'center',
    marginBottom: 20,
    paddingVertical: 16,
    backgroundColor: BG,
    borderRadius: 12,
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: TEXT_MAIN,
    marginBottom: 12,
  },
  ratingText: {
    fontSize: 14,
    color: TEXT_MUTED,
    marginTop: 8,
  },
  detailedSection: {
    marginBottom: 20,
  },
  categoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
  },
  categoryLabel: {
    fontSize: 14,
    color: TEXT_MUTED,
    flex: 1,
  },
  categoryValue: {
    fontSize: 12,
    color: TEXT_MUTED,
    marginLeft: 8,
    minWidth: 30,
  },
  reviewSection: {
    marginBottom: 20,
  },
  reviewInput: {
    backgroundColor: BG,
    borderRadius: 12,
    padding: 12,
    fontSize: 14,
    color: TEXT_MAIN,
    minHeight: 100,
    textAlignVertical: 'top',
    borderWidth: 1,
    borderColor: BORDER,
  },
  charCount: {
    fontSize: 11,
    color: TEXT_MUTED,
    textAlign: 'right',
    marginTop: 4,
  },
  submitBtn: {
    backgroundColor: BLUE,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 10,
  },
  submitBtnDisabled: {
    backgroundColor: '#A0B8D0',
  },
  submitBtnText: {
    color: WHITE,
    fontSize: 16,
    fontWeight: '700',
  },
  skipBtn: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  skipBtnText: {
    color: TEXT_MUTED,
    fontSize: 14,
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    fontSize: 16,
    color: TEXT_MUTED,
    marginTop: 12,
  },
  infoContainer: {
    alignItems: 'center',
    paddingVertical: 30,
  },
  infoText: {
    fontSize: 16,
    color: TEXT_MUTED,
    textAlign: 'center',
    marginTop: 12,
    marginBottom: 20,
    paddingHorizontal: 20,
  },
  closeButton: {
    backgroundColor: BLUE,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 40,
  },
  closeButtonText: {
    color: WHITE,
    fontSize: 16,
    fontWeight: '600',
  },
});

export default RatingClient;