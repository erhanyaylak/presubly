import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  FileText,
  BookOpen,
  MessageSquare,
  ClipboardCheck,
  Globe,
  Key,
  Sun,
  Moon,
  ChevronRight,
  ArrowLeft,
  Settings,
  LogOut,
  User,
  Zap,
  ShieldCheck,
  Info
} from 'lucide-react';
import { View, Language, Tool } from './types';
import PeerReview from './components/PeerReview';
import EditorialAssessment from './components/EditorialAssessment';
import ResponseAssistant from './components/ResponseAssistant';
import SubmissionChecklist from './components/SubmissionChecklist';

const TOOLS: Tool[] = [
  {
    id: 'review',
    num: '01',
    title: { tr: 'Bilimsel Hakem Incelemesi', en: 'Scientific Peer Review' },
    desc: { tr: '7 kriter uzerinden 100 puanlik degerlendirme ve Kabul/Red tahmini.', en: '100-point assessment across 7 criteria with Accept/Reject prediction.' },
    features: { tr: [], en: [] },
    cost: 2,
    status: 'live',
    gradient: ''
  },
  {
    id: 'editorial',
    num: '02',
    title: { tr: 'Editoryal Degerlendirme', en: 'Editorial Assessment' },
    desc: { tr: 'Kapsam uyumu, etik analizi ve karar bildirimi mektubu.', en: 'Scope fit, ethics analysis and decision notification letter.' },
    features: { tr: [], en: [] },
    cost: 2,
    status: 'live',
    gradient: ''
  },
  {
    id: 'response',
    num: '03',
    title: { tr: 'Yanit Asistani', en: 'Response Assistant' },
    desc: { tr: 'Hakem yorumlarina ICMJE formatinda profesyonel yanit.', en: 'Professional ICMJE-format responses to reviewer comments.' },
    features: { tr: [], en: [] },
    cost: 1,
    status: 'live',
    gradient: ''
  },
  {
    id: 'checklist',
    num: '04',
    title: { tr: 'Submission Checklist', en: 'Submission Checklist' },
    desc: { tr: 'CONSORT, STROBE, PRISMA standartlarina gore otomatik kontrol.', en: 'Automatic checks against CONSORT, STROBE, PRISMA standards.' },
    features: { tr: [], en: [] },
    cost: 1,
    status: 'live',
    gradient: ''
  }
];

