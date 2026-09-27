import bcrypt from "bcryptjs";
import prisma from "../config/db.js";


// ======================================================
// CREATE WORKSPACE
// ======================================================

export const createWorkspace = async (req, res) => {
    try {
        const {
            name,
            slug,
            description,
            ownerId,
            password,
            image_url,
        } = req.body;

        if (!name || !slug || !ownerId) {
            return res.status(400).json({
                message:
                    "Workspace name, slug, and owner are required.",
            });
        }

        const owner = await prisma.user.findUnique({
            where: {
                id: ownerId,
            },
        });

        if (!owner) {
            return res.status(404).json({
                message: "Owner user not found.",
            });
        }

        const existingWorkspace =
            await prisma.workspace.findUnique({
                where: {
                    slug,
                },
            });

        if (existingWorkspace) {
            return res.status(409).json({
                message:
                    "A workspace with this slug already exists.",
            });
        }

        let accessPasswordHash = null;

        if (password?.trim()) {
            accessPasswordHash =
                await bcrypt.hash(password.trim(), 10);
        }

        const workspace = await prisma.$transaction(
            async (tx) => {
                const newWorkspace =
                    await tx.workspace.create({
                        data: {
                            id: crypto.randomUUID(),
                            name: name.trim(),
                            slug: slug.trim(),
                            description:
                                description?.trim() || null,
                            ownerId,
                            image_url:
                                image_url || "",
                            accessPasswordHash,
                        },
                    });

                await tx.workspaceMember.create({
                    data: {
                        userId: ownerId,
                        workspaceId: newWorkspace.id,
                        role: "ADMIN",
                        message: "Workspace owner",
                    },
                });

                return newWorkspace;
            }
        );

        return res.status(201).json({
            message:
                "Workspace created successfully.",
            workspace,
        });
    } catch (error) {
        console.error(
            "Create workspace error:",
            error
        );

        return res.status(500).json({
            message: "Failed to create workspace.",
            error: error.message,
        });
    }
};


// ======================================================
// GET ALL WORKSPACES
// ======================================================

export const getWorkspaces = async (req, res) => {
    try {
        const { userId } = req.query;

        const where = {};

        if (userId) {
            where.members = {
                some: {
                    userId,
                },
            };
        }

        const workspaces =
            await prisma.workspace.findMany({
                where,

                include: {
                    owner: true,

                    members: {
                        include: {
                            user: true,
                        },
                    },

                    projects: {
                        include: {
                            teams: {
                                include: {
                                    team: true,
                                },
                            },
                        },
                    },

                    teams: {
                        include: {
                            members: {
                                include: {
                                    user: true,
                                },
                            },
                        },
                    },
                },

                orderBy: {
                    createdAt: "desc",
                },
            });

        return res.status(200).json({
            workspaces,
        });
    } catch (error) {
        console.error(
            "Get workspaces error:",
            error
        );

        return res.status(500).json({
            message: "Failed to fetch workspaces.",
            error: error.message,
        });
    }
};


// ======================================================
// GET WORKSPACE BY ID
// ======================================================

export const getWorkspaceById = async (req, res) => {
    try {
        const { workspaceId } = req.params;

        if (!workspaceId) {
            return res.status(400).json({
                message:
                    "Workspace ID is required.",
            });
        }

        const workspace =
            await prisma.workspace.findUnique({
                where: {
                    id: workspaceId,
                },

                include: {
                    owner: true,

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

                        orderBy: {
                            createdAt: "desc",
                        },
                    },

                    teams: {
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

                        orderBy: {
                            name: "asc",
                        },
                    },
                },
            });

        if (!workspace) {
            return res.status(404).json({
                message: "Workspace not found.",
            });
        }

        return res.status(200).json({
            workspace,
        });
    } catch (error) {
        console.error(
            "Get workspace error:",
            error
        );

        return res.status(500).json({
            message: "Failed to fetch workspace.",
            error: error.message,
        });
    }
};


// ======================================================
// GET WORKSPACE MEMBERS
// ======================================================

