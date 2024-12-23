import multer from 'multer';
import path from 'path';

const storage = multer.diskStorage({
  destination: './public/assets/uploads/',
  filename: (req, file, cb) => {
    const originalName = file.originalname
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9.-]/g, '')
      .replace(/--+/g, '-');

    const prefix = req.body.prefix || 'File';
    const timestamp = Date.now();
    const ext = path.extname(originalName);
    const sanitizedName = `${prefix}_${timestamp}-${path.basename(originalName, ext)}${ext}`;
    
    cb(null, sanitizedName);
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 5000000 },
  fileFilter: (req, file, cb) => {
    checkFileType(file, cb);
  }
}).single('file');

function checkFileType(file, cb) {
  const filetypes = /jpeg|jpg|png|gif/;
  const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = filetypes.test(file.mimetype);

  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb('Error: Images Only!');
  }
}

export { upload };