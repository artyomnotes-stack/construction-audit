
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
    handleDownloadAudio: () => void;
    audioLoading: boolean;
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
    handleDownloadAudio,
    audioLoading
}) => {
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
                    <div className="p-6 bg-violet-600 text-white flex items-center justify-between">
                        <h2 className="text-xl font-black armenian-text">Հատակագծերի Վերլուծություն</h2>
                        <button onClick={handleDownloadAudio} disabled={audioLoading} className="p-2 bg-white/20 rounded-lg hover:bg-white/30 transition-all text-white" title="Լսել աուդիո տարբերակը">
                            {audioLoading ? <svg className="w-5 h-5 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" /></svg> : <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" strokeWidth={2} /></svg>}
                        </button>
                    </div>
                    <div className="p-8">
                        <MarkdownRenderer content={layoutResult} />
                        <AccuracyHint />
                    </div>
                </div>
            )}
        </div>
    );
};

export default LayoutTab;
