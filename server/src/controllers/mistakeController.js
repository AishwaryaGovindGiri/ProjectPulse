import prisma from "../config/db.js";


// ======================================================
// CREATE MISTAKE
// ======================================================

export const createMistake = async (
    req,
    res
) => {
    try {
        const {
            taskId,
            userId,
        } = req.body;

        if (!taskId || !userId) {
            return res.status(400).json({
                message:
                    "Task ID and user ID are required.",
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
        // User must be the task assignee
        // --------------------------------------------------

        if (
            task.assigneeId !==
            userId
        ) {
            return res.status(403).json({
                message:
                    "Only the assigned employee can add a mistake to this task.",
            });
        }

        // --------------------------------------------------
        // Create mistake
        // --------------------------------------------------

        const mistake =
            await prisma.taskMistake.create({
                data: {
                    taskId,
                    userId,
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
                "Mistake recorded successfully.",
            mistake,
        });
    } catch (error) {
        console.error(
            "Create mistake error:",
            error
        );

        return res.status(500).json({
            message:
                "Failed to record mistake.",
            error: error.message,
        });
    }
};


// ======================================================
// GET MISTAKES FOR TASK
// ======================================================

export const getTaskMistakes = async (
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

        const mistakes =
            await prisma.taskMistake.findMany({
                where: {
                    taskId,
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

                orderBy: {
                    createdAt: "desc",
                },
            });

        return res.status(200).json({
            mistakes,
        });
    } catch (error) {
        console.error(
            "Get task mistakes error:",
            error
        );

        return res.status(500).json({
            message:
                "Failed to fetch task mistakes.",
            error: error.message,
        });
    }
};


// ======================================================
// GET ALL MISTAKES
// ======================================================

export const getMistakes = async (
    req,
    res
) => {
    try {
        const {
            userId,
            taskId,
            projectId,
            teamId,
        } = req.query;

        const where = {};

        if (userId) {
            where.userId = userId;
        }

        if (taskId) {
            where.taskId = taskId;
        }

        // Filter through task
        if (projectId || teamId) {
            where.task = {};

            if (projectId) {
                where.task.projectId =
                    projectId;
            }

            if (teamId) {
                where.task.teamId =
                    teamId;
            }
        }

        const mistakes =
            await prisma.taskMistake.findMany({
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
                    createdAt: "desc",
                },
            });

        return res.status(200).json({
            mistakes,
        });
    } catch (error) {
        console.error(
            "Get mistakes error:",
            error
        );

        return res.status(500).json({
            message:
                "Failed to fetch mistakes.",
            error: error.message,
        });
    }
};


// ======================================================
// DELETE MISTAKE
// ======================================================

export const deleteMistake = async (
    req,
    res
) => {
    try {
        const { mistakeId } =
            req.params;

        if (!mistakeId) {
            return res.status(400).json({
                message:
                    "Mistake ID is required.",
            });
        }

        // --------------------------------------------------
        // Find mistake
        // --------------------------------------------------

        const mistake =
            await prisma.taskMistake.findUnique(
                {
                    where: {
                        id: mistakeId,
                    },

                    include: {
                        task: {
                            include: {
                                team: {
                                    include: {
                                        members: true,
                                    },
                                },
                            },
                        },

                        user: true,
                    },
                }
            );

        if (!mistake) {
            return res.status(404).json({
                message:
                    "Mistake not found.",
            });
        }

        // --------------------------------------------------
        // Delete mistake
        //
        // Manager-only authorization can be connected
        // to the authenticated user later.
        // --------------------------------------------------

        await prisma.taskMistake.delete({
            where: {
                id: mistakeId,
            },
        });

        return res.status(200).json({
            message:
                "Mistake deleted successfully.",
        });
    } catch (error) {
        console.error(
            "Delete mistake error:",
            error
        );

        return res.status(500).json({
            message:
                "Failed to delete mistake.",
            error: error.message,
        });
    }
};