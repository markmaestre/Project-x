import mongoose from "mongoose";

const attachmentSchema = new mongoose.Schema(
  {
    file_name: {
      type: String,
      required: true,
      trim: true,
    },
    file_url: {
      type: String,
      required: true,
    },
    public_id: {
      type: String,
      default: null,
    },
    mime_type: {
      type: String,
      default: null,
    },
    file_size: {
      type: Number,
      default: 0,
    },
    uploaded_by: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Client",
      required: true,
    },
    uploaded_by_role: {
      type: String,
      enum: ["client", "freelancer"],
      required: true,
    },
    uploaded_at: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false }
);

const projectUpdateSchema = new mongoose.Schema(
  {
    contract_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Contract",
      required: true,
    },
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
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 150,
    },
    description: {
      type: String,
      default: "",
      trim: true,
    },
    update_type: {
      type: String,
      enum: [
        "progress",
        "milestone",
        "delivery",
        "revision",
        "feedback",
        "announcement",
      ],
      default: "progress",
    },
    status: {
      type: String,
      enum: [
        "pending",
        "in_progress",
        "completed",
        "blocked",
        "cancelled",
      ],
      default: "pending",
    },
    delivery_status: {
      type: String,
      enum: [
        "not_submitted",
        "submitted",
        "approved",
        "revision_requested",
      ],
      default: "not_submitted",
    },
    progress: {
      type: Number,
      min: 0,
      max: 100,
      default: 0,
    },
    priority: {
      type: String,
      enum: ["low", "normal", "high", "urgent"],
      default: "normal",
    },
    freelancer_comment: {
      type: String,
      default: null,
      trim: true,
    },
    client_comment: {
      type: String,
      default: null,
      trim: true,
    },
    attachments: [attachmentSchema],
    due_date: {
      type: Date,
      default: null,
    },
    completed_at: {
      type: Date,
      default: null,
    },
    created_by: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Client",
      required: true,
    },
    created_by_role: {
      type: String,
      enum: ["client", "freelancer"],
      required: true,
    },
    last_updated_by: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Client",
      default: null,
    },
  },
  {
    timestamps: {
      createdAt: "created_at",
      updatedAt: "updated_at",
    },
  }
);

projectUpdateSchema.index({ contract_id: 1, created_at: -1 });
projectUpdateSchema.index({ job_id: 1, status: 1 });
projectUpdateSchema.index({ freelancer_id: 1, created_at: -1 });
projectUpdateSchema.index({ client_id: 1, created_at: -1 });
projectUpdateSchema.index({ due_date: 1 });
projectUpdateSchema.index({ update_type: 1 });
projectUpdateSchema.index({ contract_id: 1, status: 1, created_at: -1 });

const ProjectUpdate = mongoose.model("ProjectUpdate", projectUpdateSchema);
export default ProjectUpdate;