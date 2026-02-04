import React, { useState, useEffect } from 'react';
import { Truck, MessageSquare, Send, Smartphone, Printer, Trash2, Clock, Plus, BarChart3, Receipt, Wallet, Users } from 'lucide-react';
import { collection, onSnapshot, addDoc, deleteDoc, doc, query, where, serverTimestamp, writeBatch, increment } from 'firebase/firestore';
import { db } from '../firebase';
import { Card, Button, Modal } from '../components/UI';
import { TRANSLATIONS } from '../constants';
import { Language, Transaction, Party } from '../types';
import { User } from 'firebase/auth';

interface ViewProps {
  user: User | null;
  appId: string;
  lang: Language;
}

// --- Delivery View ---
export function DeliveryView({ user, appId, lang }: ViewProps) {
  const t = (key: string) => TRANSLATIONS[lang][key] || key;
  const [deliveries, setDeliveries] = useState<Transaction[]>([]);

  useEffect(() => {
      if(!user) return;
      const q = collection(db, 'artifacts', appId, 'public', 'data', 'transactions');
      const unsub = onSnapshot(q, snap => {
          const allDocs = snap.docs.map(d => ({id: d.id, ...d.data()} as Transaction));
          const filtered = allDocs.filter(d => d.deliveryMethod === 'Courier').sort((a, b) => (b.date?.toDate ? b.date.toDate().getTime() : 0) - (a.date?.toDate ? a.date.toDate().getTime() : 0));
          setDeliveries(filtered);
      });
      return () => unsub();
  }, [user, appId]);

  return (
      <div className="space-y-6">
          <h2 className="text-2xl font-bold text-slate-800">{t('delivery_tracking')}</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
               {['Pending', 'Shipped', 'Delivered'].map(status => (<Card key={status} className="p-4 border-t-4 border-t-blue-500"><h3 className="font-bold text-slate-500 uppercase text-xs">{t(status.toLowerCase())}</h3><div className="text-3xl font-bold mt-1">{deliveries.filter(d => d.deliveryStatus === status).length}</div></Card>))}
          </div>
          <Card>
              <table className="w-full text-left text-sm"><thead className="bg-slate-50 border-b"><tr><th className="p-3">{t('order_id')}</th><th className="p-3">{t('customer')}</th><th className="p-3">{t('courier')}</th><th className="p-3">{t('tracking')}</th><th className="p-3">{t('status')}</th></tr></thead><tbody>{deliveries.map(d => (<tr key={d.id} className="border-b last:border-0"><td className="p-3 font-mono text-xs">{d.id?.slice(0,8)}</td><td className="p-3">{d.partyName || 'Guest'}</td><td className="p-3">{d.courierName}</td><td className="p-3 font-mono text-xs bg-slate-100 rounded w-fit px-2">{d.trackingId}</td><td className="p-3"><span className={`px-2 py-1 rounded text-xs font-bold ${d.deliveryStatus==='Delivered'?'bg-emerald-100 text-emerald-700':'bg-amber-100 text-amber-700'}`}>{t(d.deliveryStatus?.toLowerCase() || 'pending')}</span></td></tr>))}</tbody></table>
          </Card>
      </div>
  );
}

