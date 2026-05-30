import { askLLM } from "./llm.js";

export async function reviewCode(changedLines) {
  const prompt = `
You are an AI code reviewer.

Review ONLY the provided changed lines.

Return ONLY a valid JSON array.

IMPORTANT:
- Use ONLY exact line numbers provided
- Use ONLY exact file paths provided
- Focus ONLY on real bugs and logical issues
- Review only the changed code
- If no real issue exists, return []

Return ONLY valid JSON.

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

DO NOT report any of the following:

- Missing newline at end of file
- Extra newline at end of file
- Trailing whitespace
- Blank line count changes
- Formatting-only changes
- Indentation changes
- Line ending differences (LF vs CRLF)
- Import ordering
- Code style preferences
- Naming preferences
- Linting suggestions
- Refactoring suggestions
- Readability improvements
- Code organization suggestions
- Performance optimizations unless they fix a bug

ONLY report:

- Definite bugs
- Logic errors
- Runtime errors
- Security vulnerabilities
- Incorrect API usage
- Null or undefined access risks
- Resource leaks
- Concurrency issues
- Broken edge cases
- Data corruption risks

Before reporting an issue, verify ALL of the following:

1. The changed line introduces a real bug.
2. The bug can realistically occur at runtime.
3. The issue exists in the provided code, not hypothetically.
4. The fix can be applied directly.
5. The issue is not style-related.
6. The issue is not a preference.
7. The issue is not about whitespace.
8. The issue is not about blank lines.
9. The issue is not about file-ending newlines.

If any condition fails, do not report the issue.

If uncertain whether something is a bug, do not report it.

If the code is correct, return:

[]

Changed Lines:
${JSON.stringify(changedLines, null, 2)}
`;

  const response = await askLLM(prompt);

  try {
    const cleaned = response
      .replace(/```json/g, "")
      .replace(/```/g, "")
      .trim();

    const parsed = JSON.parse(cleaned);

    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed.filter(
      (item) =>
        item &&
        typeof item.path === "string" &&
        typeof item.line === "number" &&
        typeof item.comment === "string" &&
        typeof item.suggestion === "string"
    );
  } catch (err) {
    console.error("Failed to parse AI response");
    console.log(response);
    return [];
  }
}
