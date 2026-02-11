import React from 'react';
import { Sofa, ChevronRight } from 'lucide-react';

export const Header: React.FC = () => {
  return (
    <header className="bg-white/80 border-b border-slate-200 sticky top-0 z-50 backdrop-blur-md">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-slate-900 p-2 rounded-lg shadow-sm">
            <Sofa className="w-5 h-5 text-white" />
          </div>
          <div className="flex flex-col">
            <h1 className="text-lg font-bold text-slate-900 leading-none tracking-tight font-serif">VirtualStager</h1>
            <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest mt-0.5">Enterprise AI</span>
          </div>
        </div>
        
        <div className="flex items-center gap-6">
          <nav className="hidden md:flex items-center gap-6">
            <a href="#" className="text-sm font-medium text-slate-500 hover:text-slate-900 transition-colors">Dashboard</a>
            <a href="#" className="text-sm font-medium text-slate-500 hover:text-slate-900 transition-colors">History</a>
            <a href="#" className="text-sm font-medium text-slate-500 hover:text-slate-900 transition-colors">Settings</a>
          </nav>
          <div className="h-5 w-px bg-slate-200 hidden md:block"></div>
          <button className="text-sm font-medium bg-white border border-slate-200 text-slate-700 px-4 py-2 rounded-lg hover:bg-slate-50 hover:border-slate-300 transition-all shadow-sm flex items-center gap-2">
            Export Project <ChevronRight className="w-3 h-3" />
          </button>
        </div>
      </div>
    </header>
  );
};
