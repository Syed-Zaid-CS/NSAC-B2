const pdfParse = require("pdf-parse");

const normalizeDocument = require("../normalizer");

const parsePDF = async ({
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
               "PDF adapter requires a file buffer"
          );
     }

     const pageTexts = [];

     const result = await pdfParse(buffer, {
          pagerender: async (pageData) => {
               const textContent =
               await pageData.getTextContent();

               const text = textContent.items
               .map((item) => item.str)
               .join(" ");

               pageTexts.push(text);

               return text;
          },
     });

     const blocks = pageTexts
     .map((content, index) => ({
          content,
          sourceLocation: {
          page: index + 1,
          },
     }))
     .filter((block) => block.content.trim());

     return normalizeDocument({
          title,
          sourceType: "pdf",
          sourceName,
          sourceUrl,
          nasaIdentifier,
          description,
          authors,
          publicationDate,
          organization,
          keywords,
          content: result.text,
          blocks,
     });
};

module.exports = parsePDF;