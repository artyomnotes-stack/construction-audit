
import React from 'react';
import Layout from '../Layout';
import { User } from 'firebase/auth';

interface PaywallProps {
    user: User;
    subscription: { expiryDate: Date; active: boolean } | null;
    loading: boolean;
    onSimulatePayment: () => void;
}

const Paywall: React.FC<PaywallProps> = ({ user, subscription, loading, onSimulatePayment }) => {
    const daysRemaining = subscription ? Math.max(0, Math.ceil((subscription.expiryDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24))) : 0;

    return (
        <Layout userEmail={user.email}>
            <div className="max-w-2xl mx-auto py-20 text-center">
                <div className="bg-white rounded-3xl border border-slate-200 shadow-xl p-10">
                    <div className="w-20 h-20 bg-rose-50 text-rose-500 rounded-2xl flex items-center justify-center mx-auto mb-6">
                        <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 00-2 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                    </div>
                    <h2 className="text-2xl font-black text-slate-800 armenian-text mb-4 uppercase">Մուտքը Սահմանափակ է</h2>
                    <p className="text-slate-500 armenian-text text-sm mb-8 leading-relaxed">
                        ArchiCheck AI-ի բոլոր պրոֆեսի온ալ գործիքներից օգտվելու համար անհրաժեշտ է ակտիվացնել 30-օրյա բաժանորդագրություն։
                    </p>

                    <div className="bg-slate-50 rounded-2xl p-6 mb-8 border border-slate-100 flex flex-col items-center">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Արժեքը</span>
                        <span className="text-4xl font-black text-blue-600">10,000 AMD</span>
                        <span className="text-xs text-slate-400 mt-1">/ 30 օր հասանելիություն</span>
                    </div>

                    {subscription && daysRemaining > 0 && (
                        <div className="mb-8 p-4 bg-amber-50 rounded-xl border border-amber-100 text-amber-700 text-xs font-bold armenian-text">
                            Ժամկետի ավարտին մնացել է {daysRemaining} օր, սակայն բաժանորդագրությունը սառեցված է։
                        </div>
                    )}

                    <div className="text-left space-y-4 mb-8">
                        <div className="p-4 bg-orange-50 rounded-xl border border-orange-100 flex items-start gap-3">
                            <div className="h-8 w-8 rounded-full bg-orange-100 flex items-center justify-center flex-shrink-0 text-orange-600 font-bold">1</div>
                            <div>
                                <p className="text-sm font-bold text-slate-800 armenian-text">Փոխանցում Idram-ով</p>
                                <p className="text-xs text-slate-600 armenian-text mt-1">Կատարեք <span className="font-bold text-slate-900">10,000 AMD</span> փոխանցում հետևյալ Idram ID-ին:</p>
                                <div className="mt-2 space-y-2">
                                    <div className="flex items-center gap-2 bg-white p-2 rounded border border-orange-200">
                                        <span className="text-[10px] text-slate-400 w-16 uppercase font-bold">Idram ID</span>
                                        <span className="text-sm font-mono font-bold text-slate-700">140714330</span>
                                    </div>
                                    <div className="flex items-center gap-2 bg-white p-2 rounded border border-orange-200">
                                        <span className="text-[10px] text-slate-400 w-16 uppercase font-bold">Քարտ</span>
                                        <span className="text-sm font-mono font-bold text-slate-700">4318 2900 1175 0151</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="p-4 bg-blue-50 rounded-xl border border-blue-100 flex items-start gap-3">
                            <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0 text-blue-600 font-bold">2</div>
                            <div>
                                <p className="text-sm font-bold text-slate-800 armenian-text">Ուղարկեք կտրոնը</p>
                                <p className="text-xs text-slate-600 armenian-text mt-1">Վճարման կտրոնը (screenshot) ուղարկեք մեզ:</p>
                                <div className="mt-2 space-y-1">
                                    <p className="text-xs text-slate-700">Email: <span className="font-bold">muradyanmar@gmail.com</span></p>
                                    <p className="text-xs text-slate-700">WhatsApp: <span className="font-bold">+374 94 575 370</span></p>
                                </div>
                            </div>
                        </div>

                        <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-100 flex items-start gap-3">
                            <div className="h-8 w-8 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0 text-emerald-600 font-bold">3</div>
                            <div>
                                <p className="text-sm font-bold text-slate-800 armenian-text">Սպասեք ակտիվացմանը</p>
                                <p className="text-xs text-slate-600 armenian-text mt-1">Մենք կստուգենք վճարումը և կակտիվացնենք բաժանորդագրությունը 30 րոպեի ընթացքում:</p>
                            </div>
                        </div>
                    </div>

                    <p className="text-[10px] text-slate-400 mt-6 armenian-text italic">
                        * Խնդրում ենք փոխանցման նպատակ դաշտում նշել ձեր գրանցման էլ. հասցեն:
                    </p>
                </div>
            </div>
        </Layout>
    );
};

export default Paywall;
