import React, { useState, useEffect, useRef } from 'react';

interface SongNote {
  time: number; // in beats from start
  dur: number;  // in beats
  note: string; // note name like 'G4', or '' for rest
  type?: 'lead' | 'bass' | 'chord';
}

const NOTE_FREQS: Record<string, number> = {
  // Bass notes
  'D2': 73.42, 'Eb2': 77.78, 'E2': 82.41, 'F2': 87.31, 'F#2': 92.50, 'G2': 98.00,
  'A2': 110.00, 'Bb2': 116.54, 'B2': 123.47, 'C3': 130.81, 'C#3': 138.59, 'D3': 146.83,
  'Eb3': 155.56, 'E3': 164.81, 'F3': 174.61, 'F#3': 185.00, 'G3': 196.00,
  // Melody notes
  'A3': 220.00, 'Bb3': 233.08, 'B3': 246.94, 'C4': 261.63, 'C#4': 277.18, 'D4': 293.66, 'Eb4': 311.13, 'E4': 329.63, 'F4': 349.23, 'F#4': 369.99, 'G4': 392.00, 'Ab4': 415.30, 'A4': 440.00, 'Bb4': 466.16, 'B4': 493.88, 'C5': 523.25, 'C#5': 554.37, 'D5': 587.33, 'Eb5': 622.25, 'E5': 659.25, 'F5': 698.46, 'F#5': 739.99, 'G5': 783.99, 'Ab5': 830.61, 'A5': 880.00, 'Bb5': 932.33, 'B5': 987.77, 'C6': 1046.50
};

