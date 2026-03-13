import multer from 'multer';
import path from 'path';
import crypto from 'crypto';

// Configure Multer storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // HIGH-5: ./tmp is NOT served by express.static — files are never publicly accessible
    cb(null, './tmp');
  },
  filename: (req, file, cb) => {
    // HIGH-5: Random UUID filename — unguessable even if someone knows a file was uploaded
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${crypto.randomUUID()}${ext}`);
  }
});

// Configure Multer upload
const upload = multer({
  storage,
  limits: { fileSize: 1024 * 1024 * 5 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const fileTypes = /jpeg|jpg|png|gif/;
    const extname = fileTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = fileTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb('Error: Images Only!');
    }
  }
});

export { upload };
