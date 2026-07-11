import { AudioEngine } from '../../src/presentation/audio/AudioEngine';

// jsdom no implementa HTMLMediaElement.play(): es el escenario perfecto para
// verificar la robustez (G1) — el engine es el límite: ninguna operación lanza
// aunque la reproducción falle, así el juego JAMÁS se rompe por audio.
describe('AudioEngine — robustez ante fallos de reproducción', () => {
  it('ninguna operación lanza aunque play() falle', () => {
    const engine = new AudioEngine();
    expect(() => engine.playSfx('advanced', 0.8)).not.toThrow();
    expect(() => engine.playSfx('won', 0.8)).not.toThrow();
    expect(() => engine.playMusic('easy', 0.5)).not.toThrow();
    expect(() => engine.playMusic('easy', 0.7)).not.toThrow(); // misma pista (ajuste de volumen)
    expect(() => engine.pauseMusic()).not.toThrow();
    expect(() => engine.resumeMusic()).not.toThrow();
    expect(() => engine.setMusicGain(0.3)).not.toThrow();
    expect(() => engine.stopMusic()).not.toThrow();
  });
});
