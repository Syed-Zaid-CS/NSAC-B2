
const { askSafetyCopilot } = require("../services/rag.service");

const chat = async (req, res, next) => {
  try {
    const { question, documentId, topK } = req.body;

    const result = await askSafetyCopilot({
      question,
      documentId,
      topK,
    });

    return res.status(200).json({
      success: true,
      message: "FLARE Safety Co-Pilot response generated",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { chat };