/**
 * Web Audio API Synthesizer for tactile paper and mechanical haptics.
 */
class SoundEngine {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;
  private isUnlocked: boolean = false;

  constructor() {
    // Lazy initialization handled on first user interaction
    if (typeof window !== 'undefined') {
      const unlockEvents = ['touchstart', 'touchend', 'mousedown', 'keydown', 'pointerdown'];
      const unlockAudio = () => {
        this.init();
        unlockEvents.forEach((evt) => window.removeEventListener(evt, unlockAudio));
      };
      unlockEvents.forEach((evt) => window.addEventListener(evt, unlockAudio, { passive: true, once: true }));
    }
  }

  private init() {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
        if (this.ctx.state === 'suspended') {
          this.ctx.resume();
        }
        this.isUnlocked = true;
      }
    } else if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
      this.isUnlocked = true;
    }
  }

  public setMuted(muted: boolean) {
    this.isMuted = muted;
  }

  public getMuted(): boolean {
    return this.isMuted;
  }

  /**
   * Synthesized triangle wave 800Hz -> 120Hz in 35ms.
   * Gives a crisp mechanical gear tick / paper perforation notch feedback.
   */
  public playStepTick() {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(800, now);
      osc.frequency.exponentialRampToValueAtTime(120, now + 0.035);

      gain.gain.setValueAtTime(0.18, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.035);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.036);
    } catch {
      // AudioContext safety fallback
    }
  }

  /**
   * Bandpass filtered white noise burst at 1800Hz (Q=3.0, 120ms).
   * Generates a hyper-realistic crisp paper tear rip sound.
   */
  public playTearSnap() {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx) return;

    try {
      const bufferSize = Math.floor(this.ctx.sampleRate * 0.12); // 120ms
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);

      // Generate burst white noise with irregular envelope for natural paper fiber tearing
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        const progress = i / bufferSize;
        // Fibrous micro-jitter
        const jitter = Math.sin(progress * 120) * 0.2 + 0.8;
        data[i] = white * jitter;
      }

      const noiseSource = this.ctx.createBufferSource();
      noiseSource.buffer = buffer;

      // Bandpass filter at 1800Hz, Q=3.0
      const bandpass = this.ctx.createBiquadFilter();
      bandpass.type = 'bandpass';
      bandpass.frequency.setValueAtTime(1800, this.ctx.currentTime);
      bandpass.Q.setValueAtTime(3.0, this.ctx.currentTime);

      // High shelf for crisp tear edge
      const highshelf = this.ctx.createBiquadFilter();
      highshelf.type = 'highshelf';
      highshelf.frequency.setValueAtTime(3200, this.ctx.currentTime);
      highshelf.gain.setValueAtTime(4.0, this.ctx.currentTime);

      const gain = this.ctx.createGain();
      const now = this.ctx.currentTime;
      gain.gain.setValueAtTime(0.01, now);
      gain.gain.linearRampToValueAtTime(0.42, now + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

      noiseSource.connect(bandpass);
      bandpass.connect(highshelf);
      highshelf.connect(gain);
      gain.connect(this.ctx.destination);

      noiseSource.start(now);
      noiseSource.stop(now + 0.125);
    } catch {
      // AudioContext safety fallback
    }
  }

  /**
   * Heavy rubber stamp thud (80Hz thump with warm body).
   */
  public playStampThud() {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(140, now);
      osc.frequency.exponentialRampToValueAtTime(45, now + 0.08);

      gain.gain.setValueAtTime(0.35, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.09);
    } catch {
      // Ignore
    }
  }

  /**
   * Subtle thermal printer feed hum (stepper motor roll-out).
   */
  public playDispenseHum() {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(260, now);
      osc.frequency.linearRampToValueAtTime(320, now + 0.15);
      osc.frequency.linearRampToValueAtTime(280, now + 0.35);

      gain.gain.setValueAtTime(0.06, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.4);
    } catch {
      // Ignore
    }
  }
}

export const sound = new SoundEngine();