export const getWorkspaceMembers = async (
    req,
    res
) => {
    try {
        const { workspaceId } = req.params;

        if (!workspaceId) {
            return res.status(400).json({
                message:
                    "Workspace ID is required.",
            });
        }

        const members =
            await prisma.workspaceMember.findMany({
                where: {
                    workspaceId,
                },

                include: {
                    user: true,
                },

                orderBy: {
                    user: {
                        name: "asc",
                    },
                },
            });

        return res.status(200).json({
            members,
        });
    } catch (error) {
        console.error(
            "Get workspace members error:",
            error
        );

        return res.status(500).json({
            message:
                "Failed to fetch workspace members.",
            error: error.message,
        });
    }
};


// ======================================================
// JOIN WORKSPACE
// ======================================================

export const joinWorkspace = async (req, res) => {
    try {
        const { workspaceId } = req.params;

        const {
            userId,
            password,
            message,
        } = req.body;

        if (!workspaceId || !userId) {
            return res.status(400).json({
                message:
                    "Workspace ID and user ID are required.",
            });
        }

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
        // Check if already a member
        // --------------------------------------------------

        const existingMember =
            await prisma.workspaceMember.findUnique({
                where: {
                    userId_workspaceId: {
                        userId,
                        workspaceId,
                    },
                },
            });

        if (existingMember) {
            return res.status(200).json({
                message:
                    "User is already a workspace member.",
                member: existingMember,
            });
        }

        // --------------------------------------------------
        // Verify workspace password
        // --------------------------------------------------

        if (workspace.accessPasswordHash) {
            if (!password) {
                return res.status(401).json({
                    message:
                        "Workspace password is required.",
                });
            }

            const passwordMatches =
                await bcrypt.compare(
                    password,
                    workspace.accessPasswordHash
                );

            if (!passwordMatches) {
                return res.status(401).json({
                    message:
                        "Incorrect workspace password.",
                });
            }
        }

        // --------------------------------------------------
        // Add member
        // --------------------------------------------------

        const member =
            await prisma.workspaceMember.create({
                data: {
                    userId,
                    workspaceId,
                    role: "MEMBER",
                    message:
                        message?.trim() || "",
                },

                include: {
                    user: true,
                    workspace: true,
                },
            });

        return res.status(201).json({
            message:
                "Joined workspace successfully.",
            member,
        });
    } catch (error) {
        console.error(
            "Join workspace error:",
            error
        );

        return res.status(500).json({
            message:
                "Failed to join workspace.",
            error: error.message,
        });
    }
};


// ======================================================
// ADD MEMBER TO WORKSPACE
// ======================================================

export const addWorkspaceMember = async (
    req,
    res
) => {
    try {
        const { workspaceId } = req.params;

        const {
            userId,
            role,
            message,
        } = req.body;

        if (!workspaceId || !userId) {
            return res.status(400).json({
                message:
                    "Workspace ID and user ID are required.",
            });
        }

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

        const existingMember =
            await prisma.workspaceMember.findUnique({
                where: {
                    userId_workspaceId: {
                        userId,
                        workspaceId,
                    },
                },
            });

        if (existingMember) {
            return res.status(409).json({
                message:
                    "User is already a workspace member.",
            });
        }

        const member =
            await prisma.workspaceMember.create({
                data: {
                    userId,
                    workspaceId,
                    role:
                        role === "ADMIN"
                            ? "ADMIN"
                            : "MEMBER",
                    message:
                        message?.trim() || "",
                },

                include: {
                    user: true,
                },
            });

        return res.status(201).json({
            message:
                "Workspace member added successfully.",
            member,
        });
    } catch (error) {
        console.error(
            "Add workspace member error:",
            error
        );

        return res.status(500).json({
            message:
                "Failed to add workspace member.",
            error: error.message,
        });
    }
};


// ======================================================
// UPDATE WORKSPACE MEMBER
// ======================================================

export const updateWorkspaceMember = async (
    req,
    res
) => {
    try {
        const { memberId } = req.params;

        const {
            role,
            message,
        } = req.body;

        if (!memberId) {
            return res.status(400).json({
                message:
                    "Member ID is required.",
            });
        }

        const member =
            await prisma.workspaceMember.findUnique({
                where: {
                    id: memberId,
                },
            });

        if (!member) {
            return res.status(404).json({
                message:
                    "Workspace member not found.",
            });
        }

        const updatedMember =
            await prisma.workspaceMember.update({
                where: {
                    id: memberId,
                },

                data: {
                    ...(role
                        ? {
                              role:
                                  role === "ADMIN"
                                      ? "ADMIN"
                                      : "MEMBER",
                          }
                        : {}),

                    ...(message !== undefined
                        ? {
                              message:
                                  message.trim(),
                          }
                        : {}),
                },

                include: {
                    user: true,
                    workspace: true,
                },
            });

        return res.status(200).json({
            message:
                "Workspace member updated successfully.",
            member: updatedMember,
        });
    } catch (error) {
        console.error(
            "Update workspace member error:",
            error
        );

        return res.status(500).json({
            message:
                "Failed to update workspace member.",
            error: error.message,
        });
    }
};


