import express from "express";
import cors from "cors";
import fetch from "node-fetch";

const app = express();

// Cloud Run requires listening on process.env.PORT
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

// Example staging route (modify as needed)
app.post("/api/stage", async (req, res) => {
  try {
    const { image, roomType } = req.body;

    if (!image) {
      return res.status(400).json({ error: "Image is required" });
    }

    // Example call to your AI model or external API
    const response = await fetch("https://your-model-endpoint.com/run", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ image, roomType }),
    });

    const result = await response.json();
    res.json(result);

  } catch (err) {
    console.error("Error in /api/stage:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Health check (Cloud Run uses this)
app.get("/health", (req, res) => {
  res.status(200).send("OK");
});

// Start server
app.listen(PORT, HOST, () => {
  console.log(`Backend running on http://${HOST}:${PORT}`);
});
