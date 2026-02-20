"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getDashboardSummary, syncNavs } from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';

interface Holding {
    scheme_name: string;
    isin: string;
    units: number;
    current_nav: number;
    current_value: number;
    invested_value: number;
}

interface SummaryData {
    total_value: number;
    invested_value: number;
    xirr: number;
    holdings: Holding[];
}

import { useToast } from '@/components/ui/Toast';

export default function DashboardPage() {
    const [data, setData] = useState<SummaryData | null>(null);
    const [loading, setLoading] = useState(true);
    const [syncing, setSyncing] = useState(false);
    const router = useRouter();
    const toast = useToast();

    useEffect(() => {
        const userId = localStorage.getItem('mfa_user_id');
        if (!userId) {
            router.push('/upload');
            return;
        }
        fetchData(userId);
    }, [router]);

    const fetchData = async (userId: string) => {
        try {
            const result = await getDashboardSummary(userId);
            setData(result);
        } catch (error) {
            console.error("Failed to fetch dashboard", error);
            toast.error("Failed to load dashboard data.");
        } finally {
            setLoading(false);
        }
    };

    const handleSync = async () => {
        const userId = localStorage.getItem('mfa_user_id');
        if (!userId) return;

        setSyncing(true);
        try {
            const response = await syncNavs(userId);
            if (response.data) {
                setData(response.data);
                toast.success("Portfolio synced successfully!");
            } else {
                await fetchData(userId);
                toast.success("Portfolio synced successfully!");
            }
        } catch (error) {
            console.error("Sync failed", error);
            toast.error("Failed to sync NAVs. Please try again.");
        } finally {
            setSyncing(false);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('mfa_user_id');
        router.push('/upload');
    };

    if (loading) {
        return <div className="p-8 text-center text-gray-500">Loading Portfolio...</div>;
    }

    if (!data) {
        return (
            <div className="min-h-screen bg-gray-50 p-6 flex items-center justify-center">
                <Card title="Welcome to Portfolio Analyzer" className="max-w-md w-full text-center">
                    <p className="text-gray-600 mb-6">
                        No portfolio data found. Upload your Consolidated Account Statement (CAS) to get started.
                    </p>
                    <div className="flex justify-center">
                        <Button onClick={() => router.push('/upload')}>
                            Upload CAS
                        </Button>
                    </div>
                </Card>
            </div>
        );
    }

    const { total_value, invested_value, xirr, holdings } = data;
    const gain = total_value - invested_value;
    const gainPercent = invested_value > 0 ? (gain / invested_value) * 100 : 0;

    return (
        <div className="min-h-screen bg-gray-50 p-6">
            <div className="max-w-7xl mx-auto space-y-6">

                {/* Header */}
                <div className="flex justify-between items-center bg-white p-4 rounded-lg shadow-sm">
                    <h1 className="text-2xl font-bold text-gray-800">Portfolio Dashboard</h1>
                    <div className="space-x-2">
                        <Button variant="secondary" onClick={handleSync} isLoading={syncing} disabled={syncing}>
                            Sync NAVs
                        </Button>
                        <Button variant="secondary" onClick={() => router.push('/upload')}>
                            Upload CAS
                        </Button>
                        <Button variant="danger" onClick={handleLogout}>
                            Logout
                        </Button>
                    </div>
                </div>

                {/* KPI Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <Card title="Current Value">
                        <p className="text-3xl font-bold text-blue-600">₹{total_value.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</p>
                    </Card>
                    <Card title="Invested Value">
                        <p className="text-3xl font-bold text-gray-700">₹{invested_value.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</p>
                    </Card>
                    <Card title="Total Gain">
                        <p className={`text-3xl font-bold ${gain >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            ₹{gain.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                            <span className="text-sm ml-2 font-normal">({gainPercent.toFixed(2)}%)</span>
                        </p>
                    </Card>
                    <Card title="XIRR">
                        <p className={`text-3xl font-bold ${xirr >= 0 ? 'text-purple-600' : 'text-red-600'}`}>
                            {xirr.toFixed(2)}%
                        </p>
                    </Card>
                </div>

                {/* Holdings Table */}
                <Card title="Holdings" className="overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Scheme</th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Units</th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">NAV</th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Current Value</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {holdings.map((h) => (
                                    <tr key={h.isin}>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{h.scheme_name}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-right">{h.units.toFixed(3)}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-right">₹{h.current_nav.toFixed(2)}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right font-semibold">₹{h.current_value.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        {holdings.length === 0 && (
                            <div className="p-4 text-center text-gray-500">No active holdings found.</div>
                        )}
                    </div>
                </Card>

            </div>
        </div>
    );
}
