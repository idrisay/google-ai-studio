import { getExercises, parseExercise } from "./exercise.js";
import { extractJSON } from "./utils/functions.js";
import askAI from "./google_ai.js";
import fs from "fs";
import path from "path";

async function processExercises() {
  try {
    const exercises = await getExercises(10, 100047);
    console.log(`Fetched ${exercises.length} exercises.`);

    if (!Array.isArray(exercises) || exercises.length === 0) {
      console.log("No exercises fetched or invalid format. Exiting.");
      return;
    }

    const resultsPromises = exercises.map(async (element, index) => {
      try {
        const parsedExercise = parseExercise(element);
        const exerciseId = element.id || `exercise_${index}`;
        console.log(`Sending exercise ${exerciseId} to AI...`);

        const prompt = `
            I have an exercise and I will share with you, please check it out and let me know if there is any problem about it.
            Please return response ONLY in JSON format like this (do not include any other text or markdown fences):

            {
                "id": ${JSON.stringify(exerciseId)},
                "correctness": 0.9,
                "suggestion": "You can improve this exercise by..."
            }

            This is the exercise data:
            \`\`\`
            ${JSON.stringify(parsedExercise, null, 2)}
            \`\`\`
            `;
        const aiResponseString = await askAI(prompt);
        const jsonString = extractJSON(aiResponseString);

        if (!jsonString) {
          console.error(
            `Error extracting JSON for exercise ${exerciseId}. Raw response:`,
            aiResponseString
          );
          return {
            id: exerciseId,
            error: "Failed to extract JSON",
            rawResponse: aiResponseString,
          };
        }

        try {
          const parsedResponse = JSON.parse(jsonString);
          console.log(`Successfully processed exercise ${exerciseId}`);
          if (!parsedResponse.id) {
            parsedResponse.original_id = exerciseId;
          }
          return parsedResponse;
        } catch (parseError) {
          console.error(
            `Error parsing JSON for exercise ${exerciseId}:`,
            parseError
          );
          console.error("Extracted JSON string was:", jsonString);
          return {
            id: exerciseId,
            error: "Failed to parse JSON",
            extractedString: jsonString,
            rawResponse: aiResponseString,
          };
        }
      } catch (aiError) {
        const exerciseId = element.id || `exercise_${index}`;
        console.error(
          `Error processing exercise ${exerciseId} with AI:`,
          aiError
        );
        return {
          id: exerciseId,
          error: "AI request failed",
          details: aiError.message,
        };
      }
    });

    console.log("Waiting for AI responses...");
    const aiResponses = await Promise.all(resultsPromises);
    console.log("All AI responses received.", aiResponses);

    const validResponses = aiResponses.filter(
      (response) => response && !response.error
    );
    const errorResponses = aiResponses.filter(
      (response) => response && response.error
    );

    console.log(
      `Processed ${validResponses.length} successfully, ${errorResponses.length} failed.`
    );

    if (errorResponses.length > 0) {
      console.log(
        "Errors occurred for the following exercises:",
        errorResponses.map((e) => e.id)
      );
    }

    const timestamp = Math.floor(Date.now());
    const filename = `ai_feedback_results_${timestamp}.json`;
    const outputDir = "responses";
    const filePath = path.join(outputDir, filename);

    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir);
    }

    console.log(`Writing results to ${outputDir}/${filename}...`);
    fs.writeFileSync(filePath, JSON.stringify(aiResponses, null, 2), "utf-8");

    console.log("Processing complete. Results saved.");
  } catch (error) {
    console.error("An unexpected error occurred in the main process:", error);
  }
}

processExercises();
