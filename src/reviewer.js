import { askOllama } from "./ollama.js";

export async function reviewCode(changedLines) {
  const prompt = `
You are an AI code reviewer.

Review ONLY the provided changed lines.

Return ONLY valid JSON array.

IMPORTANT:
- Use ONLY exact line numbers provided
- Use ONLY exact file paths provided
- Focus on bugs and logical issues
- Ignore formatting issues

Format:
[
  {
    "path": "file path",
    "line": 12,
    "comment": "Issue explanation"
  }
]

Changed Lines:
${JSON.stringify(changedLines, null, 2)}
`;

  const response = await askOllama(prompt);

  try {
    const cleaned = response
      .replace(/```json/g, "")
      .replace(/```/g, "")
      .trim();

    return JSON.parse(cleaned);
  } catch (err) {
    console.error("Failed to parse AI response");
    console.log(response);
    return [];
  }
}
