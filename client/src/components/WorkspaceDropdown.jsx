import { useState, useRef, useEffect } from "react";
import { ChevronDown, Check, Plus } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import {
    setCurrentWorkspace,
    setWorkspaces,
} from "../features/workspaceSlice";
import { useNavigate } from "react-router-dom";
import { getWorkspaces } from "../lib/api";

const API_URL = "http://localhost:5000/api";

function WorkspaceDropdown() {
    const { workspaces, currentWorkspace } = useSelector(
        (state) => state.workspace
    );

    const [isOpen, setIsOpen] = useState(false);
    const [loading, setLoading] = useState(false);

    const dropdownRef = useRef(null);

    const dispatch = useDispatch();
    const navigate = useNavigate();

    useEffect(() => {
        const fetchWorkspaces = async () => {
            try {
                setLoading(true);

                const workspaceData = await getWorkspaces();

                const workspacesWithProjects = await Promise.all(
                    workspaceData.map(async (workspace) => {
                        const response = await fetch(
                            `${API_URL}/projects?workspaceId=${workspace.id}`
                        );

                        const data = await response.json();

                        return {
                            ...workspace,
                            projects: data.projects || [],
                        };
                    })
                );

                dispatch(setWorkspaces(workspacesWithProjects));
            } catch (error) {
                console.error(
                    "Workspace loading error:",
                    error
                );
            } finally {
                setLoading(false);
            }
        };

        fetchWorkspaces();
    }, [dispatch]);

    const onSelectWorkspace = (workspace) => {
        dispatch(setCurrentWorkspace(workspace));

        setIsOpen(false);

        navigate(
            `/workspace-access?workspaceId=${workspace.id}`
        );
    };

    useEffect(() => {
        function handleClickOutside(event) {
            if (
                dropdownRef.current &&
                !dropdownRef.current.contains(event.target)
            ) {
                setIsOpen(false);
            }
        }

        document.addEventListener(
            "mousedown",
            handleClickOutside
        );

        return () =>
            document.removeEventListener(
                "mousedown",
                handleClickOutside
            );
    }, []);

    return (
        <div
            className="relative m-4"
            ref={dropdownRef}
        >
            <button
                onClick={() =>
                    setIsOpen((prev) => !prev)
                }
                className="w-full flex items-center justify-between p-3 h-auto text-left rounded hover:bg-gray-100 dark:hover:bg-zinc-800"
            >
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded bg-gray-200 dark:bg-zinc-700 flex items-center justify-center font-semibold text-gray-600 dark:text-gray-300">
                        {currentWorkspace?.name
                            ?.charAt(0)
                            ?.toUpperCase() || "W"}
                    </div>

                    <div className="min-w-0 flex-1">
                        <p className="font-semibold text-gray-800 dark:text-white text-sm truncate">
                            {currentWorkspace?.name ||
                                "Select Workspace"}
                        </p>

                        <p className="text-xs text-gray-500 dark:text-zinc-400 truncate">
                            {workspaces.length} workspace
                            {workspaces.length !== 1
                                ? "s"
                                : ""}
                        </p>
                    </div>
                </div>

                <ChevronDown className="w-4 h-4 text-gray-500 dark:text-zinc-400 flex-shrink-0" />
            </button>

            {isOpen && (
                <div className="absolute z-50 w-64 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 rounded shadow-lg top-full left-0">
                    <div className="p-2">
                        <p className="text-xs text-gray-500 dark:text-zinc-400 uppercase tracking-wider mb-2 px-2">
                            Workspaces
                        </p>

                        {loading ? (
                            <p className="px-2 py-3 text-sm text-gray-500">
                                Loading workspaces...
                            </p>
                        ) : workspaces.length === 0 ? (
                            <p className="px-2 py-3 text-sm text-gray-500">
                                No workspaces found.
                            </p>
                        ) : (
                            workspaces.map((workspace) => (
                                <div
                                    key={workspace.id}
                                    onClick={() =>
                                        onSelectWorkspace(
                                            workspace
                                        )
                                    }
                                    className="flex items-center gap-3 p-2 cursor-pointer rounded hover:bg-gray-100 dark:hover:bg-zinc-800"
                                >
                                    <div className="w-6 h-6 rounded bg-gray-200 dark:bg-zinc-700 flex items-center justify-center text-xs font-semibold text-gray-600 dark:text-gray-300">
                                        {workspace.name
                                            ?.charAt(0)
                                            ?.toUpperCase() ||
                                            "W"}
                                    </div>

                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium text-gray-800 dark:text-white truncate">
                                            {workspace.name}
                                        </p>

                                        <p className="text-xs text-gray-500 dark:text-zinc-400 truncate">
                                            {workspace.projects
                                                ?.length || 0}{" "}
                                            project
                                            {workspace.projects
                                                ?.length !== 1
                                                ? "s"
                                                : ""}
                                        </p>
                                    </div>

                                    {currentWorkspace?.id ===
                                        workspace.id && (
                                        <Check className="w-4 h-4 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                                    )}
                                </div>
                            ))
                        )}
                    </div>

                    <hr className="border-gray-200 dark:border-zinc-700" />

                    <div className="p-2 cursor-pointer rounded group hover:bg-gray-100 dark:hover:bg-zinc-800">
                        <p className="flex items-center text-xs gap-2 my-1 w-full text-blue-600 dark:text-blue-400 group-hover:text-blue-500 dark:group-hover:text-blue-300">
                            <Plus className="w-4 h-4" />
                            Create Workspace
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
}

export default WorkspaceDropdown;