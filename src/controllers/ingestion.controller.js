const { ingestDocument } = require("../ingestion/ingestion.service");


const parseStringArray = (value, fieldName) => {
  if (value === undefined || value === null || value === "") {
    return [];
  }

  let parsed = value;

  if (typeof value === "string") {
    try {
      parsed = JSON.parse(value);
    } catch {
      const error = new Error(
        `${fieldName} must be a valid JSON array`
      );
      error.statusCode = 400;
      throw error;
    }
  }

  if (
    !Array.isArray(parsed) ||
    !parsed.every((item) => typeof item === "string")
  ) {
    const error = new Error(
      `${fieldName} must contain an array of strings`
    );
    error.statusCode = 400;
    throw error;
  }

  return parsed;
};


const ingest = async (
     req,
     res,
     next
) => {
     try {
          const {
               sourceType,
               data,
               metadata = {},
          } = req.body;

          if (!sourceType) {
               return res.status(400).json({
                    success: false,
                    message: "sourceType is required",
               });
          }

          if (data === undefined || data === null) {
               return res.status(400).json({
                    success: false,
                    message: "data is required",
               });
          }

          const result = await ingestDocument({
               sourceType,
               data,
               metadata,
          });

          return res.status(201).json({
               success: true,
               message: "NASA document ingested successfully",
               data: {
                    document: result.document,
                    chunksCreated: result.chunksCreated,
                    structuredResults: result.structuredResults,
               },
          });
     } catch (error) {
          next(error);
     }
};

const ingestFile = async (
     req,
     res,
     next
) => {
     try {
          if (!req.file) {
               return res.status(400).json({
                    success: false,
                    message: "A file is required",
               });
          }

          const sourceType =
               req.body.sourceType;

          if (!sourceType) {
               return res.status(400).json({
                    success: false,
                    message: "sourceType is required",
               });
          }

          const metadata = {
               title: req.body.title || req.file.originalname,

               sourceName: req.body.sourceName || req.file.originalname,

               sourceUrl: req.body.sourceUrl || "",

               nasaIdentifier: req.body.nasaIdentifier || "",

               description: req.body.description || "",

               authors: parseStringArray(req.body.authors, "authors"),

               organization: req.body.organization || "",

               keywords: parseStringArray(req.body.keywords, "keywords"),
          };

          const result = await ingestDocument({
               sourceType,
               data: req.file.buffer,
               metadata,
          });

          return res.status(201).json({
               success: true,
               message: "NASA file ingested successfully",
               data: {
                    document: result.document,
                    chunksCreated: result.chunksCreated,
                    structuredResults: result.structuredResults,
               },
          });
     } catch (error) {
          next(error);
     }
};

module.exports = {
     ingest,
     ingestFile,
};