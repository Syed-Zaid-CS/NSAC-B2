
const {
  getFlammabilityIndex,
} = require("../services/flammability-index.service");

const getFlammabilityIndexController = async (req, res, next) => {
  try {
    const data = await getFlammabilityIndex(req.params.id);

    return res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    return next(error);
  }
};

module.exports = { getFlammabilityIndexController };