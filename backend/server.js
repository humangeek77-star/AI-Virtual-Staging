import express from "express";
import cors from "cors";

const app = express();
const PORT = process.env.PORT || 8080;
const HOST = "0.0.0.0";

app.use(cors());
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

app.get("/", (req, res) => {
  res.json({ status: "AI Virtual Staging Backend Running" });
});

app.get("/health", (req, res) => {
  res.status(200).send("OK");
});

app.listen(PORT, HOST, () => {
  console.log(`Backend running on http://${HOST}:${PORT}`);
});
