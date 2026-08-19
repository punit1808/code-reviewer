import { askLLM } from "./llm.js";

export async function reviewCode(changedLines) {
  const prompt = `
You are an AI code reviewer.

Review ONLY the provided changed lines.

Return ONLY a valid JSON array.
Do not include markdown.
Do not include <think> tags.
Do not include explanations before or after the JSON.

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

    if (typeof response !== "string") {
      throw new Error("LLM returned a non-string response");
    }

    console.log("Raw AI response:", JSON.stringify(response));

    const cleaned = response
      .replace(/<think>[\s\S]*?<\/think>/gi, "")
      .replace(/```json/gi, "")
      .replace(/```/g, "")
      .trim();

    console.log("Cleaned AI response:", JSON.stringify(cleaned));

    try {
      const parsed = JSON.parse(cleaned);

      if (!Array.isArray(parsed)) {
        throw new Error("AI response is not a JSON array");
      }

      return parsed;
    } catch (parseError) {
      console.error("Failed to parse AI JSON");
      console.error("Cleaned AI response:", cleaned);
      throw parseError;
    }
  } catch (err) {
    console.error("AI code review failed");
    console.error(err);

    // Do NOT return [] here.
    // [] means "AI reviewed the code and found no issues".
    throw err;
  }
}