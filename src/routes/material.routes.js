
const express = require("express");

const {
  getMaterials,
  getMaterial,
  getExperiments,
} = require("../controllers/material.controller");

const router = express.Router();

router.get("/", getMaterials);
router.get("/:id/experiments", getExperiments);
router.get("/:id", getMaterial);

module.exports = router;