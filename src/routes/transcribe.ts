import { Router, Request, Response } from 'express';
import multer from 'multer';
import { exec } from 'child_process';
import path from 'path';
import * as fs from 'fs';

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
      console.error('FFmpeg error:', err);
      res.status(500).send('Error extracting audio');
      return;
    }

    // Chunk the audio file into smaller segments
    const chunkDuration = 10; // Duration of each chunk in seconds
    exec(`ffmpeg -i ${audioPath} -f segment -segment_time ${chunkDuration} -c copy uploads/chunk%03d.mp3`, (err) => {
      if (err) {
        console.error('Error chunking audio:', err);
        res.status(500).send('Error chunking audio');
        return;
      }

      console.log('Audio chunking completed successfully.');

      const chunkFiles = fs.readdirSync('uploads/');
      const transcriptionResults: string[] = [];
      let completedChunks = 0;

      chunkFiles.forEach((chunkFile) => {
        if (!chunkFile.endsWith('.mp3')) return; // Skip non-mp3 files
        
        console.log(`Processing chunk: ${chunkFile}`);
        const chunkPath = path.join('uploads/', chunkFile);
        
        exec(`whisper ${chunkPath} --output_dir uploads/`, (err, stdout) => {
          if (err) {
            console.error('Error during transcription:', err);
          } else {
            transcriptionResults.push(stdout);
          }
          
          completedChunks++;
          
          // When all chunks are processed, send the combined transcript
          if (completedChunks === chunkFiles.filter(f => f.endsWith('.mp3')).length) {
            const combinedTranscript = transcriptionResults.join('\n');
            fs.writeFileSync(transcriptionPath, combinedTranscript);
            res.json({ transcript: combinedTranscript });
          }
        });
      });
    });
  });
});

export default router;
