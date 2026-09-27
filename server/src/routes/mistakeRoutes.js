import express from "express";

import {
    createMistake,
    getMistakes,
    getTaskMistakes,
    deleteMistake,
} from "../controllers/mistakeController.js";

const router = express.Router();


// ======================================================
// MISTAKES
// ======================================================

router.post(
    "/",
    createMistake
);

router.get(
    "/",
    getMistakes
);

router.get(
    "/tasks/:taskId",
    getTaskMistakes
);

router.delete(
    "/:mistakeId",
    deleteMistake
);


export default router;