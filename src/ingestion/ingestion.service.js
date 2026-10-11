const Document = require("../models/Document");
const DocumentChunk = require("../models/DocumentChunk");

const parseText = require("./adapters/text.adapter");
const parseJSON = require("./adapters/json.adapter");
const parsePDF = require("./adapters/pdf.adapter");
const parseDOCX = require("./adapters/docx.adapter");
const parseXLSX = require("./adapters/xlsx.adapter");
const parseCSV = require("./adapters/csv.adapter");

const { createChunksFromBlocks } = require("./chunker");

const { processStructuredRecords } = require("../services/structured-data.service");

const adapters = {
     text: parseText,
     json: parseJSON,
     pdf: parsePDF,
     docx: parseDOCX,
     xlsx: parseXLSX,
     csv: parseCSV,
};

const ingestDocument = async ({
     sourceType,
     data,
     metadata = {},
}) => {
     const normalizedSourceType = typeof sourceType === "string" ? sourceType.trim().toLowerCase() : "";
     const adapter = adapters[normalizedSourceType];

     if (!adapter) {
          const error = new Error(
               `Unsupported source type: ${sourceType}`
          );

          error.statusCode = 400;

          throw error;
     }

     const normalizedDocument = await adapter({
          ...metadata,

          data,
          buffer: Buffer.isBuffer(data) ? data : undefined,
          content: Buffer.isBuffer(data) ? undefined : data,
     });

     const document = await Document.create({
          title: normalizedDocument.title,

          description: normalizedDocument.description,

          sourceType: normalizedDocument.sourceType,

          sourceName: normalizedDocument.sourceName,

          sourceUrl: normalizedDocument.sourceUrl,

          nasaIdentifier: normalizedDocument.nasaIdentifier,

          metadata: normalizedDocument.metadata,

          processingStatus: "processing",
     });

     try {
          const chunks =
               createChunksFromBlocks(
               normalizedDocument.blocks
               );

          if (!chunks.length) {
               throw new Error(
                    "No usable chunks were created"
               );
          }

          const chunkDocuments = chunks.map((chunk) => ({
               documentId: document._id,

               content: chunk.content,

               chunkIndex: chunk.chunkIndex,

               sourceLocation: chunk.sourceLocation,

               metadata: chunk.metadata || {},
          }));

          await DocumentChunk.insertMany(
               chunkDocuments
          );

          let structuredResults = null;

          if (
               normalizedDocument
               .structuredRecords
               ?.length
          ) {
               structuredResults = await processStructuredRecords({
                    records: normalizedDocument.structuredRecords,
                    documentId: document._id,
               });
          }

          document.processingStatus = "completed";

          await document.save();

          return {
               document,
               chunksCreated: chunks.length,
               structuredResults,
          };
     } catch (error) {
  const cleanupErrors = [];

  try {
    await DocumentChunk.deleteMany({
      documentId: document._id,
    });
  } catch (cleanupError) {
    cleanupErrors.push(cleanupError);
  }

  document.processingStatus = "failed";
  document.processingError =
    error.message || "Document ingestion failed";

  if (cleanupErrors.length > 0) {
    document.processingError +=
      " Chunk cleanup was unsuccessful.";
  }

  try {
    await document.save();
  } catch (saveError) {
    console.error(
      "Failed to save ingestion failure status:",
      saveError.message
    );
  }

  throw error;
}

};

module.exports = {
     ingestDocument,
};