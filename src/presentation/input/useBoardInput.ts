import React, { useCallback } from 'react';
import type { BoardLayout, Point } from '../rendering/boardLayout';
import { decideTap, type ArrowResolver } from './tapResolver';
import type { PlayMoveCommand } from './PlayMoveCommand';

/** Parámetros del adaptador de input sobre el SVG del tablero. */
export interface UseBoardInputParams {
  /** Dimensiones del viewBox (unidades lógicas del SVG). */
  width: number;
  height: number;
  /** Geometría resuelta del tablero (mismo layout que usa el renderer). */
  layout: BoardLayout;
  /**
   * Si el input está habilitado. Se pasa false para DESCARTAR toques mientras
   * hay un movimiento en vuelo (B2) o cuando la sesión es terminal (WON/LOST).
   */
  enabled: boolean;
  /** Consulta de ocupación celda → arrowId. */
  resolveArrowIdAt: ArrowResolver;
  /** Se invoca con el comando cuando un toque resuelve a una flecha. */
  onPlayMove: (command: PlayMoveCommand) => void;
}

/**
 * Convierte las coordenadas de cliente de un evento pointer a unidades del
 * viewBox, compensando cualquier escalado CSS del SVG.
 */
function toViewBoxPoint(
  event: React.PointerEvent<SVGSVGElement>,
  width: number,
  height: number,
): Point {
  const rect = event.currentTarget.getBoundingClientRect();
  // Evita división por cero si el elemento aún no tiene tamaño medible.
  const scaleX = rect.width === 0 ? 1 : width / rect.width;
  const scaleY = rect.height === 0 ? 1 : height / rect.height;
  return {
    x: (event.clientX - rect.left) * scaleX,
    y: (event.clientY - rect.top) * scaleY,
  };
}

/**
 * useBoardInput — Adaptador de input (B3) como handler de pointer para el SVG.
 *
 * Unifica mouse, touch y pen en un único "tap" usando Pointer Events. Filtra:
 *   - Solo botón primario (e.button === 0): ignora click derecho/medio.
 *   - Solo el pointer primario (e.isPrimary): ignora toques secundarios (multi-touch).
 *   - Input deshabilitado (movimiento en vuelo o estado terminal): descarta, no encola.
 *
 * Si el toque pasa los filtros, delega en resolveTap (lógica pura) para traducir
 * el punto a una flecha y, si la hay, emite el PlayMoveCommand. La decisión de
 * mover/colisionar/destruir NO se toma aquí: la toma el motor.
 *
 * @returns Handler listo para asignar a <svg onPointerDown=...>.
 */
export function useBoardInput(
  params: UseBoardInputParams,
): React.PointerEventHandler<SVGSVGElement> {
  const { width, height, layout, enabled, resolveArrowIdAt, onPlayMove } = params;

  return useCallback(
    (event: React.PointerEvent<SVGSVGElement>) => {
      const point = toViewBoxPoint(event, width, height);
      const command = decideTap(
        enabled,
        { button: event.button, isPrimary: event.isPrimary },
        point,
        layout,
        resolveArrowIdAt,
      );
      if (command !== null) {
        onPlayMove(command);
      }
    },
    [width, height, layout, enabled, resolveArrowIdAt, onPlayMove],
  );
}
