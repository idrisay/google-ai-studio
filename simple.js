import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";
import fs from "fs";

dotenv.config();

const apiKey = process.env.GEMINI_API_KEY;
const llmModel = process.env.LLM_MODEL;

const ai = new GoogleGenAI({ apiKey });

async function main() {
  const response = await ai.models.generateContent({
    model: llmModel,
    contents: "Where is the best place to live in Europe?",
  });

  const timestamp = Math.floor(Date.now());
  const filename = `response_${timestamp}.json`;

  fs.writeFileSync(filename, JSON.stringify(response, null, 2), "utf-8");

  console.log(`Response written to ${filename}`);
}

await main();
