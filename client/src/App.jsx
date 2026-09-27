import { useEffect } from "react";
import { Routes, Route } from "react-router-dom";
import { Toaster } from "react-hot-toast";

import Layout from "./pages/Layout";
import Dashboard from "./pages/Dashboard";
import Projects from "./pages/Projects";
import Team from "./pages/Team";
import ProjectDetails from "./pages/ProjectDetails";
import TaskDetails from "./pages/TaskDetails";
import WorkspaceAccess from "./pages/WorkspaceAccess";
import Performance from "./pages/Performance";

import { testBackendConnection } from "./lib/api";

const App = () => {
    useEffect(() => {
        const checkBackend = async () => {
            try {
                const data =
                    await testBackendConnection();

                console.log(
                    "Backend connection:",
                    data.message
                );
            } catch (error) {
                console.error(
                    "Backend connection failed:",
                    error
                );
            }
        };

        checkBackend();
    }, []);

    return (
        <>
            <Toaster position="top-right" />

            <Routes>

                <Route path="/" element={<Layout />}>

                    <Route
                        index
                        element={<Dashboard />}
                    />

                    <Route
                        path="team"
                        element={<Team />}
                    />

                    <Route
                        path="projects"
                        element={<Projects />}
                    />

                    <Route
                        path="projectsDetail"
                        element={<ProjectDetails />}
                    />

                    <Route
                        path="taskDetails"
                        element={<TaskDetails />}
                    />

                    <Route
                        path="performance"
                        element={<Performance />}
                    />

                </Route>

                <Route
                    path="/workspace-access"
                    element={<WorkspaceAccess />}
                />

            </Routes>
        </>
    );
};

export default App;