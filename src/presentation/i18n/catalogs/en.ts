import type { Catalog } from '../i18n';

/** English string catalog. Must have EXACTLY the same keys as `es`. */
export const en: Catalog = {
  app: {
    title: 'Arrow Maze',
    loading: 'Loading game engine...',
  },
  game: {
    pause: '⏸ Pause',
    moves: 'Moves',
    movesLeft: 'Moves left: {count}',
    time: 'Time',
    timeElapsed: 'Elapsed time: {time}',
    status: {
      inProgress: '▶ In progress',
      won: '✓ Victory',
      lost: '✗ Defeat',
    },
  },
  overlay: {
    victory: {
      title: 'You won!',
      nextLevel: 'Next level →',
    },
    defeat: {
      title: 'You lost',
    },
    backToMap: 'Back to map',
    time: 'Time: {time}',
    aria: {
      won: 'You won',
      lost: 'You lost',
    },
  },
  common: {
    score: 'Score: {score}',
  },
  pause: {
    title: 'Paused',
    resume: 'Resume',
    restart: 'Restart',
    settings: 'Settings',
    exit: 'Exit',
  },
  settings: {
    title: 'Settings',
    language: {
      title: 'Language',
      es: 'Español',
      en: 'English',
    },
    audio: {
      title: 'Audio',
      mute: 'Mute all',
      sfxVolume: 'SFX volume',
      musicVolume: 'Music volume',
      credits: 'Audio credits',
    },
    comingSoon: 'Coming soon',
    back: 'Back',
  },
  levelSelect: {
    title: 'Select a level',
    locked: {
      notice: 'Complete the previous levels to unlock',
    },
    status: {
      blocked: 'Blocked',
      available: 'Available',
      completed: 'Completed',
    },
    card: {
      next: 'Next →',
    },
  },
  level: {
    difficulty: {
      easy: 'Easy',
      medium: 'Medium',
      hard: 'Hard',
      veryHard: 'Very hard',
    },
  },
  account: {
    button: 'Account',
    title: 'Account',
    tab: {
      login: 'Log in',
      register: 'Sign up',
    },
    email: 'Email',
    password: 'Password',
    submit: {
      login: 'Log in',
      register: 'Sign up',
    },
    logout: 'Log out',
    loading: 'Processing…',
    status: {
      loggedIn: 'Signed in',
    },
    ariaLoggedIn: 'Active session: {alias} — manage your account',
    welcome: 'Welcome, {alias}!',
    loggedOut: 'Signed out',
    register: {
      success: 'Account created. Log in to continue.',
    },
    terms: {
      summary: 'Terms & data usage',
      academic:
        'ArrowMaze is a non-commercial academic project built for educational purposes. It is not intended for production and the service may be interrupted or reset at any time.',
      dataTitle: 'Data we use',
      dataUse:
        'When you register we store your email and your password (hashed on the server) to identify your account. Your progress and scores are stored to show the leaderboard, where you appear under an alias derived from your email.',
      dataRights:
        'We do not sell or share your data with third parties. As an academic project, data may be deleted at any time; please do not enter sensitive information.',
      accept: 'I have read and accept the terms and data usage',
    },
    back: 'Back',
    error: {
      invalidCredentials: 'Invalid email or password',
      emailInUse: 'That email is already registered',
      invalidEmail: 'Invalid email format',
      weakPassword: 'Password must have at least 8 characters, 1 number and 1 uppercase letter',
      termsRequired: 'You must accept the terms to sign up',
      network: 'Connection error. Please try again.',
    },
  },
  leaderboard: {
    title: 'Leaderboard',
    open: 'View level leaderboard',
    loading: 'Loading leaderboard…',
    error: 'Could not load the leaderboard. Please try again.',
    empty: 'No records yet — be the first',
    loginRequired: 'Log in to view the leaderboard',
    loginButton: 'Log in',
    yourRecord: 'Your record',
    noRecord: "You don't have a record on this level yet",
    back: 'Back',
    col: {
      rank: '#',
      player: 'Player',
      score: 'Score',
      moves: 'Moves',
      time: 'Time',
    },
  },
};
