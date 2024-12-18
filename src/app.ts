import express from 'express';
import path from 'path';
import transcribeRoute from './routes/transcribe.js';

const __dirname = new URL('.', import.meta.url).pathname;

const app = express();
const PORT = 3000;

// Serve static files
app.use(express.static(path.join(__dirname, '../public')));

// File upload and transcription route
app.use('/transcribe', transcribeRoute);

// Start server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
