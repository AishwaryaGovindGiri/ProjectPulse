const API_BASE_URL =
    import.meta.env.VITE_API_URL ||
    "http://localhost:5000/api";

// ======================================================
// GENERIC REQUEST HELPER
// ======================================================

const request = async (
    endpoint,
    options = {}
) => {
    const response = await fetch(
        `${API_BASE_URL}${endpoint}`,
        {
            headers: {
                "Content-Type":
                    "application/json",

                ...(options.headers || {}),
            },

            ...options,
        }
    );

    let data = null;

    try {
        data = await response.json();
    } catch {
        data = null;
    }

    if (!response.ok) {
        throw new Error(
            data?.message ||
                "Something went wrong."
        );
    }

    return data;
};


// ======================================================
// BACKEND TEST
// ======================================================

export const testBackendConnection =
    async () => {
        return request("/test");
    };


// ======================================================
// HEALTH
// ======================================================

export const getHealth = async () => {
    return request("/health");
};


// ======================================================
// USERS
// ======================================================

export const createUser = async (
    userData
) => {
    return request("/users", {
        method: "POST",
        body: JSON.stringify(userData),
    });
};


export const getUsers = async (
    params = ""
) => {
    return request(
        `/users${params}`
    );
};


export const getUserById = async (
    userId
) => {
    return request(
        `/users/${userId}`
    );
};


export const updateUser = async (
    userId,
    userData
) => {
    return request(
        `/users/${userId}`,
        {
            method: "PATCH",
            body: JSON.stringify(
                userData
            ),
        }
    );
};


// ======================================================
// WORKSPACES
// ======================================================

export const createWorkspace = async (
    workspaceData
) => {
    return request("/workspaces", {
        method: "POST",
        body: JSON.stringify(
            workspaceData
        ),
    });
};


export const getWorkspaces = async (
    params = ""
) => {
    return request(
        `/workspaces${params}`
    );
};


export const getWorkspaceById = async (
    workspaceId
) => {
    return request(
        `/workspaces/${workspaceId}`
    );
};


export const updateWorkspace = async (
    workspaceId,
    workspaceData
) => {
    return request(
        `/workspaces/${workspaceId}`,
        {
            method: "PATCH",
            body: JSON.stringify(
                workspaceData
            ),
        }
    );
};


export const deleteWorkspace = async (
    workspaceId
) => {
    return request(
        `/workspaces/${workspaceId}`,
        {
            method: "DELETE",
        }
    );
};


export const getWorkspaceMembers =
    async (workspaceId) => {
        return request(
            `/workspaces/${workspaceId}/members`
        );
    };


export const joinWorkspace = async (
    workspaceId,
    data
) => {
    return request(
        `/workspaces/${workspaceId}/join`,
        {
            method: "POST",
            body: JSON.stringify(data),
        }
    );
};


export const addWorkspaceMember =
    async (
        workspaceId,
        data
    ) => {
        return request(
            `/workspaces/${workspaceId}/members`,
            {
                method: "POST",
                body: JSON.stringify(
                    data
                ),
            }
        );
    };


export const updateWorkspaceMember =
    async (
        memberId,
        data
    ) => {
        return request(
            `/workspaces/members/${memberId}`,
            {
                method: "PATCH",
                body: JSON.stringify(
                    data
                ),
            }
        );
    };


export const removeWorkspaceMember =
    async (memberId) => {
        return request(
            `/workspaces/members/${memberId}`,
            {
                method: "DELETE",
            }
        );
    };


// ======================================================
// PROJECTS
// ======================================================

export const createProject = async (
    projectData
) => {
    return request("/projects", {
        method: "POST",
        body: JSON.stringify(
            projectData
        ),
    });
};


export const getProjects = async (
    params = ""
) => {
    return request(
        `/projects${params}`
    );
};


export const getProjectById = async (
    projectId
) => {
    return request(
        `/projects/${projectId}`
    );
};


export const verifyProjectPassword =
    async (
        projectId,
        password
    ) => {
        return request(
            `/projects/${projectId}/verify-password`,
            {
                method: "POST",
                body: JSON.stringify({
                    password,
                }),
            }
        );
    };


export const joinProject = async (
    projectId,
    data
) => {
    return request(
        `/projects/${projectId}/join`,
        {
            method: "POST",
            body: JSON.stringify(data),
        }
    );
};


export const addTeamToProject =
    async (
        projectId,
        teamId
    ) => {
        return request(
            `/projects/${projectId}/teams`,
            {
                method: "POST",
                body: JSON.stringify({
                    teamId,
                }),
            }
        );
    };


export const removeTeamFromProject =
    async (
        projectId,
        teamId
    ) => {
        return request(
            `/projects/${projectId}/teams/${teamId}`,
            {
                method: "DELETE",
            }
        );
    };


// ======================================================
// TEAMS
// ======================================================

