
const mongoose = require("mongoose");
const Document = require("../models/Document");
const DocumentChunk = require("../models/DocumentChunk");

const createError = (message, statusCode) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
};

const parsePagination = (page, limit) => {
  const parseInteger = (value, field, defaultValue, max) => {
    if (value === undefined || value === null || value === "") {
      return defaultValue;
    }

    const parsed = Number(value);

    if (
      !Number.isSafeInteger(parsed) ||
      parsed < 1 ||
      parsed > max
    ) {
      throw createError(
        `${field} must be an integer between 1 and ${max}`,
        400
      );
    }

    return parsed;
  };

  return {
    page: parseInteger(page, "page", 1, 1000000),
    limit: parseInteger(limit, "limit", 20, 100),
  };
};

const validateObjectId = (id, fieldName = "ID") => {
  if (!mongoose.isValidObjectId(id)) {
    throw createError(`Invalid ${fieldName}`, 400);
  }
};

const validateDocumentFilters = ({ status, sourceType }) => {
  const allowedStatuses = [
    "pending",
    "processing",
    "completed",
    "failed",
  ];

  const allowedSourceTypes = [
    "pdf",
    "docx",
    "xlsx",
    "csv",
    "json",
    "html",
    "text",
    "api",
    "other",
  ];

  const filter = {};

  if (status !== undefined && status !== "") {
    if (
      typeof status !== "string" ||
      !allowedStatuses.includes(status)
    ) {
      throw createError("Invalid document status filter", 400);
    }

    filter.processingStatus = status;
  }

  if (sourceType !== undefined && sourceType !== "") {
    if (typeof sourceType !== "string") {
      throw createError("Invalid sourceType filter", 400);
    }

    const normalizedSourceType = sourceType.trim().toLowerCase();

    if (!allowedSourceTypes.includes(normalizedSourceType)) {
      throw createError("Invalid sourceType filter", 400);
    }

    filter.sourceType = normalizedSourceType;
  }

  return filter;
};

const getDocuments = async ({
  page,
  limit,
  status,
  sourceType,
} = {}) => {
  const pagination = parsePagination(page, limit);
  const filter = validateDocumentFilters({ status, sourceType });

  const skip = (pagination.page - 1) * pagination.limit;

  const [documents, total] = await Promise.all([
    Document.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(pagination.limit)
      .lean(),

    Document.countDocuments(filter),
  ]);

  return {
    documents,
    pagination: {
      page: pagination.page,
      limit: pagination.limit,
      total,
      totalPages: Math.ceil(total / pagination.limit),
    },
  };
};

const getDocumentById = async (documentId) => {
  validateObjectId(documentId, "document ID");

  const document = await Document.findById(documentId).lean();

  if (!document) {
    throw createError("Document not found", 404);
  }

  return document;
};

const getDocumentChunks = async ({
  documentId,
  page,
  limit,
} = {}) => {
  validateObjectId(documentId, "document ID");

  const pagination = parsePagination(page, limit);

  const document = await Document.findById(documentId)
    .select("_id title sourceType processingStatus processingError createdAt updatedAt")
    .lean();

  if (!document) {
    throw createError("Document not found", 404);
  }

  const filter = { documentId };
  const skip = (pagination.page - 1) * pagination.limit;

  const [chunks, total] = await Promise.all([
    DocumentChunk.find(filter)
      .sort({ chunkIndex: 1 })
      .skip(skip)
      .limit(pagination.limit)
      .select(
        "_id documentId content chunkIndex sourceLocation metadata createdAt updatedAt"
      )
      .lean(),

    DocumentChunk.countDocuments(filter),
  ]);

  return {
    document,
    chunks,
    pagination: {
      page: pagination.page,
      limit: pagination.limit,
      total,
      totalPages: Math.ceil(total / pagination.limit),
    },
  };
};

const getChunkById = async (chunkId) => {
  validateObjectId(chunkId, "chunk ID");

  const chunk = await DocumentChunk.findById(chunkId)
    .populate(
      "documentId",
      "title description sourceName sourceType sourceUrl nasaIdentifier metadata processingStatus"
    )
    .lean();

  if (!chunk) {
    throw createError("Document chunk not found", 404);
  }

  return chunk;
};

module.exports = {
  getDocuments,
  getDocumentById,
  getDocumentChunks,
  getChunkById,
};
