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
}

export default function TotalGainDrilldownPage() {
    const [holdings, setHoldings] = useState<Holding[]>([]);
    const [totalGain, setTotalGain] = useState(0);
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

                // Sort by absolute gain descending
                activeHoldings.sort((a: Holding, b: Holding) => (b.current_value - b.invested_value) - (a.current_value - a.invested_value));

                setHoldings(activeHoldings);
                setTotalGain(result.total_value - result.invested_value);
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

    const isPositiveTotal = totalGain >= 0;

    return (
        <div className="min-h-screen bg-gray-50 p-6">
            <div className="max-w-6xl mx-auto space-y-6">

                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-800">Total Gain Breakdown</h1>
                        <p className="text-gray-500 text-sm mt-1">
                            Calculated as (Current Value - Invested Value) for each scheme.
                        </p>
                    </div>
                    <Button variant="outline" onClick={() => router.push('/dashboard')}>
                        ← Back to Dashboard
                    </Button>
                </div>

                {/* Summary Card */}
                <Card className={`${isPositiveTotal ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'} shadow-sm`}>
                    <div className="flex flex-col md:flex-row md:items-center justify-between">
                        <div>
                            <p className={`text-sm font-medium ${isPositiveTotal ? 'text-green-800' : 'text-red-800'}`}>Total Portfolio Gain</p>
                            <p className={`text-3xl font-bold mt-1 ${isPositiveTotal ? 'text-green-600' : 'text-red-600'}`}>
                                {isPositiveTotal ? '+' : ''}₹{totalGain.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                            </p>
                        </div>
                        <div className="mt-4 md:mt-0 text-right">
                            <p className={`text-sm ${isPositiveTotal ? 'text-green-700' : 'text-red-700'}`}>Comprised of <strong>{holdings.length}</strong> active schemes</p>
                            <p className={`text-xs mt-1 font-mono ${isPositiveTotal ? 'text-green-600' : 'text-red-600'}`}>Σ (Current Value - Invested Value)</p>
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
                                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Current Value</th>
                                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-400 uppercase tracking-wider"></th>
                                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Invested Value</th>
                                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-400 uppercase tracking-wider"></th>
                                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Absolute Gain</th>
                                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Gain %</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {holdings.map((h) => {
                                    const gain = h.current_value - h.invested_value;
                                    const gainPercent = h.invested_value > 0 ? (gain / h.invested_value) * 100 : 0;
                                    const isPositive = gain >= 0;

                                    return (
                                        <tr key={h.isin} className="hover:bg-gray-50 transition-colors">
                                            <td className="px-4 py-4">
                                                <p className="text-sm font-medium text-gray-900 line-clamp-2">{h.scheme_name}</p>
                                                <p className="text-xs text-gray-400 mt-0.5 font-mono">{h.isin}</p>
                                            </td>
                                            <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-700 text-right font-mono">
                                                ₹{h.current_value.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                                            </td>
                                            <td className="px-2 py-4 whitespace-nowrap text-sm text-gray-300 text-center">-</td>
                                            <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-700 text-right font-mono">
                                                ₹{h.invested_value.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                                            </td>
                                            <td className="px-2 py-4 whitespace-nowrap text-sm text-gray-300 text-center">=</td>
                                            <td className={`px-4 py-4 whitespace-nowrap text-sm text-right font-semibold ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
                                                {isPositive ? '+' : ''}₹{gain.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                                            </td>
                                            <td className="px-4 py-4 whitespace-nowrap text-sm text-right">
                                                <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${isPositive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                                    {isPositive ? '+' : ''}{gainPercent.toFixed(2)}%
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
