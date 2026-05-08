import axios from "axios";

export async function askOllama(prompt) {
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
