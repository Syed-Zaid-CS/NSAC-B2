const mongoose = require("mongoose");

const experimentSchema = new mongoose.Schema({
     materialId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Material",
          required: true,
          index: true,
     },

     documentId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Document",
          default: null,
     },

     environment: {
          type: String,
          enum: ["1G", "microgravity"],
          required: true,
     },

     oxygenPercent: {
          type: Number,
          required: true,
          min: 0,
          max: 100,
     },

     pressureKpa: {
          type: Number,
          default: null,
     },

     temperatureC: {
          type: Number,
          default: null,
     },

     flameSpreadRate: {
          value: {
               type: Number,
               default: null,
          },

          unit: {
               type: String,
               default: "cm/s",
          },
     },

     burnDuration: {
          value: {
               type: Number,
               default: null,
          },

          unit: {
               type: String,
               default: "s",
          },
     },

     extinguished: {
          type: Boolean,
          default: null,
     },

     observation: {
          type: String,
          default: "",
     },
     
     sourceLocation: {
          page: {
               type: Number,
               default: null,
          },
          section: {
               type: String,
               default: "",
          },
          row: {
               type: Number,
               default: null,
          },
          sheet: {
               type: String,
               default: "",
          },
     },

},
  {
    timestamps: true,
  }
);

experimentSchema.index({
     materialId: 1,
     environment: 1,
     oxygenPercent: 1,
});

module.exports = mongoose.model(
     "Experiment",
     experimentSchema
);