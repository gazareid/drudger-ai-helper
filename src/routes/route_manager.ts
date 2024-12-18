import { Router, Request, Response } from 'express';
import multer from 'multer';
import utilities from '../utilities/transcribe.js';

const router = Router();

// Configure Multer for file uploads
const upload = multer({ dest: 'uploads/' });

// Route for file upload and transcription
router.post('/', upload.single('video'), (req: Request, res: Response) => {
  if (!req.file) {
    res.status(400).send('No file uploaded');
    return;
  }
  utilities.transcribe(req, res);
  
});

export default router;
