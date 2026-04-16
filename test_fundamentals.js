import { getExerciseContent } from './src/utils/gemini.js';
(async () => {
  const result = await getExerciseContent('fundamentals');
  console.log(result);
})();
