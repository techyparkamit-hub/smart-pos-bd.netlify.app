import React, { useState, useEffect } from 'react';
import { Plus, History, Package, Users, Search, Trash2, Printer, FileText, Download } from 'lucide-react';
import { collection, onSnapshot, writeBatch, doc, serverTimestamp, increment } from 'firebase/firestore';
import { db } from '../firebase';
import { Card, Button } from '../components/UI';
import { TRANSLATIONS } from '../constants';
import { Language, Product, CartItem } from '../types';
import { User } from 'firebase/auth';

// --- Types ---
interface ViewProps {
  user: User | null;
  appId: string;
  lang: Language;
}

// --- Main Sales View ---
export default function SalesView({ user, appId, lang }: ViewProps) {
  const t = (key: string) => TRANSLATIONS[lang][key] || key;
  const [subTab, setSubTab] = useState<'create' | 'history' | 'product' | 'customer'>('create');

  const tabs = [
    { id: 'create', label: t('create_invoice'), icon: Plus },
    { id: 'history', label: t('sold_history'), icon: History },
    { id: 'product', label: t('sold_products'), icon: Package },
    { id: 'customer', label: t('customer_history'), icon: Users }
  ];

  return (
    <div className="h-full flex flex-col space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">{t('sales')}</h2>
      </div>
      {/* Sales Sub Navigation */}
      <div className="flex gap-2 overflow-x-auto pb-2 border-b">
        {tabs.map(tab => (
           <button 
             key={tab.id}
             onClick={() => setSubTab(tab.id as any)}
             className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors whitespace-nowrap ${subTab === tab.id ? 'bg-blue-100 text-blue-700' : 'text-slate-600 hover:bg-slate-50'}`}
           >
             <tab.icon size={16}/> {tab.label}
           </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto">
        {subTab === 'create' && <CreateInvoice user={user} appId={appId} lang={lang} />}
        {subTab === 'history' && <SoldHistory user={user} appId={appId} lang={lang} />}
        {subTab === 'product' && <SoldProductHistory user={user} appId={appId} lang={lang} />}
        {subTab === 'customer' && <CustomerHistory user={user} appId={appId} lang={lang} />}
      </div>
    </div>
  );
}

// --- Sub Components ---

function CreateInvoice({ user, appId, lang }: ViewProps) {
  const t = (key: string) => TRANSLATIONS[lang][key] || key;
  const [saleType, setSaleType] = useState('retail');
  const [custPhone, setCustPhone] = useState('');
  const [custName, setCustName] = useState('');
  const [custAddress, setCustAddress] = useState('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [products, setProducts] = useState<Product[]>([]);
  
  // Financials
  const [additionalExpense, setAdditionalExpense] = useState<string | number>(0);
  const [vat, setVat] = useState<string | number>(0);
  const [discount, setDiscount] = useState<string | number>(0);
  const [paidAmount, setPaidAmount] = useState<string | number>(0);
  const [paymentMethod, setPaymentMethod] = useState('Cash');
  const [remarks, setRemarks] = useState('');
  const [serviceStaff, setServiceStaff] = useState('');

  useEffect(() => {
    if (!user) return;
    const unsubProd = onSnapshot(collection(db, 'artifacts', appId, 'public', 'data', 'products'), snap => setProducts(snap.docs.map(d => ({id: d.id, ...d.data()} as Product))));
    return () => unsubProd();
  }, [user, appId]);

  const addToCart = (p: Product) => {
    setCart(prev => {
      const exist = prev.find(item => item.id === p.id);
      if (exist) return prev.map(item => item.id === p.id ? {...item, qty: item.qty + 1} : item);
      return [...prev, {...p, qty: 1}];
    });
    setSearchTerm('');
  };

  const removeFromCart = (idx: number) => {
    const newCart = [...cart];
    newCart.splice(idx, 1);
    setCart(newCart);
  };

  const totalQty = cart.reduce((acc, item) => acc + item.qty, 0);
  const subtotal = cart.reduce((acc, item) => acc + ((item.price || 0) * item.qty), 0);
  const totalPayable = subtotal + Number(additionalExpense||0) + Number(vat||0) - Number(discount||0);
  const changeAmount = Number(paidAmount||0) - totalPayable;

  const handleSale = async () => {
    if(!custPhone || !custName) { alert('Customer Name and Phone are required'); return; }
    if(cart.length === 0) { alert('Cart is empty'); return; }

    const batch = writeBatch(db);
    const txnRef = doc(collection(db, 'artifacts', appId, 'public', 'data', 'transactions'));
    
    const saleData = {
      type: 'sale',
      saleType,
      partyPhone: custPhone,
      partyName: custName,
      partyAddress: custAddress,
      items: cart,
      totalQty,
      subtotal,
      additionalExpense: Number(additionalExpense||0),
      vat: Number(vat||0),
      discount: Number(discount||0),
      amount: totalPayable,
      paidAmount: Number(paidAmount||0),
      dueAmount: Math.max(0, totalPayable - Number(paidAmount||0)),
      paymentMethod,
      changeAmount: Math.max(0, changeAmount),
      remarks,
      serviceStaff,
      date: serverTimestamp(),
      deliveryStatus: 'Delivered'
    };

    batch.set(txnRef, saleData);

    cart.forEach(item => {
       if(item.id) {
         batch.update(doc(db, 'artifacts', appId, 'public', 'data', 'products', item.id), { stock: increment(-item.qty) });
         const logRef = doc(collection(db, 'artifacts', appId, 'public', 'data', 'stock_logs'));
         batch.set(logRef, {
           productId: item.id,
           productName: item.name,
           qty: -item.qty,
           type: 'sale',
           refId: txnRef.id,
           date: serverTimestamp()
         });
       }
    });

    await batch.commit();
    alert('Sale Completed!');
    setCart([]); setCustPhone(''); setCustName(''); setCustAddress(''); setPaidAmount(0);
  };

  const filteredProducts = products.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()) || p.sku?.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div className="flex flex-col gap-6">
      <Card className="p-6">
        <h3 className="font-bold text-lg mb-4 border-b pb-2">Invoice Summary</h3>
        {/* Sale Type */}
        <div className="flex gap-4 mb-6">
          <label className={`flex items-center gap-2 p-3 border rounded-lg cursor-pointer flex-1 justify-center transition-colors ${saleType==='retail' ? 'bg-blue-50 border-blue-500 text-blue-700 font-bold' : 'hover:bg-slate-50'}`}>
            <input type="radio" name="saleType" checked={saleType==='retail'} onChange={()=>setSaleType('retail')} className="w-4 h-4"/> {t('retail_sale')}
          </label>
          <label className={`flex items-center gap-2 p-3 border rounded-lg cursor-pointer flex-1 justify-center transition-colors ${saleType==='wholesale' ? 'bg-blue-50 border-blue-500 text-blue-700 font-bold' : 'hover:bg-slate-50'}`}>
            <input type="radio" name="saleType" checked={saleType==='wholesale'} onChange={()=>setSaleType('wholesale')} className="w-4 h-4"/> {t('wholesale')}
          </label>
        </div>

        {/* Customer Details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
           <div>
             <label className="block text-sm font-medium mb-1">{t('phone_number')} <span className="text-red-500">*</span></label>
             <input className="w-full p-2 border rounded" placeholder="Type Phone number" value={custPhone} onChange={e=>setCustPhone(e.target.value)}/>
           </div>
           <div>
             <label className="block text-sm font-medium mb-1">{t('customer_name')} <span className="text-red-500">*</span></label>
             <input className="w-full p-2 border rounded" placeholder="Enter Customer Name" value={custName} onChange={e=>setCustName(e.target.value)}/>
           </div>
           <div className="md:col-span-2">
             <label className="block text-sm font-medium mb-1">{t('address')}</label>
             <input className="w-full p-2 border rounded" placeholder="Enter Address" value={custAddress} onChange={e=>setCustAddress(e.target.value)}/>
           </div>
        </div>

        {/* Product Search & Cart */}
        <div className="mb-6 relative">
           <label className="block text-sm font-medium mb-1">Search Product</label>
           <div className="relative">
             <input className="w-full p-2 pl-10 border rounded focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Scan SKU or Search Product..." value={searchTerm} onChange={e=>setSearchTerm(e.target.value)}/>
             <Search className="absolute left-3 top-2.5 text-slate-400" size={18}/>
           </div>
           {searchTerm && (
             <div className="absolute z-10 w-full bg-white border rounded-b shadow-lg max-h-60 overflow-y-auto">
                {filteredProducts.map(p => (
                  <div key={p.id} onClick={()=>addToCart(p)} className="p-2 hover:bg-blue-50 cursor-pointer border-b flex justify-between">
                    <span>{p.name} ({p.sku})</span>
                    <span className="font-bold">৳{p.price}</span>
                  </div>
                ))}
             </div>
           )}
        </div>

        {/* Cart Table */}
        {cart.length > 0 && (
          <div className="border rounded-lg overflow-hidden mb-6">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 border-b">
                <tr>
                  <th className="p-3">Product</th>
                  <th className="p-3 w-20">Price</th>
                  <th className="p-3 w-20">Qty</th>
                  <th className="p-3 w-24 text-right">Total</th>
                  <th className="p-3 w-10"></th>
                </tr>
              </thead>
              <tbody>
                {cart.map((item, idx) => (
                  <tr key={idx} className="border-b last:border-0">
                    <td className="p-3">{item.name}</td>
                    <td className="p-3">৳{item.price}</td>
                    <td className="p-3 font-bold">{item.qty}</td>
                    <td className="p-3 text-right font-bold">৳{(item.price || 0)*item.qty}</td>
                    <td className="p-3"><button onClick={()=>removeFromCart(idx)} className="text-red-500 hover:bg-red-50 p-1 rounded"><Trash2 size={16}/></button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Financial Summary Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4 bg-slate-50 p-4 rounded-xl">
           <div><label className="block text-sm font-medium mb-1">{t('total_qty')}</label><input className="w-full p-2 border rounded bg-white" readOnly value={totalQty}/></div>
           <div><label className="block text-sm font-medium mb-1">{t('amount')}</label><input className="w-full p-2 border rounded bg-white" readOnly value={subtotal}/></div>
           
           <div><label className="block text-sm font-medium mb-1">{t('additional_expense')}</label><input type="number" className="w-full p-2 border rounded" value={additionalExpense} onChange={e=>setAdditionalExpense(e.target.value)}/></div>
           <div><label className="block text-sm font-medium mb-1">{t('vat')}</label><input type="number" className="w-full p-2 border rounded" value={vat} onChange={e=>setVat(e.target.value)}/></div>
           
           <div><label className="block text-sm font-medium mb-1">{t('total_discount')}</label><input type="number" className="w-full p-2 border rounded" value={discount} onChange={e=>setDiscount(e.target.value)}/></div>
           <div><label className="block text-sm font-medium mb-1">{t('total_payable')}</label><input className="w-full p-2 border rounded bg-blue-100 font-bold text-blue-800" readOnly value={totalPayable}/></div>
           
           <div>
             <label className="block text-sm font-medium mb-1">{t('payment_method')} <span className="text-red-500">*</span></label>
             <select className="w-full p-2 border rounded" value={paymentMethod} onChange={e=>setPaymentMethod(e.target.value)}>
               <option>Cash</option><option>Card</option><option>bKash</option><option>Nagad</option>
             </select>
           </div>
           <div className="flex gap-2">
             <div className="flex-1">
               <label className="block text-sm font-medium mb-1">{t('paid_amount')} <span className="text-red-500">*</span></label>
               <input type="number" className="w-full p-2 border rounded font-bold" value={paidAmount} onChange={e=>setPaidAmount(e.target.value)}/>
             </div>
             <button className="mt-6 text-red-400 hover:text-red-600"><Trash2 size={20}/></button>
           </div>

           <div><label className="block text-sm font-medium mb-1">{t('change_amount')}</label><input className="w-full p-2 border rounded bg-slate-200 text-slate-600" readOnly value={changeAmount}/></div>
           <div>
             <label className="block text-sm font-medium mb-1">{t('service_staff')}</label>
             <select className="w-full p-2 border rounded" value={serviceStaff} onChange={e=>setServiceStaff(e.target.value)}>
               <option value="">Select Staff</option>
               <option value="Rahim">Rahim</option>
               <option value="Karim">Karim</option>
             </select>
           </div>
           
           <div className="md:col-span-2">
             <label className="block text-sm font-medium mb-1">{t('remarks')}</label>
             <textarea className="w-full p-2 border rounded h-20 resize-none" placeholder="Add remarks here..." value={remarks} onChange={e=>setRemarks(e.target.value)}></textarea>
           </div>
        </div>

        <Button className="w-full mt-6 py-3 text-lg" onClick={handleSale}>{t('confirm_sale')}</Button>
      </Card>
    </div>
  );
}

function SoldHistory({ user, appId, lang }: ViewProps) {
  const t = (key: string) => TRANSLATIONS[lang][key] || key;
  const [sales, setSales] = useState<any[]>([]);
  
  useEffect(() => {
    if(!user) return;
    const q = collection(db, 'artifacts', appId, 'public', 'data', 'transactions');
    const unsub = onSnapshot(q, snap => {
      const allData = snap.docs.map(d => ({id: d.id, ...d.data()}));
      const filtered = allData
        .filter((d: any) => d.type === 'sale')
        .sort((a, b) => (b.date?.seconds || 0) - (a.date?.seconds || 0));
      setSales(filtered);
    });
    return () => unsub();
  }, [user, appId]);

  return (
    <Card>
      <div className="p-4 border-b flex flex-wrap gap-4 items-center bg-slate-50">
         <input className="p-2 border rounded w-64" placeholder="Type here..." />
         <div className="ml-auto flex gap-2">
            <button className="p-2 bg-white border rounded hover:bg-slate-50"><FileText size={18}/></button>
            <button className="p-2 bg-white border rounded hover:bg-slate-50"><Download size={18}/></button>
            <button className="p-2 bg-white border rounded hover:bg-slate-50"><Printer size={18}/></button>
         </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm whitespace-nowrap">
          <thead className="bg-slate-100 border-b text-slate-600">
            <tr>
              <th className="p-3 font-bold">{t('sl')}</th>
              <th className="p-3 font-bold">Date & Time</th>
              <th className="p-3 font-bold">{t('invoice_no')}</th>
              <th className="p-3 font-bold">Customer</th>
              <th className="p-3 font-bold">{t('type')}</th>
              <th className="p-3 font-bold text-right">Amount</th>
            </tr>
          </thead>
          <tbody>
            {sales.map((sale, idx) => (
              <tr key={sale.id} className="border-b hover:bg-slate-50">
                <td className="p-3">{idx+1}</td>
                <td className="p-3">{sale.date?.toDate ? sale.date.toDate().toLocaleString() : 'N/A'}</td>
                <td className="p-3 font-mono text-xs">{sale.id.slice(0,8).toUpperCase()}</td>
                <td className="p-3">{sale.partyName}</td>
                <td className="p-3"><span className="px-2 py-1 bg-blue-50 text-blue-700 rounded text-xs capitalize">{sale.saleType || 'Retail'}</span></td>
                <td className="p-3 text-right font-bold">৳{sale.amount}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

function SoldProductHistory({ user, appId, lang }: ViewProps) {
  const t = (key: string) => TRANSLATIONS[lang][key] || key;
  const [soldItems, setSoldItems] = useState<any[]>([]);

  useEffect(() => {
    if(!user) return;
    const q = collection(db, 'artifacts', appId, 'public', 'data', 'transactions');
    const unsub = onSnapshot(q, snap => {
       const items: any[] = [];
       const allData = snap.docs.map(d => ({id: d.id, ...d.data()}));
       const sales = allData
         .filter((d: any) => d.type === 'sale')
         .sort((a, b) => (b.date?.seconds || 0) - (a.date?.seconds || 0))
         .slice(0, 50);

       sales.forEach((data: any) => {
          if(data.items && Array.isArray(data.items)) {
             data.items.forEach((item: any) => {
                items.push({
                   txnId: data.id,
                   date: data.date,
                   category: item.category || 'General',
                   brand: item.brand || 'Generic',
                   name: item.name,
                   qty: item.qty,
                   price: item.price
                });
             });
          }
       });
       setSoldItems(items);
    });
    return () => unsub;
  }, [user, appId]);

  return (
    <Card>
      <div className="p-4 border-b bg-slate-50">
        <h3 className="font-bold">{t('sold_products')} (Last 50 items)</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm whitespace-nowrap">
          <thead className="bg-slate-100 border-b text-slate-600">
            <tr>
              <th className="p-3 font-bold">{t('category')}</th>
              <th className="p-3 font-bold">{t('brand')}</th>
              <th className="p-3 font-bold">Product</th>
              <th className="p-3 font-bold text-center">{t('quantity')}</th>
              <th className="p-3 font-bold text-right">Price</th>
            </tr>
          </thead>
          <tbody>
            {soldItems.map((item, idx) => (
              <tr key={`${item.txnId}-${idx}`} className="border-b hover:bg-slate-50">
                <td className="p-3">{item.category}</td>
                <td className="p-3">{item.brand}</td>
                <td className="p-3 font-medium">{item.name}</td>
                <td className="p-3 text-center">{item.qty}</td>
                <td className="p-3 text-right">৳{item.price}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

function CustomerHistory({ user, appId, lang }: ViewProps) {
  const t = (key: string) => TRANSLATIONS[lang][key] || key;
  return (
    <Card>
      <div className="p-4 border-b flex flex-wrap gap-4 items-center bg-slate-50">
         <h3 className="font-bold mr-4">{t('customer_history')}</h3>
         <div className="ml-auto text-slate-400 text-sm">Feature coming soon...</div>
      </div>
      <div className="p-8 text-center text-slate-400">
        Customer history tracking will be available in the next update.
      </div>
    </Card>
  );
}
