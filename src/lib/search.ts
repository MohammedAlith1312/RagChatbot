// src/lib/search.ts
import { cosineDistance, desc, gt, sql } from "drizzle-orm";
import { db } from "./db.config";
import { documents } from "./db.schema";
import { getEmbeddingsMany } from "./embeddings";

export async function searchDocuments(
  query: string,
  limit = 5,
  threshold = 0.5
) {
  // Generate embedding for query
  const embedList = await getEmbeddingsMany([query]);

  if (!embedList || embedList.length === 0) {
    console.error("No embedding generated");
    return [];
  }

  const vector = embedList[0]; // The actual [x,y,z...]

  // Neon expects pgvector format: [1,2,3]
  const pgVector = `[${vector.join(",")}]`;

  const similarity = sql<number>`
    1 - (${cosineDistance(documents.embedding, pgVector)})
  `;

  const rows = await db
    .select({
      id: documents.id,
      content: documents.content,
      similarity,
    })
    .from(documents)
    .where(gt(similarity, threshold))
    .orderBy(desc(similarity))
    .limit(limit);

  return rows;
}