// ======================================================
// REMOVE MEMBER FROM WORKSPACE
// ======================================================

export const removeWorkspaceMember = async (
    req,
    res
) => {
    try {
        const { memberId } = req.params;

        if (!memberId) {
            return res.status(400).json({
                message:
                    "Member ID is required.",
            });
        }

        const member =
            await prisma.workspaceMember.findUnique({
                where: {
                    id: memberId,
                },

                include: {
                    workspace: true,
                },
            });

        if (!member) {
            return res.status(404).json({
                message:
                    "Workspace member not found.",
            });
        }

        // Do not allow removing the workspace owner
        if (
            member.userId ===
            member.workspace.ownerId
        ) {
            return res.status(400).json({
                message:
                    "Workspace owner cannot be removed.",
            });
        }

        await prisma.workspaceMember.delete({
            where: {
                id: memberId,
            },
        });

        return res.status(200).json({
            message:
                "Workspace member removed successfully.",
        });
    } catch (error) {
        console.error(
            "Remove workspace member error:",
            error
        );

        return res.status(500).json({
            message:
                "Failed to remove workspace member.",
            error: error.message,
        });
    }
};


// ======================================================
// UPDATE WORKSPACE
// ======================================================

export const updateWorkspace = async (
    req,
    res
) => {
    try {
        const { workspaceId } = req.params;

        const {
            name,
            slug,
            description,
            password,
            image_url,
        } = req.body;

        if (!workspaceId) {
            return res.status(400).json({
                message:
                    "Workspace ID is required.",
            });
        }

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

        if (
            slug &&
            slug !== workspace.slug
        ) {
            const existingSlug =
                await prisma.workspace.findUnique({
                    where: {
                        slug,
                    },
                });

            if (existingSlug) {
                return res.status(409).json({
                    message:
                        "Another workspace already uses this slug.",
                });
            }
        }

        let accessPasswordHash =
            workspace.accessPasswordHash;

        if (password !== undefined) {
            if (password.trim() === "") {
                accessPasswordHash = null;
            } else {
                accessPasswordHash =
                    await bcrypt.hash(
                        password.trim(),
                        10
                    );
            }
        }

        const updatedWorkspace =
            await prisma.workspace.update({
                where: {
                    id: workspaceId,
                },

                data: {
                    ...(name !== undefined
                        ? {
                              name:
                                  name.trim(),
                          }
                        : {}),

                    ...(slug !== undefined
                        ? {
                              slug:
                                  slug.trim(),
                          }
                        : {}),

                    ...(description !== undefined
                        ? {
                              description:
                                  description.trim() ||
                                  null,
                          }
                        : {}),

                    ...(image_url !== undefined
                        ? {
                              image_url,
                          }
                        : {}),

                    accessPasswordHash,
                },
            });

        return res.status(200).json({
            message:
                "Workspace updated successfully.",
            workspace:
                updatedWorkspace,
        });
    } catch (error) {
        console.error(
            "Update workspace error:",
            error
        );

        return res.status(500).json({
            message:
                "Failed to update workspace.",
            error: error.message,
        });
    }
};


// ======================================================
// DELETE WORKSPACE
// ======================================================

export const deleteWorkspace = async (
    req,
    res
) => {
    try {
        const { workspaceId } = req.params;

        if (!workspaceId) {
            return res.status(400).json({
                message:
                    "Workspace ID is required.",
            });
        }

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

        await prisma.workspace.delete({
            where: {
                id: workspaceId,
            },
        });

        return res.status(200).json({
            message:
                "Workspace deleted successfully.",
        });
    } catch (error) {
        console.error(
            "Delete workspace error:",
            error
        );

        return res.status(500).json({
            message:
                "Failed to delete workspace.",
            error: error.message,
        });
    }
};