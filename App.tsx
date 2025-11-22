
import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { HashRouter, Routes, Route, Navigate, useLocation, Link } from 'react-router-dom';
import { 
  Building2, Users, Calendar, DollarSign, Wrench, 
  LogOut, Menu, X, Plus, Search, Bell, Home, ChevronDown, User, ShieldCheck, Mail, Lock, ArrowLeft, CheckCircle, Loader2, FileText, TrendingUp, TrendingDown, Phone
} from 'lucide-react';
import { 
  MOCK_CONDOS, MOCK_RESIDENTS, MOCK_PROVIDERS, MOCK_MEETINGS, MOCK_NOTICES, MOCK_TRANSACTIONS 
} from './services/mockData';
import { 
  Condominium, Resident, Provider, Meeting, Notice, Transaction, ResidentType, NoticeCategory, TransactionType, UserRole 
} from './types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { draftNoticeContent } from './services/geminiService';

// --- Utils ---
// Simple Toast/Notification System
interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
}

// --- Context ---
interface AppState {
  // Data
  condos: Condominium[];
  residents: Resident[];
  providers: Provider[];
  meetings: Meeting[];
  notices: Notice[];
  transactions: Transaction[];
  
  // State
  currentCondoId: string;
  userRole: UserRole | null;
  currentResidentId: string | null; // If role is MORADOR
  
  // UI
  addToast: (message: string, type?: 'success' | 'error' | 'info') => void;

  // Actions
  setCurrentCondoId: (id: string) => void;
  login: (role: UserRole, residentId?: string) => void;
  logout: () => void;
  
  // Data Setters
  addResident: (r: Resident) => void;
  updateResident: (id: string, data: Partial<Resident>) => void;
  addProvider: (p: Provider) => void;
  addMeeting: (m: Meeting) => void;
  addNotice: (n: Notice) => void;
  addTransaction: (t: Transaction) => void;
  addCondo: (c: Condominium) => void;
}

const AppContext = createContext<AppState | undefined>(undefined);

const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [condos, setCondos] = useState(MOCK_CONDOS);
  const [currentCondoId, setCurrentCondoId] = useState(MOCK_CONDOS[0].id);
  const [residents, setResidents] = useState(MOCK_RESIDENTS);
  const [providers, setProviders] = useState(MOCK_PROVIDERS);
  const [meetings, setMeetings] = useState(MOCK_MEETINGS);
  const [notices, setNotices] = useState(MOCK_NOTICES);
  const [transactions, setTransactions] = useState(MOCK_TRANSACTIONS);
  const [toasts, setToasts] = useState<Toast[]>([]);

  // Auth State
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [currentResidentId, setCurrentResidentId] = useState<string | null>(null);

  const login = (role: UserRole, residentId?: string) => {
    setUserRole(role);
    if (role === UserRole.MORADOR && residentId) {
      setCurrentResidentId(residentId);
      const resident = residents.find(r => r.id === residentId);
      if (resident) setCurrentCondoId(resident.condoId);
    } else if (role === UserRole.SINDICO) {
        // If logging in as manager, default to first condo if not set
        if(!currentCondoId && condos.length > 0) setCurrentCondoId(condos[0].id);
    }
  };

  const logout = () => {
    setUserRole(null);
    setCurrentResidentId(null);
  };

  const addToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    const id = Date.now().toString();
    setToasts([...toasts, { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 5000);
  };

  const addResident = (r: Resident) => setResidents([...residents, r]);
  
  const updateResident = (id: string, data: Partial<Resident>) => {
    setResidents(residents.map(r => r.id === id ? { ...r, ...data } : r));
  };

  const addProvider = (p: Provider) => setProviders([...providers, p]);
  const addMeeting = (m: Meeting) => setMeetings([...meetings, m]);
  const addNotice = (n: Notice) => setNotices([n, ...notices]);
  const addTransaction = (t: Transaction) => setTransactions([t, ...transactions]);
  const addCondo = (c: Condominium) => {
    setCondos([...condos, c]);
    setCurrentCondoId(c.id);
  };

  return (
    <AppContext.Provider value={{
      condos, currentCondoId, setCurrentCondoId, residents, providers, meetings, notices, transactions,
      userRole, currentResidentId, login, logout, addToast,
      addResident, updateResident, addProvider, addMeeting, addNotice, addTransaction, addCondo
    }}>
      {children}
      {/* Toast Container */}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
        {toasts.map(t => (
          <div key={t.id} className={`px-4 py-3 rounded-lg shadow-lg text-white text-sm flex items-center animate-fade-in ${
            t.type === 'success' ? 'bg-green-600' : t.type === 'error' ? 'bg-red-600' : 'bg-blue-600'
          }`}>
            {t.message}
          </div>
        ))}
      </div>
    </AppContext.Provider>
  );
};

const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error("useApp must be used within AppProvider");
  return context;
};

// --- Components ---

