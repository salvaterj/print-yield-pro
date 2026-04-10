import {
  Carrier,
  Company,
  FinishedProduct,
  Quote,
  QuoteItem,
  RawProduct,
  Salesperson,
  SystemSettings,
  WorkOrder,
  WorkOrderItem,
} from '@/types';

const now = () => new Date().toISOString();

export const mockSystemSettings: SystemSettings = {
  id: 'settings-main',
  company_name: 'Rocha Etiquetas',
  document_footer: 'Obrigado pela preferência.',
  default_quote_validity_days: 7,
  default_waste_percentage: 3,
  created_at: now(),
  updated_at: now(),
};

export const mockSalespeople: Salesperson[] = [
  {
    id: 'sp-001',
    code: '001',
    name: 'Carlos Vendas',
    phone: '(11) 99999-1234',
    whatsapp: '(11) 99999-1234',
    email: 'carlos@rochaetiquetas.com.br',
    commission_type: 'percentage',
    commission_value: 5,
    notes: '',
    active: true,
    created_at: now(),
    updated_at: now(),
  },
];

export const mockCarriers: Carrier[] = [
  {
    id: 'car-001',
    code: '001',
    name: 'Transportes Rápido',
    cnpj: '00.000.000/0001-00',
    phone: '(11) 3333-0000',
    whatsapp: '(11) 98888-0000',
    email: 'contato@transportesrapido.com.br',
    zip_code: '01000-000',
    address: 'Rua Exemplo',
    number: '100',
    complement: '',
    neighborhood: 'Centro',
    city: 'São Paulo',
    state: 'SP',
    delivery_time_days: 2,
    notes: '',
    active: true,
    created_at: now(),
    updated_at: now(),
  },
];

export const mockCompanies: Company[] = [
  {
    id: 'comp-001',
    code: '001',
    name: 'Supermercado Bom Preço Ltda',
    trade_name: 'Supermercado Bom Preço',
    cnpj: '12.345.678/0001-90',
    state_registration: '',
    phone: '(11) 99999-1111',
    whatsapp: '(11) 99999-1111',
    email: 'compras@bompreco.com.br',
    zip_code: '01000-000',
    address: 'Rua das Flores',
    number: '123',
    complement: '',
    neighborhood: 'Centro',
    city: 'São Paulo',
    state: 'SP',
    salesperson_id: 'sp-001',
    default_carrier_id: 'car-001',
    notes: '',
    active: true,
    created_at: now(),
    updated_at: now(),
  },
];

export const mockRawProducts: RawProduct[] = [
  {
    id: 'raw-001',
    code: '001',
    name: 'Bobina Couche 107mm',
    material_type: 'couche',
    width_mm: 107,
    length_m: 1000,
    thickness_microns: 80,
    usable_width_mm: 105,
    waste_percentage: 3,
    cost_per_meter: 0.45,
    cost_per_kg: null,
    supplier_name: 'Papel Center',
    notes: '',
    active: true,
    created_at: now(),
    updated_at: now(),
  },
];

export const mockFinishedProducts: FinishedProduct[] = [
  {
    id: 'fp-001',
    code: '001',
    name: 'Etiqueta 34x23',
    product_type: 'label',
    width_mm: 34,
    height_mm: 23,
    units_per_row: 3,
    units_per_meter: 100,
    requires_specific_raw_material: false,
    default_raw_product_id: null,
    base_price: 45,
    minimum_quantity: 1000,
    notes: '',
    active: true,
    created_at: now(),
    updated_at: now(),
  },
];

export const mockQuotes: Quote[] = [
  {
    id: 'q-001',
    quote_number: 'ORC-0001',
    company_id: 'comp-001',
    salesperson_id: 'sp-001',
    carrier_id: 'car-001',
    status: 'draft',
    issue_date: new Date().toISOString().slice(0, 10),
    valid_until: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
    notes: '',
    created_at: now(),
    updated_at: now(),
  },
];

export const mockQuoteItems: QuoteItem[] = [
  {
    id: 'qi-001',
    quote_id: 'q-001',
    finished_product_id: 'fp-001',
    raw_product_id: 'raw-001',
    description: 'Etiqueta 34x23',
    quantity: 1000,
    width_mm: 34,
    height_mm: 23,
    units_per_row: 3,
    units_per_meter: 100,
    material_used_meters: 10,
    waste_meters: 0.3,
    total_cost: 4.64,
    unit_cost: 0.00464,
    sale_price: 0.05,
    total_price: 50,
    profit_margin: 0,
    technical_notes: '',
    created_at: now(),
    updated_at: now(),
  },
];

export const mockWorkOrders: WorkOrder[] = [];
export const mockWorkOrderItems: WorkOrderItem[] = [];

export const kanbanColumns = [
  { id: 'a_fazer', title: 'A Fazer' },
  { id: 'preparacao', title: 'Preparação' },
  { id: 'impressao', title: 'Impressão' },
  { id: 'rebobinagem_corte', title: 'Rebobinagem/Corte' },
  { id: 'acabamento', title: 'Acabamento' },
  { id: 'qualidade', title: 'Qualidade' },
  { id: 'pronto_para_nf', title: 'Pronto p/ NF' },
  { id: 'nf_emitida', title: 'NF Emitida' },
  { id: 'entregue', title: 'Entregue' },
];
