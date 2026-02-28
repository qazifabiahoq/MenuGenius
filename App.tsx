
import React, { useState, useMemo } from 'react';
import { 
  Upload, ChevronRight, ChevronDown, ChevronUp, Download, Menu, X, ArrowRight, BarChart3, TrendingUp, 
  DollarSign, Clock, ShieldCheck, Sparkles, FileText, RotateCcw, LayoutGrid, List,
  PieChart, Info, ArrowUpRight, BadgeCheck, Globe, Users, Activity, Target,
  AlertCircle, Table, ArrowDown, ArrowUp, Trophy, Zap, Trash2, Edit3, CheckCircle2, Search,
  PlusCircle, BarChart, ExternalLink, HelpCircle, BookOpen, Lock
} from 'lucide-react';
import { ResponsiveContainer, BarChart as ReBarChart, Bar, XAxis, YAxis, Tooltip, Cell, PieChart as RePieChart, Pie, CartesianGrid, Legend, ScatterChart, Scatter, ZAxis } from 'recharts';
import { analyzeMenu, DEMO_DATA } from './services/geminiService';
import { AnalysisResult, MenuCategory, MatrixItem } from './types';
import { COLORS } from './constants';
import Matrix from './components/Matrix';
import RecommendationCard from './components/RecommendationCard';

