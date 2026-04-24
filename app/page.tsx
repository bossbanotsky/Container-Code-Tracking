'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { 
  collection, 
  query, 
  onSnapshot, 
  addDoc, 
  updateDoc, 
  doc, 
  deleteDoc,
  serverTimestamp, 
  orderBy,
  writeBatch
} from 'firebase/firestore';
import { db, ContainerRecord, handleFirestoreError } from '@/lib/firebase';
import { 
  Plus, 
  Trash2,
  Clock,
  CheckCircle,
  CreditCard,
  Box
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import Navbar from '@/components/Navbar';

export default function ContainerRepairApp() {
  const [containers, setContainers] = useState<ContainerRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'REPAIR' | 'BILLING_QUEUE' | 'BILLED'>('REPAIR');
  const [activeModule, setActiveModule] = useState<'DASHBOARD' | 'INPUT'>('DASHBOARD');
  
  // Form state
  const [newCode, setNewCode] = useState('');
  const [newType, setNewType] = useState<'FOREIGN' | 'LOCAL'>('FOREIGN');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const q = query(collection(db, 'containers'), orderBy('created_at', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as ContainerRecord[];
      setContainers(data);
      setLoading(false);
    }, (error) => {
      console.error("Firestore snapshot error:", error);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleAddContainer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCode.trim()) return;

    setIsSubmitting(true);
    const code = newCode.trim().toUpperCase();
    
    try {
      const record: Partial<ContainerRecord> = {
        foreign_code: newType === 'FOREIGN' ? code : null,
        local_code: newType === 'LOCAL' ? code : null,
        type: newType,
        status: 'REPAIRING',
        is_ready_billing: false,
        created_at: serverTimestamp(),
        updated_at: serverTimestamp(),
      };

      await addDoc(collection(db, 'containers'), record);
      setNewCode('');
      setActiveModule('DASHBOARD');
    } catch (error) {
      handleFirestoreError(error, 'create', '/containers');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateStatus = async (id: string, status: ContainerRecord['status'], extraData: any = {}) => {
    try {
      const containerRef = doc(db, 'containers', id);
      await updateDoc(containerRef, {
        status,
        ...extraData,
        updated_at: serverTimestamp()
      });
    } catch (error) {
      handleFirestoreError(error, 'update', `/containers/${id}`);
    }
  };

  const handleDelete = async (id: string) => {
    if(!confirm("Are you sure you want to delete this record?")) return;
    try {
      await deleteDoc(doc(db, 'containers', id));
    } catch (error) {
      handleFirestoreError(error, 'delete', `/containers/${id}`);
    }
  };

  const filteredContainers = useMemo(() => {
    return containers.filter(c => {
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch = 
        (c.foreign_code?.toLowerCase().includes(searchLower)) ||
        (c.local_code?.toLowerCase().includes(searchLower));
      
      let matchesTab = false;
      if (activeTab === 'REPAIR') matchesTab = ['REPAIRING', 'DONE'].includes(c.status);
      else if (activeTab === 'BILLING_QUEUE') matchesTab = c.status === 'FOR_BILLING';
      else if (activeTab === 'BILLED') matchesTab = c.status === 'BILLED';
      
      return matchesSearch && matchesTab;
    });
  }, [containers, searchTerm, activeTab]);

  const stats = useMemo(() => {
    return {
      repairing: containers.filter(c => c.status === 'REPAIRING').length,
      ready_billing: containers.filter(c => c.status === 'DONE').length,
      billing_queue: containers.filter(c => c.status === 'FOR_BILLING').length,
      billed: containers.filter(c => c.status === 'BILLED').length
    };
  }, [containers]);

  if (loading) return null;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 bg-slate-50 min-h-screen">
      <Navbar activeModule={activeModule} setActiveModule={setActiveModule} />
      
      {activeModule === 'DASHBOARD' && (
        <div className="space-y-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Repairing', count: stats.repairing, color: 'text-amber-600' },
              { label: 'Ready:Bill', count: stats.ready_billing, color: 'text-emerald-600' },
              { label: 'Billing Q', count: stats.billing_queue, color: 'text-indigo-600' },
              { label: 'Billed', count: stats.billed, color: 'text-slate-600' },
            ].map(stat => (
              <div key={stat.label} className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{stat.label}</p>
                <p className={cn("text-3xl font-bold mt-1", stat.color)}>{stat.count}</p>
              </div>
            ))}
          </div>

          <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="border-b border-slate-100 p-2 flex gap-1 bg-slate-50">
              {[
                { id: 'REPAIR', label: 'Repairs' },
                { id: 'BILLING_QUEUE', label: 'Billing Queue' },
                { id: 'BILLED', label: 'Billed' },
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={cn(
                    "px-6 py-3 rounded-2xl text-xs font-bold transition-all",
                    activeTab === tab.id ? "bg-white text-slate-900 shadow-sm" : "text-slate-500"
                  )}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="divide-y divide-slate-100">
              <AnimatePresence>
                {filteredContainers.map(container => (
                  <motion.div key={container.id} initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="p-6 flex items-center justify-between gap-4 hover:bg-slate-50">
                    <div className="flex-1">
                      <div className="flex flex-col gap-1">
                        {container.type === 'LOCAL' ? (
                          <>
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] font-bold text-slate-400 uppercase">Input:</span>
                              <span className="font-mono font-bold text-sm text-slate-900">{container.local_code}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] font-bold text-slate-400 uppercase">Final:</span>
                              <span className="font-mono font-bold text-sm text-emerald-600">{container.local_code}</span>
                            </div>
                          </>
                        ) : (
                          <div className="flex gap-4 items-center">
                            <span className="font-mono font-bold text-sm text-slate-900">{container.foreign_code}</span>
                            <span className="text-slate-300">/</span>
                            {container.local_code ? (
                              <span className="font-mono text-sm text-slate-600">{container.local_code}</span>
                            ) : (
                              <button 
                                onClick={() => {
                                  const code = prompt("Enter Local Code");
                                  if (code) handleUpdateStatus(container.id!, container.status, { local_code: code.toUpperCase() });
                                }}
                                className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-1 rounded-md"
                              >
                                + ADD LOCAL
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                      <div className="text-[10px] uppercase font-bold text-slate-400 mt-2">{container.type}</div>
                    </div>
                    
                    <div className="flex items-center gap-4">
                      {container.status === 'REPAIRING' && (
                        <button onClick={() => handleUpdateStatus(container.id!, 'DONE')} className="text-xs font-bold text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-lg">MARK DONE</button>
                      )}
                      {container.status === 'DONE' && activeTab === 'REPAIR' && (
                         <button onClick={() => handleUpdateStatus(container.id!, 'FOR_BILLING', { is_ready_billing: true })} className="text-xs font-bold text-indigo-600 bg-indigo-50 px-3 py-1.5 rounded-lg">MOVE TO BILLING</button>
                      )}
                      {container.status === 'FOR_BILLING' && activeTab === 'BILLING_QUEUE' && (
                         <button onClick={() => handleUpdateStatus(container.id!, 'BILLED')} className="text-xs font-bold text-slate-600 bg-slate-100 px-3 py-1.5 rounded-lg">MARK AS BILLED</button>
                      )}
                      <button onClick={() => handleDelete(container.id!)} className="text-slate-400 hover:text-red-500"><Trash2 className="w-4 h-4"/></button>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </div>
        </div>
      )}

      {activeModule === 'INPUT' && (
        <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-200">
          <h2 className="text-xl font-bold text-slate-900 mb-6">New Entry</h2>
          <form onSubmit={handleAddContainer} className="space-y-4">
            <input
              type="text"
              value={newCode}
              onChange={(e) => setNewCode(e.target.value)}
              placeholder="Container Code"
              className="w-full px-5 py-4 rounded-2xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none font-mono text-sm"
              disabled={isSubmitting}
            />
            <div className="grid grid-cols-2 gap-2">
              {(['FOREIGN', 'LOCAL'] as const).map(type => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setNewType(type)}
                  className={cn(
                    "px-4 py-3 rounded-xl border text-xs font-bold transition-all",
                    newType === type ? "bg-indigo-600 text-white border-indigo-600" : "bg-slate-50 text-slate-600"
                  )}
                >
                  {type}
                </button>
              ))}
            </div>
            <button
              type="submit"
              className="w-full bg-slate-900 text-white font-bold py-4 rounded-2xl hover:bg-slate-800 transition-all text-sm"
            >
              SAVE ENTRY
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
