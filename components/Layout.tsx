
import React from 'react';
import { isSubscriptionValid, getDaysRemaining } from '../utils/subscriptionUtils';
import { auth } from '../services/firebase';
import { signOut } from 'firebase/auth';

interface LayoutProps {
  children: React.ReactNode;
  subscription?: {
    expiryDate: Date;
    active: boolean;
  };
  userEmail?: string | null;
}

const Layout: React.FC<LayoutProps> = ({ children, subscription, userEmail }) => {
  const isValid = subscription ? isSubscriptionValid(subscription.expiryDate, subscription.active) : false;
  const daysLeft = subscription ? getDaysRemaining(subscription.expiryDate) : 0;

  const handleSignOut = () => {
    signOut(auth);
  };

  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-slate-900 text-white shadow-lg sticky top-0 z-50">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="bg-blue-600 p-2 rounded-lg">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011-1v5m-4 0h4" />
              </svg>
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight armenian-text">ArchiCheck AI</h1>
              <p className="text-[10px] text-slate-400 uppercase tracking-widest armenian-text">ՀՀ Շինարարական Նորմերի Աուդիտ</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {userEmail && (
              <div className="hidden lg:flex flex-col items-end mr-2">
                <span className="text-[10px] text-slate-400 uppercase font-bold tracking-tighter">Օգտատեր</span>
                <span className="text-xs font-medium text-slate-200">{userEmail}</span>
              </div>
            )}
            
            {subscription && (
              <div className={`flex items-center gap-2 px-3 py-1 rounded-full border text-[10px] font-bold armenian-text ${isValid ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-rose-500/10 border-rose-500/20 text-rose-400'}`}>
                <div className={`w-1.5 h-1.5 rounded-full ${isValid ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`}></div>
                {isValid ? `ՊՐԵՄԻՈՒՄ • ${daysLeft} ՕՐ` : 'ԺԱՄԿԵՏԸ ՍՊԱՌՎԱԾ Է'}
              </div>
            )}

            {userEmail && (
              <button 
                onClick={handleSignOut}
                className="p-2 text-slate-400 hover:text-white transition-colors"
                title="Դուրս գալ"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="flex-grow container mx-auto px-4 py-8">
        {children}
      </main>

      <footer className="bg-slate-100 border-t py-8 mt-12">
        <div className="container mx-auto px-4 text-center">
          <p className="text-slate-500 text-sm armenian-text">
            © 2024 ArchiCheck AI - Բոլոր իրավունքները պաշտպանված են։
          </p>
          <p className="text-slate-400 text-xs mt-2 italic armenian-text">
            Ստեղծված է ՀՀ շինարարության ոլորտի մասնագետների համար։
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Layout;
