
const mongoose = require("mongoose");
const DocumentChunk = require("../models/DocumentChunk");
const { generateEmbedding } = require("./embedding.service");

const createError = (message, statusCode) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
};

const parseLimit = (value) => {
  if (value === undefined || value === null || value === "") {
    return 20;
  }

  const limit = Number(value);

  if (!Number.isInteger(limit) || limit < 1 || limit > 20) {
    throw createError("limit must be an integer between 1 and 20", 400);
  }

  return limit;
};

const isServiceUnavailableError = (error) => {
  const status = Number(error?.statusCode ?? error?.status);

  return (
    status === 401 ||
    status === 403 ||
    status === 429 ||
    status >= 500
  );
};

const generateMissingEmbeddings = async ({
  documentId,
  limit,
} = {}) => {
  const batchLimit = parseLimit(limit);

  const filter = {
    $or: [
      { embedding: { $exists: false } },
      { embedding: { $size: 0 } },
    ],
  };

  if (documentId !== undefined && documentId !== null && documentId !== "") {
    if (!mongoose.isValidObjectId(documentId)) {
      throw createError("Invalid documentId", 400);
    }

    filter.documentId = documentId;
  }

  const chunks = await DocumentChunk.find(filter)
    .select("_id documentId content embedding")
    .sort({ createdAt: 1, _id: 1 })
    .limit(batchLimit);

  let generated = 0;
  const failures = [];
  let stoppedEarly = false;

  for (const chunk of chunks) {
    try {
      const embedding = await generateEmbedding(chunk.content);

      if (
        !Array.isArray(embedding) ||
        embedding.length !== 768 ||
        !embedding.every(Number.isFinite)
      ) {
        throw new Error("Embedding provider returned an invalid vector");
      }

      chunk.embedding = embedding;
      await chunk.save();
      generated += 1;
    } catch (error) {
      failures.push({
        chunkId: String(chunk._id),
        message: error.message || "Embedding generation failed",
      });

      if (isServiceUnavailableError(error)) {
        stoppedEarly = true;
        break;
      }
    }
  }

  const remainingCount = await DocumentChunk.countDocuments(filter);

  return {
    requested: chunks.length,
    generated,
    failed: failures.length,
    failures,
    remainingCount,
    remainingUnknown: remainingCount > 0,
    stoppedEarly,
  };
};

module.exports = { generateMissingEmbeddings };
