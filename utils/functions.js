import fs from "fs";
import path from "path";
import ExcelJS from "exceljs";
import fsPromises from "fs/promises";
import config from "../utils/config.js";

export const extractJSON = (str) => {
  if (typeof str !== "string" || !str) {
    console.warn("extractJSON received non-string or empty input:", str);
    return null;
  }

  const match = str.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
  if (match && match[1]) return match[1].trim();

  const firstBrace = str.indexOf("{");
  const lastBrace = str.lastIndexOf("}");
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    return str.substring(firstBrace, lastBrace + 1).trim();
  }

  console.warn("Could not extract JSON structure from string:", str);
  return null;
};

export const saveLocalFile = async (data, outputDir) => {
  try {
    const filename = "ai_feedback_results.xlsx";
    const filePath = path.join(outputDir, filename);
    await fsPromises.mkdir(outputDir, { recursive: true });

    const workbook = new ExcelJS.Workbook();
    let worksheet;

    const fileExists = await fsPromises
      .access(filePath)
      .then(() => true)
      .catch(() => false);

    if (fileExists) {
      await workbook.xlsx.readFile(filePath);
      worksheet =
        workbook.getWorksheet("Feedback") || workbook.addWorksheet("Feedback");
    } else {
      worksheet = workbook.addWorksheet("Feedback");
      worksheet.addRow(config.columns);
    }

    // Collect existing IDs to avoid duplicates
    const existingIds = new Set();
    worksheet.eachRow((row, rowIndex) => {
      if (rowIndex === 1) return; // skip header
      const idCell = row.getCell(config.columns.indexOf("id") + 1).value;
      if (idCell) existingIds.add(String(idCell));
    });

    // Add new rows with correct column mapping
    for (const entry of data) {
      if (!entry.id || existingIds.has(String(entry.id))) continue;

      // 👉 Inject config.llm_model into the entry if required
      if (config.columns.includes("llm_model")) {
        entry.llm_model = config.llm_model;
      }

      const rowData = config.columns.map((header) => entry[header] ?? "");
      worksheet.addRow(rowData);
    }

    await workbook.xlsx.writeFile(filePath);
    console.log(
      `✅ Saved to Excel with ${config.columns.length} fixed headers: ${filePath}`
    );
  } catch (err) {
    console.error("❌ Error saving to Excel:", err);
  }
};

export async function loadProcessedExerciseIds(filePath) {
  const processedIds = new Set();
  console.log("filePath", filePath);

  try {
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(filePath);

    const worksheet = workbook.getWorksheet("Feedback");
    if (!worksheet) {
      console.warn("⚠️ 'Feedback' sheet not found.");
      return processedIds;
    }

    // Get headers from first row
    const headerRow = worksheet.getRow(1);
    const headers = headerRow.values.slice(1); // skip index 0
    const idIndex = headers.indexOf("id") + 1;
    const statusIndex = headers.indexOf("status") + 1;

    if (idIndex === 0 || statusIndex === 0) {
      console.warn("⚠️ Could not find 'id' or 'status' columns.");
      return processedIds;
    }

    worksheet.eachRow((row, index) => {
      if (index === 1) return; // skip header
      const id = row.getCell(idIndex).value;
      const status = row.getCell(statusIndex).value;
      if (status === "success" && id != null) {
        processedIds.add(String(id));
      }
    });

    console.log(`✅ Loaded ${processedIds.size} processed IDs from Excel.`);
    return processedIds;
  } catch (err) {
    console.error("❌ Error loading IDs:", err);
    return processedIds;
  }
}

export function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
