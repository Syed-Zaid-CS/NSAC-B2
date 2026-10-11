const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');

const ingestionRoutes = require("./routes/ingestion.routes");
const documentRoutes = require("./routes/document.routes");
const chunkRoutes = require("./routes/chunk.routes");
const embeddingRoutes = require("./routes/embedding.routes");
const retrievalRoutes = require("./routes/retrieval.routes");
const ragRoutes = require("./routes/rag.routes");
const materialRoutes = require("./routes/material.routes");
const materialAnalysisRoutes = require("./routes/material-analysis.routes");

const app = express();

app.use(helmet());

app.use(cors({
     origin: process.env.CLIENT_URL || "http://localhost:5173",
     credentials: true,
     })
);

app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({ extended: true, limit: "2mb" }));


if (process.env.NODE_ENV !== "test") {
     app.use(morgan("dev"));
}


const apiLimiter = rateLimit({
     windowMs: 15 * 60 * 1000,
     max: 200,
     standardHeaders: true,
     legacyHeaders: false,
     message: {
          success: false,
          message: "Too many requests. Please try again later.",
     },
});


app.use('/api', apiLimiter);


app.get('/api/health' , (req, res) => {
     res.status(200).json({
          success: true,
          message: "Backend is online",
          timestamp: new Date().toISOString(),
     });
});

app.get('/' , (req, res) => {
     res.send('server ready !')
})

app.use("/api/ingestion", ingestionRoutes);
app.use("/api/documents", documentRoutes);
app.use("/api/chunks", chunkRoutes);
app.use("/api/embeddings", embeddingRoutes);
app.use("/api/retrieval", retrievalRoutes);
app.use("/api/rag", ragRoutes);
app.use("/api/materials", materialAnalysisRoutes);
app.use("/api/materials", materialRoutes);



app.use((req, res) => {
     res.status(404).json({
          success: false,
          message: `Route ${req.method} ${req.originalUrl} not found`,
     });
});


app.use(
     (err, req, res, next) => {
          console.error(err);
          
          const statusCode = err.statusCode || 500;
          res.status(statusCode).json({
               success: false,
               message: err.message || "Internal server error",
          });
     }
);


module.exports = app;