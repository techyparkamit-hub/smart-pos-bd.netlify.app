import React, { useState } from 'react';
import { ShoppingCart, RefreshCcw, Repeat, ChevronUp, ChevronDown, ScanLine, Trash2, FileText, Download, Printer } from 'lucide-react';
import { Card, Button } from '../components/UI';
import { TRANSLATIONS } from '../constants';
import { Language } from '../types';
import { User } from 'firebase/auth';

interface ViewProps {
  user: User | null;
  appId: string;
  lang: Language;
}

export default function ReturnExchangeView({ lang }: ViewProps) {
  const t = (key: string) => TRANSLATIONS[lang][key] || key;
  const [section, setSection] = useState<'return' | 'exchange'>('return');
  const [activeSub, setActiveSub] = useState<'create' | 'history' | 'products'>('create');

  const renderContent = () => {
    if (section === 'return') {
      if (activeSub === 'create') return <ReturnCreate t={t} />;
      if (activeSub === 'history') return <ReturnHistory />;
      if (activeSub === 'products') return <ReturnProducts />;
    } else {
      if (activeSub === 'create') return <ExchangeCreate t={t} />;
      if (activeSub === 'history') return <ExchangeHistory />;
      if (activeSub === 'products') return <ReturnProducts />;
    }
    return null;
  };

  return (
    <div className="flex flex-col lg:flex-row h-full gap-4 -m-4 lg:-m-8">
      {/* Sub Sidebar */}
      <div className="w-full lg:w-64 bg-[#3b0764] text-white flex-shrink-0 flex flex-col">
         <div className="p-6">
           <h3 className="font-bold text-lg mb-6 flex items-center gap-2"><ShoppingCart size={20}/> {t('return')} & {t('exchange')}</h3>
           <div className="space-y-6">
             {/* Return Section */}
             <div>
                <button onClick={() => setSection('return')} className="flex items-center justify-between w-full font-bold mb-2 text-purple-200 hover:text-white">
                   <div className="flex items-center gap-2"><RefreshCcw size={16}/> {t('return')}</div>
                   {section === 'return' ? <ChevronUp size={16}/> : <ChevronDown size={16}/>}
                </button>
                {section === 'return' && (
                  <div className="pl-6 space-y-1">
                    <button onClick={() => setActiveSub('create')} className={`block w-full text-left py-2 text-sm ${activeSub==='create' ? 'text-white font-bold' : 'text-purple-300 hover:text-white'}`}>{t('sales_return')}</button>
                    <button onClick={() => setActiveSub('history')} className={`block w-full text-left py-2 text-sm ${activeSub==='history' ? 'text-white font-bold' : 'text-purple-300 hover:text-white'}`}>{t('return_history')}</button>
                    <button onClick={() => setActiveSub('products')} className={`block w-full text-left py-2 text-sm ${activeSub==='products' ? 'text-white font-bold' : 'text-purple-300 hover:text-white'}`}>{t('return_products')}</button>
                  </div>
                )}
             </div>
             {/* Exchange Section */}
             <div>
                <button onClick={() => setSection('exchange')} className="flex items-center justify-between w-full font-bold mb-2 text-purple-200 hover:text-white">
                   <div className="flex items-center gap-2"><Repeat size={16}/> {t('exchange')}</div>
                   {section === 'exchange' ? <ChevronUp size={16}/> : <ChevronDown size={16}/>}
                </button>
                {section === 'exchange' && (
                  <div className="pl-6 space-y-1">
                    <button onClick={() => setActiveSub('create')} className={`block w-full text-left py-2 text-sm ${activeSub==='create' ? 'text-white font-bold' : 'text-purple-300 hover:text-white'}`}>{t('sales_exchange')}</button>
                    <button onClick={() => setActiveSub('history')} className={`block w-full text-left py-2 text-sm ${activeSub==='history' ? 'text-white font-bold' : 'text-purple-300 hover:text-white'}`}>{t('exchange_history')}</button>
                    <button onClick={() => setActiveSub('products')} className={`block w-full text-left py-2 text-sm ${activeSub==='products' ? 'text-white font-bold' : 'text-purple-300 hover:text-white'}`}>{t('exchange_products')}</button>
                  </div>
                )}
             </div>
           </div>
         </div>
      </div>
      {/* Main Content */}
      <div className="flex-1 p-6 overflow-y-auto bg-slate-50">
         {renderContent()}
      </div>
    </div>
  );
}

