import express from "express";

import {
    createTask,
    getTasks,
    getTaskById,
    updateTaskStatus,
    updateTaskTeam,
} from "../controllers/taskController.js";

const router = express.Router();


// ======================================================
// TASKS
// ======================================================

router.post(
    "/",
    createTask
);

router.get(
    "/",
    getTasks
);

router.get(
    "/:taskId",
    getTaskById
);


// ======================================================
// TASK STATUS
// ======================================================

router.patch(
    "/:taskId/status",
    updateTaskStatus
);


// ======================================================
// TASK TEAM
// ======================================================

router.patch(
    "/:taskId/team",
    updateTaskTeam
);


export default router;