
import React from 'react';
import { AuditRequest } from '../../types';
import { PROJECT_CATEGORIES } from '../../constants';

interface SidebarProps {
    form: AuditRequest;
    setForm: React.Dispatch<React.SetStateAction<AuditRequest>>;
    handleNormsUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
    removeNormFile: (index: number) => void;
    handleProjectFilesUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
    removeProjectFile: (index: number) => void;
}

const Sidebar: React.FC<SidebarProps> = ({
    form,
    setForm,
    handleNormsUpload,
    removeNormFile,
    handleProjectFilesUpload,
    removeProjectFile
}) => {
    return (
        <div className="space-y-6">
            {/* Section 1: Normative Base */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="p-4 border-b border-slate-100 bg-blue-50 flex items-center justify-between">
                    <div>
                        <h2 className="text-xs font-bold flex items-center gap-2 armenian-text text-blue-900">Նորմատիվ Բազա</h2>
                        <p className="text-[10px] text-blue-700/70 armenian-text mt-0.5">Կցեք ՀՀ շինարարական նորմերը (PDF), որոնց հիման վրա պետք է կատարվի ստուգումը։ AI-ն կօգտագործի միայն այս ֆայլերը։</p>
                    </div>
                    <label className="cursor-pointer bg-blue-600 hover:bg-blue-700 text-white text-[9px] font-bold px-3 py-1 rounded-full armenian-text">
                        ԱՎԵԼԱՑՆԵԼ
                        <input type="file" multiple className="sr-only" onChange={handleNormsUpload} accept="application/pdf" />
                    </label>
                </div>
                <div className="p-4 max-h-[140px] overflow-y-auto bg-slate-50/30">
                    {form.normFiles.length === 0 ? (
                        <div className="text-center py-4">
                            <p className="text-[10px] text-slate-400 italic armenian-text">Օրինակ՝ ՀՀՇՆ 31-01-2014</p>
                        </div>
                    ) : (
                        <ul className="space-y-1">
                            {form.normFiles.map((file, idx) => (
                                <li key={idx} className="flex items-center justify-between bg-white p-2 rounded-lg border border-slate-100 shadow-sm">
                                    <span className="text-[10px] text-slate-700 truncate max-w-[180px]">{file.name}</span>
                                    <button onClick={() => removeNormFile(idx)} className="text-slate-300 hover:text-red-500"><svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M6 18L18 6M6 6l12 12" /></svg></button>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            </div>

            {/* Section 2: Project Metadata */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="p-4 border-b border-slate-100 bg-slate-50">
                    <h2 className="text-sm font-bold armenian-text">Նախագծի Տվյալներ</h2>
                    <p className="text-[10px] text-slate-500 armenian-text mt-1">Լրացրեք տեղեկություն ստուգվող օբյեկտի մասին։ Սա կօգնի AI-ին ավելի ճշգրիտ հասկանալ համատեքստը։</p>
                </div>
                <div className="p-5 space-y-4">
                    <div>
                        <label className="text-[10px] font-bold text-slate-400 uppercase armenian-text block mb-1">Նախագծի Անվանում</label>
                        <input type="text" value={form.projectName} onChange={e => setForm({ ...form, projectName: e.target.value })} className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 outline-none focus:border-blue-500" placeholder="Օրինակ՝ Բնակելի համալիր Արաբկիրում" />
                    </div>

                    <div>
                        <label className="text-[10px] font-bold text-slate-400 uppercase armenian-text block mb-1">Տեսակ</label>
                        <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 outline-none focus:border-blue-500 bg-white">
                            {PROJECT_CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                        </select>
                    </div>

                    <div>
                        <label className="text-[10px] font-bold text-slate-400 uppercase armenian-text block mb-1">ԼՐԱՑՈՒՑԻՉ ՏԵՂԵԿՈՒԹՅՈՒՆ</label>
                        <textarea value={form.projectDescription} onChange={e => setForm({ ...form, projectDescription: e.target.value })} className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 outline-none focus:border-blue-500 h-24 resize-none" placeholder="Նշեք հարկայնությունը, ընդհանուր մակերեսը կամ այլ կարևոր պարամետրեր..." />
                    </div>
                </div>
            </div>

            {/* Section 3: Project Files */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="p-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
                    <div>
                        <h2 className="text-xs font-bold flex items-center gap-2 armenian-text text-slate-800">ՆԱԽԱԳԾԱՅԻՆ ՖԱՅԼԵՐ</h2>
                        <p className="text-[10px] text-slate-500 armenian-text mt-0.5 max-w-[200px] leading-tight">Վերբեռնեք նախագծի հիմնական ֆայլերը (գծագրեր, բացատրագրեր) PDF կամ նկարի ձևաչափով:</p>
                    </div>
                    <label className="cursor-pointer bg-slate-900 hover:bg-slate-900 text-white text-[9px] font-bold px-3 py-1 rounded-full armenian-text whitespace-nowrap">
                        ԿՑԵԼ ԳԾԱԳՐԵՐ
                        <input type="file" multiple className="sr-only" onChange={handleProjectFilesUpload} accept="application/pdf,image/*" />
                    </label>
                </div>

                {form.files.length > 0 && (
                    <div className="p-2 bg-slate-50 max-h-[200px] overflow-y-auto">
                        <ul className="grid grid-cols-2 gap-2">
                            {form.files.map((file, idx) => (
                                <li key={idx} className="relative group bg-white p-3 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-all">
                                    <div className="flex items-center gap-2 mb-2">
                                        <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600">
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" strokeWidth={2} /></svg>
                                        </div>
                                        <span className="text-[10px] text-slate-600 font-bold truncate flex-1" title={file.name}>{file.name}</span>
                                    </div>
                                    <div className="flex justify-between items-center mt-2 pt-2 border-t border-slate-100">
                                        <span className="text-[9px] text-slate-400">{(file.size / (1024 * 1024)).toFixed(2)} MB</span>
                                        <button onClick={() => removeProjectFile(idx)} className="text-slate-300 hover:text-red-500 transition-colors p-1"><svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" strokeWidth={2} /></svg></button>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Sidebar;
