
const mongoose = require("mongoose");
const Experiment = require("../models/Experiment");
const Material = require("../models/Material");

const makeError = (message, statusCode) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
};

const validateMaterialId = async (materialId) => {
  if (!mongoose.isValidObjectId(materialId)) {
    throw makeError("Invalid material ID", 400);
  }

  const material = await Material.findById(materialId).lean();

  if (!material) {
    throw makeError("Material not found", 404);
  }

  return material;
};

const average = (values) =>
  values.length
    ? values.reduce((sum, value) => sum + value, 0) / values.length
    : null;

/**
 * Summarize measurements separately by unit.
 * Never average measurements across different units.
 */
const summarizeMeasurementsByUnit = (experiments, field) => {
  const groups = new Map();

  for (const experiment of experiments) {
    const measurement = experiment[field];
    const value = measurement?.value;
    const unit =
      typeof measurement?.unit === "string" && measurement.unit.trim()
        ? measurement.unit.trim()
        : "unknown";

    if (!Number.isFinite(value)) continue;

    if (!groups.has(unit)) {
      groups.set(unit, []);
    }

    groups.get(unit).push(value);
  }

  return [...groups.entries()].map(([unit, values]) => ({
    unit,
    measuredCount: values.length,
    average: average(values),
    maximum: Math.max(...values),
    minimum: Math.min(...values),
  }));
};

const summarizeExperiments = (experiments) => {
  const spreadByUnit = summarizeMeasurementsByUnit(
    experiments,
    "flameSpreadRate"
  );

  const durationByUnit = summarizeMeasurementsByUnit(
    experiments,
    "burnDuration"
  );

  const extinctionObservations = experiments
    .map((item) => item.extinguished)
    .filter((value) => typeof value === "boolean");

  const getCompatibleSummary = (groups, preferredUnit) => {
    if (groups.length === 0) {
      return {
        unit: null,
        measuredCount: 0,
        average: null,
        maximum: null,
        minimum: null,
        measurementsByUnit: [],
      };
    }

    // Keep legacy aggregate fields only when a single unit is present.
    if (groups.length === 1) {
      return {
        ...groups[0],
        measurementsByUnit: groups,
      };
    }

    return {
      unit: null,
      measuredCount: groups.reduce(
        (total, group) => total + group.measuredCount,
        0
      ),
      average: null,
      maximum: null,
      minimum: null,
      measurementsByUnit: groups,
      note: `Measurements use different units; aggregate values were not calculated.`,
    };
  };

  const oxygenLevels = [
    ...new Set(
      experiments
        .map((item) => item.oxygenPercent)
        .filter(Number.isFinite)
    ),
  ].sort((a, b) => a - b);

  return {
    experimentCount: experiments.length,

    flameSpreadRate: getCompatibleSummary(spreadByUnit),

    burnDuration: getCompatibleSummary(durationByUnit),

    extinction: {
      observedCount: extinctionObservations.length,
      extinguishedCount: extinctionObservations.filter(Boolean).length,
      notExtinguishedCount: extinctionObservations.filter(
        (value) => value === false
      ).length,
    },

    oxygenLevelsTested: oxygenLevels,
  };
};

const getGravityComparison = async (materialId) => {
  await validateMaterialId(materialId);

  const experiments = await Experiment.find({ materialId })
    .sort({ oxygenPercent: 1, createdAt: 1 })
    .lean();

  const oneG = experiments.filter((item) => item.environment === "1G");
  const microgravity = experiments.filter(
    (item) => item.environment === "microgravity"
  );

  return {
    materialId,
    comparisonAvailable: oneG.length > 0 && microgravity.length > 0,
    environments: {
      "1G": summarizeExperiments(oneG),
      microgravity: summarizeExperiments(microgravity),
    },
    limitations: [
      "These are descriptive summaries of recorded experiments.",
      "Measurements with different units are summarized separately and are not combined.",
      "Different oxygen levels, pressures, temperatures, specimen configurations, and test methods can affect comparisons.",
      "A difference between these groups does not by itself establish that gravity caused the difference.",
      "The presence or absence of recorded experiments does not establish material safety.",
    ],
  };
};

