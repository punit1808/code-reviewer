import { askLLM } from "./llm.js";

export async function reviewCode(changedLines) {
  const prompt = `
You are an AI code reviewer.

Review ONLY the provided changed lines.

Return ONLY a valid JSON array.
Do not use markdown fences.
Do not include any text before or after the JSON.

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

  const response = await askLLM(prompt);

  if (typeof response !== "string") {
    throw new Error("LLM returned a non-string response");
  }

  const cleaned = response
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();

  console.log("Raw AI response:", JSON.stringify(response));
  console.log("Cleaned AI response:", JSON.stringify(cleaned));

  try {
    const findings = JSON.parse(cleaned);

    if (!Array.isArray(findings)) {
      throw new Error("AI response must be a JSON array");
    }

    return findings;
  } catch (err) {
    console.error("Invalid JSON returned by AI");
    console.error("AI response:", cleaned);
    throw err;
  }
}