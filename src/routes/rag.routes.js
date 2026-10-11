
const express = require("express");
const { chat } = require("../controllers/rag.controller");

const router = express.Router();

router.post("/chat", chat);

module.exports = router;