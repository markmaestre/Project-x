// components/RatingStars.js
import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const RatingStars = ({ rating, size = 24, onPress, editable = false, color = '#C89520' }) => {
  const renderStar = (index) => {
    const starValue = index + 1;
    const isFilled = starValue <= rating;

    return (
      <TouchableOpacity
        key={index}
        onPress={() => editable && onPress(starValue)}
        activeOpacity={editable ? 0.7 : 1}
        disabled={!editable}
      >
        <Ionicons
          name={isFilled ? 'star' : 'star-outline'}
          size={size}
          color={isFilled ? color : '#C8D8E8'}
          style={styles.star}
        />
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {[0, 1, 2, 3, 4].map(renderStar)}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  star: {
    marginHorizontal: 2,
  },
});

export default RatingStars;