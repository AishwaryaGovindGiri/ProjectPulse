import express from "express";

import {
    createWorkspace,
    getWorkspaces,
    getWorkspaceById,
    getWorkspaceMembers,
    joinWorkspace,
    addWorkspaceMember,
    updateWorkspaceMember,
    removeWorkspaceMember,
    updateWorkspace,
    deleteWorkspace,
} from "../controllers/workspaceController.js";

const router = express.Router();


// ======================================================
// WORKSPACE
// ======================================================

router.post("/", createWorkspace);

router.get("/", getWorkspaces);

router.get(
    "/:workspaceId",
    getWorkspaceById
);

router.patch(
    "/:workspaceId",
    updateWorkspace
);

router.delete(
    "/:workspaceId",
    deleteWorkspace
);


// ======================================================
// WORKSPACE MEMBERS
// ======================================================

router.get(
    "/:workspaceId/members",
    getWorkspaceMembers
);

router.post(
    "/:workspaceId/join",
    joinWorkspace
);

router.post(
    "/:workspaceId/members",
    addWorkspaceMember
);

router.patch(
    "/members/:memberId",
    updateWorkspaceMember
);

router.delete(
    "/members/:memberId",
    removeWorkspaceMember
);


export default router;