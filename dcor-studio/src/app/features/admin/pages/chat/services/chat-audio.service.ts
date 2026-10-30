import { Injectable, signal } from '@angular/core';

const STORAGE_SOUND_KEY = 'dcor_chat_sound_enabled';

@Injectable({
  providedIn: 'root',
})
export class ChatAudioService {
  public isSoundEnabled = signal<boolean>(true);
  private audioCtx: AudioContext | null = null;

  constructor() {
    this.initSoundPreference();
  }

  private initSoundPreference(): void {
    if (typeof window === 'undefined') return;
    try {
      const saved = localStorage.getItem(STORAGE_SOUND_KEY);
      if (saved !== null) {
        this.isSoundEnabled.set(saved === 'true');
      } else {
        this.isSoundEnabled.set(true);
      }
    } catch {
      this.isSoundEnabled.set(true);
    }
  }

  public toggleSound(): boolean {
    const nextVal = !this.isSoundEnabled();
    this.isSoundEnabled.set(nextVal);
    try {
      localStorage.setItem(STORAGE_SOUND_KEY, String(nextVal));
    } catch {
      // Bỏ qua lỗi quota
    }
    return nextVal;
  }

  public playChime(): void {
    if (!this.isSoundEnabled() || typeof window === 'undefined') return;

    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) return;

      if (!this.audioCtx) {
        this.audioCtx = new AudioContextClass();
      }

      if (this.audioCtx.state === 'suspended') {
        this.audioCtx.resume();
      }

      const ctx = this.audioCtx;
      const now = ctx.currentTime;

      // Note 1: 587.33 Hz (D5)
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(587.33, now);
      gain1.gain.setValueAtTime(0.12, now);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.28);
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.start(now);
      osc1.stop(now + 0.3);

      // Note 2: 880 Hz (A5)
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(880, now + 0.12);
      gain2.gain.setValueAtTime(0.15, now + 0.12);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.55);
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.start(now + 0.12);
      osc2.stop(now + 0.6);
    } catch {
      // Trình duyệt có thể chặn autoplay âm thanh khi chưa có tương tác
    }
  }
}

