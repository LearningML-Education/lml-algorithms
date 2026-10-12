# lml-algorithms

Librería de algoritmos de Machine Learning y extractores de características usada por [LearningML](https://learningml.org).

## Qué incluye

- Algoritmos de clasificación:
  - `LMLSequential` (red neuronal feed-forward con TensorFlow.js)
  - `KNN`
  - `NaiveBayes` gaussiano
- Extracción de características:
  - Numérica (`numericalEncoder`)
  - Texto tipo Bag of Words (`bowEncoder`)
  - Audio (`audioEncoder`)
  - Imagen con MobileNet (`getMobilenetEncoder`)
- Utilidades para preparación de datos, validación y matriz de confusión.

## Instalación

Este repositorio usa JavaScript + TensorFlow.js y está preparado para ejecutarse con `bun` o `npm`.

```bash
bun install
```

Alternativa:

```bash
npm install
```

## API principal

Exportada desde `src/index.js`:

- Encoders: `getMobilenetEncoder`, `numericalEncoder`, `bowEncoder`, `audioEncoder`
- Audio helpers: `collectExample`, `playRawAudio`
- Algoritmos: `LMLSequential`, `KNN`, `NaiveBayes`, `LMLModelFactory`
- Utilidades: `confusionMatrix`, `transformObjectToMapWithTensors`, `combineMapsOfTensors`, `extendArraysInObject`

## Tokenización Unicode de texto (opcional)

`buildVocabulary(texts, options)` y `setVocabulary(vocabulary, options)` aceptan
`{ tokenization: 'unicode-v1' }`. En este modo se conservan letras Unicode y números,
se normalizan los acentos a NFC y se pasa a minúsculas. La puntuación separa palabras:
`m'han` y `m’han` producen `m`, `han`; el punto medio interno se conserva en
`cancel·lat` y `col·laboració`. No se eliminan acentos ni se equiparan `año` y `ano`.

```js
const tokenization = 'unicode-v1';
const vocabulary = buildVocabulary(['Pánico año força cancel·lat'], { tokenization });
const features = await bowEncoder(['AÑO força']);
// vocabulary: ['pánico', 'año', 'força', 'cancel·lat']; features: [[0, 1, 1, 0]]
features.dispose();

// El consumidor debe guardar el modo junto al vocabulario y restaurar ambos.
const savedEncoder = JSON.parse(JSON.stringify({ vocabulary, tokenization }));
setVocabulary(savedEncoder.vocabulary, { tokenization: savedEncoder.tokenization });
```

Sin opciones se mantiene exactamente el modo anterior (`legacy`), también al cargar
un vocabulario después de haber usado Unicode. No se cambia automáticamente el editor
ni se migran modelos existentes. Un modelo entrenado con la tokenización anterior
debe seguir usando `legacy`; activar Unicode requiere reconstruir el vocabulario y
reentrenar. El consumidor que active este modo debe guardar y restaurar `tokenization`
en todos sus formatos de modelo, incluida la exportación/importación. Los modos
desconocidos lanzan `RangeError` sin cambiar el vocabulario activo.

## Tests

La estrategia de tests está definida en [`AGENTS.md`](./AGENTS.md) y se implementa con **Vitest**.

### Política de ejecución recomendada

- `npm test` (`vitest run`) es la ejecución de referencia en CI.
- `bun test` está soportado para desarrollo local rápido.
- El test de contrato de `mobilenet` se marca como `skip` en el runner nativo de Bun porque su sistema de mocks no aísla módulos de `tfjs-core` igual que Vitest; ese contrato sí se valida en `npm test`.

### Ejecutar todos los tests

```bash
bun test
```

### Ejecutar solo unitarios

```bash
bun run test:unit
```

### Ejecutar solo integración

```bash
bun run test:integration
```

### Modo watch

```bash
bun run test:watch
```

### Con npm

```bash
npm test
npm run test:unit
npm run test:integration
```

## Estructura de tests

- `tests/unit`: utilidades, encoders, factoría de modelos y tests de contrato con mocks para dependencias de navegador/modelos externos.
- `tests/integration`: flujos completos de entrenamiento, clasificación y persistencia (`localStorage`) para los algoritmos.
- `tests/setup/vitest.setup.js`: inicialización de backend de TensorFlow para tests.

## Licencia

GPL-3.0-or-later.
