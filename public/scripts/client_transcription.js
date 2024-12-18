class TranscriptionManager {
    constructor() {
        this.startBtn = document.getElementById('startBtn');
        this.copyBtn = document.getElementById('copyBtn');
        this.transcriptDiv = document.getElementById('transcript_result');
        
        this.initializeSpeechRecognition();
        this.setupEventListeners();
    }

    initializeSpeechRecognition() {
        if ('webkitSpeechRecognition' in window) {
            this.recognition = new webkitSpeechRecognition();
            this.recognition.continuous = true;
            this.recognition.interimResults = true;
            
            this.recognition.onstart = this.handleRecognitionStart.bind(this);
            this.recognition.onend = this.handleRecognitionEnd.bind(this);
            this.recognition.onresult = this.handleRecognitionResult.bind(this);
            this.recognition.onerror = this.handleRecognitionError.bind(this);
        } else {
            this.handleUnsupportedBrowser();
        }
    }

    setupEventListeners() {
        this.startBtn.addEventListener('click', this.toggleRecording.bind(this));
        this.copyBtn.addEventListener('click', this.copyToClipboard.bind(this));
    }

    handleRecognitionStart() {
        this.startBtn.classList.add('recording');
        this.startBtn.textContent = 'Stop Listening';
    }

    handleRecognitionEnd() {
        this.startBtn.classList.remove('recording');
        this.startBtn.textContent = 'Start Listening';
    }

    handleRecognitionResult(event) {
        let interimTranscript = '';
        let finalTranscript = '';
        
        for (let i = event.resultIndex; i < event.results.length; i++) {
            const transcript = event.results[i][0].transcript;
            if (event.results[i].isFinal) {
                finalTranscript += transcript + ' ';
            } else {
                interimTranscript += transcript;
            }
        }
        
        this.updateTranscriptDisplay(finalTranscript, interimTranscript);
    }

    updateTranscriptDisplay(finalTranscript, interimTranscript) {
        if (finalTranscript) {
            const p = document.createElement('p');
            p.textContent = finalTranscript;
            this.transcriptDiv.appendChild(p);
        }

        // Remove previous interim results
        const children = Array.from(this.transcriptDiv.children);
        children.forEach(child => {
            if (child.classList.contains('interim')) {
                this.transcriptDiv.removeChild(child);
            }
        });

        // Add new interim result
        if (interimTranscript) {
            const interimP = document.createElement('p');
            interimP.classList.add('interim');
            interimP.textContent = interimTranscript;
            this.transcriptDiv.appendChild(interimP);
        }
    }

    handleRecognitionError(event) {
        console.error('Speech recognition error:', event.error);
        this.handleRecognitionEnd();
    }

    handleUnsupportedBrowser() {
        this.startBtn.textContent = 'Browser not supported';
        this.startBtn.disabled = true;
    }

    toggleRecording() {
        if (this.startBtn.classList.contains('recording')) {
            this.recognition.stop();
        } else {
            this.transcriptDiv.textContent = '';
            this.recognition.start();
        }
    }

    async copyToClipboard() {
        try {
            await navigator.clipboard.writeText(this.transcriptDiv.textContent || '');
            const originalText = this.copyBtn.textContent;
            this.copyBtn.textContent = 'Copied!';
            setTimeout(() => {
                this.copyBtn.textContent = originalText;
            }, 2000);
        } catch (err) {
            console.error('Failed to copy text:', err);
        }
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new TranscriptionManager();
});