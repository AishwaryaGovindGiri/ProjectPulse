import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
    ArrowLeft,
    CalendarDays,
    CheckCircle2,
    Clock3,
    FolderKanban,
    Loader2,
    Plus,
    Users,
    AlertCircle,
    ListTodo,
    IndianRupee,
    RefreshCw,
    ArrowRight,
} from "lucide-react";
import toast from "react-hot-toast";

import {
    getProjectById,
    getTasks,
} from "../lib/api";

import CreateTaskDialog from "../components/CreateTaskDialog";

const formatDate = (date) => {
    if (!date) return "Not set";

    return new Date(date).toLocaleDateString(
        "en-IN",
        {
            day: "2-digit",
            month: "short",
            year: "numeric",
        }
    );
};

const formatCurrency = (value) => {
    if (
        value === null ||
        value === undefined ||
        Number.isNaN(Number(value))
    ) {
        return "₹0";
    }

    return new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
        maximumFractionDigits: 0,
    }).format(Number(value));
};

const formatStatus = (status) => {
    if (!status) return "Unknown";

    return status
        .toLowerCase()
        .replace(/_/g, " ")
        .replace(/\b\w/g, (char) =>
            char.toUpperCase()
        );
};

const getStatusClasses = (status) => {
    switch (status) {
        case "ACTIVE":
            return "bg-emerald-50 text-emerald-700 border-emerald-200";

        case "PLANNING":
            return "bg-blue-50 text-blue-700 border-blue-200";

        case "COMPLETED":
            return "bg-purple-50 text-purple-700 border-purple-200";

        case "ON_HOLD":
            return "bg-amber-50 text-amber-700 border-amber-200";

        case "CANCELLED":
            return "bg-red-50 text-red-700 border-red-200";

        default:
            return "bg-slate-50 text-slate-600 border-slate-200";
    }
};

const getTaskStatusClasses = (status) => {
    switch (status) {
        case "DONE":
            return "bg-emerald-50 text-emerald-700";

        case "IN_PROGRESS":
            return "bg-blue-50 text-blue-700";

        case "TODO":
            return "bg-slate-100 text-slate-600";

        default:
            return "bg-slate-100 text-slate-600";
    }
};

