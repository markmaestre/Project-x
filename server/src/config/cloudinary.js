// // config/cloudinary.js
// import { v2 as cloudinary } from 'cloudinary';
// import { CloudinaryStorage } from 'multer-storage-cloudinary';
// import multer from 'multer';

// cloudinary.config({
//   cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
//   api_key: process.env.CLOUDINARY_API_KEY,
//   api_secret: process.env.CLOUDINARY_API_SECRET,
// });

// // Storage for profile pictures (images)
// const profileStorage = new CloudinaryStorage({
//   cloudinary: cloudinary,
//   params: {
//     folder: 'profile_pictures',
//     allowed_formats: ['jpg', 'jpeg', 'png', 'gif', 'webp'],
//     transformation: [{ width: 500, height: 500, crop: 'limit' }],
//   },
// });

// // Storage for resumes (documents)
// const resumeStorage = new CloudinaryStorage({
//   cloudinary: cloudinary,
//   params: {
//     folder: 'resumes',
//     resource_type: 'raw',
//     allowed_formats: ['pdf', 'doc', 'docx'],
//     format: async (req, file) => {
//       const ext = file.originalname.split('.').pop();
//       return ext;
//     },
//     public_id: (req, file) => {
//       const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
//       const name = file.originalname.split('.')[0].replace(/[^a-zA-Z0-9]/g, '_');
//       return `resume_${name}_${uniqueSuffix}`;
//     }
//   },
// });

// // ==================== CONTRACT DOCUMENT STORAGE ====================
// const contractDocumentStorage = new CloudinaryStorage({
//   cloudinary: cloudinary,
//   params: {
//     folder: 'contract_documents',
//     resource_type: 'raw',
//     allowed_formats: ['pdf', 'doc', 'docx', 'txt', 'xls', 'xlsx', 'ppt', 'pptx', 'zip', 'rar', 'jpg', 'jpeg', 'png', 'gif'],
//     format: async (req, file) => {
//       const ext = file.originalname.split('.').pop();
//       return ext;
//     },
//     public_id: (req, file) => {
//       const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
//       const name = file.originalname.split('.')[0].replace(/[^a-zA-Z0-9]/g, '_');
//       const contractId = req.params.contractId || 'unknown';
//       return `contract_${contractId}_${name}_${uniqueSuffix}`;
//     }
//   },
// });

// // ==================== SIGNED DOCUMENT STORAGE ====================
// const signedDocumentStorage = new CloudinaryStorage({
//   cloudinary: cloudinary,
//   params: {
//     folder: 'signed_contracts',
//     resource_type: 'raw',
//     allowed_formats: ['pdf', 'doc', 'docx', 'jpg', 'jpeg', 'png'],
//     format: async (req, file) => {
//       const ext = file.originalname.split('.').pop();
//       return ext;
//     },
//     public_id: (req, file) => {
//       const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
//       const name = file.originalname.split('.')[0].replace(/[^a-zA-Z0-9]/g, '_');
//       const contractId = req.params.contractId || 'unknown';
//       return `signed_${contractId}_${name}_${uniqueSuffix}`;
//     }
//   },
// });

// // Multer instances
// const uploadProfile = multer({ 
//   storage: profileStorage,
//   limits: { fileSize: 5 * 1024 * 1024 },
//   fileFilter: (req, file, cb) => {
//     const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
//     if (allowedTypes.includes(file.mimetype)) {
//       cb(null, true);
//     } else {
//       cb(new Error('Invalid file type. Only JPEG, PNG, GIF, and WEBP are allowed.'), false);
//     }
//   }
// });

// const uploadResume = multer({ 
//   storage: resumeStorage,
//   limits: { fileSize: 5 * 1024 * 1024 },
//   fileFilter: (req, file, cb) => {
//     const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
//     if (allowedTypes.includes(file.mimetype)) {
//       cb(null, true);
//     } else {
//       cb(new Error('Invalid file type. Only PDF, DOC, and DOCX are allowed.'), false);
//     }
//   }
// });

// // ==================== CONTRACT FILE UPLOAD ====================
// const uploadContractDocument = multer({ 
//   storage: contractDocumentStorage,
//   limits: { fileSize: 20 * 1024 * 1024 }, // 20MB limit for contract documents
//   fileFilter: (req, file, cb) => {
//     const allowedTypes = [
//       'application/pdf',
//       'application/msword',
//       'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
//       'application/vnd.ms-excel',
//       'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
//       'application/vnd.ms-powerpoint',
//       'application/vnd.openxmlformats-officedocument.presentationml.presentation',
//       'text/plain',
//       'application/zip',
//       'application/x-rar-compressed',
//       'image/jpeg',
//       'image/jpg',
//       'image/png',
//       'image/gif'
//     ];
//     if (allowedTypes.includes(file.mimetype)) {
//       cb(null, true);
//     } else {
//       cb(new Error('Invalid file type. Allowed: PDF, DOC, DOCX, XLS, XLSX, PPT, PPTX, TXT, ZIP, RAR, JPG, PNG, GIF'), false);
//     }
//   }
// });

// const uploadSignedDocument = multer({ 
//   storage: signedDocumentStorage,
//   limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit for signed documents
//   fileFilter: (req, file, cb) => {
//     const allowedTypes = [
//       'application/pdf',
//       'application/msword',
//       'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
//       'image/jpeg',
//       'image/jpg',
//       'image/png'
//     ];
//     if (allowedTypes.includes(file.mimetype)) {
//       cb(null, true);
//     } else {
//       cb(new Error('Invalid file type. Allowed: PDF, DOC, DOCX, JPG, PNG'), false);
//     }
//   }
// });

