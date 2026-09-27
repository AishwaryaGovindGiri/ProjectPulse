import express from "express";

const router = express.Router();

router.get("/test", (req, res) => {
  res.json({
    message: "ProjectPulse frontend and backend are connected",
  });
});

export default router;