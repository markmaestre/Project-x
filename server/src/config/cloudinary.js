import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import multer from 'multer';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Storage for profile pictures (images)
const profileStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'profile_pictures',
    allowed_formats: ['jpg', 'jpeg', 'png', 'gif', 'webp'],
    transformation: [{ width: 500, height: 500, crop: 'limit' }],
  },
});

// Storage for resumes (documents)
const resumeStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'resumes',
    resource_type: 'raw', // Important for non-image files
    allowed_formats: ['pdf', 'doc', 'docx'],
    format: async (req, file) => {
      // Preserve original file extension
      const ext = file.originalname.split('.').pop();
      return ext;
    },
    public_id: (req, file) => {
      // Generate unique filename
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      const name = file.originalname.split('.')[0].replace(/[^a-zA-Z0-9]/g, '_');
      return `resume_${name}_${uniqueSuffix}`;
    }
  },
});

// Multer instances for different upload types
const uploadProfile = multer({ 
  storage: profileStorage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only JPEG, PNG, GIF, and WEBP are allowed.'), false);
    }
  }
});

const uploadResume = multer({ 
  storage: resumeStorage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only PDF, DOC, and DOCX are allowed.'), false);
    }
  }
});

// Generic upload for backward compatibility
const upload = multer({ 
  storage: profileStorage,
  limits: { fileSize: 5 * 1024 * 1024 },
});

export { cloudinary, upload, uploadProfile, uploadResume };