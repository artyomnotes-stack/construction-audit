
import React from 'react';

const AccuracyHint: React.FC = () => (
    <div className="mt-8 flex items-start gap-3 p-3 bg-slate-50 rounded-lg border border-slate-100">
        <svg className="w-5 h-5 text-slate-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <p className="text-[10px] text-slate-400 armenian-text leading-relaxed">
            Հուշում. Բոլոր տիրույթներում այս տվյալները գեներացվել են ԱԲ-ի կողմից, ունեն մոտավորապես 90% ճշտություն։ Տրամադրված պատասխանները խորհրդատվական են։ Վերջնական պատասխանատվությունը կրում է նախագծողը։
        </p>
    </div>
);

export default AccuracyHint;
