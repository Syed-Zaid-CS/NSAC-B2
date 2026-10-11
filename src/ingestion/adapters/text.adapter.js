
const normalizeDocument = require("../normalizer");

const parseText = ({
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
  let textContent = "";

  if (typeof content === "string") {
    textContent = content;
  } else if (Buffer.isBuffer(buffer)) {
    textContent = buffer.toString("utf8");
  } else if (Buffer.isBuffer(data)) {
    textContent = data.toString("utf8");
  } else if (typeof data === "string") {
    textContent = data;
  }

  textContent = textContent.replace(/^\uFEFF/, "");

  return normalizeDocument({
    title,
    sourceType: "text",
    sourceName,
    sourceUrl,
    nasaIdentifier,
    description,
    authors,
    publicationDate,
    organization,
    keywords,
    content: textContent,
  });
};

module.exports = parseText;
