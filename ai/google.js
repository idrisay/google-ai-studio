import { GoogleGenerativeAI } from "@google/generative-ai";
import fs from "fs";
import mime from "mime-types";
import dotenv from "dotenv";
import config from "../utils/config.js";

dotenv.config();

const apiKey = process.env.GEMINI_API_KEY;
const llmModel = config.llm_model;;
const genAI = new GoogleGenerativeAI(apiKey);

const model = genAI.getGenerativeModel({
  model: llmModel,
});

const generationConfig = {
  temperature: 1,
  topP: 0.95,
  topK: 64,
  maxOutputTokens: 65536,
  responseModalities: [],
  responseMimeType: "text/plain",
};

export default async function askAI(prompt) {
  const chatSession = model.startChat({
    generationConfig,
    history: [],
  });

  const result = await chatSession.sendMessage(prompt);
  // TODO: Following code needs to be updated for client-side apps.
  const candidates = result.response.candidates;
  for (
    let candidate_index = 0;
    candidate_index < candidates.length;
    candidate_index++
  ) {
    for (
      let part_index = 0;
      part_index < candidates[candidate_index].content.parts.length;
      part_index++
    ) {
      const part = candidates[candidate_index].content.parts[part_index];
      if (part.inlineData) {
        try {
          const filename = `output_${candidate_index}_${part_index}.${mime.extension(
            part.inlineData.mimeType
          )}`;
          fs.writeFileSync(
            filename,
            Buffer.from(part.inlineData.data, "base64")
          );
          console.log(`Output written to: ${filename}`);
        } catch (err) {
          console.error(err);
        }
      }
    }
  }
  // console.log(result.response.text());
  return result.response.text();
}
