
const asString = (value, fallback = "") => {
  if (value === undefined || value === null) {
    return fallback;
  }

  return typeof value === "string"
    ? value.trim()
    : String(value).trim();
};

const asStringArray = (value, fieldName) => {
  if (value === undefined || value === null) {
    return [];
  }

  if (
    !Array.isArray(value) ||
    !value.every((item) => typeof item === "string")
  ) {
    const error = new Error(
      `${fieldName} must be an array of strings`
    );
    error.statusCode = 400;
    throw error;
  }

  return value.map((item) => item.trim()).filter(Boolean);
};

const normalizeDocument = ({
  title,
  sourceType,
  sourceName = "",
  sourceUrl = "",
  nasaIdentifier = "",
  description = "",
  authors = [],
  publicationDate = null,
  organization = "",
  keywords = [],
  content = "",
  blocks = [],
  structuredRecords = [],
}) => {
  const normalizedTitle = asString(title);
  const normalizedSourceType = asString(sourceType).toLowerCase();
  const normalizedContent = asString(content);

  if (!normalizedTitle) {
    const error = new Error("Document title is required");
    error.statusCode = 400;
    throw error;
  }

  if (!normalizedSourceType) {
    const error = new Error("Document source type is required");
    error.statusCode = 400;
    throw error;
  }

  if (!Array.isArray(blocks)) {
    throw new Error("Document blocks must be an array");
  }

  if (!Array.isArray(structuredRecords)) {
    throw new Error("Structured records must be an array");
  }

  const normalizedBlocks = blocks.length
    ? blocks.map((block) => ({
        ...block,
        content: asString(block?.content),
        sourceLocation: block?.sourceLocation || {},
        metadata: block?.metadata || {},
      }))
    : normalizedContent
      ? [
          {
            content: normalizedContent,
            sourceLocation: {},
            metadata: {},
          },
        ]
      : [];

  const hasUsableContent = normalizedBlocks.some(
    (block) => block.content
  );

  if (!hasUsableContent) {
    const error = new Error("Document content cannot be empty");
    error.statusCode = 400;
    throw error;
  }

  return {
    title: normalizedTitle,
    description: asString(description),
    sourceType: normalizedSourceType,
    sourceName: asString(sourceName),
    sourceUrl: asString(sourceUrl),
    nasaIdentifier: asString(nasaIdentifier),

    metadata: {
      authors: asStringArray(authors, "authors"),
      publicationDate: publicationDate || null,
      organization: asString(organization),
      keywords: asStringArray(keywords, "keywords"),
    },

    content: normalizedContent ||
      normalizedBlocks.map((block) => block.content).join("\n\n"),

    blocks: normalizedBlocks,
    structuredRecords,
  };
};

module.exports = normalizeDocument;
