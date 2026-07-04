import mongoose from "mongoose";

const jobSchema = new mongoose.Schema(
  {
    client_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Client",
      required: true,
      index: true,
    },
    assigned_freelancer_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Freelancer",
      default: null,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 120,
    },
    description: {
      type: String,
      required: true,
    },
    category: {
      type: String,
      required: true,
      index: true,
    },
    subcategory: {
      type: String,
      default: null,
    },
    required_skills: [String],
    tags: [String],
    job_type: {
      type: String,
      enum: ["one_time", "project", "long_term", "part_time", "full_time"],
      default: "project",
    },
    work_setup: {
      type: String,
      enum: ["remote", "onsite", "hybrid"],
      default: "remote",
    },
    experience_level: {
      type: String,
      enum: ["entry", "intermediate", "expert", "senior"],
      default: "entry",
    },
    budget: {
      type: {
        type: String,
        enum: ["fixed", "hourly"],
        required: true,
      },
      min: Number,
      max: Number,
      currency: {
        type: String,
        default: "PHP",
      },
      negotiable: {
        type: Boolean,
        default: false,
      },
    },
    timeline: {
      duration_value: {
        type: Number,
        default: 1,
      },
      duration_unit: {
        type: String,
        enum: ["hours", "days", "weeks", "months"],
        default: "weeks",
      },
      start_date: {
        type: Date,
        default: null,
      },
      end_date: {
        type: Date,
        default: null,
      },
    },
    hiring: {
      max_applicants: {
        type: Number,
        default: 100,
      },
      auto_accept: {
        type: Boolean,
        default: false,
      },
      allow_multiple_hires: {
        type: Boolean,
        default: false,
      },
    },
    application_deadline: {
      type: Date,
      default: null,
      index: true,
    },
    status: {
      type: String,
      enum: [
        "draft",
        "open",
        "in_review",
        "in_progress",
        "completed",
        "cancelled",
        "paused",
      ],
      default: "draft",
      index: true,
    },
    visibility: {
      type: String,
      enum: ["public", "private", "invite_only"],
      default: "public",
    },
    analytics: {
      views: { type: Number, default: 0 },
      saves: { type: Number, default: 0 },
      applications: { type: Number, default: 0 },
    },
    is_deleted: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// Text search
jobSchema.index({
  title: "text",
  description: "text",
  required_skills: "text",
  tags: "text",
});

const Job = mongoose.model("Job", jobSchema);
export default Job;