// --- Marketing View ---
export function MarketingView({ user, appId, lang }: ViewProps) {
    const t = (key: string) => TRANSLATIONS[lang][key] || key;
    const [coupons, setCoupons] = useState<any[]>([]);
    const [newCode, setNewCode] = useState('');
    const [discount, setDiscount] = useState('');
    const [smsMessage, setSmsMessage] = useState('');

    useEffect(() => {
        if(!user) return;
        const unsub = onSnapshot(collection(db, 'artifacts', appId, 'public', 'data', 'coupons'), snap => setCoupons(snap.docs.map(d => ({id: d.id, ...d.data()}))));
        return () => unsub();
    }, [user, appId]);

    const addCoupon = async () => { if(!newCode || !discount) return; await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'coupons'), { code: newCode.toUpperCase(), discount: parseFloat(discount), active: true }); setNewCode(''); setDiscount(''); };
    const sendBulkSMS = () => { if(!smsMessage) return; alert(`Simulating SMS Blast: "${smsMessage}" sent!`); setSmsMessage(''); };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-6"><h2 className="text-xl font-bold">{t('coupon_management')}</h2><Card className="p-4 space-y-4"><div className="flex gap-2"><input className="flex-1 p-2 border rounded" placeholder="CODE (e.g. SALE10)" value={newCode} onChange={e => setNewCode(e.target.value)}/><input className="w-24 p-2 border rounded" placeholder="%" type="number" value={discount} onChange={e => setDiscount(e.target.value)}/><Button onClick={addCoupon}>{t('add')}</Button></div><div className="space-y-2">{coupons.map(c => (<div key={c.id} className="flex justify-between items-center p-3 border rounded bg-slate-50"><div><span className="font-bold text-blue-600">{c.code}</span> <span className="text-sm text-slate-500"> - {c.discount}% Off</span></div><button onClick={() => deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'coupons', c.id))} className="text-red-500"><Trash2 size={16}/></button></div>))}</div></Card></div>
            <div className="space-y-6"><h2 className="text-xl font-bold">{t('bulk_sms_marketing')}</h2><Card className="p-4 space-y-4"><div className="bg-blue-50 p-3 rounded text-sm text-blue-700 flex gap-2"><Smartphone size={16}/> {t('promo_sms')}</div><textarea className="w-full p-3 border rounded h-32" placeholder={t('type_message')} value={smsMessage} onChange={e => setSmsMessage(e.target.value)}></textarea><Button onClick={sendBulkSMS} icon={Send} className="w-full">{t('send_broadcast')}</Button></Card></div>
        </div>
    );
}

