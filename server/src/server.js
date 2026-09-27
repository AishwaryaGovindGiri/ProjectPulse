import express from "express";
import cors from "cors";
import dotenv from "dotenv";

import prisma from "./config/db.js";

import workspaceRoutes from "./routes/workspaceRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import dashboardRoutes from "./routes/dashboardRoutes.js";
import projectRoutes from "./routes/projectRoutes.js";
import taskRoutes from "./routes/taskRoutes.js";
import mistakeRoutes from "./routes/mistakeRoutes.js";
import teamRoutes from "./routes/teamRoutes.js";
import commentRoutes from "./routes/commentRoutes.js";

dotenv.config();

const app = express();

app.use(
    cors({
        origin: "http://localhost:5173",
        credentials: true,
    })
);

app.use(express.json());

app.get("/", (req, res) => {
    res.json({
        message: "ProjectPulse API is running",
    });
});

app.get("/api/health", async (req, res) => {
    try {
        const databaseInfo =
            await prisma.$queryRaw`
                SELECT
                    current_database() AS database,
                    current_user AS user,
                    inet_server_addr() AS server_address,
                    inet_server_port() AS server_port
            `;

        const memberCount =
            await prisma.workspaceMember.count();

        const teamCount =
            await prisma.team.count();

        const projectCount =
            await prisma.project.count();

        const taskCount =
            await prisma.task.count();

        res.json({
            status: "ok",

            database:
                databaseInfo[0],

            workspaceMemberCount:
                memberCount,

            teamCount,

            projectCount,

            taskCount,
        });
    } catch (error) {
        console.error(
            "Database connection error:",
            error
        );

        res.status(500).json({
            status: "error",

            database: "disconnected",

            error: error.message,
        });
    }
});

app.get("/api/test", (req, res) => {
    res.json({
        message:
            "Backend connection successful",
    });
});

app.use(
    "/api/users",
    userRoutes
);

app.use(
    "/api/workspaces",
    workspaceRoutes
);

app.use(
    "/api/dashboard",
    dashboardRoutes
);

app.use(
    "/api/projects",
    projectRoutes
);

app.use(
    "/api/tasks",
    taskRoutes
);

app.use(
    "/api/mistakes",
    mistakeRoutes
);

app.use(
    "/api/teams",
    teamRoutes
);

app.use(
    "/api/comments",
    commentRoutes
);

// Global error handler
app.use((err, req, res, next) => {
    console.error(
        "Unhandled server error:",
        err
    );

    res.status(500).json({
        message: "Internal server error.",
        error: err.message,
    });
});

const PORT = 5000;

app.listen(PORT, () => {
    console.log(
        `Server running on port ${PORT}`
    );
});