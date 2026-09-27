import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
    ArrowRight,
    CheckCircle2,
    KeyRound,
    Loader2,
    LockKeyhole,
    Users,
    AlertCircle,
} from "lucide-react";
import toast from "react-hot-toast";

import {
    getWorkspaceById,
    joinWorkspace,
} from "../lib/api";

const CURRENT_USER_ID =
    "test-user-1";

const WorkspaceAccess = () => {
    const navigate = useNavigate();

    const [searchParams] =
        useSearchParams();

    const workspaceId =
        searchParams.get(
            "workspaceId"
        );

    const [workspace, setWorkspace] =
        useState(null);

    const [password, setPassword] =
        useState("");

    const [loading, setLoading] =
        useState(true);

    const [joining, setJoining] =
        useState(false);

    const [alreadyMember, setAlreadyMember] =
        useState(false);

    const [error, setError] =
        useState("");

    useEffect(() => {
        loadWorkspace();
    }, [workspaceId]);

    const loadWorkspace = async () => {
        if (!workspaceId) {
            setError(
                "Workspace ID is missing."
            );
            setLoading(false);
            return;
        }

        try {
            setLoading(true);
            setError("");

            const response =
                await getWorkspaceById(
                    workspaceId
                );

            const loadedWorkspace =
                response?.workspace ||
                response;

            setWorkspace(
                loadedWorkspace
            );

            const members =
                loadedWorkspace?.members ||
                [];

            const memberExists =
                members.some(
                    (member) =>
                        member.userId ===
                            CURRENT_USER_ID ||
                        member.user?.id ===
                            CURRENT_USER_ID
                );

            setAlreadyMember(
                memberExists
            );
        } catch (err) {
            console.error(
                "Workspace access error:",
                err
            );

            setError(
                err?.message ||
                    "Unable to load workspace."
            );
        } finally {
            setLoading(false);
        }
    };

    const handleJoin = async (
        event
    ) => {
        event.preventDefault();

        if (!workspaceId) {
            toast.error(
                "Workspace ID is missing."
            );
            return;
        }

        try {
            setJoining(true);

            await joinWorkspace(
                workspaceId,
                {
                    userId:
                        CURRENT_USER_ID,
                    password:
                        password.trim(),
                }
            );

            toast.success(
                "You joined the workspace successfully."
            );

            navigate("/");
        } catch (error) {
            console.error(
                "Join workspace error:",
                error
            );

            toast.error(
                error?.message ||
                    "Failed to join workspace."
            );
        } finally {
            setJoining(false);
        }
    };

    if (loading) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-slate-50">
                <div className="flex flex-col items-center gap-3">
                    <Loader2
                        size={30}
                        className="animate-spin text-slate-700"
                    />

                    <p className="text-sm text-slate-500">
                        Loading workspace...
                    </p>
                </div>
            </div>
        );
    }

    if (error || !workspace) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-slate-50 px-6">
                <div className="w-full max-w-md rounded-2xl border border-red-200 bg-white p-8 text-center shadow-sm">
                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-50 text-red-600">
                        <AlertCircle
                            size={24}
                        />
                    </div>

                    <h1 className="mt-4 text-lg font-semibold text-slate-900">
                        Workspace unavailable
                    </h1>

                    <p className="mt-2 text-sm text-slate-500">
                        {error ||
                            "The requested workspace could not be found."}
                    </p>

                    <button
                        onClick={() =>
                            navigate("/")
                        }
                        className="mt-6 rounded-lg bg-slate-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-slate-800"
                    >
                        Go to Dashboard
                    </button>
                </div>
            </div>
        );
    }

    if (alreadyMember) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-slate-50 px-6">
                <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
                    <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
                        <CheckCircle2
                            size={28}
                        />
                    </div>

                    <h1 className="mt-5 text-xl font-semibold text-slate-900">
                        You already have access
                    </h1>

                    <p className="mt-2 text-sm leading-6 text-slate-500">
                        You are already a member of{" "}
                        <span className="font-medium text-slate-700">
                            {workspace.name}
                        </span>
                        .
                    </p>

                    <button
                        onClick={() =>
                            navigate("/")
                        }
                        className="mt-6 inline-flex items-center gap-2 rounded-lg bg-slate-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-slate-800"
                    >
                        Open Dashboard
                        <ArrowRight
                            size={16}
                        />
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-10">
            <div className="w-full max-w-md">
                {/* Brand */}
                <div className="mb-6 text-center">
                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-900 text-white">
                        <KeyRound
                            size={23}
                        />
                    </div>

                    <h1 className="mt-4 text-2xl font-bold tracking-tight text-slate-900">
                        Workspace Access
                    </h1>

                    <p className="mt-1 text-sm text-slate-500">
                        Join your ProjectPulse workspace
                    </p>
                </div>

                {/* Card */}
                <div className="rounded-2xl border border-slate-200 bg-white p-7 shadow-sm">
                    <div className="rounded-xl bg-slate-50 p-4">
                        <div className="flex items-start gap-3">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-slate-600 shadow-sm">
                                <Users
                                    size={18}
                                />
                            </div>

                            <div className="min-w-0">
                                <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                                    Workspace
                                </p>

                                <h2 className="mt-1 truncate text-base font-semibold text-slate-900">
                                    {
                                        workspace.name
                                    }
                                </h2>

                                {workspace.description && (
                                    <p className="mt-1 text-xs leading-5 text-slate-500">
                                        {
                                            workspace.description
                                        }
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>

                    <form
                        onSubmit={
                            handleJoin
                        }
                        className="mt-6"
                    >
                        <label className="mb-1.5 flex items-center gap-1.5 text-sm font-medium text-slate-700">
                            <LockKeyhole
                                size={15}
                            />
                            Workspace Password
                        </label>

                        <div className="relative">
                            <KeyRound
                                size={17}
                                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                            />

                            <input
                                type="password"
                                value={
                                    password
                                }
                                onChange={(
                                    event
                                ) =>
                                    setPassword(
                                        event
                                            .target
                                            .value
                                    )
                                }
                                placeholder="Enter workspace password"
                                autoFocus
                                className="w-full rounded-lg border border-slate-200 py-2.5 pl-10 pr-3 text-sm outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
                            />
                        </div>

                        <p className="mt-2 text-xs leading-5 text-slate-400">
                            Enter the password provided by the
                            workspace administrator.
                        </p>

                        <button
                            type="submit"
                            disabled={
                                joining ||
                                !password.trim()
                            }
                            className="mt-6 flex w-full items-center justify-center gap-2 rounded-lg bg-slate-900 px-5 py-3 text-sm font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            {joining ? (
                                <>
                                    <Loader2
                                        size={
                                            17
                                        }
                                        className="animate-spin"
                                    />
                                    Joining Workspace...
                                </>
                            ) : (
                                <>
                                    Join Workspace
                                    <ArrowRight
                                        size={
                                            17
                                        }
                                    />
                                </>
                            )}
                        </button>
                    </form>

                    <div className="mt-6 border-t border-slate-100 pt-5 text-center">
                        <button
                            onClick={() =>
                                navigate(
                                    "/"
                                )
                            }
                            className="text-xs font-medium text-slate-500 hover:text-slate-800"
                        >
                            Return to Dashboard
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default WorkspaceAccess;