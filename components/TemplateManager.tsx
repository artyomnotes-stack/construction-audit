
import React, { useState, useEffect } from 'react';
import { Template } from '../types';

interface TemplateManagerProps {
  templates: Template[];
  onCreate: (template: Omit<Template, 'id'>) => void;
  onUpdate: (template: Template) => void;
  onDelete: (id: string) => void;
}

const TemplateManager: React.FC<TemplateManagerProps> = ({ templates, onCreate, onUpdate, onDelete }) => {
  const [editingTemplate, setEditingTemplate] = useState<Template | null>(null);
  const [title, setTitle] = useState('');
  const [prompt, setPrompt] = useState('');

  useEffect(() => {
    if (editingTemplate) {
      setTitle(editingTemplate.title);
      setPrompt(editingTemplate.prompt);
    } else {
      setTitle('');
      setPrompt('');
    }
  }, [editingTemplate]);

  const handleSave = () => {
    if (!title.trim() || !prompt.trim()) {
      alert('Վերնագիրը և հարցումը չեն կարող դատարկ լինել։');
      return;
    }
    if (editingTemplate) {
      onUpdate({ ...editingTemplate, title, prompt });
    } else {
      onCreate({ title, prompt });
    }
    setEditingTemplate(null);
  };

  const handleCancel = () => {
    setEditingTemplate(null);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
       <div className="col-span-1 md:col-span-3 mb-6 p-6 bg-white rounded-2xl border border-slate-200 shadow-sm">
        <h2 className="text-xl font-bold text-slate-800 armenian-text text-center">6. Շաբլոնների Կառավարում</h2>
        <p className="text-sm text-slate-600 armenian-text mt-2 text-center leading-relaxed">
            Խնայեք ձեր ժամանակը՝ ստեղծելով հաճախակի օգտագործվող հարցումների ձևանմուշներ։ Այս շաբլոնները հասանելի կլինեն մյուս գործիքներում՝ թույլ տալով արագ կիրառել բարդ հարցումներ առանց դրանք ամեն անգամ մուտքագրելու։
        </p>
        <div className="mt-4 text-xs text-left text-slate-500 armenian-text space-y-1 bg-slate-50 p-4 rounded-lg">
            <p><strong>Ինչպե՞ս օգտվել:</strong></p>
            <p>1. <strong>Ստեղծեք նոր շաբլոն՝</strong> լրացնելով ձախ կողմի «Վերնագիր» և «Հարցման Տեքստ» դաշտերը։</p>
            <p>2. <strong>Խմբագրեք կամ ջնջեք</strong> առկա շաբլոնները՝ օգտագործելով աջ կողմի ցանկում գտնվող կոճակները։</p>
            <p>3. Օգտագործեք ձեր պահպանված շաբլոնները «Աուդիտ», «Խորհրդատու», «Խնդիրներ» և «Հատակագծեր» բաժիններում։</p>
        </div>
    </div>

      {/* Form Section */}
      <div className="md:col-span-1">
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm sticky top-24">
          <h3 className="text-lg font-bold text-slate-800 armenian-text mb-4">
            {editingTemplate ? 'Խմբագրել Շաբլոնը' : 'Ստեղծել Նոր Շաբլոն'}
          </h3>
          <div className="space-y-4">
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase armenian-text block mb-1">Շաբլոնի Վերնագիր</label>
              <input
                type="text"
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="Օրինակ՝ Հրդեհային անվտանգության ստուգում"
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase armenian-text block mb-1">Հարցման Տեքստ</label>
              <textarea
                rows={8}
                value={prompt}
                onChange={e => setPrompt(e.target.value)}
                placeholder="Գրեք ձեր հարցումն այստեղ..."
                className="w-full px-3 py-2 rounded-lg border border-slate-300 outline-none text-xs armenian-text focus:border-blue-500"
              />
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleSave}
                className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg font-bold armenian-text shadow-md hover:bg-blue-700 transition-all text-sm uppercase"
              >
                {editingTemplate ? 'Պահպանել' : 'Ավելացնել'}
              </button>
              {editingTemplate && (
                <button
                  onClick={handleCancel}
                  className="px-4 py-3 bg-slate-200 text-slate-700 rounded-lg font-bold armenian-text hover:bg-slate-300 transition-all text-sm uppercase"
                >
                  Չեղարկել
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* List Section */}
      <div className="md:col-span-2">
        <h3 className="text-lg font-bold text-slate-800 armenian-text mb-4">Պահպանված Շաբլոններ</h3>
        {templates.length === 0 ? (
          <div className="text-center py-16 px-6 bg-slate-50 rounded-2xl border border-dashed">
            <p className="text-slate-500 armenian-text">Դուք դեռ շաբլոններ չունեք։</p>
            <p className="text-slate-400 text-sm armenian-text mt-1">Ստեղծեք ձեր առաջին շաբլոնը՝ ձախ կողմի դաշտերը լրացնելով։</p>
          </div>
        ) : (
          <div className="space-y-3">
            {templates.map(template => (
              <div key={template.id} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm transition-all hover:border-blue-400 hover:shadow-md">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-bold text-blue-800 armenian-text">{template.title}</h4>
                    <p className="text-xs text-slate-500 armenian-text mt-1 line-clamp-2">{template.prompt}</p>
                  </div>
                  <div className="flex gap-2 flex-shrink-0 ml-4">
                    <button
                      onClick={() => setEditingTemplate(template)}
                      className="p-2 text-slate-400 hover:text-blue-600 transition-colors"
                      title="Խմբագրել"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.5L16.732 3.732z"></path></svg>
                    </button>
                    <button
                      onClick={() => { if(confirm(`Վստա՞հ եք, որ ուզում եք ջնջել «${template.title}» շաբլոնը։`)) onDelete(template.id) }}
                      className="p-2 text-slate-400 hover:text-red-600 transition-colors"
                      title="Ջնջել"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default TemplateManager;
