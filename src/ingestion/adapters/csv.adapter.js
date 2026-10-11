const { parse } = require("csv-parse/sync");

const normalizeDocument = require("../normalizer");


const normalizeHeader = (header) => {
  return String(header || "")
    .replace(/^\uFEFF/, "")
    .trim()
    .toLowerCase()
    .replace(/[%()\/-]/g, " ")
    .replace(/\s+/g, "_");
};


const parseCSV = ({
  buffer,
  title,
  sourceName = "",
  sourceUrl = "",
  nasaIdentifier = "",
  description = "",
  authors = [],
  publicationDate = null,
  organization = "",
  keywords = [],
}) => {
  if (!Buffer.isBuffer(buffer)) {
    throw new Error(
      "CSV adapter requires a file buffer"
    );
  }

  const text = buffer.toString("utf8");

  const rows = parse(text, {
    skip_empty_lines: true,
    relax_column_count: true,
  });

  if (!rows.length) {
    throw new Error("CSV file is empty");
  }

  const headers = rows[0].map(
    normalizeHeader
  );

  const blocks = [];
  const structuredRecords = [];

  rows.slice(1).forEach(
    (row, index) => {
      const record = {};

      headers.forEach(
        (header, columnIndex) => {
          if (!header) {
            return;
          }

          record[header] =
            row[columnIndex] ?? "";
        }
      );

      const content = row
        .map((value) =>
          String(value).trim()
        )
        .filter(Boolean)
        .join(" | ");

      if (!content) {
        return;
      }

      blocks.push({
        content,

        sourceLocation: {
          row: index + 2,
        },
      });

      structuredRecords.push({
        sourceType: "csv",

        row: index + 2,

        data: record,
      });
    }
  );

  const content = blocks
    .map((block) => block.content)
    .join("\n");

  return normalizeDocument({
    title,
    sourceType: "csv",
    sourceName,
    sourceUrl,
    nasaIdentifier,
    description,
    authors,
    publicationDate,
    organization,
    keywords,
    content,
    blocks,
    structuredRecords,
  });
};

module.exports = parseCSV;