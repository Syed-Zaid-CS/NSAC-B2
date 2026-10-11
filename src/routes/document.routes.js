const express = require("express");
const {
  listDocuments,
  getDocument,
  listDocumentChunks,
  getChunk,
} = require("../controllers/document.controller");

const router = express.Router();

router.get("/", listDocuments);

router.get("/:id", getDocument);

router.get(
  "/:id/chunks",
  listDocumentChunks
);

module.exports = router;