import express from "express";

import {
    createProject,
    getProjects,
    getProjectById,
    verifyProjectPassword,
    joinProject,
    addTeamToProject,
    removeTeamFromProject,
} from "../controllers/projectController.js";

const router = express.Router();

router.post("/", createProject);

router.get("/", getProjects);

router.post(
    "/:projectId/verify-password",
    verifyProjectPassword
);

router.post(
    "/:projectId/join",
    joinProject
);

router.get(
    "/:projectId",
    getProjectById
);

router.post(
    "/:projectId/teams",
    addTeamToProject
);

router.delete(
    "/:projectId/teams/:teamId",
    removeTeamFromProject
);

export default router;