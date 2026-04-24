'use client';
import { cn } from '@/lib/utils';
import { LayoutDashboard, PlusCircle } from 'lucide-react';

interface NavbarProps {
  activeModule: 'DASHBOARD' | 'INPUT';
  setActiveModule: (module: 'DASHBOARD' | 'INPUT') => void;
}

export default function Navbar({ activeModule, setActiveModule }: NavbarProps) {
  return (
    <div className="flex gap-2 p-2 bg-white rounded-3xl shadow-sm border border-slate-200 mb-8 inline-flex">
      <button
        onClick={() => setActiveModule('DASHBOARD')}
        className={cn(
          "flex items-center gap-2 px-6 py-3 rounded-2xl text-xs font-bold transition-all",
          activeModule === 'DASHBOARD' ? "bg-indigo-600 text-white shadow-lg" : "text-slate-500 hover:bg-slate-50"
        )}
      >
        <LayoutDashboard className="w-4 h-4" />
        DASHBOARD
      </button>
      <button
        onClick={() => setActiveModule('INPUT')}
        className={cn(
          "flex items-center gap-2 px-6 py-3 rounded-2xl text-xs font-bold transition-all",
          activeModule === 'INPUT' ? "bg-indigo-600 text-white shadow-lg" : "text-slate-500 hover:bg-slate-50"
        )}
      >
        <PlusCircle className="w-4 h-4" />
        ADD CONTAINER
      </button>
    </div>
  );
}