const SidebarItem = ({ icon: Icon, label, active, onClick, collapsed }: { icon: any; label: string; active: boolean; onClick: () => void; collapsed: boolean }) => (
  <button
    onClick={onClick}
    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
      active
        ? 'bg-[#0A3D3D] text-white shadow-md'
        : 'text-[#5E8272] hover:bg-[#E8F0EC] hover:text-[#0A1A14]'
    } ${collapsed ? 'justify-center' : ''}`}
  >
    <Icon size={18} className="flex-shrink-0" />
    {!collapsed && <span className="truncate">{label}</span>}
  </button>
);

export default function App() {
  const [view, setView] = useState<View>('home');
  const [lang, setLang] = useState<Language>('tr');
  const [apiKey, setApiKey] = useState('');
  const [showSettings, setShowSettings] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('psb_lang');
    if (saved === 'tr' || saved === 'en') setLang(saved);
    const key = localStorage.getItem('psb_api_key');
    if (key) setApiKey(key);
  }, []);

  const toggleLang = () => {
    const next = lang === 'tr' ? 'en' : 'tr';
    setLang(next);
    localStorage.setItem('psb_lang', next);
  };

  const saveApiKey = (key: string) => {
    setApiKey(key);
    localStorage.setItem('psb_api_key', key);
  };

  const T = {
    tr: { home: 'Ana Sayfa', tools: 'Araclar', settings: 'Ayarlar', apiLabel: 'Gemini API Key', apiPlaceholder: 'API anahtarinizi girin...', save: 'Kaydet', heroTitle: 'Gondermeden once', heroAccent: 'hazir ol.', heroDesc: 'Makale metninizi yapistirin, disiplin ve hedef dergisini secin — AI saniyeler icinde degerlendirir.', startTool: 'Araci Ac' },
    en: { home: 'Home', tools: 'Tools', settings: 'Settings', apiLabel: 'Gemini API Key', apiPlaceholder: 'Enter your API key...', save: 'Save', heroTitle: 'Be ready before', heroAccent: 'you submit.', heroDesc: 'Paste your manuscript, select discipline and target journal — AI evaluates in seconds.', startTool: 'Open Tool' }
  };
  const t = T[lang];

  const renderContent = () => {
    if (showSettings) {
      return (
        <div className="animate-fade-up max-w-lg space-y-5">
          <h2 className="font-display text-2xl font-bold">{t.settings}</h2>
          <div>
            <label className="block text-sm font-medium text-[#3A5248] mb-1.5">{t.apiLabel}</label>
            <div className="flex gap-2">
              <input
                type="password"
                value={apiKey}
                onChange={e => saveApiKey(e.target.value)}
                placeholder={t.apiPlaceholder}
                className="flex-1 px-4 py-2.5 rounded-lg border border-[#D0DDD6] bg-white text-sm outline-none focus:border-[#1A7272] focus:ring-2 focus:ring-[#1A7272]/10 transition"
              />
            </div>
            <p className="text-xs text-[#98B8AA] mt-2">Google AI Studio &rarr; Get API Key</p>
          </div>
        </div>
      );
    }

    switch (view) {
      case 'review': return <PeerReview lang={lang} apiKey={apiKey} />;
      case 'editorial': return <EditorialAssessment lang={lang} apiKey={apiKey} />;
      case 'response': return <ResponseAssistant lang={lang} apiKey={apiKey} />;
      case 'checklist': return <SubmissionChecklist lang={lang} apiKey={apiKey} />;
      default:
        return (
          <div className="animate-fade-up">
            {/* Hero */}
            <div className="bg-[#0A3D3D] rounded-2xl p-8 mb-8 relative overflow-hidden">
              <div className="absolute inset-0 opacity-5" style={{ backgroundImage: 'repeating-linear-gradient(0deg,transparent,transparent 39px,rgba(255,255,255,.3) 39px,rgba(255,255,255,.3) 40px),repeating-linear-gradient(90deg,transparent,transparent 39px,rgba(255,255,255,.3) 39px,rgba(255,255,255,.3) 40px)' }}></div>
              <div className="relative z-10">
                <div className="font-display text-4xl font-bold text-[#F4F7F5] leading-tight mb-3">
                  {t.heroTitle}<br /><em className="text-[#F5AA1C]">{t.heroAccent}</em>
                </div>
                <p className="text-[#98B8AA] text-sm max-w-md leading-relaxed">{t.heroDesc}</p>
              </div>
            </div>

            {/* Tool cards */}
            <div className="grid grid-cols-2 gap-4">
              {TOOLS.map(tool => (
                <button
                  key={tool.id}
                  onClick={() => { setView(tool.id); setShowSettings(false); }}
                  className="bg-white rounded-xl border border-[#D0DDD6] p-5 text-left hover:shadow-lg hover:border-[#1A7272] transition-all duration-200 group"
                >
                  <div className="font-mono text-[9px] font-semibold tracking-[.24em] text-[#1A7272] mb-2">TOOL {tool.num}</div>
                  <div className="font-display text-lg font-bold mb-1.5 group-hover:text-[#0A3D3D]">{tool.title[lang]}</div>
                  <div className="text-sm text-[#5E8272] leading-relaxed mb-3">{tool.desc[lang]}</div>
                  <div className="flex items-center gap-1 text-xs font-semibold text-[#E8970A]">
                    {t.startTool} <ChevronRight size={14} />
                  </div>
                </button>
              ))}
            </div>
          </div>
        );
    }
  };

  return (
    <div className="flex h-screen bg-[#F4F7F5]">
      {/* Sidebar */}
      <aside className={`${collapsed ? 'w-16' : 'w-60'} flex-shrink-0 bg-white border-r border-[#D0DDD6] flex flex-col transition-all duration-200`}>
        {/* Logo */}
        <div className="p-4 border-b border-[#D0DDD6]">
          <button onClick={() => setCollapsed(!collapsed)} className="w-full flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#0A3D3D] to-[#115E5E] flex items-center justify-center relative flex-shrink-0">
              <span className="font-display text-[11px] font-bold text-[#FBCA5C] absolute top-[3px] left-[5px]">P</span>
              <span className="font-display text-[9px] font-bold text-[#F4F7F5]/50 absolute bottom-[3px] right-[4px]">s</span>
            </div>
            {!collapsed && <span className="font-display text-base font-bold">Pre<span className="text-[#E8970A]">sub</span>ly</span>}
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-3 space-y-1">
          <SidebarItem icon={Zap} label={t.home} active={view === 'home' && !showSettings} onClick={() => { setView('home'); setShowSettings(false); }} collapsed={collapsed} />
          <div className={`${collapsed ? '' : 'mt-4 mb-1'}`}>
            {!collapsed && <div className="font-mono text-[9px] font-semibold tracking-[.2em] text-[#98B8AA] px-3 mb-2">{t.tools.toUpperCase()}</div>}
          </div>
          <SidebarItem icon={FileText} label={TOOLS[0].title[lang]} active={view === 'review'} onClick={() => { setView('review'); setShowSettings(false); }} collapsed={collapsed} />
          <SidebarItem icon={BookOpen} label={TOOLS[1].title[lang]} active={view === 'editorial'} onClick={() => { setView('editorial'); setShowSettings(false); }} collapsed={collapsed} />
          <SidebarItem icon={MessageSquare} label={TOOLS[2].title[lang]} active={view === 'response'} onClick={() => { setView('response'); setShowSettings(false); }} collapsed={collapsed} />
          <SidebarItem icon={ClipboardCheck} label={TOOLS[3].title[lang]} active={view === 'checklist'} onClick={() => { setView('checklist'); setShowSettings(false); }} collapsed={collapsed} />
        </nav>

        {/* Bottom */}
        <div className="p-3 border-t border-[#D0DDD6] space-y-1">
          <SidebarItem icon={Settings} label={t.settings} active={showSettings} onClick={() => setShowSettings(true)} collapsed={collapsed} />
          <button onClick={toggleLang} className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-[#5E8272] hover:bg-[#E8F0EC] transition ${collapsed ? 'justify-center' : ''}`}>
            <Globe size={18} className="flex-shrink-0" />
            {!collapsed && <span>{lang === 'tr' ? 'English' : 'Turkce'}</span>}
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto p-8">
          {view !== 'home' && !showSettings && (
            <button onClick={() => setView('home')} className="flex items-center gap-1.5 text-sm text-[#5E8272] hover:text-[#0A1A14] mb-6 transition">
              <ArrowLeft size={16} /> {t.home}
            </button>
          )}
          {renderContent()}
        </div>
      </main>
    </div>
  );
}
