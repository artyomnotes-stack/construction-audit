
import React from 'react';
import { PriorityTask, AuditResponse } from '../../../types';
import MarkdownRenderer from '../../common/MarkdownRenderer';

interface AuditTabProps {
    auditDisciplines: PriorityTask[];
    updateAuditDiscipline: (id: string, updates: Partial<PriorityTask>) => void;
    auditQuestion: string;
    setAuditQuestion: (q: string) => void;
    handleAuditSubmit: () => void;
    loading: boolean;
    progress: number;
    timeLeft: number;
    result: string | null;
    AccuracyHint: React.FC;
    onExportPDF: (element: HTMLElement | null) => void;
    onExportWord: (text: string) => void;
}

const AuditTab: React.FC<AuditTabProps> = ({
    auditDisciplines,
    updateAuditDiscipline,
    auditQuestion,
    setAuditQuestion,
    handleAuditSubmit,
    loading,
    progress,
    timeLeft,
    result,
    AccuracyHint,
    onExportPDF,
    onExportWord
}) => {
    const reportRef = React.useRef<HTMLDivElement>(null);
    return (
        <div className="space-y-6">
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
                <div className="mb-6 bg-blue-50/50 p-4 rounded-xl border border-blue-100">
                    <h2 className="text-lg font-bold text-slate-800 armenian-text mb-2">1. Հիմնական Աուդիտ</h2>
                    <p className="text-sm text-slate-600 armenian-text mb-4">Այս գործիքը կատարում է նախագծի ամբողջական ստուգում՝ համեմատելով այն ձեր կողմից տրամադրված նորմատիվ փաստաթղթերի հետ:</p>

                    <div className="space-y-2">
                        <p className="text-xs font-bold text-slate-500 uppercase armenian-text">Ինչպես օգտվել:</p>
                        <ol className="list-decimal list-inside text-xs text-slate-600 armenian-text space-y-1 ml-1">
                            <li>Ընտրեք ուղղությունները, որոնք ցանկանում եք ստուգել (օր.՝ Ճարտարապետություն):</li>
                            <li>Նշեք քանակը, թե քանի հիմնական ստուգում պետք է կատարի AI-ն յուրաքանչյուր ուղղությամբ:</li>
                            <li>(Ըստ ցանկության) Տվեք կոնկրետ հարց, եթի ցանկանում եք, որ աուդիտը կենտրոնանա որոշակի խնդրի շուրջ:</li>
                            <li>Սեղմեք «Սկսել Հիմնական Աուդիտը»:</li>
                        </ol>
                    </div>
                </div>

                <h3 className="text-sm font-bold armenian-text mb-4 text-slate-800">Աուդիտի Ուղղություններ</h3>
                <div className="grid grid-cols-2 gap-3 mb-6">
                    {auditDisciplines.map(task => (
                        <label key={task.id} className={`relative flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all ${task.enabled ? 'bg-blue-50 border-blue-200 ring-1 ring-blue-200' : 'bg-white border-slate-200 hover:border-slate-300'}`}>
                            <div className="flex items-center gap-3">
                                <input type="checkbox" checked={task.enabled} onChange={e => updateAuditDiscipline(task.id, { enabled: e.target.checked })} className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500" />
                                <span className={`text-xs font-bold armenian-text ${task.enabled ? 'text-blue-800' : 'text-slate-600'}`}>{task.label}</span>
                            </div>
                            {task.enabled && (
                                <div className="flex items-center gap-2 bg-white px-2 py-1 rounded-lg border border-blue-100">
                                    <span className="text-[10px] text-slate-400 font-bold">ՔԱՆԱԿ:</span>
                                    <input
                                        type="number"
                                        min="1"
                                        max="20"
                                        value={task.count}
                                        onChange={(e) => updateAuditDiscipline(task.id, { count: parseInt(e.target.value) || 0 })}
                                        className="w-10 text-center text-xs font-bold text-blue-800 outline-none border-none p-0 focus:ring-0"
                                        onClick={(e) => e.stopPropagation()}
                                    />
                                </div>
                            )}
                        </label>
                    ))}
                </div>

                <div className="mb-6">
                    <label className="text-[10px] font-bold text-slate-400 uppercase armenian-text block mb-1">Հատուկ Հարց Աուդիտի Համար (Ըստ ցանկության)</label>
                    <p className="text-[10px] text-slate-400 armenian-text mb-2">Եթե ունեք կոնկրետ հարց, նշեք այն այստեղ, և AI-ն առաջինը կկենտրոնանա դրա շուրջ:</p>
                    <div className="relative">
                        <textarea
                            value={auditQuestion}
                            onChange={e => setAuditQuestion(e.target.value)}
                            className="w-full px-4 py-3 text-sm rounded-xl border border-slate-200 bg-slate-50 outline-none focus:bg-white focus:border-blue-500 transition-all resize-none h-24"
                            placeholder="Օրինակ՝ Արդյո՞ք նախագծի հակահրդեհային համակարգը համապատասխանում է ՀՀՇՆ 21-01-2014-ի պահանջներին բարձրահարկ շենքերի համար:"
                        />
                    </div>
                </div>

                <button onClick={handleAuditSubmit} disabled={loading} className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold armenian-text shadow-lg shadow-blue-200 transition-all active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed">
                    {loading ? (
                        <>
                            <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                            <span>Կատարվում է Աուդիտ ({progress}%)...</span>
                        </>
                    ) : (
                        <>
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" strokeWidth={2} /></svg>
                            ՍԿՍԵԼ ՀԻՄՆԱԿԱՆ ԱՈՒԴԻՏԸ
                        </>
                    )}
                </button>
                <AccuracyHint />
            </div>

            {result && (
                <div className="bg-white rounded-2xl shadow-xl border border-blue-100 overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="p-6 bg-blue-600 text-white flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-white/20 rounded-xl backdrop-blur-md">
                                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" strokeWidth={2} /></svg>
                            </div>
                            <div>
                                <h2 className="text-xl font-black armenian-text">Աուդիտի Արդյունքներ</h2>
                                <p className="text-blue-50 text-xs mt-1 opacity-90 armenian-text">Մասնագիտական վերլուծություն</p>
                            </div>
                        </div>
                    </div>
                    <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-white sticky top-0 z-10">
                        <h3 className="font-bold armenian-text text-slate-800">Աուդիտի Արդյունք</h3>
                        <div className="flex gap-2">
                            <button
                                onClick={() => onExportPDF(reportRef.current)}
                                className="px-3 py-1.5 bg-rose-50 text-rose-700 rounded-lg text-xs font-bold hover:bg-rose-100 transition-colors flex items-center gap-1.5"
                                title="Ներբեռնել PDF"
                            >
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M7 21h10a2 2 0 002-2V9.414a2 2 0 00-.586-1.414l-7-7A2 2 0 0010.586 1H7a2 2 0 00-2 2v16a2 2 0 002 2z" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" /></svg>
                                PDF
                            </button>
                            <button
                                onClick={() => onExportWord(result)}
                                className="px-3 py-1.5 bg-blue-50 text-blue-700 rounded-lg text-xs font-bold hover:bg-blue-100 transition-colors flex items-center gap-1.5"
                                title="Ներբեռնել Word"
                            >
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M7 21h10a2 2 0 002-2V9.414a2 2 0 00-.586-1.414l-7-7A2 2 0 0010.586 1H7a2 2 0 00-2 2v16a2 2 0 002 2z" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" /></svg>
                                Word
                            </button>
                        </div>
                    </div>

                    <div className="p-8" ref={reportRef}>
                        <MarkdownRenderer content={result} />
                        <AccuracyHint />
                    </div>
                </div>
            )}
        </div>
    );
};

export default AuditTab;
