import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
    ArrowLeft,
    CheckCircle2,
    Clock3,
    AlertCircle,
    Loader2,
    MessageSquare,
    Send,
    Trash2,
    AlertTriangle,
    CalendarDays,
    Users,
    UserRound,
    RefreshCw,
} from "lucide-react";
import toast from "react-hot-toast";

import {
    getTaskById,
    updateTaskStatus,
    getTaskComments,
    createComment,
    deleteComment,
    getTaskMistakes,
    createMistake,
    deleteMistake,
} from "../lib/api";

const CURRENT_USER_ID =
    "test-user-1";

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

const formatDateTime = (date) => {
    if (!date) return "Not available";

    return new Date(date).toLocaleString(
        "en-IN",
        {
            day: "2-digit",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
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
        case "DONE":
            return "bg-emerald-50 text-emerald-700 border-emerald-200";

        case "IN_PROGRESS":
            return "bg-blue-50 text-blue-700 border-blue-200";

        case "TODO":
            return "bg-slate-100 text-slate-600 border-slate-200";

        default:
            return "bg-slate-100 text-slate-600 border-slate-200";
    }
};

const TaskDetails = () => {
    const navigate = useNavigate();
    const [searchParams] =
        useSearchParams();

    const taskId =
        searchParams.get("taskId");

    const [task, setTask] =
        useState(null);

    const [comments, setComments] =
        useState([]);

    const [mistakes, setMistakes] =
        useState([]);

    const [loading, setLoading] =
        useState(true);

    const [refreshing, setRefreshing] =
        useState(false);

    const [updatingStatus, setUpdatingStatus] =
        useState(false);

    const [commentText, setCommentText] =
        useState("");

    const [sendingComment, setSendingComment] =
        useState(false);

    const [addingMistake, setAddingMistake] =
        useState(false);

    const [error, setError] =
        useState("");

    const fetchData = async (
        isRefresh = false
    ) => {
        if (!taskId) {
            setError("Task ID is missing.");
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

            const [
                taskResponse,
                commentsResponse,
                mistakesResponse,
            ] = await Promise.all([
                getTaskById(taskId),
                getTaskComments(taskId),
                getTaskMistakes(taskId),
            ]);

            setTask(
                taskResponse?.task ||
                    taskResponse
            );

            setComments(
                Array.isArray(
                    commentsResponse
                )
                    ? commentsResponse
                    : commentsResponse?.comments ||
                      []
            );

            setMistakes(
                Array.isArray(
                    mistakesResponse
                )
                    ? mistakesResponse
                    : mistakesResponse?.mistakes ||
                      []
            );
        } catch (err) {
            console.error(
                "Failed to load task:",
                err
            );

            setError(
                err?.message ||
                    "Failed to load task."
            );
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [taskId]);

    const isLate = useMemo(() => {
        if (!task?.due_date) return false;

        const dueDate = new Date(
            task.due_date
        );

        if (
            task.status === "DONE" &&
            task.completedAt
        ) {
            return (
                new Date(
                    task.completedAt
                ) > dueDate
            );
        }

        return (
            task.status !== "DONE" &&
            new Date() > dueDate
        );
    }, [task]);

    const completedLate =
        task?.status === "DONE" &&
        task?.completedAt &&
        task?.due_date
            ? new Date(
                  task.completedAt
              ) >
              new Date(task.due_date)
            : false;

    const isOnTime =
        task?.status === "DONE" &&
        task?.completedAt &&
        task?.due_date
            ? !completedLate
            : false;

    const managerIds = useMemo(() => {
        return (
            task?.team?.members
                ?.filter(
                    (member) =>
                        member.role ===
                        "MANAGER"
                )
                .map(
                    (member) =>
                        member.userId
                ) || []
        );
    }, [task]);

    const isManager =
        managerIds.includes(
            CURRENT_USER_ID
        );

    const handleStatusChange = async (
        status
    ) => {
        if (!taskId) return;

        try {
            setUpdatingStatus(true);

            const response =
                await updateTaskStatus(
                    taskId,
                    { status }
                );

            const updatedTask =
                response?.task ||
                response;

            if (updatedTask?.id) {
                setTask(
                    (prev) => ({
                        ...prev,
                        ...updatedTask,
                    })
                );
            } else {
                await fetchData(true);
            }

            toast.success(
                "Task status updated."
            );
        } catch (error) {
            console.error(
                "Status update error:",
                error
            );

            toast.error(
                error?.message ||
                    "Failed to update task status."
            );
        } finally {
            setUpdatingStatus(false);
        }
    };

    const handleAddComment = async (
        event
    ) => {
        event.preventDefault();

        if (!commentText.trim()) {
            return;
        }

        try {
            setSendingComment(true);

            await createComment({
                taskId,
                userId:
                    CURRENT_USER_ID,
                content:
                    commentText.trim(),
            });

            setCommentText("");

            const response =
                await getTaskComments(
                    taskId
                );

            setComments(
                Array.isArray(response)
                    ? response
                    : response?.comments ||
                          []
            );

            toast.success(
                "Comment added."
            );
        } catch (error) {
            console.error(
                "Comment error:",
                error
            );

            toast.error(
                error?.message ||
                    "Failed to add comment."
            );
        } finally {
            setSendingComment(false);
        }
    };

    const handleDeleteComment = async (
        commentId
    ) => {
        try {
            await deleteComment(
                commentId
            );

            setComments((prev) =>
                prev.filter(
                    (comment) =>
                        comment.id !==
                        commentId
                )
            );

            toast.success(
                "Comment deleted."
            );
        } catch (error) {
            console.error(
                "Delete comment error:",
                error
            );

            toast.error(
                error?.message ||
                    "Failed to delete comment."
            );
        }
    };

    const handleAddMistake = async () => {
        try {
            setAddingMistake(true);

            await createMistake({
                taskId,
                userId:
                    CURRENT_USER_ID,
            });

            const response =
                await getTaskMistakes(
                    taskId
                );

            setMistakes(
                Array.isArray(response)
                    ? response
                    : response?.mistakes ||
                          []
            );

            toast.success(
                "Mistake recorded."
            );
        } catch (error) {
            console.error(
                "Mistake error:",
                error
            );

            toast.error(
                error?.message ||
                    "Failed to record mistake."
            );
        } finally {
            setAddingMistake(false);
        }
    };

    const handleDeleteMistake = async (
        mistakeId
    ) => {
        if (!isManager) {
            toast.error(
                "Only a team manager can remove a mistake."
            );
            return;
        }

        try {
            await deleteMistake(
                mistakeId
            );

            setMistakes((prev) =>
                prev.filter(
                    (mistake) =>
                        mistake.id !==
                        mistakeId
                )
            );

            toast.success(
                "Mistake removed."
            );
        } catch (error) {
            console.error(
                "Delete mistake error:",
                error
            );

            toast.error(
                error?.message ||
                    "Failed to remove mistake."
            );
        }
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
                        Loading task...
                    </p>
                </div>
            </div>
        );
    }

    if (error || !task) {
        return (
            <div className="flex min-h-[70vh] items-center justify-center px-6">
                <div className="w-full max-w-md rounded-2xl border border-red-200 bg-white p-7 text-center shadow-sm">
                    <AlertCircle
                        size={32}
                        className="mx-auto text-red-500"
                    />

                    <h2 className="mt-4 text-lg font-semibold text-slate-900">
                        Task could not be loaded
                    </h2>

                    <p className="mt-2 text-sm text-slate-500">
                        {error ||
                            "Task not found."}
                    </p>

                    <button
                        onClick={() =>
                            navigate(
                                "/projects"
                            )
                        }
                        className="mt-5 rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-slate-800"
                    >
                        Back to Projects
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6 pb-8">
            {/* Header */}
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="flex items-start gap-3">
                    <button
                        onClick={() =>
                            navigate(
                                `/projectsDetail?projectId=${task.projectId}`
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
                                {task.title}
                            </h1>

                            <span
                                className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold ${getStatusClasses(
                                    task.status
                                )}`}
                            >
                                {formatStatus(
                                    task.status
                                )}
                            </span>
                        </div>

                        <p className="mt-2 text-sm text-slate-500">
                            {task.project
                                ?.name ||
                                "Project task"}
                        </p>
                    </div>
                </div>

                <button
                    onClick={() =>
                        fetchData(true)
                    }
                    disabled={refreshing}
                    className="inline-flex w-fit items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-60"
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

            {/* Main */}
            <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
                <div className="space-y-6 xl:col-span-2">
                    {/* Description */}
                    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                        <h2 className="text-base font-semibold text-slate-900">
                            Task Description
                        </h2>

                        <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-slate-600">
                            {task.description ||
                                "No description provided."}
                        </p>
                    </div>

                    {/* Status */}
                    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                        <h2 className="text-base font-semibold text-slate-900">
                            Update Status
                        </h2>

                        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
                            {[
                                "TODO",
                                "IN_PROGRESS",
                                "DONE",
                            ].map(
                                (status) => (
                                    <button
                                        key={
                                            status
                                        }
                                        onClick={() =>
                                            handleStatusChange(
                                                status
                                            )
                                        }
                                        disabled={
                                            updatingStatus
                                        }
                                        className={`rounded-xl border p-4 text-left transition ${
                                            task.status ===
                                            status
                                                ? "border-slate-900 bg-slate-50 ring-1 ring-slate-900"
                                                : "border-slate-200 hover:bg-slate-50"
                                        }`}
                                    >
                                        <div className="flex items-center gap-2">
                                            {status ===
                                                "DONE" && (
                                                <CheckCircle2
                                                    size={
                                                        17
                                                    }
                                                    className="text-emerald-600"
                                                />
                                            )}

                                            {status ===
                                                "IN_PROGRESS" && (
                                                <Clock3
                                                    size={
                                                        17
                                                    }
                                                    className="text-blue-600"
                                                />
                                            )}

                                            {status ===
                                                "TODO" && (
                                                <AlertCircle
                                                    size={
                                                        17
                                                    }
                                                    className="text-slate-500"
                                                />
                                            )}

                                            <span className="text-sm font-medium text-slate-800">
                                                {formatStatus(
                                                    status
                                                )}
                                            </span>
                                        </div>
                                    </button>
                                )
                            )}
                        </div>
                    </div>

                    {/* Comments */}
                    <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
                        <div className="border-b border-slate-200 p-6">
                            <div className="flex items-center gap-2">
                                <MessageSquare
                                    size={19}
                                    className="text-slate-600"
                                />

                                <h2 className="text-base font-semibold text-slate-900">
                                    Comments
                                </h2>
                            </div>
                        </div>

                        <div className="p-6">
                            <form
                                onSubmit={
                                    handleAddComment
                                }
                                className="flex gap-3"
                            >
                                <textarea
                                    value={
                                        commentText
                                    }
                                    onChange={(
                                        event
                                    ) =>
                                        setCommentText(
                                            event
                                                .target
                                                .value
                                        )
                                    }
                                    rows={2}
                                    placeholder="Write a comment..."
                                    className="min-w-0 flex-1 resize-none rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-slate-400"
                                />

                                <button
                                    type="submit"
                                    disabled={
                                        sendingComment ||
                                        !commentText.trim()
                                    }
                                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-900 text-white hover:bg-slate-800 disabled:opacity-50"
                                >
                                    {sendingComment ? (
                                        <Loader2
                                            size={
                                                16
                                            }
                                            className="animate-spin"
                                        />
                                    ) : (
                                        <Send
                                            size={
                                                16
                                            }
                                        />
                                    )}
                                </button>
                            </form>

                            <div className="mt-6 space-y-4">
                                {comments.length ===
                                0 ? (
                                    <p className="py-5 text-center text-sm text-slate-500">
                                        No comments yet.
                                    </p>
                                ) : (
                                    comments.map(
                                        (
                                            comment
                                        ) => (
                                            <div
                                                key={
                                                    comment.id
                                                }
                                                className="rounded-xl bg-slate-50 p-4"
                                            >
                                                <div className="flex items-start justify-between gap-3">
                                                    <div>
                                                        <p className="text-sm font-semibold text-slate-800">
                                                            {comment
                                                                .user
                                                                ?.name ||
                                                                comment.userId}
                                                        </p>

                                                        <p className="mt-0.5 text-[11px] text-slate-400">
                                                            {formatDateTime(
                                                                comment.createdAt
                                                            )}
                                                        </p>
                                                    </div>

                                                    <button
                                                        onClick={() =>
                                                            handleDeleteComment(
                                                                comment.id
                                                            )
                                                        }
                                                        className="text-slate-400 hover:text-red-600"
                                                    >
                                                        <Trash2
                                                            size={
                                                                15
                                                            }
                                                        />
                                                    </button>
                                                </div>

                                                <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-slate-600">
                                                    {
                                                        comment.content
                                                    }
                                                </p>
                                            </div>
                                        )
                                    )
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Sidebar */}
                <div className="space-y-6">
                    {/* Task Info */}
                    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                        <h2 className="text-base font-semibold text-slate-900">
                            Task Information
                        </h2>

                        <div className="mt-5 space-y-4">
                            <div className="flex gap-3">
                                <CalendarDays
                                    size={17}
                                    className="mt-0.5 text-slate-400"
                                />

                                <div>
                                    <p className="text-xs text-slate-500">
                                        Due Date
                                    </p>

                                    <p className="mt-1 text-sm font-medium text-slate-800">
                                        {formatDate(
                                            task.due_date
                                        )}
                                    </p>
                                </div>
                            </div>

                            <div className="flex gap-3">
                                <UserRound
                                    size={17}
                                    className="mt-0.5 text-slate-400"
                                />

                                <div>
                                    <p className="text-xs text-slate-500">
                                        Assignee
                                    </p>

                                    <p className="mt-1 text-sm font-medium text-slate-800">
                                        {task.assignee
                                            ?.name ||
                                            task.assigneeId}
                                    </p>
                                </div>
                            </div>

                            <div className="flex gap-3">
                                <Users
                                    size={17}
                                    className="mt-0.5 text-slate-400"
                                />

                                <div>
                                    <p className="text-xs text-slate-500">
                                        Team
                                    </p>

                                    <p className="mt-1 text-sm font-medium text-slate-800">
                                        {task.team
                                            ?.name ||
                                            "No team"}
                                    </p>
                                </div>
                            </div>

                            <div>
                                <p className="text-xs text-slate-500">
                                    Type
                                </p>

                                <p className="mt-1 text-sm font-medium text-slate-800">
                                    {formatStatus(
                                        task.type
                                    )}
                                </p>
                            </div>

                            <div>
                                <p className="text-xs text-slate-500">
                                    Priority
                                </p>

                                <p className="mt-1 text-sm font-medium text-slate-800">
                                    {formatStatus(
                                        task.priority
                                    )}
                                </p>
                            </div>

                            {task.estimatedHours !==
                                null &&
                                task.estimatedHours !==
                                    undefined && (
                                    <div>
                                        <p className="text-xs text-slate-500">
                                            Estimated Hours
                                        </p>

                                        <p className="mt-1 text-sm font-medium text-slate-800">
                                            {
                                                task.estimatedHours
                                            }{" "}
                                            hours
                                        </p>
                                    </div>
                                )}
                        </div>
                    </div>

                    {/* Timing */}
                    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                        <h2 className="text-base font-semibold text-slate-900">
                            Timeline
                        </h2>

                        <div className="mt-5 space-y-5">
                            <div className="flex gap-3">
                                <div className="mt-1 h-2.5 w-2.5 rounded-full bg-slate-400" />

                                <div>
                                    <p className="text-xs text-slate-500">
                                        Created
                                    </p>

                                    <p className="mt-1 text-sm text-slate-700">
                                        {formatDateTime(
                                            task.createdAt
                                        )}
                                    </p>
                                </div>
                            </div>

                            {task.startedAt && (
                                <div className="flex gap-3">
                                    <div className="mt-1 h-2.5 w-2.5 rounded-full bg-blue-500" />

                                    <div>
                                        <p className="text-xs text-slate-500">
                                            Started
                                        </p>

                                        <p className="mt-1 text-sm text-slate-700">
                                            {formatDateTime(
                                                task.startedAt
                                            )}
                                        </p>
                                    </div>
                                </div>
                            )}

                            {task.completedAt && (
                                <div className="flex gap-3">
                                    <div className="mt-1 h-2.5 w-2.5 rounded-full bg-emerald-500" />

                                    <div>
                                        <p className="text-xs text-slate-500">
                                            Completed
                                        </p>

                                        <p className="mt-1 text-sm text-slate-700">
                                            {formatDateTime(
                                                task.completedAt
                                            )}
                                        </p>
                                    </div>
                                </div>
                            )}

                            <div
                                className={`rounded-xl p-3 ${
                                    isLate
                                        ? "bg-red-50"
                                        : "bg-slate-50"
                                }`}
                            >
                                <p
                                    className={`text-xs font-medium ${
                                        isLate
                                            ? "text-red-700"
                                            : "text-slate-600"
                                    }`}
                                >
                                    {isLate
                                        ? completedLate
                                            ? "Completed late"
                                            : "Task is overdue"
                                        : isOnTime
                                        ? "Completed on time"
                                        : "Within deadline"}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Mistakes */}
                    <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
                        <div className="border-b border-slate-200 p-6">
                            <div className="flex items-center justify-between gap-3">
                                <div>
                                    <div className="flex items-center gap-2">
                                        <AlertTriangle
                                            size={
                                                18
                                            }
                                            className="text-amber-600"
                                        />

                                        <h2 className="text-base font-semibold text-slate-900">
                                            Mistakes
                                        </h2>
                                    </div>

                                    <p className="mt-1 text-xs text-slate-500">
                                        {mistakes.length}{" "}
                                        recorded
                                    </p>
                                </div>

                                <button
                                    onClick={
                                        handleAddMistake
                                    }
                                    disabled={
                                        addingMistake
                                    }
                                    className="inline-flex items-center gap-1.5 rounded-lg bg-slate-900 px-3 py-2 text-xs font-medium text-white hover:bg-slate-800 disabled:opacity-60"
                                >
                                    {addingMistake ? (
                                        <Loader2
                                            size={
                                                13
                                            }
                                            className="animate-spin"
                                        />
                                    ) : (
                                        "Add"
                                    )}
                                </button>
                            </div>
                        </div>

                        <div className="p-6">
                            {mistakes.length ===
                            0 ? (
                                <p className="text-center text-sm text-slate-500">
                                    No mistakes recorded.
                                </p>
                            ) : (
                                <div className="space-y-3">
                                    {mistakes.map(
                                        (
                                            mistake
                                        ) => (
                                            <div
                                                key={
                                                    mistake.id
                                                }
                                                className="flex items-center justify-between gap-3 rounded-xl bg-slate-50 p-3"
                                            >
                                                <div>
                                                    <p className="text-xs font-medium text-slate-700">
                                                        {mistake
                                                            .user
                                                            ?.name ||
                                                            mistake.userId}
                                                    </p>

                                                    <p className="mt-1 text-[10px] text-slate-400">
                                                        {formatDateTime(
                                                            mistake.createdAt
                                                        )}
                                                    </p>
                                                </div>

                                                {isManager && (
                                                    <button
                                                        onClick={() =>
                                                            handleDeleteMistake(
                                                                mistake.id
                                                            )
                                                        }
                                                        className="text-slate-400 hover:text-red-600"
                                                        title="Remove mistake"
                                                    >
                                                        <Trash2
                                                            size={
                                                                15
                                                            }
                                                        />
                                                    </button>
                                                )}
                                            </div>
                                        )
                                    )}
                                </div>
                            )}

                            {isManager && (
                                <p className="mt-4 text-[11px] text-slate-400">
                                    You are a team manager and
                                    can remove incorrect mistake
                                    records.
                                </p>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TaskDetails;