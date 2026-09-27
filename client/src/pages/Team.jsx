import { useEffect, useMemo, useState } from "react";
import {
    Plus,
    Users,
    UserPlus,
    ShieldCheck,
    Trash2,
    FolderKanban,
    Crown,
    Loader2,
    RefreshCw,
} from "lucide-react";
import toast from "react-hot-toast";

import {
    getTeams,
    createTeam,
    addTeamMember,
    updateTeamMemberRole,
    removeTeamMember,
    getWorkspaceMembers,
} from "../lib/api";

const WORKSPACE_ID =
    "35f833fa-8818-43a2-ab1b-d78b1fe82b6c";

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

const Team = () => {
    const [teams, setTeams] = useState([]);
    const [workspaceMembers, setWorkspaceMembers] = useState([]);

    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const [showCreateTeam, setShowCreateTeam] =
        useState(false);
    const [showAddMember, setShowAddMember] =
        useState(false);

    const [selectedTeam, setSelectedTeam] =
        useState(null);

    const [teamName, setTeamName] = useState("");
    const [teamDescription, setTeamDescription] =
        useState("");

    const [selectedUser, setSelectedUser] =
        useState("");

    const [creatingTeam, setCreatingTeam] =
        useState(false);
    const [addingMember, setAddingMember] =
        useState(false);

    const fetchData = async (isRefresh = false) => {
        try {
            if (isRefresh) {
                setRefreshing(true);
            } else {
                setLoading(true);
            }

            const [teamsData, membersData] =
                await Promise.all([
                    getTeams(WORKSPACE_ID),
                    getWorkspaceMembers(WORKSPACE_ID),
                ]);

            let loadedTeams = Array.isArray(teamsData)
                ? teamsData
                : teamsData?.teams || [];

            const loadedMembers = Array.isArray(
                membersData
            )
                ? membersData
                : membersData?.members || [];

            /*
             * Make sure the four standard teams exist.
             * Existing teams are never duplicated.
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
                        const created =
                            await createTeam({
                                name: defaultTeam.name,
                                description:
                                    defaultTeam.description,
                                workspaceId:
                                    WORKSPACE_ID,
                            });

                        if (created) {
                            loadedTeams = [
                                ...loadedTeams,
                                created.team ||
                                    created,
                            ];
                        }
                    } catch (error) {
                        console.error(
                            `Could not create ${defaultTeam.name}:`,
                            error
                        );
                    }
                }
            }

            setTeams(loadedTeams);
            setWorkspaceMembers(loadedMembers);
        } catch (error) {
            console.error(
                "Failed to load teams:",
                error
            );

            toast.error(
                error?.message ||
                    "Failed to load team data."
            );
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const assignedUserIds = useMemo(() => {
        const ids = new Set();

        teams.forEach((team) => {
            (team.members || []).forEach((member) => {
                if (member.userId) {
                    ids.add(member.userId);
                }
            });
        });

        return ids;
    }, [teams]);

    const availableMembers = useMemo(() => {
        return workspaceMembers.filter((member) => {
            const userId =
                member.userId ||
                member.user?.id;

            return (
                userId &&
                !assignedUserIds.has(userId)
            );
        });
    }, [
        workspaceMembers,
        assignedUserIds,
    ]);

    const totalMembers = useMemo(() => {
        return teams.reduce(
            (total, team) =>
                total + (team.members?.length || 0),
            0
        );
    }, [teams]);

    const managerCount = useMemo(() => {
        return teams.reduce((total, team) => {
            const managers =
                team.members?.filter(
                    (member) =>
                        member.role === "MANAGER"
                ) || [];

            return total + managers.length;
        }, 0);
    }, [teams]);

    const openAddMember = (team) => {
        setSelectedTeam(team);
        setSelectedUser("");
        setShowAddMember(true);
    };

    const handleCreateTeam = async (event) => {
        event.preventDefault();

        if (!teamName.trim()) {
            toast.error("Team name is required.");
            return;
        }

        try {
            setCreatingTeam(true);

            const response = await createTeam({
                name: teamName.trim(),
                description:
                    teamDescription.trim(),
                workspaceId: WORKSPACE_ID,
            });

            const newTeam =
                response?.team || response;

            if (newTeam) {
                setTeams((prev) => [
                    ...prev,
                    newTeam,
                ]);
            }

            toast.success(
                "Team created successfully."
            );

            setTeamName("");
            setTeamDescription("");
            setShowCreateTeam(false);
        } catch (error) {
            console.error(
                "Create team error:",
                error
            );

            toast.error(
                error?.message ||
                    "Failed to create team."
            );
        } finally {
            setCreatingTeam(false);
        }
    };

    const handleAddMember = async (event) => {
        event.preventDefault();

        if (!selectedTeam?.id) {
            toast.error("Please select a team.");
            return;
        }

        if (!selectedUser) {
            toast.error("Please select an employee.");
            return;
        }

        try {
            setAddingMember(true);

            await addTeamMember(
                selectedTeam.id,
                {
                    userId: selectedUser,
                    role: "MEMBER",
                }
            );

            toast.success(
                "Employee added to the team."
            );

            setShowAddMember(false);
            setSelectedUser("");

            await fetchData(true);
        } catch (error) {
            console.error(
                "Add member error:",
                error
            );

            toast.error(
                error?.message ||
                    "Failed to add employee."
            );
        } finally {
            setAddingMember(false);
        }
    };

    const handleRoleChange = async (
        teamMemberId,
        role
    ) => {
        try {
            await updateTeamMemberRole(
                teamMemberId,
                role
            );

            toast.success(
                `Member role changed to ${role.toLowerCase()}.`
            );

            await fetchData(true);
        } catch (error) {
            console.error(
                "Role update error:",
                error
            );

            toast.error(
                error?.message ||
                    "Failed to update member role."
            );
        }
    };

    const handleRemoveMember = async (
        teamMemberId
    ) => {
        try {
            await removeTeamMember(
                teamMemberId
            );

            toast.success(
                "Member removed from team."
            );

            await fetchData(true);
        } catch (error) {
            console.error(
                "Remove member error:",
                error
            );

            toast.error(
                error?.message ||
                    "Failed to remove member."
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
                        Loading teams...
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
                        Organization
                    </p>

                    <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900">
                        Teams
                    </h1>

                    <p className="mt-1 text-sm text-slate-500">
                        Manage employees, team managers and
                        project teams.
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
                            setShowCreateTeam(true)
                        }
                        className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-slate-800"
                    >
                        <Plus size={17} />
                        Create Team
                    </button>
                </div>
            </div>

            {/* Summary */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                            <Users size={20} />
                        </div>

                        <div>
                            <p className="text-xs font-medium text-slate-500">
                                Total Teams
                            </p>

                            <p className="mt-1 text-xl font-bold text-slate-900">
                                {teams.length}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                            <UserPlus size={20} />
                        </div>

                        <div>
                            <p className="text-xs font-medium text-slate-500">
                                Team Members
                            </p>

                            <p className="mt-1 text-xl font-bold text-slate-900">
                                {totalMembers}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-50 text-purple-600">
                            <ShieldCheck size={20} />
                        </div>

                        <div>
                            <p className="text-xs font-medium text-slate-500">
                                Team Managers
                            </p>

                            <p className="mt-1 text-xl font-bold text-slate-900">
                                {managerCount}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Teams */}
            <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
                {teams.map((team) => {
                    const members =
                        team.members || [];

                    const managers =
                        members.filter(
                            (member) =>
                                member.role ===
                                "MANAGER"
                        );

                    return (
                        <div
                            key={team.id}
                            className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
                        >
                            {/* Team Header */}
                            <div className="border-b border-slate-200 p-6">
                                <div className="flex items-start justify-between gap-4">
                                    <div className="flex min-w-0 items-start gap-4">
                                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-slate-900 text-white">
                                            <Users
                                                size={22}
                                            />
                                        </div>

                                        <div className="min-w-0">
                                            <h2 className="truncate text-base font-semibold text-slate-900">
                                                {team.name}
                                            </h2>

                                            <p className="mt-1 text-sm text-slate-500">
                                                {team.description ||
                                                    "No team description."}
                                            </p>
                                        </div>
                                    </div>

                                    <button
                                        onClick={() =>
                                            openAddMember(
                                                team
                                            )
                                        }
                                        className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 transition hover:bg-slate-50"
                                    >
                                        <UserPlus
                                            size={14}
                                        />
                                        Add
                                    </button>
                                </div>

                                <div className="mt-5 flex flex-wrap gap-2">
                                    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
                                        {members.length}{" "}
                                        {members.length ===
                                        1
                                            ? "member"
                                            : "members"}
                                    </span>

                                    <span className="rounded-full bg-purple-50 px-3 py-1 text-xs font-medium text-purple-700">
                                        {managers.length}{" "}
                                        {managers.length ===
                                        1
                                            ? "manager"
                                            : "managers"}
                                    </span>

                                    {team.projects?.length >
                                        0 && (
                                        <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700">
                                            <FolderKanban
                                                size={12}
                                            />
                                            {
                                                team.projects
                                                    .length
                                            }{" "}
                                            projects
                                        </span>
                                    )}
                                </div>
                            </div>

                            {/* Projects */}
                            {team.projects?.length >
                                0 && (
                                <div className="border-b border-slate-100 bg-slate-50 px-6 py-4">
                                    <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
                                        Assigned Projects
                                    </p>

                                    <div className="flex flex-wrap gap-2">
                                        {team.projects.map(
                                            (item) => {
                                                const project =
                                                    item.project ||
                                                    item;

                                                return (
                                                    <span
                                                        key={
                                                            item.id ||
                                                            project.id
                                                        }
                                                        className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600"
                                                    >
                                                        {
                                                            project.name
                                                        }
                                                    </span>
                                                );
                                            }
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Members */}
                            <div className="p-6">
                                <div className="mb-4 flex items-center justify-between">
                                    <h3 className="text-sm font-semibold text-slate-900">
                                        Team Members
                                    </h3>

                                    <span className="text-xs text-slate-400">
                                        {members.length}{" "}
                                        total
                                    </span>
                                </div>

                                {members.length ===
                                0 ? (
                                    <div className="rounded-xl border border-dashed border-slate-200 p-7 text-center">
                                        <Users
                                            size={25}
                                            className="mx-auto text-slate-300"
                                        />

                                        <p className="mt-2 text-sm font-medium text-slate-600">
                                            No members yet
                                        </p>

                                        <button
                                            onClick={() =>
                                                openAddMember(
                                                    team
                                                )
                                            }
                                            className="mt-3 text-xs font-medium text-blue-600 hover:text-blue-700"
                                        >
                                            Add the first
                                            member
                                        </button>
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        {members.map(
                                            (member) => {
                                                const user =
                                                    member.user ||
                                                    {};

                                                return (
                                                    <div
                                                        key={
                                                            member.id
                                                        }
                                                        className="flex items-center justify-between gap-3 rounded-xl border border-slate-100 bg-slate-50 p-3"
                                                    >
                                                        <div className="flex min-w-0 items-center gap-3">
                                                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white text-xs font-semibold text-slate-700 shadow-sm">
                                                                {(
                                                                    user.name ||
                                                                    "U"
                                                                )
                                                                    .charAt(
                                                                        0
                                                                    )
                                                                    .toUpperCase()}
                                                            </div>

                                                            <div className="min-w-0">
                                                                <p className="truncate text-sm font-medium text-slate-900">
                                                                    {user.name ||
                                                                        member.userId}
                                                                </p>

                                                                <p className="truncate text-xs text-slate-500">
                                                                    {user.email ||
                                                                        "No email"}
                                                                </p>
                                                            </div>
                                                        </div>

                                                        <div className="flex shrink-0 items-center gap-2">
                                                            <select
                                                                value={
                                                                    member.role
                                                                }
                                                                onChange={(
                                                                    event
                                                                ) =>
                                                                    handleRoleChange(
                                                                        member.id,
                                                                        event
                                                                            .target
                                                                            .value
                                                                    )
                                                                }
                                                                className="rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs font-medium text-slate-700 outline-none focus:border-slate-400"
                                                            >
                                                                <option value="MEMBER">
                                                                    Member
                                                                </option>

                                                                <option value="MANAGER">
                                                                    Manager
                                                                </option>
                                                            </select>

                                                            {member.role ===
                                                                "MANAGER" && (
                                                                <Crown
                                                                    size={
                                                                        15
                                                                    }
                                                                    className="text-amber-500"
                                                                />
                                                            )}

                                                            <button
                                                                onClick={() =>
                                                                    handleRemoveMember(
                                                                        member.id
                                                                    )
                                                                }
                                                                className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition hover:bg-red-50 hover:text-red-600"
                                                                title="Remove member"
                                                            >
                                                                <Trash2
                                                                    size={
                                                                        15
                                                                    }
                                                                />
                                                            </button>
                                                        </div>
                                                    </div>
                                                );
                                            }
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Create Team Modal */}
            {showCreateTeam && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4"
                    onMouseDown={(event) => {
                        if (
                            event.target ===
                            event.currentTarget
                        ) {
                            setShowCreateTeam(false);
                        }
                    }}
                >
                    <form
                        onSubmit={
                            handleCreateTeam
                        }
                        className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl"
                    >
                        <div className="flex items-start justify-between gap-4">
                            <div>
                                <h2 className="text-lg font-semibold text-slate-900">
                                    Create Team
                                </h2>

                                <p className="mt-1 text-sm text-slate-500">
                                    Add a new team to this
                                    workspace.
                                </p>
                            </div>

                            <button
                                type="button"
                                onClick={() =>
                                    setShowCreateTeam(
                                        false
                                    )
                                }
                                className="text-slate-400 hover:text-slate-700"
                            >
                                ✕
                            </button>
                        </div>

                        <div className="mt-6 space-y-4">
                            <div>
                                <label className="mb-1.5 block text-sm font-medium text-slate-700">
                                    Team Name
                                </label>

                                <input
                                    type="text"
                                    value={teamName}
                                    onChange={(event) =>
                                        setTeamName(
                                            event.target
                                                .value
                                        )
                                    }
                                    placeholder="e.g. Marketing Team"
                                    className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none transition focus:border-slate-400"
                                />
                            </div>

                            <div>
                                <label className="mb-1.5 block text-sm font-medium text-slate-700">
                                    Description
                                </label>

                                <textarea
                                    value={
                                        teamDescription
                                    }
                                    onChange={(event) =>
                                        setTeamDescription(
                                            event.target
                                                .value
                                        )
                                    }
                                    rows={4}
                                    placeholder="What is this team responsible for?"
                                    className="w-full resize-none rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none transition focus:border-slate-400"
                                />
                            </div>
                        </div>

                        <div className="mt-6 flex justify-end gap-3">
                            <button
                                type="button"
                                onClick={() =>
                                    setShowCreateTeam(
                                        false
                                    )
                                }
                                className="rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
                            >
                                Cancel
                            </button>

                            <button
                                type="submit"
                                disabled={creatingTeam}
                                className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-60"
                            >
                                {creatingTeam && (
                                    <Loader2
                                        size={15}
                                        className="animate-spin"
                                    />
                                )}
                                Create Team
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Add Member Modal */}
            {showAddMember && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4"
                    onMouseDown={(event) => {
                        if (
                            event.target ===
                            event.currentTarget
                        ) {
                            setShowAddMember(false);
                        }
                    }}
                >
                    <form
                        onSubmit={
                            handleAddMember
                        }
                        className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl"
                    >
                        <div>
                            <h2 className="text-lg font-semibold text-slate-900">
                                Add Team Member
                            </h2>

                            <p className="mt-1 text-sm text-slate-500">
                                Add an employee to{" "}
                                <span className="font-medium text-slate-700">
                                    {selectedTeam?.name}
                                </span>
                                .
                            </p>
                        </div>

                        <div className="mt-6">
                            <label className="mb-1.5 block text-sm font-medium text-slate-700">
                                Employee
                            </label>

                            <select
                                value={selectedUser}
                                onChange={(event) =>
                                    setSelectedUser(
                                        event.target
                                            .value
                                    )
                                }
                                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-slate-400"
                            >
                                <option value="">
                                    Select an employee
                                </option>

                                {availableMembers.map(
                                    (member) => {
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
                                                    userId}{" "}
                                                —{" "}
                                                {user.email ||
                                                    "No email"}
                                            </option>
                                        );
                                    }
                                )}
                            </select>

                            {availableMembers.length ===
                                0 && (
                                <p className="mt-2 text-xs text-amber-600">
                                    All workspace employees
                                    are already assigned to a
                                    team.
                                </p>
                            )}
                        </div>

                        <div className="mt-6 flex justify-end gap-3">
                            <button
                                type="button"
                                onClick={() =>
                                    setShowAddMember(
                                        false
                                    )
                                }
                                className="rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
                            >
                                Cancel
                            </button>

                            <button
                                type="submit"
                                disabled={
                                    addingMember ||
                                    !selectedUser
                                }
                                className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                                {addingMember && (
                                    <Loader2
                                        size={15}
                                        className="animate-spin"
                                    />
                                )}
                                Add Member
                            </button>
                        </div>
                    </form>
                </div>
            )}
        </div>
    );
};

export default Team;