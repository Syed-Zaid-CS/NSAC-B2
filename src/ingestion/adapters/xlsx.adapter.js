const XLSX = require("xlsx");

const normalizeDocument = require("../normalizer");


const normalizeHeader = (header) => {
  return String(header || "")
    .replace(/^\uFEFF/, "")
    .trim()
    .toLowerCase()
    .replace(/[%()\/-]/g, " ")
    .replace(/\s+/g, "_");
};


const parseXLSX = ({
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
      "XLSX adapter requires a file buffer"
    );
  }

  const workbook = XLSX.read(buffer, {
    type: "buffer",
  });

  const blocks = [];
  const structuredRecords = [];

  for (const sheetName of workbook.SheetNames) {
    const worksheet = workbook.Sheets[sheetName];

    const rows = XLSX.utils.sheet_to_json(
      worksheet,
      {
        header: 1,
        defval: "",
      }
    );

    if (!rows.length) {
      continue;
    }

    const headers = rows[0].map(
      normalizeHeader
    );

    rows.slice(1).forEach(
      (row, rowIndex) => {
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

        const values = row
          .map((value) =>
            String(value).trim()
          )
          .filter(Boolean);

        if (!values.length) {
          return;
        }

        blocks.push({
          content: values.join(" | "),

          sourceLocation: {
            sheet: sheetName,
            row: rowIndex + 2,
          },

          metadata: {
            heading: sheetName,
          },
        });

        structuredRecords.push({
          sourceType: "xlsx",

          sheet: sheetName,

          row: rowIndex + 2,

          data: record,
        });
      }
    );
  }

  const content = blocks
    .map((block) => block.content)
    .join("\n");

  return normalizeDocument({
    title,
    sourceType: "xlsx",
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

module.exports = parseXLSX;