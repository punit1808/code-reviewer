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

export async function reviewCode(reviewHunks) {
  const prompt = `
You are an AI code reviewer.

Review the supplied pull-request diff hunks for high-confidence defects only.
Unchanged lines are context. You may comment ONLY on the listed changed line
numbers for the matching file.

Return ONLY a valid JSON object in this exact shape:
{ "findings": [] }

IMPORTANT:
- Report only defects that are provably introduced by this change: runtime
  failures, incorrect API usage, security issues, data loss, broken error
  handling, or clear behavioural regressions.
- Return [] when context is insufficient to prove a defect.
- Return at most 3 findings, prioritizing the highest-impact defects.
- Ignore formatting, naming, version conventions, redundant code, and
  speculative concerns.
- Use ONLY the exact file paths and changed line numbers provided.
- Do not claim a framework, library, or API is invalid unless the hunk proves it.
- Each array item MUST contain exactly these anchor fields: "path" and "line".
  Copy "path" exactly from a Diff Hunks path field. Copy "line" as an integer
  from that hunk's changedLineNumbers list. Never use file, filePath,
  lineNumber, line_number, a range, or a line number from context.
- Do not wrap the array in an object or include any other text.

Return ONLY the JSON object. No Markdown, prose, or reasoning.

Format:
{
  "findings": [
    {
      "path": "file path",
      "line": 12,
      "comment": "Issue explanation",
      "suggestion": "ONLY valid replacement code"
    }
  ]
}

IMPORTANT:
- "comment" contains explanation
- "suggestion" contains ONLY compilable replacement code, or an empty string
  when a safe replacement cannot be proven from the supplied context
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

Diff Hunks:
${JSON.stringify(reviewHunks, null, 2)}
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
