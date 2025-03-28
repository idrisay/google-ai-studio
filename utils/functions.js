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
