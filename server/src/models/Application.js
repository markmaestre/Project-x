import mongoose from "mongoose";

const applicationSchema = new mongoose.Schema(
  {
    job_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Job",
      required: true,
    },
    freelancer_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Freelancer",
      required: true,
    },
    cover_letter: {
      type: String,
      required: true,
    },
    proposed_rate: {
      type: Number,
      default: 0,
    },
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
    },
    offer: {
      amount: Number,
      message: String,
      sent_at: Date,
    },
    interview: {
      scheduled_date: Date,
      meeting_link: String,
      notes: String,
      sent_at: Date,
    },
    resume: {
      name: String,
      url: String,
      mime_type: String,
      size: Number,
    },
    education: {
      level: String,
      field: String,
      institution: String,
      graduation_year: String,
    },
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
    viewed_by_client: {
      type: Boolean,
      default: false,
    },
    client_notes: {
      type: String,
      default: null,
    },
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

// Indexes
applicationSchema.index({ job_id: 1, freelancer_id: 1 }, { unique: true });
applicationSchema.index({ job_id: 1, status: 1 });
applicationSchema.index({ freelancer_id: 1 });
applicationSchema.index({ status: 1 });
applicationSchema.index({ applied_at: -1 });

const Application = mongoose.model("Application", applicationSchema);
export default Application;