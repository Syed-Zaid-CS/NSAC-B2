const mongoose = require("mongoose");

const documentSchema = new mongoose.Schema({

     title: {
          type: String,
          required: true,
          trim: true,
     },

     description: {
          type: String,
          default: "",
          trim: true,
     },

     sourceType: {
          type: String,
          required: true,
          enum: [
               "pdf",
               "docx",
               "xlsx",
               "csv",
               "json",
               "html",
               "text",
               "api",
               "other",
          ],
     },

     sourceName: {
          type: String,
          default: "",
          trim: true,
     },

     sourceUrl: {
          type: String,
          default: "",
          trim: true,
     },

     nasaIdentifier: {
          type: String,
          default: "",
          trim: true,
     },

     metadata: {
          authors: {
               type: [String],
               default: [],
          },

          publicationDate: {
               type: Date,
               default: null,
          },

          organization: {
               type: String,
               default: "",
          },

          keywords: {
               type: [String],
               default: [],
          },
     },

     processingStatus: {
          type: String,
          enum: ["pending", "processing", "completed", "failed"],
          default: "pending",
     },

     processingError: {
          type: String,
          default: "",
     },
},
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Document", documentSchema);