import type { RagLabChunk } from "./rag-lab-types";

export const WIREFRAME_CHUNK_ROWS = [
  { id: "billing#c07", heading: "Refunds", tokens: 318 },
  { id: "billing#c08", heading: "Invoices", tokens: 402 },
  { id: "security#c03", heading: "Data residency", tokens: 287 },
  { id: "admin#c09", heading: "Audit logs", tokens: 365 },
] as const;

export function chunkRowsFromPreview(chunks: RagLabChunk[]) {
  if (chunks.length === 0) {
    return [...WIREFRAME_CHUNK_ROWS];
  }
  return chunks.slice(0, 12).map((chunk) => ({
    id: chunk.id,
    heading: chunk.title.replace(/^#+\s*/, "").trim() || chunk.title,
    tokens: Math.max(1, Math.round(chunk.text.length / 4)),
  }));
}
