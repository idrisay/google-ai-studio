import fs from "fs/promises";
import path from "path";

export const extractJSON = (str) => {
  if (typeof str !== "string" || !str) {
    console.warn("extractJSON received non-string or empty input:", str);
    return null;
  }

  const match = str.match(/```(?:json)?\s*([\s\S]*?)\s*```/);

  if (match && match[1]) {
    return match[1].trim();
  } else {
    const firstBrace = str.indexOf("{");
    const lastBrace = str.lastIndexOf("}");
    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
      return str.substring(firstBrace, lastBrace + 1).trim();
    }
  }
  console.warn("Could not extract JSON structure from string:", str);
  return null;
};

export const saveLocalFile = async (data, outputDir) => {
    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, "-"); // ISO format timestamp
      const filename = `ai_feedback_results_${timestamp}.json`;
      const filePath = path.join(outputDir, filename);
  
      // Ensure output directory exists (async)
      await fs.mkdir(outputDir, { recursive: true });
  
      console.log(`Writing ${data.length} results to ${filePath}...`);
      await fs.writeFile(filePath, JSON.stringify(data, null, 2), "utf-8");
  
      console.log("Results saved successfully.");
    } catch (saveError) {
      console.error("Error saving results to file:", saveError);
    }
  
}

export function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

