import {
    NavLink,
    Outlet,
    useLocation,
    useNavigate,
} from "react-router-dom";

import {
    LayoutDashboard,
    FolderKanban,
    Users,
    BarChart3,
    LogOut,
    Bell,
    Search,
    ChevronDown,
} from "lucide-react";


// ======================================================
// CURRENT USER
// ======================================================

const CURRENT_USER = {
    id: "test-user-1",
    name: "Test User",
    email: "testuser@projectpulse.com",
};


// ======================================================
// NAVIGATION
// ======================================================

const navigation = [
    {
        name: "Dashboard",
        path: "/",
        icon: LayoutDashboard,
    },

    {
        name: "Projects",
        path: "/projects",
        icon: FolderKanban,
    },

    {
        name: "Team",
        path: "/team",
        icon: Users,
    },

    {
        name: "Performance",
        path: "/performance",
        icon: BarChart3,
    },
];


// ======================================================
// LAYOUT
// ======================================================

const Layout = () => {
    const location =
        useLocation();

    const navigate =
        useNavigate();

    const handleLogout = () => {
        localStorage.removeItem(
            "projectpulse_user"
        );

        navigate("/");
    };

    const currentPage =
        navigation.find(
            (item) =>
                item.path ===
                location.pathname
        );

    return (
        <div className="min-h-screen bg-slate-50 text-slate-900">

            {/* ==================================================
                SIDEBAR
            ================================================== */}

            <aside className="fixed left-0 top-0 z-40 flex h-screen w-64 flex-col border-r border-slate-200 bg-white">

                {/* Logo */}

                <div className="flex h-20 items-center border-b border-slate-200 px-6">

                    <div className="flex items-center gap-3">

                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600 text-lg font-bold text-white">
                            P
                        </div>

                        <div>
                            <h1 className="text-lg font-bold tracking-tight">
                                ProjectPulse
                            </h1>

                            <p className="text-xs text-slate-500">
                                Project Management
                            </p>
                        </div>

                    </div>

                </div>


                {/* Workspace */}

                <div className="px-4 pt-5">

                    <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">

                        <p className="mb-1 text-[11px] font-medium uppercase tracking-wider text-slate-400">
                            Workspace
                        </p>

                        <div className="flex items-center justify-between">

                            <div className="flex min-w-0 items-center gap-2">

                                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-indigo-100 text-sm font-semibold text-indigo-700">
                                    P
                                </div>

                                <div className="min-w-0">
                                    <p className="truncate text-sm font-semibold text-slate-800">
                                        ProjectPulse
                                    </p>

                                    <p className="text-xs text-slate-500">
                                        Workspace
                                    </p>
                                </div>

                            </div>

                            <ChevronDown
                                size={16}
                                className="text-slate-400"
                            />

                        </div>

                    </div>

                </div>


                {/* Navigation */}

                <nav className="flex-1 px-4 py-6">

                    <p className="mb-3 px-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                        Main Menu
                    </p>

                    <div className="space-y-1">

                        {navigation.map(
                            (item) => {
                                const Icon =
                                    item.icon;

                                const isActive =
                                    item.path ===
                                    "/"
                                        ? location.pathname ===
                                          "/"
                                        : location.pathname.startsWith(
                                              item.path
                                          );

                                return (
                                    <NavLink
                                        key={
                                            item.path
                                        }
                                        to={
                                            item.path
                                        }
                                        className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
                                            isActive
                                                ? "bg-indigo-50 text-indigo-700"
                                                : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                                        }`}
                                    >
                                        <Icon
                                            size={
                                                19
                                            }
                                            strokeWidth={
                                                isActive
                                                    ? 2.3
                                                    : 1.9
                                            }
                                        />

                                        <span>
                                            {
                                                item.name
                                            }
                                        </span>

                                        {isActive && (
                                            <span className="ml-auto h-1.5 w-1.5 rounded-full bg-indigo-600" />
                                        )}
                                    </NavLink>
                                );
                            }
                        )}

                    </div>

                </nav>


                {/* User */}

                <div className="border-t border-slate-200 p-4">

                    <div className="mb-3 flex items-center gap-3 rounded-xl p-2">

                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-indigo-600 text-sm font-semibold text-white">
                            T
                        </div>

                        <div className="min-w-0">

                            <p className="truncate text-sm font-semibold">
                                {
                                    CURRENT_USER.name
                                }
                            </p>

                            <p className="truncate text-xs text-slate-500">
                                {
                                    CURRENT_USER.email
                                }
                            </p>

                        </div>

                    </div>

                    <button
                        onClick={
                            handleLogout
                        }
                        className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-red-50 hover:text-red-600"
                    >
                        <LogOut
                            size={18}
                        />

                        Sign out
                    </button>

                </div>

            </aside>


            {/* ==================================================
                MAIN AREA
            ================================================== */}

            <div className="ml-64 min-h-screen">

                {/* ==================================================
                    TOP BAR
                ================================================== */}

                <header className="sticky top-0 z-30 flex h-20 items-center justify-between border-b border-slate-200 bg-white/95 px-8 backdrop-blur">

                    {/* Page title */}

                    <div>

                        <h2 className="text-xl font-bold text-slate-900">
                            {
                                currentPage?.name ||
                                "ProjectPulse"
                            }
                        </h2>

                        <p className="mt-0.5 text-xs text-slate-500">
                            Manage your projects,
                            teams and tasks
                        </p>

                    </div>


                    {/* Right side */}

                    <div className="flex items-center gap-4">

                        {/* Search */}

                        <button
                            className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 text-slate-500 transition hover:bg-slate-50 hover:text-slate-900"
                            title="Search"
                        >
                            <Search
                                size={18}
                            />
                        </button>


                        {/* Notification */}

                        <button
                            className="relative flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 text-slate-500 transition hover:bg-slate-50 hover:text-slate-900"
                            title="Notifications"
                        >
                            <Bell
                                size={18}
                            />

                            <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-red-500" />
                        </button>


                        {/* User avatar */}

                        <div className="flex items-center gap-2 border-l border-slate-200 pl-4">

                            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-indigo-600 text-sm font-semibold text-white">
                                T
                            </div>

                            <div className="hidden lg:block">

                                <p className="text-sm font-semibold">
                                    {
                                        CURRENT_USER.name
                                    }
                                </p>

                                <p className="text-xs text-slate-500">
                                    Employee
                                </p>

                            </div>

                        </div>

                    </div>

                </header>


                {/* ==================================================
                    PAGE CONTENT
                ================================================== */}

                <main className="p-8">

                    <Outlet />

                </main>

            </div>

        </div>
    );
};

export default Layout;