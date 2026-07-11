import { renderHook } from '@testing-library/react';
import { useGameAudio, type GameAudioState } from '../../src/presentation/game/useGameAudio';
import type { IAudioEngine } from '../../src/presentation/audio/AudioEngine';

function makeEngine(): jest.Mocked<IAudioEngine> {
  return {
    playSfx: jest.fn(),
    playMusic: jest.fn(),
    pauseMusic: jest.fn(),
    resumeMusic: jest.fn(),
    stopMusic: jest.fn(),
    setMusicGain: jest.fn(),
  };
}

const PREFS = { muted: false, sfxVolume: 80, musicVolume: 50 };

function state(engine: IAudioEngine, over: Partial<GameAudioState> = {}): GameAudioState {
  return {
    status: 'IN_PROGRESS',
    flowState: 'ACTIVE',
    difficulty: 'easy',
    tickOutcome: null,
    prefs: PREFS,
    unlocked: true,
    engine,
    ...over,
  };
}

describe('useGameAudio — proyección de audio del estado del juego (G1)', () => {
  it('no reproduce nada antes del desbloqueo de autoplay (D4)', () => {
    const engine = makeEngine();
    renderHook(() =>
      useGameAudio(state(engine, { unlocked: false, tickOutcome: { outcome: 'advanced', nonce: 1 } })),
    );
    expect(engine.playSfx).not.toHaveBeenCalled();
    expect(engine.playMusic).not.toHaveBeenCalled();
  });

  it('en gameplay reproduce la música de la dificultad al volumen de música', () => {
    const engine = makeEngine();
    renderHook(() => useGameAudio(state(engine, { difficulty: 'medium' })));
    expect(engine.playMusic).toHaveBeenCalledWith('medium', 0.5);
  });

  it('veryHard usa la pista hard', () => {
    const engine = makeEngine();
    renderHook(() => useGameAudio(state(engine, { difficulty: 'veryHard' })));
    expect(engine.playMusic).toHaveBeenCalledWith('hard', 0.5);
  });

  it('dispara el SFX del outcome (destroyed→exited) una vez por nonce', () => {
    const engine = makeEngine();
    const { rerender } = renderHook((s: GameAudioState) => useGameAudio(s), {
      initialProps: state(engine, { tickOutcome: { outcome: 'destroyed', nonce: 1 } }),
    });
    expect(engine.playSfx).toHaveBeenCalledWith('exited', 0.8);
    rerender(state(engine, { tickOutcome: { outcome: 'destroyed', nonce: 1 } })); // mismo nonce
    expect(engine.playSfx).toHaveBeenCalledTimes(1);
    rerender(state(engine, { tickOutcome: { outcome: 'blocked', nonce: 2 } })); // nuevo nonce
    expect(engine.playSfx).toHaveBeenCalledWith('blocked', 0.8);
    expect(engine.playSfx).toHaveBeenCalledTimes(2);
  });

  it('WON reproduce won una sola vez y detiene la música', () => {
    const engine = makeEngine();
    const { rerender } = renderHook((s: GameAudioState) => useGameAudio(s), {
      initialProps: state(engine),
    });
    rerender(state(engine, { status: 'WON' }));
    expect(engine.playSfx).toHaveBeenCalledWith('won', 0.8);
    expect(engine.stopMusic).toHaveBeenCalled();
    rerender(state(engine, { status: 'WON' }));
    expect(engine.playSfx).toHaveBeenCalledTimes(1);
  });

  it('LOST reproduce lost', () => {
    const engine = makeEngine();
    const { rerender } = renderHook((s: GameAudioState) => useGameAudio(s), {
      initialProps: state(engine),
    });
    rerender(state(engine, { status: 'LOST' }));
    expect(engine.playSfx).toHaveBeenCalledWith('lost', 0.8);
  });

  it('la pausa pausa la música (no la detiene)', () => {
    const engine = makeEngine();
    const { rerender } = renderHook((s: GameAudioState) => useGameAudio(s), {
      initialProps: state(engine),
    });
    rerender(state(engine, { flowState: 'PAUSED' }));
    expect(engine.pauseMusic).toHaveBeenCalled();
  });

  it('el mute global fuerza ganancia 0 en SFX y música', () => {
    const engine = makeEngine();
    renderHook(() =>
      useGameAudio(
        state(engine, {
          prefs: { muted: true, sfxVolume: 80, musicVolume: 50 },
          tickOutcome: { outcome: 'advanced', nonce: 1 },
        }),
      ),
    );
    expect(engine.playMusic).toHaveBeenCalledWith('easy', 0);
    expect(engine.playSfx).toHaveBeenCalledWith('advanced', 0);
  });

  it('al desmontar detiene la música (no queda sonando fuera de la partida)', () => {
    const engine = makeEngine();
    const { unmount } = renderHook(() => useGameAudio(state(engine)));
    unmount();
    expect(engine.stopMusic).toHaveBeenCalled();
  });
});
