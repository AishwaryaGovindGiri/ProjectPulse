import { createSlice } from "@reduxjs/toolkit";

const savedWorkspace = sessionStorage.getItem("current_workspace");

const initialState = {
    workspaces: [],
    currentWorkspace: savedWorkspace
        ? JSON.parse(savedWorkspace)
        : null,
    loading: false,
};

const workspaceSlice = createSlice({
    name: "workspace",

    initialState,

    reducers: {
        setWorkspaces: (state, action) => {
            state.workspaces = action.payload;

            if (!state.currentWorkspace && action.payload.length > 0) {
                state.currentWorkspace = action.payload[0];
            }
        },

        setCurrentWorkspace: (state, action) => {
            const workspace =
                typeof action.payload === "string"
                    ? state.workspaces.find(
                          (w) => w.id === action.payload
                      )
                    : action.payload;

            if (workspace) {
                state.currentWorkspace = workspace;

                sessionStorage.setItem(
                    "current_workspace",
                    JSON.stringify(workspace)
                );
            }
        },

        addWorkspace: (state, action) => {
            state.workspaces.push(action.payload);
            state.currentWorkspace = action.payload;

            sessionStorage.setItem(
                "current_workspace",
                JSON.stringify(action.payload)
            );
        },

        updateWorkspace: (state, action) => {
            state.workspaces = state.workspaces.map((workspace) =>
                workspace.id === action.payload.id
                    ? action.payload
                    : workspace
            );

            if (
                state.currentWorkspace?.id ===
                action.payload.id
            ) {
                state.currentWorkspace = action.payload;

                sessionStorage.setItem(
                    "current_workspace",
                    JSON.stringify(action.payload)
                );
            }
        },

        deleteWorkspace: (state, action) => {
            state.workspaces = state.workspaces.filter(
                (workspace) => workspace.id !== action.payload
            );

            if (
                state.currentWorkspace?.id ===
                action.payload
            ) {
                state.currentWorkspace =
                    state.workspaces[0] || null;

                if (state.currentWorkspace) {
                    sessionStorage.setItem(
                        "current_workspace",
                        JSON.stringify(
                            state.currentWorkspace
                        )
                    );
                } else {
                    sessionStorage.removeItem(
                        "current_workspace"
                    );
                }
            }
        },

        addProject: (state, action) => {
            if (!state.currentWorkspace) return;

            if (!state.currentWorkspace.projects) {
                state.currentWorkspace.projects = [];
            }

            state.currentWorkspace.projects.push(
                action.payload
            );
        },

        addTask: (state, action) => {
            if (!state.currentWorkspace?.projects) return;

            state.currentWorkspace.projects =
                state.currentWorkspace.projects.map(
                    (project) =>
                        project.id ===
                        action.payload.projectId
                            ? {
                                  ...project,
                                  tasks: [
                                      ...(project.tasks || []),
                                      action.payload,
                                  ],
                              }
                            : project
                );
        },

        updateTask: (state, action) => {
            if (!state.currentWorkspace?.projects) return;

            state.currentWorkspace.projects =
                state.currentWorkspace.projects.map(
                    (project) =>
                        project.id ===
                        action.payload.projectId
                            ? {
                                  ...project,
                                  tasks: (
                                      project.tasks || []
                                  ).map((task) =>
                                      task.id ===
                                      action.payload.id
                                          ? action.payload
                                          : task
                                  ),
                              }
                            : project
                );
        },

        deleteTask: (state, action) => {
            if (!state.currentWorkspace?.projects) return;

            const taskIds = Array.isArray(action.payload)
                ? action.payload
                : [action.payload];

            state.currentWorkspace.projects =
                state.currentWorkspace.projects.map(
                    (project) => ({
                        ...project,
                        tasks: (
                            project.tasks || []
                        ).filter(
                            (task) =>
                                !taskIds.includes(task.id)
                        ),
                    })
                );
        },
    },
});

export const {
    setWorkspaces,
    setCurrentWorkspace,
    addWorkspace,
    updateWorkspace,
    deleteWorkspace,
    addProject,
    addTask,
    updateTask,
    deleteTask,
} = workspaceSlice.actions;

export default workspaceSlice.reducer;