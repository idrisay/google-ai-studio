import { parseExercise } from "../exercise.js";
import config from "../utils/config.js";
import { delay, extractJSON } from "../utils/functions.js";
import askAI from "./google.js";
/**
 * Generates the prompt for the AI model.
 * @param {string} exerciseId - The ID of the exercise.
 * @param {object} parsedExercise - The parsed exercise data.
 * @returns {string} The formatted prompt string.
 */
export function generateAIPrompt(exerciseId, parsedExercise) {
  // Inject the exercise ID into the instructions template
  const instructions = config.aiModelInstructions.replace(
    '"[EXERCISE_ID]"',
    JSON.stringify(exerciseId)
  );

  return `
${instructions}

This is the exercise data:
\`\`\`json
${JSON.stringify(parsedExercise, null, 2)}
\`\`\`
`;
}

/**
 * Processes a single exercise by sending it to the AI and handling the response.
 * @param {object} exercise - The raw exercise object from getExercises.
 * @param {number} index - The index of the exercise in the original array.
 * @returns {Promise<object>} - A promise resolving to the processed result or an error object.
 */
export async function processSingleExercise(exercise, index) {
  console.log("App started...");
  await delay(config.delay);
  console.log(`${config.delay} miliseconds later...`);
  const exerciseId = exercise.id || `exercise_${index}`;
  let parsedExercise;
  let aiResponseString;
  let jsonString;
  let parsedResponse;

  try {
    // 1. Parse the exercise
    try {
      parsedExercise = parseExercise(exercise);
    } catch (parseError) {
      console.error(`[${exerciseId}] Error parsing exercise data:`, parseError);
      return {
        id: exerciseId,
        status: "failed",
        error: "Exercise parsing failed",
        details: parseError.message,
      };
    }

    // 2. Generate Prompt and Call AI
    const prompt = generateAIPrompt(exerciseId, parsedExercise);
    console.log(`[${exerciseId}] Sending to AI...`);
    aiResponseString = await askAI(prompt);

    // 3. Extract JSON from AI response
    jsonString = extractJSON(aiResponseString);
    if (!jsonString) {
      console.warn(
        `[${exerciseId}] Failed to extract JSON. Raw response:`,
        aiResponseString.substring(0, 500) +
          (aiResponseString.length > 500 ? "..." : "") // Log truncated response
      );
      return {
        id: exerciseId,
        status: "failed",
        error: "AI response JSON extraction failed",
        rawResponse: aiResponseString,
      };
    }

    // 4. Parse the extracted JSON string
    try {
      parsedResponse = JSON.parse(jsonString);
    } catch (parseError) {
      console.error(
        `[${exerciseId}] Error parsing extracted JSON:`,
        parseError
      );
      console.error(`[${exerciseId}] Extracted JSON string was:`, jsonString);
      return {
        id: exerciseId,
        status: "failed",
        error: "AI response JSON parsing failed",
        details: parseError.message,
        extractedString: jsonString,
        rawResponse: aiResponseString,
      };
    }

    // 5. Validate the structure of the parsed JSON
    if (
      typeof parsedResponse.correctness !== "number" ||
      typeof parsedResponse.suggestion !== "string"
    ) {
      console.warn(
        `[${exerciseId}] AI response missing required fields (correctness, suggestion).`,
        parsedResponse
      );
      return {
        id: exerciseId,
        status: "failed",
        error: "AI response validation failed",
        details: "Missing or invalid 'correctness' or 'suggestion' field.",
        aiResponse: parsedResponse, // Include the actual response for debugging
      };
    }

    // Ensure the ID matches or record the original if the AI provided a different one
    if (!parsedResponse.id || parsedResponse.id !== exerciseId) {
      console.warn(
        `[${exerciseId}] AI response ID (${parsedResponse.id}) does not match original ID. Recording original_id.`
      );
      parsedResponse.original_id = exerciseId;
      // Optionally force the ID to match: parsedResponse.id = exerciseId;
    }

    console.log(`[${exerciseId}] Successfully processed.`);
    return {
      ...parsedResponse,
      status: "success", // Add a status field
    };
  } catch (error) {
    // Catch errors from askAI or unexpected issues
    console.error(`[${exerciseId}] Unhandled error during processing:`, error);
    return {
      id: exerciseId,
      status: "failed",
      error: "AI request or processing failed unexpectedly",
      details: error.message,
      rawResponse: aiResponseString, // Include if available
    };
  }
}
