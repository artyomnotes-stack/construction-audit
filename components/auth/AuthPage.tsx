
import React, { useState } from 'react';
import { auth, db } from '../../services/firebase';
import {
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    sendPasswordResetEmail
} from 'firebase/auth';
import { doc, setDoc, Timestamp } from 'firebase/firestore';

type AuthMode = 'login' | 'signup' | 'reset';

const AuthPage: React.FC = () => {
    const [authMode, setAuthMode] = useState<AuthMode>('login');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [authError, setAuthError] = useState<string | null>(null);
    const [message, setMessage] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    const handleAuth = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setAuthError(null);
        setMessage(null);
        try {
            if (authMode === 'login') {
                await signInWithEmailAndPassword(auth, email, password);
            } else if (authMode === 'signup') {
                const userCred = await createUserWithEmailAndPassword(auth, email, password);
                await setDoc(doc(db, 'users', userCred.user.uid), {
                    email: userCred.user.email,
                    subscriptionActive: false,
                    expiryDate: Timestamp.fromDate(new Date()),
                    lastPaymentDate: Timestamp.fromDate(new Date()),
                    subscription: {
                        active: false,
                        expiry: Timestamp.fromDate(new Date())
                    }
                });
            } else if (authMode === 'reset') {
                await sendPasswordResetEmail(auth, email);
                setMessage("Գաղտնաբառի վերականգնման հղումն ուղարկվել է ձեր էլ. փոստին:");
            }
        } catch (err: any) {
            let errorMsg = err.message;
            if (err.code === 'auth/user-not-found') errorMsg = "Օգտատերը չի գտնվել:";
            if (err.code === 'auth/wrong-password') errorMsg = "Սխալ գաղտնաբառ:";
            if (err.code === 'auth/invalid-credential') errorMsg = "Մուտքային տվյալները սխալ են կամ գաղտնաբառը սխալ է:";
            if (err.code === 'auth/email-already-in-use') errorMsg = "Այս էլ. փոստը արդեն գրանցված է: Խնդրում ենք պարզապես մուտք գործել:";
            if (err.code === 'auth/invalid-email') errorMsg = "Էլ. փոստի ձևաչափը սխալ է:";
            if (err.code === 'auth/weak-password') errorMsg = "Գաղտնաբառը պետք է լինի առնվազն 6 նիշ:";
            setAuthError(errorMsg);
        } finally {
            setLoading(false);
        }
    };

    const getModeInfo = () => {
        switch (authMode) {
            case 'login':
                return {
                    title: "ՄՈՒՏՔ ՀԱՄԱԿԱՐԳ",
                    desc: "Մուտք գործեք ձեր հաշիվ՝ նախագծերի ստուգումը շարունակելու համար:",
                    button: "ՄՈՒՏՔ"
                };
            case 'signup':
                return {
                    title: "ՆՈՐ ԳՐԱՆՑՈՒՄ",
                    desc: "Ստեղծեք նոր հաշիվ ArchiCheck-ի բոլոր հնարավորություններից օգտվելու համար:",
                    button: "ԳՐԱՆՑՎԵԼ"
                };
            case 'reset':
                return {
                    title: "ԳԱՂՏՆԱԲԱՌԻ ՎԵՐԱԿԱՆԳՆՈՒՄ",
                    desc: "Մուտքագրեք ձեր էլ. փոստը, և մենք կուղարկենք գաղտնաբառը փոխելու հղումը:",
                    button: "ՈՒՂԱՐԿԵԼ ՀՂՈՒՄԸ"
                };
        }
    };

    const info = getModeInfo();

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center px-4 py-8 font-sans">
            <div className="max-w-[440px] w-full">
                {/* Main Card */}
                <div className="bg-white rounded-[2.5rem] shadow-2xl shadow-blue-100/50 p-8 md:p-10 border border-slate-100">
                    {/* User Avatar Section */}
                    <div className="flex flex-col items-center mb-8">
                        <div className="w-24 h-24 rounded-3xl bg-blue-50 flex items-center justify-center mb-4 rotate-3 hover:rotate-0 transition-transform duration-300">
                            <svg className="w-12 h-12 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                        </div>
                        <h1 className="text-2xl font-black text-slate-800 tracking-tight armenian-text">{info.title}</h1>
                        <p className="text-sm text-slate-500 text-center mt-2 armenian-text leading-relaxed px-4">{info.desc}</p>
                    </div>

                    <form onSubmit={handleAuth} className="space-y-5">
                        {authError && (
                            <div className="p-4 bg-red-50 text-red-600 text-xs rounded-2xl border border-red-100 font-bold text-center animate-shake armenian-text">
                                {authError}
                            </div>
                        )}

                        {message && (
                            <div className="p-4 bg-emerald-50 text-emerald-700 text-xs rounded-2xl border border-emerald-100 font-bold text-center armenian-text">
                                {message}
                            </div>
                        )}

                        {/* Email Input */}
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Էլ. Փոստ</label>
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-1.5 flex items-center pointer-events-none">
                                    <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center group-focus-within:bg-blue-50 transition-colors">
                                        <svg className="w-5 h-5 text-slate-400 group-focus-within:text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                        </svg>
                                    </div>
                                </div>
                                <input
                                    type="email"
                                    required
                                    value={email}
                                    onChange={e => setEmail(e.target.value)}
                                    className="w-full bg-slate-50 border-2 border-transparent rounded-2xl py-3.5 pl-14 pr-4 text-slate-700 text-base font-semibold placeholder-slate-300 outline-none focus:border-blue-500/20 focus:bg-white transition-all"
                                    placeholder="example@mail.com"
                                />
                            </div>
                        </div>

                        {/* Password Input (only for login/signup) */}
                        {authMode !== 'reset' && (
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Գաղտնաբառ</label>
                                <div className="relative group">
                                    <div className="absolute inset-y-0 left-0 pl-1.5 flex items-center pointer-events-none">
                                        <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center group-focus-within:bg-blue-50 transition-colors">
                                            <svg className="w-5 h-5 text-slate-400 group-focus-within:text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                            </svg>
                                        </div>
                                    </div>
                                    <input
                                        type={showPassword ? "text" : "password"}
                                        required
                                        value={password}
                                        onChange={e => setPassword(e.target.value)}
                                        className="w-full bg-slate-50 border-2 border-transparent rounded-2xl py-3.5 pl-14 pr-14 text-slate-700 text-base font-semibold placeholder-slate-300 outline-none focus:border-blue-500/20 focus:bg-white transition-all"
                                        placeholder="••••••••"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-blue-500 transition-colors"
                                    >
                                        {showPassword ? (
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" strokeWidth={2} /><path d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" strokeWidth={2} /></svg>
                                        ) : (
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.049m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88L1 1m11 11L23 23" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" /></svg>
                                        )}
                                    </button>
                                </div>
                            </div>
                        )}

                        <div className="flex items-center justify-between px-1">
                            {authMode === 'login' && (
                                <button
                                    type="button"
                                    onClick={() => {
                                        setAuthMode('reset');
                                        setAuthError(null);
                                        setMessage(null);
                                    }}
                                    className="text-xs font-bold text-blue-600 hover:text-blue-700 transition-colors armenian-text"
                                >
                                    Մոռացե՞լ եք գաղտնաբառը:
                                </button>
                            )}
                            {authMode === 'reset' && (
                                <button
                                    type="button"
                                    onClick={() => {
                                        setAuthMode('login');
                                        setAuthError(null);
                                        setMessage(null);
                                    }}
                                    className="text-xs font-bold text-slate-500 hover:text-slate-700 transition-colors armenian-text"
                                >
                                    Վերադառնալ մուտքի էջ
                                </button>
                            )}
                        </div>

                        {/* Submit Button */}
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-4 bg-blue-600 text-white rounded-2xl font-black text-lg tracking-wider shadow-lg shadow-blue-200 hover:bg-blue-700 hover:-translate-y-0.5 transition-all active:scale-[0.98] disabled:opacity-50 disabled:translate-y-0 armenian-text"
                        >
                            {loading ? (
                                <div className="flex items-center justify-center gap-2">
                                    <svg className="animate-spin h-5 w-5 text-white" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                    </svg>
                                    ԿԱՏԱՐՎՈՒՄ Է...
                                </div>
                            ) : info.button}
                        </button>
                    </form>

                    {/* Bottom Toggles */}
                    <div className="mt-10 pt-6 border-t border-slate-50 text-center">
                        <button
                            type="button"
                            onClick={() => {
                                setAuthMode(authMode === 'signup' ? 'login' : 'signup');
                                setAuthError(null);
                                setMessage(null);
                            }}
                            className="text-xs font-bold text-slate-400 group hover:text-blue-600 transition-colors uppercase tracking-widest armenian-text"
                        >
                            {authMode === 'signup' ? (
                                <>Արդեն ունե՞ք հաշիվ: <span className="text-blue-600 group-hover:text-blue-700">Մուտք</span></>
                            ) : (
                                <>Չունե՞ք հաշիվ: <span className="text-blue-600 group-hover:text-blue-700">Գրանցվեք</span></>
                            )}
                        </button>
                    </div>
                </div>

                {/* Footer Info */}
                <p className="mt-8 text-center text-[10px] text-slate-400 font-bold uppercase tracking-[0.2em] armenian-text">ArchiCheck AI — Ճարտարագիտական վերահսկողություն</p>
            </div>
        </div>
    );
};

export default AuthPage;
