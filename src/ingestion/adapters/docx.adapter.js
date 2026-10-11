const mammoth = require("mammoth");

const normalizeDocument = require("../normalizer");

const parseDOCX = async ({
     buffer,
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
     if (!Buffer.isBuffer(buffer)) {
          throw new Error(
               "DOCX adapter requires a file buffer"
          );
     }

     const result = await mammoth.extractRawText({
          buffer,
     });

     const paragraphs = result.value
     .split(/\n+/)
     .map((text) => text.trim())
     .filter(Boolean);

     const blocks = paragraphs.map((content, index) => ({
          content,
          sourceLocation: {
               paragraph: index + 1,
          }})
     );

     return normalizeDocument({
          title,
          sourceType: "docx",
          sourceName,
          sourceUrl,
          nasaIdentifier,
          description,
          authors,
          publicationDate,
          organization,
          keywords,
          content: result.value,
          blocks,
     });
};

module.exports = parseDOCX;