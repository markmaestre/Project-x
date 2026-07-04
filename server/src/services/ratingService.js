import Rating from '../models/Rating.js';
import Client from '../models/Client.js';
import Freelancer from '../models/Freelancer.js';
import NotificationService from './notificationService.js';

class RatingService {
  
  static async createRating({
    reviewer_id,
    reviewer_model,
    recipient_id,
    recipient_model,
    rating,
    review,
    job_id,
    communication,
    quality,
    professionalism,
    on_time
  }) {
    // Check if already rated
    const existing = await Rating.findOne({
      reviewer_id,
      recipient_id,
      job_id
    });
    
    if (existing) {
      throw new Error('You have already rated this user for this job');
    }
    
    const ratingData = new Rating({
      reviewer_id,
      reviewer_model,
      recipient_id,
      recipient_model,
      rating,
      review,
      job_id,
      communication,
      quality,
      professionalism,
      on_time,
      job_completed: true,
    });
    
    await ratingData.save();
    
    // Update recipient's rating
    await this.updateUserRating(recipient_id, recipient_model);
    
    // Get reviewer details
    const reviewer = reviewer_model === 'Client' 
      ? await Client.findById(reviewer_id) 
      : await Freelancer.findById(reviewer_id);
    
    // Notify recipient
    await NotificationService.createNotification({
      recipient_id,
      recipient_model,
      sender_id: reviewer_id,
      sender_model: reviewer_model,
      type: 'rating_received',
      title: 'You Received a Rating',
      message: `${reviewer.first_name} ${reviewer.last_name} rated you ${rating} stars`,
      reference_id: ratingData._id,
      reference_model: 'Rating',
      priority: 'medium',
      actions: [
        {
          label: 'View Rating',
          action_type: 'view_rating',
          data: { rating_id: ratingData._id },
        },
      ],
    });
    
    return ratingData;
  }
  
  static async updateUserRating(userId, model) {
    const ratingStats = await Rating.getAverageRating(userId, model);
    
    if (model === 'Client') {
      await Client.findByIdAndUpdate(userId, {
        'rating.average': ratingStats.averageRating,
        'rating.count': ratingStats.totalRatings,
      });
    } else if (model === 'Freelancer') {
      await Freelancer.findByIdAndUpdate(userId, {
        'rating.average': ratingStats.averageRating,
        'rating.count': ratingStats.totalRatings,
      });
    }
  }
  
  static async respondToRating({
    rating_id,
    recipient_id,
    response_text
  }) {
    const rating = await Rating.findById(rating_id);
    if (!rating) {
      throw new Error('Rating not found');
    }
    
    if (rating.recipient_id.toString() !== recipient_id.toString()) {
      throw new Error('Unauthorized');
    }
    
    rating.response = {
      text: response_text,
      responded_at: new Date(),
    };
    
    await rating.save();
    return rating;
  }
  
  static async getUserRatings(userId, model, limit = 10, skip = 0) {
    return await Rating.getUserRatings(userId, model, limit, skip);
  }
  
  static async getRatingStats(userId, model) {
    return await Rating.getAverageRating(userId, model);
  }
}

export default RatingService;