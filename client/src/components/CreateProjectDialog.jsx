import { useEffect, useState } from "react";
import {
    X,
    Loader2,
    LockKeyhole,
    CalendarDays,
    IndianRupee,
    Users,
} from "lucide-react";
import toast from "react-hot-toast";

import {
    getTeams,
    createTeam,
    createProject,
} from "../lib/api";

const DEFAULT_TEAMS = [
    {
        name: "Development Team",
        description:
            "Responsible for application development, backend, frontend and technical implementation.",
    },
    {
        name: "Design Team",
        description:
            "Responsible for UI/UX design, user experience and visual design.",
    },
    {
        name: "Testing Team",
        description:
            "Responsible for quality assurance, testing and bug verification.",
    },
    {
        name: "Finance Team",
        description:
            "Responsible for project budgets, costs and financial tracking.",
    },
];

const CreateProjectDialog = ({
    workspaceId,
    teams = [],
    onClose,
    onProjectCreated,
}) => {
    const [availableTeams, setAvailableTeams] =
        useState(teams);

    const [loadingTeams, setLoadingTeams] =
        useState(true);

    const [creating, setCreating] =
        useState(false);

    const [form, setForm] = useState({
        name: "",
        description: "",
        status: "PLANNING",
        priority: "MEDIUM",
        start_date: "",
        end_date: "",
        password: "",
        budget: "",
    });

    const [selectedTeamIds, setSelectedTeamIds] =
        useState([]);

    useEffect(() => {
        loadTeams();
    }, [workspaceId]);

    const loadTeams = async () => {
        try {
            setLoadingTeams(true);

            const response =
                await getTeams(workspaceId);

            let loadedTeams = Array.isArray(
                response
            )
                ? response
                : response?.teams || [];

            /*
             * Make sure all four standard teams exist.
             */
            const existingNames = new Set(
                loadedTeams.map((team) =>
                    team.name.toLowerCase()
                )
            );

            for (const defaultTeam of DEFAULT_TEAMS) {
                if (
                    !existingNames.has(
                        defaultTeam.name.toLowerCase()
                    )
                ) {
                    try {
                        const response =
                            await createTeam({
                                workspaceId,
                                name: defaultTeam.name,
                                description:
                                    defaultTeam.description,
                            });

                        const newTeam =
                            response?.team ||
                            response;

                        if (newTeam?.id) {
                            loadedTeams = [
                                ...loadedTeams,
                                newTeam,
                            ];
                        }
                    } catch (error) {
                        console.error(
                            `Failed to create ${defaultTeam.name}:`,
                            error
                        );
                    }
                }
            }

            setAvailableTeams(
                loadedTeams
            );
        } catch (error) {
            console.error(
                "Failed to load teams:",
                error
            );

            /*
             * Use teams received from parent as
             * fallback.
             */
            setAvailableTeams(teams || []);

            toast.error(
                "Could not load teams."
            );
        } finally {
            setLoadingTeams(false);
        }
    };

    const handleChange = (event) => {
        const {
            name,
            value,
        } = event.target;

        setForm((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    const toggleTeam = (teamId) => {
        setSelectedTeamIds((prev) => {
            if (prev.includes(teamId)) {
                return prev.filter(
                    (id) => id !== teamId
                );
            }

            return [
                ...prev,
                teamId,
            ];
        });
    };

    const handleSubmit = async (event) => {
        event.preventDefault();

        if (!form.name.trim()) {
            toast.error(
                "Project name is required."
            );
            return;
        }

        if (!form.password.trim()) {
            toast.error(
                "Project password is required."
            );
            return;
        }

        if (form.password.trim().length < 4) {
            toast.error(
                "Project password must be at least 4 characters."
            );
            return;
        }

        if (
            form.start_date &&
            form.end_date &&
            new Date(form.end_date) <
                new Date(form.start_date)
        ) {
            toast.error(
                "End date cannot be before start date."
            );
            return;
        }

        if (selectedTeamIds.length === 0) {
            toast.error(
                "Select at least one team for this project."
            );
            return;
        }

        try {
            setCreating(true);

            const payload = {
                name: form.name.trim(),
                description:
                    form.description.trim(),
                status: form.status,
                priority: form.priority,
                workspaceId,
                password:
                    form.password.trim(),
                teamIds:
                    selectedTeamIds,
            };

            if (form.start_date) {
                payload.start_date =
                    form.start_date;
            }

            if (form.end_date) {
                payload.end_date =
                    form.end_date;
            }

            if (
                form.budget !== "" &&
                !Number.isNaN(
                    Number(form.budget)
                )
            ) {
                payload.budget =
                    Number(form.budget);
            }

            await createProject(
                payload
            );

            toast.success(
                "Project created successfully."
            );

            onProjectCreated?.();
        } catch (error) {
            console.error(
                "Create project error:",
                error
            );

            toast.error(
                error?.message ||
                    "Failed to create project."
            );
        } finally {
            setCreating(false);
        }
    };

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4"
            onMouseDown={(event) => {
                if (
                    event.target ===
                    event.currentTarget
                ) {
                    onClose?.();
                }
            }}
        >
            <div className="flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
                {/* Header */}
                <div className="flex items-start justify-between border-b border-slate-200 px-6 py-5">
                    <div>
                        <h2 className="text-lg font-semibold text-slate-900">
                            Create Project
                        </h2>

                        <p className="mt-1 text-sm text-slate-500">
                            Set up a project and assign the
                            teams that will work on it.
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={onClose}
                        className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                    >
                        <X size={18} />
                    </button>
                </div>

                {/* Form */}
                <form
                    onSubmit={handleSubmit}
                    className="overflow-y-auto px-6 py-6"
                >
                    <div className="space-y-5">
                        {/* Project Name */}
                        <div>
                            <label className="mb-1.5 block text-sm font-medium text-slate-700">
                                Project Name
                                <span className="ml-1 text-red-500">
                                    *
                                </span>
                            </label>

                            <input
                                type="text"
                                name="name"
                                value={form.name}
                                onChange={
                                    handleChange
                                }
                                placeholder="e.g. ProjectPulse Mobile App"
                                className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
                            />
                        </div>

                        {/* Description */}
                        <div>
                            <label className="mb-1.5 block text-sm font-medium text-slate-700">
                                Description
                            </label>

                            <textarea
                                name="description"
                                value={
                                    form.description
                                }
                                onChange={
                                    handleChange
                                }
                                rows={3}
                                placeholder="Describe the project and its objective..."
                                className="w-full resize-none rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
                            />
                        </div>

                        {/* Status + Priority */}
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                            <div>
                                <label className="mb-1.5 block text-sm font-medium text-slate-700">
                                    Status
                                </label>

                                <select
                                    name="status"
                                    value={
                                        form.status
                                    }
                                    onChange={
                                        handleChange
                                    }
                                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-slate-400"
                                >
                                    <option value="PLANNING">
                                        Planning
                                    </option>

                                    <option value="ACTIVE">
                                        Active
                                    </option>

                                    <option value="ON_HOLD">
                                        On Hold
                                    </option>

                                    <option value="COMPLETED">
                                        Completed
                                    </option>

                                    <option value="CANCELLED">
                                        Cancelled
                                    </option>
                                </select>
                            </div>

                            <div>
                                <label className="mb-1.5 block text-sm font-medium text-slate-700">
                                    Priority
                                </label>

                                <select
                                    name="priority"
                                    value={
                                        form.priority
                                    }
                                    onChange={
                                        handleChange
                                    }
                                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-slate-400"
                                >
                                    <option value="LOW">
                                        Low
                                    </option>

                                    <option value="MEDIUM">
                                        Medium
                                    </option>

                                    <option value="HIGH">
                                        High
                                    </option>
                                </select>
                            </div>
                        </div>

                        {/* Dates */}
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                            <div>
                                <label className="mb-1.5 flex items-center gap-1.5 text-sm font-medium text-slate-700">
                                    <CalendarDays
                                        size={15}
                                    />
                                    Start Date
                                </label>

                                <input
                                    type="date"
                                    name="start_date"
                                    value={
                                        form.start_date
                                    }
                                    onChange={
                                        handleChange
                                    }
                                    className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-slate-400"
                                />
                            </div>

                            <div>
                                <label className="mb-1.5 flex items-center gap-1.5 text-sm font-medium text-slate-700">
                                    <CalendarDays
                                        size={15}
                                    />
                                    End Date
                                </label>

                                <input
                                    type="date"
                                    name="end_date"
                                    value={
                                        form.end_date
                                    }
                                    onChange={
                                        handleChange
                                    }
                                    className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-slate-400"
                                />
                            </div>
                        </div>

                        {/* Password + Budget */}
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                            <div>
                                <label className="mb-1.5 flex items-center gap-1.5 text-sm font-medium text-slate-700">
                                    <LockKeyhole
                                        size={15}
                                    />
                                    Project Password
                                    <span className="text-red-500">
                                        *
                                    </span>
                                </label>

                                <input
                                    type="password"
                                    name="password"
                                    value={
                                        form.password
                                    }
                                    onChange={
                                        handleChange
                                    }
                                    placeholder="Password for employees"
                                    className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-slate-400"
                                />

                                <p className="mt-1.5 text-xs text-slate-400">
                                    Employees will need this
                                    password to join the
                                    project.
                                </p>
                            </div>

                            <div>
                                <label className="mb-1.5 flex items-center gap-1.5 text-sm font-medium text-slate-700">
                                    <IndianRupee
                                        size={15}
                                    />
                                    Budget
                                </label>

                                <input
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    name="budget"
                                    value={
                                        form.budget
                                    }
                                    onChange={
                                        handleChange
                                    }
                                    placeholder="e.g. 100000"
                                    className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-slate-400"
                                />
                            </div>
                        </div>

                        {/* Teams */}
                        <div>
                            <div className="mb-2 flex items-center justify-between">
                                <div>
                                    <label className="flex items-center gap-1.5 text-sm font-medium text-slate-700">
                                        <Users
                                            size={15}
                                        />
                                        Project Teams
                                        <span className="text-red-500">
                                            *
                                        </span>
                                    </label>

                                    <p className="mt-1 text-xs text-slate-400">
                                        Select the teams that can
                                        work on this project.
                                    </p>
                                </div>

                                <span className="text-xs font-medium text-slate-500">
                                    {
                                        selectedTeamIds.length
                                    }{" "}
                                    selected
                                </span>
                            </div>

                            {loadingTeams ? (
                                <div className="flex items-center justify-center rounded-xl border border-slate-200 py-8">
                                    <Loader2
                                        size={22}
                                        className="animate-spin text-slate-500"
                                    />
                                </div>
                            ) : availableTeams.length ===
                              0 ? (
                                <div className="rounded-xl border border-dashed border-slate-200 p-6 text-center">
                                    <Users
                                        size={25}
                                        className="mx-auto text-slate-300"
                                    />

                                    <p className="mt-2 text-sm text-slate-600">
                                        No teams available.
                                    </p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                                    {availableTeams.map(
                                        (team) => {
                                            const selected =
                                                selectedTeamIds.includes(
                                                    team.id
                                                );

                                            return (
                                                <button
                                                    type="button"
                                                    key={
                                                        team.id
                                                    }
                                                    onClick={() =>
                                                        toggleTeam(
                                                            team.id
                                                        )
                                                    }
                                                    className={`rounded-xl border p-4 text-left transition ${
                                                        selected
                                                            ? "border-slate-900 bg-slate-50 ring-1 ring-slate-900"
                                                            : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50"
                                                    }`}
                                                >
                                                    <div className="flex items-start gap-3">
                                                        <div
                                                            className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded border ${
                                                                selected
                                                                    ? "border-slate-900 bg-slate-900 text-white"
                                                                    : "border-slate-300 bg-white"
                                                            }`}
                                                        >
                                                            {selected && (
                                                                <svg
                                                                    viewBox="0 0 20 20"
                                                                    fill="none"
                                                                    className="h-3.5 w-3.5"
                                                                >
                                                                    <path
                                                                        d="M5 10.5L8.2 13.5L15 6.5"
                                                                        stroke="currentColor"
                                                                        strokeWidth="2"
                                                                        strokeLinecap="round"
                                                                        strokeLinejoin="round"
                                                                    />
                                                                </svg>
                                                            )}
                                                        </div>

                                                        <div className="min-w-0">
                                                            <p className="text-sm font-semibold text-slate-900">
                                                                {
                                                                    team.name
                                                                }
                                                            </p>

                                                            <p className="mt-1 line-clamp-2 text-xs leading-5 text-slate-500">
                                                                {team.description ||
                                                                    "No description available."}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </button>
                                            );
                                        }
                                    )}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="mt-7 flex justify-end gap-3 border-t border-slate-100 pt-5">
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={creating}
                            className="rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
                        >
                            Cancel
                        </button>

                        <button
                            type="submit"
                            disabled={
                                creating ||
                                loadingTeams
                            }
                            className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            {creating && (
                                <Loader2
                                    size={16}
                                    className="animate-spin"
                                />
                            )}

                            Create Project
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default CreateProjectDialog;