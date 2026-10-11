
const {
  listMaterials,
  getMaterialById,
  getMaterialExperiments,
} = require("../services/material.service");

const getMaterials = async (req, res, next) => {
  try {
    const result = await listMaterials({
      page: req.query.page,
      limit: req.query.limit,
      search: req.query.search,
      riskLevel: req.query.riskLevel,
      category: req.query.category,
    });

    return res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

const getMaterial = async (req, res, next) => {
  try {
    const material = await getMaterialById(req.params.id);

    return res.status(200).json({
      success: true,
      data: { material },
    });
  } catch (error) {
    next(error);
  }
};

const getExperiments = async (req, res, next) => {
  try {
    const result = await getMaterialExperiments({
      materialId: req.params.id,
      page: req.query.page,
      limit: req.query.limit,
      environment: req.query.environment,
      oxygenMin: req.query.oxygenMin,
      oxygenMax: req.query.oxygenMax,
    });

    return res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getMaterials,
  getMaterial,
  getExperiments,
};