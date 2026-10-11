const multer = require("multer");

const storage = multer.memoryStorage();

const allowedMimeTypes = [
     "application/pdf",
     "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
     "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
     "text/csv",
     "application/json",
     "text/plain",
];

const upload = multer({
     storage,

     limits: {
          fileSize: 10 * 1024 * 1024,
     },

     fileFilter: (req, file, callback) => {
          if (allowedMimeTypes.includes(file.mimetype)) {
               callback(null, true);
          } else {
               callback(
                    new Error(
                         `Unsupported file type: ${file.mimetype}`
                    )
               );
          }
     },
});

module.exports = upload;