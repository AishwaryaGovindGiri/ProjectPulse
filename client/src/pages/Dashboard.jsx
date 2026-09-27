import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
    AlertCircle,
    ArrowRight,
    BriefcaseBusiness,
    CheckCircle2,
    Clock3,
    FolderKanban,
    IndianRupee,
    ListTodo,
    Loader2,
    RefreshCw,
    Target,
    Users,
    Wallet,
} from "lucide-react";

import { getDashboard } from "../lib/api";

const formatCurrency = (value) => {
    if (value === null || value === undefined || Number.isNaN(Number(value))) {
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
        .replace(/\b\w/g, (char) => char.toUpperCase());
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
            return "bg-slate-50 text-slate-700 border-slate-200";
    }
};

const getPriorityClasses = (priority) => {
    switch (priority) {
        case "HIGH":
            return "bg-red-50 text-red-700";

        case "MEDIUM":
            return "bg-amber-50 text-amber-700";

        case "LOW":
            return "bg-emerald-50 text-emerald-700";

        default:
            return "bg-slate-50 text-slate-700";
    }
};

const StatCard = ({
    title,
    value,
    subtitle,
    icon: Icon,
    iconWrapper,
}) => {
    return (
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-start justify-between gap-4">
                <div>
                    <p className="text-sm font-medium text-slate-500">
                        {title}
                    </p>

                    <h3 className="mt-2 text-2xl font-bold text-slate-900">
                        {value}
                    </h3>

                    {subtitle && (
                        <p className="mt-1 text-xs text-slate-500">
                            {subtitle}
                        </p>
                    )}
                </div>

                <div
                    className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${iconWrapper}`}
                >
                    <Icon size={21} />
                </div>
            </div>
        </div>
    );
};

const ProgressBar = ({ value = 0 }) => {
    const safeValue = Math.min(
        100,
        Math.max(0, Number(value) || 0)
    );

    return (
        <div className="h-2 overflow-hidden rounded-full bg-slate-100">
            <div
                className="h-full rounded-full bg-slate-900 transition-all duration-500"
                style={{ width: `${safeValue}%` }}
            />
        </div>
    );
};

const Dashboard = () => {
    const navigate = useNavigate();

    const [dashboard, setDashboard] = useState(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState("");

    const fetchDashboard = async (isRefresh = false) => {
        try {
            if (isRefresh) {
                setRefreshing(true);
            } else {
                setLoading(true);
            }

            setError("");

            const data = await getDashboard();

            setDashboard(data);
        } catch (err) {
            console.error(
                "Failed to fetch dashboard:",
                err
            );

            setError(
                err?.message ||
                    "Unable to load dashboard data."
            );
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchDashboard();
    }, []);

    const summary = dashboard?.summary || {};

    const projects = Array.isArray(dashboard?.projects)
        ? dashboard.projects
        : [];

    const employeePerformance = Array.isArray(
        dashboard?.employeePerformance
    )
        ? dashboard.employeePerformance
        : [];

    const taskCompletionRate = useMemo(() => {
        const totalTasks = Number(summary.totalTasks) || 0;
        const completedTasks =
            Number(summary.completedTasks) || 0;

        if (totalTasks === 0) return 0;

        return Math.round(
            (completedTasks / totalTasks) * 100
        );
    }, [
        summary.totalTasks,
        summary.completedTasks,
    ]);

    const budgetUtilization = useMemo(() => {
        const budget = Number(summary.totalBudget) || 0;
        const actualCost =
            Number(summary.totalActualCost) || 0;

        if (budget <= 0) return 0;

        return Math.min(
            100,
            Math.round((actualCost / budget) * 100)
        );
    }, [
        summary.totalBudget,
        summary.totalActualCost,
    ]);

    const activeProjects = projects.filter(
        (project) =>
            project.status === "ACTIVE" ||
            project.status === "PLANNING"
    ).length;

    if (loading) {
        return (
            <div className="flex min-h-[70vh] items-center justify-center">
                <div className="flex flex-col items-center gap-3">
                    <Loader2
                        size={30}
                        className="animate-spin text-slate-700"
                    />

                    <p className="text-sm text-slate-500">
                        Loading dashboard...
                    </p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex min-h-[70vh] items-center justify-center px-6">
                <div className="w-full max-w-md rounded-2xl border border-red-200 bg-white p-7 text-center shadow-sm">
                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-50 text-red-600">
                        <AlertCircle size={24} />
                    </div>

                    <h2 className="mt-4 text-lg font-semibold text-slate-900">
                        Dashboard could not be loaded
                    </h2>

                    <p className="mt-2 text-sm text-slate-500">
                        {error}
                    </p>

                    <button
                        onClick={() => fetchDashboard()}
                        className="mt-5 inline-flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-slate-800"
                    >
                        <RefreshCw size={16} />
                        Try Again
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6 pb-8">
            {/* Header */}
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                    <p className="text-sm font-medium text-slate-500">
                        Overview
                    </p>

                    <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900">
                        Dashboard
                    </h1>

                    <p className="mt-1 text-sm text-slate-500">
                        Monitor projects, tasks, teams and overall
                        progress from one place.
                    </p>
                </div>

                <button
                    onClick={() => fetchDashboard(true)}
                    disabled={refreshing}
                    className="inline-flex w-fit items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
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
            </div>

            {/* Main Stats */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <StatCard
                    title="Total Projects"
                    value={summary.totalProjects || 0}
                    subtitle={`${activeProjects} active/planning`}
                    icon={FolderKanban}
                    iconWrapper="bg-blue-50 text-blue-600"
                />

                <StatCard
                    title="Total Tasks"
                    value={summary.totalTasks || 0}
                    subtitle={`${summary.completedTasks || 0} completed`}
                    icon={ListTodo}
                    iconWrapper="bg-purple-50 text-purple-600"
                />

                <StatCard
                    title="Employees"
                    value={summary.employeeCount || 0}
                    subtitle="Across the workspace"
                    icon={Users}
                    iconWrapper="bg-emerald-50 text-emerald-600"
                />

                <StatCard
                    title="Overall Progress"
                    value={`${summary.overallProgress || 0}%`}
                    subtitle={`${taskCompletionRate}% task completion`}
                    icon={Target}
                    iconWrapper="bg-orange-50 text-orange-600"
                />
            </div>

            {/* Task Overview + Budget */}
            <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
                {/* Task Overview */}
                <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm xl:col-span-2">
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-base font-semibold text-slate-900">
                                Task Overview
                            </h2>

                            <p className="mt-1 text-sm text-slate-500">
                                Current task distribution across all
                                projects.
                            </p>
                        </div>

                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-700">
                            <ListTodo size={20} />
                        </div>
                    </div>

                    <div className="mt-7 grid grid-cols-1 gap-4 sm:grid-cols-3">
                        <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
                            <div className="flex items-center gap-2 text-emerald-600">
                                <CheckCircle2 size={18} />

                                <span className="text-sm font-medium">
                                    Completed
                                </span>
                            </div>

                            <p className="mt-3 text-2xl font-bold text-slate-900">
                                {summary.completedTasks || 0}
                            </p>

                            <p className="mt-1 text-xs text-slate-500">
                                Finished tasks
                            </p>
                        </div>

                        <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
                            <div className="flex items-center gap-2 text-blue-600">
                                <Clock3 size={18} />

                                <span className="text-sm font-medium">
                                    In Progress
                                </span>
                            </div>

                            <p className="mt-3 text-2xl font-bold text-slate-900">
                                {summary.inProgressTasks || 0}
                            </p>

                            <p className="mt-1 text-xs text-slate-500">
                                Currently active
                            </p>
                        </div>

                        <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
                            <div className="flex items-center gap-2 text-amber-600">
                                <ListTodo size={18} />

                                <span className="text-sm font-medium">
                                    To Do
                                </span>
                            </div>

                            <p className="mt-3 text-2xl font-bold text-slate-900">
                                {summary.todoTasks || 0}
                            </p>

                            <p className="mt-1 text-xs text-slate-500">
                                Waiting to start
                            </p>
                        </div>
                    </div>

                    <div className="mt-6">
                        <div className="mb-2 flex items-center justify-between text-sm">
                            <span className="font-medium text-slate-700">
                                Task completion
                            </span>

                            <span className="font-semibold text-slate-900">
                                {taskCompletionRate}%
                            </span>
                        </div>

                        <ProgressBar
                            value={taskCompletionRate}
                        />
                    </div>
                </div>

                {/* Budget */}
                <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-base font-semibold text-slate-900">
                                Budget
                            </h2>

                            <p className="mt-1 text-sm text-slate-500">
                                Overall project spending.
                            </p>
                        </div>

                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                            <Wallet size={20} />
                        </div>
                    </div>

                    <div className="mt-7">
                        <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                            Total Budget
                        </p>

                        <p className="mt-2 text-2xl font-bold text-slate-900">
                            {formatCurrency(
                                summary.totalBudget
                            )}
                        </p>
                    </div>

                    <div className="mt-6">
                        <div className="flex items-center justify-between text-sm">
                            <span className="text-slate-500">
                                Actual Cost
                            </span>

                            <span className="font-semibold text-slate-900">
                                {formatCurrency(
                                    summary.totalActualCost
                                )}
                            </span>
                        </div>

                        <div className="mt-3">
                            <ProgressBar
                                value={budgetUtilization}
                            />
                        </div>

                        <p className="mt-2 text-xs text-slate-500">
                            {budgetUtilization}% of total budget
                            utilized
                        </p>
                    </div>

                    <div className="mt-6 flex items-center gap-2 rounded-xl bg-slate-50 p-3">
                        <IndianRupee
                            size={16}
                            className="text-slate-500"
                        />

                        <p className="text-xs text-slate-600">
                            Budget data is aggregated across all
                            projects.
                        </p>
                    </div>
                </div>
            </div>

            {/* Projects */}
            <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
                <div className="flex flex-col gap-3 border-b border-slate-200 p-6 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h2 className="text-base font-semibold text-slate-900">
                            Project Overview
                        </h2>

                        <p className="mt-1 text-sm text-slate-500">
                            Track progress and workload for every
                            project.
                        </p>
                    </div>

                    <button
                        onClick={() => navigate("/projects")}
                        className="inline-flex items-center gap-2 text-sm font-medium text-slate-700 transition hover:text-slate-900"
                    >
                        View all projects
                        <ArrowRight size={16} />
                    </button>
                </div>

                {projects.length === 0 ? (
                    <div className="px-6 py-12 text-center">
                        <BriefcaseBusiness
                            size={32}
                            className="mx-auto text-slate-300"
                        />

                        <p className="mt-3 text-sm font-medium text-slate-700">
                            No projects found
                        </p>

                        <p className="mt-1 text-xs text-slate-500">
                            Create a project to start managing work.
                        </p>
                    </div>
                ) : (
                    <div className="divide-y divide-slate-100">
                        {projects.map((project) => (
                            <div
                                key={project.id}
                                className="p-6 transition hover:bg-slate-50"
                            >
                                <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                                    <div className="min-w-0 flex-1">
                                        <div className="flex flex-wrap items-center gap-2">
                                            <button
                                                onClick={() =>
                                                    navigate(
                                                        `/projectsDetail?projectId=${project.id}`
                                                    )
                                                }
                                                className="truncate text-left text-base font-semibold text-slate-900 hover:text-blue-600"
                                            >
                                                {project.name}
                                            </button>

                                            <span
                                                className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold ${getStatusClasses(
                                                    project.status
                                                )}`}
                                            >
                                                {formatStatus(
                                                    project.status
                                                )}
                                            </span>

                                            <span
                                                className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${getPriorityClasses(
                                                    project.priority
                                                )}`}
                                            >
                                                {formatStatus(
                                                    project.priority
                                                )}
                                            </span>
                                        </div>

                                        <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-xs text-slate-500">
                                            <span>
                                                {project.totalTasks ||
                                                    0}{" "}
                                                tasks
                                            </span>

                                            <span>
                                                {project.teamCount ||
                                                    0}{" "}
                                                teams
                                            </span>

                                            <span>
                                                {project.memberCount ||
                                                    0}{" "}
                                                members
                                            </span>

                                            <span>
                                                {project.mistakes ||
                                                    0}{" "}
                                                mistakes
                                            </span>
                                        </div>
                                    </div>

                                    <div className="w-full lg:w-72">
                                        <div className="mb-2 flex items-center justify-between">
                                            <span className="text-xs font-medium text-slate-500">
                                                Progress
                                            </span>

                                            <span className="text-sm font-semibold text-slate-900">
                                                {project.progress ||
                                                    0}
                                                %
                                            </span>
                                        </div>

                                        <ProgressBar
                                            value={
                                                project.progress
                                            }
                                        />

                                        <div className="mt-3 flex items-center justify-between text-xs text-slate-500">
                                            <span>
                                                {
                                                    project.completedTasks
                                                }{" "}
                                                completed
                                            </span>

                                            <button
                                                onClick={() =>
                                                    navigate(
                                                        `/projectsDetail?projectId=${project.id}`
                                                    )
                                                }
                                                className="inline-flex items-center gap-1 font-medium text-slate-700 hover:text-slate-900"
                                            >
                                                Open
                                                <ArrowRight
                                                    size={13}
                                                />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Performance Snapshot */}
            <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
                <div className="flex flex-col gap-3 border-b border-slate-200 p-6 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h2 className="text-base font-semibold text-slate-900">
                            Employee Performance Snapshot
                        </h2>

                        <p className="mt-1 text-sm text-slate-500">
                            Global work-performance data across
                            projects.
                        </p>
                    </div>

                    <button
                        onClick={() => navigate("/performance")}
                        className="inline-flex items-center gap-2 text-sm font-medium text-slate-700 transition hover:text-slate-900"
                    >
                        View performance
                        <ArrowRight size={16} />
                    </button>
                </div>

                {employeePerformance.length === 0 ? (
                    <div className="px-6 py-10 text-center">
                        <Users
                            size={30}
                            className="mx-auto text-slate-300"
                        />

                        <p className="mt-3 text-sm text-slate-500">
                            No employee performance data available.
                        </p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 gap-4 p-6 md:grid-cols-2 xl:grid-cols-3">
                        {employeePerformance
                            .slice(0, 6)
                            .map((employee) => (
                                <div
                                    key={employee.userId}
                                    className="rounded-xl border border-slate-100 bg-slate-50 p-4"
                                >
                                    <div className="flex items-center justify-between gap-3">
                                        <div className="min-w-0">
                                            <p className="truncate text-sm font-semibold text-slate-900">
                                                {employee.name ||
                                                    "Unknown employee"}
                                            </p>

                                            <p className="mt-1 truncate text-xs text-slate-500">
                                                {employee.email ||
                                                    "No email"}
                                            </p>
                                        </div>

                                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white text-slate-600">
                                            <Users size={16} />
                                        </div>
                                    </div>

                                    <div className="mt-4 grid grid-cols-3 gap-2 text-center">
                                        <div>
                                            <p className="text-sm font-bold text-slate-900">
                                                {employee.onTime ??
                                                    0}
                                            </p>

                                            <p className="mt-1 text-[10px] text-slate-500">
                                                On time
                                            </p>
                                        </div>

                                        <div>
                                            <p className="text-sm font-bold text-slate-900">
                                                {employee.late ??
                                                    0}
                                            </p>

                                            <p className="mt-1 text-[10px] text-slate-500">
                                                Late
                                            </p>
                                        </div>

                                        <div>
                                            <p className="text-sm font-bold text-slate-900">
                                                {employee.mistakes ??
                                                    0}
                                            </p>

                                            <p className="mt-1 text-[10px] text-slate-500">
                                                Mistakes
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default Dashboard;