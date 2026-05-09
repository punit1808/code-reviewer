import { askLLM } from "./llm.js";

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

Return ONLY valid JSON array.

Format:
[
  {
    "path": "file path",
    "line": 12,
    "comment": "Issue explanation",
    "suggestion": "ONLY valid replacement code"
  }
]

IMPORTANT:
- "comment" contains explanation
- "suggestion" contains ONLY compilable replacement code
- NO markdown in suggestion
- NO explanations in suggestion
- NO natural language in suggestion
- suggestion must be directly applicable

CRITICAL RULES FOR SUGGESTIONS:

- Suggestions are applied directly into the source code automatically
- Return ONLY executable production-ready code
- Do NOT use placeholders like:
  - someCondition
  - variableName
  - TODO
  - yourCodeHere
- Do NOT change business logic unless absolutely required
- Do NOT suggest semantically equivalent replacements
- Do NOT rewrite intentional logic
- Do NOT generate hypothetical fixes
- Suggest only minimal safe code changes
- Suggested code must compile as-is
- Suggested code must preserve existing behavior unless fixing a real bug

Changed Lines:
${JSON.stringify(changedLines, null, 2)}
`;

  const response = await askLLM(prompt);

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
