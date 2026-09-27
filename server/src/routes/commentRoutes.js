import express from "express";

import {
    createComment,
    getTaskComments,
    getComments,
    deleteComment,
} from "../controllers/commentController.js";

const router = express.Router();


// ======================================================
// COMMENTS
// ======================================================

router.post(
    "/",
    createComment
);

router.get(
    "/",
    getComments
);

router.get(
    "/task/:taskId",
    getTaskComments
);

router.delete(
    "/:commentId",
    deleteComment
);


export default router;