let audioContext = null;
let currentOscillators = [];
let intervalId = null;
let isPlaying = false;

const getContext = () => {
  if (!audioContext || audioContext.state === "closed") {
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
  }
  if (audioContext.state === "suspended") {
    audioContext.resume();
  }
  return audioContext;
};

const cleanupOscillators = () => {
  currentOscillators.forEach((node) => {
    try { node.stop(); } catch (e) {}
    try { node.disconnect(); } catch (e) {}
  });
  currentOscillators = [];
};

/**
 * Premium Outgoing Call Tone
 * 440 Hz and 480 Hz mixed (European standard style, sounds modern)
 * 1.2 second on, 3.3 seconds off
 */
const playOutgoingTone = () => {
  const ctx = getContext();
  cleanupOscillators();

  const playBeep = (freq, startTime, duration) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = "sine";
    osc.frequency.setValueAtTime(freq, startTime);

    gain.gain.setValueAtTime(0, startTime);
    gain.gain.linearRampToValueAtTime(0.15, startTime + 0.05);
    gain.gain.setValueAtTime(0.15, startTime + duration - 0.05);
    gain.gain.linearRampToValueAtTime(0, startTime + duration);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(startTime);
    osc.stop(startTime + duration);
    currentOscillators.push(osc);
  };

  const time = ctx.currentTime;
  // Dual tone for rich sound
  playBeep(440, time, 1.2);
  playBeep(480, time, 1.2);
};

/**
 * Premium Incoming Ringtone (Marimba / Bell style)
 * A pleasant melodic sequence
 */
const playIncomingTone = () => {
  const ctx = getContext();
  cleanupOscillators();

  const playNote = (freq, startOffset, duration) => {
    const time = ctx.currentTime + startOffset;
    
    // Main oscillator (Sine for purity)
    const osc1 = ctx.createOscillator();
    osc1.type = "sine";
    osc1.frequency.setValueAtTime(freq, time);

    // Harmonic oscillator (Triangle for bell-like timbre)
    const osc2 = ctx.createOscillator();
    osc2.type = "triangle";
    osc2.frequency.setValueAtTime(freq * 2, time);

    // Envelope
    const gainNode = ctx.createGain();
    gainNode.gain.setValueAtTime(0, time);
    gainNode.gain.linearRampToValueAtTime(0.4, time + 0.02); // Fast attack
    gainNode.gain.exponentialRampToValueAtTime(0.01, time + duration); // Long decay

    // Filter to make it warm
    const filter = ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.setValueAtTime(2500, time);
    filter.frequency.exponentialRampToValueAtTime(500, time + duration);

    osc1.connect(gainNode);
    osc2.connect(gainNode);
    gainNode.connect(filter);
    filter.connect(ctx.destination);

    osc1.start(time);
    osc2.start(time);
    osc1.stop(time + duration);
    osc2.stop(time + duration);

    currentOscillators.push(osc1, osc2);
  };

  // Nice melodic sequence (Pentatonic scale)
  const notes = [
    { f: 523.25, t: 0.0 },  // C5
    { f: 659.25, t: 0.15 }, // E5
    { f: 783.99, t: 0.3 },  // G5
    { f: 1046.50, t: 0.45 },// C6
    { f: 783.99, t: 0.65 }, // G5
    { f: 1046.50, t: 0.8 }, // C6
  ];

  notes.forEach(note => playNote(note.f, note.t, 1.5));
};

export const playNotificationTone = () => {
  const ctx = getContext();
  const time = ctx.currentTime;
  
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  
  osc.type = "sine";
  osc.frequency.setValueAtTime(800, time);
  osc.frequency.exponentialRampToValueAtTime(1200, time + 0.1);
  
  gain.gain.setValueAtTime(0, time);
  gain.gain.linearRampToValueAtTime(0.3, time + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.01, time + 0.2);
  
  osc.connect(gain);
  gain.connect(ctx.destination);
  
  osc.start(time);
  osc.stop(time + 0.2);
};

export const startRingtone = (type = "incoming") => {
  if (isPlaying) {
    stopRingtone();
  }
  isPlaying = true;

  const play = type === "outgoing" ? playOutgoingTone : playIncomingTone;
  const interval = type === "outgoing" ? 4500 : 2500;

  play();
  intervalId = setInterval(() => {
    if (isPlaying) play();
  }, interval);
};

export const stopRingtone = () => {
  isPlaying = false;
  if (intervalId) {
    clearInterval(intervalId);
    intervalId = null;
  }
  cleanupOscillators();
};
