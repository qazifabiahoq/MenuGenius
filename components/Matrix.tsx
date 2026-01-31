
import React, { useMemo } from 'react';
import { ScatterChart, Scatter, XAxis, YAxis, ZAxis, Tooltip, ResponsiveContainer, Cell, ReferenceLine, Label, LabelList } from 'recharts';
import { MatrixItem, MenuCategory } from '../types';
import { COLORS } from '../constants';

interface MatrixProps {
  items: MatrixItem[];
}

const Matrix: React.FC<MatrixProps> = ({ items }) => {
  const processedItems = useMemo(() => {
    return items.map(item => ({
      ...item,
      totalProfit: (item.price - item.foodCost) * (item.salesVolume * 10) // Weight profit by volume for bubble size
    })).sort((a, b) => b.totalProfit - a.totalProfit);
  }, [items]);

  const top10Ids = useMemo(() => {
    return new Set(processedItems.slice(0, 10).map(i => i.name));
  }, [processedItems]);

  const getCategoryColor = (category: MenuCategory) => {
    switch (category) {
      case MenuCategory.STAR: return COLORS.star;
      case MenuCategory.PLOWHORSE: return COLORS.plowhorse;
      case MenuCategory.PUZZLE: return COLORS.puzzle;
      case MenuCategory.DOG: return COLORS.dog;
      default: return '#ccc';
    }
  };

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-4 shadow-2xl border border-slate-100 rounded-xl">
          <p className="font-black text-slate-900 mb-2 brand-font">{data.name}</p>
          <div className="text-xs space-y-1.5 text-slate-500 font-medium">
            <p className="flex justify-between gap-4"><span>Classification:</span> <span className="font-black text-slate-900 uppercase tracking-tighter">{data.category}</span></p>
            <p className="flex justify-between gap-4"><span>Menu Price:</span> <span className="font-bold text-slate-700">${data.price.toFixed(2)}</span></p>
            <p className="flex justify-between gap-4"><span>Popularity:</span> <span className="font-bold text-slate-700">{data.salesVolume}%</span></p>
            <p className="flex justify-between gap-4"><span>Profitability:</span> <span className="font-bold text-slate-700">{data.profitMargin}%</span></p>
            <p className="flex justify-between gap-4 pt-1 border-t border-slate-50"><span>Contribution:</span> <span className="font-black text-slate-900">${data.totalProfit.toLocaleString(undefined, {maximumFractionDigits: 0})}</span></p>
          </div>
        </div>
      );
    }
    return null;
  };

  const renderCustomLabel = (props: any) => {
    const { x, y, value, payload } = props;
    // Only show label if it's in the top 10 profit contributors
    if (!top10Ids.has(value)) return null;
    
    return (
      <text 
        x={x} 
        y={y - 15} 
        fill="#0f172a" 
        textAnchor="middle" 
        style={{ fontSize: '10px', fontWeight: '800', fontFamily: 'Inter, sans-serif', textTransform: 'uppercase', letterSpacing: '0.02em' }}
      >
        {value}
      </text>
    );
  };

  return (
    <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-slate-200/60 overflow-hidden relative">
      <div className="mb-8">
        <h3 className="text-3xl font-bold text-slate-900 mb-2 brand-font">Menu Engineering Matrix (BCG Framework)</h3>
        <p className="text-slate-500 text-sm font-medium">Item positioning based on profitability vs. popularity. Bubble size indicates total profit contribution.</p>
      </div>
      
      <div className="h-[550px] w-full relative">
        {/* BCG Quadrant Labels in Background */}
        <div className="absolute top-0 right-0 w-1/2 h-1/2 flex flex-col items-end justify-start p-6 pointer-events-none opacity-60">
           <span className="text-[10px] font-black text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200 uppercase tracking-[0.2em] shadow-sm">STARS - Keep & Promote</span>
        </div>
        <div className="absolute top-0 left-0 w-1/2 h-1/2 flex flex-col items-start justify-start p-6 pointer-events-none opacity-60">
           <span className="text-[10px] font-black text-orange-600 bg-orange-50 px-3 py-1.5 rounded-lg border border-orange-200 uppercase tracking-[0.2em] shadow-sm">PUZZLES - Market & Sell</span>
        </div>
        <div className="absolute bottom-16 right-0 w-1/2 h-1/2 flex flex-col items-end justify-end p-6 pointer-events-none opacity-60">
           <span className="text-[10px] font-black text-amber-600 bg-amber-50 px-3 py-1.5 rounded-lg border border-amber-200 uppercase tracking-[0.2em] shadow-sm">PLOWHORSES - Increase Margins</span>
        </div>
        <div className="absolute bottom-16 left-0 w-1/2 h-1/2 flex flex-col items-start justify-end p-6 pointer-events-none opacity-60">
           <span className="text-[10px] font-black text-red-600 bg-red-50 px-3 py-1.5 rounded-lg border border-red-200 uppercase tracking-[0.2em] shadow-sm">DOGS - Remove or Redesign</span>
        </div>

        <ResponsiveContainer width="100%" height="100%">
          <ScatterChart margin={{ top: 40, right: 60, bottom: 60, left: 60 }}>
            <XAxis 
              type="number" 
              dataKey="salesVolume" 
              name="Sales Volume" 
              unit="%" 
              domain={[0, 100]}
              axisLine={{ stroke: '#e2e8f0' }}
              tick={{ fontSize: 10, fill: '#94a3b8', fontWeight: 700 }}
              tickLine={false}
            >
              <Label value="Sales Volume / Popularity →" offset={-35} position="insideBottom" style={{ fill: '#475569', fontSize: '10px', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '0.2em' }} />
            </XAxis>
            <YAxis 
              type="number" 
              dataKey="profitMargin" 
              name="Profit Margin" 
              unit="%" 
              domain={[0, 100]}
              axisLine={{ stroke: '#e2e8f0' }}
              tick={{ fontSize: 10, fill: '#94a3b8', fontWeight: 700 }}
              tickLine={false}
            >
               <Label value="Profit Margin % →" angle={-90} position="insideLeft" offset={-40} style={{ fill: '#475569', fontSize: '10px', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '0.2em' }} />
            </YAxis>
            <ZAxis type="number" dataKey="totalProfit" range={[150, 1200]} />
            <Tooltip content={<CustomTooltip />} cursor={{ strokeDasharray: '3 3', stroke: '#cbd5e1' }} />
            
            <ReferenceLine x={50} stroke="#cbd5e1" strokeWidth={1} strokeDasharray="8 8" />
            <ReferenceLine y={50} stroke="#cbd5e1" strokeWidth={1} strokeDasharray="8 8" />
            
            <Scatter name="Menu Items" data={processedItems}>
              {processedItems.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={getCategoryColor(entry.category)} className="drop-shadow-md cursor-pointer hover:brightness-110 transition-all" />
              ))}
              <LabelList dataKey="name" content={renderCustomLabel} />
            </Scatter>
          </ScatterChart>
        </ResponsiveContainer>
      </div>
      
      <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4 pt-10 border-t border-slate-100">
        {[
          { color: COLORS.star, label: 'Stars', sub: 'High Volume, High Margin', explanation: 'Prime items to keep and promote.' },
          { color: COLORS.plowhorse, label: 'Plowhorses', sub: 'High Volume, Low Margin', explanation: 'Reliable sellers; need cost control.' },
          { color: COLORS.puzzle, label: 'Puzzles', sub: 'Low Volume, High Margin', explanation: 'Hidden gems; need better marketing.' },
          { color: COLORS.dog, label: 'Dogs', sub: 'Low Volume, Low Margin', explanation: 'Underperformers; consider removal.' }
        ].map((q, i) => (
          <div key={i} className="bg-slate-50/50 p-4 rounded-2xl border border-slate-100/50">
            <div className="flex items-center gap-2.5 mb-2">
              <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: q.color }}></div>
              <p className="text-[11px] font-black text-slate-900 uppercase tracking-widest">{q.label}</p>
            </div>
            <p className="text-[10px] text-slate-500 font-bold leading-tight">{q.explanation}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Matrix;
