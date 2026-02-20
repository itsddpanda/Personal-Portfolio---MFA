"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getDashboardSummary } from '@/lib/api';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

interface Holding {
    scheme_name: string;
    isin: string;
    invested_value: number;
    current_value: number;
    is_estimated?: boolean;
}

export default function InvestedValueDrilldownPage() {
    const [holdings, setHoldings] = useState<Holding[]>([]);
    const [totalInvested, setTotalInvested] = useState(0);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        const userId = localStorage.getItem('mfa_user_id');
        if (!userId) {
            router.push('/');
            return;
        }

        const fetchData = async () => {
            try {
                const result = await getDashboardSummary(userId);
                if (!result || !result.holdings) return;

                const activeHoldings = result.holdings.filter((h: any) => h.current_value > 0 || h.invested_value > 0);
                activeHoldings.sort((a: Holding, b: Holding) => b.invested_value - a.invested_value);

                setHoldings(activeHoldings);
                setTotalInvested(result.invested_value);
            } catch (error) {
                console.error("Failed to fetch data", error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [router]);

    if (loading) {
        return <div className="p-8 text-center text-gray-500">Loading breakdown...</div>;
    }

    return (
        <div className="min-h-screen bg-gray-50 p-6">
            <div className="max-w-5xl mx-auto space-y-6">

                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-800">Invested Value Breakdown</h1>
                        <p className="text-gray-500 text-sm mt-1">
                            Calculated using FIFO (First-In-First-Out) cost basis for all accumulated active units.
                        </p>
                    </div>
                    <Button variant="outline" onClick={() => router.push('/dashboard')}>
                        ← Back to Dashboard
                    </Button>
                </div>

                {/* Summary Card */}
                <Card className="bg-slate-50 border border-slate-200 shadow-sm">
                    <div className="flex flex-col md:flex-row md:items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-slate-800">Total Invested Value</p>
                            <p className="text-3xl font-bold text-slate-900 mt-1">
                                ₹{totalInvested.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                            </p>
                        </div>
                        <div className="mt-4 md:mt-0 text-right">
                            <p className="text-sm text-slate-700">Comprised of <strong>{holdings.length}</strong> active schemes</p>
                            <p className="text-xs text-slate-500 mt-1 font-mono">Σ (FIFO Cost * Active Units)</p>
                        </div>
                    </div>
                </Card>

                {/* Detailed Table */}
                <Card title="Calculation Detail" className="overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Scheme</th>
                                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Estimation Status</th>
                                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Invested Value</th>
                                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">% Weight</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {holdings.map((h) => {
                                    const weight = totalInvested > 0 ? (h.invested_value / totalInvested) * 100 : 0;

                                    return (
                                        <tr key={h.isin} className="hover:bg-gray-50 transition-colors">
                                            <td className="px-4 py-4">
                                                <p className="text-sm font-medium text-gray-900 line-clamp-2">{h.scheme_name}</p>
                                                <p className="text-xs text-gray-400 mt-0.5 font-mono">{h.isin}</p>
                                            </td>
                                            <td className="px-4 py-4 whitespace-nowrap text-sm text-center">
                                                {h.is_estimated ? (
                                                    <span className="inline-block px-2 py-1 bg-amber-100 text-amber-800 rounded text-xs font-medium" title="Missing full transaction history">
                                                        ⚠️ Estimated
                                                    </span>
                                                ) : (
                                                    <span className="inline-block px-2 py-1 bg-green-100 text-green-800 rounded text-xs font-medium">
                                                        Exact (FIFO)
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900 text-right font-semibold">
                                                ₹{h.invested_value.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                                            </td>
                                            <td className="px-4 py-4 whitespace-nowrap text-sm text-right">
                                                <span className="inline-block px-2 py-1 bg-gray-100 rounded text-xs text-gray-600 font-medium">
                                                    {weight.toFixed(1)}%
                                                </span>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                        {holdings.length === 0 && (
                            <div className="p-8 text-center text-gray-500">No active holdings found.</div>
                        )}
                    </div>
                </Card>

            </div>
        </div>
    );
}
