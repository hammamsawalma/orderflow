"use client";

import { useState, useEffect } from "react";
import { ArrowLeft, BarChart3, TrendingUp, TrendingDown, Target, Zap } from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";

// --- TYPE DEF DEFINITIONS (Copied from page.tsx for isolation) ---
type TradeOutcome = 'Hit TP1' | 'Hit Full TP' | 'Stopped Out' | 'Invalidated';

interface AnalysisResult {
    Declared_Winner_Direction: string;
    Calculated_Scores: {
        S_macro_Score: number;
        S_micro_Score: number;
        P_final_Calculation: string;
    };
    Asset_Ticker?: string;
}

interface ChatMessage {
    id: string;
    role: 'user' | 'assistant';
    analysisResult?: AnalysisResult;
}

interface ChatSession {
    id: string;
    title: string;
    messages: ChatMessage[];
    outcome?: TradeOutcome;
    updatedAt: number;
}

// --- INDEXEDDB HELPERS ---
const DB_NAME = 'OrderFlowDB';
const STORE_NAME = 'chats';

const initDB = (): Promise<IDBDatabase> => {
    return new Promise((resolve, reject) => {
        if (typeof window === 'undefined') return reject("No window");
        const request = window.indexedDB.open(DB_NAME, 1);
        request.onupgradeneeded = (e: any) => {
            const db = e.target.result;
            if (!db.objectStoreNames.contains(STORE_NAME)) {
                db.createObjectStore(STORE_NAME);
            }
        };
        request.onsuccess = (e: any) => resolve(e.target.result);
        request.onerror = () => reject(request.error);
    });
};

const loadFromDB = async (key: string) => {
    try {
        const db = await initDB();
        return new Promise<any>((resolve, reject) => {
            const tx = db.transaction(STORE_NAME, 'readonly');
            const store = tx.objectStore(STORE_NAME);
            const req = store.get(key);
            req.onsuccess = () => resolve(req.result);
            req.onerror = () => reject(req.error);
        });
    } catch (e) {
        console.error("IndexedDB Load Error:", e);
    }
};