// // Generic upload for backward compatibility
// const upload = multer({ 
//   storage: profileStorage,
//   limits: { fileSize: 5 * 1024 * 1024 },
// });

// export { 
//   cloudinary, 
//   upload, 
//   uploadProfile, 
//   uploadResume,
//   uploadContractDocument,
//   uploadSignedDocument
// };

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
    resource_type: 'raw',
    allowed_formats: ['pdf', 'doc', 'docx'],
    format: async (req, file) => {
      const ext = file.originalname.split('.').pop();
      return ext;
    },
    public_id: (req, file) => {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      const name = file.originalname.split('.')[0].replace(/[^a-zA-Z0-9]/g, '_');
      return `resume_${name}_${uniqueSuffix}`;
    }
  },
});

// Contract Document Storage
const contractDocumentStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'contract_documents',
    resource_type: 'raw',
    allowed_formats: ['pdf', 'doc', 'docx', 'txt', 'xls', 'xlsx', 'ppt', 'pptx', 'zip', 'rar', 'jpg', 'jpeg', 'png', 'gif'],
    format: async (req, file) => {
      const ext = file.originalname.split('.').pop();
      return ext;
    },
    public_id: (req, file) => {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      const name = file.originalname.split('.')[0].replace(/[^a-zA-Z0-9]/g, '_');
      const contractId = req.params.contractId || 'unknown';
      return `contract_${contractId}_${name}_${uniqueSuffix}`;
    }
  },
});

// Signed Document Storage
const signedDocumentStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'signed_contracts',
    resource_type: 'raw',
    allowed_formats: ['pdf', 'doc', 'docx', 'jpg', 'jpeg', 'png'],
    format: async (req, file) => {
      const ext = file.originalname.split('.').pop();
      return ext;
    },
    public_id: (req, file) => {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      const name = file.originalname.split('.')[0].replace(/[^a-zA-Z0-9]/g, '_');
      const contractId = req.params.contractId || 'unknown';
      return `signed_${contractId}_${name}_${uniqueSuffix}`;
    }
  },
});

// ==================== PROJECT UPDATE STORAGE (NEW) ====================
const projectUpdateStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'project_updates',
    resource_type: 'auto', // Automatically detects file type
    allowed_formats: [
      'pdf', 'doc', 'docx', 'txt', 
      'jpg', 'jpeg', 'png', 'gif', 'webp',
      'zip', 'rar', '7z',
      'xls', 'xlsx', 
      'ppt', 'pptx',
      'mp4', 'mov', 'avi', 'mkv'
    ],
    public_id: (req, file) => {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      const name = file.originalname.split('.')[0].replace(/[^a-zA-Z0-9]/g, '_');
      const updateId = req.params.id || 'unknown';
      return `update_${updateId}_${name}_${uniqueSuffix}`;
    }
  },
});

// ==================== MULTER INSTANCES ====================

// Upload profile (images only)
const uploadProfile = multer({ 
  storage: profileStorage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only JPEG, PNG, GIF, and WEBP are allowed.'), false);
    }
  }
});

// Upload resume (documents only)
const uploadResume = multer({ 
  storage: resumeStorage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only PDF, DOC, and DOCX are allowed.'), false);
    }
  }
});

// Upload contract documents (all types)
const uploadContractDocument = multer({ 
  storage: contractDocumentStorage,
  limits: { fileSize: 20 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-powerpoint',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'text/plain',
      'application/zip',
      'application/x-rar-compressed',
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/gif'
    ];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Allowed: PDF, DOC, DOCX, XLS, XLSX, PPT, PPTX, TXT, ZIP, RAR, JPG, PNG, GIF'), false);
    }
  }
});

// Upload signed documents
const uploadSignedDocument = multer({ 
  storage: signedDocumentStorage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'image/jpeg',
      'image/jpg',
      'image/png'
    ];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Allowed: PDF, DOC, DOCX, JPG, PNG'), false);
    }
  }
});

// ==================== PROJECT UPDATE UPLOAD (NEW) ====================
const uploadProjectUpdate = multer({ 
  storage: projectUpdateStorage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB limit for project updates
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      // Documents
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-powerpoint',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      
      // Archives
      'application/zip',
      'application/x-rar-compressed',
      'application/x-7z-compressed',
      
      // Images
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/gif',
      'image/webp',
      
      // Videos (optional - for project demos)
      'video/mp4',
      'video/quicktime',
      'video/x-msvideo',
      'video/x-matroska'
    ];
    
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`File type ${file.mimetype} not supported. Allowed: PDF, DOC, DOCX, TXT, XLS, XLSX, PPT, PPTX, ZIP, RAR, 7Z, JPG, PNG, GIF, WEBP, MP4, MOV, AVI, MKV`), false);
    }
  }
});

// Generic upload (legacy - keep for backward compatibility but with proper storage)
const upload = multer({ 
  storage: projectUpdateStorage, // Changed from profileStorage to support all files
  limits: { fileSize: 20 * 1024 * 1024 },
});

export { 
  cloudinary, 
  upload, 
  uploadProfile, 
  uploadResume,
  uploadContractDocument,
  uploadSignedDocument,
  uploadProjectUpdate // NEW export
};