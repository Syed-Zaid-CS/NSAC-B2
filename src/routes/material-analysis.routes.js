
const express = require("express");

const {
  compareGravity,
  getOxygenAnalysis,
  getCombustionMatrixController
} = require("../controllers/material-analysis.controller");

const {
  getFlammabilityIndexController,
} = require("../controllers/flammability-index.controller");

const router = express.Router();

router.get("/:id/gravity-comparison", compareGravity);
router.get("/:id/oxygen-response", getOxygenAnalysis);
router.get("/:id/combustion-matrix", getCombustionMatrixController);
router.get("/:id/flammability-index", getFlammabilityIndexController);

module.exports = router;