export type UserProfile = 'admin' | 'vendas' | 'producao';

export type CommissionType = 'percentage' | 'fixed';

export type QuoteStatus = 'draft' | 'approved' | 'rejected' | 'canceled';

export type ProductType = 'label' | 'card' | 'tag' | 'sticker' | 'custom';

export type WorkOrderStatus = 'pending' | 'in_production' | 'finished' | 'canceled';

export type WorkflowStage =
  | 'a_fazer'
  | 'preparacao'
  | 'impressao'
  | 'rebobinagem_corte'
  | 'acabamento'
  | 'qualidade'
  | 'pronto_para_nf'
  | 'nf_emitida'
  | 'entregue';

export interface Company {
  id: string;
  code: string;
  name: string;
  trade_name: string;
  cnpj: string;
  state_registration: string;
  state_registration_isento: boolean;
  phone: string;
  whatsapp: string;
  email: string;
  zip_code: string;
  address: string;
  number: string;
  complement: string;
  neighborhood: string;
  city: string;
  state: string;
  salesperson_id?: string;
  default_carrier_id?: string;
  notes: string;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Carrier {
  id: string;
  code: string;
  name: string;
  cnpj: string;
  phone: string;
  whatsapp: string;
  email: string;
  zip_code: string;
  address: string;
  number: string;
  complement: string;
  neighborhood: string;
  city: string;
  state: string;
  notes: string;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Salesperson {
  id: string;
  code: string;
  name: string;
  phone: string;
  whatsapp: string;
  email: string;
  commission_type: CommissionType;
  commission_value: number;
  notes: string;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export interface RawProduct {
  id: string;
  code: string;
  name: string;
  material_type: string;
  width_mm: number;
  length_m: number;
  thickness_microns: number;
  usable_width_mm: number;
  waste_percentage: number;
  cost_per_meter: number;
  ipi_percentage: number;
  cost_total_no_ipi: number;
  cost_total_with_ipi: number;
  cost_per_m2_no_ipi: number;
  cost_per_m2_with_ipi: number;
  cost_per_kg: number | null;
  supplier_name: string;
  notes: string;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export interface FinishedProduct {
  id: string;
  code: string;
  name: string;
  product_type: ProductType;
  width_mm: number;
  height_mm: number;
  units_per_row: number;
  units_per_meter: number;
  requires_specific_raw_material: boolean;
  default_raw_product_id: string | null;
  base_price: number;
  minimum_quantity: number;
  unit_area_m2: number;
  material_unit_cost_no_ipi: number;
  material_unit_cost_with_ipi: number;
  waste_percentage: number;
  margin_percentage: number;
  icms_percentage: number;
  price_pre_icms: number;
  suggested_price: number;
  profit_per_unit: number;
  image_url: string | null;
  requires_custom_image: boolean;
  pantone_1: string | null;
  pantone_2: string | null;
  pantone_3: string | null;
  pantone_1_hex: string | null;
  pantone_2_hex: string | null;
  pantone_3_hex: string | null;
  notes: string;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Quote {
  id: string;
  quote_number: string;
  company_id: string;
  salesperson_id: string;
  carrier_id: string | null;
  status: QuoteStatus;
  issue_date: string;
  valid_until: string;
  notes: string;
  created_at: string;
  updated_at: string;
}

export interface QuoteItem {
  id: string;
  quote_id: string;
  finished_product_id: string | null;
  raw_product_id: string | null;
  description: string;
  quantity: number;
  width_mm: number;
  height_mm: number;
  units_per_row: number;
  units_per_meter: number;
  material_used_meters: number;
  waste_meters: number;
  total_cost: number;
  unit_cost: number;
  sale_price: number;
  total_price: number;
  profit_margin: number;
  custom_image_url: string | null;
  pantone_1: string | null;
  pantone_2: string | null;
  pantone_3: string | null;
  pantone_1_hex: string | null;
  pantone_2_hex: string | null;
  pantone_3_hex: string | null;
  technical_notes: string;
  created_at: string;
  updated_at: string;
}

export interface WorkOrder {
  id: string;
  os_number: string;
  quote_id: string | null;
  company_id: string;
  salesperson_id: string;
  carrier_id: string | null;
  status: WorkOrderStatus;
  workflow_stage: WorkflowStage;
  issue_date: string;
  deadline: string;
  production_notes: string;
  internal_notes: string;
  created_at: string;
  updated_at: string;
}

export interface WorkOrderItem {
  id: string;
  work_order_id: string;
  finished_product_id: string | null;
  raw_product_id: string | null;
  description: string;
  quantity: number;
  width_mm: number;
  height_mm: number;
  units_per_row: number;
  units_per_meter: number;
  material_used_meters: number;
  waste_meters: number;
  setup_notes: string;
  custom_image_url: string | null;
  pantone_1: string | null;
  pantone_2: string | null;
  pantone_3: string | null;
  pantone_1_hex: string | null;
  pantone_2_hex: string | null;
  pantone_3_hex: string | null;
  technical_notes: string;
  created_at: string;
  updated_at: string;
}

export interface SystemSettings {
  id: string;
  company_name: string;
  document_footer: string;
  default_quote_validity_days: number;
  default_waste_percentage: number;
  created_at: string;
  updated_at: string;
}
