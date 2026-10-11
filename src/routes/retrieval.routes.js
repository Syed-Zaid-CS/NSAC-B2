const express = require("express");
const { search } = require("../controllers/retrieval.controller");

const router = express.Router();

router.post("/search", search);

module.exports = router;