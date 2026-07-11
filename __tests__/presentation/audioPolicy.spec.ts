import {
  sfxForOutcome,
  prioritizeOutcome,
  trackForDifficulty,
  effectiveGain,
  canPlay,
  DEFAULT_AUDIO_PREFERENCES,
} from '../../src/presentation/audio/audioPolicy';

describe('audioPolicy — decisión de audio (pura, G1)', () => {
  describe('SFX por outcome del motor (D2)', () => {
    it('mapea cada outcome del dominio a su SFX (destroyed → exited)', () => {
      expect(sfxForOutcome('advanced')).toBe('advanced');
      expect(sfxForOutcome('blocked')).toBe('blocked');
      expect(sfxForOutcome('destroyed')).toBe('exited');
    });
  });

  describe('prioridad de outcomes en un mismo tick (no encimar SFX)', () => {
    it('exited (destroyed) > blocked > advanced', () => {
      expect(prioritizeOutcome(['advanced', 'blocked', 'destroyed'])).toBe('destroyed');
      expect(prioritizeOutcome(['advanced', 'blocked'])).toBe('blocked');
      expect(prioritizeOutcome(['advanced', 'advanced'])).toBe('advanced');
    });
    it('sin outcomes → null', () => {
      expect(prioritizeOutcome([])).toBeNull();
    });
  });

  describe('pista por dificultad (D3, pool de 3)', () => {
    it('easy/medium/hard mapean directo', () => {
      expect(trackForDifficulty('easy')).toBe('easy');
      expect(trackForDifficulty('medium')).toBe('medium');
      expect(trackForDifficulty('hard')).toBe('hard');
    });
    it('veryHard reusa la pista hard', () => {
      expect(trackForDifficulty('veryHard')).toBe('hard');
    });
    it('dificultad desconocida o ausente usa la pista por defecto (easy)', () => {
      expect(trackForDifficulty('imposible')).toBe('easy');
      expect(trackForDifficulty(undefined)).toBe('easy');
    });
  });

  describe('mute global y volúmenes independientes (D1)', () => {
    it('el mute fuerza ganancia 0 sin importar el volumen', () => {
      expect(effectiveGain(80, true)).toBe(0);
      expect(effectiveGain(50, true)).toBe(0);
    });
    it('sin mute, ganancia = volumen/100 con clamp a [0,100]', () => {
      expect(effectiveGain(80, false)).toBeCloseTo(0.8);
      expect(effectiveGain(0, false)).toBe(0);
      expect(effectiveGain(150, false)).toBe(1);
      expect(effectiveGain(-20, false)).toBe(0);
    });
    it('SFX y música se calculan por separado (mismo helper, distintos valores)', () => {
      const prefs = { muted: false, sfxVolume: 0, musicVolume: 50 };
      expect(effectiveGain(prefs.sfxVolume, prefs.muted)).toBe(0); // SFX en silencio
      expect(effectiveGain(prefs.musicVolume, prefs.muted)).toBeCloseTo(0.5); // música sigue
    });
  });

  describe('gate de autoplay (D4)', () => {
    it('no se puede reproducir hasta el desbloqueo', () => {
      expect(canPlay(false)).toBe(false);
      expect(canPlay(true)).toBe(true);
    });
  });

  it('preferencias por defecto: mute off, SFX 80, música 50', () => {
    expect(DEFAULT_AUDIO_PREFERENCES).toEqual({ muted: false, sfxVolume: 80, musicVolume: 50 });
  });
});
