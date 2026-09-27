import { useEffect, useState } from "react";
import {
    X,
    Loader2,
    LockKeyhole,
    Users,
    CheckCircle2,
    ArrowRight,
    ArrowLeft,
} from "lucide-react";
import toast from "react-hot-toast";

import {
    getProjectById,
    verifyProjectPassword,
    joinProject,
} from "../lib/api";

const JoinProjectDialog = ({
    project: initialProject,
    userId = "test-user-1",
    onClose,
    onProjectJoined,
}) => {
    const [project, setProject] =
        useState(initialProject);

    const [step, setStep] = useState(1);

    const [password, setPassword] =
        useState("");

    const [selectedTeamId, setSelectedTeamId] =
        useState("");

    const [loadingProject, setLoadingProject] =
        useState(false);

    const [verifying, setVerifying] =
        useState(false);

    const [joining, setJoining] =
        useState(false);

    const [passwordVerified, setPasswordVerified] =
        useState(false);

    useEffect(() => {
        if (!initialProject?.id) return;

        /*
         * The project list may not contain complete team
         * information, so fetch the full project before
         * displaying the team selection step.
         */
        const loadProject = async () => {
            try {
                setLoadingProject(true);

                const response =
                    await getProjectById(
                        initialProject.id
                    );

                const loadedProject =
                    response?.project ||
                    response;

                if (loadedProject?.id) {
                    setProject(
                        loadedProject
                    );
                }
            } catch (error) {
                console.error(
                    "Failed to load project:",
                    error
                );

                /*
                 * Keep the project received from the
                 * Projects page as a fallback.
                 */
            } finally {
                setLoadingProject(false);
            }
        };

        loadProject();
    }, [initialProject?.id]);

    const teams = Array.isArray(
        project?.teams
    )
        ? project.teams
        : [];

    const handleVerifyPassword = async (
        event
    ) => {
        event.preventDefault();

        if (!password.trim()) {
            toast.error(
                "Enter the project password."
            );
            return;
        }

        if (!project?.id) {
            toast.error(
                "Project information is missing."
            );
            return;
        }

        try {
            setVerifying(true);

            await verifyProjectPassword(
                project.id,
                {
                    password:
                        password.trim(),
                }
            );

            setPasswordVerified(true);

            /*
             * If there is only one team, select it
             * automatically.
             */
            if (
                teams.length === 1 &&
                teams[0]?.team?.id
            ) {
                setSelectedTeamId(
                    teams[0].team.id
                );
            } else if (
                teams.length === 1 &&
                teams[0]?.id
            ) {
                setSelectedTeamId(
                    teams[0].id
                );
            }

            setStep(2);

            toast.success(
                "Password verified."
            );
        } catch (error) {
            console.error(
                "Password verification error:",
                error
            );

            toast.error(
                error?.message ||
                    "Incorrect project password."
            );
        } finally {
            setVerifying(false);
        }
    };

    const getTeam = (item) => {
        return item?.team || item;
    };

    const handleJoinProject = async (
        event
    ) => {
        event.preventDefault();

        if (!selectedTeamId) {
            toast.error(
                "Select a team before joining."
            );
            return;
        }

        if (!passwordVerified) {
            toast.error(
                "Verify the project password first."
            );
            return;
        }

        if (!project?.id) {
            toast.error(
                "Project information is missing."
            );
            return;
        }

        try {
            setJoining(true);

            await joinProject(
                project.id,
                {
                    userId,
                    password:
                        password.trim(),
                    teamId:
                        selectedTeamId,
                }
            );

            toast.success(
                "You joined the project successfully."
            );

            onProjectJoined?.();
        } catch (error) {
            console.error(
                "Join project error:",
                error
            );

            toast.error(
                error?.message ||
                    "Failed to join project."
            );
        } finally {
            setJoining(false);
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
            <div className="w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl">
                {/* Header */}
                <div className="flex items-start justify-between border-b border-slate-200 px-6 py-5">
                    <div className="min-w-0">
                        <div className="flex items-center gap-2">
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-900 text-white">
                                {step === 1 ? (
                                    <LockKeyhole
                                        size={17}
                                    />
                                ) : (
                                    <Users
                                        size={17}
                                    />
                                )}
                            </div>

                            <div className="min-w-0">
                                <h2 className="truncate text-lg font-semibold text-slate-900">
                                    Join Project
                                </h2>

                                <p className="truncate text-xs text-slate-500">
                                    {project?.name ||
                                        "Project"}
                                </p>
                            </div>
                        </div>
                    </div>

                    <button
                        type="button"
                        onClick={onClose}
                        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                    >
                        <X size={18} />
                    </button>
                </div>

                {/* Step indicator */}
                <div className="border-b border-slate-100 px-6 py-4">
                    <div className="flex items-center">
                        <div className="flex items-center gap-2">
                            <div
                                className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold ${
                                    step >= 1
                                        ? "bg-slate-900 text-white"
                                        : "bg-slate-100 text-slate-500"
                                }`}
                            >
                                {passwordVerified ? (
                                    <CheckCircle2
                                        size={15}
                                    />
                                ) : (
                                    "1"
                                )}
                            </div>

                            <span
                                className={`text-xs font-medium ${
                                    step >= 1
                                        ? "text-slate-900"
                                        : "text-slate-400"
                                }`}
                            >
                                Password
                            </span>
                        </div>

                        <div className="mx-3 h-px flex-1 bg-slate-200" />

                        <div className="flex items-center gap-2">
                            <div
                                className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold ${
                                    step >= 2
                                        ? "bg-slate-900 text-white"
                                        : "bg-slate-100 text-slate-500"
                                }`}
                            >
                                2
                            </div>

                            <span
                                className={`text-xs font-medium ${
                                    step >= 2
                                        ? "text-slate-900"
                                        : "text-slate-400"
                                }`}
                            >
                                Select Team
                            </span>
                        </div>
                    </div>
                </div>

                {/* Body */}
                <div className="px-6 py-6">
                    {loadingProject ? (
                        <div className="flex flex-col items-center justify-center py-12">
                            <Loader2
                                size={28}
                                className="animate-spin text-slate-500"
                            />

                            <p className="mt-3 text-sm text-slate-500">
                                Loading project details...
                            </p>
                        </div>
                    ) : step === 1 ? (
                        <form
                            onSubmit={
                                handleVerifyPassword
                            }
                        >
                            <div>
                                <h3 className="text-base font-semibold text-slate-900">
                                    Enter project password
                                </h3>

                                <p className="mt-1.5 text-sm leading-6 text-slate-500">
                                    This project is protected.
                                    Enter the password provided
                                    by the project creator to
                                    continue.
                                </p>
                            </div>

                            <div className="mt-6">
                                <label className="mb-1.5 block text-sm font-medium text-slate-700">
                                    Project Password
                                </label>

                                <div className="relative">
                                    <LockKeyhole
                                        size={17}
                                        className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                                    />

                                    <input
                                        type="password"
                                        value={password}
                                        onChange={(
                                            event
                                        ) =>
                                            setPassword(
                                                event
                                                    .target
                                                    .value
                                            )
                                        }
                                        placeholder="Enter password"
                                        autoFocus
                                        className="w-full rounded-lg border border-slate-200 py-2.5 pl-10 pr-3 text-sm outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
                                    />
                                </div>
                            </div>

                            <div className="mt-5 rounded-xl bg-slate-50 p-4">
                                <div className="flex gap-3">
                                    <LockKeyhole
                                        size={17}
                                        className="mt-0.5 shrink-0 text-slate-500"
                                    />

                                    <p className="text-xs leading-5 text-slate-500">
                                        Your password is verified
                                        by the ProjectPulse
                                        backend. The project
                                        password itself is not
                                        displayed to other
                                        employees.
                                    </p>
                                </div>
                            </div>

                            <div className="mt-6 flex justify-end gap-3">
                                <button
                                    type="button"
                                    onClick={
                                        onClose
                                    }
                                    className="rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                                >
                                    Cancel
                                </button>

                                <button
                                    type="submit"
                                    disabled={
                                        verifying ||
                                        !password.trim()
                                    }
                                    className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                    {verifying ? (
                                        <>
                                            <Loader2
                                                size={
                                                    16
                                                }
                                                className="animate-spin"
                                            />
                                            Verifying...
                                        </>
                                    ) : (
                                        <>
                                            Continue
                                            <ArrowRight
                                                size={
                                                    16
                                                }
                                            />
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    ) : (
                        <form
                            onSubmit={
                                handleJoinProject
                            }
                        >
                            <div>
                                <h3 className="text-base font-semibold text-slate-900">
                                    Choose your team
                                </h3>

                                <p className="mt-1.5 text-sm leading-6 text-slate-500">
                                    Select the team you will
                                    belong to for this project.
                                    You can belong to only one
                                    team.
                                </p>
                            </div>

                            {teams.length ===
                            0 ? (
                                <div className="mt-6 rounded-xl border border-dashed border-slate-200 p-8 text-center">
                                    <Users
                                        size={30}
                                        className="mx-auto text-slate-300"
                                    />

                                    <p className="mt-3 text-sm font-medium text-slate-700">
                                        No teams are assigned
                                        to this project.
                                    </p>

                                    <p className="mt-1 text-xs text-slate-500">
                                        Ask the project creator
                                        to assign a team before
                                        joining.
                                    </p>
                                </div>
                            ) : (
                                <div className="mt-6 space-y-3">
                                    {teams.map(
                                        (item) => {
                                            const team =
                                                getTeam(
                                                    item
                                                );

                                            if (
                                                !team?.id
                                            ) {
                                                return null;
                                            }

                                            const selected =
                                                selectedTeamId ===
                                                team.id;

                                            const memberCount =
                                                Array.isArray(
                                                    team.members
                                                )
                                                    ? team
                                                          .members
                                                          .length
                                                    : 0;

                                            return (
                                                <button
                                                    type="button"
                                                    key={
                                                        item.id ||
                                                        team.id
                                                    }
                                                    onClick={() =>
                                                        setSelectedTeamId(
                                                            team.id
                                                        )
                                                    }
                                                    className={`w-full rounded-xl border p-4 text-left transition ${
                                                        selected
                                                            ? "border-slate-900 bg-slate-50 ring-1 ring-slate-900"
                                                            : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50"
                                                    }`}
                                                >
                                                    <div className="flex items-start gap-3">
                                                        <div
                                                            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                                                                selected
                                                                    ? "bg-slate-900 text-white"
                                                                    : "bg-slate-100 text-slate-600"
                                                            }`}
                                                        >
                                                            <Users
                                                                size={
                                                                    18
                                                                }
                                                            />
                                                        </div>

                                                        <div className="min-w-0 flex-1">
                                                            <div className="flex items-center justify-between gap-3">
                                                                <h4 className="text-sm font-semibold text-slate-900">
                                                                    {
                                                                        team.name
                                                                    }
                                                                </h4>

                                                                <div
                                                                    className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border ${
                                                                        selected
                                                                            ? "border-slate-900 bg-slate-900 text-white"
                                                                            : "border-slate-300 bg-white"
                                                                    }`}
                                                                >
                                                                    {selected && (
                                                                        <svg
                                                                            viewBox="0 0 20 20"
                                                                            fill="none"
                                                                            className="h-3 w-3"
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
                                                            </div>

                                                            <p className="mt-1 text-xs leading-5 text-slate-500">
                                                                {team.description ||
                                                                    "No team description available."}
                                                            </p>

                                                            {memberCount >
                                                                0 && (
                                                                <p className="mt-2 text-[11px] font-medium text-slate-400">
                                                                    {
                                                                        memberCount
                                                                    }{" "}
                                                                    team{" "}
                                                                    {memberCount ===
                                                                    1
                                                                        ? "member"
                                                                        : "members"}
                                                                </p>
                                                            )}
                                                        </div>
                                                    </div>
                                                </button>
                                            );
                                        }
                                    )}
                                </div>
                            )}

                            <div className="mt-6 flex justify-between gap-3">
                                <button
                                    type="button"
                                    onClick={() =>
                                        setStep(
                                            1
                                        )
                                    }
                                    className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                                >
                                    <ArrowLeft
                                        size={16}
                                    />
                                    Back
                                </button>

                                <button
                                    type="submit"
                                    disabled={
                                        joining ||
                                        !selectedTeamId ||
                                        teams.length ===
                                            0
                                    }
                                    className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                    {joining ? (
                                        <>
                                            <Loader2
                                                size={
                                                    16
                                                }
                                                className="animate-spin"
                                            />
                                            Joining...
                                        </>
                                    ) : (
                                        <>
                                            Join Project
                                            <ArrowRight
                                                size={
                                                    16
                                                }
                                            />
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
};

export default JoinProjectDialog;