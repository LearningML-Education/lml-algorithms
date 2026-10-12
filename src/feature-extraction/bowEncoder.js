import * as tf from '@tensorflow/tfjs';

let vocabulary;
let tokenization = 'legacy';

function getTokenization(options) {
    const mode = options.tokenization ?? 'legacy';
    if (mode !== 'legacy' && mode !== 'unicode-v1') {
        throw new RangeError(`Unsupported BoW tokenization: ${mode}`);
    }
    return mode;
}

// Función para limpiar y separar el texto en palabras
function tokenize(text, mode = tokenization) {
    if (mode === 'unicode-v1') {
        // NFC conserva los acentos; la puntuación separa palabras y la ela geminada se conserva.
        return text.normalize('NFC').toLowerCase()
            .match(/[\p{L}\p{N}][\p{L}\p{M}\p{N}]*(?:·\p{L}[\p{L}\p{M}\p{N}]*)*/gu) || [];
    }
    return text.toLowerCase().replace(/[^a-z0-9\s]/g, '').split(/\s+/);
}

// Función para construir el vocabulario a partir de los textos
function buildVocabulary(texts, options = {}) {
    const mode = getTokenization(options);
    const _vocabulary = new Set();
    texts.forEach(text => {
        const tokens = tokenize(text, mode);
        tokens.forEach(token => {
            if (token) _vocabulary.add(token);
        });
    });
    vocabulary = Array.from(_vocabulary);
    tokenization = mode;
    return vocabulary;
}

function setVocabulary(_vocabulary, options = {}){
    const mode = getTokenization(options);
    vocabulary = _vocabulary;
    tokenization = mode;
}

// Función para codificar los textos en vectores BoW
function bowEncoder(texts) {    
    const vectors = texts.map(text => {
        const tokens = tokenize(text);
        const vector = Array(vocabulary.length).fill(0);
        tokens.forEach(token => {
            if (token) {
                const index = vocabulary.indexOf(token);
                if (index !== -1) parseFloat(vector[index]++);
            }
        });
        return vector;
    });

    return Promise.resolve(tf.stack(vectors));
}

export {
    buildVocabulary,
    setVocabulary,
    bowEncoder
}
