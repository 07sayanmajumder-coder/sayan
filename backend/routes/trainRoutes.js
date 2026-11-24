
import express from "express";

import {
  getLiveTrainStatus,
  getTrainSchedule,
  getTrainsBetweenStations,
  getTrainCatalog
} from "../controllers/trainController.js";

const router = express.Router();

// Search up to 300 trains
router.get("/catalog", getTrainCatalog);

// Search trains between stations
router.get("/between", getTrainsBetweenStations);

// Live train status
router.get("/:trainNumber/live", getLiveTrainStatus);

// Train schedule
router.get("/:trainNumber/schedule", getTrainSchedule);

export default router;
