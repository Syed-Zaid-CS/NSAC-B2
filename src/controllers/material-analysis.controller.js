const {
  getGravityComparison,
  getOxygenResponse,
  getCombustionMatrix,
} = require("../services/material-analysis.service");

const compareGravity = async (req, res, next) => {
  try {
    const data = await getGravityComparison(req.params.id);

    return res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    next(error);
  }
};

const getOxygenAnalysis = async (req, res, next) => {
  try {
    const environment = req.query.environment || "microgravity";

    const data = await getOxygenResponse(
      req.params.id,
      environment
    );

    return res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    next(error);
  }
};

const getCombustionMatrixController = async (req, res, next) => {
  try {
    const result = await getCombustionMatrix({
      materialId: req.params.id,
      filters: req.query,
    });

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  compareGravity,
  getOxygenAnalysis,
  getCombustionMatrixController,
};