import { askLLM } from "./llm.js";
import { logError } from "./logger.js";

export function extractJsonArray(response) {
  const cleaned = String(response ?? "")
    .replace(/<think>[\s\S]*?<\/think>/gi, "")
    .replace(/```(?:json)?/gi, "")
    .trim();

  // Some models add a short sentence before or after the JSON. Find each JSON
  // array candidate and return the last valid one, which is normally the final
  // answer after any model reasoning.
  for (let start = cleaned.lastIndexOf("["); start >= 0; start = cleaned.lastIndexOf("[", start - 1)) {
    let depth = 0;
    let inString = false;
    let escaped = false;

    for (let end = start; end < cleaned.length; end += 1) {
      const character = cleaned[end];

      if (inString) {
        if (escaped) {
          escaped = false;
        } else if (character === "\\") {
          escaped = true;
        } else if (character === '"') {
          inString = false;
        }
        continue;
      }

      if (character === '"') {
        inString = true;
      } else if (character === "[") {
        depth += 1;
      } else if (character === "]") {
        depth -= 1;
        if (depth === 0) {
          try {
            const findings = JSON.parse(cleaned.slice(start, end + 1));
            if (Array.isArray(findings)) {
              return findings;
            }
          } catch {
            // Keep looking for another array candidate.
          }
          break;
        }
      }
    }
  }

  throw new Error("LLM response did not contain a valid JSON array");
}

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
    return extractJsonArray(response);
  } catch (err) {
    logError("Failed to parse LLM review response", err, {
      responsePreview: String(response ?? "").slice(0, 1_000),
      responseLength: String(response ?? "").length,
    });
    return [];
  }
}
