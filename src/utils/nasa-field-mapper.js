const normalizeKey = (key) =>
  String(key ?? "")
    .replace(/^\uFEFF/, "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");

const aliases = {
  material: [
    "material",
    "material_name",
    "material_type",
    "specimen",
    "sample",
  ],

  environment: [
    "environment",
    "gravity",
    "gravity_level",
    "condition",
    "gravity_environment",
  ],

  oxygenPercent: [
    "oxygen",
    "oxygen_percent",
    "oxygen_concentration",
    "oxygen_concentration_percent",
    "o2",
    "o2_percent",
    "o2_concentration",
  ],

  pressureKpa: [
    "pressure",
    "pressure_kpa",
    "ambient_pressure",
  ],

  temperatureC: [
    "temperature",
    "temperature_c",
    "temperature_celsius",
  ],

  flameSpreadRate: [
    "flame_spread",
    "flame_spread_rate",
    "flame_spread_rate_cm_s",
    "spread_rate",
  ],

  flameSpreadRateUnit: [
    "flame_spread_unit",
    "flame_spread_rate_unit",
    "spread_rate_unit",
  ],

  burnDuration: [
    "burn_duration",
    "burn_duration_s",
    "burn_time",
    "duration",
  ],

  burnDurationUnit: [
    "burn_duration_unit",
    "burn_time_unit",
    "duration_unit",
  ],

  extinguished: [
    "extinguished",
    "self_extinguished",
    "extinction",
  ],

  observation: [
    "observation",
    "observations",
    "notes",
    "comment",
    "comments",
  ],
};

const findField = (record, possibleNames) => {
  const normalizedRecord = new Map();

  for (const [key, value] of Object.entries(record || {})) {
    normalizedRecord.set(normalizeKey(key), value);
  }

  for (const name of possibleNames) {
    const normalizedName = normalizeKey(name);

    if (normalizedRecord.has(normalizedName)) {
      return normalizedRecord.get(normalizedName);
    }
  }

  return undefined;
};

const toNumber = (value) => {
  if (
    value === undefined ||
    value === null ||
    (typeof value === "string" && !value.trim())
  ) {
    return null;
  }

  if (typeof value === "string") {
    value = value.replace(/,/g, "").trim();
  }

  const parsed = Number(value);

  return Number.isFinite(parsed) ? parsed : null;
};

const toText = (value, fallback = "") => {
  if (value === undefined || value === null) {
    return fallback;
  }

  const text = String(value).trim();

  return text || fallback;
};

const toBoolean = (value) => {
  if (
    value === undefined ||
    value === null ||
    value === ""
  ) {
    return null;
  }

  if (typeof value === "boolean") {
    return value;
  }

  const normalized = String(value).trim().toLowerCase();

  if (["true", "yes", "y", "1"].includes(normalized)) {
    return true;
  }

  if (["false", "no", "n", "0"].includes(normalized)) {
    return false;
  }

  return null;
};

const normalizeEnvironment = (value) => {
  const normalized = String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/[\s_-]+/g, "");

  if (
    [
      "microgravity",
      "0g",
      "zerog",
      "zerogravity",
      "microg",
    ].includes(normalized)
  ) {
    return "microgravity";
  }

  if (
    [
      "1g",
      "normalgravity",
      "terrestrial",
      "earthgravity",
    ].includes(normalized)
  ) {
    return "1G";
  }

  return "unknown";
};

const mapNASARecord = (record = {}) => ({
  material: toText(findField(record, aliases.material)),

  environment: normalizeEnvironment(
    findField(record, aliases.environment)
  ),

  oxygenPercent: toNumber(
    findField(record, aliases.oxygenPercent)
  ),

  pressureKpa: toNumber(
    findField(record, aliases.pressureKpa)
  ),

  temperatureC: toNumber(
    findField(record, aliases.temperatureC)
  ),

  flameSpreadRate: toNumber(
    findField(record, aliases.flameSpreadRate)
  ),

  flameSpreadRateUnit: toText(
    findField(record, aliases.flameSpreadRateUnit),
    "unknown"
  ),

  burnDuration: toNumber(
    findField(record, aliases.burnDuration)
  ),

  burnDurationUnit: toText(
    findField(record, aliases.burnDurationUnit),
    "unknown"
  ),

  extinguished: toBoolean(
    findField(record, aliases.extinguished)
  ),

  observation: toText(
    findField(record, aliases.observation)
  ),
});

module.exports = {
  mapNASARecord,
};
