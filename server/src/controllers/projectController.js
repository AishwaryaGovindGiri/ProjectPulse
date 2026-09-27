import bcrypt from "bcryptjs";
import prisma from "../config/db.js";


// ======================================================
// CREATE PROJECT
// ======================================================

export const createProject = async (req, res) => {
    try {
        const {
            name,
            description,
            priority,
            status,
            start_date,
            end_date,
            workspaceId,
            budget,
            teamIds,
            password,
        } = req.body;

        if (!name || !workspaceId) {
            return res.status(400).json({
                message:
                    "Project name and workspace are required.",
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
        // Validate teams
        // --------------------------------------------------

        const selectedTeamIds = Array.isArray(teamIds)
            ? [...new Set(teamIds)]
            : [];

        let teams = [];

        if (selectedTeamIds.length > 0) {
            teams = await prisma.team.findMany({
                where: {
                    id: {
                        in: selectedTeamIds,
                    },
                    workspaceId,
                },
            });

            if (
                teams.length !==
                selectedTeamIds.length
            ) {
                return res.status(400).json({
                    message:
                        "One or more selected teams do not belong to this workspace.",
                });
            }
        }

        // --------------------------------------------------
        // Hash project password
        // --------------------------------------------------

        let passwordHash = null;

        if (password?.trim()) {
            passwordHash = await bcrypt.hash(
                password.trim(),
                10
            );
        }

        // --------------------------------------------------
        // Create project + team assignments
        // --------------------------------------------------

        const project =
            await prisma.$transaction(
                async (tx) => {
                    const newProject =
                        await tx.project.create({
                            data: {
                                id: crypto.randomUUID(),

                                name: name.trim(),

                                description:
                                    description?.trim() ||
                                    null,

                                priority:
                                    priority || "MEDIUM",

                                status:
                                    status || "ACTIVE",

                                start_date:
                                    start_date
                                        ? new Date(
                                              start_date
                                          )
                                        : null,

                                end_date:
                                    end_date
                                        ? new Date(
                                              end_date
                                          )
                                        : null,

                                workspaceId,

                                budget:
                                    budget !== undefined &&
                                    budget !== null &&
                                    budget !== ""
                                        ? Number(budget)
                                        : null,

                                passwordHash,
                            },
                        });

                    if (
                        selectedTeamIds.length > 0
                    ) {
                        await tx.projectTeam.createMany(
                            {
                                data:
                                    selectedTeamIds.map(
                                        (teamId) => ({
                                            projectId:
                                                newProject.id,
                                            teamId,
                                        })
                                    ),
                            }
                        );
                    }

                    return newProject;
                }
            );

        // --------------------------------------------------
        // Fetch complete project
        // --------------------------------------------------

        const completeProject =
            await prisma.project.findUnique({
                where: {
                    id: project.id,
                },

                include: {
                    workspace: true,

                    teams: {
                        include: {
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
                    },

                    members: {
                        include: {
                            user: true,
                        },
                    },
                },
            });

        return res.status(201).json({
            message:
                "Project created successfully.",
            project: completeProject,
        });
    } catch (error) {
        console.error(
            "Create project error:",
            error
        );

        return res.status(500).json({
            message:
                "Failed to create project.",
            error: error.message,
        });
    }
};


// ======================================================
// GET PROJECTS
// ======================================================

export const getProjects = async (req, res) => {
    try {
        const {
            workspaceId,
            userId,
        } = req.query;

        const where = {};

        if (workspaceId) {
            where.workspaceId = workspaceId;
        }

        // If userId is supplied, return projects
        // that the user has joined.
        if (userId) {
            where.members = {
                some: {
                    userId,
                },
            };
        }

        const projects =
            await prisma.project.findMany({
                where,

                include: {
                    workspace: true,

                    teams: {
                        include: {
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
                    },

                    members: {
                        include: {
                            user: true,
                        },
                    },

                    tasks: {
                        include: {
                            assignee: true,
                            team: true,
                            mistakes: true,
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
            projects,
        });
    } catch (error) {
        console.error(
            "Get projects error:",
            error
        );

        return res.status(500).json({
            message:
                "Failed to fetch projects.",
            error: error.message,
        });
    }
};


// ======================================================
// GET PROJECT BY ID
// ======================================================

export const getProjectById = async (
    req,
    res
) => {
    try {
        const { projectId } = req.params;

        if (!projectId) {
            return res.status(400).json({
                message:
                    "Project ID is required.",
            });
        }

        const project =
            await prisma.project.findUnique({
                where: {
                    id: projectId,
                },

                include: {
                    workspace: true,

                    owner: true,

                    teams: {
                        include: {
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
                        },
                    },

                    members: {
                        include: {
                            user: true,
                        },
                    },

                    tasks: {
                        include: {
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
                    },
                },
            });

        if (!project) {
            return res.status(404).json({
                message: "Project not found.",
            });
        }

        // Never expose the password hash.
        const {
            passwordHash,
            ...safeProject
        } = project;

        return res.status(200).json({
            project: safeProject,
        });
    } catch (error) {
        console.error(
            "Get project error:",
            error
        );

        return res.status(500).json({
            message:
                "Failed to fetch project.",
            error: error.message,
        });
    }
};


// ======================================================
// VERIFY PROJECT PASSWORD
// ======================================================

export const verifyProjectPassword = async (
    req,
    res
) => {
    try {
        const { projectId } = req.params;

        const { password } = req.body;

        if (!projectId || !password) {
            return res.status(400).json({
                message:
                    "Project ID and password are required.",
            });
        }

        const project =
            await prisma.project.findUnique({
                where: {
                    id: projectId,
                },

                select: {
                    id: true,
                    passwordHash: true,
                },
            });

        if (!project) {
            return res.status(404).json({
                message: "Project not found.",
            });
        }

        // Projects created without a password
        // can be joined directly.
        if (!project.passwordHash) {
            return res.status(200).json({
                valid: true,
                message:
                    "Project does not require a password.",
            });
        }

        const valid =
            await bcrypt.compare(
                password,
                project.passwordHash
            );

        if (!valid) {
            return res.status(401).json({
                valid: false,
                message:
                    "Incorrect project password.",
            });
        }

        return res.status(200).json({
            valid: true,
            message:
                "Project password verified.",
        });
    } catch (error) {
        console.error(
            "Verify project password error:",
            error
        );

        return res.status(500).json({
            message:
                "Failed to verify project password.",
            error: error.message,
        });
    }
};


// ======================================================
// JOIN PROJECT
// ======================================================

export const joinProject = async (
    req,
    res
) => {
    try {
        const { projectId } = req.params;

        const {
            userId,
            password,
            teamId,
        } = req.body;

        if (
            !projectId ||
            !userId ||
            !teamId
        ) {
            return res.status(400).json({
                message:
                    "Project, user, and team are required.",
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
        // Get user
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
        // Verify project password
        // --------------------------------------------------

        if (project.passwordHash) {
            if (!password) {
                return res.status(401).json({
                    message:
                        "Project password is required.",
                });
            }

            const valid =
                await bcrypt.compare(
                    password,
                    project.passwordHash
                );

            if (!valid) {
                return res.status(401).json({
                    message:
                        "Incorrect project password.",
                });
            }
        }

        // --------------------------------------------------
        // Verify workspace membership
        // --------------------------------------------------

        const workspaceMember =
            await prisma.workspaceMember.findUnique(
                {
                    where: {
                        userId_workspaceId: {
                            userId,
                            workspaceId:
                                project.workspaceId,
                        },
                    },
                }
            );

        if (!workspaceMember) {
            return res.status(403).json({
                message:
                    "You must be a member of the workspace before joining this project.",
            });
        }

        // --------------------------------------------------
        // Verify team
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

        if (
            team.workspaceId !==
            project.workspaceId
        ) {
            return res.status(400).json({
                message:
                    "This team does not belong to the project's workspace.",
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
        // Check project membership
        // --------------------------------------------------

        const existingProjectMember =
            await prisma.projectMember.findUnique({
                where: {
                    userId_projectId: {
                        userId,
                        projectId,
                    },
                },
            });

        if (existingProjectMember) {
            return res.status(409).json({
                message:
                    "You are already a member of this project.",
            });
        }

        // --------------------------------------------------
        // IMPORTANT:
        // One user can belong to only ONE team globally.
        // --------------------------------------------------

        const existingTeamMember =
            await prisma.teamMember.findUnique({
                where: {
                    userId,
                },

                include: {
                    team: true,
                },
            });

        if (
            existingTeamMember &&
            existingTeamMember.teamId !== teamId
        ) {
            return res.status(409).json({
                message:
                    `You already belong to ${existingTeamMember.team.name}. You can belong to only one team.`,
                currentTeam:
                    existingTeamMember.team,
            });
        }

        // --------------------------------------------------
        // Create project member + team member
        // --------------------------------------------------

        const result =
            await prisma.$transaction(
                async (tx) => {
                    let teamMember =
                        existingTeamMember;

                    if (!teamMember) {
                        teamMember =
                            await tx.teamMember.create(
                                {
                                    data: {
                                        teamId,
                                        userId,
                                        role: "MEMBER",
                                    },

                                    include: {
                                        team: true,
                                        user: true,
                                    },
                                }
                            );
                    }

                    const projectMember =
                        await tx.projectMember.create(
                            {
                                data: {
                                    projectId,
                                    userId,
                                },

                                include: {
                                    project: true,
                                    user: true,
                                },
                            }
                        );

                    return {
                        projectMember,
                        teamMember,
                    };
                }
            );

        return res.status(201).json({
            message:
                "Joined project successfully.",
            projectMember:
                result.projectMember,
            teamMember:
                result.teamMember,
        });
    } catch (error) {
        console.error(
            "Join project error:",
            error
        );

        return res.status(500).json({
            message:
                "Failed to join project.",
            error: error.message,
        });
    }
};


// ======================================================
// ADD TEAM TO PROJECT
// ======================================================

export const addTeamToProject = async (
    req,
    res
) => {
    try {
        const { projectId } = req.params;

        const { teamId } = req.body;

        if (!projectId || !teamId) {
            return res.status(400).json({
                message:
                    "Project ID and team ID are required.",
            });
        }

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

        if (
            project.workspaceId !==
            team.workspaceId
        ) {
            return res.status(400).json({
                message:
                    "Project and team must belong to the same workspace.",
            });
        }

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

        const projectTeam =
            await prisma.projectTeam.create({
                data: {
                    projectId,
                    teamId,
                },

                include: {
                    team: {
                        include: {
                            members: {
                                include: {
                                    user: true,
                                },
                            },
                        },
                    },

                    project: true,
                },
            });

        return res.status(201).json({
            message:
                "Team assigned to project successfully.",
            projectTeam,
        });
    } catch (error) {
        console.error(
            "Add team to project error:",
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
            projectId,
            teamId,
        } = req.params;

        if (!projectId || !teamId) {
            return res.status(400).json({
                message:
                    "Project ID and team ID are required.",
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
        // Check if tasks still use this team
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