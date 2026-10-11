
const {
  generateMissingEmbeddings,
} = require("../services/embedding-batch.service");

const generateEmbeddings = async (req, res, next) => {
  try {
    const result = await generateMissingEmbeddings({
      documentId: req.body.documentId,
      limit: req.body.limit,
    });

    return res.status(200).json({
      success: true,
      message: "Embedding generation batch finished",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { generateEmbeddings };