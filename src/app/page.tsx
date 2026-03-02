"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { UploadCloud, CheckCircle2, AlertTriangle, TrendingUp, TrendingDown, Target, Zap, Clock, MessageSquare, Plus, Trash2, ArrowRight, ChevronDown, ChevronUp, Link as LinkIcon, BarChart3 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

// Sub-component for User Image to handle local collapse state
const UserImageMessage = ({ msg, isLatest }: { msg: ChatMessage, isLatest: boolean }) => {
    const [expanded, setExpanded] = useState(isLatest);

    useEffect(() => {
        if (!isLatest) setExpanded(false);
    }, [isLatest]);

    return (
        <div className="relative flex flex-col items-center w-full z-10">
            <div className="w-full max-w-3xl bg-[#091A3A]/80 border border-[#00FFFF]/20 rounded-2xl p-2 shadow-xl backdrop-blur-sm transition-all mt-8">
                <div
                    className="flex justify-between items-center px-4 py-2 cursor-pointer hover:bg-white/5 rounded-xl transition-colors"
                    onClick={() => setExpanded(!expanded)}
                >
                    <div className="flex items-center gap-3 text-[#00FFFF] font-mono text-sm">
                        <UploadCloud className="w-4 h-4" />
                        Market Structure Scan
                    </div>
                    {expanded ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                </div>

                <AnimatePresence>
                    {expanded && (msg.imageUrl || msg.htfImageUrl || msg.ltfImageUrl) && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="overflow-hidden mt-2 flex flex-col gap-3"
                        >
                            {msg.imageUrl && (
                                <img src={msg.imageUrl} alt="Uploaded chart" className="w-full rounded-xl object-contain border border-white/5 bg-black/50 max-h-[500px]" />
                            )}
                            {msg.htfImageUrl && (
                                <div>
                                    <div className="text-[10px] text-white/50 uppercase tracking-widest mb-1">High Timeframe Context (HTF)</div>
                                    <img src={msg.htfImageUrl} alt="HTF chart" className="w-full rounded-xl object-contain border border-white/5 bg-black/50 max-h-[500px]" />
                                </div>
                            )}
                            {msg.ltfImageUrl && (
                                <div>
                                    <div className="text-[10px] text-white/50 uppercase tracking-widest mb-1">Low Timeframe Engine (LTF)</div>
                                    <img src={msg.ltfImageUrl} alt="LTF chart" className="w-full rounded-xl object-contain border border-white/5 bg-black/50 max-h-[500px]" />
                                </div>
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Render the user's optional comment if provided */}
                {msg.text && (
                    <div className="mt-3 text-sm text-[#00FFFF] bg-[#00FFFF]/5 border border-[#00FFFF]/20 rounded-xl p-3 font-mono leading-relaxed">
                        <span className="opacity-50 text-[10px] uppercase tracking-widest block mb-1">User Note</span>
                        {msg.text}
                    </div>
                )}
            </div>
            {/* The descending Timeline Stem */}
            <div className="w-0.5 h-12 bg-gradient-to-b from-[#00FFFF]/50 to-[#00FFFF]/10 my-2"></div>
        </div>
    );
};

// --- DATA MODELS ---
interface AnalysisResult {
    Timestamp: string;
    Timeframe_Verified: string;
    Data_Quality_Assessment?: string;
    Sweep_Type_Detected: string;
    Tripartite_Confluence_Status: boolean;
    Declared_Winner_Direction: string;
    Suggested_Entry_Zone?: [number, number];
    Target_X_Long_Price: number;
    Target_Y_Short_Price: number;
    Take_Profit_Targets?: number[];
    Recommended_Stop_Loss?: number;
    Long_Probability_Percentage: number;
    Short_Probability_Percentage: number;
    Detailed_Logical_Synthesis: string;
    Calculated_Scores: {
        S_macro_Score: number;
        S_micro_Score: number;
        P_final_Calculation: string;
    };
}

interface ChatMessage {
    id: string;
    role: 'user' | 'assistant';
    text?: string;
    imageBase64?: string;
    imageUrl?: string;
    htfImageBase64?: string;
    htfImageUrl?: string;
    ltfImageBase64?: string;
    ltfImageUrl?: string;
    analysisResult?: AnalysisResult;
    timestamp: number;
}

export type TradeOutcome = 'Hit TP1' | 'Hit Full TP' | 'Stopped Out' | 'Invalidated';

export interface ChatSession {
    id: string;
    title: string;
    messages: ChatMessage[];
    outcome?: TradeOutcome;
    updatedAt: number;
}

// --- INDEXEDDB HELPERS FOR LARGE STORAGE ---
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

const saveToDB = async (key: string, data: any) => {
    try {
        const db = await initDB();
        return new Promise<void>((resolve, reject) => {
            const tx = db.transaction(STORE_NAME, 'readwrite');
            const store = tx.objectStore(STORE_NAME);
            store.put(data, key);
            tx.oncomplete = () => resolve();
            tx.onerror = () => reject(tx.error);
        });
    } catch (e) {
        console.error("IndexedDB Save Error:", e);
    }
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
        return null;
    }
};

const deleteFromDB = async (key: string) => {
    try {
        const db = await initDB();
        return new Promise<void>((resolve, reject) => {
            const tx = db.transaction(STORE_NAME, 'readwrite');
            const store = tx.objectStore(STORE_NAME);
            store.delete(key);
            tx.oncomplete = () => resolve();
            tx.onerror = () => reject(tx.error);
        });
    } catch (e) {
        console.error("IndexedDB Delete Error:", e);
    }
};

export default function Home() {
    // --- STATE ---
    const [sessions, setSessions] = useState<ChatSession[]>([]);
    const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
    const [analyzing, setAnalyzing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [draftComment, setDraftComment] = useState("");
    const [draftHtfFile, setDraftHtfFile] = useState<File | null>(null);
    const [draftLtfFile, setDraftLtfFile] = useState<File | null>(null);

    const htfInputRef = useRef<HTMLInputElement>(null);
    const ltfInputRef = useRef<HTMLInputElement>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Auto-scroll to bottom of chat
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [sessions, activeSessionId, analyzing]);

    // --- INDEXEDDB SYNC ---
    useEffect(() => {
        // Load sessions from IndexedDB on initial mount
        loadFromDB('order-flow-chats').then(raw => {
            if (raw) {
                try {
                    const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
                    if (Array.isArray(parsed)) {
                        setSessions(parsed);
                        if (parsed.length > 0) setActiveSessionId(parsed[0].id);
                    }
                } catch (e) {
                    console.error("Failed to parse sessions from IndexedDB", e);
                }
            }
        });
    }, []);

    useEffect(() => {
        // Save sessions to IndexedDB whenever they change.
        if (sessions.length > 0) {
            saveToDB('order-flow-chats', JSON.stringify(sessions));
        }
    }, [sessions]);

    // --- SESSION MANAGEMENT ---
    const activeSession = sessions.find(s => s.id === activeSessionId);

    const createNewSession = () => {
        const newSession: ChatSession = {
            id: Date.now().toString(),
            title: `Analysis Protocol ${sessions.length + 1}`,
            messages: [],
            updatedAt: Date.now()
        };
        setSessions([newSession, ...sessions]);
        setActiveSessionId(newSession.id);
    };

    const deleteSession = (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        const updated = sessions.filter(s => s.id !== id);
        setSessions(updated);
        if (activeSessionId === id && updated.length > 0) {
            setActiveSessionId(updated[0].id);
        } else if (updated.length === 0) {
            setActiveSessionId(null);
            deleteFromDB('order-flow-chats');
        }
    };

    const resolveSetup = (sessionId: string, outcome: TradeOutcome) => {
        setSessions(prev => prev.map(s => {
            if (s.id === sessionId) {
                return { ...s, outcome, updatedAt: Date.now() };
            }
            return s;
        }));
    };

    const handleFileDrop = (e: React.DragEvent) => {
        e.preventDefault();
        const droppedFile = e.dataTransfer.files[0];
        if (droppedFile && droppedFile.type.startsWith("image/")) {
            if (!draftHtfFile) {
                setDraftHtfFile(droppedFile);
            } else if (!draftLtfFile) {
                setDraftLtfFile(droppedFile);
            }
        }
    };

    const fileToBase64 = (file: File): Promise<{ base64String: string, base64Data: string }> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => {
                const base64String = reader.result as string;
                const base64Data = base64String.split(',')[1];
                resolve({ base64String, base64Data });
            };
            reader.onerror = error => reject(error);
        });
    };

    const removeDraftFile = (type: 'HTF' | 'LTF', e: React.MouseEvent) => {
        e.stopPropagation();
        if (type === 'HTF') setDraftHtfFile(null);
        if (type === 'LTF') setDraftLtfFile(null);
    };

    const transmitFiles = async () => {
        if (!draftHtfFile && !draftLtfFile) {
            setError("Quantitative format error. Provide at least one HTF or LTF chart image.");
            return;
        }

        setError(null);
        setAnalyzing(true);

        let currentSessionId = activeSessionId;
        if (!currentSessionId) {
            currentSessionId = Date.now().toString();
            setActiveSessionId(currentSessionId);
            setSessions([{ id: currentSessionId, title: "New Analysis", messages: [], updatedAt: Date.now() }]);
        }

        try {
            const currentComment = draftComment.trim();
            const userMsgId = Date.now().toString();

            let htfData = null;
            let ltfData = null;

            if (draftHtfFile) htfData = await fileToBase64(draftHtfFile);
            if (draftLtfFile) ltfData = await fileToBase64(draftLtfFile);

            const userMessage: ChatMessage = {
                id: userMsgId,
                role: 'user',
                text: currentComment || undefined,
                htfImageBase64: htfData?.base64Data,
                htfImageUrl: htfData?.base64String,
                ltfImageBase64: ltfData?.base64Data,
                ltfImageUrl: ltfData?.base64String,
                timestamp: Date.now()
            };

            // Fallback for visual backward compatibility if only 1 image uploaded (assumes old single-image style)
            if (draftHtfFile && !draftLtfFile) {
                userMessage.imageBase64 = htfData?.base64Data;
                userMessage.imageUrl = htfData?.base64String;
                userMessage.htfImageBase64 = undefined;
                userMessage.htfImageUrl = undefined;
            } else if (!draftHtfFile && draftLtfFile) {
                userMessage.imageBase64 = ltfData?.base64Data;
                userMessage.imageUrl = ltfData?.base64String;
                userMessage.ltfImageBase64 = undefined;
                userMessage.ltfImageUrl = undefined;
            }

            setDraftComment("");
            setDraftHtfFile(null);
            setDraftLtfFile(null);

            setSessions(prev => prev.map(s => {
                if (s.id === currentSessionId) {
                    return { ...s, messages: [...s.messages, userMessage], updatedAt: Date.now() };
                }
                return s;
            }));

            // Extract history for API from the current scope closure
            const currentSession = sessions.find(s => s.id === currentSessionId);
            const historyContext = currentSession?.messages.map(m => {
                if (m.role === 'user') {
                    return {
                        role: m.role,
                        imageBase64: m.imageBase64,
                        htfImageBase64: m.htfImageBase64,
                        ltfImageBase64: m.ltfImageBase64,
                        text: m.text
                    };
                } else if (m.role === 'assistant') {
                    // Pass the previous JSON output back so the AI can anchor its targets
                    return { role: m.role, text: JSON.stringify(m.analysisResult) };
                }
            }).filter(Boolean) || [];

            // Fire API Call in background (outside of any setState updater to prevent React StrictMode double-firing)
            fetch('/api/analyze', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    imageBase64: userMessage.imageBase64,
                    htfImageBase64: userMessage.htfImageBase64,
                    ltfImageBase64: userMessage.ltfImageBase64,
                    chatHistory: historyContext,
                    comment: currentComment || undefined
                }),
            })
                .then(res => res.json())
                .then(data => {
                    if (data.error) throw new Error(data.error);

                    // 3. Add Assistant Message
                    const resultMessage: ChatMessage = {
                        id: (Date.now() + 1).toString(),
                        role: 'assistant',
                        analysisResult: data.analysis,
                        timestamp: Date.now()
                    };

                    setSessions(prev => prev.map(s => {
                        if (s.id === currentSessionId) {
                            // If this is the very first bot response, update the chat title dynamically
                            const isFirstMessage = s.messages.length <= 2;
                            let newTitle = s.title;
                            if (isFirstMessage) {
                                if (data.analysis.Asset_Ticker) {
                                    newTitle = `${data.analysis.Asset_Ticker} ${data.analysis.Declared_Winner_Direction !== 'INSUFFICIENT_DATA' ? data.analysis.Declared_Winner_Direction : ''}`.trim();
                                } else if (data.analysis.Declared_Winner_Direction && data.analysis.Declared_Winner_Direction !== 'INSUFFICIENT_DATA') {
                                    newTitle = `${data.analysis.Declared_Winner_Direction} SETUP`;
                                }
                            }

                            return { ...s, title: newTitle, messages: [...s.messages, resultMessage], updatedAt: Date.now() };
                        }
                        return s;
                    }));
                    setAnalyzing(false);
                })
                .catch(err => {
                    console.error(err);
                    setError(err.message || "Failed to analyze image");
                    setAnalyzing(false);
                });
        } catch (err: any) {
            console.error(err);
            setError(err.message);
            setAnalyzing(false);
        }
    };

    const renderWinnerBadge = (direction: string) => {
        const styles: Record<string, string> = {
            LONG: "bg-[#00FFFF] text-[#050B14] shadow-[0_0_30px_rgba(0,255,255,0.3)]",
            SHORT: "bg-[#FF00FF] text-white shadow-[0_0_30px_rgba(255,0,255,0.3)]",
            SCALP: "bg-[#FFFF00] text-black shadow-[0_0_30px_rgba(255,255,0,0.3)]",
            STANDBY: "bg-gray-700 text-white",
            NONE: "bg-red-900 text-white",
            UNCERTAIN: "bg-orange-800 text-white",
            INSUFFICIENT_DATA: "bg-red-600 text-white animate-pulse shadow-[0_0_30px_rgba(255,0,0,0.4)]",
        };
        const activeStyle = styles[direction] || "bg-gray-800 text-white";

        return (
            <div className={`mt-4 w-full py-3 text-center font-black text-2xl tracking-[0.2em] rounded-lg ${activeStyle}`}>
                {direction === 'INSUFFICIENT_DATA' ? '⚠ INSUFFICIENT DATA' : direction}
            </div>
        );
    };

    // Helper to detect bias shifts
    const getPreviousDirection = (currentIndex: number) => {
        if (!activeSession) return null;
        for (let i = currentIndex - 1; i >= 0; i--) {
            if (activeSession.messages[i].role === 'assistant' && activeSession.messages[i].analysisResult) {
                return activeSession.messages[i].analysisResult!.Declared_Winner_Direction;
            }
        }
        return null;
    };

    return (
        <main className="min-h-screen bg-[#020612] text-white font-sans selection:bg-[#00FFFF] selection:text-black flex h-screen overflow-hidden">

            {/* Sidebar (Chat History) */}
            <aside className="w-80 bg-[#050B14] border-r border-white/5 flex flex-col h-full shrink-0 hidden md:flex z-50 shadow-2xl">
                <div className="p-6 border-b border-white/5">
                    <h1 className="text-xl font-black tracking-widest bg-gradient-to-r from-white to-white/50 bg-clip-text text-transparent flex items-center gap-3">
                        <Zap className="w-5 h-5 text-[#00FFFF]" /> ORDER FLOW AI
                    </h1>

                    <button
                        onClick={createNewSession}
                        className="mt-6 w-full py-3 px-4 bg-gradient-to-r from-[#00FFFF]/10 to-[#00FFFF]/5 hover:from-[#00FFFF]/20 hover:to-[#00FFFF]/10 border border-[#00FFFF]/30 rounded-xl flex items-center justify-center gap-2 text-[#00FFFF] font-bold text-sm transition-all shadow-lg shadow-[#00FFFF]/5"
                    >
                        <Plus className="w-4 h-4" /> NEW SEQUENCE
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-2 custom-scrollbar">
                    {sessions.map(session => (
                        <div
                            key={session.id}
                            onClick={() => setActiveSessionId(session.id)}
                            className={`p-3 rounded-xl flex items-center justify-between cursor-pointer group transition-all ${activeSessionId === session.id ? 'bg-[#00FFFF]/10 border border-[#00FFFF]/30 shadow-inner' : 'hover:bg-white/5 border border-transparent'}`}
                        >
                            <div className="flex items-center gap-3 truncate">
                                <MessageSquare className={`w-4 h-4 shrink-0 ${activeSessionId === session.id ? 'text-[#00FFFF]' : 'text-gray-600'}`} />
                                <span className={`text-sm truncate tracking-wide ${activeSessionId === session.id ? 'text-white font-bold' : 'text-gray-400 font-medium'}`}>
                                    {session.title}
                                </span>
                            </div>
                            <button
                                onClick={(e) => deleteSession(e, session.id)}
                                className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-500/20 rounded text-gray-500 hover:text-red-400 transition-all"
                            >
                                <Trash2 className="w-4 h-4" />
                            </button>
                        </div>
                    ))}

                    {sessions.length === 0 && (
                        <div className="text-center text-gray-600 text-xs font-mono tracking-widest mt-10 uppercase">
                            No active sequences
                        </div>
                    )}
                </div>

                <div className="p-4 border-t border-white/5 bg-black/20 mt-auto">
                    <Link href="/analytics" className="w-full py-3 bg-[#091A3A]/40 hover:bg-[#091A3A]/80 border border-white/10 hover:border-[#00FFFF]/30 rounded-xl flex items-center justify-center gap-2 text-white/70 hover:text-[#00FFFF] text-xs font-mono font-bold transition-all uppercase tracking-widest shadow-lg">
                        <BarChart3 className="w-4 h-4" /> Performance Matrix
                    </Link>
                </div>
            </aside>

            {/* Main Chat Interface */}
            <section className="flex-1 flex flex-col h-full relative bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-[#091A3A]/20 via-[#020612] to-[#020612]">

                {/* Mobile Header */}
                <header className="md:hidden p-4 border-b border-white/5 bg-[#050B14] flex items-center justify-between z-50 shadow-xl">
                    <h1 className="text-lg font-black tracking-widest bg-gradient-to-r from-white to-white/50 bg-clip-text text-transparent flex items-center gap-2">
                        <Zap className="w-4 h-4 text-[#00FFFF]" /> ORDER FLOW AI
                    </h1>
                    <button onClick={createNewSession} className="p-2 bg-[#00FFFF]/10 rounded-lg text-[#00FFFF]">
                        <Plus className="w-5 h-5" />
                    </button>
                </header>

                {/* Timeline Area */}
                <div className="flex-1 overflow-y-auto p-4 md:p-8 custom-scrollbar relative z-10 pb-48" ref={messagesEndRef}>
                    {!activeSession || activeSession.messages.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-center max-w-lg mx-auto mt-20">
                            <motion.div
                                initial={{ scale: 0.9, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                transition={{ duration: 0.5 }}
                                className="w-24 h-24 rounded-full bg-gradient-to-b from-[#00FFFF]/20 to-transparent flex items-center justify-center text-[#00FFFF] mb-8 shadow-[0_0_50px_rgba(0,255,255,0.1)] border border-[#00FFFF]/20"
                            >
                                <Zap className="w-10 h-10" />
                            </motion.div>
                            <h2 className="text-3xl font-black text-white mb-4 tracking-tight">Initialize Protocol</h2>
                            <p className="text-gray-400 leading-relaxed text-sm">
                                Establish a new contextual timeline. Upload an initial Exocharts scan below. Subsequent uploads in this sequence will be dynamically compounded against prior data.
                            </p>
                        </div>
                    ) : (
                        <div className="max-w-4xl mx-auto flex flex-col items-center relative">
                            <AnimatePresence>
                                {activeSession.messages.map((msg, index) => {

                                    const allUserMsgs = activeSession.messages.filter(m => m.role === 'user');
                                    const isAbsoluteLatestUser = msg.id === allUserMsgs[allUserMsgs.length - 1]?.id;

                                    if (msg.role === 'user') {
                                        return <UserImageMessage key={msg.id} msg={msg} isLatest={isAbsoluteLatestUser} />;
                                    }

                                    // ASSISTANT MESSAGE
                                    const prevDirection = getPreviousDirection(index);
                                    const currentDirection = msg.analysisResult?.Declared_Winner_Direction;
                                    const hasBiasShift = prevDirection && currentDirection && prevDirection !== currentDirection && prevDirection !== 'INSUFFICIENT_DATA';

                                    return (
                                        <motion.div
                                            key={msg.id}
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            className="w-full flex flex-col items-center z-10 mb-8"
                                        >
                                            <div className="w-full bg-[#050B14]/90 backdrop-blur-xl border border-white/10 rounded-2xl p-6 md:p-8 shadow-2xl relative overflow-hidden">

                                                {/* Top Accent Line */}
                                                <div className={`absolute top-0 left-0 w-full h-1 
                                                    ${currentDirection === 'LONG' ? 'bg-[#00FFFF] shadow-[0_0_20px_#00FFFF]' : ''}
                                                    ${currentDirection === 'SHORT' ? 'bg-[#FF00FF] shadow-[0_0_20px_#FF00FF]' : ''}
                                                    ${currentDirection === 'INSUFFICIENT_DATA' ? 'bg-red-500 shadow-[0_0_20px_red]' : ''}
                                                `}></div>

                                                {/* Bias Shift Badge */}
                                                {hasBiasShift && (
                                                    <div className="absolute top-4 right-4 bg-orange-500/20 border border-orange-500/50 text-orange-400 text-xs px-3 py-1 rounded-full font-bold tracking-widest flex items-center gap-2 animate-pulse">
                                                        <AlertTriangle className="w-3 h-3" /> BIAS SHIFT DETECTED
                                                    </div>
                                                )}

                                                {msg.analysisResult ? (
                                                    <>
                                                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6 mt-2">
                                                            <div>
                                                                <h2 className="text-sm font-bold flex items-center gap-2 tracking-widest text-white/50 uppercase">
                                                                    <Target className="w-4 h-4 text-[#00FFFF]" /> Inference Output
                                                                </h2>
                                                                <div className="flex items-center gap-4 text-white/40 text-[10px] font-mono mt-2">
                                                                    <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {msg.analysisResult.Timestamp}</span>
                                                                    <span className="flex items-center gap-1"><Target className="w-3 h-3" /> {msg.analysisResult.Timeframe_Verified}</span>
                                                                </div>
                                                            </div>

                                                            {msg.analysisResult.Declared_Winner_Direction !== 'INSUFFICIENT_DATA' && (
                                                                <div className="text-right border border-white/5 bg-black/40 px-6 py-2 rounded-xl">
                                                                    <div className="text-[9px] text-white/40 uppercase tracking-widest mb-1">P_Final Conviction</div>
                                                                    <div className="text-2xl font-black font-mono text-white">
                                                                        {msg.analysisResult.Calculated_Scores.P_final_Calculation.split("=")[1]?.trim() || msg.analysisResult.Calculated_Scores.P_final_Calculation}
                                                                    </div>
                                                                </div>
                                                            )}
                                                        </div>

                                                        {renderWinnerBadge(msg.analysisResult.Declared_Winner_Direction)}

                                                        {msg.analysisResult.Declared_Winner_Direction === 'INSUFFICIENT_DATA' ? (
                                                            <div className="bg-red-950/30 p-4 rounded-xl border border-red-500/30 my-6">
                                                                <h3 className="text-red-400 text-xs font-bold flex items-center gap-2 mb-2 uppercase tracking-widest">
                                                                    <AlertTriangle className="w-4 h-4" /> Quality Control Failure
                                                                </h3>
                                                                <p className="text-red-200/80 text-sm leading-relaxed">
                                                                    {msg.analysisResult.Data_Quality_Assessment}
                                                                </p>
                                                            </div>
                                                        ) : (
                                                            <>
                                                                <div className="bg-white/5 p-4 rounded-xl border border-white/5 my-6 flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                                                                    <div className="flex-1">
                                                                        <div className="text-[9px] text-white/40 uppercase tracking-widest mb-1">Detected Sweep</div>
                                                                        <div className="text-sm font-bold text-white tracking-wide">{msg.analysisResult.Sweep_Type_Detected}</div>
                                                                    </div>
                                                                    <div className="flex-1 sm:text-right border-t sm:border-t-0 sm:border-l border-white/10 pt-3 sm:pt-0 sm:pl-4">
                                                                        <div className="text-[9px] text-white/40 uppercase tracking-widest mb-1">Tripartite Confluence</div>
                                                                        <div className={`text-sm font-bold tracking-wide flex items-center sm:justify-end gap-2 ${msg.analysisResult.Tripartite_Confluence_Status ? "text-green-400" : "text-red-400"}`}>
                                                                            {msg.analysisResult.Tripartite_Confluence_Status ? <><CheckCircle2 className="w-4 h-4" /> Verified OK</> : <><AlertTriangle className="w-4 h-4" /> Failed</>}
                                                                        </div>
                                                                    </div>
                                                                </div>

                                                                {/* Dynamic Targets based on Bias */}
                                                                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-6">
                                                                    <div className="md:col-span-3 bg-[#091A3A]/30 p-5 rounded-xl border border-[#00FFFF]/20 flex flex-col items-center justify-center text-center">
                                                                        <div className="text-[#00FFFF]/80 text-[10px] uppercase tracking-widest font-bold mb-1">Optimal Entry Zone</div>
                                                                        <div className="font-mono text-2xl font-bold text-white">
                                                                            {msg.analysisResult.Suggested_Entry_Zone ? `${msg.analysisResult.Suggested_Entry_Zone[0]} — ${msg.analysisResult.Suggested_Entry_Zone[1]}` : 'Awaiting Data'}
                                                                        </div>
                                                                    </div>

                                                                    <div className="bg-black/50 p-4 rounded-xl border border-white/5 border-l border-l-[#00FFFF]">
                                                                        <div className="text-white/40 text-[9px] mb-1 uppercase tracking-widest flex items-center gap-1"><TrendingUp className="w-3 h-3 text-[#00FFFF]" /> Target X (BSL)</div>
                                                                        <div className="text-lg font-mono text-white mb-2">{msg.analysisResult.Target_X_Long_Price}</div>
                                                                        <div className="text-[10px] text-[#00FFFF] font-mono whitespace-nowrap overflow-x-auto custom-scrollbar bg-[#00FFFF]/10 px-2 py-1 rounded inline-block max-w-full">
                                                                            TP: {msg.analysisResult.Take_Profit_Targets?.join(" → ")}
                                                                        </div>
                                                                    </div>

                                                                    <div className="bg-black/50 p-4 rounded-xl border border-white/5 border-l border-l-[#FF00FF]">
                                                                        <div className="text-white/40 text-[9px] mb-1 uppercase tracking-widest flex items-center gap-1"><TrendingDown className="w-3 h-3 text-[#FF00FF]" /> Target Y (SSL)</div>
                                                                        <div className="text-lg font-mono text-white mb-2">{msg.analysisResult.Target_Y_Short_Price}</div>
                                                                        <div className="text-[10px] text-[#FF00FF] font-mono bg-[#FF00FF]/10 px-2 py-1 rounded inline-block">
                                                                            SL: {msg.analysisResult.Recommended_Stop_Loss}
                                                                        </div>
                                                                    </div>

                                                                    <div className="bg-black/50 p-4 rounded-xl border border-white/5 flex flex-col justify-center">
                                                                        <div className="text-white/40 text-[9px] mb-2 uppercase tracking-widest">Score Weights</div>
                                                                        <div className="flex justify-between items-center mb-1 text-xs font-mono">
                                                                            <span className="text-white/60">S_macro</span>
                                                                            <span className="text-white font-bold">{msg.analysisResult.Calculated_Scores.S_macro_Score}</span>
                                                                        </div>
                                                                        <div className="flex justify-between items-center text-xs font-mono border-t border-white/10 pt-1">
                                                                            <span className="text-white/60">S_micro</span>
                                                                            <span className="text-white font-bold">{msg.analysisResult.Calculated_Scores.S_micro_Score}</span>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </>
                                                        )}

                                                        <div className="mt-8 pt-6 border-t border-white/10 relative">
                                                            <h3 className="text-[10px] uppercase tracking-widest text-[#00FFFF] mb-3 flex items-center gap-2">
                                                                <LinkIcon className="w-3 h-3" /> Synthesis & Compounding Evidence
                                                            </h3>
                                                            <div className="text-white/70 leading-relaxed text-sm whitespace-pre-wrap font-light relative">
                                                                {msg.analysisResult.Detailed_Logical_Synthesis}
                                                            </div>
                                                        </div>
                                                    </>
                                                ) : (
                                                    <div className="text-red-500">System Error parsing AI output.</div>
                                                )}
                                            </div>

                                            {/* Continuation Timeline Stem downwards */}
                                            {index !== activeSession.messages.length - 1 && (
                                                <div className="w-0.5 h-16 bg-gradient-to-b from-white/20 to-white/5 my-2"></div>
                                            )}
                                        </motion.div>
                                    );
                                })}
                            </AnimatePresence>

                            {/* Resolve Setup Panel - Trade Journaling */}
                            {(() => {
                                const lastMsg = activeSession.messages[activeSession.messages.length - 1];
                                if (!analyzing && lastMsg?.role === 'assistant' &&
                                    (lastMsg.analysisResult?.Declared_Winner_Direction === 'LONG' || lastMsg.analysisResult?.Declared_Winner_Direction === 'SHORT')) {

                                    return (
                                        <div className="w-full max-w-2xl mx-auto mt-4 mb-8">
                                            {activeSession.outcome ? (
                                                <div className="bg-[#050B14]/80 border border-white/10 rounded-xl p-4 flex items-center justify-between text-sm shadow-xl">
                                                    <span className="text-white/50 font-mono tracking-widest pl-2 uppercase text-[10px]">Setup Resolved:</span>
                                                    <div className="flex gap-4 items-center">
                                                        <span className={`font-bold px-4 py-2 rounded-lg tracking-widest uppercase text-xs ${activeSession.outcome.includes('TP') ? 'text-green-400 bg-green-400/10 outline outline-1 outline-green-400/30' :
                                                            activeSession.outcome === 'Stopped Out' ? 'text-red-400 bg-red-400/10 outline outline-1 outline-red-400/30' :
                                                                'text-orange-400 bg-orange-400/10 outline outline-1 outline-orange-400/30'
                                                            }`}>{activeSession.outcome}</span>
                                                        <button onClick={() => resolveSetup(activeSession.id, undefined as any)} className="text-white/30 hover:text-white/70 text-xs underline decoration-white/20 underline-offset-4">Undo</button>
                                                    </div>
                                                </div>
                                            ) : (
                                                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-[#091A3A]/60 border border-[#00FFFF]/20 rounded-2xl p-6 shadow-xl backdrop-blur-md relative overflow-hidden">
                                                    <div className="absolute top-0 right-0 w-32 h-32 bg-[#00FFFF]/5 blur-3xl"></div>
                                                    <h3 className="text-[#00FFFF] text-xs uppercase tracking-widest font-bold mb-4 text-center">Grade Trade Outcome</h3>
                                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 relative z-10">
                                                        <button onClick={() => resolveSetup(activeSession.id, 'Hit TP1')} className="px-3 py-3 text-xs font-bold text-green-400 border border-green-400/30 bg-green-400/5 hover:bg-green-400/20 rounded-xl transition-all shadow-[0_0_15px_rgba(74,222,128,0.1)] hover:shadow-[0_0_20px_rgba(74,222,128,0.2)]">Hit TP1</button>
                                                        <button onClick={() => resolveSetup(activeSession.id, 'Hit Full TP')} className="px-3 py-3 text-xs font-bold text-green-500 border border-green-500/30 bg-green-500/5 hover:bg-green-500/20 rounded-xl transition-all shadow-[0_0_15px_rgba(34,197,94,0.1)] hover:shadow-[0_0_20px_rgba(34,197,94,0.2)]">Hit Full TP</button>
                                                        <button onClick={() => resolveSetup(activeSession.id, 'Stopped Out')} className="px-3 py-3 text-xs font-bold text-red-400 border border-red-400/30 bg-red-400/5 hover:bg-red-400/20 rounded-xl transition-all shadow-[0_0_15px_rgba(248,113,113,0.1)] hover:shadow-[0_0_20px_rgba(248,113,113,0.2)]">Stopped Out</button>
                                                        <button onClick={() => resolveSetup(activeSession.id, 'Invalidated')} className="px-3 py-3 text-xs font-bold text-orange-400 border border-orange-400/30 bg-orange-400/5 hover:bg-orange-400/20 rounded-xl transition-all shadow-[0_0_15px_rgba(251,146,60,0.1)] hover:shadow-[0_0_20px_rgba(251,146,60,0.2)]">Invalidated</button>
                                                    </div>
                                                </motion.div>
                                            )}
                                        </div>
                                    );
                                }
                                return null;
                            })()}

                            {analyzing && (
                                <div className="w-full flex flex-col items-center">
                                    <div className="w-0.5 h-12 bg-gradient-to-b from-white/20 to-[#00FFFF]/50 my-2"></div>
                                    <div className="w-full bg-[#050B14]/90 backdrop-blur-xl border border-[#00FFFF]/30 rounded-2xl p-6 flex flex-col items-center justify-center space-y-4 shadow-[0_0_30px_rgba(0,255,255,0.05)]">
                                        <div className="w-8 h-8 border-2 border-[#00FFFF]/30 border-t-[#00FFFF] rounded-full animate-spin"></div>
                                        <div className="font-mono text-[#00FFFF] text-[10px] uppercase animate-pulse tracking-[0.2em]">
                                            Synthesizing Temporal Evolution...
                                        </div>
                                    </div>
                                </div>
                            )}
                            <div className="h-40" />
                        </div>
                    )}
                </div>

                {/* Floating Navigation / Upload Dock */}
                <div className="absolute bottom-0 left-0 w-full p-4 md:p-8 z-50 pointer-events-none">
                    <div className="max-w-3xl mx-auto pointer-events-auto">
                        {error && (
                            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-4 p-4 rounded-xl bg-red-950/90 backdrop-blur-md border border-red-500/50 flex items-start gap-3 shadow-2xl">
                                <AlertTriangle className="w-5 h-5 text-red-500 shrink-0" />
                                <p className="text-red-200 text-sm font-medium">{error}</p>
                            </motion.div>
                        )}

                        <div
                            className="bg-[#091A3A]/80 backdrop-blur-2xl border border-white/20 rounded-2xl p-3 shadow-[0_20px_50px_rgba(0,0,0,0.7)] transition-all flex flex-col md:flex-row items-center gap-4"
                            onDragOver={(e) => e.preventDefault()}
                            onDrop={handleFileDrop}
                        >
                            <input type="file" ref={htfInputRef} className="hidden" accept="image/*" onChange={(e) => e.target.files?.[0] && setDraftHtfFile(e.target.files[0])} />
                            <input type="file" ref={ltfInputRef} className="hidden" accept="image/*" onChange={(e) => e.target.files?.[0] && setDraftLtfFile(e.target.files[0])} />

                            <div className="flex flex-col sm:flex-row items-center gap-2 w-full md:w-auto">
                                {/* HTF Button */}
                                <div
                                    onClick={() => !draftHtfFile && htfInputRef.current?.click()}
                                    className={`relative h-12 px-4 rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer border ${draftHtfFile ? 'bg-[#00FFFF]/20 border-[#00FFFF] text-white' : 'bg-black/40 border-white/5 text-white/50 hover:bg-[#00FFFF]/10 hover:text-[#00FFFF]'}`}
                                >
                                    <UploadCloud className="w-4 h-4 shrink-0" />
                                    <span className="text-xs font-bold whitespace-nowrap">{draftHtfFile ? 'HTF Loaded' : 'Add HTF'}</span>
                                    {draftHtfFile && <Trash2 className="w-4 h-4 text-red-400 hover:text-red-300 ml-2" onClick={(e) => removeDraftFile('HTF', e)} />}
                                </div>

                                {/* LTF Button */}
                                <div
                                    onClick={() => !draftLtfFile && ltfInputRef.current?.click()}
                                    className={`relative h-12 px-4 rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer border ${draftLtfFile ? 'bg-[#FF00FF]/20 border-[#FF00FF] text-white' : 'bg-black/40 border-white/5 text-white/50 hover:bg-[#FF00FF]/10 hover:text-[#FF00FF]'}`}
                                >
                                    <Zap className="w-4 h-4 shrink-0" />
                                    <span className="text-xs font-bold whitespace-nowrap">{draftLtfFile ? 'LTF Loaded' : 'Add LTF'}</span>
                                    {draftLtfFile && <Trash2 className="w-4 h-4 text-red-400 hover:text-red-300 ml-2" onClick={(e) => removeDraftFile('LTF', e)} />}
                                </div>
                            </div>

                            <input
                                type="text"
                                placeholder="Optional: Add context..."
                                value={draftComment}
                                onChange={(e) => setDraftComment(e.target.value)}
                                className="w-full md:w-auto flex-1 bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-white/30 focus:outline-none focus:border-[#00FFFF]/40 focus:ring-1 focus:ring-[#00FFFF]/40 transition-all font-mono"
                            />

                            <div
                                onClick={transmitFiles}
                                className={`w-full md:w-auto px-5 py-3 rounded-xl font-bold text-[10px] uppercase tracking-widest flex justify-center items-center gap-2 transition-all shadow-lg shrink-0 text-black ${draftHtfFile || draftLtfFile ? 'bg-white hover:bg-[#00FFFF] cursor-pointer' : 'bg-white/50 cursor-not-allowed opacity-50'}`}
                            >
                                Transmit <ArrowRight className="w-3 h-3 block" />
                            </div>
                        </div>
                    </div>
                </div>

            </section>
        </main>
    );
}

