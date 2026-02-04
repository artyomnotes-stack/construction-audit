
import React, { useState, useEffect, useRef } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { doc, getDoc, updateDoc, Timestamp, setDoc } from 'firebase/firestore';
import { auth, db } from './services/firebase';
import { GoogleGenAI } from "@google/genai";
import { performAudit, performCustomTask, performPriorityAudit, performLayoutAudit, generateAudioResponse } from './services/geminiService';
import { AuditRequest, AuditResponse, PriorityTask, Template, VolumeComparisonResponse, ChatMessage } from './types';
import { INITIAL_AUDIT_TASKS, INITIAL_PRIORITY_TASKS, PROJECT_CATEGORIES } from './constants';

// Components
import Layout from './components/Layout';
import AuthPage from './components/auth/AuthPage';
import Paywall from './components/subscription/Paywall';
import Sidebar from './components/dashboard/Sidebar';
import AccuracyHint from './components/common/AccuracyHint';

// Tabs
import AuditTab from './components/dashboard/tabs/AuditTab';
import ConsultantTab from './components/dashboard/tabs/ConsultantTab';
import PriorityTab from './components/dashboard/tabs/PriorityTab';
import LayoutTab from './components/dashboard/tabs/LayoutTab';
import AIChat from './components/AIChat';
import TemplateManager from './components/TemplateManager';
import VolumeComparison from './components/VolumeComparison';


const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY });


