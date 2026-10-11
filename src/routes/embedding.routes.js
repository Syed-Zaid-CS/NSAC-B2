
const express = require("express");
const {
  generateEmbeddings,
} = require("../controllers/embedding.controller");

const router = express.Router();

router.post("/generate", generateEmbeddings);

module.exports = router;