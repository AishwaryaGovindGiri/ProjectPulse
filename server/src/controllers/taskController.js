import prisma from "../config/db.js";


// ======================================================
// UPDATE PROJECT PROGRESS
// ======================================================

const updateProjectProgress = async (projectId) => {
    const totalTasks =
        await prisma.task.count({
            where: {
                projectId,
            },
        });

    if (totalTasks === 0) {
        await prisma.project.update({
            where: {
                id: projectId,
            },
            data: {
                progress: 0,
            },
        });

        return 0;
    }

    const completedTasks =
        await prisma.task.count({
            where: {
                projectId,
                status: "DONE",
            },
        });

    const progress = Math.round(
        (completedTasks / totalTasks) * 100
    );

    await prisma.project.update({
        where: {
            id: projectId,
        },

        data: {
            progress,
        },
    });

    return progress;
};


// ======================================================
// CREATE TASK
// ======================================================

export const createTask = async (
    req,
    res
) => {
    try {
        const {
            projectId,
            teamId,
            title,
            description,
            assigneeId,
            status,
            type,
            priority,
            due_date,
            estimatedHours,
        } = req.body;

        if (
            !projectId ||
            !teamId ||
            !title ||
            !assigneeId ||
            !due_date
        ) {
            return res.status(400).json({
                message:
                    "Project, team, title, assignee, and due date are required.",
            });
        }

        // --------------------------------------------------
        // Check project
        // --------------------------------------------------

        const project =
            await prisma.project.findUnique({
                where: {
                    id: projectId,
                },
            });

        if (!project) {
            return res.status(404).json({
                message: "Project not found.",
            });
        }

        // --------------------------------------------------
        // Check team
        // --------------------------------------------------

        const team =
            await prisma.team.findUnique({
                where: {
                    id: teamId,
                },
            });

        if (!team) {
            return res.status(404).json({
                message: "Team not found.",
            });
        }

        // --------------------------------------------------
        // Team and project must be same workspace
        // --------------------------------------------------

        if (
            team.workspaceId !==
            project.workspaceId
        ) {
            return res.status(400).json({
                message:
                    "Team and project must belong to the same workspace.",
            });
        }

        // --------------------------------------------------
        // Team must be assigned to project
        // --------------------------------------------------

        const projectTeam =
            await prisma.projectTeam.findUnique({
                where: {
                    projectId_teamId: {
                        projectId,
                        teamId,
                    },
                },
            });

        if (!projectTeam) {
            return res.status(400).json({
                message:
                    "This team is not assigned to this project.",
            });
        }

        // --------------------------------------------------
        // Check assignee
        // --------------------------------------------------

        const assignee =
            await prisma.user.findUnique({
                where: {
                    id: assigneeId,
                },
            });

        if (!assignee) {
            return res.status(404).json({
                message:
                    "Assignee user not found.",
            });
        }

        // --------------------------------------------------
        // Assignee must belong to selected team
        // --------------------------------------------------

        const teamMember =
            await prisma.teamMember.findUnique({
                where: {
                    teamId_userId: {
                        teamId,
                        userId: assigneeId,
                    },
                },
            });

        if (!teamMember) {
            return res.status(400).json({
                message:
                    "The selected assignee is not a member of this team.",
            });
        }

        // --------------------------------------------------
        // Assignee must be project member
        // --------------------------------------------------

        const projectMember =
            await prisma.projectMember.findUnique({
                where: {
                    userId_projectId: {
                        userId: assigneeId,
                        projectId,
                    },
                },
            });

        if (!projectMember) {
            return res.status(400).json({
                message:
                    "The assignee must join the project before receiving a task.",
            });
        }

        // --------------------------------------------------
        // Validate date
        // --------------------------------------------------

        const dueDate =
            new Date(due_date);

        if (
            Number.isNaN(
                dueDate.getTime()
            )
        ) {
            return res.status(400).json({
                message:
                    "Invalid due date.",
            });
        }

        // --------------------------------------------------
        // Status
        // --------------------------------------------------

        const taskStatus =
            status || "TODO";

        if (
            ![
                "TODO",
                "IN_PROGRESS",
                "DONE",
            ].includes(taskStatus)
        ) {
            return res.status(400).json({
                message:
                    "Invalid task status.",
            });
        }

        // --------------------------------------------------
        // Task type
        // --------------------------------------------------

        const taskType =
            type || "TASK";

        if (
            ![
                "TASK",
                "BUG",
                "FEATURE",
                "IMPROVEMENT",
                "OTHER",
            ].includes(taskType)
        ) {
            return res.status(400).json({
                message:
                    "Invalid task type.",
            });
        }

        // --------------------------------------------------
        // Priority
        // --------------------------------------------------

        const taskPriority =
            priority || "MEDIUM";

        if (
            ![
                "LOW",
                "MEDIUM",
                "HIGH",
            ].includes(taskPriority)
        ) {
            return res.status(400).json({
                message:
                    "Invalid task priority.",
            });
        }

        // --------------------------------------------------
        // Timeline
        // --------------------------------------------------

        let startedAt = null;
        let completedAt = null;

        if (
            taskStatus ===
            "IN_PROGRESS"
        ) {
            startedAt = new Date();
        }

        if (
            taskStatus ===
            "DONE"
        ) {
            startedAt = new Date();
            completedAt = new Date();
        }

        // --------------------------------------------------
        // Create task
        // --------------------------------------------------

        const task =
            await prisma.task.create({
                data: {
                    projectId,
                    teamId,

                    title: title.trim(),

                    description:
                        description?.trim() ||
                        null,

                    status: taskStatus,

                    type: taskType,

                    priority: taskPriority,

                    assigneeId,

                    due_date: dueDate,

                    estimatedHours:
                        estimatedHours !==
                            undefined &&
                        estimatedHours !==
                            null &&
                        estimatedHours !== ""
                            ? Number(
                                  estimatedHours
                              )
                            : null,

                    startedAt,
                    completedAt,
                },

                include: {
                    project: true,

                    team: {
                        include: {
                            members: {
                                include: {
                                    user: true,
                                },
                            },
                        },
                    },

                    assignee: true,

                    comments: {
                        include: {
                            user: true,
                        },
                    },

                    mistakes: {
                        include: {
                            user: true,
                        },
                    },
                },
            });

        // --------------------------------------------------
        // Update project progress
        // --------------------------------------------------

        await updateProjectProgress(
            projectId
        );

        return res.status(201).json({
            message:
                "Task created successfully.",
            task,
        });
    } catch (error) {
        console.error(
            "Create task error:",
            error
        );

        return res.status(500).json({
            message:
                "Failed to create task.",
            error: error.message,
        });
    }
};


