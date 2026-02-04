import React, { useState, useEffect } from 'react';
import { ShoppingCart, Truck, MessageSquare, Wallet } from 'lucide-react';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import { User } from 'firebase/auth';
import { TRANSLATIONS } from '../constants';
import { Language } from '../types';

interface DashboardProps {
  user: User | null;
  appId: string;
  setTab: (tab: string) => void;
  lang: Language;
}

export default function DashboardView({ user, appId, setTab, lang }: DashboardProps) {
  const [stats, setStats] = useState({ sales: 0, expenses: 0, profit: 0, due: 0, pendingDelivery: 0 });
  const t = (key: string) => TRANSLATIONS[lang][key] || key;

  useEffect(() => {
    if (!user) return;
    const qSales = collection(db, 'artifacts', appId, 'public', 'data', 'transactions');
    const unsub = onSnapshot(qSales, (snap) => {
      let salesTotal = 0, expensesTotal = 0, totalDue = 0, pendingDelivery = 0;
      snap.forEach(doc => {
        const data = doc.data();
        if (data.type === 'sale') salesTotal += data.amount || 0;
        if (data.type === 'expense') expensesTotal += data.amount || 0;
        if (data.dueAmount > 0) totalDue += data.dueAmount || 0;
        if (data.deliveryStatus === 'Pending') pendingDelivery += 1;
      });
      setStats({ sales: salesTotal, expenses: expensesTotal, profit: salesTotal - expensesTotal, due: totalDue, pendingDelivery });
    });
    return () => unsub();
  }, [user, appId]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
         <h2 className="text-2xl font-bold text-slate-800">{t('todays_overview')}</h2>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl shadow-sm border border-emerald-100"><p className="text-xs text-slate-500 uppercase">{t('total_sales')}</p><h3 className="text-2xl font-bold text-emerald-600">৳{stats.sales.toLocaleString()}</h3></div>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-red-100"><p className="text-xs text-slate-500 uppercase">{t('total_expense')}</p><h3 className="text-2xl font-bold text-red-600">৳{stats.expenses.toLocaleString()}</h3></div>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-blue-100"><p className="text-xs text-slate-500 uppercase">{t('net_profit')}</p><h3 className="text-2xl font-bold text-blue-600">৳{stats.profit.toLocaleString()}</h3></div>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-amber-100"><p className="text-xs text-slate-500 uppercase">{t('pending_delivery')}</p><h3 className="text-2xl font-bold text-amber-600">{stats.pendingDelivery}</h3></div>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: t('new_sale'), icon: ShoppingCart, color: 'bg-emerald-600', action: () => setTab('sales') },
          { label: t('courier'), icon: Truck, color: 'bg-indigo-600', action: () => setTab('delivery') },
          { label: t('bulk_sms'), icon: MessageSquare, color: 'bg-pink-600', action: () => setTab('marketing') },
          { label: t('expenses'), icon: Wallet, color: 'bg-red-500', action: () => setTab('expenses') },
        ].map((btn, idx) => (
          <button key={idx} onClick={btn.action} className={`${btn.color} text-white p-4 rounded-xl shadow-lg transition-all text-left flex flex-col justify-between h-24`}>
            <btn.icon className="w-6 h-6 opacity-80" />
            <div className="font-bold">{btn.label}</div>
          </button>
        ))}
      </div>
    </div>
  );
}
