// ============================================
// LabelFlow - Sistema de Gráfica de Etiquetas
// Definição de tipos e interfaces
// ============================================

// Enums
export type UserProfile = 'admin' | 'vendas' | 'producao' | 'fiscal' | 'impressao';

export type MaterialType = 'couche' | 'termica' | 'nylon' | 'outro';
export type Finishing = 'fosco' | 'brilho' | 'outro';
export type BaseColor = 'branco' | 'transparente' | 'outro';
export type StockStatus = 'em_estoque' | 'reservada' | 'consumida';
export type BladeType = 'reta' | 'bolinha' | 'outro';

export type QuoteStatus = 'rascunho' | 'enviado' | 'aprovado' | 'perdido';

export type ProductionStatus = 
  | 'criado'
  | 'em_fila'
  | 'em_impressao'
  | 'rebobinagem'
  | 'acabamento'
  | 'qualidade'
  | 'pronto_para_nf'
  | 'nf_emitida'
  | 'entregue';

// Interfaces
export interface Client {
  id: string;
  nome_fantasia: string;
  razao_social: string;
  cnpj: string;
  contato_nome: string;
  telefone: string;
  email: string;
  endereco: string;
  observacoes: string;
  created_at: string;
  updated_at: string;
}

export interface RawMaterial {
  id: string;
  nome: string;
  tipo: MaterialType;
  acabamento: Finishing;
  cor_base: BaseColor;
  largura_mm: number;
  comprimento_m: number;
  gramatura?: number;
  lote: string;
  fornecedor: string;
  custo_total: number;
  custo_por_m: number; // calculated
  estoque_status: StockStatus;
  saldo_m: number;
  observacoes: string;
  created_at: string;
  updated_at: string;
}

export interface FinishedProduct {
  id: string;
  nome: string;
  material_requerido: MaterialType;
  largura_mm: number;
  altura_mm: number;
  metragem_por_rolo_m: number;
  quantidade_por_rolo?: number;
  acabamento: Finishing;
  cor_base: BaseColor;
  faca_01: BladeType;
  faca_02?: BladeType;
  pantone_1: string;
  pantone_2: string;
  pantone_3: string;
  anilox_1: string;
  anilox_2: string;
  anilox_3: string;
  chapado: boolean;
  preco_base?: number;
  observacoes: string;
  created_at: string;
  updated_at: string;
}

export interface QuoteItem {
  id: string;
  produto_acabado_id: string;
  produto_acabado?: FinishedProduct;
  descricao: string;
  qtd_rolos: number;
  metragem_total_m: number;
  valor_unit: number;
  valor_total: number;
  bobina_id?: string;
  yield_snapshot?: YieldSnapshot;
}

export interface Quote {
  id: string;
  numero: string;
  data: string;
  cliente_id: string;
  cliente?: Client;
  vendedor_nome: string;
  itens: QuoteItem[];
  prazo_entrega_dias?: number;
  data_prevista_saida?: string;
  desconto: number;
  impostos: number;
  valor_final: number;
  status: QuoteStatus;
  observacoes?: string;
  created_at: string;
  updated_at: string;
}

export interface YieldSnapshot {
  largura_bobina_mm: number;
  largura_produto_mm: number;
  metragem_por_rolo_m: number;
  quantidade_rolos: number;
  margem_corte_mm: number;
  perdas_percent: number;
  pistas: number;
  eficiencia_percent: number;
  desperdicio_mm: number;
  metragem_total_final_m: number;
  metragem_bobina_consumida_m: number;
  metragem_bobina_teorica_m: number;
  metragem_bobina_com_perdas_m: number;
  custo_estimado: number;
  bobina_id: string;
  bobina_nome: string;
  data_calculo: string;
  usuario: string;
}

export interface YieldCalculatorOutput {
  pistas: number;
  eficiencia_percent: number;
  desperdicio_mm: number;
  metragem_total_final_m: number;
  metragem_bobina_teorica_m: number;
  metragem_bobina_com_perdas_m: number;
  custo_estimado: number;
  erro?: string;
}

export interface ServiceOrderLog {
  id: string;
  timestamp: string;
  usuario: string;
  acao: string;
  detalhes: string;
}

export interface ServiceOrder {
  id: string;
  numero_os: string;
  cliente_id: string;
  cliente?: Client;
  vendedor_nome: string;
  impressor_nome: string;
  data_entrada: string;
  prazo_saida_ate: string;
  data_saida?: string;
  
  // Pedido
  nome_pedido: string;
  faca_01: BladeType;
  faca_02?: BladeType;
  medida_material_mm: string;
  material: string;
  amostra: string;
  
  // Cores/Pantones
  pantone_01: string;
  pantone_02: string;
  pantone_03: string;
  
  // Anilox
  anilox_01: string;
  anilox_02: string;
  anilox_03: string;
  chapado: boolean;
  
  // Quantidades
  impressao_m: number;
  rebobinagem_m: number;
  quantidade_rolos: number;
  quantidade_caixa: number;
  etiqueta_qtd?: number;
  
  // Bobina
  bobina_reservada_id?: string;
  bobina_reservada?: RawMaterial;
  usar_caixa: string;
  
  // Aproveitamento
  yield_snapshot?: YieldSnapshot;
  
  // NF
  numero_nf?: string;
  data_nf?: string;
  valor_nf?: number;
  
  observacoes_producao: string;
  status_producao: ProductionStatus;
  qualidade_ok: boolean;
  
  // Histórico
  logs: ServiceOrderLog[];
  
  created_at: string;
  updated_at: string;
}

// Utility types
export interface KanbanColumn {
  id: ProductionStatus;
  title: string;
  color: string;
}

export interface DashboardStats {
  osEmAtraso: number;
  osPorEtapa: Record<ProductionStatus, number>;
  bobinasEstoqueBaixo: number;
  orcamentosPendentes: number;
}
