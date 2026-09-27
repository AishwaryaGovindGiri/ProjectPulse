import express from "express";

import {
    createTeam,
    getTeams,
    getTeamById,
    addTeamMember,
    updateTeamMemberRole,
    removeTeamMember,
    assignTeamToProject,
    removeTeamFromProject,
} from "../controllers/teamController.js";

const router = express.Router();


// ======================================================
// TEAMS
// ======================================================

router.post(
    "/",
    createTeam
);

router.get(
    "/",
    getTeams
);

router.get(
    "/:teamId",
    getTeamById
);


// ======================================================
// TEAM MEMBERS
// ======================================================

router.post(
    "/:teamId/members",
    addTeamMember
);

router.patch(
    "/members/:teamMemberId/role",
    updateTeamMemberRole
);

router.delete(
    "/members/:teamMemberId",
    removeTeamMember
);


// ======================================================
// TEAM ↔ PROJECT
// ======================================================

router.post(
    "/:teamId/projects",
    assignTeamToProject
);

router.delete(
    "/:teamId/projects/:projectId",
    removeTeamFromProject
);


export default router;