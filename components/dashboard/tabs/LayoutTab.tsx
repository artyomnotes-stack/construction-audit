
import React from 'react';
import MarkdownRenderer from '../../common/MarkdownRenderer';
import { Template } from '../../../types';
import TemplateSelector from '../../common/TemplateSelector';

interface LayoutTabProps {
    layoutQuestion: string;
    setLayoutQuestion: (q: string) => void;
    handleLayoutSubmit: () => void;
    loading: boolean;
    progress: number;
    timeLeft: number;
    layoutResult: string | null;
    AccuracyHint: React.FC;
    templates: Template[];
    onExportPDF: (element: HTMLElement | null) => void;
    onExportWord: (text: string) => void;
}

const LayoutTab: React.FC<LayoutTabProps> = ({
    layoutQuestion,
    setLayoutQuestion,
    handleLayoutSubmit,
    loading,
    progress,
    timeLeft,
    layoutResult,
    AccuracyHint,
    templates,
    onExportPDF,
    onExportWord
}) => {
    const reportRef = React.useRef<HTMLDivElement>(null);
    return (
        <div className="space-y-6">
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
                <div className="mb-6 bg-violet-50/50 p-4 rounded-xl border border-violet-100">
                    <h2 className="text-lg font-bold text-slate-800 armenian-text mb-2">4. Գրաֆիկական Վերլուծություն</h2>
                    <p className="text-sm text-slate-600 armenian-text mb-4">Այս գործիքը մասնագիտացված է գրաֆիկական ֆայլերի (հատակագծեր, կտրվածքներ) տեսողական վերլուծության մեջ: AI-ն կփորձի «կարդալ» գծագրերը՝ գտնելով էրգոնոմիկ, նորմատիվային կամ ֆունկցիոնալ խնդիրներ և տալով կոնկրետ առաջարկներ՝ նշելով խնդրահարույց հատվածը:</p>
                </div>

                <div className="mb-6">
                    <label className="text-[10px] font-bold text-slate-400 uppercase armenian-text block mb-1">Կենտրոնացնող Հարց (Ըստ ցանկության)</label>
                    <textarea
                        value={layoutQuestion}
                        onChange={e => setLayoutQuestion(e.target.value)}
                        className="w-full px-4 py-3 text-sm rounded-xl border border-slate-200 bg-slate-50 outline-none focus:bg-white focus:border-violet-500 transition-all resize-none h-24"
                        placeholder="Օրինակ՝ Ստուգիր, արդյո՞ք սանհանգույցների դասավորությունը օպտիմալ է։"
                    />
                    <TemplateSelector templates={templates} onSelect={setLayoutQuestion} />
                </div>

                <button onClick={handleLayoutSubmit} disabled={loading} className="w-full py-4 bg-violet-600 hover:bg-violet-700 text-white rounded-xl font-bold armenian-text shadow-lg shadow-violet-200 transition-all active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed">
                    {loading ? (
                        <>
                            <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                            <span>Վերլուծվում են Գծագրերը ({progress}%)...</span>
                        </>
                    ) : (
                        <>
                            ՎԵՐԼՈՒԾԵԼ ԳԾԱԳՐԵՐԸ
                        </>
                    )}
                </button>
                <AccuracyHint />
            </div>

            {layoutResult && (
                <div className="bg-white rounded-2xl shadow-xl border border-violet-100 overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-white sticky top-0 z-10">
                        <h3 className="font-bold armenian-text text-slate-800">Վերլուծության Արդյունք</h3>
                        <div className="flex gap-2">
                            <button
                                onClick={() => onExportPDF(reportRef.current)}
                                className="px-3 py-1.5 bg-rose-50 text-rose-700 rounded-lg text-xs font-bold hover:bg-rose-100 transition-colors flex items-center gap-1.5"
                            >
                                PDF
                            </button>
                            <button
                                onClick={() => onExportWord(layoutResult)}
                                className="px-3 py-1.5 bg-blue-50 text-blue-700 rounded-lg text-xs font-bold hover:bg-blue-100 transition-colors flex items-center gap-1.5"
                            >
                                Word
                            </button>
                        </div>
                    </div>
                    <div className="p-8" ref={reportRef}>
                        <MarkdownRenderer content={layoutResult} />
                        <AccuracyHint />
                    </div>
                </div>
            )}
        </div>
    );
};

export default LayoutTab;
