import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, 
  Users, 
  ArrowUpCircle, 
  ArrowDownCircle, 
  Plus, 
  ChevronLeft, 
  ChevronRight,
  CheckCircle2,
  Clock,
  MoreVertical,
  Trash2,
  Copy,
  Edit2,
  Filter,
  Download,
  Search,
  TrendingUp,
  TrendingDown,
  DollarSign
} from 'lucide-react';
import { format, addMonths, subMonths, startOfMonth, endOfMonth, isSameMonth, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Cell,
  PieChart,
  Pie
} from 'recharts';
import { motion, AnimatePresence } from 'motion/react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { Client, Transaction, ServiceType, ExpenseCategory, RecurrenceType } from './types';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// --- Components ---

const Card = ({ children, className, title, action }: { children: React.ReactNode, className?: string, title?: string, action?: React.ReactNode }) => (
  <div className={cn("glass-card p-6", className)}>
    {(title || action) && (
      <div className="flex items-center justify-between mb-6">
        {title && <h3 className="text-lg font-semibold text-slate-800">{title}</h3>}
        {action}
      </div>
    )}
    {children}
  </div>
);

const StatCard = ({ title, value, icon: Icon, color, trend }: { title: string, value: string, icon: any, color: string, trend?: string }) => (
  <div className="glass-card p-6 flex items-start justify-between">
    <div>
      <p className="text-sm font-medium text-slate-500 mb-1">{title}</p>
      <h3 className="text-2xl font-bold text-slate-900">{value}</h3>
      {trend && (
        <p className={cn("text-xs mt-2 flex items-center gap-1", trend.startsWith('+') ? "text-emerald-600" : "text-rose-600")}>
          {trend.startsWith('+') ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
          {trend} em relação ao mês anterior
        </p>
      )}
    </div>
    <div className={cn("p-3 rounded-xl", color)}>
      <Icon size={24} className="text-white" />
    </div>
  </div>
);

// --- Main App ---

export default function App() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'clients' | 'revenues' | 'expenses'>('dashboard');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [clients, setClients] = useState<Client[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Modals
  const [isClientModalOpen, setIsClientModalOpen] = useState(false);
  const [isTransactionModalOpen, setIsTransactionModalOpen] = useState<{ isOpen: boolean, type: 'revenue' | 'expense' }>({ isOpen: false, type: 'revenue' });

  useEffect(() => {
    fetchData();
  }, [currentDate]);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const month = currentDate.getMonth() + 1;
      const year = currentDate.getFullYear();
      
      const [clientsRes, transRes] = await Promise.all([
        fetch('/api/clients'),
        fetch(`/api/transactions?month=${month}&year=${year}`)
      ]);
      
      const clientsData = await clientsRes.json();
      const transData = await transRes.json();
      
      setClients(clientsData);
      setTransactions(transData);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePrevMonth = () => setCurrentDate(subMonths(currentDate, 1));
  const handleNextMonth = () => setCurrentDate(addMonths(currentDate, 1));

  const totalRevenue = transactions
    .filter(t => t.type === 'revenue' && t.status === 'paid')
    .reduce((acc, t) => acc + t.amount, 0);
    
  const totalExpenses = transactions
    .filter(t => t.type === 'expense' && t.status === 'paid')
    .reduce((acc, t) => acc + t.amount, 0);

  const pendingRevenue = transactions
    .filter(t => t.type === 'revenue' && t.status === 'pending')
    .reduce((acc, t) => acc + t.amount, 0);

  const pendingExpenses = transactions
    .filter(t => t.type === 'expense' && t.status === 'pending')
    .reduce((acc, t) => acc + t.amount, 0);

  const netProfit = totalRevenue - totalExpenses;

  const formatCurrency = (value: number) => 
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

  const toggleStatus = async (id: number, currentStatus: string) => {
    const newStatus = currentStatus === 'paid' ? 'pending' : 'paid';
    await fetch(`/api/transactions/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus })
    });
    fetchData();
  };

  const deleteTransaction = async (id: number) => {
    if (!confirm("Tem certeza que deseja excluir este lançamento?")) return;
    await fetch(`/api/transactions/${id}`, { method: 'DELETE' });
    fetchData();
  };

  const duplicateTransaction = async (id: number) => {
    await fetch(`/api/transactions/${id}/duplicate`, { method: 'POST' });
    fetchData();
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      {/* Sidebar */}
      <aside className="w-full md:w-64 bg-white border-r border-slate-200 p-6 flex flex-col gap-8">
        <div className="flex items-center gap-3 px-2">
          <div className="bg-indigo-600 p-2 rounded-lg">
            <DollarSign className="text-white" size={20} />
          </div>
          <h1 className="font-bold text-xl tracking-tight text-slate-900">FinHost</h1>
        </div>

        <nav className="flex flex-col gap-1">
          <button 
            onClick={() => setActiveTab('dashboard')}
            className={cn(
              "flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium",
              activeTab === 'dashboard' ? "bg-indigo-50 text-indigo-600" : "text-slate-500 hover:bg-slate-50"
            )}
          >
            <LayoutDashboard size={20} />
            Dashboard
          </button>
          <button 
            onClick={() => setActiveTab('clients')}
            className={cn(
              "flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium",
              activeTab === 'clients' ? "bg-indigo-50 text-indigo-600" : "text-slate-500 hover:bg-slate-50"
            )}
          >
            <Users size={20} />
            Clientes
          </button>
          <button 
            onClick={() => setActiveTab('revenues')}
            className={cn(
              "flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium",
              activeTab === 'revenues' ? "bg-indigo-50 text-indigo-600" : "text-slate-500 hover:bg-slate-50"
            )}
          >
            <ArrowUpCircle size={20} />
            Receitas
          </button>
          <button 
            onClick={() => setActiveTab('expenses')}
            className={cn(
              "flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium",
              activeTab === 'expenses' ? "bg-indigo-50 text-indigo-600" : "text-slate-500 hover:bg-slate-50"
            )}
          >
            <ArrowDownCircle size={20} />
            Despesas
          </button>
        </nav>

        <div className="mt-auto">
          <div className="bg-slate-900 rounded-2xl p-4 text-white">
            <p className="text-xs text-slate-400 mb-1">Logado como</p>
            <p className="text-sm font-medium truncate">amigodosite@gmail.com</p>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-6 md:p-10 overflow-y-auto max-w-7xl mx-auto w-full">
        {/* Header */}
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-10">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">
              {activeTab === 'dashboard' && 'Visão Geral'}
              {activeTab === 'clients' && 'Gestão de Clientes'}
              {activeTab === 'revenues' && 'Recebimentos'}
              {activeTab === 'expenses' && 'Pagamentos'}
            </h2>
            <p className="text-slate-500 text-sm mt-1">
              Gerencie as finanças da sua empresa de forma simples.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center bg-white border border-slate-200 rounded-xl p-1">
              <button onClick={handlePrevMonth} className="p-2 hover:bg-slate-50 rounded-lg transition-colors">
                <ChevronLeft size={18} />
              </button>
              <span className="px-4 font-semibold text-sm min-w-[140px] text-center capitalize">
                {format(currentDate, 'MMMM yyyy', { locale: ptBR })}
              </span>
              <button onClick={handleNextMonth} className="p-2 hover:bg-slate-50 rounded-lg transition-colors">
                <ChevronRight size={18} />
              </button>
            </div>
            
            {activeTab === 'clients' && (
              <button onClick={() => setIsClientModalOpen(true)} className="btn-primary">
                <Plus size={18} /> Novo Cliente
              </button>
            )}
            {activeTab === 'revenues' && (
              <button onClick={() => setIsTransactionModalOpen({ isOpen: true, type: 'revenue' })} className="btn-primary">
                <Plus size={18} /> Nova Receita
              </button>
            )}
            {activeTab === 'expenses' && (
              <button onClick={() => setIsTransactionModalOpen({ isOpen: true, type: 'expense' })} className="btn-primary bg-rose-600 hover:bg-rose-700">
                <Plus size={18} /> Nova Despesa
              </button>
            )}
          </div>
        </header>

        {/* Tab Content */}
        <AnimatePresence mode="wait">
          {activeTab === 'dashboard' && (
            <motion.div 
              key="dashboard"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-8"
            >
              {/* Stats Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <StatCard 
                  title="Recebido no Mês" 
                  value={formatCurrency(totalRevenue)} 
                  icon={ArrowUpCircle} 
                  color="bg-emerald-500"
                />
                <StatCard 
                  title="Despesas Pagas" 
                  value={formatCurrency(totalExpenses)} 
                  icon={ArrowDownCircle} 
                  color="bg-rose-500"
                />
                <StatCard 
                  title="Lucro Líquido" 
                  value={formatCurrency(netProfit)} 
                  icon={DollarSign} 
                  color="bg-indigo-500"
                />
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Chart Card */}
                <Card title="Fluxo de Caixa Mensal">
                  <div className="h-80 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={[
                        { name: 'Receitas', value: totalRevenue, pending: pendingRevenue, color: '#10b981' },
                        { name: 'Despesas', value: totalExpenses, pending: pendingExpenses, color: '#f43f5e' }
                      ]}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                        <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} tickFormatter={(val) => `R$ ${val}`} />
                        <Tooltip 
                          cursor={{ fill: '#f1f5f9' }}
                          contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                        />
                        <Bar dataKey="value" radius={[6, 6, 0, 0]} barSize={40}>
                          { [0, 1].map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={index === 0 ? '#10b981' : '#f43f5e'} />
                          ))}
                        </Bar>
                        <Bar dataKey="pending" radius={[6, 6, 0, 0]} barSize={40} opacity={0.3}>
                          { [0, 1].map((entry, index) => (
                            <Cell key={`cell-pending-${index}`} fill={index === 0 ? '#10b981' : '#f43f5e'} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="flex justify-center gap-6 mt-4 text-xs font-medium text-slate-500">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-emerald-500"></div> Confirmado
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-emerald-500 opacity-30"></div> Pendente
                    </div>
                  </div>
                </Card>

                {/* Pending List */}
                <Card title="Pagamentos Pendentes" action={<button className="text-xs text-indigo-600 font-semibold hover:underline">Ver todos</button>}>
                  <div className="space-y-4">
                    {transactions.filter(t => t.status === 'pending').length === 0 ? (
                      <div className="text-center py-10 text-slate-400">
                        <CheckCircle2 size={40} className="mx-auto mb-3 opacity-20" />
                        <p>Tudo em dia por aqui!</p>
                      </div>
                    ) : (
                      transactions.filter(t => t.status === 'pending').slice(0, 5).map(t => (
                        <div key={t.id} className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-100">
                          <div className="flex items-center gap-3">
                            <div className={cn("p-2 rounded-lg", t.type === 'revenue' ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600")}>
                              {t.type === 'revenue' ? <ArrowUpCircle size={18} /> : <ArrowDownCircle size={18} />}
                            </div>
                            <div>
                              <p className="text-sm font-semibold text-slate-800">{t.description}</p>
                              <p className="text-xs text-slate-500">{t.client_name || t.category} • Vence em {format(parseISO(t.due_date), 'dd/MM')}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-bold text-slate-900">{formatCurrency(t.amount)}</p>
                            <button 
                              onClick={() => toggleStatus(t.id, t.status)}
                              className="text-[10px] uppercase tracking-wider font-bold text-indigo-600 hover:text-indigo-700 mt-1"
                            >
                              Marcar como pago
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </Card>
              </div>
            </motion.div>
          )}

          {activeTab === 'clients' && (
            <motion.div 
              key="clients"
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
            >
              <Card>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-bottom border-slate-100">
                        <th className="pb-4 font-semibold text-slate-500 text-sm">Cliente</th>
                        <th className="pb-4 font-semibold text-slate-500 text-sm">Serviço</th>
                        <th className="pb-4 font-semibold text-slate-500 text-sm">Data Cadastro</th>
                        <th className="pb-4 font-semibold text-slate-500 text-sm text-right">Ações</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {clients.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="py-10 text-center text-slate-400">Nenhum cliente cadastrado.</td>
                        </tr>
                      ) : (
                        clients.map(client => (
                          <tr key={client.id} className="group hover:bg-slate-50/50 transition-colors">
                            <td className="py-4">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-sm">
                                  {client.name.charAt(0).toUpperCase()}
                                </div>
                                <div>
                                  <p className="font-semibold text-slate-900">{client.name}</p>
                                  {client.observations && <p className="text-xs text-slate-500 truncate max-w-[200px]">{client.observations}</p>}
                                </div>
                              </div>
                            </td>
                            <td className="py-4">
                              <span className="px-3 py-1 bg-slate-100 text-slate-600 rounded-full text-xs font-medium">
                                {client.service_type === 'Outro' ? client.custom_service : client.service_type}
                              </span>
                            </td>
                            <td className="py-4 text-sm text-slate-500">
                              {format(parseISO(client.created_at), 'dd/MM/yyyy')}
                            </td>
                            <td className="py-4 text-right">
                              <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button className="p-2 hover:bg-white rounded-lg border border-transparent hover:border-slate-200 text-slate-400 hover:text-indigo-600">
                                  <Edit2 size={16} />
                                </button>
                                <button 
                                  onClick={async () => {
                                    if(confirm("Excluir cliente?")) {
                                      await fetch(`/api/clients/${client.id}`, { method: 'DELETE' });
                                      fetchData();
                                    }
                                  }}
                                  className="p-2 hover:bg-white rounded-lg border border-transparent hover:border-slate-200 text-slate-400 hover:text-rose-600"
                                >
                                  <Trash2 size={16} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </Card>
            </motion.div>
          )}

          {(activeTab === 'revenues' || activeTab === 'expenses') && (
            <motion.div 
              key={activeTab}
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
            >
              <Card>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-bottom border-slate-100">
                        <th className="pb-4 font-semibold text-slate-500 text-sm">Descrição</th>
                        <th className="pb-4 font-semibold text-slate-500 text-sm">{activeTab === 'revenues' ? 'Cliente' : 'Categoria'}</th>
                        <th className="pb-4 font-semibold text-slate-500 text-sm">Vencimento</th>
                        <th className="pb-4 font-semibold text-slate-500 text-sm">Valor</th>
                        <th className="pb-4 font-semibold text-slate-500 text-sm">Status</th>
                        <th className="pb-4 font-semibold text-slate-500 text-sm text-right">Ações</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {transactions.filter(t => t.type === (activeTab === 'revenues' ? 'revenue' : 'expense')).length === 0 ? (
                        <tr>
                          <td colSpan={6} className="py-10 text-center text-slate-400">Nenhum lançamento encontrado para este mês.</td>
                        </tr>
                      ) : (
                        transactions
                          .filter(t => t.type === (activeTab === 'revenues' ? 'revenue' : 'expense'))
                          .map(t => (
                            <tr key={t.id} className="group hover:bg-slate-50/50 transition-colors">
                              <td className="py-4">
                                <div className="flex items-center gap-3">
                                  <div className={cn(
                                    "p-2 rounded-lg", 
                                    t.status === 'paid' ? "bg-emerald-50 text-emerald-600" : "bg-slate-100 text-slate-400"
                                  )}>
                                    {t.status === 'paid' ? <CheckCircle2 size={18} /> : <Clock size={18} />}
                                  </div>
                                  <div>
                                    <p className="font-semibold text-slate-900">{t.description}</p>
                                    {t.recurrence !== 'single' && (
                                      <p className="text-[10px] uppercase font-bold text-indigo-500 tracking-wider">Recorrência {t.recurrence === 'monthly' ? 'Mensal' : 'Anual'}</p>
                                    )}
                                  </div>
                                </div>
                              </td>
                              <td className="py-4 text-sm text-slate-600">
                                {activeTab === 'revenues' ? t.client_name : t.category}
                              </td>
                              <td className="py-4 text-sm text-slate-500">
                                {format(parseISO(t.due_date), 'dd/MM/yyyy')}
                              </td>
                              <td className="py-4">
                                <p className={cn("font-bold", activeTab === 'revenues' ? "text-emerald-600" : "text-rose-600")}>
                                  {formatCurrency(t.amount)}
                                </p>
                              </td>
                              <td className="py-4">
                                <button 
                                  onClick={() => toggleStatus(t.id, t.status)}
                                  className={cn(
                                    "px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all",
                                    t.status === 'paid' 
                                      ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-200" 
                                      : "bg-amber-100 text-amber-700 hover:bg-amber-200"
                                  )}
                                >
                                  {t.status === 'paid' ? 'Pago' : 'Pendente'}
                                </button>
                              </td>
                              <td className="py-4 text-right">
                                <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                  <button onClick={() => duplicateTransaction(t.id)} title="Duplicar" className="p-2 hover:bg-white rounded-lg border border-transparent hover:border-slate-200 text-slate-400 hover:text-indigo-600">
                                    <Copy size={16} />
                                  </button>
                                  <button onClick={() => deleteTransaction(t.id)} title="Excluir" className="p-2 hover:bg-white rounded-lg border border-transparent hover:border-slate-200 text-slate-400 hover:text-rose-600">
                                    <Trash2 size={16} />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))
                      )}
                    </tbody>
                  </table>
                </div>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Modals */}
      <ClientModal 
        isOpen={isClientModalOpen} 
        onClose={() => setIsClientModalOpen(false)} 
        onSuccess={fetchData} 
      />
      <TransactionModal 
        isOpen={isTransactionModalOpen.isOpen} 
        type={isTransactionModalOpen.type}
        clients={clients}
        onClose={() => setIsTransactionModalOpen({ ...isTransactionModalOpen, isOpen: false })} 
        onSuccess={fetchData} 
      />
    </div>
  );
}

// --- Modals ---

function ClientModal({ isOpen, onClose, onSuccess }: { isOpen: boolean, onClose: () => void, onSuccess: () => void }) {
  const [formData, setFormData] = useState({
    name: '',
    service_type: 'Hospedagem' as ServiceType,
    custom_service: '',
    observations: ''
  });

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await fetch('/api/clients', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData)
    });
    onSuccess();
    onClose();
    setFormData({ name: '', service_type: 'Hospedagem', custom_service: '', observations: '' });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
      <motion.div 
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"
      >
        <div className="p-6 border-b border-slate-100 flex justify-between items-center">
          <h3 className="text-xl font-bold text-slate-900">Novo Cliente</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">×</button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Nome do Cliente</label>
            <input 
              required
              className="input-field"
              value={formData.name}
              onChange={e => setFormData({ ...formData, name: e.target.value })}
              placeholder="Ex: João Silva"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Tipo de Serviço</label>
            <select 
              className="input-field"
              value={formData.service_type}
              onChange={e => setFormData({ ...formData, service_type: e.target.value as ServiceType })}
            >
              <option value="Hospedagem">Hospedagem</option>
              <option value="Streaming">Streaming</option>
              <option value="Hospedagem + Streaming">Hospedagem + Streaming</option>
              <option value="Outro">Outro</option>
            </select>
          </div>
          {formData.service_type === 'Outro' && (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Especifique o Serviço</label>
              <input 
                className="input-field"
                value={formData.custom_service}
                onChange={e => setFormData({ ...formData, custom_service: e.target.value })}
                placeholder="Ex: Consultoria SEO"
              />
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Observações (Opcional)</label>
            <textarea 
              className="input-field h-24 resize-none"
              value={formData.observations}
              onChange={e => setFormData({ ...formData, observations: e.target.value })}
            />
          </div>
          <div className="flex gap-3 pt-4">
            <button type="button" onClick={onClose} className="btn-secondary flex-1 justify-center">Cancelar</button>
            <button type="submit" className="btn-primary flex-1 justify-center">Salvar Cliente</button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

function TransactionModal({ isOpen, type, clients, onClose, onSuccess }: { isOpen: boolean, type: 'revenue' | 'expense', clients: Client[], onClose: () => void, onSuccess: () => void }) {
  const [formData, setFormData] = useState({
    description: '',
    amount: '',
    due_date: format(new Date(), 'yyyy-MM-dd'),
    client_id: '',
    category: 'Servidor' as ExpenseCategory,
    recurrence: 'single' as RecurrenceType,
    status: 'pending' as 'pending' | 'paid'
  });

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await fetch('/api/transactions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...formData,
        type,
        amount: parseFloat(formData.amount),
        client_id: type === 'revenue' ? parseInt(formData.client_id) : null
      })
    });
    onSuccess();
    onClose();
    setFormData({
      description: '',
      amount: '',
      due_date: format(new Date(), 'yyyy-MM-dd'),
      client_id: '',
      category: 'Servidor',
      recurrence: 'single',
      status: 'pending'
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
      <motion.div 
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"
      >
        <div className="p-6 border-b border-slate-100 flex justify-between items-center">
          <h3 className="text-xl font-bold text-slate-900">Nova {type === 'revenue' ? 'Receita' : 'Despesa'}</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">×</button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Descrição</label>
            <input 
              required
              className="input-field"
              value={formData.description}
              onChange={e => setFormData({ ...formData, description: e.target.value })}
              placeholder="Ex: Mensalidade Hospedagem"
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Valor (R$)</label>
              <input 
                required
                type="number"
                step="0.01"
                className="input-field"
                value={formData.amount}
                onChange={e => setFormData({ ...formData, amount: e.target.value })}
                placeholder="0,00"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Data Vencimento</label>
              <input 
                required
                type="date"
                className="input-field"
                value={formData.due_date}
                onChange={e => setFormData({ ...formData, due_date: e.target.value })}
              />
            </div>
          </div>

          {type === 'revenue' ? (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Cliente</label>
              <select 
                required
                className="input-field"
                value={formData.client_id}
                onChange={e => setFormData({ ...formData, client_id: e.target.value })}
              >
                <option value="">Selecione um cliente</option>
                {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
          ) : (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Categoria</label>
              <select 
                className="input-field"
                value={formData.category}
                onChange={e => setFormData({ ...formData, category: e.target.value as ExpenseCategory })}
              >
                <option value="Servidor">Servidor</option>
                <option value="Domínio">Domínio</option>
                <option value="Marketing">Marketing</option>
                <option value="Ferramentas">Ferramentas</option>
                <option value="Outros">Outros</option>
              </select>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Recorrência</label>
              <select 
                className="input-field"
                value={formData.recurrence}
                onChange={e => setFormData({ ...formData, recurrence: e.target.value as RecurrenceType })}
              >
                <option value="single">Única</option>
                <option value="monthly">Mensal</option>
                <option value="yearly">Anual</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Status Inicial</label>
              <select 
                className="input-field"
                value={formData.status}
                onChange={e => setFormData({ ...formData, status: e.target.value as 'pending' | 'paid' })}
              >
                <option value="pending">Pendente</option>
                <option value="paid">Pago</option>
              </select>
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <button type="button" onClick={onClose} className="btn-secondary flex-1 justify-center">Cancelar</button>
            <button type="submit" className={cn("btn-primary flex-1 justify-center", type === 'expense' && "bg-rose-600 hover:bg-rose-700")}>
              Salvar Lançamento
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
