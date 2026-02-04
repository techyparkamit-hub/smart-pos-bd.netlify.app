import React from 'react';
import { X, LucideIcon } from 'lucide-react';

interface CardProps {
  children?: React.ReactNode;
  className?: string;
}

export const Card = ({ children, className = "" }: CardProps) => (
  <div className={`bg-white rounded-xl shadow-sm border border-slate-200 ${className}`}>
    {children}
  </div>
);

interface ButtonProps {
  children?: React.ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'secondary' | 'danger' | 'success' | 'outline';
  className?: string;
  disabled?: boolean;
  icon?: LucideIcon | null;
}

export const Button = ({ children, onClick, variant = 'primary', className = "", disabled = false, icon: Icon = null }: ButtonProps) => {
  const baseStyle = "px-4 py-2.5 rounded-lg font-medium transition-all flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50 disabled:active:scale-100";
  const variants = {
    primary: "bg-blue-600 text-white hover:bg-blue-700 shadow-sm",
    secondary: "bg-slate-100 text-slate-700 hover:bg-slate-200",
    danger: "bg-red-50 text-red-600 hover:bg-red-100",
    success: "bg-emerald-600 text-white hover:bg-emerald-700",
    outline: "border border-slate-300 text-slate-600 hover:bg-slate-50"
  };
  return (
    <button onClick={onClick} disabled={disabled} className={`${baseStyle} ${variants[variant]} ${className}`}>
      {Icon && <Icon size={18} />}
      {children}
    </button>
  );
};

interface ModalProps {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  size?: 'md' | 'lg';
}

export const Modal = ({ title, onClose, children, size = 'md' }: ModalProps) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-in fade-in duration-200">
    <Card className={`w-full ${size === 'lg' ? 'max-w-4xl' : 'max-w-lg'} max-h-[90vh] overflow-hidden flex flex-col bg-white`}>
       <div className="p-4 border-b flex justify-between items-center bg-slate-50">
         <h3 className="font-bold text-lg text-slate-800">{title}</h3>
         <button onClick={onClose} className="p-1 hover:bg-slate-200 rounded-full transition-colors"><X className="text-slate-500" size={20}/></button>
       </div>
       <div className="overflow-y-auto p-4 flex-1">
         {children}
       </div>
    </Card>
  </div>
);