import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const apiKey = process.env.GEMINI_API_KEY;
const llmModel = process.env.LLM_MODEL;

const ai = new GoogleGenAI({ apiKey });

async function main() {
  const response = await ai.models.generateContent({
    model: llmModel,
    contents: "Where is the best place to live in Europe?",
  });
  console.log(response.text);
}

await main();
