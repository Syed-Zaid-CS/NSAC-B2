
const {
  searchRelevantChunks,
} = require("../services/retrieval.service");

const search = async (req, res, next) => {
  try {
    const { query, documentId, topK } = req.body;

    const data = await searchRelevantChunks({
      query,
      documentId,
      topK,
    });

    return res.status(200).json({
      success: true,
      message: "Semantic retrieval completed",
      data,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { search };