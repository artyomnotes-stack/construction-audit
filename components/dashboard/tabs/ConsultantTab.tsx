import React from 'react';
import MarkdownRenderer from '../../common/MarkdownRenderer';
import { Template } from '../../../types';
import TemplateSelector from '../../common/TemplateSelector';

interface ConsultantTabProps {
    userTask: string;
    setUserTask: (task: string) => void;
    handleConsultantSubmit: () => void;
    loading: boolean;
    progress: number;
    timeLeft: number;
    consultantResult: string | null;
    AccuracyHint: React.FC;
    templates: Template[];
    onExportPDF: (text: string) => void;
    onExportWord: (text: string) => void;
}

const ConsultantTab: React.FC<ConsultantTabProps> = ({
    userTask,
    setUserTask,
    handleConsultantSubmit,
    loading,
    progress,
    timeLeft,
    consultantResult,
    AccuracyHint,
    templates,
    onExportPDF,
    onExportWord
}) => {
    return (
        <div className="space-y-6">
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
                <div className="mb-6 bg-fuchsia-50/50 p-4 rounded-xl border border-fuchsia-100">
                    <h2 className="text-lg font-bold text-slate-800 armenian-text mb-2">2. AI Ճարտարագետ-Խորհրդատու</h2>
                    <p className="text-sm text-slate-600 armenian-text mb-4">Այս գործիքը ձեր անձնական AI ճարտարագետ-խորհրդատուն է: Տվեք կոնկրետ հարցեր, պահանջեք բարդ հաշվարկներ (օրինակ՝ ինսոլյացիայի կամ կրող կոնստրուկցիաների), կամ խնդրեք գրել տեխնիկական բնութագիր:</p>

                    <div className="space-y-2">
                        <p className="text-xs font-bold text-slate-500 uppercase armenian-text">Հաշվարկները ներկայացվեն պրոֆեսիոնալ մաթեմատիկական տեսքով:</p>
                        <p className="text-xs text-slate-600 armenian-text">Օրինակ՝ "Հաշվիր ավտոկայանատեղիները ըստ նորմերի..."</p>
                    </div>
                </div>

                <div className="mb-4">
                    <textarea
                        value={userTask}
                        onChange={e => setUserTask(e.target.value)}
                        className="w-full px-4 py-3 text-sm rounded-xl border border-slate-200 outline-none focus:border-fuchsia-500 h-32 resize-none"
                        placeholder="Օրինակ՝ Հաշվիր ավտոկայանատեղիները ըստ նորմերի..."
                    />
                    <TemplateSelector templates={templates} onSelect={setUserTask} />
                </div>



                <button onClick={handleConsultantSubmit} disabled={loading} className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold armenian-text shadow-lg shadow-blue-200 transition-all active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed">
                    {loading ? (
                        <>
                            <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                            <span>Վերլուծվում է ({progress}%)...</span>
                        </>
                    ) : (
                        <>
                            ԿԱՏԱՐԵԼ
                        </>
                    )}
                </button>
                <AccuracyHint />
            </div>

            {consultantResult && (
                <div className="bg-white rounded-2xl shadow-xl border border-fuchsia-100 overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-white sticky top-0 z-10">
                        <h3 className="font-bold armenian-text text-slate-800">Վերլուծության Արդյունք</h3>
                        <div className="flex gap-2">
                            <button
                                onClick={() => onExportPDF(consultantResult)}
                                className="px-3 py-1.5 bg-rose-50 text-rose-700 rounded-lg text-xs font-bold hover:bg-rose-100 transition-colors flex items-center gap-1.5"
                            >
                                PDF
                            </button>
                            <button
                                onClick={() => onExportWord(consultantResult)}
                                className="px-3 py-1.5 bg-blue-50 text-blue-700 rounded-lg text-xs font-bold hover:bg-blue-100 transition-colors flex items-center gap-1.5"
                            >
                                Word
                            </button>
                        </div>
                    </div>
                    <div className="p-8">
                        <MarkdownRenderer content={consultantResult} />
                        <AccuracyHint />
                    </div>
                </div>
            )}
        </div>
    );
};

export default ConsultantTab;
