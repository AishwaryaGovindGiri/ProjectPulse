import { useEffect, useMemo, useState } from "react";
import {
    AlertCircle,
    CheckCircle2,
    Clock3,
    Loader2,
    RefreshCw,
    Target,
    TrendingUp,
    UserRound,
    Users,
} from "lucide-react";
import toast from "react-hot-toast";

import { getDashboard } from "../lib/api";

const Performance = () => {
    const [employees, setEmployees] =
        useState([]);

    const [loading, setLoading] =
        useState(true);

    const [refreshing, setRefreshing] =
        useState(false);

    const [error, setError] =
        useState("");

    const fetchPerformance = async (
        isRefresh = false
    ) => {
        try {
            if (isRefresh) {
                setRefreshing(true);
            } else {
                setLoading(true);
            }

            setError("");

            const data =
                await getDashboard();

            setEmployees(
                Array.isArray(
                    data?.employeePerformance
                )
                    ? data.employeePerformance
                    : []
            );
        } catch (err) {
            console.error(
                "Failed to fetch performance:",
                err
            );

            setError(
                err?.message ||
                    "Unable to load performance data."
            );
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchPerformance();
    }, []);

    const summary = useMemo(() => {
        let onTime = 0;
        let late = 0;
        let mistakes = 0;

        employees.forEach((employee) => {
            onTime +=
                Number(employee.onTime) || 0;

            late +=
                Number(employee.late) || 0;

            mistakes +=
                Number(employee.mistakes) || 0;
        });

        const submissions =
            onTime + late;

        const onTimeRate =
            submissions > 0
                ? Math.round(
                      (onTime /
                          submissions) *
                          100
                  )
                : 0;

        return {
            employees:
                employees.length,
            onTime,
            late,
            mistakes,
            submissions,
            onTimeRate,
        };
    }, [employees]);

    if (loading) {
        return (
            <div className="flex min-h-[70vh] items-center justify-center">
                <div className="flex flex-col items-center gap-3">
                    <Loader2
                        size={30}
                        className="animate-spin text-slate-700"
                    />

                    <p className="text-sm text-slate-500">
                        Loading performance...
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
                        Performance data could not be loaded
                    </h2>

                    <p className="mt-2 text-sm text-slate-500">
                        {error}
                    </p>

                    <button
                        onClick={() =>
                            fetchPerformance()
                        }
                        className="mt-5 inline-flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-slate-800"
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
                        Workforce
                    </p>

                    <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900">
                        Performance
                    </h1>

                    <p className="mt-1 text-sm text-slate-500">
                        Global employee performance across
                        projects and teams.
                    </p>
                </div>

                <button
                    onClick={() =>
                        fetchPerformance(true)
                    }
                    disabled={refreshing}
                    className="inline-flex w-fit items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:opacity-60"
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

            {/* Summary Cards */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-slate-500">
                                Employees
                            </p>

                            <p className="mt-2 text-2xl font-bold text-slate-900">
                                {summary.employees}
                            </p>
                        </div>

                        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                            <Users size={21} />
                        </div>
                    </div>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-slate-500">
                                On-Time Submissions
                            </p>

                            <p className="mt-2 text-2xl font-bold text-slate-900">
                                {summary.onTime}
                            </p>
                        </div>

                        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                            <CheckCircle2 size={21} />
                        </div>
                    </div>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-slate-500">
                                Late Submissions
                            </p>

                            <p className="mt-2 text-2xl font-bold text-slate-900">
                                {summary.late}
                            </p>
                        </div>

                        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
                            <Clock3 size={21} />
                        </div>
                    </div>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-slate-500">
                                Mistakes
                            </p>

                            <p className="mt-2 text-2xl font-bold text-slate-900">
                                {summary.mistakes}
                            </p>
                        </div>

                        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-red-50 text-red-600">
                            <AlertCircle size={21} />
                        </div>
                    </div>
                </div>
            </div>

            {/* Overall Rate */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
                    <div>
                        <div className="flex items-center gap-2">
                            <Target
                                size={19}
                                className="text-slate-600"
                            />

                            <h2 className="text-base font-semibold text-slate-900">
                                On-Time Submission Rate
                            </h2>
                        </div>

                        <p className="mt-1.5 text-sm text-slate-500">
                            Based on completed tasks with available
                            submission timing.
                        </p>
                    </div>

                    <div className="flex items-center gap-3">
                        <span className="text-3xl font-bold text-slate-900">
                            {summary.onTimeRate}%
                        </span>

                        <TrendingUp
                            size={20}
                            className="text-emerald-600"
                        />
                    </div>
                </div>

                <div className="mt-5 h-3 overflow-hidden rounded-full bg-slate-100">
                    <div
                        className="h-full rounded-full bg-slate-900 transition-all duration-500"
                        style={{
                            width: `${summary.onTimeRate}%`,
                        }}
                    />
                </div>
            </div>

            {/* Employee Table */}
            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                <div className="border-b border-slate-200 p-6">
                    <div className="flex items-center gap-2">
                        <UserRound
                            size={19}
                            className="text-slate-600"
                        />

                        <h2 className="text-base font-semibold text-slate-900">
                            Employee Performance
                        </h2>
                    </div>

                    <p className="mt-1 text-sm text-slate-500">
                        Performance information aggregated across
                        all projects.
                    </p>
                </div>

                {employees.length === 0 ? (
                    <div className="px-6 py-14 text-center">
                        <Users
                            size={32}
                            className="mx-auto text-slate-300"
                        />

                        <p className="mt-3 text-sm font-medium text-slate-700">
                            No performance data available
                        </p>

                        <p className="mt-1 text-xs text-slate-500">
                            Employee activity will appear here once
                            tasks are completed.
                        </p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[760px]">
                            <thead>
                                <tr className="border-b border-slate-100 bg-slate-50">
                                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                                        Employee
                                    </th>

                                    <th className="px-4 py-4 text-center text-xs font-semibold uppercase tracking-wide text-slate-500">
                                        On Time
                                    </th>

                                    <th className="px-4 py-4 text-center text-xs font-semibold uppercase tracking-wide text-slate-500">
                                        Late
                                    </th>

                                    <th className="px-4 py-4 text-center text-xs font-semibold uppercase tracking-wide text-slate-500">
                                        Mistakes
                                    </th>

                                    <th className="px-4 py-4 text-center text-xs font-semibold uppercase tracking-wide text-slate-500">
                                        On-Time Rate
                                    </th>

                                    <th className="px-6 py-4 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                                        Hours This Week
                                    </th>
                                </tr>
                            </thead>

                            <tbody className="divide-y divide-slate-100">
                                {employees.map(
                                    (employee) => {
                                        const onTime =
                                            Number(
                                                employee.onTime
                                            ) || 0;

                                        const late =
                                            Number(
                                                employee.late
                                            ) || 0;

                                        const mistakes =
                                            Number(
                                                employee.mistakes
                                            ) || 0;

                                        const total =
                                            onTime +
                                            late;

                                        const rate =
                                            total >
                                            0
                                                ? Math.round(
                                                      (onTime /
                                                          total) *
                                                          100
                                                  )
                                                : 0;

                                        return (
                                            <tr
                                                key={
                                                    employee.userId
                                                }
                                                className="transition hover:bg-slate-50"
                                            >
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-100 text-sm font-semibold text-slate-700">
                                                            {(
                                                                employee.name ||
                                                                "U"
                                                            )
                                                                .charAt(
                                                                    0
                                                                )
                                                                .toUpperCase()}
                                                        </div>

                                                        <div className="min-w-0">
                                                            <p className="truncate text-sm font-medium text-slate-900">
                                                                {employee.name ||
                                                                    "Unknown employee"}
                                                            </p>

                                                            <p className="truncate text-xs text-slate-500">
                                                                {employee.email ||
                                                                    "No email"}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </td>

                                                <td className="px-4 py-4 text-center">
                                                    <span className="inline-flex min-w-10 items-center justify-center rounded-lg bg-emerald-50 px-2.5 py-1.5 text-xs font-semibold text-emerald-700">
                                                        {
                                                            onTime
                                                        }
                                                    </span>
                                                </td>

                                                <td className="px-4 py-4 text-center">
                                                    <span className="inline-flex min-w-10 items-center justify-center rounded-lg bg-amber-50 px-2.5 py-1.5 text-xs font-semibold text-amber-700">
                                                        {
                                                            late
                                                        }
                                                    </span>
                                                </td>

                                                <td className="px-4 py-4 text-center">
                                                    <span className="inline-flex min-w-10 items-center justify-center rounded-lg bg-red-50 px-2.5 py-1.5 text-xs font-semibold text-red-700">
                                                        {
                                                            mistakes
                                                        }
                                                    </span>
                                                </td>

                                                <td className="px-4 py-4">
                                                    <div className="flex min-w-32 items-center gap-3">
                                                        <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-100">
                                                            <div
                                                                className="h-full rounded-full bg-slate-800"
                                                                style={{
                                                                    width: `${rate}%`,
                                                                }}
                                                            />
                                                        </div>

                                                        <span className="w-10 text-right text-xs font-semibold text-slate-700">
                                                            {rate}%
                                                        </span>
                                                    </div>
                                                </td>

                                                <td className="px-6 py-4 text-right">
                                                    <span className="text-sm font-medium text-slate-700">
                                                        {employee.hoursThisWeek ??
                                                            employee.weeklyHours ??
                                                            0}
                                                        h
                                                    </span>
                                                </td>
                                            </tr>
                                        );
                                    }
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Performance;