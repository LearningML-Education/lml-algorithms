/* @vitest-environment jsdom */
import { expect, it } from 'vitest';
import { bowEncoder, buildVocabulary, setVocabulary } from '../../src/feature-extraction/bowEncoder';
import { NaiveBayes } from '../../src/algorithms/naive-bayes';
import { ensureLocalStorage } from '../setup/browserPolyfills';

it('classifies distinct Unicode words and preserves predictions after a model round-trip', async () => {
  ensureLocalStorage();
  localStorage.clear();
  const options = { tokenization: 'unicode-v1' };
  const words = ['año', 'año año', 'an\u0303o', 'ao', 'ao ao', 'AO'];
  const vocabulary = buildVocabulary(words, options);
  expect(vocabulary).toEqual(['año', 'ao']);
  const features = new Map([
    ['year', await bowEncoder(words.slice(0, 3))],
    ['other', await bowEncoder(words.slice(3))]
  ]);
  const input = await bowEncoder(['AÑO']);
  let restoredInput;
  try {
    const model = new NaiveBayes();
    await model.train(features);
    const expectedVector = await input.array();
    const before = await model.classify(input);
    expect(before[0][0]).toBe('year');
    await model.saveToLocalstorage({ name: 'unicode-round-trip', type: 'text' }, {
      vocabulary,
      ...options
    });

    // Simulate another legacy model being used before loading this one.
    setVocabulary(['ao']);
    const restored = new NaiveBayes();
    const { lmlModelMetadata } = await restored.loadFromLocalstorage();
    expect(lmlModelMetadata.encoder.tokenization).toBe('unicode-v1');
    setVocabulary(lmlModelMetadata.encoder.vocabulary, {
      tokenization: lmlModelMetadata.encoder.tokenization
    });
    restoredInput = await bowEncoder(['AN\u0303O']);
    expect(await restoredInput.array()).toEqual(expectedVector);
    const after = await restored.classify(restoredInput);
    expect(after).toEqual(before);
  } finally {
    for (const tensor of features.values()) tensor.dispose();
    input.dispose();
    restoredInput?.dispose();
    localStorage.clear();
  }
});
