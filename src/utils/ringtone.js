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
  currentOscillators.forEach((osc) => {
    try { osc.stop(); } catch (e) {}
    try { osc.disconnect(); } catch (e) {}
  });
  currentOscillators = [];
};

/**
 * Outgoing Call Tone (WhatsApp style)
 * A standard ringback tone: 1 second on, 3 seconds off
 * 425 Hz sine wave (ITU-T standard)
 */
const playOutgoingTone = () => {
  const ctx = getContext();
  cleanupOscillators();

  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = "sine";
  osc.frequency.setValueAtTime(425, ctx.currentTime);

  gain.gain.setValueAtTime(0, ctx.currentTime);
  gain.gain.linearRampToValueAtTime(0.25, ctx.currentTime + 0.05);
  gain.gain.setValueAtTime(0.25, ctx.currentTime + 1.0);
  gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 1.1);

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.start(ctx.currentTime);
  osc.stop(ctx.currentTime + 1.15);
  currentOscillators.push(osc);
};

/**
 * Incoming Call Ringtone (WhatsApp style)
 * Two short rising tones, like a phone ringing
 */
const playIncomingTone = () => {
  const ctx = getContext();
  cleanupOscillators();

  const playBurst = (startOffset) => {
    const time = ctx.currentTime + startOffset;

    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const gain = ctx.createGain();

    osc1.type = "sine";
    osc1.frequency.setValueAtTime(523, time); // C5
    osc1.frequency.linearRampToValueAtTime(659, time + 0.15); // Rising to E5

    osc2.type = "sine";
    osc2.frequency.setValueAtTime(659, time); // E5
    osc2.frequency.linearRampToValueAtTime(784, time + 0.15); // Rising to G5

    gain.gain.setValueAtTime(0, time);
    gain.gain.linearRampToValueAtTime(0.35, time + 0.03);
    gain.gain.setValueAtTime(0.35, time + 0.12);
    gain.gain.linearRampToValueAtTime(0, time + 0.18);

    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(ctx.destination);

    osc1.start(time);
    osc1.stop(time + 0.2);
    osc2.start(time);
    osc2.stop(time + 0.2);

    currentOscillators.push(osc1, osc2);
  };

  // Two quick bursts
  playBurst(0);
  playBurst(0.3);
};

/**
 * Start ringtone
 * @param {"incoming" | "outgoing"} type
 */
export const startRingtone = (type = "incoming") => {
  // Prevent overlapping
  if (isPlaying) {
    stopRingtone();
  }
  isPlaying = true;

  const play = type === "outgoing" ? playOutgoingTone : playIncomingTone;
  const interval = type === "outgoing" ? 4000 : 1800;

  play(); // Play immediately
  intervalId = setInterval(() => {
    if (isPlaying) play();
  }, interval);
};

/**
 * Stop ringtone
 */
export const stopRingtone = () => {
  isPlaying = false;
  if (intervalId) {
    clearInterval(intervalId);
    intervalId = null;
  }
  cleanupOscillators();
};
