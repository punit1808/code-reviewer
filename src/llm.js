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
    const groq = new OpenAI({
      apiKey: process.env.GROQ_API_KEY,
      baseURL: "https://api.groq.com/openai/v1",
    });

    const response = await groq.chat.completions.create({
      model: process.env.LLM_MODEL,
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.1,
      reasoning_format: "hidden",
    });

    return response.choices[0].message.content;
  }

  throw new Error("Invalid LLM_PROVIDER");
}