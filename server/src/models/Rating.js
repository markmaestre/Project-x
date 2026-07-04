import mongoose from 'mongoose';

const ratingSchema = new mongoose.Schema({
  reviewer_id: {
    type: mongoose.Schema.Types.ObjectId,
    refPath: 'reviewer_model',
    required: true,
  },
  reviewer_model: {
    type: String,
    required: true,
    enum: ['Client', 'Freelancer'],
  },
  recipient_id: {
    type: mongoose.Schema.Types.ObjectId,
    refPath: 'recipient_model',
    required: true,
  },
  recipient_model: {
    type: String,
    required: true,
    enum: ['Client', 'Freelancer'],
  },
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5,
  },
  review: {
    type: String,
    trim: true,
    maxlength: 1000,
  },
  job_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Job',
    required: true,
  },
  communication: {
    type: Number,
    min: 1,
    max: 5,
  },
  quality: {
    type: Number,
    min: 1,
    max: 5,
  },
  professionalism: {
    type: Number,
    min: 1,
    max: 5,
  },
  on_time: {
    type: Number,
    min: 1,
    max: 5,
  },
  is_public: {
    type: Boolean,
    default: true,
  },
  is_verified: {
    type: Boolean,
    default: false,
  },
  response: {
    text: {
      type: String,
      trim: true,
      maxlength: 500,
    },
    responded_at: {
      type: Date,
    },
  },
  job_completed: {
    type: Boolean,
    default: true,
  },
}, {
  timestamps: {
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  },
});

ratingSchema.index({ reviewer_id: 1, recipient_id: 1, job_id: 1 }, { unique: true });

ratingSchema.statics.getAverageRating = async function(userId, model) {
  const result = await this.aggregate([
    {
      $match: {
        recipient_id: userId,
        recipient_model: model,
      },
    },
    {
      $group: {
        _id: null,
        averageRating: { $avg: '$rating' },
        totalRatings: { $sum: 1 },
        count5Star: {
          $sum: { $cond: [{ $eq: ['$rating', 5] }, 1, 0] },
        },
        count4Star: {
          $sum: { $cond: [{ $eq: ['$rating', 4] }, 1, 0] },
        },
        count3Star: {
          $sum: { $cond: [{ $eq: ['$rating', 3] }, 1, 0] },
        },
        count2Star: {
          $sum: { $cond: [{ $eq: ['$rating', 2] }, 1, 0] },
        },
        count1Star: {
          $sum: { $cond: [{ $eq: ['$rating', 1] }, 1, 0] },
        },
      },
    },
  ]);

  if (result.length === 0) {
    return {
      averageRating: 0,
      totalRatings: 0,
      count1Star: 0,
      count2Star: 0,
      count3Star: 0,
      count4Star: 0,
      count5Star: 0,
    };
  }

  return {
    averageRating: Math.round(result[0].averageRating * 10) / 10,
    totalRatings: result[0].totalRatings,
    count1Star: result[0].count1Star || 0,
    count2Star: result[0].count2Star || 0,
    count3Star: result[0].count3Star || 0,
    count4Star: result[0].count4Star || 0,
    count5Star: result[0].count5Star || 0,
  };
};

ratingSchema.statics.getUserRatings = async function(userId, model, limit = 10, skip = 0) {
  return this.find({
    recipient_id: userId,
    recipient_model: model,
    is_public: true,
  })
  .sort({ created_at: -1 })
  .skip(skip)
  .limit(limit)
  .populate('reviewer_id', 'first_name last_name profile_picture username email_address')
  .populate('job_id', 'title');
};

const Rating = mongoose.model('Rating', ratingSchema);
export default Rating;