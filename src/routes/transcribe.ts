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

      // Call Whisper for transcription on each chunk
      // You can implement a loop here to process each chunk
      // For example, you can use fs.readdir to read the chunk files and process them one by one
      const chunkFiles = fs.readdirSync('uploads/');
      const transcriptionResults: string[] = []; // Array to hold transcription results

      chunkFiles.forEach((chunkFile) => {
        console.log(`Processing chunk: ${chunkFile}`);
        const chunkPath = path.join('uploads/', chunkFile);
        exec(`whisper ${chunkPath} --output_dir uploads/`, (err, stdout) => {
          if (err) {
            console.error('Error during transcription:', err);
          } else {
            transcriptionResults.push(stdout); // Collect the transcription result
          }
        });
        console.log(`Transcription completed for chunk: ${chunkFile}`);
      });

      // Combine all transcriptions into one file
      const combinedTranscriptionPath = `${videoPath}.txt`;
      fs.writeFileSync(combinedTranscriptionPath, transcriptionResults.join('\n')); // Write combined results to a single file

      res.send('Audio chunking and transcription completed.'); // Send response to client
    });
  });
});

export default router;
