import prisma from "../config/db.js";


// ======================================================
// GET GLOBAL DASHBOARD
// ======================================================

export const getDashboard = async (req, res) => {
    try {
        // --------------------------------------------------
        // Fetch all projects
        // --------------------------------------------------

        const projects =
            await prisma.project.findMany({
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
                    },
                },

                orderBy: {
                    createdAt: "desc",
                },
            });

        // --------------------------------------------------
        // Fetch users
        // --------------------------------------------------

        const users =
            await prisma.user.findMany({
                include: {
                    tasks: true,
                    mistakesAdded: true,
                    teamMembership: {
                        include: {
                            team: true,
                        },
                    },
                },
            });

        // --------------------------------------------------
        // Basic task statistics
        // --------------------------------------------------

        const allTasks =
            await prisma.task.findMany({
                include: {
                    mistakes: true,
                },
            });

        const totalProjects =
            projects.length;

        const totalTasks =
            allTasks.length;

        const completedTasks =
            allTasks.filter(
                (task) =>
                    task.status === "DONE"
            ).length;

        const inProgressTasks =
            allTasks.filter(
                (task) =>
                    task.status === "IN_PROGRESS"
            ).length;

        const todoTasks =
            allTasks.filter(
                (task) =>
                    task.status === "TODO"
            ).length;

        const totalMistakes =
            allTasks.reduce(
                (total, task) =>
                    total + task.mistakes.length,
                0
            );

        // --------------------------------------------------
        // Employee count
        // --------------------------------------------------

        const employeeCount =
            await prisma.workspaceMember.count();

        // --------------------------------------------------
        // Budget calculations
        // --------------------------------------------------

        const totalBudget =
            projects.reduce(
                (total, project) =>
                    total +
                    (project.budget || 0),
                0
            );

        const totalActualCost =
            projects.reduce(
                (total, project) =>
                    total +
                    (project.actualCost || 0),
                0
            );

        // --------------------------------------------------
        // Overall progress
        // --------------------------------------------------

        const overallProgress =
            totalProjects === 0
                ? 0
                : Math.round(
                      projects.reduce(
                          (total, project) =>
                              total +
                              (project.progress || 0),
                          0
                      ) / totalProjects
                  );

        // --------------------------------------------------
        // Project analysis
        // --------------------------------------------------

        const projectAnalysis =
            projects.map((project) => {
                const projectTasks =
                    project.tasks || [];

                const total =
                    projectTasks.length;

                const completed =
                    projectTasks.filter(
                        (task) =>
                            task.status ===
                            "DONE"
                    ).length;

                const inProgress =
                    projectTasks.filter(
                        (task) =>
                            task.status ===
                            "IN_PROGRESS"
                    ).length;

                const todo =
                    projectTasks.filter(
                        (task) =>
                            task.status ===
                            "TODO"
                    ).length;

                const mistakes =
                    projectTasks.reduce(
                        (count, task) =>
                            count +
                            task.mistakes.length,
                        0
                    );

                return {
                    id: project.id,
                    name: project.name,

                    status: project.status,

                    priority:
                        project.priority,

                    progress:
                        project.progress,

                    totalTasks: total,

                    completedTasks:
                        completed,

                    inProgressTasks:
                        inProgress,

                    todoTasks: todo,

                    mistakes,

                    budget:
                        project.budget || 0,

                    actualCost:
                        project.actualCost || 0,

                    teamCount:
                        project.teams.length,

                    memberCount:
                        project.members.length,
                };
            });

        // --------------------------------------------------
        // Employee performance
        // --------------------------------------------------

        const employeePerformance =
            users.map((user) => {
                const userTasks =
                    user.tasks || [];

                const completed =
                    userTasks.filter(
                        (task) =>
                            task.status ===
                            "DONE"
                    );

                const completedCount =
                    completed.length;

                const onTimeTasks =
                    completed.filter(
                        (task) =>
                            task.completedAt &&
                            task.completedAt <=
                                task.due_date
                    );

                const lateCompletedTasks =
                    completed.filter(
                        (task) =>
                            task.completedAt &&
                            task.completedAt >
                                task.due_date
                    );

                const overdueIncompleteTasks =
                    userTasks.filter(
                        (task) =>
                            task.status !==
                                "DONE" &&
                            new Date() >
                                task.due_date
                    );

                const mistakes =
                    user.mistakesAdded?.length ||
                    0;

                // --------------------------------------------------
                // Rates
                // --------------------------------------------------

                const onTimeRate =
                    completedCount === 0
                        ? 0
                        : onTimeTasks.length /
                          completedCount;

                const lateRate =
                    completedCount === 0
                        ? 0
                        : lateCompletedTasks.length /
                          completedCount;

                const mistakeRate =
                    completedCount === 0
                        ? 0
                        : Math.min(
                              mistakes /
                                  completedCount,
                              1
                          );

                // --------------------------------------------------
                // Performance score
                //
                // On-time completion = 50%
                // Low late completion = 25%
                // Low mistakes = 25%
                // --------------------------------------------------

                const score = Math.round(
                    onTimeRate * 50 +
                        (1 - lateRate) * 25 +
                        (1 - mistakeRate) * 25
                );

                // --------------------------------------------------
                // Hours worked
                //
                // Display-only for now.
                // --------------------------------------------------

                const hoursWorked =
                    userTasks.reduce(
                        (total, task) =>
                            total +
                            (task.actualHours || 0),
                        0
                    );

                return {
                    userId: user.id,

                    name: user.name,

                    email: user.email,

                    team:
                        user.teamMembership?.team
                            ?.name || "No Team",

                    completed:
                        completedCount,

                    onTime:
                        onTimeTasks.length,

                    late:
                        lateCompletedTasks.length,

                    overdue:
                        overdueIncompleteTasks.length,

                    mistakes,

                    hoursWorked,

                    onTimeRate:
                        Math.round(
                            onTimeRate * 100
                        ),

                    score,
                };
            });

        // --------------------------------------------------
        // Sort employee performance
        // --------------------------------------------------

        employeePerformance.sort(
            (a, b) =>
                b.score - a.score
        );

        // --------------------------------------------------
        // Return dashboard
        // --------------------------------------------------

        return res.status(200).json({
            summary: {
                totalProjects,
                totalTasks,
                completedTasks,
                inProgressTasks,
                todoTasks,
                totalMistakes,
                employeeCount,
                overallProgress,
                totalBudget,
                totalActualCost,
            },

            projects: projectAnalysis,

            employeePerformance,
        });
    } catch (error) {
        console.error(
            "Dashboard error:",
            error
        );

        return res.status(500).json({
            message:
                "Failed to fetch dashboard data.",
            error: error.message,
        });
    }
};