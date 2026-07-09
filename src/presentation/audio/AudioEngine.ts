import type { SfxId, MusicTrack } from './audioPolicy';

/**
 * Contrato del motor de audio. Permite inyectar un doble en tests (nunca se
 * reproduce audio real) y aísla a la presentación de HTMLAudioElement.
 */
export interface IAudioEngine {
  playSfx(id: SfxId, gain: number): void;
  playMusic(track: MusicTrack, gain: number): void;
  pauseMusic(): void;
  resumeMusic(): void;
  stopMusic(): void;
  setMusicGain(gain: number): void;
}

/**
 * AudioEngine — implementación real sobre HTMLAudioElement. INVARIANTE de
 * robustez (G1): ninguna operación lanza; un asset ausente o un play() rechazado
 * es un no-op silencioso, el juego jamás se rompe por audio.
 *
 * baseUrl por defecto '/audio' (public/ servido en la raíz por Vite y empaquetado
 * por Capacitor). Sin import.meta para que el engine sea testeable en jsdom.
 */
export class AudioEngine implements IAudioEngine {
  private readonly baseUrl: string;
  private readonly sfxPool = new Map<SfxId, HTMLAudioElement>();
  private music: HTMLAudioElement | null = null;
  private currentTrack: MusicTrack | null = null;

  constructor(baseUrl = '/audio') {
    this.baseUrl = baseUrl;
  }

  private sfxElement(id: SfxId): HTMLAudioElement {
    let el = this.sfxPool.get(id);
    if (el === undefined) {
      el = new Audio(`${this.baseUrl}/sfx/${id}.mp3`);
      this.sfxPool.set(id, el);
    }
    return el;
  }

  playSfx(id: SfxId, gain: number): void {
    try {
      const el = this.sfxElement(id);
      el.volume = gain;
      el.currentTime = 0;
      void el.play().catch(() => undefined);
    } catch {
      /* no-op: el audio nunca rompe el juego */
    }
  }

  playMusic(track: MusicTrack, gain: number): void {
    try {
      // Misma pista ya cargada: solo ajusta volumen / asegura reproducción (hot).
      if (this.currentTrack === track && this.music !== null) {
        this.music.volume = gain;
        if (this.music.paused) {
          void this.music.play().catch(() => undefined);
        }
        return;
      }
      this.stopMusic();
      const el = new Audio(`${this.baseUrl}/music/${track}.mp3`);
      el.loop = true;
      el.volume = gain;
      this.music = el;
      this.currentTrack = track;
      void el.play().catch(() => undefined);
    } catch {
      /* no-op */
    }
  }

  pauseMusic(): void {
    try {
      this.music?.pause();
    } catch {
      /* no-op */
    }
  }

  resumeMusic(): void {
    try {
      if (this.music !== null && this.music.paused) {
        void this.music.play().catch(() => undefined);
      }
    } catch {
      /* no-op */
    }
  }

  stopMusic(): void {
    try {
      if (this.music !== null) {
        this.music.pause();
        this.music.currentTime = 0;
      }
    } catch {
      /* no-op */
    } finally {
      this.music = null;
      this.currentTrack = null;
    }
  }

  setMusicGain(gain: number): void {
    try {
      if (this.music !== null) {
        this.music.volume = gain;
      }
    } catch {
      /* no-op */
    }
  }
}
