
import { Condominium, Resident, ResidentType, Provider, Meeting, Notice, NoticeCategory, Transaction, TransactionType, ChatMessage } from '../types';

export const MOCK_CONDOS: Condominium[] = [
  {
    id: 'c1',
    name: 'Residencial Aurora',
    address: 'Av. das Flores, 123, São Paulo',
    unitsTotal: 45,
    managerName: 'Carlos Silva',
    cnpj: '12.345.678/0001-99'
  },
  {
    id: 'c2',
    name: 'Edifício Horizonte',
    address: 'Rua do Sol, 88, Rio de Janeiro',
    unitsTotal: 20,
    managerName: 'Carlos Silva',
    cnpj: '98.765.432/0001-11'
  }
];

export const MOCK_RESIDENTS: Resident[] = [
  { id: 'r1', condoId: 'c1', name: 'Ana Paula', cpf: '123.456.789-00', block: 'A', unit: '101', phone: '(11) 99999-1111', email: 'ana@email.com', type: ResidentType.OWNER, status: 'active' },
  { id: 'r2', condoId: 'c1', name: 'Roberto Santos', cpf: '234.567.890-11', block: 'A', unit: '102', phone: '(11) 99999-2222', email: 'beto@email.com', type: ResidentType.TENANT, status: 'active' },
  { id: 'r3', condoId: 'c2', name: 'Mariana Costa', cpf: '345.678.901-22', block: 'Único', unit: '501', phone: '(21) 98888-3333', email: 'mari@email.com', type: ResidentType.OWNER, status: 'active' },
  // Pending resident for testing
  { id: 'r4', condoId: 'c1', name: 'Lucas Pendente', cpf: '999.888.777-66', block: 'B', unit: '202', phone: '(11) 90000-0000', email: 'lucas@email.com', type: ResidentType.RESIDENT, status: 'pending' },
];

export const MOCK_PROVIDERS: Provider[] = [
  { id: 'p1', condoId: 'c1', name: 'João Eletricista', specialty: 'Elétrica', phone: '(11) 97777-0000', email: 'joao@servicos.com', company: 'JM Elétrica', active: true },
  { id: 'p2', condoId: 'c1', name: 'Clean Pool', specialty: 'Piscina', phone: '(11) 3333-4444', email: 'contato@cleanpool.com', company: 'Clean Pool Ltda', active: true },
];

export const MOCK_MEETINGS: Meeting[] = [
  { id: 'm1', condoId: 'c1', title: 'Assembleia Geral Ordinária', date: '2024-06-15T19:00:00', description: 'Aprovação de contas', agenda: '1. Leitura da ata anterior\n2. Aprovação de contas 2023\n3. Eleição de subsíndico' },
  { id: 'm2', condoId: 'c2', title: 'Reunião de Obras', date: '2024-06-20T10:00:00', description: 'Reforma da fachada', agenda: 'Escolha de fornecedores' },
];

export const MOCK_NOTICES: Notice[] = [
  { id: 'n1', condoId: 'c1', title: 'Manutenção do Elevador', message: 'O elevador social estará parado para manutenção na terça-feira das 9h às 12h.', date: '2024-05-28', category: NoticeCategory.MAINTENANCE, pinned: true },
  { id: 'n2', condoId: 'c1', title: 'Festa Junina', message: 'Nossa festa será dia 24/06 no salão de festas. Tragam pratos típicos!', date: '2024-05-30', category: NoticeCategory.EVENT, pinned: false },
];

export const MOCK_TRANSACTIONS: Transaction[] = [
  { id: 't1', condoId: 'c1', type: TransactionType.INCOME, amount: 15000, category: 'Taxa Condominial', date: '2024-05-05', description: 'Arrecadação mensal' },
  { id: 't2', condoId: 'c1', type: TransactionType.EXPENSE, amount: 1200, category: 'Limpeza', date: '2024-05-10', supplier: 'Clean Service', description: 'Serviço mensal de limpeza' },
  { id: 't3', condoId: 'c1', type: TransactionType.EXPENSE, amount: 4500, category: 'Manutenção', date: '2024-05-15', supplier: 'Elevadores Tech', description: 'Reparo motor portão' },
  { id: 't4', condoId: 'c1', type: TransactionType.INCOME, amount: 500, category: 'Multas', date: '2024-05-20', description: 'Multa barulho apto 302' },
  { id: 't5', condoId: 'c2', type: TransactionType.INCOME, amount: 8000, category: 'Taxa Condominial', date: '2024-05-05', description: 'Arrecadação mensal' },
];

export const MOCK_CHAT: ChatMessage[] = [
  { id: 'msg1', condoId: 'c1', residentId: 'r1', content: 'Bom dia! Poderia reservar o salão para o dia 20?', timestamp: '2024-06-01T10:30:00', sentByManager: false, read: true },
  { id: 'msg2', condoId: 'c1', residentId: 'r1', content: 'Olá Ana, vou verificar a disponibilidade.', timestamp: '2024-06-01T10:35:00', sentByManager: true, read: true },
  { id: 'msg3', condoId: 'c1', residentId: 'r1', content: 'Confirmado! Já está reservado.', timestamp: '2024-06-01T11:00:00', sentByManager: true, read: true },
  { id: 'msg4', condoId: 'c1', residentId: 'r1', content: 'Muito obrigada!', timestamp: '2024-06-01T11:05:00', sentByManager: false, read: false },
  { id: 'msg5', condoId: 'c1', residentId: 'r2', content: 'O portão da garagem está fazendo barulho novamente.', timestamp: '2024-06-02T08:00:00', sentByManager: false, read: false },
];