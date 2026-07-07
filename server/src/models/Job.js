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
    vacancies: {
      type: Number,
      default: 1,
    },
    timezone: {
      type: String,
      default: "Asia/Manila",
    },
    
    // ===== BUDGET =====
    budget: {
      type: {
        type: String,
        enum: ["fixed", "hourly"],
        required: true,
        default: "fixed",
      },
      min: {
        type: Number,
        required: true,
        default: 0,
      },
      max: {
        type: Number,
        default: null,
      },
      currency: {
        type: String,
        default: "PHP",
      },
      negotiable: {
        type: Boolean,
        default: false,
      },
      hide_budget: {
        type: Boolean,
        default: false,
      },
    },

    // ===== LOCATION =====
    location: {
      country: {
        type: String,
        default: "Philippines",
      },
      province: {
        type: String,
        default: "",
      },
      city: {
        type: String,
        default: "",
      },
      address: {
        type: String,
        default: "",
      },
      zip_code: {
        type: String,
        default: "",
      },
    },

    // ===== TIMELINE =====
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
      estimated_hours: {
        type: Number,
        default: null,
      },
      weekly_limit: {
        type: Number,
        default: null,
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

    // ===== REQUIREMENTS =====
    requirements: {
      education: {
        type: String,
        enum: ["none", "high_school", "vocational", "college", "masters", "doctorate"],
        default: "none",
      },
      portfolio_required: {
        type: Boolean,
        default: false,
      },
      resume_required: {
        type: Boolean,
        default: false,
      },
      cover_letter_required: {
        type: Boolean,
        default: false,
      },
      preferred_languages: {
        type: [String],
        default: [],
      },
      preferred_certifications: {
        type: [String],
        default: [],
      },
      min_years: {
        type: Number,
        default: 0,
      },
    },

    // ===== SCREENING QUESTIONS =====
    screening_questions: [
      {
        question: {
          type: String,
          required: true,
        },
        required: {
          type: Boolean,
          default: true,
        },
      },
    ],

    // ===== HIRING SETTINGS =====
    hiring: {
      max_applicants: {
        type: Number,
        default: 100,
        min: 1,
        max: 1000,
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

    // ===== APPLICATION DEADLINE =====
    application_deadline: {
      type: Date,
      default: null,
      index: true,
      validate: {
        validator: function(value) {
          if (!value) return true;
          return value > new Date();
        },
        message: "Application deadline must be in the future",
      },
    },

    // ===== JOB FEATURES =====
    featured: {
      type: Boolean,
      default: false,
    },
    urgent: {
      type: Boolean,
      default: false,
    },
    nda_required: {
      type: Boolean,
      default: false,
    },

    // ===== JOB STATUS =====
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

    // ===== ANALYTICS =====
    analytics: {
      views: { type: Number, default: 0 },
      saves: { type: Number, default: 0 },
      applications: { type: Number, default: 0 },
    },

    // ===== CONTACT PREFERENCE =====
    contact_preference: {
      type: String,
      enum: ["chat", "email", "phone"],
      default: "chat",
    },

    // ===== SOFT DELETE =====
    is_deleted: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// ===== INDEXES =====
// Text search
jobSchema.index({
  title: "text",
  description: "text",
  required_skills: "text",
  tags: "text",
});

// Location queries
jobSchema.index({
  "location.country": 1,
  "location.city": 1,
  "location.province": 1,
});

// Status and deadline queries
jobSchema.index({ status: 1, application_deadline: 1 });
jobSchema.index({ client_id: 1, status: 1 });

// ===== METHODS =====
jobSchema.methods.isApplicationDeadlinePassed = function() {
  if (!this.application_deadline) return false;
  return new Date() > this.application_deadline;
};

jobSchema.methods.isMaxApplicantsReached = function(applicantCount) {
  return applicantCount >= this.hiring.max_applicants;
};

jobSchema.methods.canApply = function(currentApplicants) {
  if (this.isApplicationDeadlinePassed()) {
    return { allowed: false, reason: "Application deadline has passed" };
  }
  if (this.isMaxApplicantsReached(currentApplicants)) {
    return { allowed: false, reason: "Maximum applicants reached" };
  }
  if (this.status !== "open") {
    return { allowed: false, reason: `Job is ${this.status}` };
  }
  return { allowed: true, reason: "You can apply" };
};

// ===== VIRTUALS =====
jobSchema.virtual("is_open").get(function() {
  return this.status === "open";
});

jobSchema.virtual("is_urgent").get(function() {
  return this.urgent === true;
});

jobSchema.virtual("is_featured").get(function() {
  return this.featured === true;
});

jobSchema.virtual("requires_nda").get(function() {
  return this.nda_required === true;
});

// ===== STATICS =====
jobSchema.statics.findOpenJobs = function() {
  return this.find({
    status: "open",
    is_deleted: false,
    $or: [
      { application_deadline: { $exists: false } },
      { application_deadline: null },
      { application_deadline: { $gt: new Date() } },
    ],
  });
};

jobSchema.statics.findExpiredJobs = function() {
  return this.find({
    status: "open",
    is_deleted: false,
    application_deadline: { $lt: new Date() },
  });
};

const Job = mongoose.model("Job", jobSchema);
export default Job;