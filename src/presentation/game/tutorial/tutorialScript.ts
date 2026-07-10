/**
 * Guion del tutorial guiado.
 *
 * Solo el primer nivel (`level-initial`) tiene guía. La secuencia lista los
 * `arrowId` en el orden en que hay que tocarlos para RESOLVERLO (mismo orden que
 * verifica `localLevels.spec`):
 *   - "blue" sube al Norte y sale, liberando (4,2) — si no, bloquearía a "green".
 *   - "orange" baja al Sur y libera (2,2).
 *   - "green" ya puede escapar al Este por todo el borde.
 *
 * La manito señala, paso a paso, la cabeza de la flecha del paso actual (su
 * celda se deriva en tiempo de render desde `scene.arrows`).
 */
export const TUTORIAL_LEVEL_ID = 'level-initial';

export const TUTORIAL_STEPS: readonly string[] = ['blue', 'orange', 'green'];
