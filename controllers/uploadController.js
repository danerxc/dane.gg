import { upload } from '../services/upload.js';
import { fileURLToPath } from 'url';
import path, { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export default class UploadController {
    static async handleFileUpload(req, res) {
        upload(req, res, (err) => {
            if (err) {
                res.status(400).json({ message: err });
            } else if (req.file == undefined) {
                res.status(400).json({ message: 'No file selected!' });
            } else {
                res.status(200).json({
                    message: 'File uploaded!',
                    filePath: `/assets/uploads/${req.file.filename}`
                });
            }
        });
    }
}