// --- Reports View ---
export function ReportsView({ user, appId, lang }: ViewProps) {
    const t = (key: string) => TRANSLATIONS[lang][key] || key;
    const [sales, setSales] = useState<Transaction[]>([]);
    const [invoiceSale, setInvoiceSale] = useState<Transaction | null>(null);

    useEffect(() => {
        if (!user) return;
        const q = collection(db, 'artifacts', appId, 'public', 'data', 'transactions');
        const unsub = onSnapshot(q, snap => {
            const allDocs = snap.docs.map(d => ({id: d.id, ...d.data()} as Transaction));
            const filtered = allDocs.filter(d => d.type === 'sale').sort((a, b) => (b.date?.toDate ? b.date.toDate().getTime() : 0) - (a.date?.toDate ? a.date.toDate().getTime() : 0));
            setSales(filtered);
        });
        return () => unsub();
    }, [user, appId]);

    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold text-slate-800">{t('sales_report_invoice')}</h2>
            <Card>
                <table className="w-full text-left text-sm"><thead className="bg-slate-50 border-b"><tr><th className="p-3">{t('date')}</th><th className="p-3">{t('customer')}</th><th className="p-3">{t('amount')}</th><th className="p-3">{t('method')}</th><th className="p-3 text-right">{t('action')}</th></tr></thead><tbody>{sales.map(s => (<tr key={s.id} className="border-b hover:bg-slate-50"><td className="p-3">{s.date?.toDate ? s.date.toDate().toLocaleDateString() : 'N/A'}</td><td className="p-3">{s.partyName || 'Guest'}</td><td className="p-3 font-bold">৳{s.amount}</td><td className="p-3">{s.paymentMethod}</td><td className="p-3 text-right"><button onClick={() => setInvoiceSale(s)} className="bg-blue-100 text-blue-700 px-3 py-1 rounded text-xs font-bold hover:bg-blue-200 flex items-center gap-1 ml-auto"><Printer size={12}/> {t('invoice')}</button></td></tr>))}</tbody></table>
            </Card>

            {invoiceSale && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
                    <div className="bg-white w-full max-w-2xl rounded-lg shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="p-8 bg-white" id="invoice-area">
                            <div className="flex justify-between items-start border-b pb-6 mb-6"><div><h1 className="text-3xl font-bold text-slate-900">INVOICE</h1><p className="text-slate-500">#{invoiceSale.id?.slice(-8).toUpperCase()}</p></div><div className="text-right"><h2 className="font-bold text-xl">SmartBiz POS</h2><p className="text-sm text-slate-500">Dhaka, Bangladesh</p></div></div>
                            <div className="flex justify-between mb-8 text-sm"><div><p className="font-bold text-slate-400 text-xs uppercase mb-1">{t('bill_to')}</p><p className="font-bold text-slate-800">{invoiceSale.partyName || 'Guest Customer'}</p>{invoiceSale.deliveryMethod === 'Courier' && (<p className="text-slate-500 mt-1">{t('via')} {invoiceSale.courierName} ({invoiceSale.trackingId})</p>)}</div><div className="text-right"><p className="font-bold text-slate-400 text-xs uppercase mb-1">{t('date')}</p><p className="font-bold text-slate-800">{invoiceSale.date?.toDate ? invoiceSale.date.toDate().toLocaleDateString() : 'N/A'}</p></div></div>
                            <table className="w-full text-sm mb-6"><thead className="bg-slate-50 text-slate-500"><tr><th className="p-3 text-left">{t('items')}</th><th className="p-3 text-center">{t('qty')}</th><th className="p-3 text-right">{t('total')}</th></tr></thead><tbody>{invoiceSale.items?.map((item, i) => (<tr key={i} className="border-b"><td className="p-3">{item.name}</td><td className="p-3 text-center">{item.qty}</td><td className="p-3 text-right">৳{(item.price || 0) * item.qty}</td></tr>))}</tbody></table>
                            <div className="flex justify-end"><div className="w-48 space-y-2 text-sm"><div className="flex justify-between"><span>{t('subtotal')}:</span><span>৳{invoiceSale.subtotal || invoiceSale.amount}</span></div><div className="flex justify-between text-red-500"><span>{t('discount')}:</span><span>-৳{invoiceSale.discount || 0}</span></div><div className="flex justify-between font-bold text-lg border-t pt-2"><span>{t('total')}:</span><span>৳{invoiceSale.amount}</span></div></div></div>
                        </div>
                        <div className="bg-slate-50 p-4 flex justify-end gap-2 border-t"><Button variant="secondary" onClick={() => setInvoiceSale(null)}>{t('close')}</Button><Button onClick={() => window.print()} icon={Printer}>{t('print_invoice')}</Button></div>
                    </div>
                </div>
            )}
        </div>
    );
}

