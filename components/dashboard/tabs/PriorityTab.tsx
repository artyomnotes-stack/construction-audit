
import React from 'react';
import MarkdownRenderer from '../../common/MarkdownRenderer';
import { PriorityTask, Template } from '../../../types';
import TemplateSelector from '../../common/TemplateSelector';

interface PriorityTabProps {
    priorityTasks: PriorityTask[];
    updatePriorityTask: (id: string, updates: Partial<PriorityTask>) => void;
    priorityQuestion: string;
    setPriorityQuestion: (q: string) => void;
    handlePrioritySubmit: () => void;
    loading: boolean;
    progress: number;
    timeLeft: number;
    priorityResult: string | null;
    AccuracyHint: React.FC;
    templates: Template[];
    onExportPDF: (text: string) => void;
    onExportWord: (text: string) => void;
}

const PriorityTab: React.FC<PriorityTabProps> = ({
    priorityTasks,
    updatePriorityTask,
    priorityQuestion,
    setPriorityQuestion,
    handlePrioritySubmit,
    loading,
    progress,
    timeLeft,
    priorityResult,
    AccuracyHint,
    templates,
    onExportPDF,
    onExportWord
}) => {
    return (
        <div className="space-y-6">
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
                <div className="mb-6 bg-orange-50/50 p-4 rounded-xl border border-orange-100">
                    <h2 className="text-lg font-bold text-slate-800 armenian-text mb-2">3. Մասնագիտացված Խնդիրների Որոնում</h2>
                    <p className="text-sm text-slate-600 armenian-text mb-4">Օգտագործեք այս գործիքը՝ նախագծի ամենահիմնական ռիսկերը և խնդիրները արագ գտնելու համար: Ընտրեք ստուգման ոլորտները, նշեք, թե քանի հիմնական խնդիր պետք է փնտրի AI-ն յուրաքանչյուրում, և ստացեք խնդիրների և դրանց լուծումների կառուցվածքային ցանկ:</p>
                </div>

                <div className="mb-6">
                    <label className="text-[10px] font-bold text-slate-400 uppercase armenian-text block mb-1">Կենտրոնացնող Հարց (Ըստ ցանկության)</label>
                    <p className="text-[10px] text-slate-400 armenian-text mb-2">Օրինակ՝ "Գտիր բոլոր խնդիրները, որոնք կապված են սահմանափակ հնարավորություններով անձանց մատչելիության հետ":</p>
                    <textarea
                        value={priorityQuestion}
                        onChange={e => setPriorityQuestion(e.target.value)}
                        className="w-full px-4 py-3 text-sm rounded-xl border border-slate-200 bg-slate-50 outline-none focus:bg-white focus:border-orange-500 transition-all resize-none h-24"
                        placeholder="Օրինակ՝ Գտիր բոլոր խնդիրները, որոնք կապված են սահմանափակ հնարավորություններով անձանց մատչելիության հետ..."
                    />
                    <TemplateSelector templates={templates} onSelect={setPriorityQuestion} />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    {priorityTasks.map(task => (
                        <div key={task.id} className={`p-4 rounded-xl border transition-all ${task.enabled ? 'bg-indigo-50 border-indigo-200 shadow-sm' : 'bg-white border-slate-200 opacity-70'}`}>
                            <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center gap-3">
                                    <input type="checkbox" checked={task.enabled} onChange={e => updatePriorityTask(task.id, { enabled: e.target.checked })} className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500" />
                                    <span className={`text-xs font-bold armenian-text ${task.enabled ? 'text-indigo-900' : 'text-slate-600'}`}>{task.label}</span>
                                </div>
                                {task.enabled && (
                                    <div className="flex items-center gap-2 bg-white px-2 py-1 rounded-lg border border-indigo-100">
                                        <button onClick={() => updatePriorityTask(task.id, { count: Math.max(1, task.count - 1) })} className="text-indigo-400 hover:text-indigo-600 font-bold">-</button>
                                        <span className="text-xs font-bold text-indigo-800 w-4 text-center">{task.count}</span>
                                        <button onClick={() => updatePriorityTask(task.id, { count: Math.min(10, task.count + 1) })} className="text-indigo-400 hover:text-indigo-600 font-bold">+</button>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>

                <button onClick={handlePrioritySubmit} disabled={loading} className="w-full py-4 bg-orange-500 hover:bg-orange-600 text-white rounded-xl font-bold armenian-text shadow-lg shadow-orange-200 transition-all active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed">
                    {loading ? (
                        <>
                            <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                            <span>Որոնվում են Խնդիրներ ({progress}%)...</span>
                        </>
                    ) : (
                        <>
                            ԳԵՆԵՐԱՑՆԵԼ ԶԵԿՈՒՅՑԸ
                        </>
                    )}
                </button>
                <AccuracyHint />
            </div>

            {priorityResult && (
                <div className="bg-white rounded-2xl shadow-xl border border-orange-100 overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-white sticky top-0 z-10">
                        <h3 className="font-bold armenian-text text-slate-800">Վերլուծության Արդյունք</h3>
                        <div className="flex gap-2">
                            <button
                                onClick={() => onExportPDF(priorityResult)}
                                className="px-3 py-1.5 bg-rose-50 text-rose-700 rounded-lg text-xs font-bold hover:bg-rose-100 transition-colors flex items-center gap-1.5"
                            >
                                PDF
                            </button>
                            <button
                                onClick={() => onExportWord(priorityResult)}
                                className="px-3 py-1.5 bg-blue-50 text-blue-700 rounded-lg text-xs font-bold hover:bg-blue-100 transition-colors flex items-center gap-1.5"
                            >
                                Word
                            </button>
                        </div>
                    </div>
                    <div className="p-8">
                        <MarkdownRenderer content={priorityResult} />
                        <AccuracyHint />
                    </div>
                </div>
            )}
        </div>
    );
};

export default PriorityTab;
