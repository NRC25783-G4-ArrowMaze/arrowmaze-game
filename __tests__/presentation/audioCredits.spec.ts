import { AUDIO_CREDITS } from '../../src/presentation/audio/audioCredits';

describe('audioCredits — atribución de assets (G1, D5)', () => {
  it('cubre los 8 assets empaquetados', () => {
    expect(AUDIO_CREDITS).toHaveLength(8);
  });

  it('las dos pistas de XtremeFreddy (easy/medium) exigen atribución con autor y link', () => {
    const xtremeFreddy = AUDIO_CREDITS.filter((c) => c.author === 'XtremeFreddy');
    expect(xtremeFreddy.map((c) => c.file)).toEqual(['music/easy.mp3', 'music/medium.mp3']);
    for (const credit of xtremeFreddy) {
      expect(credit.attributionRequired).toBe(true);
      expect(credit.source).toMatch(/^https:\/\/pixabay\.com\//);
    }
  });

  it('cada crédito tiene archivo, título, autor y fuente no vacíos', () => {
    for (const credit of AUDIO_CREDITS) {
      expect(credit.file.length).toBeGreaterThan(0);
      expect(credit.title.length).toBeGreaterThan(0);
      expect(credit.author.length).toBeGreaterThan(0);
      expect(credit.source.length).toBeGreaterThan(0);
    }
  });
});
