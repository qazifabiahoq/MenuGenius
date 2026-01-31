
import React from 'react';
import { LayoutDashboard, TrendingUp, DollarSign, FileText, ChevronRight } from 'lucide-react';

export const COLORS = {
  navy: '#0A192F',
  gold: '#D4AF37',
  goldLight: '#F3E5AB',
  star: '#10b981', // green
  plowhorse: '#f59e0b', // yellow
  puzzle: '#f97316', // orange
  dog: '#ef4444', // red
};

export const NAV_ITEMS = [
  { id: 'summary', label: 'Executive Summary', icon: <LayoutDashboard size={18} /> },
  { id: 'matrix', label: 'Engineering Matrix', icon: <TrendingUp size={18} /> },
  { id: 'recommendations', label: 'Priority Actions', icon: <DollarSign size={18} /> },
  { id: 'descriptions', label: 'Copy Optimization', icon: <FileText size={18} /> },
];
