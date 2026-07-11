/**
 * Crédito de un asset de audio empaquetado (D5). Autor, pista y fuente son
 * CONTENIDO (no se traducen); salen tal cual de LICENCIAS.txt.
 */
export interface AudioCredit {
  /** Ruta relativa del asset en public/audio. */
  file: string;
  /** Nombre de la pista/efecto. */
  title: string;
  /** Autor al que se atribuye. */
  author: string;
  /** Fuente (URL o identificador del archivo original). */
  source: string;
  /** True si la licencia/el autor exige atribución visible. */
  attributionRequired: boolean;
}

/**
 * Créditos de los assets de audio (G1, D5), transcritos de LICENCIAS.txt. Las
 * dos pistas de XtremeFreddy (easy/medium) exigen atribución por petición del
 * autor (nombre + link); el resto es Pixabay Content License sin atribución
 * obligatoria, acreditado igual por uniformidad.
 */
export const AUDIO_CREDITS: readonly AudioCredit[] = [
  {
    file: 'music/easy.mp3',
    title: 'Game Music Loop 19',
    author: 'XtremeFreddy',
    source: 'https://pixabay.com/music/video-games-game-music-loop-19-153393/',
    attributionRequired: true,
  },
  {
    file: 'music/medium.mp3',
    title: 'Game Music Loop 18',
    author: 'XtremeFreddy',
    source: 'https://pixabay.com/music/video-games-game-music-loop-18-153392/',
    attributionRequired: true,
  },
  {
    file: 'music/hard.mp3',
    title: '80s Neon Synthwave Beat (F minor, 90bpm)',
    author: 'OhpalMusic',
    source: 'https://pixabay.com/music/upbeat-80s-neon-synthwave-beat-f-minor-90bpm-loop-176800/',
    attributionRequired: false,
  },
  {
    file: 'sfx/advanced.mp3',
    title: 'Bubble Pop 04',
    author: 'Universfield',
    source: 'Pixabay — universfield-bubble-pop-04-323580',
    attributionRequired: false,
  },
  {
    file: 'sfx/blocked.mp3',
    title: 'Error Notification 08',
    author: 'Universfield',
    source: 'Pixabay — universfield-error-notification-08-206492',
    attributionRequired: false,
  },
  {
    file: 'sfx/exited.mp3',
    title: 'Swoosh 026',
    author: 'Universfield',
    source: 'Pixabay — universfield-swoosh-026-454861',
    attributionRequired: false,
  },
  {
    file: 'sfx/won.mp3',
    title: 'Success Notification',
    author: 'Universfield',
    source: 'Pixabay — universfield-success-notification-132473',
    attributionRequired: false,
  },
  {
    file: 'sfx/lost.mp3',
    title: 'fail',
    author: 'u_8g40a9z0la',
    source: 'Pixabay — u_8g40a9z0la-fail-234710',
    attributionRequired: false,
  },
];
