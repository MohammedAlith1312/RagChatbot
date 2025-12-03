import { index, pgTable, serial, text, vector } from "drizzle-orm/pg-core";

export const documents = pgTable("documents", {
    id: serial("id").primaryKey(), 
    content: text("content").notNull(),
    embedding: vector("embedding", { dimensions: 1536 }).notNull(),
},
(table) => [
    index("embeddingIndex").using(
        "hnsw",
        table.embedding.op("vector_cosine_ops")
)
]);
export type insertDocument = typeof documents.$inferInsert;
export type selectDocument = typeof documents.$inferSelect;