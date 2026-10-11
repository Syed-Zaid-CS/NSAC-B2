const express = require("express");
const { getChunk } = require("../controllers/document.controller");

const router = express.Router();

router.get("/:id", getChunk);

module.exports = router;