const ProjectDetails = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();

    const projectId =
        searchParams.get("projectId");

    const [project, setProject] =
        useState(null);

    const [tasks, setTasks] =
        useState([]);

    const [loading, setLoading] =
        useState(true);

    const [refreshing, setRefreshing] =
        useState(false);

    const [showCreateTask, setShowCreateTask] =
        useState(false);

    const [error, setError] =
        useState("");

    const fetchData = async (
        isRefresh = false
    ) => {
        if (!projectId) {
            setError("Project ID is missing.");
            setLoading(false);
            return;
        }

        try {
            if (isRefresh) {
                setRefreshing(true);
            } else {
                setLoading(true);
            }

            setError("");

            const [projectResponse, tasksResponse] =
                await Promise.all([
                    getProjectById(projectId),
                    getTasks({
                        projectId,
                    }),
                ]);

            const loadedProject =
                projectResponse?.project ||
                projectResponse;

            const loadedTasks =
                Array.isArray(tasksResponse)
                    ? tasksResponse
                    : tasksResponse?.tasks || [];

            setProject(loadedProject);
            setTasks(loadedTasks);
        } catch (err) {
            console.error(
                "Failed to load project:",
                err
            );

            setError(
                err?.message ||
                    "Failed to load project."
            );
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [projectId]);

    const taskStats = useMemo(() => {
        return {
            total: tasks.length,

            completed: tasks.filter(
                (task) =>
                    task.status === "DONE"
            ).length,

            inProgress: tasks.filter(
                (task) =>
                    task.status === "IN_PROGRESS"
            ).length,

            todo: tasks.filter(
                (task) =>
                    task.status === "TODO"
            ).length,
        };
    }, [tasks]);

    const calculatedProgress =
        taskStats.total > 0
            ? Math.round(
                  (taskStats.completed /
                      taskStats.total) *
                      100
              )
            : Number(
                  project?.progress
              ) || 0;

    const handleTaskCreated = async () => {
        setShowCreateTask(false);
        await fetchData(true);
    };

    const openTask = (taskId) => {
        navigate(
            `/taskDetails?taskId=${taskId}`
        );
    };

    if (loading) {
        return (
            <div className="flex min-h-[70vh] items-center justify-center">
                <div className="flex flex-col items-center gap-3">
                    <Loader2
                        size={30}
                        className="animate-spin text-slate-700"
                    />

                    <p className="text-sm text-slate-500">
                        Loading project...
                    </p>
                </div>
            </div>
        );
    }

    if (error || !project) {
        return (
            <div className="flex min-h-[70vh] items-center justify-center px-6">
                <div className="w-full max-w-md rounded-2xl border border-red-200 bg-white p-7 text-center shadow-sm">
                    <AlertCircle
                        size={32}
                        className="mx-auto text-red-500"
                    />

                    <h2 className="mt-4 text-lg font-semibold text-slate-900">
                        Project could not be loaded
                    </h2>

                    <p className="mt-2 text-sm text-slate-500">
                        {error ||
                            "Project not found."}
                    </p>

                    <button
                        onClick={() =>
                            navigate("/projects")
                        }
                        className="mt-5 rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-slate-800"
                    >
                        Back to Projects
                    </button>
                </div>
            </div>
        );
    }

    const teams =
        project.teams || [];

    const members =
        project.members || [];

    return (
        <div className="space-y-6 pb-8">
            {/* Header */}
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="flex items-start gap-3">
                    <button
                        onClick={() =>
                            navigate(
                                "/projects"
                            )
                        }
                        className="mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                    >
                        <ArrowLeft
                            size={17}
                        />
                    </button>

                    <div>
                        <div className="flex flex-wrap items-center gap-2">
                            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                                {project.name}
                            </h1>

                            <span
                                className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold ${getStatusClasses(
                                    project.status
                                )}`}
                            >
                                {formatStatus(
                                    project.status
                                )}
                            </span>
                        </div>

                        <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">
                            {project.description ||
                                "No project description available."}
                        </p>
                    </div>
                </div>

                <div className="flex gap-2">
                    <button
                        onClick={() =>
                            fetchData(true)
                        }
                        disabled={refreshing}
                        className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-60"
                    >
                        <RefreshCw
                            size={16}
                            className={
                                refreshing
                                    ? "animate-spin"
                                    : ""
                            }
                        />
                        Refresh
                    </button>

                    <button
                        onClick={() =>
                            setShowCreateTask(
                                true
                            )
                        }
                        className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-slate-800"
                    >
                        <Plus size={16} />
                        Create Task
                    </button>
                </div>
            </div>

            {/* Progress */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div>
                        <p className="text-sm font-medium text-slate-500">
                            Project Progress
                        </p>

                        <p className="mt-1 text-3xl font-bold text-slate-900">
                            {calculatedProgress}%
                        </p>
                    </div>

                    <div className="w-full md:max-w-xl">
                        <div className="h-3 overflow-hidden rounded-full bg-slate-100">
                            <div
                                className="h-full rounded-full bg-slate-900 transition-all duration-500"
                                style={{
                                    width: `${Math.min(
                                        100,
                                        Math.max(
                                            0,
                                            calculatedProgress
                                        )
                                    )}%`,
                                }}
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-600">
                            <ListTodo size={19} />
                        </div>

                        <div>
                            <p className="text-xs text-slate-500">
                                Total Tasks
                            </p>

                            <p className="mt-1 text-xl font-bold text-slate-900">
                                {taskStats.total}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                            <CheckCircle2 size={19} />
                        </div>

                        <div>
                            <p className="text-xs text-slate-500">
                                Completed
                            </p>

                            <p className="mt-1 text-xl font-bold text-slate-900">
                                {
                                    taskStats.completed
                                }
                            </p>
                        </div>
                    </div>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                            <Clock3 size={19} />
                        </div>

                        <div>
                            <p className="text-xs text-slate-500">
                                In Progress
                            </p>

                            <p className="mt-1 text-xl font-bold text-slate-900">
                                {
                                    taskStats.inProgress
                                }
                            </p>
                        </div>
                    </div>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
                            <ListTodo size={19} />
                        </div>

                        <div>
                            <p className="text-xs text-slate-500">
                                To Do
                            </p>

                            <p className="mt-1 text-xl font-bold text-slate-900">
                                {taskStats.todo}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Tasks + Project Info */}
            <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
                {/* Tasks */}
                <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm xl:col-span-2">
                    <div className="flex items-center justify-between border-b border-slate-200 p-6">
                        <div>
                            <h2 className="text-base font-semibold text-slate-900">
                                Project Tasks
                            </h2>

                            <p className="mt-1 text-sm text-slate-500">
                                All tasks assigned to this project.
                            </p>
                        </div>

                        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                            {tasks.length}
                        </span>
                    </div>

                    {tasks.length === 0 ? (
                        <div className="px-6 py-14 text-center">
                            <ListTodo
                                size={32}
                                className="mx-auto text-slate-300"
                            />

                            <p className="mt-3 text-sm font-medium text-slate-700">
                                No tasks yet
                            </p>

                            <button
                                onClick={() =>
                                    setShowCreateTask(
                                        true
                                    )
                                }
                                className="mt-4 inline-flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-slate-800"
                            >
                                <Plus size={15} />
                                Create Task
                            </button>
                        </div>
                    ) : (
                        <div className="divide-y divide-slate-100">
                            {tasks.map(
                                (task) => (
                                    <button
                                        key={
                                            task.id
                                        }
                                        onClick={() =>
                                            openTask(
                                                task.id
                                            )
                                        }
                                        className="flex w-full items-center justify-between gap-4 p-5 text-left transition hover:bg-slate-50"
                                    >
                                        <div className="min-w-0 flex-1">
                                            <div className="flex flex-wrap items-center gap-2">
                                                <h3 className="truncate text-sm font-semibold text-slate-900">
                                                    {
                                                        task.title
                                                    }
                                                </h3>

                                                <span
                                                    className={`rounded-full px-2 py-1 text-[10px] font-semibold ${getTaskStatusClasses(
                                                        task.status
                                                    )}`}
                                                >
                                                    {formatStatus(
                                                        task.status
                                                    )}
                                                </span>
                                            </div>

                                            <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500">
                                                <span>
                                                    {task.assignee
                                                        ?.name ||
                                                        task.assigneeId ||
                                                        "Unassigned"}
                                                </span>

                                                <span>
                                                    Due{" "}
                                                    {formatDate(
                                                        task.due_date
                                                    )}
                                                </span>

                                                {task.team && (
                                                    <span>
                                                        {
                                                            task
                                                                .team
                                                                .name
                                                        }
                                                    </span>
                                                )}
                                            </div>
                                        </div>

                                        <ArrowRight
                                            size={17}
                                            className="shrink-0 text-slate-400"
                                        />
                                    </button>
                                )
                            )}
                        </div>
                    )}
                </div>

                {/* Project Info */}
                <div className="space-y-6">
                    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                        <h2 className="text-base font-semibold text-slate-900">
                            Project Information
                        </h2>

                        <div className="mt-5 space-y-4">
                            <div className="flex items-start gap-3">
                                <CalendarDays
                                    size={17}
                                    className="mt-0.5 text-slate-400"
                                />

                                <div>
                                    <p className="text-xs text-slate-500">
                                        Deadline
                                    </p>

                                    <p className="mt-1 text-sm font-medium text-slate-800">
                                        {formatDate(
                                            project.end_date
                                        )}
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-start gap-3">
                                <Users
                                    size={17}
                                    className="mt-0.5 text-slate-400"
                                />

                                <div>
                                    <p className="text-xs text-slate-500">
                                        Members
                                    </p>

                                    <p className="mt-1 text-sm font-medium text-slate-800">
                                        {members.length}
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-start gap-3">
                                <FolderKanban
                                    size={17}
                                    className="mt-0.5 text-slate-400"
                                />

                                <div>
                                    <p className="text-xs text-slate-500">
                                        Teams
                                    </p>

                                    <p className="mt-1 text-sm font-medium text-slate-800">
                                        {teams.length}
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-start gap-3">
                                <IndianRupee
                                    size={17}
                                    className="mt-0.5 text-slate-400"
                                />

                                <div>
                                    <p className="text-xs text-slate-500">
                                        Budget
                                    </p>

                                    <p className="mt-1 text-sm font-medium text-slate-800">
                                        {formatCurrency(
                                            project.budget
                                        )}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                        <h2 className="text-base font-semibold text-slate-900">
                            Project Teams
                        </h2>

                        <div className="mt-4 space-y-3">
                            {teams.length ===
                            0 ? (
                                <p className="text-sm text-slate-500">
                                    No teams assigned.
                                </p>
                            ) : (
                                teams.map(
                                    (item) => {
                                        const team =
                                            item.team ||
                                            item;

                                        return (
                                            <div
                                                key={
                                                    item.id ||
                                                    team.id
                                                }
                                                className="flex items-center gap-3 rounded-xl bg-slate-50 p-3"
                                            >
                                                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white text-slate-600">
                                                    <Users
                                                        size={
                                                            16
                                                        }
                                                    />
                                                </div>

                                                <div>
                                                    <p className="text-sm font-medium text-slate-800">
                                                        {
                                                            team.name
                                                        }
                                                    </p>

                                                    <p className="text-xs text-slate-500">
                                                        {
                                                            team
                                                                .members
                                                                ?.length ||
                                                            0
                                                        }{" "}
                                                        members
                                                    </p>
                                                </div>
                                            </div>
                                        );
                                    }
                                )
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {showCreateTask && (
                <CreateTaskDialog
                    projectId={projectId}
                    onClose={() =>
                        setShowCreateTask(
                            false
                        )
                    }
                    onTaskCreated={
                        handleTaskCreated
                    }
                />
            )}
        </div>
    );
};

export default ProjectDetails;