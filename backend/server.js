require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const multer = require("multer");
const axios = require("axios");
const { ethers } = require("ethers");

const app = express();
app.use(cors());
app.use(express.json());

mongoose.connect("mongodb://127.0.0.1:27017/medtrust");

const upload = multer({ dest: "../uploads/" });

// Models (simplified)
const Campaign = mongoose.model(
  "Campaign",
  new mongoose.Schema({
    title: String,
    patient: String,
    hospital: String,
    riskScore: Number,
    contractAddress: String,
    documentsHash: String,
    status: { type: String, default: "Pending" },
    createdAt: { type: Date, default: Date.now },
  }),
);

// AI Verification Route
app.post("/api/verify", upload.array("documents"), async (req, res) => {
  try {
    const form = new FormData();
    req.files.forEach((f) =>
      form.append("files", require("fs").createReadStream(f.path)),
    );

    const aiRes = await axios.post("http://localhost:8001/verify", form, {
      headers: form.getHeaders(),
    });

    res.json(aiRes.data);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Create Campaign + Deploy Contract (demo uses local Hardhat first)
app.post("/api/campaigns", async (req, res) => {
  const { title, patient, hospital, riskScore } = req.body;

  // Deploy contract (in production use a relayer or factory)
  const provider = new ethers.JsonRpcProvider("http://127.0.0.1:8545"); // Hardhat local
  const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);

  // ... (call deploy script logic here or use ethers to deploy)

  const campaign = await Campaign.create({
    title,
    patient,
    hospital,
    riskScore,
    contractAddress: "0xDeployedAddressHere", // replace with actual
    documentsHash: "0xSHA256HERE",
  });

  res.json(campaign);
});

app.listen(5000, () => console.log("Backend running on http://localhost:5000"));