// ======================================================
// GET TASKS
// ======================================================

export const getTasks = async (
    req,
    res
) => {
    try {
        const {
            projectId,
            teamId,
            assigneeId,
            status,
        } = req.query;

        const where = {};

        if (projectId) {
            where.projectId = projectId;
        }

        if (teamId) {
            where.teamId = teamId;
        }

        if (assigneeId) {
            where.assigneeId =
                assigneeId;
        }

        if (status) {
            where.status = status;
        }

        const tasks =
            await prisma.task.findMany({
                where,

                include: {
                    project: true,

                    team: {
                        include: {
                            members: {
                                include: {
                                    user: true,
                                },
                            },
                        },
                    },

                    assignee: true,

                    comments: {
                        include: {
                            user: true,
                        },

                        orderBy: {
                            createdAt: "asc",
                        },
                    },

                    mistakes: {
                        include: {
                            user: true,
                        },

                        orderBy: {
                            createdAt: "desc",
                        },
                    },
                },

                orderBy: {
                    createdAt: "desc",
                },
            });

        return res.status(200).json({
            tasks,
        });
    } catch (error) {
        console.error(
            "Get tasks error:",
            error
        );

        return res.status(500).json({
            message:
                "Failed to fetch tasks.",
            error: error.message,
        });
    }
};


// ======================================================
// GET TASK BY ID
// ======================================================

export const getTaskById = async (
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

        const task =
            await prisma.task.findUnique({
                where: {
                    id: taskId,
                },

                include: {
                    project: true,

                    team: {
                        include: {
                            members: {
                                include: {
                                    user: true,
                                },
                            },

                            projects: {
                                include: {
                                    project: true,
                                },
                            },
                        },
                    },

                    assignee: true,

                    comments: {
                        include: {
                            user: true,
                        },

                        orderBy: {
                            createdAt: "asc",
                        },
                    },

                    mistakes: {
                        include: {
                            user: true,
                        },

                        orderBy: {
                            createdAt: "desc",
                        },
                    },
                },
            });

        if (!task) {
            return res.status(404).json({
                message: "Task not found.",
            });
        }

        return res.status(200).json({
            task,
        });
    } catch (error) {
        console.error(
            "Get task error:",
            error
        );

        return res.status(500).json({
            message:
                "Failed to fetch task.",
            error: error.message,
        });
    }
};


// ======================================================
// UPDATE TASK STATUS
// ======================================================

