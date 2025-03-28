import { getExercises, parseExercise } from "./exercise.js";
import askAI from "./google_ai.js";
import fs from "fs";

const extractJSON = (str) => {
  if (typeof str !== 'string' || !str) {
    console.warn("extractJSON received non-string or empty input:", str);
    return null; 
  }

  const match = str.match(/```(?:json)?\s*([\s\S]*?)\s*```/);

  if (match && match[1]) {
    return match[1].trim();
  } else {
    const firstBrace = str.indexOf('{');
    const lastBrace = str.lastIndexOf('}');
    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
        return str.substring(firstBrace, lastBrace + 1).trim();
    }
  }
  console.warn("Could not extract JSON structure from string:", str);
  return null; 
};

async function processExercises() {
  try {
    const exercises = await getExercises(10, 100010);
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
        // Call the AI
        const aiResponseString = await askAI(prompt);

        // Extract the JSON part from the response string
        const jsonString = extractJSON(aiResponseString);

        if (!jsonString) {
            console.error(`Error extracting JSON for exercise ${exerciseId}. Raw response:`, aiResponseString);
            return { id: exerciseId, error: "Failed to extract JSON", rawResponse: aiResponseString };
        }

        // Try to parse the extracted JSON string
        try {
            const parsedResponse = JSON.parse(jsonString);
            console.log(`Successfully processed exercise ${exerciseId}`);
            // Optionally add the original exercise ID if the AI didn't include it reliably
            if (!parsedResponse.id) {
                parsedResponse.original_id = exerciseId;
            }
            return parsedResponse;
        } catch (parseError) {
            console.error(`Error parsing JSON for exercise ${exerciseId}:`, parseError);
            console.error("Extracted JSON string was:", jsonString);
            return { id: exerciseId, error: "Failed to parse JSON", extractedString: jsonString, rawResponse: aiResponseString };
        }

      } catch (aiError) {
        const exerciseId = element.id || `exercise_${index}`;
        console.error(`Error processing exercise ${exerciseId} with AI:`, aiError);
        return { id: exerciseId, error: "AI request failed", details: aiError.message };
      }
    });

    // Wait for all promises to resolve
    console.log("Waiting for AI responses...");
    const aiResponses = await Promise.all(resultsPromises);
    console.log("All AI responses received.", aiResponses);

    // Filter out potential nulls or errors if needed, though errors are returned as objects now
    const validResponses = aiResponses.filter(response => response && !response.error);
    const errorResponses = aiResponses.filter(response => response && response.error);

    console.log(`Processed ${validResponses.length} successfully, ${errorResponses.length} failed.`);

    if (errorResponses.length > 0) {
        console.log("Errors occurred for the following exercises:", errorResponses.map(e => e.id));
        // Optionally write errors to a separate file or log them in detail
    }

    // --- Write the final results to a file ---
    const timestamp = Math.floor(Date.now());
    const filename = `ai_feedback_results_${timestamp}.json`;

    console.log(`Writing results to ${filename}...`);
    // Write the array of parsed response objects (or all results including errors)
    fs.writeFileSync(filename, JSON.stringify(aiResponses, null, 2), "utf-8"); // Writing all results
    // Or write only valid ones: fs.writeFileSync(filename, JSON.stringify(validResponses, null, 2), "utf-8");

    console.log("Processing complete. Results saved.");

  } catch (error) {
    // Catch errors from getExercises or other top-level issues
    console.error("An unexpected error occurred in the main process:", error);
  }
}

// Run the main function
processExercises();