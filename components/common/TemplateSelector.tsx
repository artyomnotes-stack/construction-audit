
import React from 'react';
import { Template } from '../../types';

interface TemplateSelectorProps {
    templates: Template[];
    onSelect: (prompt: string) => void;
}

const TemplateSelector: React.FC<TemplateSelectorProps> = ({ templates, onSelect }) => (
    <div className="mt-4">
        <label className="text-[10px] font-bold text-slate-500 uppercase armenian-text">Կամ ընտրեք շաբլոնից</label>
        <select
            className="w-full mt-1 px-3 py-2 text-xs rounded-lg border border-slate-300 outline-none focus:border-blue-500 bg-white"
            onChange={(e) => {
                const template = templates.find(t => t.id === e.target.value);
                if (template) onSelect(template.prompt);
                e.target.value = ""; // Reset dropdown
            }}
        >
            <option value="">-- Ընտրել պահպանված հարցում --</option>
            {templates.map(t => <option key={t.id} value={t.id}>{t.title}</option>)}
        </select>
    </div>
);

export default TemplateSelector;
