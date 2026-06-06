import { askLLM } from "./llm.js";

export async function reviewCode(changedLines) {
  const prompt = `
You are an AI code reviewer.

Review ONLY the provided changed lines.

Return ONLY a valid JSON array.

IMPORTANT:
- Use ONLY exact line numbers provided
- Use ONLY exact file paths provided
- Focus on bugs and logical issues
- Review only the changed code
- If no real issue exists, return []

Format:
[
  {
    "path": "file path",
    "line": 12,
    "comment": "Issue explanation",
    "suggestion": "ONLY valid replacement code"
  }
]

Changed Lines:
${JSON.stringify(changedLines, null, 2)}
`;

  try {
    const response = await askLLM(prompt);

    const cleaned = response
      .replace(/```json/gi, "")
      .replace(/```/g, "")
      .trim();

    try {
      return JSON.parse(cleaned);
    } catch {
      const match = cleaned.match(/\[[\s\S]*\]/);

      if (!match) {
        return [];
      }

      return JSON.parse(match[0]);
    }
  } catch (err) {
    console.error("Failed to parse AI response");
    console.error(err);
    return [];
  }
}