// --- ANALYTICS DASHBOARD ---
export default function AnalyticsPage() {
    const [stats, setStats] = useState({
        totalSetups: 0,
        wins: 0,
        losses: 0,
        invalidated: 0,
        winRate: 0,
        longWinRate: 0,
        shortWinRate: 0,
        avgMacroScore: 0,
        avgMicroScore: 0,
    });

    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadFromDB('order-flow-chats').then(raw => {
            if (raw) {
                try {
                    const parsed: ChatSession[] = typeof raw === 'string' ? JSON.parse(raw) : raw;

                    if (Array.isArray(parsed)) {
                        const gradedSessions = parsed.filter(s => s.outcome);

                        let wins = 0;
                        let losses = 0;
                        let invalidated = 0;

                        let totalLongs = 0;
                        let wonLongs = 0;

                        let totalShorts = 0;
                        let wonShorts = 0;

                        let macroSum = 0;
                        let microSum = 0;
                        let scoredCount = 0;

                        gradedSessions.forEach(session => {
                            const lastMsg = session.messages[session.messages.length - 1];
                            const direction = lastMsg?.analysisResult?.Declared_Winner_Direction;

                            if (session.outcome === 'Hit TP1' || session.outcome === 'Hit Full TP') {
                                wins++;
                                if (direction === 'LONG') wonLongs++;
                                if (direction === 'SHORT') wonShorts++;
                            } else if (session.outcome === 'Stopped Out') {
                                losses++;
                            } else if (session.outcome === 'Invalidated') {
                                invalidated++;
                            }

                            if (direction === 'LONG' && session.outcome !== 'Invalidated') totalLongs++;
                            if (direction === 'SHORT' && session.outcome !== 'Invalidated') totalShorts++;

                            if (lastMsg?.analysisResult?.Calculated_Scores) {
                                macroSum += lastMsg.analysisResult.Calculated_Scores.S_macro_Score;
                                microSum += lastMsg.analysisResult.Calculated_Scores.S_micro_Score;
                                scoredCount++;
                            }
                        });

                        const totalResolved = wins + losses; // exclude invalidated from pure win rate calculation
                        const winRate = totalResolved > 0 ? (wins / totalResolved) * 100 : 0;
                        const longWinRate = totalLongs > 0 ? (wonLongs / totalLongs) * 100 : 0;
                        const shortWinRate = totalShorts > 0 ? (wonShorts / totalShorts) * 100 : 0;

                        setStats({
                            totalSetups: gradedSessions.length,
                            wins,
                            losses,
                            invalidated,
                            winRate,
                            longWinRate,
                            shortWinRate,
                            avgMacroScore: scoredCount > 0 ? Math.round(macroSum / scoredCount) : 0,
                            avgMicroScore: scoredCount > 0 ? Math.round(microSum / scoredCount) : 0,
                        });
                    }
                } catch (e) {
                    console.error("Failed to parse sessions for analytics", e);
                }
            }
            setLoading(false);
        });
    }, []);

    if (loading) return (
        <div className="min-h-screen bg-[#02050A] flex items-center justify-center">
            <div className="w-8 h-8 border-2 border-[#00FFFF]/30 border-t-[#00FFFF] rounded-full animate-spin"></div>
        </div>
    );

    return (
        <main className="min-h-screen bg-[#02050A] text-white font-sans selection:bg-[#00FFFF]/30 relative overflow-hidden flex flex-col items-center pt-8 md:pt-16 pb-32">

            {/* Background elements */}
            <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-[#00FFFF]/5 blur-[120px] rounded-full pointer-events-none"></div>
            <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-[#FF00FF]/5 blur-[120px] rounded-full pointer-events-none"></div>
            <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center opacity-[0.02] pointer-events-none"></div>

            <div className="w-full max-w-5xl px-4 z-10">
                <header className="flex justify-between items-center mb-12 border-b border-white/5 pb-6">
                    <div>
                        <Link href="/" className="inline-flex items-center gap-2 text-white/40 hover:text-[#00FFFF] text-xs font-mono tracking-widest uppercase transition-colors mb-4">
                            <ArrowLeft className="w-4 h-4" /> Back to Terminal
                        </Link>
                        <h1 className="text-3xl md:text-5xl font-black tracking-tighter flex items-center gap-4">
                            <BarChart3 className="w-8 h-8 md:w-10 md:h-10 text-[#00FFFF]" />
                            Performance Matrix
                        </h1>
                        <p className="text-white/40 text-sm mt-2 font-mono max-w-xl">
                            Real-time quantitative tracker calculating the aggregate mathematical expectancy of the Order Flow AI model.
                        </p>
                    </div>
                </header>

                {stats.totalSetups === 0 ? (
                    <div className="text-center bg-[#050B14]/80 border border-white/5 rounded-2xl p-16">
                        <Target className="w-12 h-12 text-white/10 mx-auto mb-4" />
                        <h2 className="text-xl font-bold text-white mb-2">No Graded Data</h2>
                        <p className="text-white/40 text-sm">Return to the terminal and Resolve Setups on your timeline to begin tracking analytics.</p>
                    </div>
                ) : (
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">

                        {/* Primary Stat Row */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="bg-[#091A3A]/80 border border-[#00FFFF]/20 rounded-3xl p-8 relative overflow-hidden group shadow-[0_20px_50px_rgba(0,0,0,0.5)] shadow-[#00FFFF]/5">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-[#00FFFF]/10 blur-3xl group-hover:bg-[#00FFFF]/20 transition-all"></div>
                                <div className="text-[10px] text-[#00FFFF] uppercase tracking-widest font-bold mb-2 flex items-center gap-2">
                                    <Target className="w-4 h-4" /> Global Win Rate
                                </div>
                                <div className="text-6xl font-black text-white font-mono flex items-baseline gap-2">
                                    {stats.winRate.toFixed(1)}<span className="text-2xl text-[#00FFFF]">%</span>
                                </div>
                                <div className="mt-4 text-sm text-white/40 border-t border-white/10 pt-4 flex justify-between">
                                    <span>Resolved Trades</span>
                                    <span className="text-white font-bold">{stats.wins + stats.losses}</span>
                                </div>
                            </div>

                            <div className="bg-[#050B14]/80 border border-white/10 rounded-3xl p-8 flex flex-col justify-center">
                                <div className="text-[10px] text-green-400 uppercase tracking-widest font-bold mb-2 flex items-center gap-2">
                                    <TrendingUp className="w-4 h-4" /> BSL / LONG Win Rate
                                </div>
                                <div className="text-4xl font-black text-white font-mono flex items-baseline gap-1">
                                    {stats.longWinRate.toFixed(1)}<span className="text-lg text-green-400">%</span>
                                </div>
                            </div>

                            <div className="bg-[#050B14]/80 border border-white/10 rounded-3xl p-8 flex flex-col justify-center">
                                <div className="text-[10px] text-[#FF00FF] uppercase tracking-widest font-bold mb-2 flex items-center gap-2">
                                    <TrendingDown className="w-4 h-4" /> SSL / SHORT Win Rate
                                </div>
                                <div className="text-4xl font-black text-white font-mono flex items-baseline gap-1">
                                    {stats.shortWinRate.toFixed(1)}<span className="text-lg text-[#FF00FF]">%</span>
                                </div>
                            </div>
                        </div>

                        {/* Secondary Stat Row */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div className="bg-[#050B14]/60 border border-white/5 rounded-2xl p-5">
                                <div className="text-[10px] text-white/40 uppercase tracking-widest mb-1">Total Setups Found</div>
                                <div className="text-2xl font-bold font-mono">{stats.totalSetups}</div>
                            </div>
                            <div className="bg-[#050B14]/60 border border-white/5 rounded-2xl p-5 border-l-green-500/30">
                                <div className="text-[10px] text-green-400 uppercase tracking-widest mb-1">Total TP Hits</div>
                                <div className="text-2xl font-bold font-mono text-green-400">{stats.wins}</div>
                            </div>
                            <div className="bg-[#050B14]/60 border border-white/5 rounded-2xl p-5 border-l-red-500/30">
                                <div className="text-[10px] text-red-400 uppercase tracking-widest mb-1">Stopped Out</div>
                                <div className="text-2xl font-bold font-mono text-red-400">{stats.losses}</div>
                            </div>
                            <div className="bg-[#050B14]/60 border border-white/5 rounded-2xl p-5 border-l-orange-500/30">
                                <div className="text-[10px] text-orange-400 uppercase tracking-widest mb-1">Invalidated</div>
                                <div className="text-2xl font-bold font-mono text-orange-400">{stats.invalidated}</div>
                            </div>
                        </div>

                        {/* Engine Metrics */}
                        <div className="mt-8 pt-6 border-t border-white/10">
                            <h3 className="text-[10px] uppercase tracking-widest text-[#00FFFF] mb-6 flex items-center gap-2 font-bold">
                                <Zap className="w-4 h-4" /> Underlying Algorithm Averages
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="bg-[#050B14]/80 border border-[#00FFFF]/10 rounded-2xl p-6 flex justify-between items-center">
                                    <div>
                                        <div className="text-white/50 text-xs font-mono mb-1">Avg Macro Score (S_macro)</div>
                                        <div className="text-[#00FFFF]/70 text-[10px] max-w-[200px]">Average strength of sweeping structure & liquidity density.</div>
                                    </div>
                                    <div className="text-3xl font-black font-mono text-white">{stats.avgMacroScore}</div>
                                </div>
                                <div className="bg-[#050B14]/80 border border-[#FF00FF]/10 rounded-2xl p-6 flex justify-between items-center">
                                    <div>
                                        <div className="text-white/50 text-xs font-mono mb-1">Avg Micro Score (S_micro)</div>
                                        <div className="text-[#FF00FF]/70 text-[10px] max-w-[200px]">Average strength of precise vertical tripartite alignment.</div>
                                    </div>
                                    <div className="text-3xl font-black font-mono text-white">{stats.avgMicroScore}</div>
                                </div>
                            </div>
                        </div>

                    </motion.div>
                )}
            </div>
        </main>
    );
}
