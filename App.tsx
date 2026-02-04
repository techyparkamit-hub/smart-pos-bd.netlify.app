import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, ShoppingCart, Package, Users, FileText, Settings, 
  Menu, X, ChevronRight, Truck, TicketPercent, Wallet, ArrowDownLeft,
  HelpCircle, LifeBuoy, Globe, TrendingUp, RefreshCw, ArrowRightLeft, RefreshCcw
} from 'lucide-react';
import { signInAnonymously, signInWithCustomToken, onAuthStateChanged, signOut, User } from 'firebase/auth';
import { auth, appId } from './firebase';
import { TRANSLATIONS } from './constants';
import { Language } from './types';

// Views
import DashboardView from './views/Dashboard';
import SalesView from './views/Sales';
import ReturnExchangeView from './views/ReturnExchange';
import InventoryView from './views/Inventory';
import { DeliveryView, MarketingView, ExpenseView, PartiesView, PurchaseView, ReportsView, SettingsView } from './views/Operations';
import { FAQView, SupportView, CommunityView } from './views/Support';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [lang, setLang] = useState<Language>('bn');

  useEffect(() => {
    const initAuth = async () => {
      // Check for custom token injected by the environment (source logic)
      if (typeof window !== 'undefined' && window.__initial_auth_token) {
        try {
          await signInWithCustomToken(auth, window.__initial_auth_token);
        } catch (e) {
          console.error("Custom token auth failed, falling back", e);
          await signInAnonymously(auth);
        }
      } else {
        await signInAnonymously(auth);
      }
    };
    initAuth();
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleLogout = () => signOut(auth);
  const t = (key: string) => TRANSLATIONS[lang][key] || key;

  if (loading) return <div className="h-screen flex items-center justify-center bg-slate-50 text-blue-600"><RefreshCw className="animate-spin w-8 h-8"/></div>;

  const menuItems = [
    { id: 'dashboard', icon: LayoutDashboard, label: t('dashboard'), sub: t('home') },
    { id: 'sales', icon: ShoppingCart, label: t('sales'), sub: t('new_sale') },
    { id: 'return_exchange', icon: ArrowRightLeft, label: t('return_exchange'), sub: t('return') + ' & ' + t('exchange') },
    { id: 'delivery', icon: Truck, label: t('delivery'), sub: t('courier') }, 
    { id: 'marketing', icon: TicketPercent, label: t('marketing'), sub: t('promo_sms') }, 
    { id: 'stock', icon: Package, label: t('stock'), sub: t('inventory') },
    { id: 'purchase', icon: ArrowDownLeft, label: t('purchase'), sub: t('inventory') },
    { id: 'expenses', icon: Wallet, label: t('expenses'), sub: t('add_expense') },
    { id: 'parties', icon: Users, label: t('parties'), sub: t('customer') },
    { id: 'reports', icon: FileText, label: t('reports'), sub: t('invoice') },
    { id: 'faq', icon: HelpCircle, label: t('faq'), sub: t('help') },
    { id: 'support', icon: LifeBuoy, label: t('support'), sub: t('ticket_list') },
    { id: 'community', icon: Globe, label: t('community'), sub: t('social_links') },
    { id: 'settings', icon: Settings, label: t('settings'), sub: t('shop_config') },
  ];

  return (
    <div className="flex h-screen bg-slate-50 text-slate-800 font-sans overflow-hidden">
      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 lg:hidden backdrop-blur-sm" onClick={() => setIsSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`fixed lg:static inset-y-0 left-0 z-50 w-72 bg-white border-r border-slate-200 transform transition-transform duration-300 ease-out ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'} flex flex-col shadow-2xl lg:shadow-none`}>
        <div className="p-6 border-b border-slate-100 flex items-center gap-3">
          <div className="bg-blue-600 p-2.5 rounded-xl shadow-lg shadow-blue-600/20">
            <TrendingUp className="w-6 h-6 text-white" />
          </div>
          <div className="flex-1">
            <h1 className="text-xl font-bold text-slate-900">SmartBiz</h1>
            <p className="text-xs text-slate-500">{t('business_suite')}</p>
          </div>
          <button 
            onClick={() => setLang(prev => prev === 'en' ? 'bn' : 'en')}
            className="p-1.5 rounded-lg bg-slate-100 text-slate-600 hover:bg-blue-50 hover:text-blue-600 font-bold text-xs border border-slate-200"
            title="Switch Language"
          >
            {lang === 'en' ? 'BN' : 'EN'}
          </button>
        </div>

        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => { setActiveTab(item.id); setIsSidebarOpen(false); }}
              className={`w-full flex items-center gap-4 px-4 py-3 rounded-xl transition-all duration-200 group ${activeTab === item.id ? 'bg-blue-50 text-blue-700 font-semibold' : 'text-slate-600 hover:bg-slate-50'}`}
            >
              <item.icon className={`w-5 h-5 ${activeTab === item.id ? 'text-blue-600' : 'text-slate-400 group-hover:text-slate-600'}`} />
              <div className="text-left">
                <span className="block text-sm leading-none">{item.label}</span>
                <span className="text-[10px] text-slate-400 font-normal uppercase tracking-wider">{item.sub}</span>
              </div>
              {activeTab === item.id && <ChevronRight className="ml-auto w-4 h-4 text-blue-400" />}
            </button>
          ))}
        </nav>
        <div className="p-4 border-t border-slate-100 bg-slate-50/50">
           <div className="flex items-center gap-3">
             <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center font-bold text-slate-600">{user?.isAnonymous ? 'G' : 'A'}</div>
             <div className="flex-1 min-w-0">
               <p className="text-sm font-medium text-slate-900 truncate">{t('owner')}</p>
               <button onClick={handleLogout} className="text-xs text-red-500 hover:underline">{t('log_out')}</button>
             </div>
           </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-full overflow-hidden relative w-full">
        <header className="lg:hidden h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 sticky top-0 z-30">
          <button onClick={() => setIsSidebarOpen(true)} className="p-2 -ml-2 text-slate-600 active:bg-slate-100 rounded-lg"><Menu className="w-6 h-6" /></button>
          <span className="font-bold text-slate-800 text-lg">{menuItems.find(i => i.id === activeTab)?.label}</span>
          <div className="w-8" />
        </header>

        <div className="flex-1 overflow-y-auto overflow-x-hidden bg-slate-50/50">
          <div className="max-w-7xl mx-auto p-4 lg:p-8 min-h-full">
            {activeTab === 'dashboard' && <DashboardView user={user} appId={appId} setTab={setActiveTab} lang={lang} />}
            {activeTab === 'sales' && <SalesView user={user} appId={appId} lang={lang} />}
            {activeTab === 'return_exchange' && <ReturnExchangeView user={user} appId={appId} lang={lang} />}
            {activeTab === 'delivery' && <DeliveryView user={user} appId={appId} lang={lang} />}
            {activeTab === 'marketing' && <MarketingView user={user} appId={appId} lang={lang} />}
            {activeTab === 'purchase' && <PurchaseView user={user} appId={appId} lang={lang} />}
            {activeTab === 'expenses' && <ExpenseView user={user} appId={appId} lang={lang} />}
            {activeTab === 'stock' && <InventoryView user={user} appId={appId} lang={lang} />}
            {activeTab === 'parties' && <PartiesView user={user} appId={appId} lang={lang} />}
            {activeTab === 'reports' && <ReportsView user={user} appId={appId} lang={lang} />}
            {activeTab === 'faq' && <FAQView lang={lang} />}
            {activeTab === 'support' && <SupportView user={user} appId={appId} lang={lang} />}
            {activeTab === 'community' && <CommunityView lang={lang} user={user} appId={appId} />}
            {activeTab === 'settings' && <SettingsView user={user} appId={appId} lang={lang} />}
          </div>
        </div>
      </main>
    </div>
  );
}