// --- Expenses View ---
export function ExpenseView({ user, appId, lang }: ViewProps) {
  const t = (key: string) => TRANSLATIONS[lang][key] || key;
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [category, setCategory] = useState('Rent');
  const [expenses, setExpenses] = useState<Transaction[]>([]);

  useEffect(() => {
    if (!user) return;
    const q = collection(db, 'artifacts', appId, 'public', 'data', 'transactions');
    const unsub = onSnapshot(q, snap => {
        const allDocs = snap.docs.map(d => ({id: d.id, ...d.data()} as Transaction));
        const filtered = allDocs.filter(d => d.type === 'expense').sort((a, b) => (b.date?.toDate ? b.date.toDate().getTime() : 0) - (a.date?.toDate ? a.date.toDate().getTime() : 0));
        setExpenses(filtered);
    });
    return () => unsub();
  }, [user, appId]);

  const addExpense = async () => { if (!amount) return; await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'transactions'), { type: 'expense', amount: parseFloat(amount), paidAmount: parseFloat(amount), dueAmount: 0, date: serverTimestamp(), note, category }); setAmount(''); setNote(''); };

  return (
    <div className="max-w-4xl mx-auto space-y-6"><h2 className="text-2xl font-bold text-slate-800">{t('expenses')}</h2><Card className="p-6"><div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end"><div className="md:col-span-1"><label className="text-sm font-medium mb-1 block">{t('amount')}</label><input type="number" className="w-full p-2 border rounded" value={amount} onChange={e => setAmount(e.target.value)} placeholder="0.00"/></div><div className="md:col-span-1"><label className="text-sm font-medium mb-1 block">{t('category')}</label><select className="w-full p-2 border rounded" value={category} onChange={e => setCategory(e.target.value)}>{['Rent', 'Electricity', 'Salary', 'Tea', 'Transport', 'Other'].map(c => <option key={c} value={c}>{c}</option>)}</select></div><div className="md:col-span-1"><label className="text-sm font-medium mb-1 block">{t('note')}</label><input className="w-full p-2 border rounded" value={note} onChange={e => setNote(e.target.value)} placeholder="Note"/></div><div className="md:col-span-1"><Button onClick={addExpense} className="w-full">{t('add_expense')}</Button></div></div></Card><Card><table className="w-full text-left text-sm"><thead className="bg-slate-50 border-b"><tr><th className="p-4">{t('date')}</th><th className="p-4">{t('category')}</th><th className="p-4">{t('note')}</th><th className="p-4 text-right">{t('amount')}</th></tr></thead><tbody>{expenses.map(ex => (<tr key={ex.id} className="border-b"><td className="p-4">{ex.date?.toDate ? ex.date.toDate().toLocaleDateString() : 'N/A'}</td><td className="p-4"><span className="bg-slate-100 px-2 py-1 rounded text-xs">{ex.category}</span></td><td className="p-4 text-slate-600">{ex.note || '-'}</td><td className="p-4 text-right font-bold text-red-600">-৳{ex.amount}</td></tr>))}</tbody></table></Card></div>
  );
}

