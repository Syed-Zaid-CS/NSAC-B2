
const express = require("express");
const multer = require("multer");

const upload = require("../middleware/upload");

const {
  ingest,
  ingestFile,
} = require("../controllers/ingestion.controller");

const router = express.Router();

const handleUploadError = (error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    const statusCode =
      error.code === "LIMIT_FILE_SIZE" ? 413 : 400;

    return res.status(statusCode).json({
      success: false,
      message:
        error.code === "LIMIT_FILE_SIZE"
          ? "File size exceeds the 10 MB limit"
          : error.message,
    });
  }

  if (error.statusCode === 400) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }

  return next(error);
};

router.post("/", ingest);


router.post(
  "/file",
  (req, res, next) => {
    upload.single("file")(req, res, (error) => {
      if (error) {
        return handleUploadError(error, req, res, next);
      }

      next();
    });
  },
  ingestFile
);


module.exports = router;
