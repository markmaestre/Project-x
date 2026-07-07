// models/Contract.js
import mongoose from "mongoose";

const contractSchema = new mongoose.Schema(
  {
    job_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Job",
      required: true,
    },
    client_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Client",
      required: true,
    },
    freelancer_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Freelancer",
      required: true,
    },
    application_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Application",
      required: true,
    },
    status: {
      type: String,
      enum: ["draft", "active", "paused", "completed", "cancelled"],
      default: "draft",
    },
    agreed_budget: {
      amount: {
        type: Number,
        required: true,
      },
      type: {
        type: String,
        enum: ["fixed", "hourly"],
        default: "fixed",
      },
      currency: {
        type: String,
        default: "PHP",
      },
    },
    start_date: {
      type: Date,
      default: null,
    },
    end_date: {
      type: Date,
      default: null,
    },
    progress: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    terms: {
      type: String,
      default: null,
    },
    // ==================== FILE UPLOADS ====================
    contract_documents: [
      {
        name: {
          type: String,
          required: true,
        },
        url: {
          type: String,
          required: true,
        },
        public_id: {
          type: String,
          required: true,
        },
        mime_type: {
          type: String,
          required: true,
        },
        size: {
          type: Number,
          required: true,
        },
        uploaded_at: {
          type: Date,
          default: Date.now,
        },
        uploaded_by: {
          type: String,
          enum: ["client", "freelancer", "admin"],
          required: true,
        },
        description: {
          type: String,
          default: null,
        },
        version: {
          type: Number,
          default: 1,
        },
      },
    ],
    signed_documents: [
      {
        name: {
          type: String,
          required: true,
        },
        url: {
          type: String,
          required: true,
        },
        public_id: {
          type: String,
          required: true,
        },
        mime_type: {
          type: String,
          required: true,
        },
        size: {
          type: Number,
          required: true,
        },
        signed_at: {
          type: Date,
          default: Date.now,
        },
        signed_by: {
          type: String,
          enum: ["client", "freelancer"],
          required: true,
        },
        signature_type: {
          type: String,
          enum: ["electronic", "digital", "wet"],
          default: "electronic",
        },
      },
    ],
    // ==================== ACTIVITY LOG (NEW) ====================
    activity_log: [
      {
        type: {
          type: String,
          enum: [
            'status_update', 
            'file_upload', 
            'comment', 
            'milestone_update', 
            'progress_update', 
            'project_update',
            'contract_created',
            'contract_activated',
            'contract_paused',
            'contract_resumed',
            'contract_completed',
            'contract_cancelled',
          ],
          required: true,
        },
        user_id: {
          type: mongoose.Schema.Types.ObjectId,
          refPath: 'user_model',
          required: true,
        },
        user_model: {
          type: String,
          enum: ['Client', 'Freelancer', 'Admin'],
          required: true,
        },
        user_name: {
          type: String,
          default: null,
        },
        message: {
          type: String,
          required: true,
        },
        data: {
          type: mongoose.Schema.Types.Mixed,
          default: null,
        },
        created_at: {
          type: Date,
          default: Date.now,
        },
      }
    ],
    // Contract metadata
    contract_metadata: {
      version: {
        type: Number,
        default: 1,
      },
      last_modified_by: {
        type: String,
        enum: ["client", "freelancer", "admin"],
      },
      last_modified_at: {
        type: Date,
        default: Date.now,
      },
      notes: {
        type: String,
        default: null,
      },
    },
    // Milestones
    milestones: [
      {
        title: {
          type: String,
          required: true,
        },
        description: {
          type: String,
          default: null,
        },
        due_date: {
          type: Date,
          required: true,
        },
        amount: {
          type: Number,
          required: true,
        },
        status: {
          type: String,
          enum: ["pending", "in_progress", "completed", "overdue"],
          default: "pending",
        },
        completed_at: {
          type: Date,
          default: null,
        },
        attachments: [
          {
            name: String,
            url: String,
            public_id: String,
            mime_type: String,
            size: Number,
            uploaded_at: Date,
          },
        ],
      },
    ],
    is_active: {
      type: Boolean,
      default: true,
    },
    // ==================== CANCELLATION/PAUSE REASONS ====================
    cancellation_reason: {
      type: String,
      default: null,
    },
    pause_reason: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// ==================== INDEXES ====================
contractSchema.index({ job_id: 1 });
contractSchema.index({ client_id: 1, status: 1 });
contractSchema.index({ freelancer_id: 1, status: 1 });
contractSchema.index({ application_id: 1 }, { unique: true });
contractSchema.index({ "contract_documents.uploaded_at": -1 });
contractSchema.index({ status: 1 });
contractSchema.index({ createdAt: -1 });
contractSchema.index({ "activity_log.created_at": -1 });

const Contract = mongoose.model("Contract", contractSchema);
export default Contract;