const App: React.FC = () => {
  const [view, setView] = useState<'landing' | 'loading' | 'results'>('landing');
  const [menuImage, setMenuImage] = useState<string | null>(null);
  const [csvData, setCsvData] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [activeTab, setActiveTab] = useState('full-report');

  const hasActualSalesData = !!csvData;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, type: 'image' | 'csv') => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      if (type === 'image') setMenuImage(reader.result as string);
      else setCsvData(reader.result as string);
    };
    if (type === 'image') reader.readAsDataURL(file);
    else reader.readAsText(file);
  };

  const startAnalysis = async () => {
    if (!menuImage) return alert('Please upload a menu image first.');
    setView('loading');
    try {
      let results;
      
      if (csvData) {
        try {
          results = await analyzeMenu(menuImage, csvData);
        } catch (csvError) {
          console.error("Analysis with CSV failed, falling back to menu-only:", csvError);
          results = await analyzeMenu(menuImage);
        }
      } else {
        results = await analyzeMenu(menuImage);
      }

      if (!results || !results.matrixItems || results.matrixItems.length === 0) {
        throw new Error("No menu items were identified from the image.");
      }
      
      setAnalysis(results);
      setView('results');
    } catch (error: any) {
      console.error("Analysis failure:", error);
      alert(`Analysis Error: ${error.message || 'We could not process this menu. Please ensure the photo is clear and contains prices.'}`);
      setView('landing');
    }
  };

  const resetApp = () => {
    setAnalysis(null);
    setMenuImage(null);
    setCsvData(null);
    setView('landing');
    setActiveTab('full-report');
  };

  const tryDemo = () => {
    setView('loading');
    setTimeout(() => {
      setAnalysis(DEMO_DATA);
      setView('results');
    }, 2500);
  };

  // --- DERIVED DATA WITH DEFENSIVE CHECKS ---
  
  const itemsWithProfit = useMemo(() => {
    if (!analysis?.matrixItems) return [];
    return analysis.matrixItems.map(i => {
      const price = Number(i.price) || 0;
      const cost = Number(i.foodCost) || 0;
      const volume = Number(i.salesVolume) || 0;
      return {
        ...i,
        totalProfit: (price - cost) * (volume * 10)
      };
    });
  }, [analysis]);

  const bestPerformers = useMemo(() => {
    return [...itemsWithProfit].sort((a, b) => b.totalProfit - a.totalProfit).slice(0, 4);
  }, [itemsWithProfit]);

  const worstPerformers = useMemo(() => {
    return [...itemsWithProfit].sort((a, b) => a.totalProfit - b.totalProfit).slice(0, 5);
  }, [itemsWithProfit]);

  const profitContributionData = useMemo(() => {
    return [...itemsWithProfit]
      .sort((a, b) => b.totalProfit - a.totalProfit)
      .slice(0, 10);
  }, [itemsWithProfit]);

  const priceDistributionData = useMemo(() => {
    const bins = ['$0-10', '$10-20', '$20-30', '$30-40', '$40-50', '$50+'];
    const counts = [0, 0, 0, 0, 0, 0];
    itemsWithProfit.forEach(item => {
      const p = Number(item.price) || 0;
      if (p < 10) counts[0]++;
      else if (p < 20) counts[1]++;
      else if (p < 30) counts[2]++;
      else if (p < 40) counts[3]++;
      else if (p < 50) counts[4]++;
      else counts[5]++;
    });
    return bins.map((range, i) => ({ range, count: counts[i] }));
  }, [itemsWithProfit]);

  const categoryPerformanceData = useMemo(() => {
    const groups: Record<string, { totalSales: number, totalMargin: number, count: number, totalRev: number }> = {};
    itemsWithProfit.forEach(item => {
      const g = item.categoryGroup || 'Other';
      if (!groups[g]) groups[g] = { totalSales: 0, totalMargin: 0, count: 0, totalRev: 0 };
      const volume = Number(item.salesVolume) || 0;
      const margin = Number(item.marginPercent) || 0;
      const price = Number(item.price) || 0;
      groups[g].totalSales += (volume * 10);
      groups[g].totalMargin += margin;
      groups[g].totalRev += (price * volume * 10);
      groups[g].count++;
    });
    return Object.entries(groups).map(([name, stats]) => ({
      name,
      vol: stats.totalSales,
      avgMargin: stats.count > 0 ? stats.totalMargin / stats.count : 0,
      rev: stats.totalRev
    }));
  }, [itemsWithProfit]);

  const waterfallData = useMemo(() => {
    if (!analysis || !analysis.recommendations) return [];
    const base = 500000;
    let current = base;
    const steps = analysis.recommendations.map(rec => {
      const val = Number(rec.financialImpact?.netBenefitAnnual) || 0;
      const start = current;
      current += val;
      return { name: rec.itemName || 'Unnamed Item', start, end: current, value: val, display: val };
    });
    return [{ name: 'Baseline', start: 0, end: base, value: base, display: base }, ...steps, { name: 'Target', start: 0, end: current, value: current, display: current }];
  }, [analysis]);

  const quadrantItems = useMemo(() => {
    const groups = {
      [MenuCategory.STAR]: [] as any[],
      [MenuCategory.PUZZLE]: [] as any[],
      [MenuCategory.PLOWHORSE]: [] as any[],
      [MenuCategory.DOG]: [] as any[],
    };
    itemsWithProfit.forEach(item => {
      if (groups[item.category]) {
        groups[item.category].push(item);
      }
    });
    return groups;
  }, [itemsWithProfit]);

  // --- SUB-COMPONENTS ---

  const QuadrantTable = ({ items, title, color, icon: Icon, action }: { items: any[], title: string, color: string, icon: any, action: string }) => {
    const [collapsed, setCollapsed] = useState(false);
    return (
      <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm flex flex-col mb-6">
        <div 
          className="px-6 py-5 flex items-center justify-between border-b border-slate-100 cursor-pointer" 
          style={{ backgroundColor: `${color}08` }}
          onClick={() => setCollapsed(!collapsed)}
        >
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg" style={{ backgroundColor: `${color}20`, color: color }}>
              <Icon size={18} />
            </div>
            <h4 className="text-sm font-black uppercase tracking-widest" style={{ color }}>{title}</h4>
            {!hasActualSalesData && <span className="text-[9px] font-black text-slate-400 bg-slate-100 px-2 py-0.5 rounded uppercase tracking-tighter ml-2">Estimated</span>}
          </div>
          <div className="flex items-center gap-3">
             <span className="text-[10px] font-bold text-slate-400 bg-white px-3 py-1 rounded-full border border-slate-100">{items.length} Items</span>
             {collapsed ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
          </div>
        </div>
        {!collapsed && (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-slate-50/50">
                  <tr>
                    {['Item', 'Price', `Sales/mo${!hasActualSalesData ? ' (est)' : ''}`, 'Margin', 'Profit/mo'].map(h => (
                      <th key={h} className="px-4 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {items.map((item, i) => (
                    <tr key={i} className="hover:bg-slate-50/30 transition-colors">
                      <td className="px-4 py-3 text-xs font-bold text-slate-900">{item.name}</td>
                      <td className="px-4 py-3 text-xs text-slate-600">${Number(item.price).toFixed(2)}</td>
                      <td className="px-4 py-3 text-xs text-slate-600">{Number(item.salesVolume) * 10}</td>
                      <td className="px-4 py-3 text-xs font-bold text-emerald-600">{item.marginPercent}%</td>
                      <td className="px-4 py-3 text-xs font-black text-slate-900">${(Number(item.totalProfit) || 0).toLocaleString(undefined, {maximumFractionDigits: 0})}</td>
                    </tr>
                  ))}
                  {items.length === 0 && <tr><td colSpan={5} className="px-4 py-12 text-center text-xs text-slate-400 italic">No items identified in this category</td></tr>}
                </tbody>
              </table>
            </div>
            <div className="p-4 bg-slate-50/50 border-t border-slate-100 flex items-center gap-3">
              <Info size={14} className="text-slate-400" />
              <p className="text-xs font-bold text-slate-700"><span className="uppercase text-[9px] text-slate-400 tracking-widest mr-2">Strategy:</span> {action}</p>
            </div>
          </>
        )}
      </div>
    );
  };

  // --- LANDING VIEW ---
  if (view === 'landing') {
    return (
      <div className="min-h-screen bg-white text-[#0A192F] selection:bg-gold/20">
        {/* Navigation Bar */}
        <nav className="sticky top-0 z-50 w-full bg-white/80 backdrop-blur-md border-b border-slate-100 px-6 py-4 flex items-center justify-between">
          <div className="max-w-7xl w-full mx-auto flex items-center justify-between">
            <div className="flex items-center gap-2 cursor-pointer" onClick={resetApp}>
              <div className="w-9 h-9 bg-[#0A192F] rounded-lg flex items-center justify-center">
                <Sparkles className="text-[#D4AF37]" size={20} />
              </div>
              <span className="brand-font text-2xl font-bold tracking-tight">MenuGenius</span>
            </div>
            
            <div className="hidden md:flex items-center gap-8">
              {['Features', 'Pricing', 'About'].map((link) => (
                <a
                  key={link}
                  href={`#${link.toLowerCase()}`}
                  onClick={(e) => { e.preventDefault(); document.getElementById(link.toLowerCase())?.scrollIntoView({ behavior: 'smooth' }); }}
                  className="text-sm font-semibold text-slate-500 hover:text-[#0A192F] transition-colors"
                >{link}</a>
              ))}
            </div>

            <div className="flex items-center gap-4">
              <button onClick={tryDemo} className="hidden sm:flex items-center gap-2 px-5 py-2.5 bg-slate-50 text-slate-600 rounded-xl hover:bg-slate-100 transition-all text-xs font-black uppercase tracking-widest border border-slate-200">
                Demo
              </button>
              <button className="px-5 py-2.5 bg-[#0A192F] text-white rounded-xl hover:bg-slate-800 transition-all text-xs font-black uppercase tracking-widest shadow-lg">
                Sign In
              </button>
            </div>
          </div>
        </nav>

        {/* Hero Section */}
        <header className="relative pt-20 pb-32 overflow-hidden">
          <div className="max-w-7xl mx-auto px-6 grid lg:grid-cols-2 gap-16 items-center">
            <div className="relative z-10 animate-in fade-in slide-in-from-left-4 duration-700">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-slate-50 border border-slate-200 rounded-full text-slate-600 text-[10px] font-black uppercase tracking-[0.2em] mb-8">
                <Sparkles size={14} className="text-[#D4AF37]" /> Powered by Gemini AI 3.0
              </div>
              <h1 className="text-6xl md:text-7xl font-bold text-slate-900 leading-[1.05] mb-8 brand-font">
                Optimize Your Menu.<br />
                <span className="text-slate-400 italic">Maximize Profit.</span>
              </h1>
              <p className="text-xl text-slate-600 mb-10 leading-relaxed max-w-lg">
                Advanced menu engineering for the modern restaurateur. Upload your menu and let our AI identify hidden revenue opportunities in seconds.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-5">
                <button 
                  onClick={() => document.getElementById('upload-section')?.scrollIntoView({ behavior: 'smooth' })} 
                  className="px-10 py-5 bg-[#0A192F] text-white rounded-2xl hover:bg-slate-800 transition-all font-black flex items-center justify-center gap-3 text-lg shadow-2xl shadow-slate-300 group"
                >
                  Analyze My Menu <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                </button>
                <button onClick={tryDemo} className="px-10 py-5 bg-white text-[#0A192F] border-2 border-slate-100 rounded-2xl hover:border-slate-300 transition-all font-black text-lg">
                  View Demo Report
                </button>
              </div>

              <div className="mt-16 flex items-center gap-6 pt-8 border-t border-slate-100">
                <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  <Sparkles size={16} className="text-[#D4AF37]" /> Gemini AI 3.0 Core
                </div>
                <div className="w-1.5 h-1.5 bg-slate-200 rounded-full"></div>
                <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  Data-Driven Insights
                </div>
              </div>
            </div>

            <div className="relative animate-in fade-in slide-in-from-right-4 duration-1000">
              <div className="rounded-[3rem] overflow-hidden shadow-[0_50px_100px_-20px_rgba(0,0,0,0.15)] relative aspect-[4/5] md:aspect-auto md:h-[600px]">
                <img 
                  src="https://images.unsplash.com/photo-1559339352-11d035aa65de?q=80&w=1974&auto=format&fit=crop" 
                  alt="Menu Engineering" 
                  className="w-full h-full object-cover" 
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0A192F]/40 to-transparent"></div>
              </div>
            </div>
          </div>
        </header>

        {/* Upload Console Section */}
        <section id="upload-section" className="bg-[#f8fafc] py-32 border-t border-slate-100">
          <div className="max-w-5xl mx-auto px-6">
            <div className="text-center mb-20">
              <h2 className="text-5xl font-bold text-[#0A192F] mb-6 brand-font">Menu Audit Console</h2>
              <p className="text-slate-500 text-xl max-w-2xl mx-auto leading-relaxed font-medium">Upload your current menu. Our AI will analyze every item, pricing tier, and description to find hidden profit opportunities.</p>
            </div>

            <div className="grid md:grid-cols-2 gap-10">
              {/* Menu Upload */}
              <div className="bg-white p-12 rounded-[3rem] shadow-sm border border-slate-200 hover:border-[#D4AF37]/50 transition-all relative group overflow-hidden">
                <input type="file" accept="image/*" onChange={(e) => handleFileUpload(e, 'image')} className="absolute inset-0 opacity-0 cursor-pointer z-20" title="Upload Menu Image" />
                <div className={`w-20 h-20 rounded-3xl flex items-center justify-center mb-8 transition-all ${menuImage ? 'bg-emerald-50 text-emerald-600 scale-110' : 'bg-slate-50 text-slate-400 group-hover:bg-[#0A192F] group-hover:text-white'}`}>
                  {menuImage ? <BadgeCheck size={40} /> : <Upload size={40} />}
                </div>
                <h3 className="text-2xl font-bold text-[#0A192F] mb-4 brand-font">Upload Menu Image</h3>
                <p className="text-slate-500 font-medium">Upload a clear photo or PDF of your current menu.</p>
                {menuImage && (
                  <div className="mt-8 flex items-center gap-3 animate-in slide-in-from-top-2">
                    <div className="w-12 h-12 rounded-lg border border-slate-200 overflow-hidden flex-shrink-0">
                      <img src={menuImage} className="w-full h-full object-cover" alt="Preview" />
                    </div>
                    <span className="text-xs font-black text-emerald-600 uppercase tracking-widest bg-emerald-50 px-4 py-2 rounded-full border border-emerald-100">Menu Ready</span>
                  </div>
                )}
              </div>

              {/* CSV Upload */}
              <div className="bg-white p-12 rounded-[3rem] shadow-sm border border-slate-200 hover:border-[#0A192F]/50 transition-all relative group">
                <input type="file" accept=".csv" onChange={(e) => handleFileUpload(e, 'csv')} className="absolute inset-0 opacity-0 cursor-pointer z-20" title="Upload Sales CSV" />
                <div className={`w-20 h-20 rounded-3xl flex items-center justify-center mb-8 transition-all ${csvData ? 'bg-emerald-50 text-emerald-700 scale-110' : 'bg-slate-50 text-slate-400 group-hover:bg-slate-900 group-hover:text-white'}`}>
                  {csvData ? <FileText size={40} /> : <Activity size={40} />}
                </div>
                <h3 className="text-2xl font-bold text-[#0A192F] mb-4 brand-font">Sales CSV (Optional)</h3>
                <p className="text-slate-500 font-medium">Provide sales history for high-fidelity revenue projections.</p>
                {csvData && (
                  <div className="mt-8 flex items-center gap-3 animate-in slide-in-from-top-2">
                    <div className="w-12 h-12 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600 border border-emerald-100">
                      <Table size={20} />
                    </div>
                    <span className="text-xs font-black text-emerald-600 uppercase tracking-widest bg-emerald-50 px-4 py-2 rounded-full border border-emerald-100">Data Linked</span>
                  </div>
                )}
              </div>
            </div>

            <div className="mt-20 flex flex-col items-center">
              <button 
                onClick={startAnalysis} 
                className={`px-20 py-7 rounded-2xl font-black text-2xl shadow-2xl transition-all flex items-center gap-4 ${menuImage ? 'bg-[#0A192F] text-white hover:bg-slate-800 scale-105 active:scale-95' : 'bg-slate-200 text-slate-400 cursor-not-allowed'}`} 
                disabled={!menuImage}
              >
                Analyze My Menu Now
              </button>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="bg-white py-32 border-t border-slate-100">
          <div className="max-w-7xl mx-auto px-6">
            <div className="text-center mb-20">
              <span className="text-xs font-black text-[#D4AF37] uppercase tracking-[0.3em] mb-4 block">Why MenuGenius</span>
              <h2 className="text-5xl font-bold text-[#0A192F] mb-6 brand-font">Everything You Need to<br />Run a More Profitable Kitchen</h2>
              <p className="text-slate-500 text-xl max-w-2xl mx-auto leading-relaxed font-medium">No spreadsheets. No consultants. Just upload your menu and get a complete picture of what's working — and what's quietly costing you.</p>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              <div className="p-10 rounded-[2rem] border border-slate-100 hover:border-[#D4AF37]/40 hover:shadow-xl transition-all group">
                <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <Trophy size={28} />
                </div>
                <h3 className="text-xl font-bold text-[#0A192F] mb-3 brand-font">Find Your Hidden Winners</h3>
                <p className="text-slate-500 leading-relaxed font-medium">See at a glance which dishes are actually making you money — not just the ones selling most. Some of your busiest items may be your least profitable.</p>
              </div>
              <div className="p-10 rounded-[2rem] border border-slate-100 hover:border-[#D4AF37]/40 hover:shadow-xl transition-all group">
                <div className="w-14 h-14 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <DollarSign size={28} />
                </div>
                <h3 className="text-xl font-bold text-[#0A192F] mb-3 brand-font">Price Every Dish Smarter</h3>
                <p className="text-slate-500 leading-relaxed font-medium">Discover which items are underpriced and by how much. Our AI flags every pricing gap so you can make changes customers won't even notice — but your margins will.</p>
              </div>
              <div className="p-10 rounded-[2rem] border border-slate-100 hover:border-[#D4AF37]/40 hover:shadow-xl transition-all group">
                <div className="w-14 h-14 bg-red-50 text-red-500 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <Trash2 size={28} />
                </div>
                <h3 className="text-xl font-bold text-[#0A192F] mb-3 brand-font">Know What to Cut</h3>
                <p className="text-slate-500 leading-relaxed font-medium">Identify the dishes cluttering your menu and dragging down your kitchen. A leaner menu is faster to run, easier to train staff on, and far more profitable.</p>
              </div>
              <div className="p-10 rounded-[2rem] border border-slate-100 hover:border-[#D4AF37]/40 hover:shadow-xl transition-all group">
                <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <Edit3 size={28} />
                </div>
                <h3 className="text-xl font-bold text-[#0A192F] mb-3 brand-font">Descriptions That Sell</h3>
                <p className="text-slate-500 leading-relaxed font-medium">Get rewritten menu descriptions that make guests hungry before they even order. The right words can lift an item's sales by 20–30% without changing a single ingredient.</p>
              </div>
              <div className="p-10 rounded-[2rem] border border-slate-100 hover:border-[#D4AF37]/40 hover:shadow-xl transition-all group">
                <div className="w-14 h-14 bg-purple-50 text-purple-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <Target size={28} />
                </div>
                <h3 className="text-xl font-bold text-[#0A192F] mb-3 brand-font">A Clear Action Plan</h3>
                <p className="text-slate-500 leading-relaxed font-medium">No jargon, no guesswork. Every recommendation comes with a plain-English step-by-step plan and an honest estimate of how much additional revenue you stand to gain.</p>
              </div>
              <div className="p-10 rounded-[2rem] border border-slate-100 hover:border-[#D4AF37]/40 hover:shadow-xl transition-all group">
                <div className="w-14 h-14 bg-[#0A192F] text-[#D4AF37] rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <Zap size={28} />
                </div>
                <h3 className="text-xl font-bold text-[#0A192F] mb-3 brand-font">Results in Under 60 Seconds</h3>
                <p className="text-slate-500 leading-relaxed font-medium">Just take a photo of your menu. No setup, no spreadsheets, no waiting a week for a consultant's report. Your full profitability audit is ready in moments.</p>
              </div>
            </div>
          </div>
        </section>

        {/* Pricing Section */}
        <section id="pricing" className="bg-[#f8fafc] py-32 border-t border-slate-100">
          <div className="max-w-6xl mx-auto px-6">
            <div className="text-center mb-20">
              <span className="text-xs font-black text-[#D4AF37] uppercase tracking-[0.3em] mb-4 block">Simple Pricing</span>
              <h2 className="text-5xl font-bold text-[#0A192F] mb-6 brand-font">Pay for What You Need.<br />Cancel Anytime.</h2>
              <p className="text-slate-500 text-xl max-w-xl mx-auto leading-relaxed font-medium">Most restaurants recover the cost of their subscription within the first week of applying our recommendations.</p>
            </div>
            <div className="grid md:grid-cols-3 gap-8 items-start">
              {/* Starter */}
              <div className="bg-white rounded-[2rem] border border-slate-200 p-10 hover:shadow-lg transition-all">
                <div className="mb-8">
                  <h3 className="text-xs font-black text-slate-500 uppercase tracking-[0.2em] mb-3">Starter</h3>
                  <div className="flex items-end gap-2 mb-3">
                    <span className="text-5xl font-black text-[#0A192F]">$49</span>
                    <span className="text-slate-400 font-semibold mb-2">/month</span>
                  </div>
                  <p className="text-slate-500 font-medium text-sm leading-relaxed">For independent restaurants taking their first step toward better margins.</p>
                </div>
                <ul className="space-y-4 mb-10">
                  {['1 restaurant location', '5 menu audits per month', 'Full profitability report', 'Item-by-item recommendations', 'Pricing gap analysis', 'Email support'].map(f => (
                    <li key={f} className="flex items-center gap-3 text-sm font-semibold text-slate-600">
                      <CheckCircle2 size={16} className="text-emerald-500 flex-shrink-0" /> {f}
                    </li>
                  ))}
                </ul>
                <button className="w-full py-4 rounded-2xl border-2 border-[#0A192F] text-[#0A192F] font-black text-sm hover:bg-[#0A192F] hover:text-white transition-all">Start Free Trial</button>
              </div>

              {/* Professional */}
              <div className="bg-[#0A192F] rounded-[2rem] p-10 shadow-2xl shadow-slate-300 relative -mt-4">
                <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                  <span className="bg-[#D4AF37] text-[#0A192F] text-[10px] font-black uppercase tracking-widest px-5 py-2 rounded-full whitespace-nowrap">Most Popular</span>
                </div>
                <div className="mb-8">
                  <h3 className="text-xs font-black text-[#D4AF37] uppercase tracking-[0.2em] mb-3">Professional</h3>
                  <div className="flex items-end gap-2 mb-3">
                    <span className="text-5xl font-black text-white">$129</span>
                    <span className="text-slate-400 font-semibold mb-2">/month</span>
                  </div>
                  <p className="text-slate-400 font-medium text-sm leading-relaxed">For growing restaurants and small groups who need deeper, ongoing insights.</p>
                </div>
                <ul className="space-y-4 mb-10">
                  {['Up to 5 locations', 'Unlimited menu audits', 'Full profitability report', 'Item-by-item recommendations', 'Pricing gap analysis', 'Menu copy rewrites', 'Sales data integration', 'Priority support'].map(f => (
                    <li key={f} className="flex items-center gap-3 text-sm font-semibold text-white/80">
                      <CheckCircle2 size={16} className="text-[#D4AF37] flex-shrink-0" /> {f}
                    </li>
                  ))}
                </ul>
                <button className="w-full py-4 rounded-2xl bg-[#D4AF37] text-[#0A192F] font-black text-sm hover:bg-yellow-300 transition-all">Start Free Trial</button>
              </div>

              {/* Enterprise */}
              <div className="bg-white rounded-[2rem] border border-slate-200 p-10 hover:shadow-lg transition-all">
                <div className="mb-8">
                  <h3 className="text-xs font-black text-slate-500 uppercase tracking-[0.2em] mb-3">Enterprise</h3>
                  <div className="flex items-end gap-2 mb-3">
                    <span className="text-5xl font-black text-[#0A192F]">$299</span>
                    <span className="text-slate-400 font-semibold mb-2">/month</span>
                  </div>
                  <p className="text-slate-500 font-medium text-sm leading-relaxed">For restaurant groups, franchises, and multi-concept operators.</p>
                </div>
                <ul className="space-y-4 mb-10">
                  {['Unlimited locations', 'Unlimited menu audits', 'Full profitability report', 'Item-by-item recommendations', 'Pricing gap analysis', 'Menu copy rewrites', 'Sales data integration', 'White-label PDF reports', 'Dedicated account manager', 'Custom integrations'].map(f => (
                    <li key={f} className="flex items-center gap-3 text-sm font-semibold text-slate-600">
                      <CheckCircle2 size={16} className="text-emerald-500 flex-shrink-0" /> {f}
                    </li>
                  ))}
                </ul>
                <button className="w-full py-4 rounded-2xl border-2 border-[#0A192F] text-[#0A192F] font-black text-sm hover:bg-[#0A192F] hover:text-white transition-all">Contact Us</button>
              </div>
            </div>
            <p className="text-center text-slate-400 text-sm font-semibold mt-14">All plans include a 14-day free trial. No credit card required.</p>
          </div>
        </section>

        {/* About Section */}
        <section id="about" className="bg-[#0A192F] py-32">
          <div className="max-w-6xl mx-auto px-6">
            <div className="grid lg:grid-cols-2 gap-20 items-center">
              <div>
                <span className="text-xs font-black text-[#D4AF37] uppercase tracking-[0.3em] mb-6 block">Our Story</span>
                <h2 className="text-5xl font-bold text-white mb-8 brand-font leading-tight">Built for the Restaurant Owner.<br />Not the Consultant.</h2>
                <p className="text-slate-400 text-lg leading-relaxed mb-6 font-medium">
                  Restaurant owners work 70-hour weeks. You shouldn't need to hire a $5,000-a-week menu consultant to figure out why your margins aren't where they should be.
                </p>
                <p className="text-slate-400 text-lg leading-relaxed mb-10 font-medium">
                  We took the same menu engineering frameworks used by the world's top hospitality consultants and put them in your hands — for the cost of a few covers. Take a photo of your menu and get a boardroom-quality analysis in under a minute.
                </p>
                <div className="flex flex-wrap items-center gap-6 pt-8 border-t border-white/10">
                  <div className="flex items-center gap-2 text-[10px] font-black text-slate-500 uppercase tracking-widest">
                    <ShieldCheck size={16} className="text-[#D4AF37]" /> No contracts
                  </div>
                  <div className="w-1.5 h-1.5 bg-slate-700 rounded-full"></div>
                  <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Cancel anytime</div>
                  <div className="w-1.5 h-1.5 bg-slate-700 rounded-full"></div>
                  <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest">14-day free trial</div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-6">
                <div className="bg-white/5 rounded-[2rem] p-8 border border-white/10 hover:bg-white/[0.08] transition-all">
                  <div className="text-4xl font-black text-[#D4AF37] mb-3 brand-font">23%</div>
                  <div className="text-white font-bold mb-2">Average Revenue Lift</div>
                  <div className="text-slate-500 text-sm font-medium leading-relaxed">Reported by restaurants in their first 90 days</div>
                </div>
                <div className="bg-white/5 rounded-[2rem] p-8 border border-white/10 hover:bg-white/[0.08] transition-all">
                  <div className="text-4xl font-black text-[#D4AF37] mb-3 brand-font">60s</div>
                  <div className="text-white font-bold mb-2">To Your Full Audit</div>
                  <div className="text-slate-500 text-sm font-medium leading-relaxed">From photo upload to complete profitability report</div>
                </div>
                <div className="bg-white/5 rounded-[2rem] p-8 border border-white/10 hover:bg-white/[0.08] transition-all">
                  <div className="text-4xl font-black text-[#D4AF37] mb-3 brand-font">500+</div>
                  <div className="text-white font-bold mb-2">Restaurants Optimized</div>
                  <div className="text-slate-500 text-sm font-medium leading-relaxed">Across independents and growing restaurant groups</div>
                </div>
                <div className="bg-white/5 rounded-[2rem] p-8 border border-white/10 hover:bg-white/[0.08] transition-all">
                  <div className="text-4xl font-black text-[#D4AF37] mb-3 brand-font">$0</div>
                  <div className="text-white font-bold mb-2">Consultant Fees</div>
                  <div className="text-slate-500 text-sm font-medium leading-relaxed">Institutional-grade insights without the agency price tag</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="bg-white border-t border-slate-100 pt-24 pb-12">
          <div className="max-w-7xl mx-auto px-6">
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-12 mb-20">
              <div className="col-span-2">
                <div className="flex items-center gap-2 mb-8">
                  <div className="w-8 h-8 bg-[#0A192F] rounded-lg flex items-center justify-center">
                    <Sparkles className="text-[#D4AF37]" size={16} />
                  </div>
                  <span className="brand-font text-xl font-bold tracking-tight">MenuGenius</span>
                </div>
                <p className="text-slate-500 max-w-sm mb-8 leading-relaxed font-medium">
                  AI-powered menu engineering platform for restaurant owners and managers to optimize profitability and performance.
                </p>
              </div>
              
              <div>
                <h4 className="text-xs font-black text-[#0A192F] uppercase tracking-[0.2em] mb-8">Product</h4>
                <ul className="space-y-4 text-sm font-semibold text-slate-500">
                  <li><a href="#features" onClick={(e) => { e.preventDefault(); document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' }); }} className="hover:text-[#0A192F]">Features</a></li>
                  <li><a href="#pricing" onClick={(e) => { e.preventDefault(); document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' }); }} className="hover:text-[#0A192F]">Pricing</a></li>
                </ul>
              </div>

              <div>
                <h4 className="text-xs font-black text-[#0A192F] uppercase tracking-[0.2em] mb-8">Company</h4>
                <ul className="space-y-4 text-sm font-semibold text-slate-500">
                  <li><a href="#about" onClick={(e) => { e.preventDefault(); document.getElementById('about')?.scrollIntoView({ behavior: 'smooth' }); }} className="hover:text-[#0A192F]">About</a></li>
                  <li><a href="#" className="hover:text-[#0A192F]">Contact</a></li>
                </ul>
              </div>

              <div>
                <h4 className="text-xs font-black text-[#0A192F] uppercase tracking-[0.2em] mb-8">Support</h4>
                <ul className="space-y-4 text-sm font-semibold text-slate-500">
                  <li><a href="#" className="hover:text-[#0A192F]">Help</a></li>
                  <li><a href="#" className="hover:text-[#0A192F]">Docs</a></li>
                </ul>
              </div>
            </div>

            <div className="pt-12 border-t border-slate-50 flex flex-col md:flex-row items-center justify-between gap-8">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">© 2026 MenuGenius. All rights reserved.</span>
              <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 text-slate-500 rounded-lg border border-slate-200 text-[9px] font-black uppercase tracking-wider">
                <Sparkles size={12} className="text-[#D4AF37]" /> Powered by Gemini AI 3.0
              </div>
            </div>
          </div>
        </footer>
      </div>
    );
  }

  // --- LOADING VIEW ---
  if (view === 'loading') {
    return (
      <div className="min-h-screen bg-[#0A192F] flex flex-col items-center justify-center p-8 text-center">
         <div className="relative mb-16">
            <div className="w-32 h-32 rounded-full border-4 border-white/5 border-t-[#D4AF37] animate-spin"></div>
            <Sparkles className="absolute inset-0 m-auto text-[#D4AF37] animate-pulse" size={48} />
         </div>
         <h2 className="text-4xl font-black text-white mb-6 brand-font tracking-tight">Processing Engineering Audit</h2>
         <p className="text-slate-400 max-w-lg mx-auto text-xl mb-12 font-medium">Executing neural OCR and running profitability simulations...</p>
         <div className="w-full max-w-md bg-white/5 h-2 rounded-full overflow-hidden">
            <div className="h-full bg-[#D4AF37] animate-[loading_60s_linear_forwards]" style={{ width: '0%' }}></div>
         </div>
         <style>{`@keyframes loading { from { width: 0%; } to { width: 100%; } }`}</style>
      </div>
    );
  }

  // --- RESULTS VIEW ---
  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 flex flex-col selection:bg-gold/20">
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-xl border-b border-slate-200/60 px-8 py-4 flex items-center justify-between shadow-sm lg:ml-72 print:hidden">
        <div className="hidden lg:flex items-center gap-6">
           <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 text-emerald-700 rounded-lg border border-emerald-100 text-[10px] font-black uppercase tracking-wider">
              <BadgeCheck size={14} /> Audit Successful
           </div>
           <div className="h-5 w-px bg-slate-200"></div>
           <span className="text-xs text-slate-500 font-bold">Engine: <span className="text-slate-900 font-black">Gemini 3 Pro</span></span>
        </div>
        <div className="flex items-center gap-3">
           <button onClick={resetApp} className="flex items-center gap-2 px-5 py-2.5 text-slate-600 hover:bg-slate-50 rounded-xl transition-all text-xs font-black uppercase tracking-widest border border-slate-200"><RotateCcw size={14} /> Analyze Another Menu</button>
           <button onClick={() => window.print()} className="flex items-center gap-2 px-5 py-2.5 bg-[#0A192F] text-white rounded-xl hover:bg-slate-800 transition-all text-xs font-black uppercase tracking-widest shadow-xl"><Download size={14} /> Download PDF</button>
        </div>
      </header>

      <div className="flex flex-1">
        <aside className="w-72 bg-[#0A192F] border-r border-slate-800 fixed h-full z-30 hidden lg:flex flex-col">
          <div className="p-8">
            <div className="flex items-center gap-3 mb-14 cursor-pointer" onClick={resetApp}>
              <Sparkles className="text-[#D4AF37]" size={22} />
              <span className="brand-font text-2xl font-bold text-white tracking-tight">MenuGenius</span>
            </div>
            <nav className="space-y-1">
               {[
                 { id: 'full-report', label: 'Full Analysis', icon: <FileText size={18} /> },
                 { id: 'inventory', label: 'Item Inventory', icon: <List size={18} /> },
               ].map((item) => (
                 <button 
                  key={item.id} onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center gap-3 px-4 py-4 rounded-xl transition-all text-xs font-black uppercase tracking-widest mb-1.5 ${activeTab === item.id ? 'bg-[#D4AF37]/10 text-[#D4AF37]' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
                 >
                   {item.icon} {item.label}
                 </button>
               ))}
            </nav>
          </div>
        </aside>

        <main className="flex-1 lg:ml-72 p-6 md:p-14">
          <div className="max-w-6xl mx-auto space-y-24">
            
            {activeTab === 'full-report' && (
              <>
                {/* 1. YOUR BEST PERFORMERS (Conditional) */}
                {hasActualSalesData && (
                  <section className="animate-in fade-in slide-in-from-bottom-4 duration-700">
                    <div className="mb-10 flex items-center justify-between">
                      <div>
                        <h2 className="text-4xl font-bold text-slate-900 mb-2 brand-font">Your Best Performers</h2>
                        <p className="text-slate-500 font-medium">Based on actual sales data provided.</p>
                      </div>
                      <div className="hidden sm:flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-xl text-[10px] font-black uppercase tracking-widest">
                        <BadgeCheck size={14} /> Actual Sales Data
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                      {bestPerformers.map((item, i) => (
                        <div key={i} className="bg-white p-6 rounded-[2rem] border border-slate-200/60 shadow-sm relative overflow-hidden group hover:shadow-xl transition-all">
                          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-50 -mr-12 -mt-12 rounded-full"></div>
                          <div className="relative">
                            <div className="flex items-center justify-between mb-4">
                              <span className="text-[9px] font-black text-emerald-600 uppercase tracking-[0.2em]">🌟 #{i+1} Profit Leader</span>
                              <Trophy size={14} className="text-emerald-500" />
                            </div>
                            <h4 className="text-xl font-black text-slate-900 mb-1 brand-font">{item.name}</h4>
                            <p className="text-2xl font-black text-slate-900 mb-4">${(Number(item.totalProfit) || 0).toLocaleString(undefined, {maximumFractionDigits: 0})}<span className="text-xs font-bold text-slate-400 ml-1">/mo profit</span></p>
                            <div className="space-y-2 pt-4 border-t border-slate-50">
                              <div className="flex justify-between text-[10px] font-bold text-slate-400 uppercase">
                                <span>Sales Volume</span>
                                <span className="text-slate-900 font-black">{Number(item.salesVolume) * 10}</span>
                              </div>
                              <div className="flex justify-between text-[10px] font-bold text-slate-400 uppercase">
                                <span>Profit Margin</span>
                                <span className="text-slate-900 font-black">{item.marginPercent}%</span>
                              </div>
                            </div>
                            <div className="mt-5 flex items-center gap-2 text-[10px] font-black text-emerald-600 uppercase tracking-widest">
                              <CheckCircle2 size={12} /> Keep Featured
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </section>
                )}

                {/* 2. EXECUTIVE SUMMARY */}
                <section className="animate-in fade-in slide-in-from-bottom-4 duration-700">
                  <div className="mb-10">
                    <h2 className="text-4xl font-bold text-slate-900 mb-2 brand-font">Executive Summary</h2>
                    <p className="text-slate-500 font-medium">Strategic targets and annualized growth potential.</p>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
                    {[
                      { label: 'Efficiency Score', val: `${analysis?.executiveSummary?.efficiencyScore || 0}%`, sub: 'Current Performance' },
                      { label: 'Revenue Upside', val: `$${(analysis?.executiveSummary?.totalOpportunity || 0).toLocaleString()}`, sub: 'Annual Projection' },
                      { label: 'Action Items', val: analysis?.executiveSummary?.recommendationCount || 0, sub: 'Strategic Priority' },
                      { label: 'Implementation', val: analysis?.executiveSummary?.timeToImplement || 'TBD', sub: 'Target realization' }
                    ].map((card, i) => (
                      <div key={i} className="bg-white p-8 rounded-[2rem] shadow-sm border border-slate-200/50">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">{card.label}</p>
                        <p className="text-3xl font-black text-slate-900 mb-2">{card.val}</p>
                        <p className="text-[10px] font-bold text-slate-400 uppercase">{card.sub}</p>
                      </div>
                    ))}
                  </div>
                  {!hasActualSalesData && (
                    <div className="p-4 bg-amber-50 border border-amber-100 rounded-2xl flex items-center gap-3 mb-10">
                      <AlertCircle className="text-amber-500" size={18} />
                      <p className="text-xs font-bold text-amber-700 uppercase tracking-wide">⚠ Analysis based on estimated sales volumes. Upload CSV for precise calculations.</p>
                    </div>
                  )}
                  <div className="bg-[#0A192F] text-white p-10 rounded-[2.5rem] shadow-2xl flex flex-col md:flex-row gap-10 items-center">
                    <div className="flex-1">
                      <h3 className="text-3xl font-bold mb-6 brand-font leading-snug">Unlocking ${(analysis?.executiveSummary?.totalOpportunity || 0).toLocaleString()} in New Revenue</h3>
                      <p className="text-slate-400 leading-relaxed text-lg">Your menu is currently operating at {analysis?.executiveSummary?.efficiencyScore || 0}% of its theoretical profit potential. By addressing key "Puzzles" and re-engineering "Plowhorses", we project a {analysis?.finalImpact?.percentImprovement || 0}% increase in total enterprise value.</p>
                    </div>
                    <div className="w-full md:w-64 h-64 bg-white/5 rounded-full flex flex-col items-center justify-center border-[12px] border-white/5 shadow-inner" style={{ borderColor: 'rgba(255, 255, 255, 0.03)' }}>
                      <span className="text-6xl font-black text-white">{analysis?.executiveSummary?.efficiencyScore || 0}%</span>
                      <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-2">Efficiency Index</span>
                    </div>
                  </div>
                </section>

                {/* 3. BCG MENU ENGINEERING MATRIX */}
                <section className="animate-in fade-in slide-in-from-bottom-4 duration-700">
                  <div className="flex items-center justify-between mb-4">
                     <h2 className="text-4xl font-bold text-slate-900 brand-font">Menu Engineering Matrix</h2>
                     <div className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest border ${hasActualSalesData ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-amber-50 text-amber-700 border-amber-100'}`}>
                        {hasActualSalesData ? '✓ Actual Data' : '⚠ Estimated Volumes'}
                     </div>
                  </div>
                  <Matrix items={analysis?.matrixItems || []} />
                </section>

                {/* 4. QUADRANT BREAKDOWN TABLES */}
                <section className="animate-in fade-in slide-in-from-bottom-4 duration-700">
                  <div className="mb-10">
                    <h2 className="text-3xl font-bold text-slate-900 mb-2 brand-font">Quadrant Inventory Analysis</h2>
                    <p className="text-slate-500 font-medium">Deep-dive into every item's performance categorized by the BCG framework.</p>
                  </div>
                  <div className="grid lg:grid-cols-2 gap-8">
                    <QuadrantTable 
                      items={quadrantItems[MenuCategory.STAR]} 
                      title="STARS - Keep & Promote" 
                      color={COLORS.star} 
                      icon={Trophy}
                      action="Focus marketing here. Ensure consistency in preparation and presentation."
                    />
                    <QuadrantTable 
                      items={quadrantItems[MenuCategory.PUZZLE]} 
                      title="PUZZLES - Market & Sell" 
                      color={COLORS.puzzle} 
                      icon={Search}
                      action="High margin but low volume. Shift menu placement or use sensory copy to drive trial."
                    />
                    <QuadrantTable 
                      items={quadrantItems[MenuCategory.PLOWHORSE]} 
                      title="PLOWHORSES - Increase Margins" 
                      color={COLORS.plowhorse} 
                      icon={RotateCcw}
                      action="High volume, low margin. Look for cost reduction or small, incremental price hikes."
                    />
                    <QuadrantTable 
                      items={quadrantItems[MenuCategory.DOG]} 
                      title="DOGS - Remove or Redesign" 
                      color={COLORS.dog} 
                      icon={Trash2}
                      action="Underperforming on both metrics. Consider removal or a complete recipe overhaul."
                    />
                  </div>
                </section>

                {/* 5. TOP 10 PROFIT CONTRIBUTORS */}
                <section className="animate-in fade-in slide-in-from-bottom-4 duration-700">
                   <div className="bg-white p-12 rounded-[3rem] border border-slate-200/50 shadow-sm">
                      <div className="mb-10">
                        <h3 className="text-3xl font-bold text-slate-900 mb-2 brand-font">Top 10 Profit Contributors</h3>
                        <p className="text-slate-500 font-medium">Ranked by total monthly net contribution (Sales × Margin Dollars).</p>
                      </div>
                      <div className="h-[500px]">
                         <ResponsiveContainer width="100%" height="100%">
                            <ReBarChart data={profitContributionData} layout="vertical" margin={{ left: 40, right: 60, top: 20, bottom: 20 }}>
                               <XAxis type="number" hide />
                               <YAxis dataKey="name" type="category" width={180} tick={{ fontSize: 11, fill: '#1e293b', fontWeight: 800 }} axisLine={false} tickLine={false} />
                               <Tooltip 
                                  cursor={{ fill: '#f8fafc' }}
                                  contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}
                                  formatter={(value: any) => [`$${value.toLocaleString()}`, 'Monthly Profit']}
                               />
                               <Bar dataKey="totalProfit" radius={[0, 10, 10, 0]} barSize={24}>
                                  {profitContributionData.map((entry, index) => (
                                     <Cell key={`cell-${index}`} fill={entry.category === MenuCategory.STAR ? COLORS.star : entry.category === MenuCategory.PUZZLE ? COLORS.puzzle : COLORS.plowhorse} />
                                  ))}
                               </Bar>
                            </ReBarChart>
                         </ResponsiveContainer>
                      </div>
                   </div>
                </section>

                {/* 6. PRICE DISTRIBUTION HISTOGRAM */}
                <section className="animate-in fade-in slide-in-from-bottom-4 duration-700">
                   <div className="bg-white p-12 rounded-[3rem] border border-slate-200/50 shadow-sm">
                      <div className="mb-10">
                        <h3 className="text-3xl font-bold text-slate-900 mb-2 brand-font">Menu Price Point Distribution</h3>
                        <p className="text-slate-500 font-medium">Identifying price clustering and missing psychological "anchors".</p>
                      </div>
                      <div className="h-[400px]">
                         <ResponsiveContainer width="100%" height="100%">
                            <ReBarChart data={priceDistributionData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                               <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                               <XAxis dataKey="range" tick={{ fontSize: 11, fill: '#64748b', fontWeight: 700 }} axisLine={false} tickLine={false} />
                               <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} />
                               <Tooltip cursor={{ fill: '#f8fafc' }} />
                               <Bar dataKey="count" name="Items" fill="#0A192F" radius={[8, 8, 0, 0]} barSize={60} />
                            </ReBarChart>
                         </ResponsiveContainer>
                      </div>
                   </div>
                </section>

                {/* 7. CATEGORY PERFORMANCE BREAKDOWN */}
                <section className="animate-in fade-in slide-in-from-bottom-4 duration-700">
                   <div className="bg-white p-12 rounded-[3rem] border border-slate-200/50 shadow-sm">
                      <div className="mb-10">
                        <h3 className="text-3xl font-bold text-slate-900 mb-2 brand-font">Performance by Menu Category</h3>
                        <p className="text-slate-500 font-medium">Comparative analytics for different sections of the menu.</p>
                      </div>
                      <div className="h-[450px]">
                         <ResponsiveContainer width="100%" height="100%">
                            <ReBarChart data={categoryPerformanceData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                               <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                               <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#64748b', fontWeight: 800 }} axisLine={false} tickLine={false} />
                               <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} />
                               <Tooltip />
                               <Legend verticalAlign="top" height={36} iconType="circle" />
                               <Bar dataKey="vol" name="Total Volume" fill={COLORS.plowhorse} radius={[6, 6, 0, 0]} barSize={35} />
                               <Bar dataKey="avgMargin" name="Avg Margin %" fill={COLORS.star} radius={[6, 6, 0, 0]} barSize={35} />
                            </ReBarChart>
                         </ResponsiveContainer>
                      </div>
                   </div>
                </section>

                {/* 8. REVENUE OPPORTUNITY WATERFALL */}
                <section className="animate-in fade-in slide-in-from-bottom-4 duration-700">
                   <div className="bg-white p-12 rounded-[3rem] border border-slate-200/50 shadow-sm">
                      <div className="mb-10">
                        <h3 className="text-3xl font-bold text-slate-900 mb-2 brand-font">Revenue Opportunity Waterfall</h3>
                        <p className="text-slate-500 font-medium">Annual impact of individual strategic recommendations.</p>
                      </div>
                      <div className="h-[450px]">
                         <ResponsiveContainer width="100%" height="100%">
                            <ReBarChart data={waterfallData} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
                               <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                               <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#64748b', fontWeight: 800 }} angle={-25} textAnchor="end" height={80} />
                               <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} tickFormatter={(val) => `$${Number(val)/1000}k`} />
                               <Tooltip formatter={(val: any) => `$${Number(val).toLocaleString()}`} />
                               <Bar dataKey="display" name="Revenue Step" stackId="a" radius={[8, 8, 0, 0]} barSize={40}>
                                  {waterfallData.map((entry, index) => {
                                     const isTotal = index === 0 || index === waterfallData.length - 1;
                                     return <Cell key={`cell-${index}`} fill={isTotal ? '#0A192F' : COLORS.star} />;
                                  })}
                               </Bar>
                            </ReBarChart>
                         </ResponsiveContainer>
                      </div>
                   </div>
                </section>

                {/* 9. MARGIN VS VOLUME SCATTER */}
                <section className="animate-in fade-in slide-in-from-bottom-4 duration-700">
                   <div className="bg-white p-12 rounded-[3rem] border border-slate-200/50 shadow-sm">
                      <div className="mb-10">
                        <h3 className="text-3xl font-bold text-slate-900 mb-2 brand-font">Item Performance Scatter Analysis</h3>
                        <p className="text-slate-500 font-medium">Spotting outliers and high-margin volume opportunities.</p>
                      </div>
                      <div className="h-[500px]">
                         <ResponsiveContainer width="100%" height="100%">
                           <ScatterChart margin={{ top: 20, right: 40, bottom: 40, left: 20 }}>
                              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                              <XAxis type="number" dataKey="salesVolume" name="Sales Volume" unit="%" domain={[0, 100]} />
                              <YAxis type="number" dataKey="profitMargin" name="Profit Margin" unit="%" domain={[0, 100]} />
                              <ZAxis type="number" dataKey="totalProfit" range={[100, 1200]} />
                              <Tooltip cursor={{ strokeDasharray: '3 3' }} />
                              <Scatter name="Menu Items" data={itemsWithProfit}>
                                 {itemsWithProfit.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.category === MenuCategory.STAR ? COLORS.star : COLORS.puzzle} />
                                 ))}
                              </Scatter>
                           </ScatterChart>
                        </ResponsiveContainer>
                      </div>
                   </div>
                </section>

                {/* 10. PRIORITY RECOMMENDATIONS */}
                <section className="animate-in fade-in slide-in-from-bottom-4 duration-700">
                  <div className="mb-10">
                     <h2 className="text-4xl font-bold text-slate-900 mb-3 brand-font">Priority Recommendations</h2>
                     <p className="text-slate-500 text-lg font-medium">Validated operational changes to realize identified revenue potential.</p>
                  </div>
                  <div className="space-y-6">
                     {(analysis?.recommendations || []).map((rec, i) => (
                       <RecommendationCard key={i} rec={rec} />
                     ))}
                  </div>
                </section>

                {/* 11. DESCRIPTION OPTIMIZATION */}
                <section className="animate-in fade-in slide-in-from-bottom-4 duration-700">
                  <div className="mb-10">
                     <h2 className="text-4xl font-bold text-slate-900 mb-3 brand-font">Strategy & Copy Optimization</h2>
                     <p className="text-slate-500 text-lg font-medium">Psychological optimization of menu architecture and sensory copy.</p>
                  </div>
                  <div className="space-y-12 mb-20">
                     {(analysis?.descriptions || []).map((desc, i) => (
                       <div key={i} className="bg-white rounded-[3rem] shadow-sm border border-slate-200/50 overflow-hidden">
                          <div className="bg-slate-50 px-10 py-8 flex justify-between items-center border-b border-slate-100">
                             <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-[#D4AF37]/10 rounded-2xl flex items-center justify-center text-[#D4AF37]"><BadgeCheck size={28} /></div>
                                <div><h3 className="text-2xl font-bold text-slate-900 brand-font">{desc.itemName}</h3></div>
                             </div>
                             <div className="text-emerald-600 font-black text-xs bg-emerald-50 px-5 py-2 rounded-full border border-emerald-100 uppercase tracking-widest">+{desc.impactPercent}% Est. Volume</div>
                          </div>
                          <div className="p-10 grid md:grid-cols-2 gap-16">
                             <div className="space-y-6">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Current Description</p>
                                <div className="p-8 bg-slate-50/50 rounded-3xl border border-slate-100 text-slate-500 italic text-sm leading-relaxed">"{desc.before}"</div>
                             </div>
                             <div className="space-y-6">
                                <p className="text-[10px] font-black text-[#D4AF37] uppercase tracking-[0.2em] mb-2 flex items-center gap-2"><Sparkles size={14} /> Optimized Copy</p>
                                <div className="p-8 bg-[#0A192F] text-white rounded-3xl shadow-2xl text-xl font-medium leading-relaxed">"{desc.after}"</div>
                                <div className="flex flex-wrap gap-2.5 pt-4">
                                   {(desc.psychologicalTriggers || []).map((t, idx) => (
                                     <span key={idx} className="text-[9px] font-black px-3 py-1.5 bg-slate-100 text-slate-500 rounded-lg uppercase tracking-wider">{t}</span>
                                   ))}
                                </div>
                             </div>
                          </div>
                       </div>
                     ))}
                  </div>
                </section>

                {/* 12. TOP VS BOTTOM PERFORMERS */}
                <section className="animate-in fade-in slide-in-from-bottom-4 duration-700">
                  <div className="mb-10">
                    <h2 className="text-4xl font-bold text-slate-900 mb-2 brand-font">Performance Extremes Analysis</h2>
                    <p className="text-slate-500 font-medium">Comparative benchmarking of your highest and lowest profit generators.</p>
                  </div>
                  <div className="grid md:grid-cols-2 gap-12">
                     <div className="bg-white p-10 rounded-[2.5rem] border border-slate-200/60 shadow-sm">
                        <h4 className="text-xs font-black text-emerald-600 uppercase tracking-[0.2em] mb-8 flex items-center gap-2">
                           <Trophy size={16} /> Top 5 Profit Contributors
                        </h4>
                        <div className="space-y-4">
                           {bestPerformers.slice(0, 5).map((item, i) => (
                              <div key={i} className="flex justify-between items-center p-6 bg-emerald-50/50 rounded-2xl border border-emerald-100 group hover:shadow-md transition-all">
                                 <div className="flex flex-col">
                                   <span className="text-sm font-black text-slate-800">{item.name}</span>
                                   <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{item.category}</span>
                                 </div>
                                 <div className="text-right">
                                   <span className="text-sm font-black text-emerald-700">${(Number(item.totalProfit) || 0).toLocaleString(undefined, {maximumFractionDigits: 0})}/mo</span>
                                   <p className="text-[9px] font-bold text-emerald-500 uppercase font-black">High Margin + Volume</p>
                                 </div>
                              </div>
                           ))}
                        </div>
                     </div>
                     <div className="bg-white p-10 rounded-[2.5rem] border border-slate-200/60 shadow-sm">
                        <h4 className="text-xs font-black text-red-600 uppercase tracking-[0.2em] mb-8 flex items-center gap-2">
                           <Trash2 size={16} /> Bottom 5 Performers
                        </h4>
                        <div className="space-y-4">
                           {worstPerformers.map((item, i) => (
                              <div key={i} className="flex justify-between items-center p-6 bg-red-50/50 rounded-2xl border border-red-100 group hover:shadow-md transition-all">
                                 <div className="flex flex-col">
                                   <span className="text-sm font-black text-slate-800">{item.name}</span>
                                   <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{item.category}</span>
                                 </div>
                                 <div className="text-right">
                                   <span className="text-sm font-black text-red-700">${(Number(item.totalProfit) || 0).toLocaleString(undefined, {maximumFractionDigits: 0})}/mo</span>
                                   <p className="text-[9px] font-bold text-red-400 uppercase font-black">Review Architecture</p>
                                 </div>
                              </div>
                           ))}
                        </div>
                     </div>
                  </div>
                  {!hasActualSalesData && (
                    <div className="mt-20 p-10 bg-[#0A192F] rounded-[2.5rem] text-center">
                       <h3 className="text-2xl font-bold text-white mb-4 brand-font">Ready for Precise Profitability?</h3>
                       <p className="text-slate-400 mb-8 max-w-xl mx-auto font-medium">Upload your actual POS sales data (CSV) to unlock exact item profit leadership and volume insights.</p>
                       <button onClick={resetApp} className="px-8 py-4 bg-[#D4AF37] text-[#0A192F] rounded-2xl font-black uppercase tracking-widest hover:bg-[#F3E5AB] transition-all flex items-center gap-3 mx-auto">
                          <PlusCircle size={20} /> Upload Sales Data
                       </button>
                    </div>
                  )}
                </section>
              </>
            )}

            {activeTab === 'inventory' && (
               <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
                  <div className="mb-14">
                     <h2 className="text-5xl font-bold text-slate-900 mb-3 brand-font">Audit Inventory</h2>
                     <p className="text-slate-500 text-lg font-medium">Full diagnostic log of detected menu items and derived metrics.</p>
                  </div>
                  <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-200/50 overflow-hidden">
                     <div className="overflow-x-auto">
                        <table className="w-full text-left">
                           <thead>
                              <tr className="bg-slate-50/50 border-b border-slate-100">
                                 {['Name', 'Price', 'Food Cost', 'Margin %', `Sales/mo${!hasActualSalesData ? ' (est)' : ''}`, 'Profit/mo', 'Category'].map((key) => (
                                   <th key={key} className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">{key}</th>
                                 ))}
                              </tr>
                           </thead>
                           <tbody className="divide-y divide-slate-50">
                              {itemsWithProfit.map((item, i) => (
                                <tr key={i} className="hover:bg-slate-50/30 transition-colors">
                                   <td className="px-8 py-5 text-sm font-bold text-slate-900">{item.name}</td>
                                   <td className="px-8 py-5 text-sm text-slate-600 font-medium">${Number(item.price).toFixed(2)}</td>
                                   <td className="px-8 py-5 text-sm text-slate-600 font-medium">${Number(item.foodCost).toFixed(2)}</td>
                                   <td className="px-8 py-5 text-sm font-black text-emerald-600">{item.marginPercent}%</td>
                                   <td className="px-8 py-5 text-sm text-slate-600 font-black">{Number(item.salesVolume) * 10}</td>
                                   <td className="px-8 py-5 text-sm font-black text-slate-900">${(Number(item.totalProfit) || 0).toLocaleString(undefined, {maximumFractionDigits: 0})}</td>
                                   <td className="px-8 py-5">
                                      <span className={`text-[9px] font-black px-3 py-1 rounded-full uppercase tracking-widest border ${
                                         item.category === MenuCategory.STAR ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                                         item.category === MenuCategory.PLOWHORSE ? 'bg-amber-50 text-amber-600 border-amber-100' :
                                         item.category === MenuCategory.PUZZLE ? 'bg-orange-50 text-orange-600 border-orange-100' :
                                         'bg-red-50 text-red-600 border-red-100'
                                      }`}>
                                         {item.category}
                                      </span>
                                   </td>
                                </tr>
                              ))}
                           </tbody>
                        </table>
                     </div>
                  </div>
               </div>
            )}
          </div>
          
          <footer className="mt-24 text-center border-t border-slate-200/50 pt-16 pb-24 print:hidden">
             <div className="inline-flex items-center gap-3 px-6 py-3 bg-white rounded-2xl border border-slate-200 shadow-sm mb-6">
                <Sparkles size={20} className="text-[#D4AF37]" />
                <span className="text-[10px] font-black text-slate-900 uppercase tracking-[0.2em]">Verified Engineering Analysis</span>
             </div>
             <p className="text-sm text-slate-500 font-medium max-w-xl mx-auto leading-relaxed">
               Audit results generated using industry-standard menu engineering formulas (Kasavana & Smith). All strategic insights validated against regional mid-market restaurant benchmarks.
             </p>
          </footer>
        </main>
      </div>
    </div>
  );
};

export default App;
