import React, { useEffect, useRef, useState } from 'react';

/** Duración visible del toast (ms) — dial iterable en caliente. */
export const TOAST_DURATION_MS = 2500;
/** Duración de la animación de entrada/salida (ms). */
export const TOAST_EXIT_MS = 200;

/** Props del toast: el mensaje llega YA interpolado (el alias es contenido). */
export interface ToastProps {
  message: string;
  /** Se invoca UNA sola vez cuando el toast terminó de salir (para desmontarlo). */
  onDone: () => void;
  /** Duración visible; default TOAST_DURATION_MS. */
  durationMs?: number;
}

type Phase = 'enter' | 'visible' | 'leaving';

/**
 * Toast — Aviso efímero flotante (bienvenida / sesión cerrada), bottom-center
 * del viewport sin tapar el header. Accesible (role=status +
 * aria-live=polite), auto-dismiss por dial, click lo cierra antes, entrada y
 * salida con una transición CSS sutil (sin rAF). UN toast a la vez: el caller
 * remonta por nonce (key), el nuevo reemplaza al viejo sin colas.
 */
export const Toast: React.FC<ToastProps> = ({
  message,
  onDone,
  durationMs = TOAST_DURATION_MS,
}) => {
  const [phase, setPhase] = useState<Phase>('enter');
  const dismissedRef = useRef(false);
  const timersRef = useRef<number[]>([]);

  // Todos los timers pasan por aquí para poder limpiarlos juntos al desmontar
  // (nunca un onDone tardío sobre un componente muerto).
  const schedule = (fn: () => void, ms: number): void => {
    timersRef.current.push(window.setTimeout(fn, ms));
  };

  const dismiss = (): void => {
    if (dismissedRef.current) {
      return; // ya saliendo (click + auto-dismiss no se duplican).
    }
    dismissedRef.current = true;
    setPhase('leaving');
    schedule(onDone, TOAST_EXIT_MS);
  };

  useEffect(() => {
    // El flip a 'visible' va en un timeout (callback async): dispara la
    // transición de entrada sin setState síncrono en el cuerpo del effect.
    schedule(() => setPhase('visible'), 20);
    schedule(dismiss, durationMs);
    const timers = timersRef.current;
    return () => timers.forEach((t) => clearTimeout(t));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const hidden = phase !== 'visible';
  return (
    <div
      role="status"
      aria-live="polite"
      onClick={dismiss}
      style={{
        position: 'fixed',
        // safe-area: en Capacitor (viewport-fit=cover) el toast no debe quedar
        // bajo la barra de gestos.
        bottom: 'calc(24px + env(safe-area-inset-bottom))',
        left: '50%',
        // La transición anima opacidad y un leve desplazamiento vertical.
        transform: `translate(-50%, ${hidden ? '12px' : '0'})`,
        opacity: hidden ? 0 : 1,
        transition: `opacity ${TOAST_EXIT_MS}ms ease, transform ${TOAST_EXIT_MS}ms ease`,
        // Superficie "inversa": panel oscuro en claro; en oscuro pasa a
        // superficie elevada (ya no invierte — seguiría siendo legible pero
        // se fundiría con el fondo).
        background: 'var(--inverse-surface)',
        color: 'var(--inverse-text)',
        padding: '10px 20px',
        borderRadius: '999px',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.25)',
        cursor: 'pointer',
        // Escala de z-index (App.css): 100 overlays modales, 200 Toast.
        zIndex: 200,
        maxWidth: '90%',
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
      }}
    >
      {message}
    </div>
  );
};
