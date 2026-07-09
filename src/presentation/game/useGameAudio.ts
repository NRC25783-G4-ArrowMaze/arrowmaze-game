import { useEffect, useRef } from 'react';
import type { GameStatus } from '../../domain/entities/GameSession';
import type { GameFlowState } from '../../application/dtos/GameFlowDTOs';
import type { AdvanceOutcome } from '../../domain/value-objects/AdvanceResult';
import type { AudioPreferences } from '../../application/ports/IAudioPreferences';
import type { IAudioEngine } from '../audio/AudioEngine';
import { canPlay, effectiveGain, sfxForOutcome, trackForDifficulty } from '../audio/audioPolicy';

/** Signal de outcome de tick surfaceada por useGameController (patrón "caller" de B2). */
export interface TickOutcomeSignal {
  outcome: AdvanceOutcome;
  nonce: number;
}

export interface GameAudioState {
  status: GameStatus;
  flowState: GameFlowState;
  /** Dificultad semántica del nivel (easy/medium/hard/veryHard) para elegir pista. */
  difficulty: string | undefined;
  /** Último outcome de tick; el nonce evita re-disparos. */
  tickOutcome: TickOutcomeSignal | null;
  prefs: AudioPreferences;
  /** Autoplay desbloqueado tras la primera interacción (D4). */
  unlocked: boolean;
  engine: IAudioEngine;
}

/**
 * useGameAudio — proyección de SOLO LECTURA del estado del juego hacia el audio
 * (G1). Nunca escribe en el dominio; el engine es el límite de robustez (no
 * lanza). Antes del desbloqueo de autoplay no reproduce nada (D4).
 */
export function useGameAudio(state: GameAudioState): void {
  const { status, flowState, difficulty, tickOutcome, prefs, unlocked, engine } = state;
  const sfxGain = effectiveGain(prefs.sfxVolume, prefs.muted);
  const musicGain = effectiveGain(prefs.musicVolume, prefs.muted);

  // SFX por outcome de tick (advanced/blocked/exited); una emisión por nonce.
  const lastTickNonce = useRef<number | null>(null);
  useEffect(() => {
    if (!canPlay(unlocked) || tickOutcome === null) return;
    if (lastTickNonce.current === tickOutcome.nonce) return;
    lastTickNonce.current = tickOutcome.nonce;
    engine.playSfx(sfxForOutcome(tickOutcome.outcome), sfxGain);
  }, [tickOutcome, unlocked, engine, sfxGain]);

  // SFX terminal (WON/LOST) una única vez + detener la música.
  const lastTerminal = useRef<GameStatus | null>(null);
  useEffect(() => {
    if (status === 'WON' || status === 'LOST') {
      if (lastTerminal.current !== status) {
        lastTerminal.current = status;
        if (canPlay(unlocked)) {
          engine.playSfx(status === 'WON' ? 'won' : 'lost', sfxGain);
        }
        engine.stopMusic();
      }
    } else {
      lastTerminal.current = null;
    }
  }, [status, unlocked, engine, sfxGain]);

  // Música: loop durante gameplay (IN_PROGRESS + ACTIVE), pausa en PAUSED/SETTINGS
  // (sin reiniciar), stop fuera del gameplay. El volumen aplica en caliente
  // (playMusic sobre la misma pista solo ajusta el volumen).
  useEffect(() => {
    if (!canPlay(unlocked)) return;
    if (status === 'IN_PROGRESS') {
      if (flowState === 'ACTIVE') {
        engine.playMusic(trackForDifficulty(difficulty), musicGain);
      } else {
        engine.pauseMusic();
      }
    } else {
      engine.stopMusic();
    }
  }, [status, flowState, difficulty, unlocked, engine, musicGain]);

  // Al desmontar (salir de la partida): la música no queda sonando.
  useEffect(() => {
    return () => engine.stopMusic();
  }, [engine]);
}