export const createTeam = async (
    teamData
) => {
    return request("/teams", {
        method: "POST",
        body: JSON.stringify(
            teamData
        ),
    });
};


export const getTeams = async (
    params = ""
) => {
    return request(
        `/teams${params}`
    );
};


export const getTeamById = async (
    teamId
) => {
    return request(
        `/teams/${teamId}`
    );
};


export const addTeamMember = async (
    teamId,
    data
) => {
    return request(
        `/teams/${teamId}/members`,
        {
            method: "POST",
            body: JSON.stringify(data),
        }
    );
};


export const updateTeamMemberRole =
    async (
        teamMemberId,
        role
    ) => {
        return request(
            `/teams/members/${teamMemberId}/role`,
            {
                method: "PATCH",
                body: JSON.stringify({
                    role,
                }),
            }
        );
    };


export const removeTeamMember =
    async (teamMemberId) => {
        return request(
            `/teams/members/${teamMemberId}`,
            {
                method: "DELETE",
            }
        );
    };


export const assignTeamToProject =
    async (
        teamId,
        projectId
    ) => {
        return request(
            `/teams/${teamId}/projects`,
            {
                method: "POST",
                body: JSON.stringify({
                    projectId,
                }),
            }
        );
    };


export const removeProjectFromTeam =
    async (
        teamId,
        projectId
    ) => {
        return request(
            `/teams/${teamId}/projects/${projectId}`,
            {
                method: "DELETE",
            }
        );
    };


// ======================================================
// TASKS
// ======================================================

export const createTask = async (
    taskData
) => {
    return request("/tasks", {
        method: "POST",
        body: JSON.stringify(taskData),
    });
};


export const getTasks = async (
    params = ""
) => {
    return request(
        `/tasks${params}`
    );
};


export const getTaskById = async (
    taskId
) => {
    return request(
        `/tasks/${taskId}`
    );
};


export const updateTaskStatus =
    async (
        taskId,
        status
    ) => {
        return request(
            `/tasks/${taskId}/status`,
            {
                method: "PATCH",
                body: JSON.stringify({
                    status,
                }),
            }
        );
    };


export const updateTaskTeam =
    async (
        taskId,
        teamId
    ) => {
        return request(
            `/tasks/${taskId}/team`,
            {
                method: "PATCH",
                body: JSON.stringify({
                    teamId,
                }),
            }
        );
    };


// ======================================================
// MISTAKES
// ======================================================

export const createMistake = async (
    taskId,
    userId
) => {
    return request("/mistakes", {
        method: "POST",
        body: JSON.stringify({
            taskId,
            userId,
        }),
    });
};


export const getMistakes = async (
    params = ""
) => {
    return request(
        `/mistakes${params}`
    );
};


export const getTaskMistakes =
    async (taskId) => {
        return request(
            `/mistakes/tasks/${taskId}`
        );
    };


export const deleteMistake = async (
    mistakeId
) => {
    return request(
        `/mistakes/${mistakeId}`,
        {
            method: "DELETE",
        }
    );
};


// ======================================================
// COMMENTS
// ======================================================

export const createComment = async (
    taskId,
    userId,
    content
) => {
    return request("/comments", {
        method: "POST",
        body: JSON.stringify({
            taskId,
            userId,
            content,
        }),
    });
};


export const getComments = async (
    params = ""
) => {
    return request(
        `/comments${params}`
    );
};


export const getTaskComments =
    async (taskId) => {
        return request(
            `/comments/task/${taskId}`
        );
    };


export const deleteComment = async (
    commentId
) => {
    return request(
        `/comments/${commentId}`,
        {
            method: "DELETE",
        }
    );
};


// ======================================================
// DASHBOARD
// ======================================================

export const getDashboard = async () => {
    return request("/dashboard");
};


export default {
    testBackendConnection,
    getHealth,

    createUser,
    getUsers,
    getUserById,
    updateUser,

    createWorkspace,
    getWorkspaces,
    getWorkspaceById,
    updateWorkspace,
    deleteWorkspace,
    getWorkspaceMembers,
    joinWorkspace,
    addWorkspaceMember,
    updateWorkspaceMember,
    removeWorkspaceMember,

    createProject,
    getProjects,
    getProjectById,
    verifyProjectPassword,
    joinProject,
    addTeamToProject,
    removeTeamFromProject,

    createTeam,
    getTeams,
    getTeamById,
    addTeamMember,
    updateTeamMemberRole,
    removeTeamMember,
    assignTeamToProject,
    removeProjectFromTeam,

    createTask,
    getTasks,
    getTaskById,
    updateTaskStatus,
    updateTaskTeam,

    createMistake,
    getMistakes,
    getTaskMistakes,
    deleteMistake,

    createComment,
    getComments,
    getTaskComments,
    deleteComment,

    getDashboard,
};