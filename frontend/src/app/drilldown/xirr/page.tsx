"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { getDashboardSummary } from '@/lib/api';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

interface Holding {
    scheme_name: string;
    isin: string;
    amfi_code?: string;
    invested_value: number;
    current_value: number;
    xirr?: number;
    xirr_status?: string;
}

export default function XirrDrilldownPage() {
    const [holdings, setHoldings] = useState<Holding[]>([]);
    const [portfolioXirr, setPortfolioXirr] = useState(0);
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

                // Sort by XIRR descending, bringing errors/NA to bottom
                activeHoldings.sort((a: Holding, b: Holding) => {
                    if (a.xirr !== undefined && b.xirr !== undefined) return b.xirr - a.xirr;
                    if (a.xirr !== undefined) return -1;
                    if (b.xirr !== undefined) return 1;
                    return 0;
                });

                setHoldings(activeHoldings);
                setPortfolioXirr(result.xirr);
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

    const isPositiveXirr = portfolioXirr >= 0;

    return (
        <div className="min-h-screen bg-gray-50 p-6">
            <div className="max-w-6xl mx-auto space-y-6">

                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-800">XIRR (Extended Internal Rate of Return)</h1>
                        <p className="text-gray-500 text-sm mt-1">
                            Time-weighted annualized return of your entire portfolio.
                        </p>
                    </div>
                    <Button variant="outline" onClick={() => router.push('/dashboard')}>
                        ← Back to Dashboard
                    </Button>
                </div>

                {/* Summary Card */}
                <Card className={`${isPositiveXirr ? 'bg-purple-50 border border-purple-200' : 'bg-red-50 border border-red-200'} shadow-sm`}>
                    <div className="flex flex-col md:flex-row md:items-start justify-between">
                        <div>
                            <p className={`text-sm font-medium ${isPositiveXirr ? 'text-purple-800' : 'text-red-800'}`}>Portfolio Aggregate XIRR</p>
                            <p className={`text-3xl font-bold mt-1 ${isPositiveXirr ? 'text-purple-600' : 'text-red-600'}`}>
                                {isPositiveXirr ? '+' : ''}{portfolioXirr.toFixed(2)}%
                            </p>
                        </div>
                    </div>
                </Card>

                <div className="bg-blue-50 text-blue-800 p-4 rounded-md mb-6 text-sm flex gap-3">
                    <span className="text-xl">ℹ️</span>
                    <div>
                        <p className="font-semibold mb-1">How XIRR Works</p>
                        <p>
                            XIRR applies a strict time-weighted formula to every exact transaction date (SIPs, lumpsums, redemptions) to calculate your annualized return. Per-scheme XIRR is fully supported for investments held longer than 1 year with a clear entry and exit history.
                        </p>
                    </div>
                </div>

                {/* Detailed Table */}
                <Card title="Per-Scheme XIRR Breakdown" className="overflow-hidden">
                    <p className="text-sm text-gray-500 mb-4">
                        Individual XIRR calculated based on exact historical cashflows.
                    </p>
                    <div className="overflow-x-auto">
                        <table className="w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Scheme</th>
                                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Invested Value</th>
                                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-400 uppercase tracking-wider"></th>
                                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Per-Scheme XIRR</th>
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
                                                <Link href={h.amfi_code ? `/scheme/${h.amfi_code}` : '#'} className="hover:underline text-blue-600 block">
                                                    <p className="text-sm font-medium line-clamp-2">{h.scheme_name}</p>
                                                </Link>
                                                <p className="text-xs text-gray-400 mt-0.5 font-mono">{h.isin}</p>
                                            </td>
                                            <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-700 text-right font-mono">
                                                ₹{h.invested_value.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                                            </td>
                                            <td className="px-2 py-4 whitespace-nowrap text-sm text-gray-300 text-center">→</td>
                                            <td className="px-4 py-4 whitespace-nowrap text-sm text-right">
                                                {h.xirr_status === 'VALID' && h.xirr !== undefined ? (
                                                    <span className={`inline-block px-3 py-1 rounded text-sm font-bold ${h.xirr >= 0 ? 'bg-purple-100 text-purple-700' : 'bg-red-100 text-red-700'}`}>
                                                        {h.xirr >= 0 ? '+' : ''}{h.xirr.toFixed(2)}%
                                                    </span>
                                                ) : h.xirr_status === 'ESTIMATED' ? (
                                                    <span className="inline-block px-2 py-1 bg-amber-100 text-amber-800 rounded text-xs font-medium" title="Cannot calculate XIRR without full transaction history.">
                                                        N/A - Estimated
                                                    </span>
                                                ) : h.xirr_status === 'LESS_THAN_1_YEAR' ? (
                                                    <div className="flex flex-col items-end">
                                                        <span className="inline-block px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs font-medium mb-1" title="XIRR mathematically unreliable for <1 year.">
                                                            N/A - &lt;1 Year
                                                        </span>
                                                        <span className={`text-xs font-bold ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
                                                            {isPositive ? '+' : ''}{gainPercent.toFixed(2)}% (Abs)
                                                        </span>
                                                    </div>
                                                ) : (
                                                    <span className="text-gray-400 text-sm">Error</span>
                                                )}
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
