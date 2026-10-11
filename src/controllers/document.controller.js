const {
     getDocuments,
     getDocumentById,
     getDocumentChunks,
     getChunkById,
} = require("../services/document.service");

const listDocuments = async (req, res, next) => {
     try {
          const page = Math.max(Number(req.query.page) || 1, 1);

          const limit = Math.min(Math.max(Number(req.query.limit) || 20, 1), 100);

          const result = await getDocuments({
               page,
               limit,
               status: req.query.status,
               sourceType: req.query.sourceType,
          });

          res.status(200).json({
               success: true,
               data: result,
          });
     } catch (error) {
          next(error);
     }
};

const getDocument = async (req, res, next) => {
     try {
          const document = await getDocumentById(req.params.id);

          res.status(200).json({
               success: true,
               data: document,
          });
     } catch (error) {
          next(error);
     }
};

const listDocumentChunks = async (req, res, next) => {
     try {
          const page = Math.max(Number(req.query.page) || 1, 1);

          const limit = Math.min(Math.max(Number(req.query.limit) || 20, 1), 100);

          const result = await getDocumentChunks({
               documentId: req.params.id,
               page,
               limit,
          });

          res.status(200).json({
               success: true,
               data: result,
          });
     } catch (error) {
          next(error);
     }
};

const getChunk = async (req, res, next) => {
     try {
          const chunk = await getChunkById(req.params.id);

          res.status(200).json({
               success: true,
               data: chunk,
          });
     } catch (error) {
          next(error);
     }
};

module.exports = {
     listDocuments,
     getDocument,
     listDocumentChunks,
     getChunk,
};