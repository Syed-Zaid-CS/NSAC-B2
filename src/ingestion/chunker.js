const DEFAULT_CHUNK_SIZE = 1200;
const DEFAULT_OVERLAP = 200;

const normalizeWhitespace = (text) => {
     return text
     .replace(/\r\n/g, "\n")
     .replace(/[ \t]+/g, " ")
     .replace(/\n{3,}/g, "\n\n")
     .trim();
};

const createChunks = (
     content,
     {
          chunkSize = DEFAULT_CHUNK_SIZE,
          overlap = DEFAULT_OVERLAP,
          sourceLocation = {},
          metadata = {},
     } = {}
) => {
     if (!content || !content.trim()) {
          return [];
     }

     if (overlap >= chunkSize) {
          throw new Error(
               "Chunk overlap must be smaller than chunk size"
          );
     }

     const text = normalizeWhitespace(content);

     const chunks = [];

     let start = 0;
     let chunkIndex = 0;

     while (start < text.length) {
          const end = Math.min(
               start + chunkSize,
               text.length
          );

          const chunkText = text
               .slice(start, end)
               .trim();

          if (chunkText) {
               chunks.push({
                    content: chunkText,
                    chunkIndex,
                    sourceLocation: {
                         ...sourceLocation,
                         startOffset:
                         sourceLocation.startOffset ??
                         start,
                         endOffset:
                         sourceLocation.endOffset ??
                         end,
                    },
                    metadata,
               });

               chunkIndex++;
          }

          if (end >= text.length) {
               break;
          }

          start = Math.max(
               end - overlap,
               start + 1
          );
     }

     return chunks;
};

const createChunksFromBlocks = (
     blocks,
     options = {}
) => {
     const allChunks = [];

     let globalChunkIndex = 0;

     for (const block of blocks) {
          const chunks = createChunks(
               block.content,
               {
               ...options,
               sourceLocation:
                    block.sourceLocation || {},
               metadata:
                    block.metadata || {},
               }
          );

          for (const chunk of chunks) {
               allChunks.push({
               ...chunk,
               chunkIndex: globalChunkIndex,
               });

               globalChunkIndex++;
          }
     }

     return allChunks;
};

module.exports = {
     createChunks,
     createChunksFromBlocks,
};