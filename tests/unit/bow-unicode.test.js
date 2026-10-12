import { describe, expect, it } from 'vitest';
import { bowEncoder, buildVocabulary, setVocabulary } from '../../src/feature-extraction/bowEncoder';

const unicode = { tokenization: 'unicode-v1' };

describe('Unicode BoW tokenization (opt-in)', () => {
  it('preserves Spanish and Valencian letters and internal middle dots', async () => {
    const vocabulary = buildVocabulary(['PÁNICO año força cancel·lat col·laboració'], unicode);
    expect(vocabulary).toEqual(['pánico', 'año', 'força', 'cancel·lat', 'col·laboració']);
    const encoded = await bowEncoder(['AÑO força força CANCEL·LAT']);
    try {
      expect(await encoded.array()).toEqual([[0, 1, 2, 1, 0]]);
    } finally {
      encoded.dispose();
    }
  });

  it('treats composed and decomposed accents as the same word', async () => {
    const vocabulary = buildVocabulary(['café CAFÉ cafe\u0301', 'AÑO an\u0303o'], unicode);
    expect(vocabulary).toEqual(['café', 'año']);
    const encoded = await bowEncoder(['cafe\u0301 an\u0303o']);
    try {
      expect(await encoded.array()).toEqual([[1, 1]]);
    } finally {
      encoded.dispose();
    }
  });

  it('separates straight and curly apostrophes without merging words', () => {
    expect(buildVocabulary(["m'han m’han l'escola l’escola"], unicode))
      .toEqual(['m', 'han', 'l', 'escola']);
  });

  it('uses punctuation as a boundary and retains non-Latin letters and digits', () => {
    expect(buildVocabulary(['hola,món hola-món ·força· 2026 Ελληνικά 東京'], unicode))
      .toEqual(['hola', 'món', 'força', '2026', 'ελληνικά', '東京']);
  });

  it('does not collapse distinct words such as año and ao', async () => {
    buildVocabulary(['año ao força fora'], unicode);
    const encoded = await bowEncoder(['año força']);
    try {
      expect(await encoded.array()).toEqual([[1, 0, 1, 0]]);
    } finally {
      encoded.dispose();
    }
  });

  it('returns zero vectors for empty text and punctuation', async () => {
    buildVocabulary(['año'], unicode);
    const encoded = await bowEncoder(['', '  ', '?! 😀']);
    try {
      expect(await encoded.array()).toEqual([[0], [0], [0]]);
    } finally {
      encoded.dispose();
    }
  });

  it('restores the same vectors with the saved vocabulary and tokenization mode', async () => {
    const vocabulary = buildVocabulary(['cancel·lat año'], unicode);
    const saved = JSON.parse(JSON.stringify({ vocabulary, ...unicode }));
    buildVocabulary(['something else']);
    setVocabulary(saved.vocabulary, { tokenization: saved.tokenization });
    const encoded = await bowEncoder(['CANCEL·LAT an\u0303o']);
    try {
      expect(await encoded.array()).toEqual([[1, 1]]);
    } finally {
      encoded.dispose();
    }
  });

  it('keeps the legacy mode by default, including when loading after a Unicode model', async () => {
    buildVocabulary(['año'], unicode);
    expect(buildVocabulary(['PÁNICO año força cancel·lat m’han hola,món']))
      .toEqual(['pnico', 'ao', 'fora', 'cancellat', 'mhan', 'holamn']);
    buildVocabulary(['año'], unicode);
    setVocabulary(['ao', 'fora']);
    const encoded = await bowEncoder(['año força']);
    try {
      expect(await encoded.array()).toEqual([[1, 1]]);
    } finally {
      encoded.dispose();
    }
  });

  it('rejects an unknown mode without replacing the active vocabulary or mode', async () => {
    buildVocabulary(['año'], unicode);
    expect(() => buildVocabulary(['other'], { tokenization: 'unknown' })).toThrow(RangeError);
    expect(() => setVocabulary(['other'], { tokenization: 'unknown' })).toThrow(RangeError);
    const encoded = await bowEncoder(['año']);
    try {
      expect(await encoded.array()).toEqual([[1]]);
    } finally {
      encoded.dispose();
    }
  });
});
