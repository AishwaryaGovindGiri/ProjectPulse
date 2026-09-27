import { useEffect, useMemo, useState } from "react";
import {
    X,
    Loader2,
    Users,
    UserRound,
    CalendarDays,
    Clock3,
    AlertCircle,
} from "lucide-react";
import toast from "react-hot-toast";

import {
    getProjectById,
    createTask,
} from "../lib/api";

const CURRENT_USER_ID =
    "test-user-1";

const CreateTaskDialog = ({
    projectId,
    onClose,
    onTaskCreated,
}) => {
    const [project, setProject] =
        useState(null);

    const [loading, setLoading] =
        useState(true);

    const [creating, setCreating] =
        useState(false);

    const [form, setForm] = useState({
        title: "",
        description: "",
        teamId: "",
        assigneeId: "",
        type: "TASK",
        status: "TODO",
        priority: "MEDIUM",
        due_date: "",
        estimatedHours: "",
    });

    useEffect(() => {
        loadProject();
    }, [projectId]);

    const loadProject = async () => {
        try {
            setLoading(true);

            const response =
                await getProjectById(
                    projectId
                );

            setProject(
                response?.project ||
                    response
            );
        } catch (error) {
            console.error(
                "Failed to load project:",
                error
            );

            toast.error(
                error?.message ||
                    "Failed to load project."
            );
        } finally {
            setLoading(false);
        }
    };

    const teams =
        project?.teams || [];

    const selectedTeam = useMemo(() => {
        const item =
            teams.find((item) => {
                const team =
                    item.team || item;

                return (
                    team.id ===
                    form.teamId
                );
            });

        return item?.team || item;
    }, [
        teams,
        form.teamId,
    ]);

    const members =
        selectedTeam?.members || [];

    const handleChange = (event) => {
        const {
            name,
            value,
        } = event.target;

        setForm((prev) => ({
            ...prev,
            [name]: value,
        }));

        if (name === "teamId") {
            setForm((prev) => ({
                ...prev,
                teamId: value,
                assigneeId: "",
            }));
        }
    };

    const handleSubmit = async (
        event
    ) => {
        event.preventDefault();

        if (!form.title.trim()) {
            toast.error(
                "Task title is required."
            );
            return;
        }

        if (!form.teamId) {
            toast.error(
                "Select a team."
            );
            return;
        }

        if (!form.assigneeId) {
            toast.error(
                "Select an assignee."
            );
            return;
        }

        if (!form.due_date) {
            toast.error(
                "Due date is required."
            );
            return;
        }

        try {
            setCreating(true);

            const payload = {
                projectId,
                teamId:
                    form.teamId,
                title:
                    form.title.trim(),
                description:
                    form.description.trim(),
                status:
                    form.status,
                type:
                    form.type,
                priority:
                    form.priority,
                assigneeId:
                    form.assigneeId,
                due_date:
                    form.due_date,
            };

            if (
                form.estimatedHours !==
                    "" &&
                !Number.isNaN(
                    Number(
                        form.estimatedHours
                    )
                )
            ) {
                payload.estimatedHours =
                    Number(
                        form.estimatedHours
                    );
            }

            await createTask(
                payload
            );

            toast.success(
                "Task created successfully."
            );

            onTaskCreated?.();
        } catch (error) {
            console.error(
                "Create task error:",
                error
            );

            toast.error(
                error?.message ||
                    "Failed to create task."
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
                            Create Task
                        </h2>

                        <p className="mt-1 text-sm text-slate-500">
                            Assign work to a project team member.
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={onClose}
                        className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                    >
                        <X size={18} />
                    </button>
                </div>

                {loading ? (
                    <div className="flex min-h-[300px] items-center justify-center">
                        <div className="flex flex-col items-center gap-3">
                            <Loader2
                                size={28}
                                className="animate-spin text-slate-500"
                            />

                            <p className="text-sm text-slate-500">
                                Loading project teams...
                            </p>
                        </div>
                    </div>
                ) : (
                    <form
                        onSubmit={
                            handleSubmit
                        }
                        className="overflow-y-auto px-6 py-6"
                    >
                        <div className="space-y-5">
                            {/* Title */}
                            <div>
                                <label className="mb-1.5 block text-sm font-medium text-slate-700">
                                    Task Title
                                    <span className="ml-1 text-red-500">
                                        *
                                    </span>
                                </label>

                                <input
                                    type="text"
                                    name="title"
                                    value={
                                        form.title
                                    }
                                    onChange={
                                        handleChange
                                    }
                                    placeholder="e.g. Implement login API"
                                    className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
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
                                    placeholder="Describe what needs to be done..."
                                    className="w-full resize-none rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
                                />
                            </div>

                            {/* Team + Assignee */}
                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                <div>
                                    <label className="mb-1.5 flex items-center gap-1.5 text-sm font-medium text-slate-700">
                                        <Users
                                            size={
                                                15
                                            }
                                        />
                                        Team
                                        <span className="text-red-500">
                                            *
                                        </span>
                                    </label>

                                    <select
                                        name="teamId"
                                        value={
                                            form.teamId
                                        }
                                        onChange={
                                            handleChange
                                        }
                                        className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-slate-400"
                                    >
                                        <option value="">
                                            Select team
                                        </option>

                                        {teams.map(
                                            (
                                                item
                                            ) => {
                                                const team =
                                                    item.team ||
                                                    item;

                                                return (
                                                    <option
                                                        key={
                                                            item.id ||
                                                            team.id
                                                        }
                                                        value={
                                                            team.id
                                                        }
                                                    >
                                                        {
                                                            team.name
                                                        }
                                                    </option>
                                                );
                                            }
                                        )}
                                    </select>
                                </div>

                                <div>
                                    <label className="mb-1.5 flex items-center gap-1.5 text-sm font-medium text-slate-700">
                                        <UserRound
                                            size={
                                                15
                                            }
                                        />
                                        Assignee
                                        <span className="text-red-500">
                                            *
                                        </span>
                                    </label>

                                    <select
                                        name="assigneeId"
                                        value={
                                            form.assigneeId
                                        }
                                        onChange={
                                            handleChange
                                        }
                                        disabled={
                                            !form.teamId
                                        }
                                        className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-slate-400 disabled:bg-slate-50 disabled:text-slate-400"
                                    >
                                        <option value="">
                                            {form.teamId
                                                ? "Select employee"
                                                : "Select team first"}
                                        </option>

                                        {members.map(
                                            (
                                                member
                                            ) => {
                                                const user =
                                                    member.user ||
                                                    {};

                                                const userId =
                                                    member.userId ||
                                                    user.id;

                                                return (
                                                    <option
                                                        key={
                                                            userId
                                                        }
                                                        value={
                                                            userId
                                                        }
                                                    >
                                                        {user.name ||
                                                            userId}
                                                    </option>
                                                );
                                            }
                                        )}
                                    </select>
                                </div>
                            </div>

                            {form.teamId &&
                                members.length ===
                                    0 && (
                                    <div className="flex gap-3 rounded-xl bg-amber-50 p-4">
                                        <AlertCircle
                                            size={
                                                17
                                            }
                                            className="mt-0.5 shrink-0 text-amber-600"
                                        />

                                        <p className="text-xs leading-5 text-amber-700">
                                            This team has no members.
                                            Add employees to the
                                            team before creating an
                                            assigned task.
                                        </p>
                                    </div>
                                )}

                            {/* Type / Status / Priority */}
                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                                <div>
                                    <label className="mb-1.5 block text-sm font-medium text-slate-700">
                                        Type
                                    </label>

                                    <select
                                        name="type"
                                        value={
                                            form.type
                                        }
                                        onChange={
                                            handleChange
                                        }
                                        className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-slate-400"
                                    >
                                        <option value="TASK">
                                            Task
                                        </option>

                                        <option value="BUG">
                                            Bug
                                        </option>

                                        <option value="FEATURE">
                                            Feature
                                        </option>

                                        <option value="IMPROVEMENT">
                                            Improvement
                                        </option>

                                        <option value="OTHER">
                                            Other
                                        </option>
                                    </select>
                                </div>

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
                                        <option value="TODO">
                                            To Do
                                        </option>

                                        <option value="IN_PROGRESS">
                                            In Progress
                                        </option>

                                        <option value="DONE">
                                            Done
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

                            {/* Date + Hours */}
                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                <div>
                                    <label className="mb-1.5 flex items-center gap-1.5 text-sm font-medium text-slate-700">
                                        <CalendarDays
                                            size={
                                                15
                                            }
                                        />
                                        Due Date
                                        <span className="text-red-500">
                                            *
                                        </span>
                                    </label>

                                    <input
                                        type="date"
                                        name="due_date"
                                        value={
                                            form.due_date
                                        }
                                        onChange={
                                            handleChange
                                        }
                                        className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-slate-400"
                                    />
                                </div>

                                <div>
                                    <label className="mb-1.5 flex items-center gap-1.5 text-sm font-medium text-slate-700">
                                        <Clock3
                                            size={
                                                15
                                            }
                                        />
                                        Estimated Hours
                                    </label>

                                    <input
                                        type="number"
                                        min="0"
                                        step="0.5"
                                        name="estimatedHours"
                                        value={
                                            form.estimatedHours
                                        }
                                        onChange={
                                            handleChange
                                        }
                                        placeholder="e.g. 8"
                                        className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-slate-400"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="mt-7 flex justify-end gap-3 border-t border-slate-100 pt-5">
                            <button
                                type="button"
                                onClick={
                                    onClose
                                }
                                disabled={
                                    creating
                                }
                                className="rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                            >
                                Cancel
                            </button>

                            <button
                                type="submit"
                                disabled={
                                    creating ||
                                    loading
                                }
                                className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                                {creating && (
                                    <Loader2
                                        size={
                                            16
                                        }
                                        className="animate-spin"
                                    />
                                )}

                                Create Task
                            </button>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
};

export default CreateTaskDialog;