// Arrangement of "Racing Club" by Vicente Greco (interpreted by Alfredo Gobbi, G minor / D minor)
const GOBBI_RACING_SCORE: SongNote[] = [
  // Measure 1-2: Dramatic syncopated theme
  { time: 0.0, dur: 0.5, note: 'D4', type: 'lead' },
  { time: 0.5, dur: 0.5, note: 'E4', type: 'lead' },
  { time: 1.0, dur: 1.0, note: 'F4', type: 'lead' },
  { time: 2.0, dur: 1.0, note: 'A4', type: 'lead' },
  { time: 3.0, dur: 1.0, note: 'D5', type: 'lead' },
  { time: 4.0, dur: 1.5, note: 'F5', type: 'lead' },
  { time: 5.5, dur: 0.5, note: 'E5', type: 'lead' },
  { time: 6.0, dur: 1.0, note: 'D5', type: 'lead' },
  { time: 7.0, dur: 1.0, note: 'C#5', type: 'lead' },

  // Measure 3-4: Melodic resolution of first phrase
  { time: 8.0, dur: 2.0, note: 'D5', type: 'lead' },
  { time: 10.0, dur: 1.0, note: 'A4', type: 'lead' },
  { time: 11.0, dur: 1.0, note: 'F4', type: 'lead' },
  { time: 12.0, dur: 2.0, note: 'D4', type: 'lead' },
  { time: 14.0, dur: 1.0, note: 'C#4', type: 'lead' },
  { time: 15.0, dur: 1.0, note: 'D4', type: 'lead' },

  // Measure 5-6: Developing phrase with higher intensity
  { time: 16.0, dur: 2.0, note: 'E4', type: 'lead' },
  { time: 18.0, dur: 1.0, note: 'G4', type: 'lead' },
  { time: 19.0, dur: 1.0, note: 'Bb4', type: 'lead' },
  { time: 20.0, dur: 1.5, note: 'C#5', type: 'lead' },
  { time: 21.5, dur: 0.5, note: 'D5', type: 'lead' },
  { time: 22.0, dur: 1.0, note: 'E5', type: 'lead' },
  { time: 23.0, dur: 1.0, note: 'G5', type: 'lead' },

  // Measure 7-8: Big dramatic Gobbi-style resolution
  { time: 24.0, dur: 2.0, note: 'F5', type: 'lead' },
  { time: 26.0, dur: 1.0, note: 'E5', type: 'lead' },
  { time: 27.0, dur: 1.0, note: 'C#5', type: 'lead' },
  { time: 28.0, dur: 4.0, note: 'D5', type: 'lead' },

  // Measure 9-10: Part B (A sweet romantic countermelody in F major)
  { time: 32.0, dur: 1.0, note: 'F4', type: 'lead' },
  { time: 33.0, dur: 1.0, note: 'G4', type: 'lead' },
  { time: 34.0, dur: 2.0, note: 'A4', type: 'lead' },
  { time: 36.0, dur: 1.0, note: 'C5', type: 'lead' },
  { time: 37.0, dur: 1.0, note: 'Bb4', type: 'lead' },
  { time: 38.0, dur: 2.0, note: 'A4', type: 'lead' },

  // Measure 11-12: Continuing Part B
  { time: 40.0, dur: 1.0, note: 'G4', type: 'lead' },
  { time: 41.0, dur: 1.0, note: 'A4', type: 'lead' },
  { time: 42.0, dur: 2.0, note: 'Bb4', type: 'lead' },
  { time: 44.0, dur: 1.0, note: 'D5', type: 'lead' },
  { time: 45.0, dur: 1.0, note: 'C5', type: 'lead' },
  { time: 46.0, dur: 2.0, note: 'Bb4', type: 'lead' },

  // Measure 13-14: Dramatic transition back to D minor
  { time: 48.0, dur: 1.0, note: 'A4', type: 'lead' },
  { time: 49.0, dur: 1.0, note: 'Bb4', type: 'lead' },
  { time: 50.0, dur: 2.0, note: 'C5', type: 'lead' },
  { time: 52.0, dur: 1.0, note: 'F5', type: 'lead' },
  { time: 53.0, dur: 1.0, note: 'E5', type: 'lead' },
  { time: 54.0, dur: 1.0, note: 'D5', type: 'lead' },
  { time: 55.0, dur: 1.0, note: 'C#5', type: 'lead' },

  // Measure 15-16: Theme conclusion & classic Chán-Chán finish!
  { time: 56.0, dur: 3.0, note: 'D5', type: 'lead' },
  { time: 60.0, dur: 0.5, note: 'A4', type: 'lead' },
  { time: 61.0, dur: 0.5, note: 'D4', type: 'lead' },

  // --- BASS ACCOMPANIMENT ---
  // Marcato 4/4 beats and syncopated dramatic basslines
  // Measure 1 Bass
  { time: 0.0, dur: 0.4, note: 'D2', type: 'bass' },
  { time: 1.0, dur: 0.4, note: 'D3', type: 'bass' },
  { time: 2.0, dur: 0.4, note: 'D2', type: 'bass' },
  { time: 3.0, dur: 0.4, note: 'D3', type: 'bass' },
  // Measure 2 Bass
  { time: 4.0, dur: 0.4, note: 'D2', type: 'bass' },
  { time: 5.0, dur: 0.4, note: 'D3', type: 'bass' },
  { time: 6.0, dur: 0.4, note: 'A2', type: 'bass' },
  { time: 7.0, dur: 0.4, note: 'A3', type: 'bass' },
  // Measure 3 Bass
  { time: 8.0, dur: 0.4, note: 'D2', type: 'bass' },
  { time: 9.0, dur: 0.4, note: 'D3', type: 'bass' },
  { time: 10.0, dur: 0.4, note: 'D2', type: 'bass' },
  { time: 11.0, dur: 0.4, note: 'D3', type: 'bass' },
  // Measure 4 Bass
  { time: 12.0, dur: 0.4, note: 'D2', type: 'bass' },
  { time: 13.0, dur: 0.4, note: 'D3', type: 'bass' },
  { time: 14.0, dur: 0.4, note: 'A2', type: 'bass' },
  { time: 15.0, dur: 0.4, note: 'A3', type: 'bass' },
  // Measure 5 Bass
  { time: 16.0, dur: 0.4, note: 'A2', type: 'bass' },
  { time: 17.0, dur: 0.4, note: 'A3', type: 'bass' },
  { time: 18.0, dur: 0.4, note: 'A2', type: 'bass' },
  { time: 19.0, dur: 0.4, note: 'A3', type: 'bass' },
  // Measure 6 Bass
  { time: 20.0, dur: 0.4, note: 'A2', type: 'bass' },
  { time: 21.0, dur: 0.4, note: 'A3', type: 'bass' },
  { time: 22.0, dur: 0.4, note: 'D2', type: 'bass' },
  { time: 23.0, dur: 0.4, note: 'D3', type: 'bass' },
  // Measure 7 Bass
  { time: 24.0, dur: 0.4, note: 'D2', type: 'bass' },
  { time: 25.0, dur: 0.4, note: 'D3', type: 'bass' },
  { time: 26.0, dur: 0.4, note: 'A2', type: 'bass' },
  { time: 27.0, dur: 0.4, note: 'A3', type: 'bass' },
  // Measure 8 Bass
  { time: 28.0, dur: 0.4, note: 'D2', type: 'bass' },
  { time: 29.0, dur: 0.4, note: 'D3', type: 'bass' },
  { time: 30.0, dur: 0.4, note: 'D2', type: 'bass' },
  { time: 31.0, dur: 0.4, note: 'D3', type: 'bass' },
  // Measure 9 Bass
  { time: 32.0, dur: 0.4, note: 'F2', type: 'bass' },
  { time: 33.0, dur: 0.4, note: 'F3', type: 'bass' },
  { time: 34.0, dur: 0.4, note: 'F2', type: 'bass' },
  { time: 35.0, dur: 0.4, note: 'F3', type: 'bass' },
  // Measure 10 Bass
  { time: 36.0, dur: 0.4, note: 'C3', type: 'bass' },
  { time: 37.0, dur: 0.4, note: 'G3', type: 'bass' },
  { time: 38.0, dur: 0.4, note: 'C3', type: 'bass' },
  { time: 39.0, dur: 0.4, note: 'G3', type: 'bass' },
  // Measure 11 Bass
  { time: 40.0, dur: 0.4, note: 'G2', type: 'bass' },
  { time: 41.0, dur: 0.4, note: 'G3', type: 'bass' },
  { time: 42.0, dur: 0.4, note: 'G2', type: 'bass' },
  { time: 43.0, dur: 0.4, note: 'G3', type: 'bass' },
  // Measure 12 Bass
  { time: 44.0, dur: 0.4, note: 'C3', type: 'bass' },
  { time: 45.0, dur: 0.4, note: 'G2', type: 'bass' },
  { time: 46.0, dur: 0.4, note: 'C3', type: 'bass' },
  { time: 47.0, dur: 0.4, note: 'G2', type: 'bass' },
  // Measure 13 Bass
  { time: 48.0, dur: 0.4, note: 'D2', type: 'bass' },
  { time: 49.0, dur: 0.4, note: 'D3', type: 'bass' },
  { time: 50.0, dur: 0.4, note: 'D2', type: 'bass' },
  { time: 51.0, dur: 0.4, note: 'D3', type: 'bass' },
  // Measure 14 Bass
  { time: 52.0, dur: 0.4, note: 'G2', type: 'bass' },
  { time: 53.0, dur: 0.4, note: 'G3', type: 'bass' },
  { time: 54.0, dur: 0.4, note: 'A2', type: 'bass' },
  { time: 55.0, dur: 0.4, note: 'A3', type: 'bass' },
  // Measure 15 Bass (Resolving conclusion)
  { time: 56.0, dur: 0.4, note: 'D2', type: 'bass' },
  { time: 57.0, dur: 0.4, note: 'D3', type: 'bass' },
  { time: 58.0, dur: 0.4, note: 'D2', type: 'bass' },
  { time: 59.0, dur: 0.4, note: 'D3', type: 'bass' },
  // Measure 16 Bass (Chan Chan)
  { time: 60.0, dur: 0.4, note: 'A2', type: 'bass' },
  { time: 61.0, dur: 0.4, note: 'D2', type: 'bass' },
];

