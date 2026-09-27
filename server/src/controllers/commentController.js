import prisma from "../config/db.js";


// ======================================================
// CREATE COMMENT
// ======================================================

export const createComment = async (
    req,
    res
) => {
    try {
        const {
            taskId,
            userId,
            content,
        } = req.body;

        if (
            !taskId ||
            !userId ||
            !content?.trim()
        ) {
            return res.status(400).json({
                message:
                    "Task, user, and comment are required.",
            });
        }

        // --------------------------------------------------
        // Check task
        // --------------------------------------------------

        const task =
            await prisma.task.findUnique({
                where: {
                    id: taskId,
                },
            });

        if (!task) {
            return res.status(404).json({
                message: "Task not found.",
            });
        }

        // --------------------------------------------------
        // Check user
        // --------------------------------------------------

        const user =
            await prisma.user.findUnique({
                where: {
                    id: userId,
                },
            });

        if (!user) {
            return res.status(404).json({
                message: "User not found.",
            });
        }

        // --------------------------------------------------
        // Create comment
        // --------------------------------------------------

        const comment =
            await prisma.comment.create({
                data: {
                    taskId,
                    userId,
                    content:
                        content.trim(),
                },

                include: {
                    user: true,

                    task: {
                        include: {
                            project: true,
                            team: true,
                        },
                    },
                },
            });

        return res.status(201).json({
            message:
                "Comment added successfully.",
            comment,
        });
    } catch (error) {
        console.error(
            "Create comment error:",
            error
        );

        return res.status(500).json({
            message:
                "Failed to create comment.",
            error: error.message,
        });
    }
};


// ======================================================
// GET COMMENTS FOR TASK
// ======================================================

export const getTaskComments = async (
    req,
    res
) => {
    try {
        const { taskId } = req.params;

        if (!taskId) {
            return res.status(400).json({
                message:
                    "Task ID is required.",
            });
        }

        // --------------------------------------------------
        // Check task
        // --------------------------------------------------

        const task =
            await prisma.task.findUnique({
                where: {
                    id: taskId,
                },

                select: {
                    id: true,
                },
            });

        if (!task) {
            return res.status(404).json({
                message: "Task not found.",
            });
        }

        // --------------------------------------------------
        // Get comments
        // --------------------------------------------------

        const comments =
            await prisma.comment.findMany({
                where: {
                    taskId,
                },

                include: {
                    user: true,
                },

                orderBy: {
                    createdAt: "asc",
                },
            });

        return res.status(200).json({
            comments,
        });
    } catch (error) {
        console.error(
            "Get task comments error:",
            error
        );

        return res.status(500).json({
            message:
                "Failed to fetch comments.",
            error: error.message,
        });
    }
};


// ======================================================
// GET ALL COMMENTS
// ======================================================

export const getComments = async (
    req,
    res
) => {
    try {
        const {
            taskId,
            userId,
            projectId,
        } = req.query;

        const where = {};

        if (taskId) {
            where.taskId = taskId;
        }

        if (userId) {
            where.userId = userId;
        }

        if (projectId) {
            where.task = {
                projectId,
            };
        }

        const comments =
            await prisma.comment.findMany({
                where,

                include: {
                    user: true,

                    task: {
                        include: {
                            project: true,
                            team: true,
                        },
                    },
                },

                orderBy: {
                    createdAt: "asc",
                },
            });

        return res.status(200).json({
            comments,
        });
    } catch (error) {
        console.error(
            "Get comments error:",
            error
        );

        return res.status(500).json({
            message:
                "Failed to fetch comments.",
            error: error.message,
        });
    }
};


// ======================================================
// DELETE COMMENT
// ======================================================

export const deleteComment = async (
    req,
    res
) => {
    try {
        const { commentId } =
            req.params;

        if (!commentId) {
            return res.status(400).json({
                message:
                    "Comment ID is required.",
            });
        }

        const comment =
            await prisma.comment.findUnique({
                where: {
                    id: commentId,
                },
            });

        if (!comment) {
            return res.status(404).json({
                message:
                    "Comment not found.",
            });
        }

        await prisma.comment.delete({
            where: {
                id: commentId,
            },
        });

        return res.status(200).json({
            message:
                "Comment deleted successfully.",
        });
    } catch (error) {
        console.error(
            "Delete comment error:",
            error
        );

        return res.status(500).json({
            message:
                "Failed to delete comment.",
            error: error.message,
        });
    }
};