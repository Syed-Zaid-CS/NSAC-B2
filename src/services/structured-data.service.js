
const Material = require("../models/Material");
const Experiment = require("../models/Experiment");

const { mapNASARecord } = require("../utils/nasa-field-mapper");

const upsertMaterial = async ({ materialName, documentId }) => {
  if (!materialName || typeof materialName !== "string") {
    return null;
  }

  const cleanName = materialName.trim();

  if (!cleanName) {
    return null;
  }

  const update = {
    $setOnInsert: {
      name: cleanName,
      riskLevel: "unknown",
      flammabilityIndex: null,
    },
  };

  if (documentId) {
    update.$addToSet = {
      sourceDocuments: documentId,
    };
  }

  return Material.findOneAndUpdate(
    { name: cleanName },
    update,
    {
      new: true,
      upsert: true,
      runValidators: true,
    }
  );
};

const createExperiment = async ({
  record,
  documentId,
  materialId,
  sourceLocation = {},
}) => {
  if (!materialId) {
    return null;
  }

  if (
    record.oxygenPercent === null ||
    record.oxygenPercent === undefined ||
    !Number.isFinite(record.oxygenPercent) ||
    record.oxygenPercent < 0 ||
    record.oxygenPercent > 100
  ) {
    return null;
  }

  if (!["1G", "microgravity"].includes(record.environment)) {
    return null;
  }

  const experimentData = {
    materialId,
    environment: record.environment,
    oxygenPercent: record.oxygenPercent,

    pressureKpa: record.pressureKpa ?? null,
    temperatureC: record.temperatureC ?? null,

    flameSpreadRate: {
      value: record.flameSpreadRate ?? null,
      unit: record.flameSpreadRateUnit || "unknown",
    },

    burnDuration: {
      value: record.burnDuration ?? null,
      unit: record.burnDurationUnit || "unknown",
    },

    extinguished: record.extinguished ?? null,
    observation: record.observation || "",

    sourceLocation: {
      page: sourceLocation.page ?? null,
      section: sourceLocation.section || "",
      row: sourceLocation.row ?? null,
      sheet: sourceLocation.sheet || "",
    },
  };

  if (documentId) {
    experimentData.documentId = documentId;
  }

  return Experiment.create(experimentData);
};

const processStructuredRecords = async ({
  records = [],
  documentId,
}) => {
  const results = {
    materialsCreated: 0,
    materialsUpdated: 0,
    experimentsCreated: 0,
    skippedRecords: 0,
  };

  if (!Array.isArray(records)) {
    throw new Error("Structured records must be an array");
  }

  for (const sourceRecord of records) {
    const record = mapNASARecord(sourceRecord?.data ?? {});

    if (!record.material) {
      results.skippedRecords++;
      continue;
    }

    const materialName = record.material.trim();

    const existingMaterial = await Material.findOne({
      name: materialName,
    });

    const material = await upsertMaterial({
      materialName,
      documentId,
    });

    if (!material) {
      results.skippedRecords++;
      continue;
    }

    if (existingMaterial) {
      results.materialsUpdated++;
    } else {
      results.materialsCreated++;
    }

    const originalLocation = sourceRecord?.sourceLocation || {};

    const sourceLocation = {
      page: originalLocation.page ?? sourceRecord?.page ?? null,

      section:
        originalLocation.section ||
        sourceRecord?.section ||
        "",

      sheet:
        originalLocation.sheet ||
        sourceRecord?.sheet ||
        "",

      row: originalLocation.row ?? sourceRecord?.row ?? null,
    };

    const experiment = await createExperiment({
      record,
      documentId,
      materialId: material._id,
      sourceLocation,
    });

    if (experiment) {
      results.experimentsCreated++;
    } else {
      results.skippedRecords++;
    }
  }

  return results;
};

module.exports = {
  processStructuredRecords,
};
