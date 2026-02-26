export type ServiceType = 'Hospedagem' | 'Streaming' | 'Hospedagem + Streaming' | 'Outro';

export interface Client {
  id: number;
  name: string;
  service_type: ServiceType;
  custom_service?: string;
  observations?: string;
  created_at: string;
}

export type TransactionType = 'revenue' | 'expense';
export type RecurrenceType = 'single' | 'monthly' | 'yearly';
export type TransactionStatus = 'pending' | 'paid';

export interface Transaction {
  id: number;
  type: TransactionType;
  client_id?: number;
  client_name?: string;
  description: string;
  category?: string;
  amount: number;
  due_date: string;
  status: TransactionStatus;
  recurrence: RecurrenceType;
  parent_id?: number;
}

export type ExpenseCategory = 'Servidor' | 'Domínio' | 'Marketing' | 'Ferramentas' | 'Outros';
