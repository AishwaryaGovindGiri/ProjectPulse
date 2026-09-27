import prisma from "../config/db.js";


// ======================================================
// CREATE USER
// ======================================================

export const createUser = async (req, res) => {
    try {
        const {
            id,
            name,
            email,
            image,
        } = req.body;

        if (!id || !name || !email) {
            return res.status(400).json({
                message:
                    "User ID, name, and email are required.",
            });
        }

        // --------------------------------------------------
        // Check duplicate email
        // --------------------------------------------------

        const existingEmail =
            await prisma.user.findUnique({
                where: {
                    email,
                },
            });

        if (existingEmail) {
            return res.status(409).json({
                message:
                    "A user with this email already exists.",
                user: existingEmail,
            });
        }

        // --------------------------------------------------
        // Check duplicate ID
        // --------------------------------------------------

        const existingId =
            await prisma.user.findUnique({
                where: {
                    id,
                },
            });

        if (existingId) {
            return res.status(409).json({
                message:
                    "A user with this ID already exists.",
            });
        }

        // --------------------------------------------------
        // Create user
        // --------------------------------------------------

        const user =
            await prisma.user.create({
                data: {
                    id,
                    name: name.trim(),
                    email: email.trim(),
                    image:
                        image || "",
                },
            });

        return res.status(201).json({
            message:
                "User created successfully.",
            user,
        });
    } catch (error) {
        console.error(
            "Create user error:",
            error
        );

        return res.status(500).json({
            message:
                "Failed to create user.",
            error: error.message,
        });
    }
};


// ======================================================
// GET USERS
// ======================================================

export const getUsers = async (
    req,
    res
) => {
    try {
        const {
            workspaceId,
            teamId,
            search,
        } = req.query;

        const where = {};

        // --------------------------------------------------
        // Workspace filter
        // --------------------------------------------------

        if (workspaceId) {
            where.workspaces = {
                some: {
                    workspaceId,
                },
            };
        }

        // --------------------------------------------------
        // Team filter
        // --------------------------------------------------

        if (teamId) {
            where.teamMembership = {
                teamId,
            };
        }

        // --------------------------------------------------
        // Search
        // --------------------------------------------------

        if (search?.trim()) {
            where.OR = [
                {
                    name: {
                        contains:
                            search.trim(),
                        mode: "insensitive",
                    },
                },
                {
                    email: {
                        contains:
                            search.trim(),
                        mode: "insensitive",
                    },
                },
            ];
        }

        const users =
            await prisma.user.findMany({
                where,

                include: {
                    teamMembership: {
                        include: {
                            team: true,
                        },
                    },

                    workspaces: {
                        include: {
                            workspace: true,
                        },
                    },

                    projects: true,

                    _count: {
                        select: {
                            tasks: true,
                            comments: true,
                            mistakesAdded: true,
                            projectMembers: true,
                        },
                    },
                },

                orderBy: {
                    name: "asc",
                },
            });

        return res.status(200).json({
            users,
        });
    } catch (error) {
        console.error(
            "Get users error:",
            error
        );

        return res.status(500).json({
            message:
                "Failed to fetch users.",
            error: error.message,
        });
    }
};


// ======================================================
// GET USER BY ID
// ======================================================

export const getUserById = async (
    req,
    res
) => {
    try {
        const { userId } = req.params;

        if (!userId) {
            return res.status(400).json({
                message:
                    "User ID is required.",
            });
        }

        const user =
            await prisma.user.findUnique({
                where: {
                    id: userId,
                },

                include: {
                    teamMembership: {
                        include: {
                            team: {
                                include: {
                                    workspace: true,
                                },
                            },
                        },
                    },

                    workspaces: {
                        include: {
                            workspace: true,
                        },
                    },

                    projects: {
                        include: {
                            workspace: true,
                            teams: {
                                include: {
                                    team: true,
                                },
                            },
                        },
                    },

                    tasks: {
                        include: {
                            project: true,
                            team: true,
                        },

                        orderBy: {
                            createdAt: "desc",
                        },
                    },

                    comments: {
                        include: {
                            task: true,
                        },

                        orderBy: {
                            createdAt: "desc",
                        },
                    },

                    mistakesAdded: {
                        include: {
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
                    },
                },
            });

        if (!user) {
            return res.status(404).json({
                message: "User not found.",
            });
        }

        return res.status(200).json({
            user,
        });
    } catch (error) {
        console.error(
            "Get user error:",
            error
        );

        return res.status(500).json({
            message:
                "Failed to fetch user.",
            error: error.message,
        });
    }
};


// ======================================================
// UPDATE USER
// ======================================================

export const updateUser = async (
    req,
    res
) => {
    try {
        const { userId } = req.params;

        const {
            name,
            email,
            image,
        } = req.body;

        if (!userId) {
            return res.status(400).json({
                message:
                    "User ID is required.",
            });
        }

        const existingUser =
            await prisma.user.findUnique({
                where: {
                    id: userId,
                },
            });

        if (!existingUser) {
            return res.status(404).json({
                message:
                    "User not found.",
            });
        }

        // --------------------------------------------------
        // Check email if changed
        // --------------------------------------------------

        if (
            email &&
            email !== existingUser.email
        ) {
            const emailUser =
                await prisma.user.findUnique({
                    where: {
                        email,
                    },
                });

            if (
                emailUser &&
                emailUser.id !== userId
            ) {
                return res.status(409).json({
                    message:
                        "Another user already uses this email.",
                });
            }
        }

        // --------------------------------------------------
        // Update
        // --------------------------------------------------

        const user =
            await prisma.user.update({
                where: {
                    id: userId,
                },

                data: {
                    ...(name !== undefined
                        ? {
                              name:
                                  name.trim(),
                          }
                        : {}),

                    ...(email !== undefined
                        ? {
                              email:
                                  email.trim(),
                          }
                        : {}),

                    ...(image !== undefined
                        ? {
                              image,
                          }
                        : {}),
                },
            });

        return res.status(200).json({
            message:
                "User updated successfully.",
            user,
        });
    } catch (error) {
        console.error(
            "Update user error:",
            error
        );

        return res.status(500).json({
            message:
                "Failed to update user.",
            error: error.message,
        });
    }
};