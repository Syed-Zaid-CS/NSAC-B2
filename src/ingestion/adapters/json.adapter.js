
const normalizeDocument = require("../normalizer");

const objectToText = (data) => {
  if (Buffer.isBuffer(data)) {
    data = data.toString("utf8");
  }

  if (typeof data === "string") {
    const raw = data.replace(/^\uFEFF/, "").trim();

    if (!raw) {
      throw new Error("JSON content cannot be empty");
    }

    try {
      return JSON.stringify(JSON.parse(raw), null, 2);
    } catch {
      const error = new Error(
        "Invalid JSON content. Please provide valid JSON."
      );
      error.statusCode = 400;
      throw error;
    }
  }

  if (
    data === null ||
    typeof data !== "object"
  ) {
    throw new Error(
      "JSON content must be a JSON object or array"
    );
  }

  return JSON.stringify(data, null, 2);
};

const parseJSON = ({
  data,
  buffer,
  content,
  title,
  sourceName = "",
  sourceUrl = "",
  nasaIdentifier = "",
  description = "",
  authors = [],
  publicationDate = null,
  organization = "",
  keywords = [],
}) => {
  const input =
    data !== undefined
      ? data
      : buffer !== undefined
        ? buffer
        : content;

  const normalizedContent = objectToText(input);

  return normalizeDocument({
    title,
    sourceType: "json",
    sourceName,
    sourceUrl,
    nasaIdentifier,
    description,
    authors,
    publicationDate,
    organization,
    keywords,
    content: normalizedContent,
  });
};

module.exports = parseJSON;
