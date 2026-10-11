const mongoose = require("mongoose");

const behaviorSchema = new mongoose.Schema({
     behavior: {
          type: String,
          default: "",
     },

     flameSpread: {
          type: String,
          default: "",
     },

     extinguishment: {
          type: String,
          default: "",
     },

     observations: {
          type: String,
          default: "",
     },
  },
  { _id: false }
);

const thresholdSchema = new mongoose.Schema({
     oxygenPercent: {
          type: Number,
          default: null,
     },

     pressureKpa: {
          type: Number,
          default: null,
     },

     temperatureC: {
          type: Number,
          default: null,
     },

     description: {
          type: String,
          default: "",
     },
  },
  { _id: false }
);

const materialSchema = new mongoose.Schema({
     name: {
          type: String,
          required: true,
          unique: true,
          trim: true,
     },

     aliases: {
          type: [String],
          default: [],
     },

     category: {
          type: String,
          default: "",
          trim: true,
     },

     riskLevel: {
          type: String,
          enum: ["low", "moderate", "high", "critical", "unknown"],
          default: "unknown",
     },

     behavior: {
          oneG: {
               type: behaviorSchema,
               default: () => ({}),
          },

          microgravity: {
               type: behaviorSchema,
               default: () => ({}),
          },
     },

     criticalThreshold: {
          type: thresholdSchema,
          default: () => ({}),
     },

     flammabilityIndex: {
          type: Number,
          default: null,
     },

     flammabilityIndexVersion: {
          type: String,
          default: "v1",
     },

     sourceDocuments: [
          {
               type: mongoose.Schema.Types.ObjectId,
               ref: "Document",
          },
     ],
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Material", materialSchema);