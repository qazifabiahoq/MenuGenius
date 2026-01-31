
import React, { useState } from 'react';
import { Recommendation, MenuCategory } from '../types';
import { ChevronRight, ChevronDown, TrendingUp, AlertCircle, CheckCircle2, DollarSign, Calculator } from 'lucide-react';
import { COLORS } from '../constants';

interface Props {
  rec: Recommendation;
}

const RecommendationCard: React.FC<Props> = ({ rec }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const categoryColors = {
    [MenuCategory.STAR]: 'text-emerald-600 bg-emerald-50 border-emerald-100',
    [MenuCategory.PLOWHORSE]: 'text-amber-600 bg-amber-50 border-amber-100',
    [MenuCategory.PUZZLE]: 'text-orange-600 bg-orange-50 border-orange-100',
    [MenuCategory.DOG]: 'text-red-600 bg-red-50 border-red-100',
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden mb-6 transition-all duration-300 hover:shadow-md">
      {/* Header - Clickable */}
      <div 
        className="p-6 cursor-pointer flex items-center justify-between"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-6">
           <div className="w-16 h-16 rounded-xl overflow-hidden shadow-sm flex-shrink-0">
              <img src={`https://picsum.photos/seed/${rec.itemName}/200`} alt={rec.itemName} className="w-full h-full object-cover" />
           </div>
           <div>
              <div className="flex items-center gap-3 mb-1">
                <h4 className="text-xl font-bold text-slate-900">{rec.itemName}</h4>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-widest border ${categoryColors[rec.category]}`}>
                  {rec.category}
                </span>
              </div>
              <p className="text-sm text-slate-500 font-medium line-clamp-1">{rec.currentIssue}</p>
           </div>
        </div>
        
        <div className="flex items-center gap-8">
           <div className="text-right hidden sm:block">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Growth Potential</p>
              <p className="text-lg font-bold text-emerald-600">+${rec.financialImpact.netBenefitAnnual.toLocaleString()}/yr</p>
           </div>
           <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-400">
              {isExpanded ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
           </div>
        </div>
      </div>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="px-6 pb-8 animate-in fade-in slide-in-from-top-2 duration-300">
           <div className="h-px bg-slate-100 mb-8"></div>
           
           <div className="grid lg:grid-cols-3 gap-12">
              {/* Left: Actions & Issue */}
              <div className="lg:col-span-2 space-y-8">
                 <div>
                    <h5 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                       <AlertCircle size={14} /> Problem Analysis
                    </h5>
                    <p className="text-slate-700 leading-relaxed text-sm bg-slate-50 p-4 rounded-xl border border-slate-100">
                       {rec.currentIssue}
                    </p>
                 </div>

                 <div>
                    <h5 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                       <CheckCircle2 size={14} /> Recommended Action Plan
                    </h5>
                    <div className="grid sm:grid-cols-2 gap-4">
                       {rec.actions.map((action, i) => (
                         <div key={i} className="flex items-start gap-3 p-3 bg-white border border-slate-100 rounded-xl shadow-sm text-sm text-slate-700">
                            <div className="w-5 h-5 rounded-full bg-gold/10 flex items-center justify-center text-gold flex-shrink-0" style={{ color: COLORS.gold }}>
                               <CheckCircle2 size={12} />
                            </div>
                            {action}
                         </div>
                       ))}
                    </div>
                 </div>

                 <div>
                    <h5 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                       <Calculator size={14} /> Business Reasoning Chain
                    </h5>
                    <div className="space-y-4">
                       {rec.reasoningSteps.map((step, i) => (
                         <div key={i} className="flex gap-4">
                            <span className="text-[10px] font-bold text-slate-300 mt-1 flex-shrink-0">STEP {i+1}</span>
                            <p className="text-xs text-slate-500 italic leading-relaxed">{step}</p>
                         </div>
                       ))}
                    </div>
                 </div>
              </div>

              {/* Right: Impact Table */}
              <div className="bg-slate-900 text-white p-6 rounded-2xl shadow-xl">
                 <h5 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                    <TrendingUp size={14} className="text-gold" style={{ color: COLORS.gold }} /> Projected Impact
                 </h5>
                 
                 <div className="space-y-6">
                    <div className="space-y-3">
                       <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Monthly Estimates</p>
                       <div className="flex justify-between items-center py-2 border-b border-white/5">
                          <span className="text-sm text-slate-400">Current Revenue</span>
                          <span className="text-sm font-medium">${rec.financialImpact.monthlyCurrent.toLocaleString()}</span>
                       </div>
                       <div className="flex justify-between items-center py-2">
                          <span className="text-sm text-slate-400">Projected Revenue</span>
                          <span className="text-sm font-bold text-gold" style={{ color: COLORS.gold }}>${rec.financialImpact.monthlyProjected.toLocaleString()}</span>
                       </div>
                    </div>

                    <div className="space-y-3 pt-6 border-t border-white/10">
                       <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Annual Projections</p>
                       <div className="flex justify-between items-center py-2 border-b border-white/5">
                          <span className="text-sm text-slate-400">Current Baseline</span>
                          <span className="text-sm font-medium">${rec.financialImpact.annualCurrent.toLocaleString()}</span>
                       </div>
                       <div className="flex justify-between items-center py-2">
                          <span className="text-sm text-slate-400">Projected Performance</span>
                          <span className="text-sm font-medium">${rec.financialImpact.annualProjected.toLocaleString()}</span>
                       </div>
                    </div>

                    <div className="pt-6 border-t border-gold/20 flex flex-col items-center text-center">
                       <p className="text-xs font-bold text-gold uppercase tracking-widest mb-1" style={{ color: COLORS.gold }}>Total Annual Upside</p>
                       <p className="text-3xl font-black text-white">+${rec.financialImpact.netBenefitAnnual.toLocaleString()}</p>
                    </div>
                 </div>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default RecommendationCard;
