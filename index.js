import { getExercises, parseExercise } from "./exercise.js";
import askAI from "./google_ai.js";
import fs from "fs";

const exercises = await getExercises(1);

let aiResponses = [];
exercises.forEach(async (element) => {
  const parsedExercise = parseExercise(element);
  console.log(parsedExercise);
  const aiResponse = await askAI(`
      I have an exercise and I will share with you, please check it out and let me know if there is any problem about it.
      Please return reponse in json format like 
      ***
      {
          id: 1,
          corrrectness: 0.9,
          suggestion: "You can improve this exercise ...."
      }
      ***
      This is the exercise: ${parseExercise}
      `);
  console.log(aiResponse);
  //   aiResponses = [...aiResponses, aiResponse];
});

const timestamp = Math.floor(Date.now());
const filename = `response_${timestamp}.json`;
fs.writeFileSync(filename, JSON.stringify(aiResponses, null, 2), "utf-8");
