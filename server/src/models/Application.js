// src/models/Application.js
import mongoose from "mongoose";

const applicationSchema = new mongoose.Schema(
  {
    // =====================
    // RELATIONS
    // =====================
    job_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Job",
      required: true,
      // REMOVED: index: true - We'll define indexes below
    },

    freelancer_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Freelancer",
      required: true,
      // REMOVED: index: true - We'll define indexes below
    },

    // =====================
    // APPLICATION INFO
    // =====================
    cover_letter: {
      type: String,
      required: true,
    },

    proposed_rate: {
      type: Number,
      default: 0,
    },

    // =====================
    // STATUS FLOW (REAL SYSTEM)
    // =====================
    status: {
      type: String,
      enum: [
        "pending",
        "reviewed",
        "shortlisted",
        "interview",
        "offered",
        "hired",
        "rejected",
        "completed",
        "withdrawn",
      ],
      default: "pending",
      // REMOVED: index: true - We'll define indexes below
    },

    // =====================
    // OFFER SYSTEM
    // =====================
    offer: {
      amount: Number,
      message: String,
      sent_at: Date,
    },

    // =====================
    // INTERVIEW
    // =====================
    interview: {
      scheduled_date: Date,
      meeting_link: String,
      notes: String,
      sent_at: Date,
    },

    // =====================
    // RESUME
    // =====================
    resume: {
      name: String,
      url: String,
      mime_type: String,
      size: Number,
    },

    // =====================
    // EDUCATION
    // =====================
    education: {
      level: String,
      field: String,
      institution: String,
      graduation_year: String,
    },

    // =====================
    // EXPERIENCE
    // =====================
    experiences: [
      {
        job_title: String,
        company: String,
        start_date: Date,
        end_date: Date,
        currently_working: Boolean,
        description: String,
      },
    ],

    // =====================
    // TRACKING
    // =====================
    viewed_by_client: {
      type: Boolean,
      default: false,
    },

    client_notes: {
      type: String,
      default: null,
    },

    // =====================
    // WITHDRAW
    // =====================
    withdrawn_at: Date,
    withdraw_reason: String,
  },
  {
    timestamps: {
      createdAt: "applied_at",
      updatedAt: "updated_at",
    },
  }
);

// =====================
// IMPORTANT INDEXES - All indexes defined here
// =====================
// Unique compound index for preventing duplicate applications
applicationSchema.index({ job_id: 1, freelancer_id: 1 }, { unique: true });

// For querying applications by job with status
applicationSchema.index({ job_id: 1, status: 1 });

// For querying applications by freelancer
applicationSchema.index({ freelancer_id: 1 });

// For querying by status
applicationSchema.index({ status: 1 });

// For sorting by applied_at
applicationSchema.index({ applied_at: -1 });

const Application = mongoose.model("Application", applicationSchema);

export default Application;