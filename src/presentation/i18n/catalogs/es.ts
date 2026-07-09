import type { Catalog } from '../i18n';

/** Catálogo de cadenas en español. Debe tener EXACTAMENTE las mismas claves que `en`. */
export const es: Catalog = {
  app: {
    title: 'Arrow Maze',
    loading: 'Cargando motor del juego...',
  },
  game: {
    pause: '⏸ Pausa',
    moves: 'Movimientos',
    movesLeft: 'Movimientos restantes: {count}',
    time: 'Tiempo',
    timeElapsed: 'Tiempo transcurrido: {time}',
    status: {
      inProgress: '▶ En juego',
      won: '✓ Victoria',
      lost: '✗ Derrota',
    },
  },
  overlay: {
    victory: {
      title: '¡Ganaste!',
      nextLevel: 'Siguiente nivel →',
    },
    defeat: {
      title: 'Perdiste',
    },
    backToMap: 'Volver al mapa',
    time: 'Tiempo: {time}',
    aria: {
      won: 'Ganaste',
      lost: 'Perdiste',
    },
  },
  common: {
    score: 'Puntaje: {score}',
  },
  pause: {
    title: 'Pausa',
    resume: 'Reanudar',
    restart: 'Reiniciar',
    settings: 'Ajustes',
    exit: 'Salir',
  },
  settings: {
    title: 'Ajustes',
    language: {
      title: 'Idioma',
      es: 'Español',
      en: 'English',
    },
    audio: {
      title: 'Audio',
    },
    comingSoon: 'Próximamente',
    back: 'Volver',
  },
  levelSelect: {
    title: 'Selecciona un nivel',
    locked: {
      notice: 'Completa los niveles previos para desbloquear',
    },
    status: {
      blocked: 'Bloqueado',
      available: 'Disponible',
      completed: 'Completado',
    },
    card: {
      next: 'Siguiente →',
    },
  },
  level: {
    difficulty: {
      easy: 'Fácil',
      medium: 'Medio',
      hard: 'Difícil',
      veryHard: 'Muy difícil',
    },
  },
};
