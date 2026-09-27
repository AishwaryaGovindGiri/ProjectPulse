import { useEffect, useMemo, useState } from "react";
import {
    Plus,
    FolderKanban,
    Users,
    CalendarDays,
    LockKeyhole,
    ArrowRight,
    Loader2,
    RefreshCw,
    Search,
} from "lucide-react";
import toast from "react-hot-toast";

import {
    getProjects,
    getTeams,
} from "../lib/api";

import CreateProjectDialog from "../components/CreateProjectDialog";
import JoinProjectDialog from "../components/JoinProjectDialog";

const WORKSPACE_ID =
    "35f833fa-8818-43a2-ab1b-d78b1fe82b6c";

const CURRENT_USER_ID = "test-user-1";

const formatDate = (date) => {
    if (!date) return "No deadline";

    return new Date(date).toLocaleDateString(
        "en-IN",
        {
            day: "2-digit",
            month: "short",
            year: "numeric",
        }
    );
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

const getPriorityClasses = (priority) => {
    switch (priority) {
        case "HIGH":
            return "bg-red-50 text-red-700";

        case "MEDIUM":
            return "bg-amber-50 text-amber-700";

        case "LOW":
            return "bg-emerald-50 text-emerald-700";

        default:
            return "bg-slate-50 text-slate-600";
    }
};

const Projects = () => {
    const [projects, setProjects] = useState([]);
    const [teams, setTeams] = useState([]);

    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] =
        useState("ALL");

    const [showCreateProject, setShowCreateProject] =
        useState(false);

    const [showJoinProject, setShowJoinProject] =
        useState(false);

    const [selectedProject, setSelectedProject] =
        useState(null);

    const fetchData = async (isRefresh = false) => {
        try {
            if (isRefresh) {
                setRefreshing(true);
            } else {
                setLoading(true);
            }

            const [projectsData, teamsData] =
                await Promise.all([
                    getProjects({
                        workspaceId: WORKSPACE_ID,
                    }),
                    getTeams(WORKSPACE_ID),
                ]);

            const loadedProjects =
                Array.isArray(projectsData)
                    ? projectsData
                    : projectsData?.projects || [];

            const loadedTeams =
                Array.isArray(teamsData)
                    ? teamsData
                    : teamsData?.teams || [];

            setProjects(loadedProjects);
            setTeams(loadedTeams);
        } catch (error) {
            console.error(
                "Failed to load projects:",
                error
            );

            toast.error(
                error?.message ||
                    "Failed to load projects."
            );
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const filteredProjects = useMemo(() => {
        return projects.filter((project) => {
            const matchesSearch =
                !search.trim() ||
                project.name
                    ?.toLowerCase()
                    .includes(
                        search
                            .trim()
                            .toLowerCase()
                    ) ||
                project.description
                    ?.toLowerCase()
                    .includes(
                        search
                            .trim()
                            .toLowerCase()
                    );

            const matchesStatus =
                statusFilter === "ALL" ||
                project.status === statusFilter;

            return (
                matchesSearch &&
                matchesStatus
            );
        });
    }, [
        projects,
        search,
        statusFilter,
    ]);

    const openProject = (projectId) => {
        window.location.href = `/projectsDetail?projectId=${projectId}`;
    };

    const handleJoinClick = (project) => {
        setSelectedProject(project);
        setShowJoinProject(true);
    };

    const handleProjectCreated = async () => {
        setShowCreateProject(false);
        await fetchData(true);
    };

    const handleProjectJoined = async () => {
        setShowJoinProject(false);
        setSelectedProject(null);
        await fetchData(true);
    };

    const isUserMember = (project) => {
        if (
            Array.isArray(project.members)
        ) {
            return project.members.some(
                (member) =>
                    member.userId ===
                    CURRENT_USER_ID ||
                    member.user?.id ===
                    CURRENT_USER_ID
            );
        }

        return Boolean(
            project.isMember
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
                        Loading projects...
                    </p>
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
                        Workspace
                    </p>

                    <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900">
                        Projects
                    </h1>

                    <p className="mt-1 text-sm text-slate-500">
                        Create projects, join existing projects
                        and manage project teams.
                    </p>
                </div>

                <div className="flex flex-wrap gap-2">
                    <button
                        onClick={() =>
                            fetchData(true)
                        }
                        disabled={refreshing}
                        className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:opacity-60"
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
                            setShowCreateProject(
                                true
                            )
                        }
                        className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-slate-800"
                    >
                        <Plus size={17} />
                        Create Project
                    </button>
                </div>
            </div>

            {/* Summary */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                            <FolderKanban size={20} />
                        </div>

                        <div>
                            <p className="text-xs font-medium text-slate-500">
                                Total Projects
                            </p>

                            <p className="mt-1 text-xl font-bold text-slate-900">
                                {projects.length}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                            <Users size={20} />
                        </div>

                        <div>
                            <p className="text-xs font-medium text-slate-500">
                                Available Teams
                            </p>

                            <p className="mt-1 text-xl font-bold text-slate-900">
                                {teams.length}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-50 text-purple-600">
                            <LockKeyhole size={20} />
                        </div>

                        <div>
                            <p className="text-xs font-medium text-slate-500">
                                Project Access
                            </p>

                            <p className="mt-1 text-sm font-semibold text-slate-900">
                                Password Protected
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Filters */}
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
                    <div className="relative flex-1">
                        <Search
                            size={17}
                            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                        />

                        <input
                            type="text"
                            value={search}
                            onChange={(event) =>
                                setSearch(
                                    event.target
                                        .value
                                )
                            }
                            placeholder="Search projects..."
                            className="w-full rounded-lg border border-slate-200 py-2.5 pl-10 pr-3 text-sm outline-none transition focus:border-slate-400"
                        />
                    </div>

                    <select
                        value={statusFilter}
                        onChange={(event) =>
                            setStatusFilter(
                                event.target.value
                            )
                        }
                        className="rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-slate-400"
                    >
                        <option value="ALL">
                            All Statuses
                        </option>
                        <option value="ACTIVE">
                            Active
                        </option>
                        <option value="PLANNING">
                            Planning
                        </option>
                        <option value="COMPLETED">
                            Completed
                        </option>
                        <option value="ON_HOLD">
                            On Hold
                        </option>
                        <option value="CANCELLED">
                            Cancelled
                        </option>
                    </select>
                </div>
            </div>

            {/* Project Grid */}
            {filteredProjects.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-200 bg-white px-6 py-16 text-center">
                    <FolderKanban
                        size={38}
                        className="mx-auto text-slate-300"
                    />

                    <h2 className="mt-4 text-base font-semibold text-slate-900">
                        No projects found
                    </h2>

                    <p className="mt-1 text-sm text-slate-500">
                        {search ||
                        statusFilter !== "ALL"
                            ? "Try changing your search or filters."
                            : "Create a project to get started."}
                    </p>

                    {!search &&
                        statusFilter ===
                            "ALL" && (
                            <button
                                onClick={() =>
                                    setShowCreateProject(
                                        true
                                    )
                                }
                                className="mt-5 inline-flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-slate-800"
                            >
                                <Plus size={16} />
                                Create Project
                            </button>
                        )}
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
                    {filteredProjects.map(
                        (project) => {
                            const member =
                                isUserMember(
                                    project
                                );

                            const projectTeams =
                                project.teams ||
                                [];

                            const totalTasks =
                                Number(
                                    project.totalTasks
                                ) || 0;

                            const completedTasks =
                                Number(
                                    project.completedTasks
                                ) || 0;

                            const progress =
                                Number(
                                    project.progress
                                ) || 0;

                            return (
                                <div
                                    key={
                                        project.id
                                    }
                                    className="group overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                                >
                                    <div className="p-6">
                                        {/* Project heading */}
                                        <div className="flex items-start justify-between gap-4">
                                            <div className="min-w-0">
                                                <div className="flex flex-wrap items-center gap-2">
                                                    <h2 className="truncate text-lg font-semibold text-slate-900">
                                                        {
                                                            project.name
                                                        }
                                                    </h2>

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

                                                <p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-500">
                                                    {project.description ||
                                                        "No project description available."}
                                                </p>
                                            </div>

                                            <span
                                                className={`shrink-0 rounded-lg px-2.5 py-1.5 text-[11px] font-semibold ${getPriorityClasses(
                                                    project.priority
                                                )}`}
                                            >
                                                {formatStatus(
                                                    project.priority
                                                )}
                                            </span>
                                        </div>

                                        {/* Progress */}
                                        <div className="mt-6">
                                            <div className="mb-2 flex items-center justify-between">
                                                <span className="text-xs font-medium text-slate-500">
                                                    Project
                                                    progress
                                                </span>

                                                <span className="text-sm font-semibold text-slate-900">
                                                    {
                                                        progress
                                                    }
                                                    %
                                                </span>
                                            </div>

                                            <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                                                <div
                                                    className="h-full rounded-full bg-slate-900 transition-all"
                                                    style={{
                                                        width: `${Math.min(
                                                            100,
                                                            Math.max(
                                                                0,
                                                                progress
                                                            )
                                                        )}%`,
                                                    }}
                                                />
                                            </div>
                                        </div>

                                        {/* Stats */}
                                        <div className="mt-6 grid grid-cols-3 gap-3">
                                            <div className="rounded-xl bg-slate-50 p-3">
                                                <p className="text-xs text-slate-500">
                                                    Tasks
                                                </p>

                                                <p className="mt-1 text-base font-semibold text-slate-900">
                                                    {
                                                        totalTasks
                                                    }
                                                </p>
                                            </div>

                                            <div className="rounded-xl bg-slate-50 p-3">
                                                <p className="text-xs text-slate-500">
                                                    Completed
                                                </p>

                                                <p className="mt-1 text-base font-semibold text-emerald-700">
                                                    {
                                                        completedTasks
                                                    }
                                                </p>
                                            </div>

                                            <div className="rounded-xl bg-slate-50 p-3">
                                                <p className="text-xs text-slate-500">
                                                    Teams
                                                </p>

                                                <p className="mt-1 text-base font-semibold text-slate-900">
                                                    {
                                                        projectTeams.length
                                                    }
                                                </p>
                                            </div>
                                        </div>

                                        {/* Teams */}
                                        {projectTeams.length >
                                            0 && (
                                            <div className="mt-5">
                                                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
                                                    Teams
                                                </p>

                                                <div className="flex flex-wrap gap-2">
                                                    {projectTeams
                                                        .slice(
                                                            0,
                                                            4
                                                        )
                                                        .map(
                                                            (
                                                                item
                                                            ) => {
                                                                const team =
                                                                    item.team ||
                                                                    item;

                                                                return (
                                                                    <span
                                                                        key={
                                                                            item.id ||
                                                                            team.id
                                                                        }
                                                                        className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-600"
                                                                    >
                                                                        <Users
                                                                            size={
                                                                                12
                                                                            }
                                                                        />
                                                                        {
                                                                            team.name
                                                                        }
                                                                    </span>
                                                                );
                                                            }
                                                        )}
                                                </div>
                                            </div>
                                        )}

                                        {/* Deadline */}
                                        <div className="mt-5 flex items-center gap-2 text-xs text-slate-500">
                                            <CalendarDays
                                                size={15}
                                            />

                                            <span>
                                                Deadline:
                                            </span>

                                            <span className="font-medium text-slate-700">
                                                {formatDate(
                                                    project.end_date
                                                )}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Footer */}
                                    <div className="flex items-center justify-between border-t border-slate-100 bg-slate-50 px-6 py-4">
                                        <div>
                                            {member ? (
                                                <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-700">
                                                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                                                    Joined
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500">
                                                    <LockKeyhole
                                                        size={
                                                            13
                                                        }
                                                    />
                                                    Password
                                                    required
                                                </span>
                                            )}
                                        </div>

                                        {member ? (
                                            <button
                                                onClick={() =>
                                                    openProject(
                                                        project.id
                                                    )
                                                }
                                                className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-xs font-medium text-white transition hover:bg-slate-800"
                                            >
                                                Open Project
                                                <ArrowRight
                                                    size={
                                                        14
                                                    }
                                                />
                                            </button>
                                        ) : (
                                            <button
                                                onClick={() =>
                                                    handleJoinClick(
                                                        project
                                                    )
                                                }
                                                className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-xs font-medium text-slate-700 transition hover:bg-slate-100"
                                            >
                                                Join Project
                                                <ArrowRight
                                                    size={
                                                        14
                                                    }
                                                />
                                            </button>
                                        )}
                                    </div>
                                </div>
                            );
                        }
                    )}
                </div>
            )}

            {/* Create Project Dialog */}
            {showCreateProject && (
                <CreateProjectDialog
                    workspaceId={
                        WORKSPACE_ID
                    }
                    teams={teams}
                    onClose={() =>
                        setShowCreateProject(
                            false
                        )
                    }
                    onProjectCreated={
                        handleProjectCreated
                    }
                />
            )}

            {/* Join Project Dialog */}
            {showJoinProject &&
                selectedProject && (
                    <JoinProjectDialog
                        project={
                            selectedProject
                        }
                        userId={
                            CURRENT_USER_ID
                        }
                        onClose={() => {
                            setShowJoinProject(
                                false
                            );
                            setSelectedProject(
                                null
                            );
                        }}
                        onProjectJoined={
                            handleProjectJoined
                        }
                    />
                )}
        </div>
    );
};

export default Projects;