function App() {
  // Auth & Subscription State
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [subscription, setSubscription] = useState<{ expiryDate: Date; active: boolean } | null>(null);
  const [simulatingPayment, setSimulatingPayment] = useState(false);

  // App State
  const [activeTab, setActiveTab] = useState<'audit' | 'consultant' | 'priority' | 'layout' | 'volume' | 'templates' | 'chat'>('audit');

  // Dashboard State
  const [form, setForm] = useState<AuditRequest>({
    projectName: '',
    category: PROJECT_CATEGORIES[0],
    projectDescription: '',
    files: [],
    normFiles: []
  });

  // Audit Tab State
  const [auditDisciplines, setAuditDisciplines] = useState<PriorityTask[]>(INITIAL_AUDIT_TASKS);
  const [auditQuestion, setAuditQuestion] = useState('');
  const [auditResult, setAuditResult] = useState<AuditResponse | null>(null);
  const [auditLoading, setAuditLoading] = useState(false);
  const [auditProgress, setAuditProgress] = useState(0);
  const [auditTimeLeft, setAuditTimeLeft] = useState(0);

  // Consultant Tab State
  const [userTask, setUserTask] = useState('');
  const [consultantResult, setConsultantResult] = useState<string | null>(null);
  const [consultantLoading, setConsultantLoading] = useState(false);
  const [consultantProgress, setConsultantProgress] = useState(0);
  const [consultantTimeLeft, setConsultantTimeLeft] = useState(0);

  // Priority Tab State
  const [priorityTasks, setPriorityTasks] = useState<PriorityTask[]>(INITIAL_PRIORITY_TASKS);
  const [priorityQuestion, setPriorityQuestion] = useState('');
  const [priorityResult, setPriorityResult] = useState<string | null>(null);
  const [priorityLoading, setPriorityLoading] = useState(false);
  const [priorityProgress, setPriorityProgress] = useState(0);
  const [priorityTimeLeft, setPriorityTimeLeft] = useState(0);

  // Layout Tab State
  const [layoutQuestion, setLayoutQuestion] = useState('');
  const [layoutResult, setLayoutResult] = useState<string | null>(null);
  const [layoutLoading, setLayoutLoading] = useState(false);
  const [layoutProgress, setLayoutProgress] = useState(0);
  const [layoutTimeLeft, setLayoutTimeLeft] = useState(0);

  // Chat State
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [chatLoading, setChatLoading] = useState(false);

  // Common State
  const [audioLoading, setAudioLoading] = useState(false);
  const [templates, setTemplates] = useState<Template[]>(() => {
    const saved = localStorage.getItem('archi_templates');
    return saved ? JSON.parse(saved) : [];
  });

  // Auth Effect
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
        if (userDoc.exists()) {
          const data = userDoc.data();
          const subMap = data.subscription || {};

          // Check both root-level fields and the subscription map
          const expiryDate = subMap.expiryDate?.toDate() || data.expiryDate?.toDate();
          const isActive = (data.subscriptionActive === true || subMap.active === true) &&
            (expiryDate && expiryDate > new Date());

          setSubscription({
            expiryDate: expiryDate || new Date(),
            active: !!isActive
          });
        }
      } else {
        setSubscription(null);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // Templates Effect
  useEffect(() => {
    localStorage.setItem('archi_templates', JSON.stringify(templates));
  }, [templates]);


  // Helper Functions
  const simulateProgress = (setProgress: (val: number) => void, setTimeLeft: (val: number) => void, durationMs: number) => {
    let elapsed = 0;
    const interval = 100;
    const timer = setInterval(() => {
      elapsed += interval;
      const percent = Math.min(99, Math.floor((elapsed / durationMs) * 100));
      setProgress(percent);
      setTimeLeft(Math.max(0, Math.ceil((durationMs - elapsed) / 1000)));

      if (elapsed >= durationMs) clearInterval(timer);
    }, interval);
    return timer;
  };

  const clearResults = () => {
    setAuditResult(null);
    setConsultantResult(null);
    setPriorityResult(null);
    setLayoutResult(null);
  };

  const handleValidation = () => {
    if (form.normFiles.length === 0) {
      alert("Խնդրում ենք կցել նորմատիվ փաստաթղթեր:");
      return false;
    }
    if (form.files.length === 0) {
      alert("Խնդրում ենք կցել նախագծային ֆայլեր:");
      return false;
    }
    if (!form.projectName) {
      alert("Խնդրում ենք նշել նախագծի անվանումը:");
      return false;
    }
    return true;
  };

  // Handlers
  const handleSimulatePayment = async () => {
    if (!user) return;
    setSimulatingPayment(true);
    setTimeout(async () => {
      const newExpiry = new Date();
      newExpiry.setDate(newExpiry.getDate() + 30);
      await updateDoc(doc(db, 'users', user.uid), {
        subscriptionActive: true,
        expiryDate: Timestamp.fromDate(newExpiry),
        lastPaymentDate: Timestamp.fromDate(new Date())
      });
      setSubscription({ expiryDate: newExpiry, active: true });
      setSimulatingPayment(false);
      alert('Վճարումը հաջողվեց: Բաժանորդագրությունը ակտիվացված է:');
    }, 2000);
  };

  const handleNormsUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) setForm(prev => ({ ...prev, normFiles: [...prev.normFiles, ...Array.from(e.target.files!)] }));
  };

  const handleProjectFilesUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) setForm(prev => ({ ...prev, files: [...prev.files, ...Array.from(e.target.files!)] }));
  };

  const removeNormFile = (index: number) => {
    setForm(prev => ({ ...prev, normFiles: prev.normFiles.filter((_, i) => i !== index) }));
  };

  const removeProjectFile = (index: number) => {
    setForm(prev => ({ ...prev, files: prev.files.filter((_, i) => i !== index) }));
  };

  const handleDownloadAudio = async (text: string) => {
    if (!text) return;
    setAudioLoading(true);
    try {
      const audioBlob = await generateAudioResponse(text);
      const url = URL.createObjectURL(audioBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'report_audio.wav';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error: any) {
      alert(error.message);
    } finally {
      setAudioLoading(false);
    }
  };


  // Ref for file input
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Helper to convert File to Base64
  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = error => reject(error);
    });
  };

  // Helper to convert Base64 to File
  const base64ToFile = async (base64: string, filename: string, mimeType: string): Promise<File> => {
    const res = await fetch(base64);
    const buf = await res.arrayBuffer();
    return new File([buf], filename, { type: mimeType });
  };

  const handleSaveProject = async () => {
    try {
      // Convert files to Base64
      const filesBase64 = await Promise.all(form.files.map(async f => ({
        name: f.name,
        type: f.type,
        size: f.size,
        content: await fileToBase64(f)
      })));

      const normFilesBase64 = await Promise.all(form.normFiles.map(async f => ({
        name: f.name,
        type: f.type,
        size: f.size,
        content: await fileToBase64(f)
      })));

      const projectData = {
        version: '1.0',
        timestamp: new Date().toISOString(),
        form: { ...form, files: filesBase64, normFiles: normFilesBase64 }, // Save with Base64 content
        auditDisciplines,
        auditQuestion,
        auditResult,
        userTask,
        consultantResult,
        priorityTasks,
        priorityQuestion,
        priorityResult,
        layoutQuestion,
        layoutResult,
        activeTab,
        chatHistory,
        templates
      };

      const blob = new Blob([JSON.stringify(projectData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${form.projectName || 'project'}_data.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error saving project:', error);
      alert('Սխալ՝ չհաջողվեց պահպանել նախագիծը');
    }
  };

  const handleOpenProject = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const data = JSON.parse(e.target?.result as string);

        // Restore Files from Base64
        let restoredFiles: File[] = [];
        if (data.form?.files) {
          restoredFiles = await Promise.all(data.form.files.map((f: any) => base64ToFile(f.content, f.name, f.type)));
        }

        let restoredNormFiles: File[] = [];
        if (data.form?.normFiles) {
          restoredNormFiles = await Promise.all(data.form.normFiles.map((f: any) => base64ToFile(f.content, f.name, f.type)));
        }

        if (data.form) {
          setForm({
            ...data.form,
            files: restoredFiles,
            normFiles: restoredNormFiles
          });
        }

        if (data.auditDisciplines) setAuditDisciplines(data.auditDisciplines);
        if (data.auditQuestion) setAuditQuestion(data.auditQuestion);
        if (data.auditResult) setAuditResult(data.auditResult);
        if (data.userTask) setUserTask(data.userTask);
        if (data.consultantResult) setConsultantResult(data.consultantResult);
        if (data.priorityTasks) setPriorityTasks(data.priorityTasks);
        if (data.priorityQuestion) setPriorityQuestion(data.priorityQuestion);
        if (data.priorityResult) setPriorityResult(data.priorityResult);
        if (data.layoutQuestion) setLayoutQuestion(data.layoutQuestion);
        if (data.layoutResult) setLayoutResult(data.layoutResult);
        if (data.activeTab) setActiveTab(data.activeTab);
        if (data.chatHistory) setChatHistory(data.chatHistory);
        if (data.templates) setTemplates(data.templates);

        // Reset file input
        if (fileInputRef.current) fileInputRef.current.value = '';
        alert('Նախագիծը հաջողությամբ բեռնվեց');
      } catch (error) {
        console.error('Error loading project:', error);
        alert('Սխալ՝ ֆայլը վնասված է կամ սխալ ձևաչափի');
      }
    };
    reader.readAsText(file);
  };

  // Tab Actions
  const handleAuditSubmit = async () => {
    if (!handleValidation()) return;
    setAuditLoading(true);
    clearResults();
    const timer = simulateProgress(setAuditProgress, setAuditTimeLeft, 25000);

    try {
      const result = await performAudit(form, auditDisciplines, auditQuestion);
      setAuditResult(result);
    } catch (error: any) {
      alert(`Սխալ: ${error.message}`);
    } finally {
      clearInterval(timer);
      setAuditLoading(false);
      setAuditProgress(100);
    }
  };

  const handleConsultantSubmit = async () => {
    if (!handleValidation()) return;
    if (!userTask.trim()) return alert("Խնդրում ենք մուտքագրել հարցը:");

    setConsultantLoading(true);
    clearResults();
    const timer = simulateProgress(setConsultantProgress, setConsultantTimeLeft, 20000);

    try {
      const result = await performCustomTask(form, userTask);
      setConsultantResult(result);
    } catch (error: any) {
      alert(`Սխալ: ${error.message}`);
    } finally {
      clearInterval(timer);
      setConsultantLoading(false);
      setConsultantProgress(100);
    }
  };

  const handlePrioritySubmit = async () => {
    if (!handleValidation()) return;

    setPriorityLoading(true);
    clearResults();
    const timer = simulateProgress(setPriorityProgress, setPriorityTimeLeft, 30000);

    try {
      const result = await performPriorityAudit(form, priorityTasks, priorityQuestion);
      setPriorityResult(result);
    } catch (error: any) {
      alert(`Սխալ: ${error.message}`);
    } finally {
      clearInterval(timer);
      setPriorityLoading(false);
      setPriorityProgress(100);
    }
  };

  const handleLayoutSubmit = async () => {
    if (form.files.length === 0) return alert("Խնդրում ենք կցել հատակագծեր:");

    setLayoutLoading(true);
    clearResults();
    const timer = simulateProgress(setLayoutProgress, setLayoutTimeLeft, 35000);

    try {
      const result = await performLayoutAudit(form, layoutQuestion);
      setLayoutResult(result);
    } catch (error: any) {
      alert(`Սխալ: ${error.message}`);
    } finally {
      clearInterval(timer);
      setLayoutLoading(false);
      setLayoutProgress(100);
    }
  };

  const handleSendChatMessage = async (message: string) => {
    if (!message.trim()) return;

    const newMessage: ChatMessage = { role: 'user', content: message };
    setChatHistory(prev => [...prev, newMessage]);
    setChatLoading(true);

    try {
      // Prepare context from form files if available
      // Note: Real file processing for chat context would go here or be handled by geminiService
      // For now, we are just sending text

      const response = await ai.models.generateContent({
        model: 'gemini-flash-latest',
        contents: [
          {
            role: 'user', parts: [{
              text: `System Context: User is working on project "${form.projectName}". Category: ${form.category}. Description: ${form.projectDescription}. 
          Դու հանդես ես գալիս որպես **Hardcore Textbook Publisher (No-LaTeX Mode)**:
          - **ԱՐԳԵԼՎՈՒՄ Է** LaTeX-ի ($) կամ backslash-ի (\\) օգտագործումը:
          - Չափման միավորները գրիր միայն հայերեն տեքստով (մ³, կՎտ):
          - Թվերը կլորացրու մինչև 2 տասնորդական նիշ:
          - Օգտագործիր բացառապես Markdown:
          
          User Question: ${message}`
            }]
          }
        ]
      });

      const text = response.text;
      setChatHistory(prev => [...prev, { role: 'model', content: text }]);
    } catch (error: any) {
      setChatHistory(prev => [...prev, { role: 'model', content: `Սխալ: ${error.message}` }]);
    } finally {
      setChatLoading(false);
    }
  };

  // Template Actions
  const handleCreateTemplate = (t: Omit<Template, 'id'>) => {
    const newTemplate = { ...t, id: Date.now().toString() };
    setTemplates(prev => [...prev, newTemplate]);
  };
  const handleUpdateTemplate = (t: Template) => {
    setTemplates(prev => prev.map(temp => temp.id === t.id ? t : temp));
  };
  const handleDeleteTemplate = (id: string) => {
    setTemplates(prev => prev.filter(t => t.id !== id));
  };


  if (loading) return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
    </div>
  );

  if (!user) {
    return <AuthPage />;
  }

  if (!subscription?.active) {
    return (
      <Paywall
        user={user}
        subscription={subscription}
        loading={simulatingPayment}
        onSimulatePayment={handleSimulatePayment}
      />
    );
  }

  const volumePercent = (form.files.reduce((acc, f) => acc + f.size, 0) / (50 * 1024 * 1024)) * 100;
  const volumeMB = (form.files.reduce((acc, f) => acc + f.size, 0) / (1024 * 1024)).toFixed(1);

  return (
    <Layout userEmail={user.email} subscription={subscription}>
      <div className="flex flex-col gap-6 mb-8">
        {/* Top Control Bar */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-4 w-full md:w-auto">
            <div className="text-xs font-bold text-slate-500 armenian-text">Ծավալ:</div>
            <div className="bg-slate-100 rounded-full h-4 w-48 overflow-hidden relative border border-slate-200">
              <div className="bg-blue-500 h-full transition-all duration-500" style={{ width: `${Math.min(volumePercent, 100)}%` }}></div>
              <div className="absolute inset-0 flex items-center justify-center text-[9px] font-bold text-slate-600">{volumeMB} / 50 ՄԲ</div>
            </div>
            <div className="text-[10px] text-slate-400 armenian-text">Բոլոր ֆայլերը մնում են ձեր բրաուզերում:</div>
          </div>

          <div className="flex gap-3 w-full md:w-auto justify-end">
            <input type="file" ref={fileInputRef} className="hidden" accept=".json" onChange={handleOpenProject} />
            <button onClick={() => fileInputRef.current?.click()} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white border border-slate-300 text-slate-700 text-xs font-bold hover:bg-slate-50 transition-all armenian-text shadow-sm cursor-pointer">
              <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" /></svg>
              Բացել Նախագիծ
            </button>
            <button onClick={handleSaveProject} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-800 text-white text-xs font-bold hover:bg-slate-900 transition-all armenian-text shadow-sm cursor-pointer">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" /></svg>
              Պահպանել
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="bg-white px-2 rounded-xl border border-slate-200 shadow-sm overflow-x-auto">
          <div className="flex min-w-max">
            {[
              { id: 'audit', label: '1. ԱՈՒԴԻՏ', sub: 'Ամբողջական ստուգում' },
              { id: 'consultant', label: '2. ԽՈՐՀՐԴԱՏՈՒ', sub: 'Հաշվարկներ և Հարցեր' },
              { id: 'priority', label: '3. ԽՆԴԻՐՆԵՐ', sub: 'Դինամիկ վերլուծություն' },
              { id: 'layout', label: '4. ՀԱՏԱԿԱԳԾԵՐ', sub: 'Տեղային վերլուծություն' },
              { id: 'volume', label: '5. ԾԱՎԱԼՆԵՐ', sub: 'Կատարողական vs Նախահաշիվ' },
              { id: 'templates', label: '6. ՇԱԲԼՈՆՆԵՐ', sub: 'Հարցումների կառավարում' },
              { id: 'chat', label: '7. AI ՕԳՆԱԿԱՆ', sub: 'Ինտերակտիվ չաթ' },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`group flex flex-col items-start justify-center px-6 py-4 border-b-2 transition-all ${activeTab === tab.id ? 'border-blue-600' : 'border-transparent hover:bg-slate-50'}`}
              >
                <span className={`text-xs font-black uppercase tracking-wider mb-1 armenian-text ${activeTab === tab.id ? 'text-blue-900' : 'text-slate-400 group-hover:text-slate-600'}`}>{tab.label}</span>
                <span className={`text-[10px] armenian-text ${activeTab === tab.id ? 'text-blue-600 font-bold' : 'text-slate-300 group-hover:text-slate-500'}`}>{tab.sub}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

        {/* Sidebar Panel - hidden for some tabs */}
        {activeTab !== 'volume' && activeTab !== 'templates' && activeTab !== 'chat' && (
          <div className="lg:col-span-4 transition-all duration-300">
            <Sidebar
              form={form}
              setForm={setForm}
              handleNormsUpload={handleNormsUpload}
              removeNormFile={removeNormFile}
              handleProjectFilesUpload={handleProjectFilesUpload}
              removeProjectFile={removeProjectFile}
            />
          </div>
        )}

        {/* Main Content Panel */}
        <div className={`transition-all duration-300 ${activeTab === 'volume' || activeTab === 'templates' || activeTab === 'chat' ? 'lg:col-span-12' : 'lg:col-span-8'}`}>

          {activeTab === 'audit' && (
            <AuditTab
              auditDisciplines={auditDisciplines}
              updateAuditDiscipline={(id, updates) => setAuditDisciplines(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t))}
              auditQuestion={auditQuestion}
              setAuditQuestion={setAuditQuestion}
              handleAuditSubmit={handleAuditSubmit}
              loading={auditLoading}
              progress={auditProgress}
              timeLeft={auditTimeLeft}
              result={auditResult}
              AccuracyHint={AccuracyHint}
              handleDownloadAudio={() => handleDownloadAudio(auditResult || '')}
              audioLoading={audioLoading}
            />
          )}

          {activeTab === 'consultant' && (
            <ConsultantTab
              userTask={userTask}
              setUserTask={setUserTask}
              handleConsultantSubmit={handleConsultantSubmit}
              loading={consultantLoading}
              progress={consultantProgress}
              timeLeft={consultantTimeLeft}
              consultantResult={consultantResult}
              AccuracyHint={AccuracyHint}
              templates={templates}
              handleDownloadAudio={() => handleDownloadAudio(consultantResult || '')}
              audioLoading={audioLoading}
            />
          )}

          {activeTab === 'priority' && (
            <PriorityTab
              priorityTasks={priorityTasks}
              updatePriorityTask={(id, updates) => setPriorityTasks(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t))}
              priorityQuestion={priorityQuestion}
              setPriorityQuestion={setPriorityQuestion}
              handlePrioritySubmit={handlePrioritySubmit}
              loading={priorityLoading}
              progress={priorityProgress}
              timeLeft={priorityTimeLeft}
              priorityResult={priorityResult}
              AccuracyHint={AccuracyHint}
              templates={templates}
              handleDownloadAudio={() => handleDownloadAudio(priorityResult || '')}
              audioLoading={audioLoading}
            />
          )}

          {activeTab === 'layout' && (
            <LayoutTab
              layoutQuestion={layoutQuestion}
              setLayoutQuestion={setLayoutQuestion}
              handleLayoutSubmit={handleLayoutSubmit}
              loading={layoutLoading}
              progress={layoutProgress}
              timeLeft={layoutTimeLeft}
              layoutResult={layoutResult}
              AccuracyHint={AccuracyHint}
              templates={templates}
              handleDownloadAudio={() => handleDownloadAudio(layoutResult || '')}
              audioLoading={audioLoading}
            />
          )}

          {activeTab === 'volume' && (
            <VolumeComparison subscriptionActive={!!subscription?.active} />
          )}

          {activeTab === 'templates' && (
            <TemplateManager
              templates={templates}
              onCreate={handleCreateTemplate}
              onUpdate={handleUpdateTemplate}
              onDelete={handleDeleteTemplate}
            />
          )}

          {activeTab === 'chat' && (
            <AIChat
              history={chatHistory}
              onSendMessage={handleSendChatMessage}
              isLoading={chatLoading}
            />
          )}

        </div>
      </div>
    </Layout>
  );
}

export default App;
