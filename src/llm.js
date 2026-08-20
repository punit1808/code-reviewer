import axios from "axios";
import OpenAI from "openai";

export async function askLLM(prompt) {
  const provider = process.env.LLM_PROVIDER;

  // LOCAL OLLAMA
  if (provider === "ollama") {
    const response = await axios.post(
      `${process.env.OLLAMA_URL}/api/generate`,
      {
        model: "qwen2.5-coder:7b",
        prompt,
        stream: false,
      }
    );

    return response.data.response;
  }

  // GROQ CLOUD
  if (provider === "groq") {
    const model = process.env.LLM_MODEL;
    const groq = new OpenAI({
      apiKey: process.env.GROQ_API_KEY,
      baseURL: "https://api.groq.com/openai/v1",
    });

    const request = {
      model,
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.1,
      // Enforce JSON at the API level so reasoning text cannot consume the
      // response before the reviewer produces machine-readable findings.
      response_format: { type: "json_object" },
      max_completion_tokens: 1_200,
    };

    // Qwen reasoning models otherwise emit their chain of thought before the
    // answer, which can exhaust a free-tier completion budget.
    if (model?.toLowerCase().includes("qwen")) {
      request.reasoning_effort = "none";
    }

    const response = await groq.chat.completions.create(request);

    return response.choices[0].message.content;
  }

  throw new Error("Invalid LLM_PROVIDER");
}
