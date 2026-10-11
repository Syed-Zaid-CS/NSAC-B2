
const mongoose = require("mongoose");
const Material = require("../models/Material");
const Experiment = require("../models/Experiment");

const createError = (message, statusCode) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
};

const parsePagination = (page, limit) => {
  const parseInteger = (value, field, defaultValue, max) => {
    if (value === undefined || value === null || value === "") {
      return defaultValue;
    }

    const parsed = Number(value);

    if (
      !Number.isSafeInteger(parsed) ||
      parsed < 1 ||
      parsed > max
    ) {
      throw createError(
        `${field} must be an integer between 1 and ${max}`,
        400
      );
    }

    return parsed;
  };

  return {
    page: parseInteger(page, "page", 1, 1000000),
    limit: parseInteger(limit, "limit", 20, 100),
  };
};

const parseOxygenRange = (oxygenMin, oxygenMax) => {
  const parseOptional = (value, field) => {
    if (value === undefined || value === null || value === "") {
      return null;
    }

    const parsed = Number(value);

    if (!Number.isFinite(parsed)) {
      throw createError(`${field} must be a valid number`, 400);
    }

    return parsed;
  };

  const min = parseOptional(oxygenMin, "oxygenMin");
  const max = parseOptional(oxygenMax, "oxygenMax");

  if (
    (min !== null && (min < 0 || min > 100)) ||
    (max !== null && (max < 0 || max > 100))
  ) {
    throw createError(
      "Oxygen limits must be between 0 and 100",
      400
    );
  }

  if (min !== null && max !== null && min > max) {
    throw createError(
      "oxygenMin cannot exceed oxygenMax",
      400
    );
  }

  return { min, max };
};

const listMaterials = async ({
  page,
  limit,
  search = "",
  riskLevel,
  category,
} = {}) => {
  const pagination = parsePagination(page, limit);
  const filter = {};

  const allowedRiskLevels = [
    "low",
    "moderate",
    "high",
    "critical",
    "unknown",
  ];

  if (riskLevel) {
    if (
      typeof riskLevel !== "string" ||
      !allowedRiskLevels.includes(riskLevel)
    ) {
      throw createError("Invalid riskLevel filter", 400);
    }

    filter.riskLevel = riskLevel;
  }

  if (category !== undefined && category !== "") {
    if (typeof category !== "string" || !category.trim()) {
      throw createError("category must be a non-empty string", 400);
    }

    filter.category = category.trim();
  }

  if (typeof search !== "string") {
    throw createError("search must be a string", 400);
  }

  const cleanSearch = search.trim();

  if (cleanSearch) {
    const escapedSearch = cleanSearch.replace(
      /[.*+?^${}()|[\]\\]/g,
      "\\$&"
    );

    const regex = new RegExp(escapedSearch, "i");

    filter.$or = [
      { name: regex },
      { aliases: regex },
      { category: regex },
    ];
  }

  const skip = (pagination.page - 1) * pagination.limit;

  const [materials, total] = await Promise.all([
    Material.find(filter)
      .sort({ name: 1 })
      .skip(skip)
      .limit(pagination.limit)
      .select(
        "name aliases category riskLevel flammabilityIndex flammabilityIndexVersion behavior criticalThreshold"
      )
      .lean(),

    Material.countDocuments(filter),
  ]);

  return {
    materials,
    pagination: {
      page: pagination.page,
      limit: pagination.limit,
      total,
      totalPages: Math.ceil(total / pagination.limit),
    },
  };
};

const getMaterialById = async (materialId) => {
  if (!mongoose.isValidObjectId(materialId)) {
    throw createError("Invalid material ID", 400);
  }

  const material = await Material.findById(materialId)
    .populate(
      "sourceDocuments",
      "title sourceName sourceType sourceUrl nasaIdentifier metadata"
    )
    .lean();

  if (!material) {
    throw createError("Material not found", 404);
  }

  return material;
};

const getMaterialExperiments = async ({
  materialId,
  page,
  limit,
  environment,
  oxygenMin,
  oxygenMax,
} = {}) => {
  if (!mongoose.isValidObjectId(materialId)) {
    throw createError("Invalid material ID", 400);
  }

  const materialExists = await Material.exists({
    _id: materialId,
  });

  if (!materialExists) {
    throw createError("Material not found", 404);
  }

  const pagination = parsePagination(page, limit);
  const oxygenRange = parseOxygenRange(oxygenMin, oxygenMax);
  const filter = { materialId };

  if (environment !== undefined && environment !== "") {
    if (!["1G", "microgravity"].includes(environment)) {
      throw createError(
        "environment must be 1G or microgravity",
        400
      );
    }

    filter.environment = environment;
  }

  if (
    oxygenRange.min !== null ||
    oxygenRange.max !== null
  ) {
    filter.oxygenPercent = {};

    if (oxygenRange.min !== null) {
      filter.oxygenPercent.$gte = oxygenRange.min;
    }

    if (oxygenRange.max !== null) {
      filter.oxygenPercent.$lte = oxygenRange.max;
    }
  }

  const skip = (pagination.page - 1) * pagination.limit;

  const [experiments, total] = await Promise.all([
    Experiment.find(filter)
      .sort({ oxygenPercent: 1, createdAt: 1 })
      .skip(skip)
      .limit(pagination.limit)
      .populate(
        "documentId",
        "title sourceName sourceType sourceUrl nasaIdentifier"
      )
      .lean(),

    Experiment.countDocuments(filter),
  ]);

  return {
    experiments,
    pagination: {
      page: pagination.page,
      limit: pagination.limit,
      total,
      totalPages: Math.ceil(total / pagination.limit),
    },
  };
};

module.exports = {
  listMaterials,
  getMaterialById,
  getMaterialExperiments,
};
