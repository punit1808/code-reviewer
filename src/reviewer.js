import { askOllama } from "./ollama.js";

export async function reviewCode(diff) {
  const prompt = `
You are a senior software engineer reviewing a pull request.

Focus on:
- bugs
- security
- readability
- performance
- bad practices

Code diff:
${diff}
`;

  return await askOllama(prompt);
}
