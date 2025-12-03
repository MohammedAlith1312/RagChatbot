import { embed, embedMany } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';


const openrouter = createOpenAI({
  apiKey: process.env.OPENROUTER_API_KEY|| '', 
  baseURL: 'https://openrouter.ai/api/v1',
  headers: {
    "HTTP-Referer": "http://localhost:3000",
    "X-Title": "ragchatbot",
  }
});

export async function getEmbeddings(text: string) {
  const input = text.replace(/\n/g, " ");

  const { embedding } = await embed({
    model: openrouter.embedding("openai/text-embedding-3-small"),
    value: input,
  });

  return embedding;
}

export async function getEmbeddingsMany(texts: string[]) {
  const inputs = texts.map((text) => text.replace(/\n/g, " "));

  const { embeddings } = await embedMany({
    model: openrouter.embedding("openai/text-embedding-3-small"),
    values: inputs,
  });

  return embeddings;
}