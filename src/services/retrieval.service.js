
const mongoose = require("mongoose");
const DocumentChunk = require("../models/DocumentChunk");
const { generateEmbedding } = require("./embedding.service");

const createError = (message, statusCode) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
};

const parseTopK = (value) => {
  if (value === undefined || value === null || value === "") {
    return 5;
  }

  const topK = Number(value);

  if (!Number.isInteger(topK) || topK < 1 || topK > 10) {
    throw createError("topK must be an integer between 1 and 10", 400);
  }

  return topK;
};

const cosineSimilarity = (a, b) => {
  if (
    !Array.isArray(a) ||
    !Array.isArray(b) ||
    a.length === 0 ||
    b.length === 0 ||
    a.length !== b.length ||
    !a.every(Number.isFinite) ||
    !b.every(Number.isFinite)
  ) {
    return null;
  }

  let dotProduct = 0;
  let magnitudeA = 0;
  let magnitudeB = 0;

  for (let i = 0; i < a.length; i += 1) {
    dotProduct += a[i] * b[i];
    magnitudeA += a[i] * a[i];
    magnitudeB += b[i] * b[i];
  }

  if (magnitudeA === 0 || magnitudeB === 0) {
    return null;
  }

  const score =
    dotProduct / (Math.sqrt(magnitudeA) * Math.sqrt(magnitudeB));

  return Number.isFinite(score) ? score : null;
};

const searchRelevantChunks = async ({
  query,
  documentId,
  topK,
} = {}) => {
  if (typeof query !== "string" || !query.trim()) {
    throw createError("A non-empty query is required", 400);
  }

  const cleanQuery = query.trim();

  if (cleanQuery.length > 10000) {
    throw createError("query cannot exceed 10000 characters", 400);
  }

  const limit = parseTopK(topK);

  if (documentId !== undefined && documentId !== null && documentId !== "") {
    if (!mongoose.isValidObjectId(documentId)) {
      throw createError("Invalid documentId", 400);
    }
  }

  const filter = {
    embedding: { $exists: true, $ne: [] },
  };

  if (documentId) {
    filter.documentId = documentId;
  }

  const chunks = await DocumentChunk.find(filter)
    .select(
      "content chunkIndex sourceLocation metadata embedding documentId"
    )
    .populate(
      "documentId",
      "title sourceName sourceType sourceUrl nasaIdentifier metadata"
    )
    .lean();

  if (chunks.length === 0) {
    return {
      query: cleanQuery,
      totalEmbeddedChunksChecked: 0,
      results: [],
    };
  }

  const queryEmbedding = await generateEmbedding(
    cleanQuery,
    "RETRIEVAL_QUERY"
  );

  if (
    !Array.isArray(queryEmbedding) ||
    queryEmbedding.length !== 768 ||
    !queryEmbedding.every(Number.isFinite)
  ) {
    throw createError(
      "The query embedding provider returned an invalid vector",
      502
    );
  }

  const ranked = chunks
    .map((chunk) => ({
      chunk,
      score: cosineSimilarity(queryEmbedding, chunk.embedding),
    }))
    .filter(
      (item) =>
        item.score !== null &&
        item.chunk.documentId &&
        typeof item.chunk.content === "string"
    )
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);

  return {
    query: cleanQuery,
    totalEmbeddedChunksChecked: chunks.length,
    results: ranked.map(({ chunk, score }) => ({
      chunkId: chunk._id,
      content: chunk.content,
      relevanceScore: Number(score.toFixed(4)),
      sourceLocation: chunk.sourceLocation || {},
      metadata: chunk.metadata || {},
      document: {
        id: chunk.documentId._id,
        title: chunk.documentId.title || "",
        sourceName: chunk.documentId.sourceName || "",
        sourceType: chunk.documentId.sourceType || "",
        sourceUrl: chunk.documentId.sourceUrl || "",
        nasaIdentifier: chunk.documentId.nasaIdentifier || "",
        authors: chunk.documentId.metadata?.authors || [],
      },
    })),
  };
};

module.exports = {
  searchRelevantChunks,
  cosineSimilarity,
};
