
export enum UserRole {
  SINDICO = 'SINDICO',
  MORADOR = 'MORADOR'
}

export enum ResidentType {
  OWNER = 'Proprietário',
  TENANT = 'Inquilino',
  RESIDENT = 'Morador'
}

export enum NoticeCategory {
  URGENT = 'Urgente',
  MAINTENANCE = 'Manutenção',
  EVENT = 'Evento',
  GENERAL = 'Aviso Geral'
}

export enum TransactionType {
  INCOME = 'Receita',
  EXPENSE = 'Despesa'
}

export interface Condominium {
  id: string;
  name: string;
  address: string;
  cnpj?: string;
  unitsTotal: number;
  managerName: string;
}

export interface Resident {
  id: string;
  condoId: string;
  name: string;
  cpf?: string;
  block: string;
  unit: string;
  phone: string;
  email: string;
  type: ResidentType;
  password?: string; // Added for auth flow simulation
}

export interface Provider {
  id: string;
  condoId: string;
  name: string;
  specialty: string; // e.g., Electrician, Plumber
  phone: string;
  email: string;
  company: string;
  active: boolean;
}

export interface Meeting {
  id: string;
  condoId: string;
  title: string;
  date: string; // ISO date string
  description: string;
  agenda: string;
}

export interface Notice {
  id: string;
  condoId: string;
  title: string;
  message: string;
  date: string;
  category: NoticeCategory;
  pinned: boolean;
}

export interface Transaction {
  id: string;
  condoId: string;
  type: TransactionType;
  amount: number;
  category: string;
  date: string;
  description: string;
  supplier?: string; // For expenses
}