const LoginPage = () => {
  const { login, addResident, condos, residents, addToast } = useApp();
  const [view, setView] = useState<'login' | 'register_select' | 'register_form' | 'forgot_password'>('login');
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Login State
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPass, setLoginPass] = useState('');

  // Registration State
  const [regData, setRegData] = useState({
    name: '',
    cpf: '',
    phone: '',
    email: '',
    password: '',
    confirmPassword: '',
    condoId: '',
    block: '',
    unit: '',
    type: ResidentType.RESIDENT
  });

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    // Simulation delay
    setTimeout(() => {
      setIsLoading(false);
      
      // Hardcoded Manager Login for Demo
      if (loginEmail === 'sindico@email.com') {
         login(UserRole.SINDICO);
         addToast('Bem-vindo, Síndico!', 'success');
         return;
      }

      // Check Residents
      const resident = residents.find(r => r.email === loginEmail);
      if (resident) {
        // In a real app, check password hash. Here we just match email.
        login(UserRole.MORADOR, resident.id);
        addToast(`Bem-vindo de volta, ${resident.name.split(' ')[0]}!`, 'success');
      } else {
        addToast('Usuário não encontrado ou senha incorreta.', 'error');
      }
    }, 1000);
  };

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (regData.password !== regData.confirmPassword) {
      addToast('As senhas não coincidem.', 'error');
      return;
    }

    setIsLoading(true);
    // Simulate API Call
    setTimeout(() => {
      setIsLoading(false);
      
      if (selectedRole === UserRole.MORADOR) {
        const newResident: Resident = {
          id: Date.now().toString(),
          condoId: regData.condoId,
          name: regData.name,
          cpf: regData.cpf,
          phone: regData.phone,
          email: regData.email,
          block: regData.block,
          unit: regData.unit,
          type: regData.type,
          password: regData.password
        };
        addResident(newResident);
        login(UserRole.MORADOR, newResident.id);
      } else {
        // Sindico registration (mock)
        login(UserRole.SINDICO);
      }
      addToast('Cadastro realizado com sucesso!', 'success');
    }, 1000);
  };

  const handleForgotPassword = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      addToast('Link enviado! (Simulação: Verifique seu email para redefinir)', 'success');
      setView('login');
    }, 1500);
  };

  // --- Views ---

  if (view === 'login') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-600 to-indigo-900 flex items-center justify-center p-4 animate-fade-in">
        <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden">
          <div className="p-8">
            <div className="text-center mb-8">
              <div className="bg-primary text-white w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                <Building2 size={28} />
              </div>
              <h1 className="text-2xl font-bold text-gray-900">SyndicPro</h1>
              <p className="text-gray-500 text-sm mt-1">Acesse sua conta para continuar</p>
            </div>

            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1 ml-1">Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                  <input 
                    type="email" required 
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
                    placeholder="seu@email.com"
                    value={loginEmail} onChange={e => setLoginEmail(e.target.value)}
                  />
                </div>
              </div>
              <div>
                <div className="flex justify-between mb-1 ml-1">
                  <label className="block text-xs font-medium text-gray-700">Senha</label>
                  <button type="button" onClick={() => setView('forgot_password')} className="text-xs text-primary hover:underline">Esqueci a senha</button>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                  <input 
                    type="password" required 
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
                    placeholder="••••••••"
                    value={loginPass} onChange={e => setLoginPass(e.target.value)}
                  />
                </div>
              </div>
              <button 
                type="submit" 
                disabled={isLoading}
                className="w-full bg-primary text-white py-3 rounded-xl font-bold hover:bg-blue-700 transition-colors disabled:opacity-70 flex items-center justify-center gap-2"
              >
                {isLoading ? <Loader2 className="animate-spin" size={20} /> : 'Entrar'}
              </button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600">
                Não tem uma conta?{' '}
                <button onClick={() => setView('register_select')} className="text-primary font-bold hover:underline">
                  Criar cadastro
                </button>
              </p>
              <div className="mt-4 pt-4 border-t border-gray-100">
                <p className="text-xs text-gray-400">Demo: sindico@email.com / ana@email.com</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (view === 'register_select') {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4 animate-fade-in">
        <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full p-8">
          <button onClick={() => setView('login')} className="text-gray-500 hover:text-gray-900 mb-6 flex items-center gap-2 text-sm font-medium">
            <ArrowLeft size={18} /> Voltar para login
          </button>
          
          <h2 className="text-2xl font-bold text-gray-900 text-center mb-2">Criar nova conta</h2>
          <p className="text-gray-500 text-center mb-8">Selecione seu tipo de perfil para começar</p>

          <div className="grid md:grid-cols-2 gap-6">
            <button 
              onClick={() => { setSelectedRole(UserRole.SINDICO); setView('register_form'); }}
              className="group relative p-6 border-2 border-gray-100 rounded-2xl hover:border-primary hover:bg-blue-50 transition-all text-left"
            >
              <div className="bg-indigo-100 text-indigo-600 w-12 h-12 rounded-xl flex items-center justify-center mb-4 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                <ShieldCheck size={24} />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">Sou Síndico</h3>
              <p className="text-sm text-gray-500">Para quem administra um ou mais condomínios e precisa de gestão completa.</p>
            </button>

            <button 
              onClick={() => { setSelectedRole(UserRole.MORADOR); setView('register_form'); }}
              className="group relative p-6 border-2 border-gray-100 rounded-2xl hover:border-green-500 hover:bg-green-50 transition-all text-left"
            >
              <div className="bg-green-100 text-green-600 w-12 h-12 rounded-xl flex items-center justify-center mb-4 group-hover:bg-green-600 group-hover:text-white transition-colors">
                <User size={24} />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">Sou Morador</h3>
              <p className="text-sm text-gray-500">Para proprietários ou inquilinos que desejam acompanhar comunicados e boletos.</p>
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (view === 'register_form') {
    const isSindico = selectedRole === UserRole.SINDICO;
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4 animate-fade-in">
        <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full p-8 my-8">
          <button onClick={() => setView('register_select')} className="text-gray-500 hover:text-gray-900 mb-4 flex items-center gap-2 text-sm">
            <ArrowLeft size={16} /> Voltar
          </button>

          <div className="mb-6">
             <h2 className="text-2xl font-bold text-gray-900">
                Cadastro de {isSindico ? 'Síndico' : 'Morador'}
             </h2>
             <p className="text-sm text-gray-500">Preencha os dados abaixo para criar seu acesso.</p>
          </div>

          <form onSubmit={handleRegister} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Nome Completo</label>
              <input 
                type="text" required className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary outline-none"
                value={regData.name} onChange={e => setRegData({...regData, name: e.target.value})}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">CPF</label>
                <input 
                  type="text" required placeholder="000.000.000-00" className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary outline-none"
                  value={regData.cpf} onChange={e => setRegData({...regData, cpf: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Telefone</label>
                <input 
                  type="text" required placeholder="(00) 00000-0000" className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary outline-none"
                  value={regData.phone} onChange={e => setRegData({...regData, phone: e.target.value})}
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Email</label>
              <input 
                type="email" required className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary outline-none"
                value={regData.email} onChange={e => setRegData({...regData, email: e.target.value})}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Senha</label>
                <input 
                  type="password" required className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary outline-none"
                  value={regData.password} onChange={e => setRegData({...regData, password: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Confirmar Senha</label>
                <input 
                  type="password" required className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary outline-none"
                  value={regData.confirmPassword} onChange={e => setRegData({...regData, confirmPassword: e.target.value})}
                />
              </div>
            </div>

            {!isSindico && (
              <div className="pt-4 mt-4 border-t border-gray-100 space-y-4">
                <h3 className="text-sm font-bold text-gray-900">Dados do Condomínio</h3>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Condomínio</label>
                  <select 
                    required className="w-full border rounded-lg px-3 py-2 bg-white"
                    value={regData.condoId} onChange={e => setRegData({...regData, condoId: e.target.value})}
                  >
                    <option value="">Selecione...</option>
                    {condos.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Bloco</label>
                    <input 
                      type="text" required className="w-full border rounded-lg px-3 py-2"
                      value={regData.block} onChange={e => setRegData({...regData, block: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Unidade</label>
                    <input 
                      type="text" required className="w-full border rounded-lg px-3 py-2"
                      value={regData.unit} onChange={e => setRegData({...regData, unit: e.target.value})}
                    />
                  </div>
                   <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Tipo</label>
                    <select 
                      className="w-full border rounded-lg px-3 py-2 bg-white"
                      value={regData.type} onChange={e => setRegData({...regData, type: e.target.value as ResidentType})}
                    >
                      {Object.values(ResidentType).map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                </div>
              </div>
            )}

            <button 
              type="submit" disabled={isLoading}
              className="w-full bg-primary text-white py-3 rounded-xl font-bold mt-6 hover:bg-blue-700 transition-colors disabled:opacity-70 flex justify-center"
            >
               {isLoading ? <Loader2 className="animate-spin" /> : 'Cadastrar'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  if (view === 'forgot_password') {
     return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4 animate-fade-in">
        <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-8">
          <button onClick={() => setView('login')} className="text-gray-500 hover:text-gray-900 mb-6 flex items-center gap-2 text-sm">
            <ArrowLeft size={18} /> Voltar para login
          </button>
          
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Recuperar Senha</h2>
          <p className="text-gray-500 text-sm mb-6">Digite seu email cadastrado para receber o link de redefinição.</p>

          <form onSubmit={handleForgotPassword} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Email</label>
              <input 
                type="email" required className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary outline-none"
                value={loginEmail} onChange={e => setLoginEmail(e.target.value)}
              />
            </div>
            <button 
              type="submit" disabled={isLoading}
              className="w-full bg-primary text-white py-3 rounded-xl font-bold hover:bg-blue-700 transition-colors disabled:opacity-70 flex justify-center"
            >
               {isLoading ? <Loader2 className="animate-spin" /> : 'Enviar Link'}
            </button>
          </form>
        </div>
      </div>
     );
  }

  return null;
};

const SidebarLink = ({ to, icon: Icon, label }: { to: string, icon: any, label: string }) => {
  const location = useLocation();
  const isActive = location.pathname === to;
  return (
    <Link to={to} className={`flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg transition-colors ${isActive ? 'bg-blue-50 text-primary' : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'}`}>
      <Icon size={20} />
      <span>{label}</span>
    </Link>
  );
};

const Sidebar = () => {
  const { logout, userRole } = useApp();
  const isSindico = userRole === UserRole.SINDICO;

  return (
    <aside className="hidden md:flex flex-col w-64 h-screen bg-white border-r border-gray-200 fixed left-0 top-0 z-10">
      <div className="p-6 flex items-center gap-2 border-b border-gray-100">
        <div className="bg-primary text-white p-1.5 rounded-lg">
          <Building2 size={24} />
        </div>
        <span className="text-xl font-bold text-gray-800 tracking-tight">SyndicPro</span>
      </div>
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {isSindico && <SidebarLink to="/" icon={Home} label="Dashboard" />}
        {!isSindico && <SidebarLink to="/profile" icon={User} label="Meu Perfil" />}
        
        <SidebarLink to="/notices" icon={Bell} label="Comunicados" />
        <SidebarLink to="/meetings" icon={Calendar} label="Agenda & Reuniões" />
        
        {isSindico && (
          <>
            <SidebarLink to="/residents" icon={Users} label="Moradores" />
            <SidebarLink to="/finance" icon={DollarSign} label="Financeiro" />
            <SidebarLink to="/providers" icon={Wrench} label="Prestadores" />
          </>
        )}
      </nav>
      <div className="p-4 border-t border-gray-200">
        <button onClick={logout} className="flex items-center gap-3 px-4 py-3 w-full text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors">
          <LogOut size={20} />
          <span>Sair</span>
        </button>
      </div>
    </aside>
  );
};

const MobileNav = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { logout, userRole } = useApp();
  const isSindico = userRole === UserRole.SINDICO;

  return (
    <div className="md:hidden bg-white border-b border-gray-200 p-4 flex items-center justify-between sticky top-0 z-20">
       <div className="flex items-center gap-2">
        <div className="bg-primary text-white p-1.5 rounded-lg">
          <Building2 size={20} />
        </div>
        <span className="text-lg font-bold text-gray-800">SyndicPro</span>
      </div>
      <button onClick={() => setIsOpen(!isOpen)} className="text-gray-600">
        {isOpen ? <X size={24} /> : <Menu size={24} />}
      </button>
      {isOpen && (
        <div className="absolute top-16 left-0 w-full bg-white border-b border-gray-200 shadow-xl p-4 flex flex-col space-y-2">
          {isSindico && <SidebarLink to="/" icon={Home} label="Dashboard" />}
          {!isSindico && <SidebarLink to="/profile" icon={User} label="Meu Perfil" />}
          <SidebarLink to="/notices" icon={Bell} label="Comunicados" />
          <SidebarLink to="/meetings" icon={Calendar} label="Agenda" />
          {isSindico && (
            <>
              <SidebarLink to="/residents" icon={Users} label="Moradores" />
              <SidebarLink to="/finance" icon={DollarSign} label="Financeiro" />
              <SidebarLink to="/providers" icon={Wrench} label="Prestadores" />
            </>
          )}
          <div className="border-t pt-2 mt-2">
             <button onClick={logout} className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-red-600">
                <LogOut size={20} /> Sair
             </button>
          </div>
        </div>
      )}
    </div>
  );
};

const Dashboard = () => {
  const { condos, currentCondoId, residents, meetings, notices, providers, transactions, setCurrentCondoId, addCondo, addToast } = useApp();
  const [isCondoModalOpen, setIsCondoModalOpen] = useState(false);
  const [newCondoData, setNewCondoData] = useState({ name: '', address: '', units: '' });
  
  const currentCondo = condos.find(c => c.id === currentCondoId) || condos[0];
  const condoResidents = residents.filter(r => r.condoId === currentCondoId);
  const nextMeeting = meetings.find(m => m.condoId === currentCondoId); // Simplified next meeting logic
  const activeProviders = providers.filter(p => p.condoId === currentCondoId && p.active);
  const condoNotices = notices.filter(n => n.condoId === currentCondoId);
  
  // Financial Summary
  const income = transactions
    .filter(t => t.condoId === currentCondoId && t.type === TransactionType.INCOME)
    .reduce((acc, t) => acc + t.amount, 0);
  const expenses = transactions
    .filter(t => t.condoId === currentCondoId && t.type === TransactionType.EXPENSE)
    .reduce((acc, t) => acc + t.amount, 0);

  const chartData = [
    { name: 'Atual', Receitas: income, Despesas: expenses }
  ];

  const handleAddCondo = (e: React.FormEvent) => {
    e.preventDefault();
    if(!newCondoData.name) return;
    addCondo({
      id: Date.now().toString(),
      name: newCondoData.name,
      address: newCondoData.address,
      unitsTotal: parseInt(newCondoData.units) || 0,
      managerName: 'Síndico Logado'
    });
    setIsCondoModalOpen(false);
    setNewCondoData({ name: '', address: '', units: '' });
    addToast('Condomínio adicionado!', 'success');
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header with Condo Switcher */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
           <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
           <p className="text-gray-500">Visão geral do {currentCondo?.name}</p>
        </div>
        <div className="relative group">
          <button className="flex items-center gap-2 bg-white border border-gray-200 px-4 py-2 rounded-lg shadow-sm hover:bg-gray-50">
            <Building2 size={18} className="text-primary" />
            <span className="font-medium text-sm">{currentCondo?.name}</span>
            <ChevronDown size={16} className="text-gray-400" />
          </button>
          <div className="absolute right-0 top-full mt-2 w-64 bg-white border border-gray-200 rounded-lg shadow-xl hidden group-hover:block z-20">
            {condos.map(c => (
              <button 
                key={c.id}
                onClick={() => setCurrentCondoId(c.id)}
                className={`w-full text-left px-4 py-3 hover:bg-gray-50 first:rounded-t-lg last:rounded-b-lg ${c.id === currentCondoId ? 'bg-blue-50 text-primary font-medium' : 'text-gray-700'}`}
              >
                {c.name}
              </button>
            ))}
            <div className="border-t border-gray-100 p-2">
              <button 
                onClick={() => setIsCondoModalOpen(true)}
                className="flex items-center justify-center gap-2 w-full py-2 text-sm text-primary hover:bg-blue-50 rounded-md font-medium"
              >
                <Plus size={16} /> Adicionar Condomínio
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4">
          <div className="bg-blue-100 p-3 rounded-lg text-primary">
            <Users size={24} />
          </div>
          <div>
            <p className="text-sm text-gray-500">Moradores</p>
            <p className="text-2xl font-bold text-gray-900">{condoResidents.length}</p>
            <p className="text-xs text-gray-400">{currentCondo?.unitsTotal} Unidades Totais</p>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4">
          <div className="bg-purple-100 p-3 rounded-lg text-purple-600">
            <Calendar size={24} />
          </div>
          <div>
            <p className="text-sm text-gray-500">Próxima Reunião</p>
            <p className="text-sm font-bold text-gray-900 truncate max-w-[140px]">{nextMeeting ? nextMeeting.title : 'Nenhuma'}</p>
             <p className="text-xs text-gray-400">{nextMeeting ? new Date(nextMeeting.date).toLocaleDateString() : '-'}</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4">
           <div className="bg-green-100 p-3 rounded-lg text-green-600">
            <DollarSign size={24} />
          </div>
          <div>
            <p className="text-sm text-gray-500">Saldo Mensal</p>
            <p className={`text-xl font-bold ${income - expenses >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              R$ {(income - expenses).toLocaleString()}
            </p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4">
          <div className="bg-orange-100 p-3 rounded-lg text-orange-600">
            <Bell size={24} />
          </div>
          <div>
            <p className="text-sm text-gray-500">Avisos Recentes</p>
            <p className="text-2xl font-bold text-gray-900">{condoNotices.length}</p>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Financial Chart */}
        <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-bold text-gray-900 mb-6">Resumo Financeiro</h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="Receitas" fill="#22c55e" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Despesas" fill="#ef4444" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Quick Notices */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-bold text-gray-900">Últimos Avisos</h3>
            <Link to="/notices" className="text-sm text-primary hover:underline">Ver todos</Link>
          </div>
          <div className="space-y-4">
            {condoNotices.slice(0, 3).map(notice => (
              <div key={notice.id} className="p-4 bg-gray-50 rounded-lg border border-gray-100">
                <div className="flex justify-between items-start mb-1">
                   <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                     notice.category === NoticeCategory.URGENT ? 'bg-red-100 text-red-700' :
                     notice.category === NoticeCategory.MAINTENANCE ? 'bg-yellow-100 text-yellow-700' :
                     'bg-blue-100 text-blue-700'
                   }`}>
                     {notice.category}
                   </span>
                   <span className="text-xs text-gray-500">{new Date(notice.date).toLocaleDateString()}</span>
                </div>
                <h4 className="font-bold text-gray-800 text-sm mb-1">{notice.title}</h4>
                <p className="text-xs text-gray-600 line-clamp-2">{notice.message}</p>
              </div>
            ))}
            {condoNotices.length === 0 && (
              <p className="text-center text-gray-500 text-sm py-4">Nenhum aviso publicado.</p>
            )}
          </div>
        </div>
      </div>

      {/* Add Condo Modal */}
      {isCondoModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6 animate-fade-in">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold text-gray-900">Adicionar Condomínio</h3>
              <button onClick={() => setIsCondoModalOpen(false)}><X size={20} className="text-gray-500 hover:text-gray-900" /></button>
            </div>
            <form onSubmit={handleAddCondo} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Nome do Condomínio</label>
                <input type="text" required className="w-full border rounded-lg px-3 py-2" value={newCondoData.name} onChange={e => setNewCondoData({...newCondoData, name: e.target.value})} />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Endereço</label>
                <input type="text" className="w-full border rounded-lg px-3 py-2" value={newCondoData.address} onChange={e => setNewCondoData({...newCondoData, address: e.target.value})} />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Quantidade de Unidades</label>
                <input type="number" className="w-full border rounded-lg px-3 py-2" value={newCondoData.units} onChange={e => setNewCondoData({...newCondoData, units: e.target.value})} />
              </div>
              <button type="submit" className="w-full bg-primary text-white py-2.5 rounded-lg font-medium mt-2 hover:bg-blue-700">Salvar</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

const ResidentsPage = () => {
  const { residents, currentCondoId, addResident, addToast } = useApp();
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Form State
  const [formData, setFormData] = useState<Partial<Resident>>({
    name: '', block: '', unit: '', phone: '', email: '', type: ResidentType.RESIDENT
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.unit) return;
    
    addResident({
      id: Date.now().toString(),
      condoId: currentCondoId,
      name: formData.name!,
      block: formData.block || '',
      unit: formData.unit!,
      phone: formData.phone || '',
      email: formData.email || '',
      type: formData.type || ResidentType.RESIDENT,
      cpf: '' // Optional in quick add
    });
    setIsModalOpen(false);
    addToast("Morador adicionado com sucesso!", "success");
    setFormData({ name: '', block: '', unit: '', phone: '', email: '', type: ResidentType.RESIDENT });
  };

  const filteredResidents = residents.filter(r => r.condoId === currentCondoId);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Moradores</h1>
        <button onClick={() => setIsModalOpen(true)} className="bg-primary hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-medium transition-colors">
          <Plus size={18} /> Novo Morador
        </button>
      </div>

      {/* Search/Filter Bar Placeholder */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input 
            type="text" 
            placeholder="Buscar por nome, bloco ou unidade..." 
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 text-gray-600 font-medium border-b border-gray-100">
              <tr>
                <th className="px-6 py-4">Nome</th>
                <th className="px-6 py-4">Unidade</th>
                <th className="px-6 py-4">Contato</th>
                <th className="px-6 py-4">Tipo</th>
                <th className="px-6 py-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredResidents.map(resident => (
                <tr key={resident.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 font-medium text-gray-900">{resident.name}</td>
                  <td className="px-6 py-4 text-gray-600">{resident.block ? `${resident.block} - ` : ''}{resident.unit}</td>
                  <td className="px-6 py-4 text-gray-600">
                    <div className="flex flex-col">
                      <span>{resident.email}</span>
                      <span className="text-xs text-gray-400">{resident.phone}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                      resident.type === ResidentType.OWNER ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-700'
                    }`}>
                      {resident.type}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right text-gray-400">...</td>
                </tr>
              ))}
              {filteredResidents.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                    Nenhum morador encontrado neste condomínio.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6 animate-fade-in">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold text-gray-900">Novo Morador</h3>
              <button onClick={() => setIsModalOpen(false)}><X size={20} className="text-gray-500 hover:text-gray-900" /></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Nome Completo</label>
                <input type="text" required className="w-full border rounded-lg px-3 py-2" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Bloco</label>
                  <input type="text" className="w-full border rounded-lg px-3 py-2" value={formData.block} onChange={e => setFormData({...formData, block: e.target.value})} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Unidade</label>
                  <input type="text" required className="w-full border rounded-lg px-3 py-2" value={formData.unit} onChange={e => setFormData({...formData, unit: e.target.value})} />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Email</label>
                <input type="email" className="w-full border rounded-lg px-3 py-2" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Telefone</label>
                <input type="text" className="w-full border rounded-lg px-3 py-2" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
              </div>
              <div>
                 <label className="block text-xs font-medium text-gray-700 mb-1">Tipo</label>
                 <select className="w-full border rounded-lg px-3 py-2 bg-white" value={formData.type} onChange={e => setFormData({...formData, type: e.target.value as ResidentType})}>
                   {Object.values(ResidentType).map(t => <option key={t} value={t}>{t}</option>)}
                 </select>
              </div>
              <button type="submit" className="w-full bg-primary text-white py-2.5 rounded-lg font-medium mt-2 hover:bg-blue-700">Salvar</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

const NoticesPage = () => {
  const { notices, currentCondoId, addNotice, addToast, userRole } = useApp();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    title: '', message: '', category: NoticeCategory.GENERAL, pinned: false
  });

  const isSindico = userRole === UserRole.SINDICO;

  const handleAiDraft = async () => {
     if (!formData.title) {
       addToast("Digite um título para a IA gerar o conteúdo.", "error");
       return;
     }
     setAiLoading(true);
     try {
       const text = await draftNoticeContent(formData.title, "Respeitoso e Formal");
       setFormData(prev => ({ ...prev, message: text }));
       addToast("Texto gerado pela IA!", "success");
     } catch(e) {
       addToast("Erro ao gerar texto.", "error");
     } finally {
       setAiLoading(false);
     }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    addNotice({
      id: Date.now().toString(),
      condoId: currentCondoId,
      title: formData.title,
      message: formData.message,
      category: formData.category,
      pinned: formData.pinned,
      date: new Date().toISOString()
    });
    setIsModalOpen(false);
    addToast("Comunicado publicado!", "success");
    setFormData({ title: '', message: '', category: NoticeCategory.GENERAL, pinned: false });
  };

  const filteredNotices = notices.filter(n => n.condoId === currentCondoId);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Comunicados</h1>
        {isSindico && (
          <button onClick={() => setIsModalOpen(true)} className="bg-primary hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-medium transition-colors">
            <Plus size={18} /> Novo Comunicado
          </button>
        )}
      </div>

      <div className="grid gap-4">
        {filteredNotices.map(notice => (
          <div key={notice.id} className={`bg-white p-6 rounded-xl shadow-sm border ${notice.pinned ? 'border-l-4 border-l-primary border-gray-100' : 'border-gray-100'}`}>
            <div className="flex justify-between items-start mb-3">
              <div className="flex items-center gap-3">
                 <span className={`text-xs px-2.5 py-1 rounded-full font-bold ${
                   notice.category === NoticeCategory.URGENT ? 'bg-red-100 text-red-700' :
                   notice.category === NoticeCategory.MAINTENANCE ? 'bg-yellow-100 text-yellow-700' :
                   'bg-blue-100 text-blue-700'
                 }`}>
                   {notice.category}
                 </span>
                 {notice.pinned && <span className="flex items-center text-xs font-medium text-gray-500"><ShieldCheck size={12} className="mr-1"/> Fixado</span>}
              </div>
              <span className="text-xs text-gray-400">{new Date(notice.date).toLocaleDateString()}</span>
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">{notice.title}</h3>
            <p className="text-gray-600 text-sm whitespace-pre-line">{notice.message}</p>
          </div>
        ))}
        {filteredNotices.length === 0 && (
           <div className="text-center py-12 text-gray-500 bg-white rounded-xl border border-dashed border-gray-200">
             <Bell className="mx-auto mb-3 text-gray-300" size={48} />
             <p>Nenhum comunicado encontrado.</p>
           </div>
        )}
      </div>

      {isModalOpen && isSindico && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
           <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg p-6 animate-fade-in">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold text-gray-900">Novo Comunicado</h3>
              <button onClick={() => setIsModalOpen(false)}><X size={20} className="text-gray-500 hover:text-gray-900" /></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Título</label>
                <input type="text" required className="w-full border rounded-lg px-3 py-2" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} />
              </div>
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="block text-xs font-medium text-gray-700">Mensagem</label>
                  <button type="button" onClick={handleAiDraft} disabled={aiLoading} className="text-xs text-primary flex items-center gap-1 hover:underline disabled:opacity-50">
                    {aiLoading ? <Loader2 size={12} className="animate-spin"/> : <Users size={12}/>}
                    Gerar com IA
                  </button>
                </div>
                <textarea required rows={5} className="w-full border rounded-lg px-3 py-2" value={formData.message} onChange={e => setFormData({...formData, message: e.target.value})} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                 <div>
                   <label className="block text-xs font-medium text-gray-700 mb-1">Categoria</label>
                   <select className="w-full border rounded-lg px-3 py-2 bg-white" value={formData.category} onChange={e => setFormData({...formData, category: e.target.value as NoticeCategory})}>
                     {Object.values(NoticeCategory).map(t => <option key={t} value={t}>{t}</option>)}
                   </select>
                 </div>
                 <div className="flex items-center pt-6">
                    <input type="checkbox" id="pinned" className="mr-2" checked={formData.pinned} onChange={e => setFormData({...formData, pinned: e.target.checked})} />
                    <label htmlFor="pinned" className="text-sm text-gray-700">Fixar no topo</label>
                 </div>
              </div>
              <button type="submit" className="w-full bg-primary text-white py-2.5 rounded-lg font-medium mt-2 hover:bg-blue-700">Publicar</button>
            </form>
           </div>
        </div>
      )}
    </div>
  );
};

const ResidentProfilePage = () => {
  const { currentResidentId, residents, updateResident, addToast } = useApp();
  
  const resident = residents.find(r => r.id === currentResidentId);
  
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({ phone: '', email: '' });

  useEffect(() => {
    if (resident) {
      setEditData({ phone: resident.phone, email: resident.email });
    }
  }, [resident]);

  const handleSave = () => {
    if (currentResidentId) {
      updateResident(currentResidentId, editData);
      setIsEditing(false);
      addToast("Perfil atualizado com sucesso!", "success");
    }
  };

  if (!resident) return <div className="p-8 text-center">Carregando perfil...</div>;

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
       <h1 className="text-2xl font-bold text-gray-900">Meu Perfil</h1>
       
       <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="bg-blue-50 p-6 flex items-center gap-4 border-b border-blue-100">
             <div className="bg-primary text-white w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold">
                {resident.name.charAt(0)}
             </div>
             <div>
                <h2 className="text-xl font-bold text-gray-900">{resident.name}</h2>
                <p className="text-blue-700 font-medium">Bloco {resident.block}, Apto {resident.unit}</p>
             </div>
          </div>
          <div className="p-6 space-y-6">
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                   <label className="block text-xs font-medium text-gray-500 mb-1">CPF</label>
                   <p className="text-gray-900 font-medium">{resident.cpf || 'Não informado'}</p>
                </div>
                <div>
                   <label className="block text-xs font-medium text-gray-500 mb-1">Tipo de Residente</label>
                   <span className="inline-flex px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                      {resident.type}
                   </span>
                </div>
                
                <div>
                   <label className="block text-xs font-medium text-gray-500 mb-1">Email</label>
                   {isEditing ? (
                      <input 
                        type="email" 
                        className="w-full border rounded-lg px-3 py-2 text-sm"
                        value={editData.email}
                        onChange={e => setEditData({...editData, email: e.target.value})}
                      />
                   ) : (
                      <p className="text-gray-900 flex items-center gap-2">
                        <Mail size={16} className="text-gray-400" />
                        {resident.email}
                      </p>
                   )}
                </div>

                <div>
                   <label className="block text-xs font-medium text-gray-500 mb-1">Telefone</label>
                   {isEditing ? (
                      <input 
                        type="text" 
                        className="w-full border rounded-lg px-3 py-2 text-sm"
                        value={editData.phone}
                        onChange={e => setEditData({...editData, phone: e.target.value})}
                      />
                   ) : (
                      <p className="text-gray-900 flex items-center gap-2">
                        <Users size={16} className="text-gray-400" />
                        {resident.phone}
                      </p>
                   )}
                </div>
             </div>

             <div className="pt-6 border-t border-gray-100 flex justify-end gap-3">
                {isEditing ? (
                   <>
                     <button onClick={() => setIsEditing(false)} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900">Cancelar</button>
                     <button onClick={handleSave} className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-blue-700">Salvar Alterações</button>
                   </>
                ) : (
                   <button onClick={() => setIsEditing(true)} className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50">
                      Editar Contato
                   </button>
                )}
             </div>
          </div>
       </div>
    </div>
  );
};

const MeetingsPage = () => {
  const { meetings, currentCondoId, userRole, addMeeting, addToast } = useApp();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    title: '', date: '', time: '', description: '', agenda: ''
  });

  const isSindico = userRole === UserRole.SINDICO;
  const filteredMeetings = meetings.filter(m => m.condoId === currentCondoId);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const dateTime = `${formData.date}T${formData.time}`;
    addMeeting({
      id: Date.now().toString(),
      condoId: currentCondoId,
      title: formData.title,
      date: dateTime,
      description: formData.description,
      agenda: formData.agenda
    });
    setIsModalOpen(false);
    addToast("Reunião agendada com sucesso!", "success");
    setFormData({ title: '', date: '', time: '', description: '', agenda: '' });
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Agenda & Reuniões</h1>
        {isSindico && (
          <button onClick={() => setIsModalOpen(true)} className="bg-primary hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-medium transition-colors">
            <Plus size={18} /> Agendar Reunião
          </button>
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredMeetings.map(meeting => (
          <div key={meeting.id} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col">
            <div className="flex items-center gap-3 mb-4">
              <div className="bg-purple-100 text-purple-600 p-2.5 rounded-lg">
                <Calendar size={24} />
              </div>
              <div>
                <p className="text-xs text-gray-500 font-medium uppercase">Data</p>
                <p className="text-sm font-bold text-gray-900">
                  {new Date(meeting.date).toLocaleDateString()} às {new Date(meeting.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                </p>
              </div>
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">{meeting.title}</h3>
            <p className="text-gray-600 text-sm mb-4 flex-1">{meeting.description}</p>
            <div className="mt-auto pt-4 border-t border-gray-100">
              <p className="text-xs text-gray-400 font-medium uppercase mb-1">Pauta</p>
              <p className="text-xs text-gray-600 whitespace-pre-line">{meeting.agenda}</p>
            </div>
          </div>
        ))}
        {filteredMeetings.length === 0 && (
           <div className="col-span-full text-center py-12 text-gray-500 bg-white rounded-xl border border-dashed border-gray-200">
             <Calendar className="mx-auto mb-3 text-gray-300" size={48} />
             <p>Nenhuma reunião agendada.</p>
           </div>
        )}
      </div>

      {isModalOpen && isSindico && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
           <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg p-6 animate-fade-in">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold text-gray-900">Agendar Reunião</h3>
              <button onClick={() => setIsModalOpen(false)}><X size={20} className="text-gray-500 hover:text-gray-900" /></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Título</label>
                <input type="text" required className="w-full border rounded-lg px-3 py-2" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                   <label className="block text-xs font-medium text-gray-700 mb-1">Data</label>
                   <input type="date" required className="w-full border rounded-lg px-3 py-2" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} />
                </div>
                <div>
                   <label className="block text-xs font-medium text-gray-700 mb-1">Horário</label>
                   <input type="time" required className="w-full border rounded-lg px-3 py-2" value={formData.time} onChange={e => setFormData({...formData, time: e.target.value})} />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Descrição</label>
                <input type="text" required className="w-full border rounded-lg px-3 py-2" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Pauta</label>
                <textarea required rows={4} className="w-full border rounded-lg px-3 py-2" value={formData.agenda} onChange={e => setFormData({...formData, agenda: e.target.value})} placeholder="Assuntos a serem discutidos..." />
              </div>
              <button type="submit" className="w-full bg-primary text-white py-2.5 rounded-lg font-medium mt-2 hover:bg-blue-700">Agendar</button>
            </form>
           </div>
        </div>
      )}
    </div>
  );
};

const FinancePage = () => {
  const { transactions, currentCondoId, addTransaction, addToast } = useApp();
  const [activeTab, setActiveTab] = useState<'list' | 'new'>('list');
  const [formData, setFormData] = useState({
    type: TransactionType.EXPENSE, amount: '', category: '', description: '', supplier: '', date: ''
  });

  const filteredTrans = transactions.filter(t => t.condoId === currentCondoId);
  const income = filteredTrans.filter(t => t.type === TransactionType.INCOME).reduce((acc, t) => acc + t.amount, 0);
  const expenses = filteredTrans.filter(t => t.type === TransactionType.EXPENSE).reduce((acc, t) => acc + t.amount, 0);
  const balance = income - expenses;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    addTransaction({
      id: Date.now().toString(),
      condoId: currentCondoId,
      type: formData.type,
      amount: parseFloat(formData.amount),
      category: formData.category,
      description: formData.description,
      supplier: formData.supplier,
      date: formData.date
    });
    addToast("Transação registrada!", "success");
    setFormData({ type: TransactionType.EXPENSE, amount: '', category: '', description: '', supplier: '', date: '' });
    setActiveTab('list');
  };

  return (
     <div className="space-y-6 animate-fade-in">
        <h1 className="text-2xl font-bold text-gray-900">Financeiro</h1>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
           <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <div className="flex items-center gap-3 mb-2">
                 <div className="p-2 bg-green-100 text-green-600 rounded-lg"><TrendingUp size={20} /></div>
                 <span className="text-sm font-medium text-gray-500">Receitas</span>
              </div>
              <p className="text-2xl font-bold text-gray-900">R$ {income.toLocaleString()}</p>
           </div>
           <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <div className="flex items-center gap-3 mb-2">
                 <div className="p-2 bg-red-100 text-red-600 rounded-lg"><TrendingDown size={20} /></div>
                 <span className="text-sm font-medium text-gray-500">Despesas</span>
              </div>
              <p className="text-2xl font-bold text-gray-900">R$ {expenses.toLocaleString()}</p>
           </div>
           <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <div className="flex items-center gap-3 mb-2">
                 <div className="p-2 bg-blue-100 text-blue-600 rounded-lg"><DollarSign size={20} /></div>
                 <span className="text-sm font-medium text-gray-500">Saldo</span>
              </div>
              <p className={`text-2xl font-bold ${balance >= 0 ? 'text-blue-600' : 'text-red-600'}`}>R$ {balance.toLocaleString()}</p>
           </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
           <div className="border-b border-gray-100 flex">
              <button onClick={() => setActiveTab('list')} className={`flex-1 py-4 text-sm font-medium border-b-2 ${activeTab === 'list' ? 'border-primary text-primary' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>Extrato</button>
              <button onClick={() => setActiveTab('new')} className={`flex-1 py-4 text-sm font-medium border-b-2 ${activeTab === 'new' ? 'border-primary text-primary' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>Nova Transação</button>
           </div>

           <div className="p-6">
              {activeTab === 'list' ? (
                 <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                       <thead className="bg-gray-50 text-gray-600 font-medium">
                          <tr>
                             <th className="px-4 py-3 rounded-l-lg">Data</th>
                             <th className="px-4 py-3">Descrição</th>
                             <th className="px-4 py-3">Categoria</th>
                             <th className="px-4 py-3 text-right rounded-r-lg">Valor</th>
                          </tr>
                       </thead>
                       <tbody className="divide-y divide-gray-50">
                          {filteredTrans.map(t => (
                             <tr key={t.id}>
                                <td className="px-4 py-3 text-gray-500">{new Date(t.date).toLocaleDateString()}</td>
                                <td className="px-4 py-3 font-medium text-gray-900">{t.description} <span className="text-xs text-gray-400 font-normal block">{t.supplier}</span></td>
                                <td className="px-4 py-3 text-gray-500">{t.category}</td>
                                <td className={`px-4 py-3 text-right font-bold ${t.type === TransactionType.INCOME ? 'text-green-600' : 'text-red-600'}`}>
                                   {t.type === TransactionType.INCOME ? '+' : '-'} R$ {t.amount.toLocaleString()}
                                </td>
                             </tr>
                          ))}
                          {filteredTrans.length === 0 && <tr><td colSpan={4} className="text-center py-8 text-gray-500">Nenhuma transação registrada.</td></tr>}
                       </tbody>
                    </table>
                 </div>
              ) : (
                 <form onSubmit={handleSubmit} className="max-w-lg mx-auto space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                       <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">Tipo</label>
                          <select className="w-full border rounded-lg px-3 py-2 bg-white" value={formData.type} onChange={e => setFormData({...formData, type: e.target.value as TransactionType})}>
                             {Object.values(TransactionType).map(t => <option key={t} value={t}>{t}</option>)}
                          </select>
                       </div>
                       <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">Data</label>
                          <input type="date" required className="w-full border rounded-lg px-3 py-2" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} />
                       </div>
                    </div>
                    <div>
                       <label className="block text-xs font-medium text-gray-700 mb-1">Valor (R$)</label>
                       <input type="number" required step="0.01" className="w-full border rounded-lg px-3 py-2" value={formData.amount} onChange={e => setFormData({...formData, amount: e.target.value})} />
                    </div>
                    <div>
                       <label className="block text-xs font-medium text-gray-700 mb-1">Categoria</label>
                       <input type="text" required placeholder="Ex: Manutenção, Taxa Condominial" className="w-full border rounded-lg px-3 py-2" value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} />
                    </div>
                    <div>
                       <label className="block text-xs font-medium text-gray-700 mb-1">Descrição</label>
                       <input type="text" required className="w-full border rounded-lg px-3 py-2" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
                    </div>
                    {formData.type === TransactionType.EXPENSE && (
                       <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">Fornecedor</label>
                          <input type="text" className="w-full border rounded-lg px-3 py-2" value={formData.supplier} onChange={e => setFormData({...formData, supplier: e.target.value})} />
                       </div>
                    )}
                    <button type="submit" className="w-full bg-primary text-white py-2.5 rounded-lg font-medium mt-4 hover:bg-blue-700">Salvar Transação</button>
                 </form>
              )}
           </div>
        </div>
     </div>
  );
};

const ProvidersPage = () => {
  const { providers, currentCondoId, addProvider, addToast } = useApp();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '', specialty: '', phone: '', email: '', company: ''
  });

  const filteredProviders = providers.filter(p => p.condoId === currentCondoId);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    addProvider({
      id: Date.now().toString(),
      condoId: currentCondoId,
      name: formData.name,
      specialty: formData.specialty,
      phone: formData.phone,
      email: formData.email,
      company: formData.company,
      active: true
    });
    setIsModalOpen(false);
    addToast("Prestador cadastrado!", "success");
    setFormData({ name: '', specialty: '', phone: '', email: '', company: '' });
  };

  return (
    <div className="space-y-6 animate-fade-in">
       <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Prestadores de Serviço</h1>
        <button onClick={() => setIsModalOpen(true)} className="bg-primary hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-medium transition-colors">
          <Plus size={18} /> Novo Prestador
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
         {filteredProviders.map(provider => (
            <div key={provider.id} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col">
               <div className="flex justify-between items-start mb-4">
                  <div className="bg-orange-100 p-3 rounded-lg text-orange-600">
                     <Wrench size={24} />
                  </div>
                  <span className="text-xs font-bold bg-gray-100 text-gray-600 px-2 py-1 rounded-full">{provider.specialty}</span>
               </div>
               <h3 className="text-lg font-bold text-gray-900 mb-1">{provider.name}</h3>
               <p className="text-sm text-gray-500 mb-4">{provider.company}</p>
               
               <div className="mt-auto space-y-2 border-t border-gray-100 pt-4">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                     <Phone size={16} className="text-gray-400" /> {provider.phone}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                     <Mail size={16} className="text-gray-400" /> {provider.email}
                  </div>
               </div>
            </div>
         ))}
         {filteredProviders.length === 0 && (
           <div className="col-span-full text-center py-12 text-gray-500 bg-white rounded-xl border border-dashed border-gray-200">
             <Wrench className="mx-auto mb-3 text-gray-300" size={48} />
             <p>Nenhum prestador cadastrado.</p>
           </div>
        )}
      </div>

      {isModalOpen && (
         <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6 animate-fade-in">
               <div className="flex justify-between items-center mb-6">
                  <h3 className="text-lg font-bold text-gray-900">Novo Prestador</h3>
                  <button onClick={() => setIsModalOpen(false)}><X size={20} className="text-gray-500 hover:text-gray-900" /></button>
               </div>
               <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                     <label className="block text-xs font-medium text-gray-700 mb-1">Nome</label>
                     <input type="text" required className="w-full border rounded-lg px-3 py-2" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                  </div>
                  <div>
                     <label className="block text-xs font-medium text-gray-700 mb-1">Empresa</label>
                     <input type="text" required className="w-full border rounded-lg px-3 py-2" value={formData.company} onChange={e => setFormData({...formData, company: e.target.value})} />
                  </div>
                  <div>
                     <label className="block text-xs font-medium text-gray-700 mb-1">Especialidade</label>
                     <input type="text" required placeholder="Ex: Elétrica, Hidráulica" className="w-full border rounded-lg px-3 py-2" value={formData.specialty} onChange={e => setFormData({...formData, specialty: e.target.value})} />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                     <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Telefone</label>
                        <input type="text" required className="w-full border rounded-lg px-3 py-2" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
                     </div>
                     <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Email</label>
                        <input type="email" className="w-full border rounded-lg px-3 py-2" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
                     </div>
                  </div>
                  <button type="submit" className="w-full bg-primary text-white py-2.5 rounded-lg font-medium mt-2 hover:bg-blue-700">Salvar</button>
               </form>
            </div>
         </div>
      )}
    </div>
  );
};

const App = () => {
  const { userRole } = useApp();

  // If not logged in, show Login Page
  if (!userRole) {
    return <LoginPage />;
  }

  return (
    <div className="min-h-screen bg-background flex text-gray-900 font-sans">
      <Sidebar />
      <div className="flex-1 flex flex-col md:ml-64 min-h-screen">
        <MobileNav />
        <main className="flex-1 p-4 md:p-8 overflow-y-auto">
          <div className="max-w-6xl mx-auto">
            <Routes>
              <Route path="/" element={userRole === UserRole.SINDICO ? <Dashboard /> : <Navigate to="/profile" />} />
              <Route path="/residents" element={userRole === UserRole.SINDICO ? <ResidentsPage /> : <Navigate to="/" />} />
              <Route path="/notices" element={<NoticesPage />} />
              <Route path="/meetings" element={<MeetingsPage />} />
              <Route path="/profile" element={userRole === UserRole.MORADOR ? <ResidentProfilePage /> : <Navigate to="/" />} />
              <Route path="/finance" element={userRole === UserRole.SINDICO ? <FinancePage /> : <Navigate to="/" />} />
              <Route path="/providers" element={userRole === UserRole.SINDICO ? <ProvidersPage /> : <Navigate to="/" />} />
            </Routes>
          </div>
        </main>
      </div>
    </div>
  );
};

const Root = () => (
  <HashRouter>
    <AppProvider>
      <App />
    </AppProvider>
  </HashRouter>
);

export default Root;
