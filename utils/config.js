export default {
  llm_model: "gemini-2.0-flash",
  exerciseCount: 2,
  delay: 300,
  categoryId: 100052,
  concurrencyLimit: 1,
  columns: ["id", "correctness", "suggestion", "status", "llm_model"],
  outputDir: "responses",
  aiModelInstructions: `
      I have an exercise and I will share with you, please check it out and let me know if there is any problem about it.
      Please return response ONLY in JSON format like this (do not include any other text or markdown fences):
  
      {
          "id": "[EXERCISE_ID]", // Replace [EXERCISE_ID] with the actual ID
          "correctness": 0.9, // A score between 0.0 and 1.0
          "suggestion": "You can improve this exercise by..." // Constructive feedback
      }
    `,
};