// --- Parties View ---
export function PartiesView({ user, appId, lang }: ViewProps) {
  const t = (key: string) => TRANSLATIONS[lang][key] || key;
  const [parties, setParties] = useState<Party[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newParty, setNewParty] = useState<Partial<Party>>({ type: 'customer' });
  const [historyParty, setHistoryParty] = useState<Party | null>(null);
  const [partyHistory, setPartyHistory] = useState<Transaction[]>([]);
  const [partyStats, setPartyStats] = useState({ totalSpent: 0, totalDue: 0 });

  useEffect(() => { if (!user) return; return onSnapshot(collection(db, 'artifacts', appId, 'public', 'data', 'parties'), snap => setParties(snap.docs.map(d => ({id: d.id, ...d.data()} as Party)))); }, [user, appId]);
  
  useEffect(() => {
    if(!historyParty) { setPartyHistory([]); return; }
    const q = collection(db, 'artifacts', appId, 'public', 'data', 'transactions');
    const unsub = onSnapshot(q, snap => {
       const allDocs = snap.docs.map(d => ({id: d.id, ...d.data()} as Transaction));
       const docs = allDocs
         .filter(d => d.partyId === historyParty.id)
         .sort((a, b) => (b.date?.seconds || 0) - (a.date?.seconds || 0))
         .slice(0, 20);

       setPartyHistory(docs);
       const totalSpent = docs.reduce((sum, t) => sum + (t.amount || 0), 0);
       setPartyStats({ totalSpent, totalDue: historyParty.balance || 0 });
    });
    return () => unsub();
  }, [historyParty, appId]);

  const handleSave = async () => { await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'parties'), { ...newParty, balance: 0 }); setIsModalOpen(false); };
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center"><h2 className="text-2xl font-bold">{t('party_list')}</h2><Button onClick={() => setIsModalOpen(true)} icon={Plus}>{t('add_party')}</Button></div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="p-4"><h3 className="font-bold text-blue-700 mb-2">{t('customer')}</h3>{parties.filter(p=>p.type==='customer').map(p=><div key={p.id} className="flex justify-between items-center p-2 border-b last:border-0"><div><div className="font-medium">{p.name}</div><button onClick={()=>setHistoryParty(p)} className="text-xs text-blue-500 hover:underline flex items-center gap-1"><Clock size={10}/> {t('view_history')}</button></div><span className={(p.balance||0)>0?'text-red-500 font-bold':'text-emerald-500'}>{t('due')}: ৳{p.balance}</span></div>)}</Card>
        <Card className="p-4"><h3 className="font-bold text-amber-700 mb-2">{t('suppliers')}</h3>{parties.filter(p=>p.type==='supplier').map(p=><div key={p.id} className="flex justify-between items-center p-2 border-b last:border-0"><div><div className="font-medium">{p.name}</div><button onClick={()=>setHistoryParty(p)} className="text-xs text-blue-500 hover:underline flex items-center gap-1"><Clock size={10}/> {t('view_history')}</button></div><span className={(p.balance||0)>0?'text-emerald-500':'text-red-500 font-bold'}>Bal: ৳{p.balance}</span></div>)}</Card>
      </div>
      
      {isModalOpen && (
        <Modal title={t('add_party')} onClose={() => setIsModalOpen(false)}>
           <div className="space-y-3">
             <select className="w-full p-2 border rounded" value={newParty.type} onChange={e=>setNewParty({...newParty,type:e.target.value as any})}><option value="customer">{t('customer')}</option><option value="supplier">{t('supplier')}</option></select>
             <input className="w-full p-2 border rounded" placeholder={t('name')} value={newParty.name||''} onChange={e=>setNewParty({...newParty,name:e.target.value})}/>
             <input className="w-full p-2 border rounded" placeholder="Phone" value={newParty.phone||''} onChange={e=>setNewParty({...newParty,phone:e.target.value})}/>
           </div>
           <div className="mt-4 flex justify-end gap-2"><Button variant="secondary" onClick={()=>setIsModalOpen(false)}>{t('close')}</Button><Button onClick={handleSave}>{t('add')}</Button></div>
        </Modal>
      )}

      {historyParty && (
        <Modal title={`${historyParty.name} - ${t('history')}`} onClose={() => setHistoryParty(null)}>
           <div className="grid grid-cols-2 gap-4 mb-4">
             <div className="bg-blue-50 p-3 rounded text-center"><div className="text-xs text-blue-500 uppercase">{t('total_spent')}</div><div className="font-bold text-xl">৳{partyStats.totalSpent}</div></div>
             <div className="bg-red-50 p-3 rounded text-center"><div className="text-xs text-red-500 uppercase">{t('due')}</div><div className="font-bold text-xl">৳{partyStats.totalDue}</div></div>
           </div>
           <div className="space-y-2">
             <h4 className="font-bold text-sm text-slate-500 uppercase">{t('purchase_history')}</h4>
             {partyHistory.length === 0 ? <p className="text-slate-400 text-sm">No transactions found.</p> :
               partyHistory.map(txn => (
                 <div key={txn.id} className="border p-3 rounded hover:bg-slate-50">
                    <div className="flex justify-between mb-1">
                      <span className="font-bold text-slate-800">৳{txn.amount}</span>
                      <span className="text-xs text-slate-500">{txn.date?.toDate ? txn.date.toDate().toLocaleDateString() : 'N/A'}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="bg-slate-200 px-1 rounded">{txn.type}</span>
                      <span className={(txn.dueAmount||0) > 0 ? 'text-red-500' : 'text-emerald-500'}>{(txn.dueAmount||0) > 0 ? `Due: ৳${txn.dueAmount}` : 'Paid'}</span>
                    </div>
                 </div>
               ))
             }
           </div>
        </Modal>
      )}
    </div>
  );
}

