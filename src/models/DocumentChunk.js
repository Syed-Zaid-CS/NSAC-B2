const mongoose = require("mongoose");

const sourceLocationSchema = new mongoose.Schema({
     page: {
          type: Number,
          default: null,
     },

     section: {
          type: String,
          default: "",
     },

     subsection: {
          type: String,
          default: "",
     },

     paragraph: {
          type: Number,
          default: null,
     },

     row: {
          type: Number,
          default: null,
     },

     sheet: {
          type: String,
          default: "",
     },

     table: {
          type: String,
          default: "",
     },

     startOffset: {
          type: Number,
          default: null,
     },

     endOffset: {
          type: Number,
          default: null,
     },
},
  {
    _id: false,
  }
);

const documentChunkSchema = new mongoose.Schema({
     documentId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Document",
          required: true,
          index: true,
     },

     content: {
          type: String,
          required: true,
     },

     chunkIndex: {
          type: Number,
          required: true,
     },

     sourceLocation: {
          type: sourceLocationSchema,
          default: () => ({}),
     },

     metadata: {
          heading: {
               type: String,
               default: "",
          },

          material: {
               type: String,
               default: "",
          },

          oxygenLevel: {
               type: Number,
               default: null,
          },

          pressure: {
               type: Number,
               default: null,
          },

          environment: {
               type: String,
               enum: ["1G", "microgravity", "unknown"],
               default: "unknown",
          },
     },

     embedding: {
          type: [Number],
          default: undefined,
     },
},
  {
    timestamps: true,
  }
);

documentChunkSchema.index({
     documentId: 1,
     chunkIndex: 1,
});

module.exports = mongoose.model("DocumentChunk", documentChunkSchema);