const getOxygenResponse = async (materialId, environment) => {
  await validateMaterialId(materialId);

  if (!["1G", "microgravity"].includes(environment)) {
    throw makeError("environment must be 1G or microgravity", 400);
  }

  const experiments = await Experiment.find({
    materialId,
    environment,
  })
    .sort({ oxygenPercent: 1 })
    .lean();

  const grouped = new Map();

  for (const item of experiments) {
    const oxygen = item.oxygenPercent;

    if (!Number.isFinite(oxygen)) continue;

    if (!grouped.has(oxygen)) {
      grouped.set(oxygen, []);
    }

    grouped.get(oxygen).push(item);
  }

  const points = [...grouped.entries()].map(
    ([oxygenPercent, rows]) => {
      const measurements = summarizeMeasurementsByUnit(
        rows,
        "flameSpreadRate"
      );

      const measuredSpreadCount = measurements.reduce(
        (total, item) => total + item.measuredCount,
        0
      );

      // Only publish a single average when all measured values share a unit.
      const singleUnitMeasurement =
        measurements.length === 1 ? measurements[0] : null;

      return {
        oxygenPercent,
        experimentCount: rows.length,
        averageFlameSpreadRate: singleUnitMeasurement
          ? singleUnitMeasurement.average
          : null,
        maximumFlameSpreadRate: singleUnitMeasurement
          ? singleUnitMeasurement.maximum
          : null,
        measuredSpreadCount,
        flameSpreadMeasurementsByUnit: measurements,
      };
    }
  );

  const unitsAcrossAllPoints = [
    ...new Set(
      points.flatMap((point) =>
        point.flameSpreadMeasurementsByUnit.map(
          (measurement) => measurement.unit
        )
      )
    ),
  ];

  return {
    materialId,
    environment,
    // A single unit is exposed only when all recorded measurements agree.
    unit: unitsAcrossAllPoints.length === 1
      ? unitsAcrossAllPoints[0]
      : null,
    points,
    limitations: [
      "Only measured oxygen levels are returned; no interpolation or extrapolation is performed.",
      "Missing flame-spread measurements remain null and are not treated as zero.",
      "Measurements in different units are not averaged together.",
      "Measurements at the same oxygen percentage may still differ in pressure, temperature, specimen configuration, or test method.",
      "These observations alone do not establish a safe oxygen threshold.",
    ],
  };
};