const TOTAL_BEATS = 64;

export const TangoPlayer: React.FC = () => {
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [volume, setVolume] = useState<number>(0.4); // default medium volume
  const [currentBeat, setCurrentBeat] = useState<number>(0);
  const [minimized, setMinimized] = useState<boolean>(false);
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [audioFileUrl, setAudioFileUrl] = useState<string | null>(
    "https://upload.wikimedia.org/wikipedia/commons/transcoded/5/55/La_Cumparsita_%28Tango%29.ogg/La_Cumparsita_%28Tango%29.ogg.mp3"
  );
  const [customFileName, setCustomFileName] = useState<string>('La Cumparsita');
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [audioError, setAudioError] = useState<string | null>(null);

  const audioContextRef = useRef<AudioContext | null>(null);
  const masterGainRef = useRef<GainNode | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const audioElementRef = useRef<HTMLAudioElement | null>(null);
  const mediaSourceRef = useRef<MediaElementAudioSourceNode | null>(null);

  const isPlayingRef = useRef<boolean>(false);

  // Scheduler state
  const schedulerTimerRef = useRef<number | null>(null);
  const nextNoteTimeRef = useRef<number>(0);
  const currentBeatRef = useRef<number>(0);
  const animationFrameRef = useRef<number | null>(null);

  const tempo = 116; // BPM (Expressive tempo for Alfredo Gobbi's robust rendition of Vicente Greco's Racing Club)
  const beatDuration = 60 / tempo; // ~0.53s per beat

  // Create persistent HTMLAudioElement exactly once on mount
  useEffect(() => {
    const audio = new Audio();
    audio.crossOrigin = "anonymous";
    audioElementRef.current = audio;

    const handleTimeUpdate = () => {
      if (audio.duration) {
        const beatVal = (audio.currentTime / audio.duration) * TOTAL_BEATS;
        setCurrentBeat(beatVal);
        currentBeatRef.current = beatVal;
      }
    };

    const handleEnded = () => {
      setIsPlaying(false);
      isPlayingRef.current = false;
      setCurrentBeat(0);
      currentBeatRef.current = 0;
    };

    const handleError = (e: any) => {
      console.warn("Error loading audio with crossOrigin=anonymous. Retrying without CORS...", e);
      // If we failed with anonymous CORS requirement, remove crossOrigin and retry!
      if (audio.crossOrigin === "anonymous" && audio.src && audio.src !== window.location.href && !audio.src.endsWith('/')) {
        audio.removeAttribute("crossOrigin");
        audio.load();
        if (isPlayingRef.current) {
          audio.play().catch(err => {
            console.error("Playback failed even without CORS, falling back to synth:", err);
            fallbackToSynth();
          });
        }
        return;
      }
      fallbackToSynth();
    };

    const fallbackToSynth = () => {
      // Only handle if we have a real source loaded and it failed
      if (audio.src && audio.src !== window.location.href && !audio.src.endsWith('/')) {
        setAudioError("⚠️ Usando Sintetizador (CORS/Red)");
        audio.pause();
        audio.src = "";
        setAudioFile(null);
        setAudioFileUrl(null);
        setIsPlaying(false);
        isPlayingRef.current = false;
        setCurrentBeat(0);
        currentBeatRef.current = 0;
      }
    };

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('error', handleError);

    return () => {
      audio.pause();
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('error', handleError);
      audioElementRef.current = null;
    };
  }, []);

  // Sync src whenever audioFileUrl changes
  useEffect(() => {
    const audio = audioElementRef.current;
    if (!audio) return;

    if (audioFileUrl) {
      if (audioFileUrl.startsWith('blob:')) {
        audio.removeAttribute("crossOrigin");
      } else {
        audio.crossOrigin = "anonymous";
      }
      audio.src = audioFileUrl;
      audio.load();
    } else {
      audio.pause();
      audio.src = "";
    }
  }, [audioFileUrl]);

  // Handle file drop/drag/select
  const handleAudioFile = (file: File) => {
    const isAudioType = file.type.startsWith('audio/');
    const isAudioExtension = /\.(mp3|wav|ogg|m4a|aac|flac|mp4)$/i.test(file.name);
    
    if (!isAudioType && !isAudioExtension) {
      alert('Por favor, selecciona un archivo de audio válido (por ejemplo, MP3).');
      return;
    }

    // Stop current playback
    stopPlayback();
    setAudioError(null);

    // Clean up previous URL if it was a local blob
    if (audioFileUrl && audioFileUrl.startsWith('blob:')) {
      URL.revokeObjectURL(audioFileUrl);
    }

    const url = URL.createObjectURL(file);
    setAudioFile(file);
    setAudioFileUrl(url);
    setCustomFileName(file.name);
    setCurrentBeat(0);
    currentBeatRef.current = 0;
  };

  const resetToSynth = () => {
    stopPlayback();
    setAudioError(null);
    if (audioFileUrl && audioFileUrl.startsWith('blob:')) {
      URL.revokeObjectURL(audioFileUrl);
    }
    setAudioFile(null);
    setAudioFileUrl("https://upload.wikimedia.org/wikipedia/commons/transcoded/5/55/La_Cumparsita_%28Tango%29.ogg/La_Cumparsita_%28Tango%29.ogg.mp3");
    setCustomFileName('La Cumparsita');
    setCurrentBeat(0);
    currentBeatRef.current = 0;
  };

  // Drag and Drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleAudioFile(e.dataTransfer.files[0]);
    }
  };

  const triggerFileSelect = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleAudioFile(e.target.files[0]);
    }
  };

  // Update volume when state changes
  useEffect(() => {
    if (masterGainRef.current && audioContextRef.current) {
      masterGainRef.current.gain.setValueAtTime(volume, audioContextRef.current.currentTime);
    }
  }, [volume]);

  // Handle visualizer rendering
  useEffect(() => {
    if (isPlaying && analyserRef.current && canvasRef.current) {
      renderVisualizer();
    } else {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      clearCanvas();
    }
  }, [isPlaying, minimized]);

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  };

  const renderVisualizer = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const analyser = analyserRef.current;
    if (!ctx || !analyser) return;

    analyser.fftSize = 64;
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const draw = () => {
      if (!isPlaying) return;
      animationFrameRef.current = requestAnimationFrame(draw);

      analyser.getByteFrequencyData(dataArray);
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const barWidth = (canvas.width / bufferLength) * 1.5;
      let barHeight;
      let x = 0;

      for (let i = 0; i < bufferLength; i++) {
        barHeight = dataArray[i] / 2;

        // Gradient for a gorgeous tango look (warm golden amber to rich crimson)
        const gradient = ctx.createLinearGradient(0, canvas.height, 0, 0);
        gradient.addColorStop(0, '#e11d48'); // rose-600
        gradient.addColorStop(0.5, '#f59e0b'); // amber-500
        gradient.addColorStop(1, '#fef08a'); // yellow-200

        ctx.fillStyle = gradient;
        // Bouncing bars rounded on top
        ctx.fillRect(x, canvas.height - barHeight, barWidth - 2, barHeight);

        x += barWidth;
      }
    };

    draw();
  };

  const initAudio = () => {
    if (!audioContextRef.current) {
      // Create audio context
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new AudioContextClass();
      audioContextRef.current = ctx;

      // Master volume gain node
      const masterGain = ctx.createGain();
      masterGain.gain.setValueAtTime(volume, ctx.currentTime);
      masterGainRef.current = masterGain;

      // Analyser node for live equalizing visualizer
      const analyser = ctx.createAnalyser();
      analyser.smoothingTimeConstant = 0.6;
      analyserRef.current = analyser;

      // Connect: Synth -> Master Gain -> Analyser -> Output
      masterGain.connect(analyser);
      analyser.connect(ctx.destination);

      // Connect the persistent Audio element to the AudioContext masterGain
      if (audioElementRef.current && !mediaSourceRef.current) {
        try {
          const source = ctx.createMediaElementSource(audioElementRef.current);
          source.connect(masterGain);
          mediaSourceRef.current = source;
        } catch (err) {
          console.error("Error connecting MediaElementSource inside initAudio:", err);
        }
      }
    }

    if (audioContextRef.current.state === 'suspended') {
      audioContextRef.current.resume();
    }
  };

  // Synthesizes a bandoneon sound (triangle + sawtooth with detuning + filter envelope + tremolo LFO)
  const playBandoneonNote = (freq: number, startTime: number, duration: number) => {
    const ctx = audioContextRef.current;
    const masterGain = masterGainRef.current;
    if (!ctx || !masterGain || freq <= 0) return;

    // 1. Oscillators
    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    osc1.type = 'triangle';
    osc2.type = 'sawtooth';

    // Detune osc2 slightly to create the signature bellows accordion beating chorus
    osc1.frequency.value = freq;
    osc2.frequency.value = freq * 1.002;

    // 2. Vibrato (LFO) for authentic hand-shake pulsation (6Hz)
    const vibrato = ctx.createOscillator();
    const vibratoGain = ctx.createGain();
    vibrato.frequency.value = 5.8; // 5.8 Hz
    vibratoGain.gain.value = 3.2; // Frequency mod range in Hz
    vibrato.connect(vibratoGain);
    vibratoGain.connect(osc1.frequency);
    vibratoGain.connect(osc2.frequency);

    // 3. Low Pass Filter (adds woodiness and removes saw harshness)
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.Q.value = 2.5;

    // Filter envelope: quick sweep for keys staccato click and bellows puff!
    filter.frequency.setValueAtTime(2200, startTime);
    filter.frequency.exponentialRampToValueAtTime(750, startTime + 0.12);
    filter.frequency.setValueAtTime(750, startTime + 0.12);

    // 4. Note gain envelope
    const noteGain = ctx.createGain();
    noteGain.gain.setValueAtTime(0, startTime);
    // Smooth attack for air intake (0.04s)
    noteGain.gain.linearRampToValueAtTime(0.55, startTime + 0.04);
    // Decay down to sustain level
    noteGain.gain.exponentialRampToValueAtTime(0.35, startTime + 0.18);
    // Keep sustaining, then fade out quickly on release
    const endTime = startTime + duration;
    noteGain.gain.setValueAtTime(0.35, endTime - 0.04);
    noteGain.gain.exponentialRampToValueAtTime(0.0001, endTime + 0.06);

    // Connections
    osc1.connect(filter);
    osc2.connect(filter);
    
    // Mix saw lower to keep it reedy but warm
    const sawMixNode = ctx.createGain();
    sawMixNode.gain.setValueAtTime(0.22, startTime);
    osc2.disconnect(filter);
    osc2.connect(sawMixNode);
    sawMixNode.connect(filter);

    filter.connect(noteGain);
    noteGain.connect(masterGain);

    // Playback
    vibrato.start(startTime);
    osc1.start(startTime);
    osc2.start(startTime);

    vibrato.stop(endTime + 0.1);
    osc1.stop(endTime + 0.1);
    osc2.stop(endTime + 0.1);
  };  // Synthesizes a bright, acoustic piano sound (fundamental + triangle octave + odd chime harmonic)
  const playPianoNote = (freq: number, startTime: number, duration: number) => {
    const ctx = audioContextRef.current;
    const masterGain = masterGainRef.current;
    if (!ctx || !masterGain || freq <= 0) return;

    const osc1 = ctx.createOscillator(); // fundamental
    const osc2 = ctx.createOscillator(); // octave above
    const osc3 = ctx.createOscillator(); // high overtone/tine

    osc1.type = 'sine';
    osc2.type = 'triangle';
    osc3.type = 'sine';

    osc1.frequency.value = freq;
    osc2.frequency.value = freq * 2;
    osc3.frequency.value = freq * 3.01; // subtle string detuning

    const pianoGain = ctx.createGain();
    pianoGain.gain.setValueAtTime(0, startTime);
    pianoGain.gain.linearRampToValueAtTime(0.4, startTime + 0.003); // sharp piano attack
    pianoGain.gain.exponentialRampToValueAtTime(0.09, startTime + 0.12); // rapid decay
    pianoGain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(2000, startTime);
    filter.frequency.exponentialRampToValueAtTime(380, startTime + duration);

    const osc2Gain = ctx.createGain();
    osc2Gain.gain.setValueAtTime(0.18, startTime);
    const osc3Gain = ctx.createGain();
    osc3Gain.gain.setValueAtTime(0.08, startTime);

    osc1.connect(filter);
    osc2.connect(osc2Gain);
    osc2Gain.connect(filter);
    osc3.connect(osc3Gain);
    osc3Gain.connect(filter);

    filter.connect(pianoGain);
    pianoGain.connect(masterGain);

    osc1.start(startTime);
    osc2.start(startTime);
    osc3.start(startTime);

    osc1.stop(startTime + duration + 0.05);
    osc2.stop(startTime + duration + 0.05);
    osc3.stop(startTime + duration + 0.05);
  };

  // Synthesizes a deep double bass tango marcato (sine + soft triangle + short decay)
  const playBassNote = (freq: number, startTime: number, duration: number) => {
    const ctx = audioContextRef.current;
    const masterGain = masterGainRef.current;
    if (!ctx || !masterGain || freq <= 0) return;

    const osc = ctx.createOscillator();
    const triOsc = ctx.createOscillator();
    osc.type = 'sine';
    triOsc.type = 'triangle';

    osc.frequency.value = freq;
    triOsc.frequency.value = freq;

    const bassGain = ctx.createGain();
    bassGain.gain.setValueAtTime(0, startTime);
    bassGain.gain.linearRampToValueAtTime(0.7, startTime + 0.015);
    // Tango bass is highly staccato
    bassGain.gain.exponentialRampToValueAtTime(0.05, startTime + 0.16);
    bassGain.gain.setValueAtTime(0.05, startTime + duration - 0.02);
    bassGain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration + 0.04);

    // Mix triangle slightly for that heavy "wooden thud" of double bass strings
    const triMix = ctx.createGain();
    triMix.gain.value = 0.15;
    triOsc.connect(triMix);
    triMix.connect(bassGain);

    osc.connect(bassGain);
    bassGain.connect(masterGain);

    osc.start(startTime);
    triOsc.start(startTime);

    osc.stop(startTime + duration + 0.1);
    triOsc.stop(startTime + duration + 0.1);
  };

  const scheduleNextNotes = () => {
    const ctx = audioContextRef.current;
    if (!ctx) return;

    // Look ahead 250ms
    const lookAheadTime = 0.25;
    
    while (nextNoteTimeRef.current < ctx.currentTime + lookAheadTime) {
      const playTime = nextNoteTimeRef.current;
      const targetBeat = currentBeatRef.current;

      // Find all notes at this beat time
      const notesToPlay = GOBBI_RACING_SCORE.filter(
        n => Math.abs(n.time - targetBeat) < 0.01
      );

      notesToPlay.forEach(item => {
        const freq = NOTE_FREQS[item.note] || 0;
        const noteDurationSeconds = item.dur * beatDuration;

        if (freq > 0) {
          if (item.type === 'bass') {
            // Double bass plays the deep, warm staccato note
            playBassNote(freq, playTime, noteDurationSeconds);
            // Piano plays the underlying octave bass note for rich depth
            playPianoNote(freq * 2, playTime, noteDurationSeconds);
          } else {
            // In Alfredo Gobbi's dramatic Orquesta style, the lead melody is a rich duet
            // of the romantic violin / bandoneón and the emotional grand piano!
            playBandoneonNote(freq, playTime, noteDurationSeconds);
            playPianoNote(freq, playTime + 0.015, noteDurationSeconds * 0.9);
          }
        }
      });

      // Increment tracker variables
      nextNoteTimeRef.current += beatDuration;
      currentBeatRef.current = (currentBeatRef.current + 0.5) % TOTAL_BEATS;
      
      // Update state for UI progress bar
      setCurrentBeat(currentBeatRef.current);
    }

    schedulerTimerRef.current = window.setTimeout(scheduleNextNotes, 50);
  };

  const startPlayback = () => {
    initAudio();
    setIsPlaying(true);
    isPlayingRef.current = true;

    if (audioFileUrl) {
      // Custom MP3 Mode
      const audio = audioElementRef.current;
      if (audio) {
        // If we are resuming, set the currentTime based on current progress
        const duration = audio.duration;
        if (duration && currentBeat > 0 && currentBeat < TOTAL_BEATS) {
          audio.currentTime = (currentBeat / TOTAL_BEATS) * duration;
        }

        audio.play().catch(err => {
          console.error("Error playing custom MP3 file:", err);
          setAudioError("⚠️ Usando Sintetizador (CORS/Red)");
          setAudioFile(null);
          setAudioFileUrl(null);
          
          // Fallback to synth mode
          const ctx = audioContextRef.current!;
          if (ctx) {
            nextNoteTimeRef.current = ctx.currentTime + 0.05;
            currentBeatRef.current = currentBeat;
            scheduleNextNotes();
          }
        });
      }
    } else {
      // Synth Mode
      const ctx = audioContextRef.current!;
      nextNoteTimeRef.current = ctx.currentTime + 0.05;
      // Keep playing from current beat position if paused
      currentBeatRef.current = currentBeat;
      scheduleNextNotes();
    }
  };

  const pausePlayback = () => {
    if (schedulerTimerRef.current) {
      clearTimeout(schedulerTimerRef.current);
      schedulerTimerRef.current = null;
    }
    if (audioElementRef.current) {
      audioElementRef.current.pause();
    }
    setIsPlaying(false);
    isPlayingRef.current = false;
  };

  const stopPlayback = () => {
    pausePlayback();
    if (audioElementRef.current) {
      audioElementRef.current.currentTime = 0;
    }
    setCurrentBeat(0);
    currentBeatRef.current = 0;
  };

  const togglePlay = () => {
    if (isPlaying) {
      pausePlayback();
    } else {
      startPlayback();
    }
  };

  // Human friendly formatting for beats
  const progressPercent = (currentBeat / TOTAL_BEATS) * 100;

  const formatTime = (secs: number) => {
    if (isNaN(secs) || !isFinite(secs)) return '0:00';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const currentTimeStr = audioElementRef.current ? formatTime(audioElementRef.current.currentTime) : '0:00';
  const durationStr = audioElementRef.current && !isNaN(audioElementRef.current.duration) ? formatTime(audioElementRef.current.duration) : '0:00';

  const isDefaultLaCumparsita = audioFileUrl === "https://upload.wikimedia.org/wikipedia/commons/transcoded/5/55/La_Cumparsita_%28Tango%29.ogg/La_Cumparsita_%28Tango%29.ogg.mp3";
  const displayTitle = audioFileUrl ? (isDefaultLaCumparsita ? "La Cumparsita" : customFileName) : 'Racing Club';
  const displayTag = audioFileUrl ? (isDefaultLaCumparsita ? "Tango Clásico" : "Tu Grabación") : 'Alfredo Gobbi';
  const displaySubtitle = audioFileUrl ? (isDefaultLaCumparsita ? "" : "Grabación de Usuario") : 'Sabor de la Guardia Vieja';

  return (
    <div 
      id="retro-tango-music-player"
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`bg-white/10 border border-white/20 rounded-xl p-2 px-3 flex flex-row items-center gap-3.5 text-xs w-full sm:w-auto max-w-sm md:max-w-md justify-between shadow-xs transition-all duration-300 relative overflow-hidden shrink-0 ${
        isDragging ? 'border-amber-400 bg-slate-900/90 scale-[1.02] ring-2 ring-amber-400/50' : ''
      }`}
    >
      {/* Hidden file input */}
      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleFileChange} 
        className="hidden" 
        accept="audio/*" 
      />

      {/* Drag and Drop visual overlay */}
      {isDragging && (
        <div className="absolute inset-0 bg-slate-950/95 flex items-center justify-center gap-2 z-10 pointer-events-none animate-pulse">
          <i className="fa fa-cloud-upload text-amber-400 text-sm"></i>
          <span className="font-mono text-amber-400 text-[9px] uppercase tracking-widest font-bold">¡Suelta tu MP3 aquí!</span>
        </div>
      )}

      {/* Mini-spinning vinyl with custom label */}
      <div className="relative flex-shrink-0 flex items-center justify-center">
        <div 
          className={`w-10 h-10 rounded-full bg-slate-950 border border-slate-800 flex items-center justify-center shadow relative ${
            isPlaying ? 'animate-spin [animation-duration:8s]' : ''
          }`}
        >
          {/* Vinyl Grooves */}
          <div className="absolute inset-1 rounded-full border border-slate-800/40"></div>
          <div className="absolute inset-2 rounded-full border border-slate-800/20"></div>
          {/* Center label (Red for Alfredo Gobbi's edition, Emerald for Custom user upload) */}
          <div className={`w-4 h-4 rounded-full flex items-center justify-center text-[5px] font-bold text-slate-100 border border-slate-950 ${
            audioFileUrl ? 'bg-emerald-600' : 'bg-rose-600'
          }`}>
            {audioFileUrl ? 'MP3' : 'AG'}
          </div>
          {/* Center hole */}
          <div className="w-1 h-1 rounded-full bg-slate-900 absolute"></div>
        </div>
        {/* Arm indicator */}
        <div className={`absolute -top-0.5 -right-0.5 w-3.5 h-4.5 border-t border-r border-slate-400 rounded-tr origin-top-left transition-transform duration-500 ${
          isPlaying ? 'rotate-12' : '-rotate-15'
        }`}></div>
      </div>

      {/* Info Panel and Player Status */}
      <div className="flex-1 min-w-0 flex flex-col gap-0.5">
        <div className="flex items-center gap-1">
          <span className="font-serif font-bold text-slate-100 text-[11px] truncate">
            {displayTitle}
          </span>
          <span className={`text-[8px] px-1 py-0.2 rounded font-mono font-bold tracking-tight shrink-0 uppercase ${
            isDefaultLaCumparsita ? 'bg-amber-400/20 text-amber-300' : audioFileUrl ? 'bg-emerald-500/20 text-emerald-300' : 'bg-amber-400/20 text-amber-300'
          }`}>
            {displayTag}
          </span>
        </div>
        
        <div className="flex items-center justify-between gap-1.5">
          <span className={`text-[9px] truncate ${audioError ? 'text-amber-400 font-semibold' : 'text-slate-300'}`}>
            {audioError || displaySubtitle}
          </span>
          <div className="flex items-center gap-2 shrink-0">
            {!isDefaultLaCumparsita && (
              <button 
                type="button" 
                onClick={() => {
                  stopPlayback();
                  setAudioFile(null);
                  setAudioFileUrl("https://upload.wikimedia.org/wikipedia/commons/transcoded/5/55/La_Cumparsita_%28Tango%29.ogg/La_Cumparsita_%28Tango%29.ogg.mp3");
                  setCustomFileName('La Cumparsita');
                  setCurrentBeat(0);
                  currentBeatRef.current = 0;
                }}
                className="text-[8px] text-amber-300 hover:text-amber-200 hover:underline font-mono font-bold cursor-pointer"
                title="Volver a La Cumparsita"
              >
                Volver
              </button>
            )}
            <button 
              type="button" 
              onClick={triggerFileSelect} 
              className="text-[8px] text-slate-300 hover:text-white hover:underline font-mono font-bold flex items-center gap-0.5 cursor-pointer"
              title="Arrastra tu MP3 o haz clic para subir otro archivo"
            >
              <i className="fa fa-upload"></i> {isDefaultLaCumparsita ? "Cambiar MP3" : "Subir otro"}
            </button>
          </div>
        </div>
        
        {/* Progress meter */}
        <div className="flex items-center gap-1.5 w-full mt-0.5">
          <div className="flex-1 bg-white/10 h-1 rounded-full overflow-hidden">
            <div 
              className="bg-amber-400 h-full transition-all duration-150" 
              style={{ width: `${progressPercent}%` }}
            ></div>
          </div>
          <span className="text-[8px] font-mono text-slate-300 shrink-0">
            {audioFileUrl ? `${currentTimeStr}/${durationStr}` : `${Math.floor(currentBeat / 4) + 1}/16`}
          </span>
        </div>
      </div>

      {/* Embedded Real-time Audio Spectrum */}
      <div className="h-6 w-14 bg-black/30 rounded border border-white/5 relative overflow-hidden hidden sm:block">
        <canvas ref={canvasRef} className="w-full h-full" width={56} height={24} />
      </div>

      {/* Action Controls & Volume */}
      <div className="flex items-center gap-2 flex-shrink-0 pl-1 border-l border-white/10">
        <button
          type="button"
          onClick={togglePlay}
          className={`w-7 h-7 rounded-full flex items-center justify-center transition-all cursor-pointer text-[10px] ${
            isPlaying 
              ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold' 
              : 'bg-white/20 hover:bg-white/30 text-white'
          }`}
          title={isPlaying ? 'Pausar' : 'Oír música'}
        >
          <i className={`fa ${isPlaying ? 'fa-pause' : 'fa-play ml-0.5'}`}></i>
        </button>

        <button
          type="button"
          onClick={stopPlayback}
          disabled={currentBeat === 0 && !isPlaying}
          className="w-6 h-6 rounded-full bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white transition-all flex items-center justify-center text-[8px] cursor-pointer disabled:opacity-20 disabled:cursor-not-allowed"
          title="Detener"
        >
          <i className="fa fa-stop"></i>
        </button>

        {/* Vertical Compact volume slider */}
        <div className="flex items-center gap-1">
          <input
            type="range"
            min="0"
            max="0.8"
            step="0.05"
            value={volume}
            onChange={e => setVolume(parseFloat(e.target.value))}
            className="w-10 h-0.5 bg-white/20 rounded-lg appearance-none cursor-pointer accent-amber-400"
            title="Volumen"
          />
        </div>
      </div>
    </div>
  );
};
