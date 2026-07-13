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
    theme: {
      title: 'Tema',
      light: 'Claro',
      dark: 'Oscuro',
    },
    audio: {
      title: 'Audio',
      mute: 'Silenciar todo',
      sfxVolume: 'Volumen de efectos',
      musicVolume: 'Volumen de música',
      credits: 'Créditos de audio',
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
    name: {
      'level-initial': 'Tutorial',
      'level-intermediate-a': 'Desafío A',
      'heart-preview': 'Corazón',
      'singularidad': 'Singularidad',
      'level-intermediate-b': 'Desafío B',
      'level-advanced': 'Avanzado',
      'level-expert': 'Experto',
      'mapa-06': 'Corredores',
      'mapa-07': 'Molinete Anidado',
      'mapa-08': 'Escaleras',
      'mapa-09': 'Cuatro Cuadrantes',
      'mapa-10': 'Rombo',
      'mapa-11': 'Molinete Doble',
      'mapa-12': 'Espiga',
      'mapa-13': 'Cerrojos',
      'mapa-14': 'Núcleo Sellado',
      'mapa-15': 'Anillo',
    },
  },
  account: {
    button: 'Cuenta',
    title: 'Cuenta',
    tab: {
      login: 'Iniciar sesión',
      register: 'Crear cuenta',
    },
    email: 'Correo electrónico',
    password: 'Contraseña',
    submit: {
      login: 'Entrar',
      register: 'Registrarme',
    },
    logout: 'Cerrar sesión',
    loading: 'Procesando…',
    status: {
      loggedIn: 'Sesión activa',
    },
    ariaLoggedIn: 'Sesión activa: {alias} — gestiona tu cuenta',
    welcome: '¡Bienvenido, {alias}!',
    loggedOut: 'Sesión cerrada',
    register: {
      success: 'Cuenta creada. Inicia sesión para continuar.',
    },
    terms: {
      summary: 'Términos y uso de datos',
      academic:
        'ArrowMaze es un proyecto académico sin fines comerciales, creado con fines educativos. No está pensado para producción y el servicio puede interrumpirse o reiniciarse en cualquier momento.',
      dataTitle: 'Datos que usamos',
      dataUse:
        'Al registrarte guardamos tu correo y tu contraseña (cifrada en el servidor) para identificar tu cuenta. Tu progreso y tus puntuaciones se guardan para mostrar la clasificación, donde apareces con un alias derivado de tu correo.',
      dataRights:
        'No vendemos ni compartimos tus datos con terceros. Al ser un proyecto académico, los datos pueden eliminarse en cualquier momento; por favor no registres información sensible.',
      accept: 'He leído y acepto los términos y el uso de datos',
    },
    back: 'Volver',
    error: {
      invalidCredentials: 'Correo o contraseña incorrectos',
      emailInUse: 'Ese correo ya está registrado',
      invalidEmail: 'Formato de correo inválido',
      weakPassword: 'La contraseña debe tener mínimo 8 caracteres, 1 número y 1 mayúscula',
      termsRequired: 'Debes aceptar los términos para registrarte',
      network: 'Error de conexión. Inténtalo de nuevo.',
    },
  },
  theme: {
    toggle: {
      toDark: 'Cambiar a tema oscuro',
      toLight: 'Cambiar a tema claro',
    },
  },
  leaderboard: {
    title: 'Clasificación',
    open: 'Ver la clasificación del nivel',
    loading: 'Cargando clasificación…',
    error: 'No se pudo cargar la clasificación. Inténtalo de nuevo.',
    empty: 'Aún no hay récords — sé el primero',
    loginRequired: 'Inicia sesión para ver la clasificación',
    loginButton: 'Iniciar sesión',
    yourRecord: 'Tu récord',
    noRecord: 'Aún no tienes récord en este nivel',
    back: 'Volver',
    col: {
      rank: '#',
      player: 'Jugador',
      score: 'Puntaje',
      moves: 'Movidas',
      time: 'Tiempo',
    },
  },
};
