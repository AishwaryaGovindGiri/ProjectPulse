import prisma from "../config/db.js";


// ======================================================
// CREATE TEAM
// ======================================================

export const createTeam = async (req, res) => {
    try {
        const {
            name,
            description,
            workspaceId,
        } = req.body;

        if (!name || !workspaceId) {
            return res.status(400).json({
                message:
                    "Team name and workspace are required.",
            });
        }

        // --------------------------------------------------
        // Check workspace
        // --------------------------------------------------

        const workspace =
            await prisma.workspace.findUnique({
                where: {
                    id: workspaceId,
                },
            });

        if (!workspace) {
            return res.status(404).json({
                message: "Workspace not found.",
            });
        }

        // --------------------------------------------------
        // Check duplicate team name
        // --------------------------------------------------

        const existingTeam =
            await prisma.team.findUnique({
                where: {
                    workspaceId_name: {
                        workspaceId,
                        name: name.trim(),
                    },
                },
            });

        if (existingTeam) {
            return res.status(409).json({
                message:
                    "A team with this name already exists in this workspace.",
            });
        }

        // --------------------------------------------------
        // Create team
        // --------------------------------------------------

        const team =
            await prisma.team.create({
                data: {
                    name: name.trim(),
                    description:
                        description?.trim() || null,
                    workspaceId,
                },

                include: {
                    workspace: true,

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
            });

        return res.status(201).json({
            message:
                "Team created successfully.",
            team,
        });
    } catch (error) {
        console.error(
            "Create team error:",
            error
        );

        return res.status(500).json({
            message: "Failed to create team.",
            error: error.message,
        });
    }
};


// ======================================================
// GET TEAMS
// ======================================================

export const getTeams = async (req, res) => {
    try {
        const { workspaceId } = req.query;

        const where = {};

        if (workspaceId) {
            where.workspaceId = workspaceId;
        }

        const teams =
            await prisma.team.findMany({
                where,

                include: {
                    workspace: true,

                    members: {
                        include: {
                            user: true,
                        },

                        orderBy: {
                            user: {
                                name: "asc",
                            },
                        },
                    },

                    projects: {
                        include: {
                            project: true,
                        },

                        orderBy: {
                            createdAt: "desc",
                        },
                    },

                    tasks: {
                        include: {
                            assignee: true,
                        },
                    },
                },

                orderBy: {
                    name: "asc",
                },
            });

        return res.status(200).json({
            teams,
        });
    } catch (error) {
        console.error(
            "Get teams error:",
            error
        );

        return res.status(500).json({
            message: "Failed to fetch teams.",
            error: error.message,
        });
    }
};


// ======================================================
// GET TEAM BY ID
// ======================================================

export const getTeamById = async (
    req,
    res
) => {
    try {
        const { teamId } = req.params;

        if (!teamId) {
            return res.status(400).json({
                message:
                    "Team ID is required.",
            });
        }

        const team =
            await prisma.team.findUnique({
                where: {
                    id: teamId,
                },

                include: {
                    workspace: true,

                    members: {
                        include: {
                            user: true,
                        },

                        orderBy: {
                            user: {
                                name: "asc",
                            },
                        },
                    },

                    projects: {
                        include: {
                            project: {
                                include: {
                                    members: {
                                        include: {
                                            user: true,
                                        },
                                    },
                                },
                            },
                        },
                    },

                    tasks: {
                        include: {
                            project: true,
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

                        orderBy: {
                            createdAt: "desc",
                        },
                    },
                },
            });

        if (!team) {
            return res.status(404).json({
                message: "Team not found.",
            });
        }

        return res.status(200).json({
            team,
        });
    } catch (error) {
        console.error(
            "Get team error:",
            error
        );

        return res.status(500).json({
            message: "Failed to fetch team.",
            error: error.message,
        });
    }
};


// ======================================================
// ADD MEMBER TO TEAM
// ======================================================

export const addTeamMember = async (
    req,
    res
) => {
    try {
        const { teamId } = req.params;

        const {
            userId,
            role,
        } = req.body;

        if (!teamId || !userId) {
            return res.status(400).json({
                message:
                    "Team ID and user ID are required.",
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
        // User must belong to workspace
        // --------------------------------------------------

        const workspaceMember =
            await prisma.workspaceMember.findUnique(
                {
                    where: {
                        userId_workspaceId: {
                            userId,
                            workspaceId:
                                team.workspaceId,
                        },
                    },
                }
            );

        if (!workspaceMember) {
            return res.status(400).json({
                message:
                    "User must be a member of the workspace before joining a team.",
            });
        }

        // --------------------------------------------------
        // Check existing team membership
        //
        // IMPORTANT:
        // One employee = one team globally.
        // --------------------------------------------------

        const existingMembership =
            await prisma.teamMember.findUnique({
                where: {
                    userId,
                },

                include: {
                    team: true,
                },
            });

        if (existingMembership) {
            if (
                existingMembership.teamId ===
                teamId
            ) {
                return res.status(409).json({
                    message:
                        "User is already a member of this team.",
                    member:
                        existingMembership,
                });
            }

            return res.status(409).json({
                message:
                    `User already belongs to ${existingMembership.team.name}. An employee can belong to only one team.`,
                currentTeam:
                    existingMembership.team,
            });
        }

        // --------------------------------------------------
        // Create team membership
        // --------------------------------------------------

        const member =
            await prisma.teamMember.create({
                data: {
                    teamId,
                    userId,

                    role:
                        role === "MANAGER"
                            ? "MANAGER"
                            : "MEMBER",
                },

                include: {
                    user: true,
                    team: true,
                },
            });

        return res.status(201).json({
            message:
                "User added to team successfully.",
            member,
        });
    } catch (error) {
        console.error(
            "Add team member error:",
            error
        );

        return res.status(500).json({
            message:
                "Failed to add team member.",
            error: error.message,
        });
    }
};


// ======================================================
// UPDATE TEAM MEMBER ROLE
// ======================================================

export const updateTeamMemberRole = async (
    req,
    res
) => {
    try {
        const { teamMemberId } =
            req.params;

        const { role } = req.body;

        if (!teamMemberId || !role) {
            return res.status(400).json({
                message:
                    "Team member ID and role are required.",
            });
        }

        if (
            role !== "MANAGER" &&
            role !== "MEMBER"
        ) {
            return res.status(400).json({
                message:
                    "Role must be MANAGER or MEMBER.",
            });
        }

        const teamMember =
            await prisma.teamMember.findUnique({
                where: {
                    id: teamMemberId,
                },
            });

        if (!teamMember) {
            return res.status(404).json({
                message:
                    "Team member not found.",
            });
        }

        const updatedMember =
            await prisma.teamMember.update({
                where: {
                    id: teamMemberId,
                },

                data: {
                    role,
                },

                include: {
                    user: true,
                    team: true,
                },
            });

        return res.status(200).json({
            message:
                "Team member role updated successfully.",
            member: updatedMember,
        });
    } catch (error) {
        console.error(
            "Update team member role error:",
            error
        );

        return res.status(500).json({
            message:
                "Failed to update team member role.",
            error: error.message,
        });
    }
};


// ======================================================
// REMOVE MEMBER FROM TEAM
// ======================================================

export const removeTeamMember = async (
    req,
    res
) => {
    try {
        const { teamMemberId } =
            req.params;

        if (!teamMemberId) {
            return res.status(400).json({
                message:
                    "Team member ID is required.",
            });
        }

        const teamMember =
            await prisma.teamMember.findUnique({
                where: {
                    id: teamMemberId,
                },

                include: {
                    user: true,
                    team: true,
                },
            });

        if (!teamMember) {
            return res.status(404).json({
                message:
                    "Team member not found.",
            });
        }

        // --------------------------------------------------
        // Check whether member is still assigned
        // to tasks in this team.
        // --------------------------------------------------

        const taskCount =
            await prisma.task.count({
                where: {
                    teamId:
                        teamMember.teamId,

                    assigneeId:
                        teamMember.userId,
                },
            });

        if (taskCount > 0) {
            return res.status(400).json({
                message:
                    "This member cannot be removed because they still have tasks assigned in this team.",
                taskCount,
            });
        }

        await prisma.teamMember.delete({
            where: {
                id: teamMemberId,
            },
        });

        return res.status(200).json({
            message:
                "Team member removed successfully.",
        });
    } catch (error) {
        console.error(
            "Remove team member error:",
            error
        );

        return res.status(500).json({
            message:
                "Failed to remove team member.",
            error: error.message,
        });
    }
};


// ======================================================
// ASSIGN TEAM TO PROJECT
// ======================================================

export const assignTeamToProject = async (
    req,
    res
) => {
    try {
        const { teamId } = req.params;

        const { projectId } = req.body;

        if (!teamId || !projectId) {
            return res.status(400).json({
                message:
                    "Team ID and project ID are required.",
            });
        }

        // --------------------------------------------------
        // Get team
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
        // Get project
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
        // Same workspace
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
        // Check duplicate assignment
        // --------------------------------------------------

        const existing =
            await prisma.projectTeam.findUnique({
                where: {
                    projectId_teamId: {
                        projectId,
                        teamId,
                    },
                },
            });

        if (existing) {
            return res.status(409).json({
                message:
                    "Team is already assigned to this project.",
            });
        }

        // --------------------------------------------------
        // Assign
        // --------------------------------------------------

        const projectTeam =
            await prisma.projectTeam.create({
                data: {
                    projectId,
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
                },
            });

        return res.status(201).json({
            message:
                "Team assigned to project successfully.",
            projectTeam,
        });
    } catch (error) {
        console.error(
            "Assign team to project error:",
            error
        );

        return res.status(500).json({
            message:
                "Failed to assign team to project.",
            error: error.message,
        });
    }
};


// ======================================================
// REMOVE TEAM FROM PROJECT
// ======================================================

export const removeTeamFromProject = async (
    req,
    res
) => {
    try {
        const {
            teamId,
            projectId,
        } = req.params;

        if (!teamId || !projectId) {
            return res.status(400).json({
                message:
                    "Team ID and project ID are required.",
            });
        }

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
            return res.status(404).json({
                message:
                    "Team is not assigned to this project.",
            });
        }

        // --------------------------------------------------
        // Prevent removing a team while tasks
        // still belong to that team in the project.
        // --------------------------------------------------

        const taskCount =
            await prisma.task.count({
                where: {
                    projectId,
                    teamId,
                },
            });

        if (taskCount > 0) {
            return res.status(400).json({
                message:
                    "This team cannot be removed because tasks are still assigned to it.",
                taskCount,
            });
        }

        await prisma.projectTeam.delete({
            where: {
                projectId_teamId: {
                    projectId,
                    teamId,
                },
            },
        });

        return res.status(200).json({
            message:
                "Team removed from project successfully.",
        });
    } catch (error) {
        console.error(
            "Remove team from project error:",
            error
        );

        return res.status(500).json({
            message:
                "Failed to remove team from project.",
            error: error.message,
        });
    }
};