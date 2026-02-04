
import React, { useState, useCallback } from 'react';
import { performVolumeComparison } from '../services/geminiService';
import { VolumeComparisonResponse, VolumeComparisonRow } from '../types';
import AccuracyHint from './common/AccuracyHint';
import * as XLSX from 'xlsx';

interface FileUploadBoxProps {
  title: string;
  file: File | null;
  onFileChange: (file: File | null) => void;
  acceptedTypes: string;
}


const FileUploadBox: React.FC<FileUploadBoxProps> = ({ title, file, onFileChange, acceptedTypes }) => {
  const [isDragging, setIsDragging] = useState(false);

  const handleDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };
  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };
  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };
  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      onFileChange(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onFileChange(e.target.files[0]);
    }
  };

  return (
    <div
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      className={`relative flex-1 p-6 border-2 border-dashed rounded-xl text-center transition-all duration-300 ${isDragging ? 'border-blue-500 bg-blue-50' : 'border-slate-300 bg-slate-50'}`}
    >
      <input type="file" className="sr-only" id={title} accept={acceptedTypes} onChange={handleFileSelect} />
      <label htmlFor={title} className="cursor-pointer">
        <svg className="w-10 h-10 mx-auto text-slate-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" /></svg>
        <p className="text-sm font-bold text-slate-700 armenian-text">{title}</p>
        <p className="text-xs text-slate-500 armenian-text mt-1">Քաշեք և բաց թողեք կամ սեղմեք՝ ընտրելու համար</p>
        {file && (
          <div className="mt-4 bg-white text-blue-700 text-xs font-bold py-2 px-3 rounded-lg inline-flex items-center gap-2 border border-blue-200">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" /><path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clipRule="evenodd" /></svg>
            {file.name}
          </div>
        )}
      </label>
    </div>
  );
};

const StatusIcon: React.FC<{ variance: number; planned: number }> = ({ variance, planned }) => {
  if (planned === 0 && variance > 0) { // New item
    return <span title="Նոր աշխատանք" className="flex items-center justify-center w-6 h-6 bg-blue-100 rounded-full"><svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg></span>;
  }
  if (variance === 0) { // Perfect match
    return <span title="Համապատասխանում է" className="flex items-center justify-center w-6 h-6 bg-emerald-100 rounded-full"><svg className="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg></span>;
  }
  if (variance > 0) { // Over-expenditure
    const percentage = planned > 0 ? (variance / planned) : Infinity;
    if (percentage > 0.1) { // Significant
      return <span title="Զգալի գերածախս" className="flex items-center justify-center w-6 h-6 bg-rose-100 rounded-full"><svg className="w-4 h-4 text-rose-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg></span>;
    } else { // Minor
      return <span title="Փոքր գերածախս" className="flex items-center justify-center w-6 h-6 bg-amber-100 rounded-full"><svg className="w-4 h-4 text-amber-600" fill="currentColor" viewBox="0 0 20 20"><path d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.21 3.001-1.742 3.001H4.42c-1.53 0-2.493-1.667-1.743-3.001l5.58-9.92zM10 13a1 1 0 110-2 1 1 0 010 2zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"></path></svg></span>;
    }
  }
  if (variance < 0) { // Under-expenditure / Saved
    return <span title="Տնտեսում" className="flex items-center justify-center w-6 h-6 bg-sky-100 rounded-full"><svg className="w-4 h-4 text-sky-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6"></path></svg></span>
  }
  return null;
};

