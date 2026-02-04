import React, { useState, useEffect } from 'react';
import { Package, BarChart3, FileBarChart, History, ArrowRightLeft, Hash, Plus, AlertTriangle, Edit, Upload, X, ChevronRight, ScanLine, Trash2 } from 'lucide-react';
import { collection, onSnapshot, addDoc, updateDoc, doc, writeBatch, increment, query, where, serverTimestamp, deleteDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { Card, Button, Modal } from '../components/UI';
import { TRANSLATIONS } from '../constants';
import { Language, Product } from '../types';
import { User } from 'firebase/auth';

interface ViewProps {
  user: User | null;
  appId: string;
  lang: Language;
}

export default function InventoryView({ user, appId, lang }: ViewProps) {
  const t = (key: string) => TRANSLATIONS[lang][key] || key;
  const [subTab, setSubTab] = useState('list');
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => { 
    if (!user) return; 
    return onSnapshot(collection(db, 'artifacts', appId, 'public', 'data', 'products'), snap => 
      setProducts(snap.docs.map(d => ({id: d.id, ...d.data()} as Product)))
    ); 
  }, [user, appId]);

  const tabs = [
    { id: 'list', label: t('product_list'), icon: Package },
    { id: 'report', label: t('stock_report'), icon: BarChart3 },
    { id: 'ledger', label: t('stock_ledger'), icon: History },
    { id: 'transfer', label: t('stock_transfer'), icon: ArrowRightLeft },
    { id: 'serials', label: t('serial_manage'), icon: Hash }
  ];

  return (
    <div className="space-y-6 h-full flex flex-col">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">{t('inv_dashboard')}</h2>
      </div>
      
      <div className="flex gap-2 overflow-x-auto pb-2 border-b">
        {tabs.map(tab => (
           <button 
             key={tab.id}
             onClick={() => setSubTab(tab.id)}
             className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors whitespace-nowrap ${subTab === tab.id ? 'bg-blue-100 text-blue-700' : 'text-slate-600 hover:bg-slate-50'}`}
           >
             <tab.icon size={16}/> {tab.label}
           </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto">
         {subTab === 'list' && <StockList products={products} user={user} appId={appId} lang={lang} />}
         {subTab === 'report' && <StockReportSummary products={products} lang={lang} />}
         {subTab === 'ledger' && <StockLedger user={user} appId={appId} lang={lang} />}
         {subTab === 'transfer' && <StockTransfer products={products} user={user} appId={appId} lang={lang} />}
         {subTab === 'serials' && <SerialManager products={products} user={user} appId={appId} lang={lang} />}
      </div>
    </div>
  );
}

function StockList({ products, user, appId, lang }: { products: Product[], user: User | null, appId: string, lang: Language }) {
  const t = (key: string) => TRANSLATIONS[lang][key] || key;
  const [isEditing, setIsEditing] = useState(false);
  const [currentProduct, setCurrentProduct] = useState<Product>({ name: '' });

  const handleSave = async () => { 
    const data = { 
      name: currentProduct.name, 
      sku: currentProduct.sku || 'SKU-'+Date.now(),
      category: currentProduct.category || 'General', 
      brand: currentProduct.brand || '',
      units: currentProduct.units || 'Pcs',
      size: currentProduct.size || '',
      variations: currentProduct.variations || '',
      color: currentProduct.color || '',
      warranty: currentProduct.warranty || '',
      mfgDate: currentProduct.mfgDate || '',
      expDate: currentProduct.expDate || '',
      cost: Number(currentProduct.cost || 0), 
      wholesalePrice: Number(currentProduct.wholesalePrice || 0),
      price: Number(currentProduct.price || 0), // MRP
      vat: Number(currentProduct.vat || 0),
      isVatApplicable: currentProduct.isVatApplicable || false,
      stock: Number(currentProduct.stock || 0), // Stock In
      alertQty: Number(currentProduct.alertQty || 0),
    }; 
    if (currentProduct.id) {
      await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'products', currentProduct.id), data as any); 
    } else { 
      await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'products'), data); 
    }
    setIsEditing(false); 
  };

  return (
    <div className="space-y-4">
       <div className="flex justify-end">
          <Button onClick={() => { setCurrentProduct({ name: '', units: 'Pcs'}); setIsEditing(true); }} icon={Plus}>{t('add_product')}</Button>
       </div>
       <Card>
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 border-b"><tr><th className="p-3">{t('name')}</th><th className="p-3">{t('category')}</th><th className="p-3">{t('cost')}</th><th className="p-3">{t('price')}</th><th className="p-3">{t('stock')}</th><th className="p-3 text-right">{t('action')}</th></tr></thead>
          <tbody>
            {products.map(p => (
              <tr key={p.id} className={`border-b ${Number(p.stock) < (p.alertQty || 10) ? 'bg-red-50' : ''}`}>
                <td className="p-3">
                  <div className="font-medium">{p.name}</div>
                  <div className="text-xs text-slate-400">{p.sku}</div>
                  {Number(p.stock) < (p.alertQty || 10) && <div className="text-xs text-red-500 flex items-center gap-1 font-bold"><AlertTriangle size={10}/> {t('low_stock')}</div>}
                </td>
                <td className="p-3 text-slate-600">{p.category}</td>
                <td className="p-3">৳{p.cost}</td>
                <td className="p-3 text-blue-600 font-bold">৳{p.price}</td>
                <td className="p-3 font-bold">{p.stock}</td>
                <td className="p-3 text-right">
                  <button onClick={() => { setCurrentProduct(p); setIsEditing(true); }} className="text-slate-500 hover:text-blue-600 p-2 rounded hover:bg-slate-100"><Edit size={16}/></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      {isEditing && (
        <Modal title={currentProduct.id ? 'Edit Product' : 'Add Product'} onClose={() => setIsEditing(false)} size="lg">
           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
             <div><label className="block text-sm font-medium mb-1">Name</label><input className="w-full p-2 border rounded" value={currentProduct.name} onChange={e=>setCurrentProduct({...currentProduct, name: e.target.value})} /></div>
             <div><label className="block text-sm font-medium mb-1">SKU</label><input className="w-full p-2 border rounded" value={currentProduct.sku || ''} onChange={e=>setCurrentProduct({...currentProduct, sku: e.target.value})} /></div>
             <div><label className="block text-sm font-medium mb-1">Cost</label><input type="number" className="w-full p-2 border rounded" value={currentProduct.cost || ''} onChange={e=>setCurrentProduct({...currentProduct, cost: Number(e.target.value)})} /></div>
             <div><label className="block text-sm font-medium mb-1">Price (MRP)</label><input type="number" className="w-full p-2 border rounded" value={currentProduct.price || ''} onChange={e=>setCurrentProduct({...currentProduct, price: Number(e.target.value)})} /></div>
             <div><label className="block text-sm font-medium mb-1">Stock</label><input type="number" className="w-full p-2 border rounded" value={currentProduct.stock || ''} onChange={e=>setCurrentProduct({...currentProduct, stock: Number(e.target.value)})} /></div>
             <div><label className="block text-sm font-medium mb-1">Alert Qty</label><input type="number" className="w-full p-2 border rounded" value={currentProduct.alertQty || ''} onChange={e=>setCurrentProduct({...currentProduct, alertQty: Number(e.target.value)})} /></div>
           </div>
           <div className="mt-4 flex justify-end gap-2">
             <Button variant="secondary" onClick={() => setIsEditing(false)}>Cancel</Button>
             <Button onClick={handleSave}>Save</Button>
           </div>
        </Modal>
      )}
    </div>
  );
}

function StockReportSummary({ products, lang }: { products: Product[], lang: Language }) {
  const t = (key: string) => TRANSLATIONS[lang][key] || key;
  const totalItems = products.reduce((sum, p) => sum + (Number(p.stock)||0), 0);
  const totalCost = products.reduce((sum, p) => sum + ((Number(p.cost)||0) * (Number(p.stock)||0)), 0);
  const totalPrice = products.reduce((sum, p) => sum + ((Number(p.price)||0) * (Number(p.stock)||0)), 0);
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
       <Card className="p-6 bg-blue-50 border-blue-100"><h3 className="text-sm font-bold text-blue-700 uppercase mb-1">{t('total_items')}</h3><div className="text-3xl font-bold text-slate-800">{totalItems}</div></Card>
       <Card className="p-6 bg-emerald-50 border-emerald-100"><h3 className="text-sm font-bold text-emerald-700 uppercase mb-1">{t('stock_value_cost')}</h3><div className="text-3xl font-bold text-slate-800">৳{totalCost.toLocaleString()}</div></Card>
       <Card className="p-6 bg-purple-50 border-purple-100"><h3 className="text-sm font-bold text-purple-700 uppercase mb-1">{t('stock_value_sales')}</h3><div className="text-3xl font-bold text-slate-800">৳{totalPrice.toLocaleString()}</div></Card>
       <Card className="p-6 bg-amber-50 border-amber-100"><h3 className="text-sm font-bold text-amber-700 uppercase mb-1">{t('est_profit')}</h3><div className="text-3xl font-bold text-slate-800">৳{(totalPrice - totalCost).toLocaleString()}</div></Card>
    </div>
  );
}

function StockLedger({ user, appId, lang }: ViewProps) {
  const t = (key: string) => TRANSLATIONS[lang][key] || key;
  const [logs, setLogs] = useState<any[]>([]);
  useEffect(() => {
    if(!user) return;
    const q = collection(db, 'artifacts', appId, 'public', 'data', 'stock_logs');
    return onSnapshot(q, snap => {
      const allData = snap.docs.map(d => ({id: d.id, ...d.data()}));
      allData.sort((a: any, b: any) => (b.date?.seconds || 0) - (a.date?.seconds || 0));
      setLogs(allData.slice(0, 50));
    });
  }, [user, appId]);

  return (
    <Card>
       <div className="p-4 border-b bg-slate-50"><h3 className="font-bold">{t('stock_ledger')} (Last 50)</h3></div>
       <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 border-b"><tr><th className="p-3">{t('date')}</th><th className="p-3">{t('product')}</th><th className="p-3">{t('type')}</th><th className="p-3 text-right">{t('qty')}</th></tr></thead>
          <tbody>
            {logs.map(l => (
              <tr key={l.id} className="border-b">
                <td className="p-3 text-slate-500">{l.date?.toDate ? l.date.toDate().toLocaleString() : 'N/A'}</td>
                <td className="p-3 font-medium">{l.productName}</td>
                <td className="p-3"><span className="bg-slate-100 px-2 py-1 rounded text-xs uppercase">{l.type}</span></td>
                <td className={`p-3 text-right font-bold ${l.qty > 0 ? 'text-emerald-600' : 'text-red-600'}`}>{l.qty > 0 ? '+' : ''}{l.qty}</td>
              </tr>
            ))}
          </tbody>
       </table>
    </Card>
  );
}

function StockTransfer({ products, user, appId, lang }: { products: Product[], user: User | null, appId: string, lang: Language }) {
  const t = (key: string) => TRANSLATIONS[lang][key] || key;
  const [selProd, setSelProd] = useState('');
  const [qty, setQty] = useState('');
  const [toLoc, setToLoc] = useState('');

  const handleTransfer = async () => {
    if (!selProd || !qty || !toLoc) return;
    const prod = products.find(p => p.id === selProd);
    if (!prod) return;
    const q = parseInt(qty);
    
    const batch = writeBatch(db);
    batch.update(doc(db, 'artifacts', appId, 'public', 'data', 'products', selProd), { stock: increment(-q) });
    
    const logRef = doc(collection(db, 'artifacts', appId, 'public', 'data', 'stock_logs'));
    batch.set(logRef, {
      productId: selProd,
      productName: prod.name,
      qty: -q,
      type: 'transfer_out',
      date: serverTimestamp(),
      note: `Transferred to ${toLoc}`
    });
    
    await batch.commit();
    alert('Stock Transferred Successfully');
    setQty(''); setToLoc('');
  };

  return (
    <div className="max-w-xl mx-auto">
       <Card className="p-6 space-y-4">
          <h3 className="font-bold text-lg mb-2 flex items-center gap-2"><ArrowRightLeft size={20}/> {t('stock_transfer')}</h3>
          <div><label className="block text-sm font-medium mb-1">{t('product')}</label><select className="w-full p-2 border rounded" value={selProd} onChange={e=>setSelProd(e.target.value)}><option value="">Select</option>{products.map(p=><option key={p.id} value={p.id}>{p.name} ({p.stock})</option>)}</select></div>
          <div className="flex gap-4">
             <div className="flex-1"><label className="block text-sm font-medium mb-1">{t('qty')}</label><input type="number" className="w-full p-2 border rounded" value={qty} onChange={e=>setQty(e.target.value)}/></div>
             <div className="flex-1"><label className="block text-sm font-medium mb-1">{t('to')} (Location)</label><input className="w-full p-2 border rounded" placeholder="e.g. Warehouse" value={toLoc} onChange={e=>setToLoc(e.target.value)}/></div>
          </div>
          <Button className="w-full" onClick={handleTransfer}>{t('transfer')}</Button>
       </Card>
    </div>
  );
}

function SerialManager({ products, user, appId, lang }: { products: Product[], user: User | null, appId: string, lang: Language }) {
  const t = (key: string) => TRANSLATIONS[lang][key] || key;
  const [selProd, setSelProd] = useState('');
  const [newSerial, setNewSerial] = useState('');
  const [serials, setSerials] = useState<any[]>([]);

  useEffect(() => {
    if (!user || !selProd) { setSerials([]); return; }
    const q = query(collection(db, 'artifacts', appId, 'public', 'data', 'serial_numbers'), where('productId', '==', selProd));
    return onSnapshot(q, snap => setSerials(snap.docs.map(d => ({id: d.id, ...d.data()}))));
  }, [user, appId, selProd]);

  const addSerial = async () => {
    if (!selProd || !newSerial) return;
    await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'serial_numbers'), {
      productId: selProd,
      serial: newSerial,
      status: 'available', 
      addedAt: serverTimestamp()
    });
    setNewSerial('');
  };

  const deleteSerial = async (id: string) => {
    await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'serial_numbers', id));
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-[calc(100vh-200px)]">
       <div className="md:col-span-1 border-r pr-4 overflow-y-auto">
          <h3 className="font-bold mb-3">{t('product_list')}</h3>
          {products.map(p => (
            <button key={p.id} onClick={()=>setSelProd(p.id!)} className={`w-full text-left p-3 rounded mb-2 border ${selProd===p.id ? 'bg-blue-50 border-blue-300 ring-1 ring-blue-300' : 'bg-white hover:bg-slate-50'}`}>
              <div className="font-medium text-sm">{p.name}</div>
            </button>
          ))}
       </div>
       <div className="md:col-span-2 flex flex-col">
          {selProd ? (
             <>
               <Card className="p-4 mb-4 flex gap-2">
                 <input className="flex-1 p-2 border rounded" placeholder="Enter Serial Number" value={newSerial} onChange={e=>setNewSerial(e.target.value)}/>
                 <Button onClick={addSerial}>{t('add_serial')}</Button>
               </Card>
               <Card className="flex-1 overflow-y-auto">
                 <table className="w-full text-left text-sm">
                   <thead className="bg-slate-50 border-b"><tr><th className="p-3">{t('serial_no')}</th><th className="p-3">{t('status')}</th><th className="p-3 text-right">{t('action')}</th></tr></thead>
                   <tbody>
                     {serials.map(s => (
                       <tr key={s.id} className="border-b">
                         <td className="p-3 font-mono text-slate-700">{s.serial}</td>
                         <td className="p-3"><span className={`px-2 py-1 rounded text-xs ${s.status==='available'?'bg-emerald-100 text-emerald-700':'bg-slate-100 text-slate-500'}`}>{t(s.status)}</span></td>
                         <td className="p-3 text-right"><button onClick={()=>deleteSerial(s.id)} className="text-red-500 hover:bg-red-50 p-1 rounded"><Trash2 size={16}/></button></td>
                       </tr>
                     ))}
                   </tbody>
                 </table>
               </Card>
             </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-slate-400">Select a product to manage serials</div>
          )}
       </div>
    </div>
  );
}