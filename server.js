import express from "express";
import cors from "cors";

const app = express();

// Cloud Run requires this port + host
const PORT = process.env.PORT || 8080;
const HOST = "0.0.0.0";

// Middleware
app.use(cors());
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

// Root route
app.get("/", (req, res) => {
  res.json({ status: "AI Virtual Staging Backend Running" });
});

// Example API route
app.post("/api/stage", async (req, res) => {
  try {
    const { image, roomType } = req.body;

    if (!image) {
      return res.status(400).json({ error: "Image is required" });
    }

    // Placeholder response — replace with your AI logic later
    res.json({
      message: "Staging request received",
      roomType,
      imageLength: image.length
    });

  } catch (err) {
    console.error("Error in /api/stage:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Health check
app.get("/health", (req, res) => {
  res.status(200).send("OK");
});

// Start server
app.listen(PORT, HOST, () => {
  console.log(`Backend running on http://${HOST}:${PORT}`);
});