const VolumeComparison: React.FC<{ subscriptionActive: boolean }> = ({ subscriptionActive }) => {
  const [estimateFile, setEstimateFile] = useState<File | null>(null);
  const [asBuiltFile, setAsBuiltFile] = useState<File | null>(null);
  const [result, setResult] = useState<VolumeComparisonResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCompare = async () => {
    if (!estimateFile || !asBuiltFile) {
      setError("Խնդրում ենք վերբեռնել երկու ֆայլերն էլ։");
      return;
    }
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const comparisonResult = await performVolumeComparison(estimateFile, asBuiltFile);
      setResult(comparisonResult);
    } catch (err: any) {
      setError(err.message || "Ծավալները համեմատելիս սխալ առաջացավ։");
    } finally {
      setLoading(false);
    }
  };

  const comparisonRef = React.useRef<HTMLDivElement>(null);

  const exportExcel = () => {
    if (!result) return;
    const data = result.comparisonTable.map(row => ({
      "Աշխատանքի անվանում": row.itemName,
      "Չափի միավոր": row.unit,
      "Նախահաշվային քանակ": row.plannedQty,
      "Փաստացի քանակ": row.actualQty,
      "Շեղում": row.actualQty - row.plannedQty,
      "Միավորի գին": row.unitPrice,
      "Ընդհանուր գին": row.totalPrice
    }));
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Ծավալների Համեմատություն");
    XLSX.writeFile(workbook, `Ծավալների_Համեմատություն_${new Date().toLocaleDateString()}.xlsx`);
  };

  const exportPDF = async () => {
    if (!result || !comparisonRef.current) return;

    setLoading(true);
    try {
      const { default: jsPDF } = await import('jspdf');
      const { default: html2canvas } = await import('html2canvas');

      const element = comparisonRef.current;
      const canvas = await html2canvas(element, {
        scale: 2, // Higher quality
        useCORS: true,
        logging: false,
        backgroundColor: "#ffffff"
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');

      const imgWidth = 190; // A4 width minus margins
      const pageHeight = 297;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      let heightLeft = imgHeight;
      let position = 10; // Top margin

      pdf.addImage(imgData, 'PNG', 10, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 10, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      pdf.save(`Ծավալների_Համեմատություն_${new Date().toLocaleDateString()}.pdf`);
    } catch (err) {
      console.error("PDF Export Error:", err);
      setError("PDF արտահանման ժամանակ սխալ առաջացավ։");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <AccuracyHint />
      <div className="flex justify-end gap-3 no-print mb-4">
        {result && (
          <>
            <button
              onClick={exportExcel}
              className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-xs font-bold armenian-text hover:bg-emerald-700 transition-colors flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M6 2a2 2 0 00-2 2v12a2 2 0 002 2h8a2 2 0 002-2V7.414A2 2 0 0015.414 6L12 2.586A2 2 0 0010.586 2H6zm5 6a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V8z" clipRule="evenodd" /></svg>
              Արտահանել Excel
            </button>
            <button
              onClick={exportPDF}
              className="px-4 py-2 bg-rose-600 text-white rounded-lg text-xs font-bold armenian-text hover:bg-rose-700 transition-colors flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M6 2a2 2 0 00-2 2v12a2 2 0 002 2h8a2 2 0 002-2V7.414A2 2 0 0015.414 6L12 2.586A2 2 0 0010.586 2H6zm2 8a1 1 0 112 0 1 1 0 01-2 0zm3 2a1 1 0 100 2h3a1 1 0 100-2h-3z" clipRule="evenodd" /></svg>
              Արտահանել PDF
            </button>
          </>
        )}
      </div>
      {!result && !loading && (
        <div className="no-print space-y-6">
          <div className="mb-8 p-6 bg-white rounded-2xl border border-slate-200 shadow-sm no-print">
            <h2 className="text-xl font-bold text-slate-800 armenian-text text-center">5. Ծավալների Համեմատություն</h2>
            <p className="text-sm text-slate-600 armenian-text mt-2 text-center leading-relaxed">
              Այս գործիքը համեմատում է երկու փաստաթուղթ՝ <strong>նախահաշվային</strong> և <strong>փաստացի կատարողական</strong>,՝ ավտոմատ կերպով գտնելով աշխատանքների ծավալների միջև եղած շեղումները։
            </p>
            <div className="mt-4 text-xs text-left text-slate-500 armenian-text space-y-1 bg-slate-50 p-4 rounded-lg">
              <p><strong>Ինչպե՞ս օգտվել:</strong></p>
              <p>1. <strong>Վերբեռնեք նախահաշիվը</strong> (PDF կամ Excel ֆայլ)։</p>
              <p>2. <strong>Վերբեռնեք կատարողականը</strong> (PDF կամ Excel ֆայլ)։</p>
              <p>3. Սեղմեք «Համեմատել ծավալները» և սպասեք արդյունքին, որը կներկայացվի համեմատական աղյուսակի և AI-ի կողմից գեներացված ամփոփման տեսքով։</p>
            </div>
          </div>
          <div className="bg-blue-50/50 rounded-2xl border border-blue-100 p-6 no-print">
            <h3 className="text-sm font-black text-blue-800 armenian-text mb-4 flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
              Ինչպիսի՞ն պետք է լինեն ֆայլերը (Տեսապատկեր)
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <p className="text-[10px] font-bold text-blue-600 uppercase tracking-wider armenian-text ml-1">Օրինակելի Նախահաշիվ</p>
                <div className="rounded-xl overflow-hidden border-2 border-white shadow-md hover:shadow-lg transition-shadow bg-white">
                  <img src="/assets/estimate_example.png" alt="Նախահաշվի օրինակ" className="w-full h-auto object-cover" />
                </div>
                <p className="text-[10px] text-slate-500 armenian-text leading-relaxed">Անհրաժեշտ է՝ Աշխատանքի անվանում, Չ/Մ, Քանակ, Միավորի գին:</p>
              </div>
              <div className="space-y-2">
                <p className="text-[10px] font-bold text-blue-600 uppercase tracking-wider armenian-text ml-1">Օրինակելի Կատարողական</p>
                <div className="rounded-xl overflow-hidden border-2 border-white shadow-md hover:shadow-lg transition-shadow bg-white">
                  <img src="/assets/as_built_example.png" alt="Կատարողականի օրինակ" className="w-full h-auto object-cover" />
                </div>
                <p className="text-[10px] text-slate-500 armenian-text leading-relaxed">Անհրաժեշտ է՝ Աշխատանքի անվանում, Չ/Մ, Փաստացի քանակ (կատարված):</p>
              </div>
            </div>
          </div>

          <div className="flex flex-col md:flex-row gap-6">
            <FileUploadBox title="Վերբեռնել Նախահաշիվ (Excel/PDF)" file={estimateFile} onFileChange={setEstimateFile} acceptedTypes=".pdf,.xlsx" />
            <FileUploadBox title="Վերբեռնել Կատարողական (Excel/PDF)" file={asBuiltFile} onFileChange={setAsBuiltFile} acceptedTypes=".pdf,.xlsx" />
          </div>
          <div className="text-center">
            <button
              onClick={handleCompare}
              disabled={!estimateFile || !asBuiltFile || loading || !subscriptionActive}
              className="px-8 py-4 bg-blue-600 text-white rounded-xl font-bold armenian-text shadow-lg hover:bg-blue-700 transition-all text-sm uppercase disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Համեմատել ծավալները
            </button>
            {!subscriptionActive && <p className="text-xs text-red-500 mt-2">Այս գործառույթը հասանելի է միայն ակտիվ բաժանորդագրության դեպքում։</p>}
          </div>
        </div>
      )}

      {loading && (
        <div className="text-center py-20">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-blue-600 font-bold armenian-text animate-pulse">AI-ն վերլուծում է փաստաթղթերը...</p>
        </div>
      )}

      {error && <div className="p-4 bg-red-50 text-red-700 rounded-xl text-sm armenian-text flex items-center gap-2 border border-red-100">⚠️ {error}</div>}

      {result && (
        <div ref={comparisonRef} className="grid grid-cols-12 gap-8 animate-in fade-in duration-500 bg-white p-4 rounded-2xl">
          <div className="col-span-12 lg:col-span-8">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="p-4 border-b border-slate-100 flex justify-between items-center">
                <h3 className="font-bold armenian-text text-slate-800">Համեմատության Աղյուսակ</h3>
              </div>
              <div className="overflow-x-auto max-h-[600px]">
                <table className="w-full text-sm text-left">
                  <thead className="bg-slate-50 sticky top-0 z-10">
                    <tr>
                      <th className="px-4 py-3 font-bold text-slate-500 uppercase text-[10px] armenian-text">Աշխատանքի անվանում</th>
                      <th className="px-4 py-3 font-bold text-slate-500 uppercase text-[10px] armenian-text">Չ/Մ</th>
                      <th className="px-4 py-3 font-bold text-slate-500 uppercase text-[10px] armenian-text text-right">Նախահաշիվ</th>
                      <th className="px-4 py-3 font-bold text-slate-500 uppercase text-[10px] armenian-text text-right">Փաստացի</th>
                      <th className="px-4 py-3 font-bold text-slate-500 uppercase text-[10px] armenian-text text-right">Շեղում</th>
                      <th className="px-4 py-3 font-bold text-slate-500 uppercase text-[10px] armenian-text text-right">Գին</th>
                      <th className="px-4 py-3 font-bold text-slate-500 uppercase text-[10px] armenian-text text-center">Կարգավիճակ</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {result.comparisonTable.map((row, index) => {
                      const variance = row.actualQty - row.plannedQty;
                      let varianceColor = 'text-slate-700';
                      if (variance > 0) varianceColor = 'text-red-600';
                      if (variance < 0) varianceColor = 'text-green-600';
                      return (
                        <tr key={index} className="hover:bg-slate-50/50 transition-colors">
                          <td className="px-4 py-3 font-medium text-slate-800 armenian-text leading-relaxed">{row.itemName}</td>
                          <td className="px-4 py-3 text-slate-500 armenian-text whitespace-nowrap">{row.unit}</td>
                          <td className="px-4 py-3 text-slate-500 font-mono text-right">{row.plannedQty.toFixed(2)}</td>
                          <td className="px-4 py-3 text-slate-800 font-bold font-mono text-right">{row.actualQty.toFixed(2)}</td>
                          <td className={`px-4 py-3 font-bold font-mono text-right ${varianceColor}`}>
                            {variance > 0 ? '+' : ''}{variance.toFixed(2)}
                          </td>
                          <td className="px-4 py-3 text-right">
                            <div className="flex flex-col items-end">
                              <span className="text-[10px] text-slate-400 font-mono">{(row.unitPrice || 0).toLocaleString()} դր.</span>
                              <span className="text-xs font-bold text-slate-700 font-mono">{(row.totalPrice || 0).toLocaleString()} դր.</span>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex justify-center">
                              <StatusIcon variance={variance} planned={row.plannedQty} />
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <div className="col-span-12 lg:col-span-4">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-5 sticky top-24">
              <h3 className="font-bold armenian-text text-slate-800 text-lg border-b pb-3">AI Ամփոփում</h3>
              <div className="space-y-4">
                <div>
                  <p className="text-[10px] uppercase font-bold text-slate-400 armenian-text">Ընդհանուր նախահաշիվ</p>
                  <p className="text-xl font-black text-slate-700">{result.summary.totalPlannedCost}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase font-bold text-slate-400 armenian-text">Ընդհանուր փաստացի ծախս</p>
                  <p className="text-xl font-black text-rose-600">{result.summary.totalActualCost}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase font-bold text-slate-400 armenian-text">Տոկոսային ավարտվածություն</p>
                  <div className="w-full bg-slate-200 rounded-full h-2.5 mt-1">
                    <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: `${result.summary.percentComplete}%` }}></div>
                  </div>
                  <p className="text-right text-xs font-bold mt-1">{result.summary.percentComplete.toFixed(1)}%</p>
                </div>
              </div>

              <div>
                <h4 className="text-xs font-bold text-amber-800 uppercase armenian-text mb-3 tracking-widest pt-4 border-t">Հիմնական շեղումներ</h4>
                <ul className="list-disc pl-5 space-y-2 text-xs text-amber-900 armenian-text">
                  {result.summary.keyDiscrepancies.map((item, index) => (
                    <li key={index}>{item}</li>
                  ))}
                </ul>
              </div>
              <AccuracyHint />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VolumeComparison;
