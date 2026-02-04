import React, { useState, useEffect } from 'react';
import { ChevronUp, ChevronDown, File, Copy, Check, ExternalLink } from 'lucide-react';
import { collection, onSnapshot, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { Card, Button } from '../components/UI';
import { TRANSLATIONS } from '../constants';
import { Language, Ticket } from '../types';
import { User } from 'firebase/auth';

interface ViewProps {
  user?: User | null;
  appId?: string;
  lang: Language;
}

export function FAQView({ lang }: { lang: Language }) {
  const t = (key: string) => TRANSLATIONS[lang][key] || key;
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const faqs = [
    { question: t('q1'), answer: "To reset your password, go to settings and click on 'Change Password'. Follow the instructions sent to your email." },
    { question: t('q2'), answer: "Yes, we offer a 14-day free trial for all new users to explore our premium features." },
    { question: t('q3'), answer: "Absolutely! You can upgrade or downgrade your subscription plan at any time from the billing settings." },
    { question: t('q4'), answer: "Yes, we use industry-standard encryption to ensure your data is always safe and secure." },
    { question: t('q5'), answer: "We provide 24/7 customer support via email and live chat to assist you with any issues." },
  ];

  return (
    <div className="max-w-3xl mx-auto py-8 px-4">
      <div className="text-center mb-10">
        <h2 className="text-3xl font-bold text-slate-900 mb-2">{t('faq_title')}</h2>
        <p className="text-slate-500">{t('faq_subtitle')}</p>
      </div>
      <div className="space-y-4">
        {faqs.map((faq, idx) => (
          <div key={idx} className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden transition-all duration-200">
            <button onClick={() => setOpenIndex(openIndex === idx ? null : idx)} className="w-full p-5 flex items-center justify-between text-left hover:bg-slate-50 transition-colors">
              <div className="flex items-center gap-4">
                <div className="w-8 h-8 rounded-full bg-orange-500 text-white flex items-center justify-center font-bold text-sm flex-shrink-0">{idx + 1}</div>
                <span className="font-semibold text-slate-800 text-lg">{faq.question}</span>
              </div>
              {openIndex === idx ? <ChevronUp className="text-slate-400"/> : <ChevronDown className="text-slate-400"/>}
            </button>
            {openIndex === idx && <div className="px-5 pb-5 pl-[4.5rem] text-slate-600 leading-relaxed animate-in slide-in-from-top-2">{faq.answer}</div>}
          </div>
        ))}
      </div>
    </div>
  );
}

export function SupportView({ user, appId, lang }: ViewProps) {
  const t = (key: string) => TRANSLATIONS[lang][key] || key;
  const [view, setView] = useState('list');
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [newTicket, setNewTicket] = useState({ category: '', priority: '', subject: '', message: '' });

  useEffect(() => {
    if (!user || !appId) return;
    const q = collection(db, 'artifacts', appId, 'public', 'data', 'tickets');
    const unsub = onSnapshot(q, snap => {
      const allDocs = snap.docs.map(d => ({id: d.id, ...d.data()} as Ticket));
      allDocs.sort((a, b) => (b.date?.seconds || 0) - (a.date?.seconds || 0));
      setTickets(allDocs);
    });
    return () => unsub();
  }, [user, appId]);

  const handleSubmit = async () => {
    if (!newTicket.category || !newTicket.subject || !newTicket.message) {
      alert("Please fill in required fields");
      return;
    }
    if (!appId) return;
    await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'tickets'), {
      ...newTicket,
      status: 'Open',
      date: serverTimestamp(),
      ticketId: `TKT-${Math.floor(Math.random() * 100000)}`
    });
    setNewTicket({ category: '', priority: '', subject: '', message: '' });
    setView('list');
    alert("Ticket Submitted Successfully!");
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="bg-purple-800 rounded-xl p-6 text-white flex justify-between items-center shadow-lg">
        <div><h2 className="text-2xl font-bold mb-1">{t('ticket_list')}</h2><p className="text-purple-200 text-sm">{t('hotline')}: +8801901634903</p></div>
        {view === 'list' && <button onClick={() => setView('create')} className="bg-white text-orange-500 px-6 py-2.5 rounded-lg font-bold hover:bg-purple-50 transition-colors shadow-sm">+ {t('create_ticket')}</button>}
        {view === 'create' && <button onClick={() => setView('list')} className="bg-white/20 text-white px-6 py-2.5 rounded-lg font-bold hover:bg-white/30 transition-colors">Back to List</button>}
      </div>

      {view === 'list' ? (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 border-b"><tr><th className="p-4">{t('ticket_id')}</th><th className="p-4">{t('date')}</th><th className="p-4">{t('subject')}</th><th className="p-4">{t('priority')}</th><th className="p-4">{t('status')}</th></tr></thead>
              <tbody>
                {tickets.length === 0 ? (
                  <tr><td colSpan={5} className="p-8 text-center text-slate-400">No tickets found. Create one to get support.</td></tr>
                ) : (
                  tickets.map(ticket => (
                    <tr key={ticket.id} className="border-b last:border-0 hover:bg-slate-50 transition-colors">
                      <td className="p-4 font-mono font-medium text-purple-700">{ticket.ticketId}</td>
                      <td className="p-4 text-slate-500">{ticket.date?.toDate ? ticket.date.toDate().toLocaleDateString() : 'Just now'}</td>
                      <td className="p-4 font-medium">{ticket.subject}</td>
                      <td className="p-4"><span className={`px-2 py-1 rounded text-xs font-bold ${ticket.priority === 'High' ? 'bg-red-100 text-red-700' : ticket.priority === 'Medium' ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'}`}>{ticket.priority || 'Normal'}</span></td>
                      <td className="p-4"><span className={`px-2 py-1 rounded text-xs font-bold ${ticket.status==='Closed'?'bg-slate-200 text-slate-600':'bg-emerald-100 text-emerald-700'}`}>{ticket.status}</span></td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
      ) : (
        <div className="max-w-2xl mx-auto">
          <Card className="p-8 border-t-4 border-t-purple-600 shadow-lg">
            <div className="space-y-5">
              <div><label className="block text-sm font-bold text-slate-700 mb-1">{t('category')}</label><select className="w-full p-3 border rounded-lg bg-slate-50" value={newTicket.category} onChange={e => setNewTicket({...newTicket, category: e.target.value})}><option value="">Select</option><option value="Technical Issue">Technical Issue</option><option value="Billing">Billing</option><option value="Feature Request">Feature Request</option></select></div>
              <div><label className="block text-sm font-bold text-slate-700 mb-1">{t('priority')}</label><select className="w-full p-3 border rounded-lg bg-slate-50" value={newTicket.priority} onChange={e => setNewTicket({...newTicket, priority: e.target.value})}><option value="">Select</option><option value="Low">Low</option><option value="Medium">Medium</option><option value="High">High</option></select></div>
              <div><label className="block text-sm font-bold text-slate-700 mb-1">{t('subject')}</label><input className="w-full p-3 border rounded-lg" placeholder="Type subject" value={newTicket.subject} onChange={e => setNewTicket({...newTicket, subject: e.target.value})}/></div>
              <div><label className="block text-sm font-bold text-slate-700 mb-1">{t('message')}</label><textarea className="w-full p-3 border rounded-lg h-32 resize-none" placeholder="Type your message" value={newTicket.message} onChange={e => setNewTicket({...newTicket, message: e.target.value})}></textarea></div>
              <div className="flex justify-end pt-4"><button onClick={handleSubmit} className="bg-purple-600 text-white px-8 py-3 rounded-lg font-bold hover:bg-purple-700 shadow-lg shadow-purple-200">{t('submit_btn')}</button></div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}

export function CommunityView({ lang }: ViewProps) {
  const t = (key: string) => TRANSLATIONS[lang][key] || key;
  const [copiedLink, setCopiedLink] = useState<string | null>(null);

  const communities = [
    { name: 'Facebook', url: '', color: 'text-blue-600', bg: 'bg-blue-100', icon: 'FB' },
    { name: 'Youtube', url: '', color: 'text-red-600', bg: 'bg-red-100', icon: 'YT' },
    { name: 'Instagram', url: '', color: 'text-pink-600', bg: 'bg-pink-100', icon: 'IG' },
    { name: 'Linkedin', url: '', color: 'text-blue-700', bg: 'bg-blue-100', icon: 'LI' }
  ];

  const handleCopy = (url: string, name: string) => {
    navigator.clipboard.writeText(url).then(() => {
        setCopiedLink(name);
        setTimeout(() => setCopiedLink(null), 2000);
    });
  };

  return (
    <div className="max-w-7xl mx-auto py-6">
      <h2 className="text-2xl font-bold mb-6 text-slate-900">{t('join_community')}</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {communities.map((social) => (
          <div key={social.name} className="bg-white rounded-xl p-6 shadow-sm border border-slate-100 flex items-start gap-4 transition-all hover:shadow-md">
            <div className={`p-4 rounded-full bg-slate-100 font-bold ${social.color}`}>{social.icon}</div>
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-lg text-slate-900 mb-1">{social.name}</h3>
              <p className="text-slate-500 text-sm mb-2">Join Our {social.name} Community <Copy size={12} className="inline ml-1 cursor-pointer hover:text-blue-500" onClick={() => handleCopy(social.url, social.name)}/></p>
              <div className="flex items-center gap-2 bg-slate-50 p-2 rounded border border-slate-200">
                 {copiedLink === social.name ? <Check size={14} className="text-emerald-500"/> : <ExternalLink size={14} className="text-slate-400"/>}
                 <a href={social.url} target="_blank" rel="noopener noreferrer" className="text-xs text-slate-600 hover:text-blue-600 truncate flex-1 hover:underline font-mono">{social.url || 'No link added'}</a>
                 <button onClick={() => handleCopy(social.url, social.name)} className={`text-xs px-2 py-1 rounded font-bold transition-colors ${copiedLink === social.name ? 'bg-emerald-100 text-emerald-700' : 'bg-white border text-slate-600 hover:bg-slate-100'}`}>{copiedLink === social.name ? t('copied') : t('copy_link')}</button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
