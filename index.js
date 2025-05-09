import path from "path";
import { getExercises } from "./exercise.js";
import { loadProcessedExerciseIds, saveLocalFile } from "./utils/functions.js";
import pLimit from "p-limit";
import config from "./utils/config.js";
import { processSingleExercise } from "./ai/functiions.js";

// --- Main Processing Logic ---
async function processExercises() {
  console.log(
    `Starting exercise processing: Count=${config.exerciseCount}, Category=${config.categoryId}, Concurrency=${config.concurrencyLimit}`
  );

  const csvFilePath = path.join(config.outputDir, "ai_feedback_results.xlsx");
  const processedIds = await loadProcessedExerciseIds(csvFilePath);
  console.log('processedIds', processedIds);

  let exercises;
  try {
    exercises = await getExercises(config.exerciseCount, processedIds, config.categoryId);
    console.log(`Fetched ${exercises?.length || 0} exercises.`);

    if (!Array.isArray(exercises) || exercises.length === 0) {
      console.log("No exercises fetched or invalid format. Exiting.");
      return;
    }
    console.log(
      `Filtered exercises: ${exercises.length} remaining after excluding processed ones.`
    );

    if (exercises.length === 0) {
      console.log("No new exercises to process. Exiting.");
      return;
    }
  } catch (fetchError) {
    console.error("Fatal Error: Failed to fetch exercises:", fetchError);
    return; // Stop execution if fetching fails
  }

  // Create a limiter
  const limit = pLimit(config.concurrencyLimit);

  // Create tasks for the limiter
  const processingTasks = exercises.map((exercise, index) =>
    limit(() => processSingleExercise(exercise, index))
  );

  console.log(
    `Processing ${exercises.length} exercises with ${config.concurrencyLimit} concurrent tasks...`
  );
  // Execute tasks with concurrency limit
  const results = await Promise.all(processingTasks);
  console.log("All processing tasks completed.");

  // --- Results Handling ---
  const successfulResults = results.filter((r) => r.status === "success");
  const failedResults = results.filter((r) => r.status === "failed");

  console.log(
    `Processing Summary: ${successfulResults.length} succeeded, ${failedResults.length} failed.`
  );

  if (failedResults.length > 0) {
    console.warn(
      "Failures occurred for the following exercise IDs:",
      failedResults.map((e) => e.id)
    );
  }

  saveLocalFile(results, config.outputDir);

  console.log("Processing complete.");
}

// --- Script Execution ---
processExercises().catch((error) => {
  console.error("An unexpected critical error occurred:", error);
  process.exit(1); // Exit with error code
});
