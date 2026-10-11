
const mongoose = require("mongoose");
const Material = require("../models/Material");
const Experiment = require("../models/Experiment");

const getFlammabilityIndex = async (materialId) => {
  if (!mongoose.isValidObjectId(materialId)) {
    const error = new Error("Invalid material ID");
    error.statusCode = 400;
    throw error;
  }

  const material = await Material.findById(materialId).lean();

  if (!material) {
    const error = new Error("Material not found");
    error.statusCode = 404;
    throw error;
  }

  const experiments = await Experiment.find({ materialId }).lean();

  const countMeasured = (getValue) =>
    experiments.filter((experiment) => {
      const value = getValue(experiment);
      return typeof value === "number" && Number.isFinite(value);
    }).length;

  const spreadRateCount = countMeasured(
    (experiment) => experiment.flameSpreadRate?.value
  );

  const burnDurationCount = countMeasured(
    (experiment) => experiment.burnDuration?.value
  );

  const oxygenCount = countMeasured(
    (experiment) => experiment.oxygenPercent
  );

  const pressureCount = countMeasured(
    (experiment) => experiment.pressureKpa
  );

  const temperatureCount = countMeasured(
    (experiment) => experiment.temperatureC
  );

  const extinguishmentCount = experiments.filter(
    (experiment) => typeof experiment.extinguished === "boolean"
  ).length;

  const validEnvironments = experiments.filter((experiment) =>
    ["1G", "microgravity"].includes(experiment.environment)
  ).length;

  const totalExperiments = experiments.length;

  const measurementCoverage = totalExperiments
    ? {
        flameSpreadRate:
          spreadRateCount / totalExperiments,
        burnDuration:
          burnDurationCount / totalExperiments,
        oxygenPercent:
          oxygenCount / totalExperiments,
        pressureKpa:
          pressureCount / totalExperiments,
        temperatureC:
          temperatureCount / totalExperiments,
        extinguishment:
          extinguishmentCount / totalExperiments,
        recognizedEnvironment:
          validEnvironments / totalExperiments,
      }
    : {
        flameSpreadRate: 0,
        burnDuration: 0,
        oxygenPercent: 0,
        pressureKpa: 0,
        temperatureC: 0,
        extinguishment: 0,
        recognizedEnvironment: 0,
      };

  const environmentCounts = {
    "1G": experiments.filter(
      (experiment) => experiment.environment === "1G"
    ).length,
    microgravity: experiments.filter(
      (experiment) => experiment.environment === "microgravity"
    ).length,
    unknown: experiments.filter(
      (experiment) =>
        !["1G", "microgravity"].includes(experiment.environment)
    ).length,
  };

  return {
    material: {
      id: String(material._id),
      name: material.name,
      category: material.category ?? null,
    },

    flammabilityIndex: {
      value: null,
      status: "methodology_pending",
      version: null,
      explanation:
        "A validated scoring methodology and suitable reference data are required before a numerical flammability index can be reported.",
    },

    evidence: {
      totalExperiments,
      environmentCounts,
      measurementCounts: {
        flameSpreadRate: spreadRateCount,
        burnDuration: burnDurationCount,
        oxygenPercent: oxygenCount,
        pressureKpa: pressureCount,
        temperatureC: temperatureCount,
        extinguishment: extinguishmentCount,
      },
      measurementCoverage,
    },

    dataReadiness: {
      status:
        totalExperiments === 0
          ? "no_experimental_data"
          : "evidence_available_for_review",
      uniqueOxygenLevels: [
        ...new Set(
          experiments
            .map((experiment) => experiment.oxygenPercent)
            .filter(
              (value) =>
                typeof value === "number" &&
                Number.isFinite(value)
            )
        ),
      ].sort((a, b) => a - b),
    },

    limitations: [
      "Evidence coverage is not a flammability or safety score.",
      "Experiments conducted under different conditions may not be directly comparable.",
      "Missing measurements are not treated as zero.",
      "No safe oxygen threshold is inferred from these summaries.",
    ],
  };
};

module.exports = { getFlammabilityIndex };