function ReturnCreate({ t }: { t: any }) {
  const [deduction, setDeduction] = useState(0);
  const [paidAmount, setPaidAmount] = useState(0);
  return (
    <div className="space-y-4">
       <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <Card className="p-4 h-full">
              <h3 className="font-bold mb-4">Return Invoice</h3>
              <div className="relative mb-4">
                 <input className="w-full p-3 pl-10 border rounded focus:outline-none focus:border-orange-500" placeholder="Scan/Type Product ID or Name"/>
                 <ScanLine className="absolute left-3 top-3.5 text-orange-500" size={18}/>
              </div>
              <div className="h-64 bg-slate-50 rounded flex items-center justify-center text-slate-400">Cart is empty</div>
            </Card>
          </div>
          <div>
            <Card className="p-6 space-y-4">
              <h3 className="font-bold text-lg mb-2">{t('billing_summary')}</h3>
              <div className="grid grid-cols-2 gap-4">
                 <div><label className="text-xs font-bold text-slate-500">{t('total_deduction')}</label><input type="number" className="w-full p-2 border rounded" value={deduction} onChange={(e) => setDeduction(Number(e.target.value))}/></div>
                 <div><label className="text-xs font-bold text-slate-500">{t('total_returnable')}</label><input className="w-full p-2 border rounded bg-slate-50" value="0.00" readOnly/></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                 <div className="flex gap-2 items-end"><div className="flex-1"><label className="text-xs font-bold text-slate-500">Paid Amount *</label><input type="number" className="w-full p-2 border rounded bg-slate-50" value={paidAmount} onChange={(e) => setPaidAmount(Number(e.target.value))}/></div><Trash2 size={18} className="mb-3 text-purple-400"/></div>
              </div>
              <Button className="w-full bg-emerald-600 hover:bg-emerald-700">{t('submit_return')}</Button>
            </Card>
          </div>
       </div>
    </div>
  );
}

function ExchangeCreate({ t }: { t: any }) {
  const [discount, setDiscount] = useState(0);
  const [paidAmount, setPaidAmount] = useState(0);
  return (
    <div className="space-y-4">
       <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <Card className="p-4"><h3 className="font-bold mb-2">Return Product</h3><div className="relative"><input className="w-full p-3 pl-10 border rounded" placeholder="Scan..."/><ScanLine className="absolute left-3 top-3.5" size={18}/></div></Card>
            <Card className="p-4"><h3 className="font-bold mb-2">Exchange Product</h3><div className="relative"><input className="w-full p-3 pl-10 border rounded" placeholder="Scan..."/><ScanLine className="absolute left-3 top-3.5" size={18}/></div></Card>
            <div className="h-40 bg-slate-100 rounded flex items-center justify-center text-slate-400">Cart Empty</div>
          </div>
          <div>
            <Card className="p-6 space-y-4">
              <h3 className="font-bold text-lg mb-2">Exchange Summary</h3>
              <div className="grid grid-cols-2 gap-4"><div><label className="text-xs font-bold text-slate-500">Total Discount</label><input type="number" className="w-full p-2 border rounded" value={discount} onChange={(e) => setDiscount(Number(e.target.value))}/></div><div><label className="text-xs font-bold text-slate-500">{t('payable_amount')}</label><input className="w-full p-2 border rounded bg-slate-50" value="0.00" readOnly/></div></div>
              <div className="flex gap-2 items-end"><div className="flex-1"><label className="text-xs font-bold text-slate-500">Paid Amount *</label><input type="number" className="w-full p-2 border rounded bg-slate-50" value={paidAmount} onChange={(e) => setPaidAmount(Number(e.target.value))}/></div><Trash2 size={18} className="mb-3 text-purple-400"/></div>
              <Button className="w-full bg-emerald-700 hover:bg-emerald-800">{t('submit_exchange')}</Button>
            </Card>
          </div>
       </div>
    </div>
  );
}

const ReturnHistory = () => <Card className="p-8 text-center text-slate-400">No History Available</Card>;
const ReturnProducts = () => <Card className="p-8 text-center text-slate-400">No Product Data Available</Card>;
const ExchangeHistory = () => <Card className="p-8 text-center text-slate-400">No Exchange History Available</Card>;