export const updateTaskStatus = async (
    req,
    res
) => {
    try {
        const { taskId } = req.params;

        const { status } = req.body;

        if (!taskId || !status) {
            return res.status(400).json({
                message:
                    "Task ID and status are required.",
            });
        }

        if (
            ![
                "TODO",
                "IN_PROGRESS",
                "DONE",
            ].includes(status)
        ) {
            return res.status(400).json({
                message:
                    "Invalid task status.",
            });
        }

        const existingTask =
            await prisma.task.findUnique({
                where: {
                    id: taskId,
                },
            });

        if (!existingTask) {
            return res.status(404).json({
                message: "Task not found.",
            });
        }

        let startedAt =
            existingTask.startedAt;

        let completedAt =
            existingTask.completedAt;

        // --------------------------------------------------
        // TODO
        // --------------------------------------------------

        if (status === "TODO") {
            completedAt = null;
        }

        // --------------------------------------------------
        // IN PROGRESS
        // --------------------------------------------------

        if (
            status ===
            "IN_PROGRESS"
        ) {
            if (!startedAt) {
                startedAt = new Date();
            }

            completedAt = null;
        }

        // --------------------------------------------------
        // DONE
        // --------------------------------------------------

        if (status === "DONE") {
            if (!startedAt) {
                startedAt = new Date();
            }

            completedAt = new Date();
        }

        const task =
            await prisma.task.update({
                where: {
                    id: taskId,
                },

                data: {
                    status,
                    startedAt,
                    completedAt,
                },

                include: {
                    project: true,

                    team: {
                        include: {
                            members: {
                                include: {
                                    user: true,
                                },
                            },
                        },
                    },

                    assignee: true,

                    comments: {
                        include: {
                            user: true,
                        },
                    },

                    mistakes: {
                        include: {
                            user: true,
                        },
                    },
                },
            });

        // --------------------------------------------------
        // Update project progress
        // --------------------------------------------------

        await updateProjectProgress(
            existingTask.projectId
        );

        return res.status(200).json({
            message:
                "Task status updated successfully.",
            task,
        });
    } catch (error) {
        console.error(
            "Update task status error:",
            error
        );

        return res.status(500).json({
            message:
                "Failed to update task status.",
            error: error.message,
        });
    }
};


// ======================================================
// UPDATE TASK TEAM
// ======================================================

export const updateTaskTeam = async (
    req,
    res
) => {
    try {
        const { taskId } = req.params;

        const { teamId } = req.body;

        if (!taskId || !teamId) {
            return res.status(400).json({
                message:
                    "Task ID and team ID are required.",
            });
        }

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

        const team =
            await prisma.team.findUnique({
                where: {
                    id: teamId,
                },
            });

        if (!team) {
            return res.status(404).json({
                message: "Team not found.",
            });
        }

        // --------------------------------------------------
        // Team must belong to same workspace
        // --------------------------------------------------

        const project =
            await prisma.project.findUnique({
                where: {
                    id: task.projectId,
                },
            });

        if (!project) {
            return res.status(404).json({
                message: "Project not found.",
            });
        }

        if (
            project.workspaceId !==
            team.workspaceId
        ) {
            return res.status(400).json({
                message:
                    "Team and project must belong to the same workspace.",
            });
        }

        // --------------------------------------------------
        // Team must be assigned to project
        // --------------------------------------------------

        const projectTeam =
            await prisma.projectTeam.findUnique({
                where: {
                    projectId_teamId: {
                        projectId:
                            task.projectId,
                        teamId,
                    },
                },
            });

        if (!projectTeam) {
            return res.status(400).json({
                message:
                    "This team is not assigned to the project.",
            });
        }

        // --------------------------------------------------
        // Existing assignee must belong to new team
        // --------------------------------------------------

        const assigneeMembership =
            await prisma.teamMember.findUnique({
                where: {
                    teamId_userId: {
                        teamId,
                        userId:
                            task.assigneeId,
                    },
                },
            });

        if (!assigneeMembership) {
            return res.status(400).json({
                message:
                    "The current assignee is not a member of the selected team.",
            });
        }

        const updatedTask =
            await prisma.task.update({
                where: {
                    id: taskId,
                },

                data: {
                    teamId,
                },

                include: {
                    project: true,

                    team: {
                        include: {
                            members: {
                                include: {
                                    user: true,
                                },
                            },
                        },
                    },

                    assignee: true,

                    comments: {
                        include: {
                            user: true,
                        },
                    },

                    mistakes: {
                        include: {
                            user: true,
                        },
                    },
                },
            });

        return res.status(200).json({
            message:
                "Task team updated successfully.",
            task: updatedTask,
        });
    } catch (error) {
        console.error(
            "Update task team error:",
            error
        );

        return res.status(500).json({
            message:
                "Failed to update task team.",
            error: error.message,
        });
    }
};