const getCombustionMatrix = async ({
  materialId,
  filters = {},
}) => {
  await validateMaterialId(materialId);

  const {
    environment,
    oxygenMin,
    oxygenMax,
    pressureMin,
    pressureMax,
    temperatureMin,
    temperatureMax,
    page = 1,
    limit = 20,
  } = filters;

  const parseOptionalNumber = (value, fieldName) => {
    if (value === undefined || value === null || value === "") {
      return null;
    }

    const parsed = Number(value);

    if (!Number.isFinite(parsed)) {
      throw makeError(`${fieldName} must be a valid number`, 400);
    }

    return parsed;
  };

  const parsePositiveInteger = (
    value,
    fieldName,
    defaultValue,
    max
  ) => {
    if (value === undefined || value === null || value === "") {
      return defaultValue;
    }

    const parsed = Number(value);

    if (!Number.isInteger(parsed) || parsed < 1 || parsed > max) {
      throw makeError(
        `${fieldName} must be an integer between 1 and ${max}`,
        400
      );
    }

    return parsed;
  };

  const ranges = {
    oxygen: [
      parseOptionalNumber(oxygenMin, "oxygenMin"),
      parseOptionalNumber(oxygenMax, "oxygenMax"),
    ],
    pressure: [
      parseOptionalNumber(pressureMin, "pressureMin"),
      parseOptionalNumber(pressureMax, "pressureMax"),
    ],
    temperature: [
      parseOptionalNumber(temperatureMin, "temperatureMin"),
      parseOptionalNumber(temperatureMax, "temperatureMax"),
    ],
  };

  for (const [name, [min, max]] of Object.entries(ranges)) {
    if (min !== null && max !== null && min > max) {
      throw makeError(
        `${name} minimum cannot exceed its maximum`,
        400
      );
    }
  }

  if (
    (ranges.oxygen[0] !== null && ranges.oxygen[0] < 0) ||
    (ranges.oxygen[1] !== null && ranges.oxygen[1] > 100)
  ) {
    throw makeError("Oxygen limits must be between 0 and 100", 400);
  }

  if (
    environment !== undefined &&
    !["1G", "microgravity"].includes(environment)
  ) {
    throw makeError("environment must be 1G or microgravity", 400);
  }

  const currentPage = parsePositiveInteger(page, "page", 1, 1000000);
  const pageSize = parsePositiveInteger(limit, "limit", 20, 100);

  const query = { materialId };

  if (environment) {
    query.environment = environment;
  }

  const addRange = (field, [min, max]) => {
    if (min !== null || max !== null) {
      query[field] = {};

      if (min !== null) query[field].$gte = min;
      if (max !== null) query[field].$lte = max;
    }
  };

  addRange("oxygenPercent", ranges.oxygen);
  addRange("pressureKpa", ranges.pressure);
  addRange("temperatureC", ranges.temperature);

  const total = await Experiment.countDocuments(query);

  const experiments = await Experiment.find(query)
    .sort({
      oxygenPercent: 1,
      pressureKpa: 1,
      temperatureC: 1,
      createdAt: 1,
    })
    .skip((currentPage - 1) * pageSize)
    .limit(pageSize)
    .populate(
      "documentId",
      "title sourceType nasaIdentifier sourceUrl metadata.publicationDate"
    )
    .lean();

  const records = experiments.map((item) => {
    const sourceDocument =
      item.documentId && typeof item.documentId === "object"
        ? {
            id: String(item.documentId._id),
            title: item.documentId.title ?? null,
            sourceType: item.documentId.sourceType ?? null,
            nasaIdentifier: item.documentId.nasaIdentifier ?? null,
            sourceUrl: item.documentId.sourceUrl ?? null,
            publicationDate:
              item.documentId.metadata?.publicationDate ?? null,
          }
        : null;

    return {
      id: String(item._id),
      environment: item.environment,
      oxygenPercent: item.oxygenPercent ?? null,
      pressureKpa: item.pressureKpa ?? null,
      temperatureC: item.temperatureC ?? null,
      flameSpreadRate: item.flameSpreadRate?.value ?? null,
      flameSpreadRateUnit: item.flameSpreadRate?.unit ?? null,
      burnDuration: item.burnDuration?.value ?? null,
      burnDurationUnit: item.burnDuration?.unit ?? null,
      extinguished:
        typeof item.extinguished === "boolean"
          ? item.extinguished
          : null,
      observation: item.observation ?? null,
      sourceLocation: item.sourceLocation ?? null,
      sourceDocument,
    };
  });

  return {
    materialId,
    filtersApplied: {
      environment: environment ?? null,
      oxygenMin: ranges.oxygen[0],
      oxygenMax: ranges.oxygen[1],
      pressureMin: ranges.pressure[0],
      pressureMax: ranges.pressure[1],
      temperatureMin: ranges.temperature[0],
      temperatureMax: ranges.temperature[1],
    },
    pagination: {
      page: currentPage,
      limit: pageSize,
      totalRecords: total,
      totalPages: Math.ceil(total / pageSize),
    },
    records,
    limitations: [
      "Only recorded experiments matching the filters are returned.",
      "Missing measurements remain null; they are not treated as zero.",
      "Raw measurements retain their recorded units and are not silently converted.",
      "Results describe recorded experiments and do not establish a safe operating threshold.",
    ],
  };
};

module.exports = {
  getGravityComparison,
  getOxygenResponse,
  getCombustionMatrix,
};
