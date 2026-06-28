// src/models/SavedJob.js
import mongoose from "mongoose";

const savedJobSchema = new mongoose.Schema(
  {
    job_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Job",
      required: true,
      // REMOVED: index: true
    },

    freelancer_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Freelancer",
      required: true,
      // REMOVED: index: true
    },

    saved_at: {
      type: Date,
      default: Date.now,
    },

    notes: {
      type: String,
      trim: true,
      default: null,
      maxlength: 300,
    },
  },
  {
    timestamps: {
      createdAt: "created_at",
      updatedAt: "updated_at",
    },
  }
);

// =====================
// INDEXES - All defined here
// =====================
// Prevent duplicate saves - unique compound index
savedJobSchema.index(
  {
    job_id: 1,
    freelancer_id: 1,
  },
  {
    unique: true,
  }
);

// Faster queries for freelancer's saved jobs
savedJobSchema.index({
  freelancer_id: 1,
  created_at: -1,
});

// For checking if a job is saved
savedJobSchema.index({
  job_id: 1,
});

// For querying by freelancer and job
savedJobSchema.index({
  freelancer_id: 1,
  job_id: 1,
});

const SavedJob = mongoose.model("SavedJob", savedJobSchema);

export default SavedJob;