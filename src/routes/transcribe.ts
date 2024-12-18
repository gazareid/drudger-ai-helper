import { Router, Request, Response } from 'express';
import multer from 'multer';
import { exec } from 'child_process';
import path from 'path';

const router = Router();

// Configure Multer for file uploads
const upload = multer({ dest: 'uploads/' });

// Route for file upload and transcription
router.post('/', upload.single('video'), (req: Request, res: Response) => {
  if (!req.file) {
    res.status(400).send('No file uploaded');
    return;
  }

  const videoPath = req.file.path;
  const audioPath = `${videoPath}.mp3`;
  const transcriptionPath = `${videoPath}.txt`;

  // Extract audio using FFmpeg
  exec(`ffmpeg -i ${videoPath} -q:a 0 -map a ${audioPath}`, (err) => {
    if (err) {
        console.error(err);
      res.status(500).send('Error extracting audio');
      return;
    }

    // Call Whisper for transcription
    exec(`whisper ${audioPath} --output_dir uploads/`, (err) => {
      if (err) {
        console.error(err);
        res.status(500).send('Error during transcription');
        return;
      }

      res.sendFile(path.join(__dirname, '../../uploads/', `${req.file?.filename}.txt`));
    });
  });
});

export default router;