// --- Purchase View ---
export function PurchaseView({ user, appId, lang }: ViewProps) {
    const t = (key: string) => TRANSLATIONS[lang][key] || key;
    const [suppliers, setSuppliers] = useState<any[]>([]);
    const [products, setProducts] = useState<any[]>([]);
    const [selSup, setSelSup] = useState('');
    const [selProd, setSelProd] = useState('');
    const [qty, setQty] = useState('');
    const [cost, setCost] = useState('');
    useEffect(() => { if(!user) return; onSnapshot(query(collection(db, 'artifacts', appId, 'public', 'data', 'parties'), where('type', '==', 'supplier')), s=>setSuppliers(s.docs.map(d=>({id:d.id,...d.data()})))); onSnapshot(collection(db, 'artifacts', appId, 'public', 'data', 'products'), s=>setProducts(s.docs.map(d=>({id:d.id,...d.data()})))); }, [user, appId]);
    
    const handlePurchase = async () => { 
      if (!selSup || !selProd || !qty || !cost) return; 
      const total = parseFloat(cost) * parseInt(qty); 
      const batch = writeBatch(db); 
      
      const txnRef = doc(collection(db, 'artifacts', appId, 'public', 'data', 'transactions'));
      batch.set(txnRef, { type: 'purchase', amount: total, paidAmount: total, dueAmount: 0, date: serverTimestamp(), partyId: selSup }); 
      
      batch.update(doc(db, 'artifacts', appId, 'public', 'data', 'products', selProd), { stock: increment(parseInt(qty)), cost: parseFloat(cost) }); 
      
      const logRef = doc(collection(db, 'artifacts', appId, 'public', 'data', 'stock_logs'));
      const prodName = products.find(p => p.id === selProd)?.name || 'Unknown';
      batch.set(logRef, {
        productId: selProd,
        productName: prodName,
        qty: parseInt(qty), 
        type: 'purchase',
        refId: txnRef.id,
        date: serverTimestamp()
      });

      await batch.commit(); 
      alert('Purchase Recorded!'); 
      setQty(''); setCost('');
    };
    
    return (
        <div className="max-w-xl mx-auto space-y-6"><h2 className="text-2xl font-bold">{t('purchase_stock')}</h2><Card className="p-6 space-y-4"><div><label className="block text-sm font-medium mb-1">{t('supplier')}</label><select className="w-full p-2 border rounded" value={selSup} onChange={e => setSelSup(e.target.value)}><option value="">Select</option>{suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}</select></div><div><label className="block text-sm font-medium mb-1">{t('product')}</label><select className="w-full p-2 border rounded" value={selProd} onChange={e => setSelProd(e.target.value)}><option value="">Select</option>{products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</select></div><div className="flex gap-4"><input type="number" className="flex-1 p-2 border rounded" placeholder={t('qty')} value={qty} onChange={e => setQty(e.target.value)} /><input type="number" className="flex-1 p-2 border rounded" placeholder={t('unit_cost')} value={cost} onChange={e => setCost(e.target.value)} /></div><Button onClick={handlePurchase} className="w-full">{t('confirm_purchase')}</Button></Card></div>
    );
}

// --- Settings View ---
export function SettingsView({ user, appId, lang }: ViewProps) {
    const t = (key: string) => TRANSLATIONS[lang][key] || key;
    return <div className="max-w-2xl"><h2 className="text-2xl font-bold mb-6">{t('settings')}</h2><Card className="p-6"><h3 className="font-bold text-lg mb-4">{t('shop_config')}</h3><div className="space-y-4"><div><label className="block text-sm font-medium">{t('shop_name')}</label><input className="w-full p-2 border rounded" defaultValue="My Smart Shop"/></div><div><label className="block text-sm font-medium">{t('currency')}</label><input className="w-full p-2 border rounded" defaultValue="BDT (৳)" disabled/></div><Button>{t('save_changes')}</Button></div></Card></div>;
}
