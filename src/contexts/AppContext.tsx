import React, { createContext, useContext, useState, ReactNode, useEffect, useMemo } from 'react';
import { 
  Company, 
  Carrier,
  RawProduct, 
  FinishedProduct, 
  FinishedProductEntry,
  ProductionRecord,
  Quote, 
  QuoteItem,
  RawMaterialEntry,
  StockAdjustment,
  UserProfile,
  WorkOrderStatus,
  WorkOrder,
  WorkOrderItem,
  Salesperson,
  SystemSettings
} from '@/types';
import { 
  mockCompanies, 
  mockCarriers,
  mockQuoteItems,
  mockRawProducts, 
  mockFinishedProducts, 
  mockQuotes, 
  mockWorkOrders,
  mockWorkOrderItems,
  mockFinishedProductEntries,
  mockProductionRecords,
  mockRawMaterialEntries,
  mockSalespeople,
  mockStockAdjustments,
  mockSystemSettings
} from '@/data/mockData';

import { isSupabaseConfigured, supabase } from '@/lib/supabaseClient';
import { loadStoredData, storageKeys } from '@/lib/appStorage';
import { useAuth } from '@/contexts/AuthContext';

interface AppContextType {
  // User profile simulation
  currentProfile: UserProfile;
  setCurrentProfile: (profile: UserProfile) => void;
  
  // Data
  systemSettings: SystemSettings;
  setSystemSettings: React.Dispatch<React.SetStateAction<SystemSettings>>;

  companies: Company[];
  setCompanies: React.Dispatch<React.SetStateAction<Company[]>>;
  carriers: Carrier[];
  setCarriers: React.Dispatch<React.SetStateAction<Carrier[]>>;
  salespeople: Salesperson[];
  setSalespeople: React.Dispatch<React.SetStateAction<Salesperson[]>>;

  rawProducts: RawProduct[];
  setRawProducts: React.Dispatch<React.SetStateAction<RawProduct[]>>;
  finishedProducts: FinishedProduct[];
  setFinishedProducts: React.Dispatch<React.SetStateAction<FinishedProduct[]>>;
  quotes: Quote[];
  setQuotes: React.Dispatch<React.SetStateAction<Quote[]>>;
  quoteItems: QuoteItem[];
  setQuoteItems: React.Dispatch<React.SetStateAction<QuoteItem[]>>;

  workOrders: WorkOrder[];
  setWorkOrders: React.Dispatch<React.SetStateAction<WorkOrder[]>>;
  workOrderItems: WorkOrderItem[];
  setWorkOrderItems: React.Dispatch<React.SetStateAction<WorkOrderItem[]>>;

  rawMaterialEntries: RawMaterialEntry[];
  setRawMaterialEntries: React.Dispatch<React.SetStateAction<RawMaterialEntry[]>>;
  productionRecords: ProductionRecord[];
  setProductionRecords: React.Dispatch<React.SetStateAction<ProductionRecord[]>>;
  finishedProductEntries: FinishedProductEntry[];
  setFinishedProductEntries: React.Dispatch<React.SetStateAction<FinishedProductEntry[]>>;
  stockAdjustments: StockAdjustment[];
  setStockAdjustments: React.Dispatch<React.SetStateAction<StockAdjustment[]>>;
  
  // CRUD helpers
  addCompany: (company: Omit<Company, 'id' | 'created_at' | 'updated_at'>) => Promise<Company>;
  updateCompany: (id: string, company: Partial<Omit<Company, 'id' | 'created_at'>>) => Promise<void>;
  deleteCompany: (id: string) => Promise<void>;

  addCarrier: (carrier: Omit<Carrier, 'id' | 'created_at' | 'updated_at'>) => Promise<Carrier>;
  updateCarrier: (id: string, carrier: Partial<Omit<Carrier, 'id' | 'created_at'>>) => Promise<void>;
  deleteCarrier: (id: string) => Promise<void>;

  addSalesperson: (salesperson: Omit<Salesperson, 'id' | 'created_at' | 'updated_at'>) => Promise<Salesperson>;
  updateSalesperson: (id: string, salesperson: Partial<Omit<Salesperson, 'id' | 'created_at'>>) => Promise<void>;
  deleteSalesperson: (id: string) => Promise<void>;
  
  addRawProduct: (rawProduct: Omit<RawProduct, 'id' | 'created_at' | 'updated_at'>) => Promise<RawProduct>;
  updateRawProduct: (id: string, rawProduct: Partial<Omit<RawProduct, 'id' | 'created_at'>>) => Promise<void>;
  deleteRawProduct: (id: string) => Promise<void>;
  
  addFinishedProduct: (finishedProduct: Omit<FinishedProduct, 'id' | 'created_at' | 'updated_at'>) => Promise<FinishedProduct>;
  updateFinishedProduct: (id: string, finishedProduct: Partial<Omit<FinishedProduct, 'id' | 'created_at'>>) => Promise<void>;
  deleteFinishedProduct: (id: string) => Promise<void>;
  
  addQuote: (quote: Omit<Quote, 'id' | 'created_at' | 'updated_at'>) => Promise<Quote>;
  updateQuote: (id: string, quote: Partial<Omit<Quote, 'id' | 'created_at'>>) => Promise<void>;
  deleteQuote: (id: string) => Promise<void>;

  addQuoteItem: (quoteItem: Omit<QuoteItem, 'id' | 'created_at' | 'updated_at'>) => Promise<QuoteItem>;
  updateQuoteItem: (id: string, quoteItem: Partial<Omit<QuoteItem, 'id' | 'created_at'>>) => Promise<void>;
  deleteQuoteItem: (id: string) => Promise<void>;

  addWorkOrder: (workOrder: Omit<WorkOrder, 'id' | 'created_at' | 'updated_at'>) => Promise<WorkOrder>;
  updateWorkOrder: (id: string, workOrder: Partial<Omit<WorkOrder, 'id' | 'created_at'>>) => Promise<void>;
  updateWorkOrderStatus: (id: string, status: WorkOrderStatus) => Promise<void>;
  deleteWorkOrder: (id: string) => Promise<void>;

  addWorkOrderItem: (workOrderItem: Omit<WorkOrderItem, 'id' | 'created_at' | 'updated_at'>) => Promise<WorkOrderItem>;
  updateWorkOrderItem: (id: string, workOrderItem: Partial<Omit<WorkOrderItem, 'id' | 'created_at'>>) => Promise<void>;
  deleteWorkOrderItem: (id: string) => Promise<void>;

  saveSystemSettings: (settings: Omit<SystemSettings, 'id' | 'created_at' | 'updated_at'>) => Promise<SystemSettings>;

  getSalespersonByCompanyId: (companyId: string) => Salesperson | undefined;
  
  generateNextCompanyCode: () => string;
  
  // Global search
  globalSearch: string;
  setGlobalSearch: (search: string) => void;

  addRawMaterialEntry: (entry: Omit<RawMaterialEntry, 'id' | 'kind' | 'created_at' | 'updated_at'>) => Promise<RawMaterialEntry>;
  updateRawMaterialEntry: (id: string, entry: Partial<Omit<RawMaterialEntry, 'id' | 'kind' | 'created_at'>>) => Promise<void>;
  deleteRawMaterialEntry: (id: string) => Promise<void>;

  addProductionRecord: (record: Omit<ProductionRecord, 'id' | 'kind' | 'created_at' | 'updated_at'>) => Promise<ProductionRecord>;
  updateProductionRecord: (id: string, record: Partial<Omit<ProductionRecord, 'id' | 'kind' | 'created_at'>>) => Promise<void>;
  deleteProductionRecord: (id: string) => Promise<void>;

  addFinishedProductEntry: (entry: Omit<FinishedProductEntry, 'id' | 'kind' | 'created_at' | 'updated_at'>) => Promise<FinishedProductEntry>;
  updateFinishedProductEntry: (id: string, entry: Partial<Omit<FinishedProductEntry, 'id' | 'kind' | 'created_at'>>) => Promise<void>;
  deleteFinishedProductEntry: (id: string) => Promise<void>;

  addStockAdjustment: (adjustment: Omit<StockAdjustment, 'id' | 'kind' | 'created_at' | 'updated_at'>) => Promise<StockAdjustment>;
  updateStockAdjustment: (id: string, adjustment: Partial<Omit<StockAdjustment, 'id' | 'kind' | 'created_at'>>) => Promise<void>;
  deleteStockAdjustment: (id: string) => Promise<void>;

  getRawStockById: (rawProductId: string) => { meters: number; rolls: number; avg_cost_per_meter: number; stock_value: number };
  getFinishedStockById: (finishedProductId: string) => { units: number; avg_cost_per_unit: number; stock_value: number };
  getStockTotals: () => { total_value: number; negative_count: number };
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [currentProfile, setCurrentProfile] = useState<UserProfile>('admin');
  
  const [systemSettings, setSystemSettings] = useState<SystemSettings>(() => loadStoredData(storageKeys.systemSettings, mockSystemSettings));
  const [companies, setCompanies] = useState<Company[]>(() => loadStoredData(storageKeys.companies, mockCompanies));
  const [carriers, setCarriers] = useState<Carrier[]>(() => loadStoredData(storageKeys.carriers, mockCarriers));
  const [salespeople, setSalespeople] = useState<Salesperson[]>(() => loadStoredData(storageKeys.salespeople, mockSalespeople));

  const [rawProducts, setRawProducts] = useState<RawProduct[]>(() => loadStoredData(storageKeys.rawProducts, mockRawProducts));
  const [finishedProducts, setFinishedProducts] = useState<FinishedProduct[]>(() => loadStoredData(storageKeys.finishedProducts, mockFinishedProducts));
  const [quotes, setQuotes] = useState<Quote[]>(() => loadStoredData(storageKeys.quotes, mockQuotes));
  const [quoteItems, setQuoteItems] = useState<QuoteItem[]>(() => loadStoredData(storageKeys.quoteItems, mockQuoteItems));

  const [workOrders, setWorkOrders] = useState<WorkOrder[]>(() => loadStoredData(storageKeys.workOrders, mockWorkOrders));
  const [workOrderItems, setWorkOrderItems] = useState<WorkOrderItem[]>(() => loadStoredData(storageKeys.workOrderItems, mockWorkOrderItems));

  const [rawMaterialEntries, setRawMaterialEntries] = useState<RawMaterialEntry[]>(() =>
    loadStoredData(storageKeys.rawMaterialEntries, isSupabaseConfigured ? [] : mockRawMaterialEntries)
  );
  const [productionRecords, setProductionRecords] = useState<ProductionRecord[]>(() =>
    loadStoredData(storageKeys.productionRecords, isSupabaseConfigured ? [] : mockProductionRecords)
  );
  const [finishedProductEntries, setFinishedProductEntries] = useState<FinishedProductEntry[]>(() =>
    loadStoredData(storageKeys.finishedProductEntries, isSupabaseConfigured ? [] : mockFinishedProductEntries)
  );
  const [stockAdjustments, setStockAdjustments] = useState<StockAdjustment[]>(() =>
    loadStoredData(storageKeys.stockAdjustments, isSupabaseConfigured ? [] : mockStockAdjustments)
  );

  useEffect(() => {
    if (!isSupabaseConfigured || !supabase || !user) return;

    let cancelled = false;

    (async () => {
      const [
        systemSettingsRes,
        companiesRes,
        carriersRes,
        salespeopleRes,
        rawProductsRes,
        finishedProductsRes,
        quotesRes,
        quoteItemsRes,
        workOrdersRes,
        workOrderItemsRes,
      ] = await Promise.all([
        supabase.from('system_settings').select('*').order('created_at', { ascending: false }).limit(1).maybeSingle(),
        supabase.from('companies').select('*').order('created_at', { ascending: true }),
        supabase.from('carriers').select('*').order('created_at', { ascending: true }),
        supabase.from('salespeople').select('*').order('created_at', { ascending: true }),
        supabase.from('raw_products').select('*').order('created_at', { ascending: true }),
        supabase.from('finished_products').select('*').order('created_at', { ascending: true }),
        supabase.from('quotes').select('*').order('created_at', { ascending: true }),
        supabase.from('quote_items').select('*').order('created_at', { ascending: true }),
        supabase.from('work_orders').select('*').order('created_at', { ascending: true }),
        supabase.from('work_order_items').select('*').order('created_at', { ascending: true }),
      ]);

      if (cancelled) return;

      if (systemSettingsRes.data) setSystemSettings(systemSettingsRes.data as SystemSettings);
      if (companiesRes.data) setCompanies(companiesRes.data as Company[]);
      if (carriersRes.data) setCarriers(carriersRes.data as Carrier[]);
      if (salespeopleRes.data) setSalespeople(salespeopleRes.data as Salesperson[]);
      if (rawProductsRes.data) setRawProducts(rawProductsRes.data as RawProduct[]);
      if (finishedProductsRes.data) setFinishedProducts(finishedProductsRes.data as FinishedProduct[]);
      if (quotesRes.data) setQuotes(quotesRes.data as Quote[]);
      if (quoteItemsRes.data) setQuoteItems(quoteItemsRes.data as QuoteItem[]);
      if (workOrdersRes.data) setWorkOrders(workOrdersRes.data as WorkOrder[]);
      if (workOrderItemsRes.data) setWorkOrderItems(workOrderItemsRes.data as WorkOrderItem[]);
    })();

    return () => {
      cancelled = true;
    };
  }, [user]);

  useEffect(() => {
    const validRaw = new Set(rawProducts.map((rp) => rp.id));
    const validFinished = new Set(finishedProducts.map((fp) => fp.id));

    setRawMaterialEntries((prev) => {
      const next = prev.filter((e) => validRaw.has(e.raw_product_id));
      return next.length === prev.length ? prev : next;
    });

    setProductionRecords((prev) => {
      const next = prev.filter((e) => validRaw.has(e.raw_product_id) && validFinished.has(e.finished_product_id));
      return next.length === prev.length ? prev : next;
    });

    setFinishedProductEntries((prev) => {
      const next = prev.filter((e) => validFinished.has(e.finished_product_id));
      return next.length === prev.length ? prev : next;
    });

    setStockAdjustments((prev) => {
      const next = prev.filter((e) => {
        if (e.target === 'raw') return !!e.raw_product_id && validRaw.has(e.raw_product_id);
        if (e.target === 'finished') return !!e.finished_product_id && validFinished.has(e.finished_product_id);
        return false;
      });
      return next.length === prev.length ? prev : next;
    });
  }, [finishedProducts, rawProducts]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(storageKeys.systemSettings, JSON.stringify(systemSettings));
      window.localStorage.setItem(storageKeys.companies, JSON.stringify(companies));
      window.localStorage.setItem(storageKeys.carriers, JSON.stringify(carriers));
      window.localStorage.setItem(storageKeys.salespeople, JSON.stringify(salespeople));
      window.localStorage.setItem(storageKeys.rawProducts, JSON.stringify(rawProducts));
      window.localStorage.setItem(storageKeys.finishedProducts, JSON.stringify(finishedProducts));
      window.localStorage.setItem(storageKeys.quotes, JSON.stringify(quotes));
      window.localStorage.setItem(storageKeys.quoteItems, JSON.stringify(quoteItems));
      window.localStorage.setItem(storageKeys.workOrders, JSON.stringify(workOrders));
      window.localStorage.setItem(storageKeys.workOrderItems, JSON.stringify(workOrderItems));
      window.localStorage.setItem(storageKeys.rawMaterialEntries, JSON.stringify(rawMaterialEntries));
      window.localStorage.setItem(storageKeys.productionRecords, JSON.stringify(productionRecords));
      window.localStorage.setItem(storageKeys.finishedProductEntries, JSON.stringify(finishedProductEntries));
      window.localStorage.setItem(storageKeys.stockAdjustments, JSON.stringify(stockAdjustments));
    }
    
  }, [
    systemSettings,
    companies,
    carriers,
    salespeople,
    rawProducts,
    finishedProducts,
    quotes,
    quoteItems,
    workOrders,
    workOrderItems,
    rawMaterialEntries,
    productionRecords,
    finishedProductEntries,
    stockAdjustments,
  ]);
  
  const [globalSearch, setGlobalSearch] = useState('');

  const newId = () => {
    return (globalThis.crypto && 'randomUUID' in globalThis.crypto)
      ? globalThis.crypto.randomUUID()
      : `${Date.now()}-${Math.random()}`.replace('.', '');
  };

  const isUuid = (value: string) => {
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
  };

  const requireSupabase = () => {
    if (!isSupabaseConfigured || !supabase) throw new Error('Supabase não está configurado');
    if (!user) throw new Error('Faça login para salvar no Supabase');
    return supabase;
  };

  const addCompany = async (input: Omit<Company, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const sb = requireSupabase();
      const { data, error } = await sb.from('companies').insert(input).select('*').single();
      if (error) {
        console.error('[Supabase] Erro ao adicionar empresa:', error);
        throw error;
      }
      const row = data as Company;
      setCompanies((prev) => [...prev, row]);
      return row;
    } catch (e: any) {
      console.error('[AppContext] Falha ao salvar cliente:', e);
      throw new Error(e?.message || 'Falha ao salvar cliente');
    }
  };

  const updateCompany = async (id: string, updates: Partial<Omit<Company, 'id' | 'created_at'>>) => {
    const previous = companies.find((c) => c.id === id);
    const now = new Date().toISOString();
    setCompanies((prev) => prev.map((c) => (c.id === id ? { ...c, ...updates, updated_at: now } : c)));

    try {
      const sb = requireSupabase();
      const { error } = await sb.from('companies').update({ ...updates, updated_at: now }).eq('id', id);
      if (error) {
        console.error('[Supabase] Erro ao atualizar empresa:', error);
        throw error;
      }
    } catch (e: any) {
      if (previous) setCompanies((prev) => prev.map((c) => (c.id === id ? previous : c)));
      console.error('[AppContext] Falha ao atualizar cliente:', e);
      throw new Error(e?.message || 'Falha ao atualizar cliente');
    }
  };

  const deleteCompany = async (id: string) => {
    const previous = companies.find((c) => c.id === id);
    setCompanies((prev) => prev.filter((c) => c.id !== id));

    try {
      const sb = requireSupabase();
      const { error } = await sb.from('companies').delete().eq('id', id);
      if (error) throw error;
    } catch (e: any) {
      if (previous) setCompanies((prev) => [...prev, previous]);
      throw new Error(e?.message || 'Falha ao excluir cliente');
    }
  };

  const addCarrier = async (input: Omit<Carrier, 'id' | 'created_at' | 'updated_at'>) => {
    const now = new Date().toISOString();
    const row: Carrier = { ...input, id: newId(), created_at: now, updated_at: now };
    setCarriers((prev) => [...prev, row]);

    try {
      const sb = requireSupabase();
      const { error } = await sb.from('carriers').insert(row);
      if (error) throw error;
      return row;
    } catch (e: any) {
      setCarriers((prev) => prev.filter((c) => c.id !== row.id));
      throw new Error(e?.message || 'Falha ao salvar transportadora');
    }
  };

  const updateCarrier = async (id: string, updates: Partial<Omit<Carrier, 'id' | 'created_at'>>) => {
    const previous = carriers.find((c) => c.id === id);
    const now = new Date().toISOString();
    setCarriers((prev) => prev.map((c) => (c.id === id ? { ...c, ...updates, updated_at: now } : c)));

    try {
      const sb = requireSupabase();
      const { error } = await sb.from('carriers').update({ ...updates, updated_at: now }).eq('id', id);
      if (error) throw error;
    } catch (e: any) {
      if (previous) setCarriers((prev) => prev.map((c) => (c.id === id ? previous : c)));
      throw new Error(e?.message || 'Falha ao atualizar transportadora');
    }
  };

  const deleteCarrier = async (id: string) => {
    const previous = carriers.find((c) => c.id === id);
    setCarriers((prev) => prev.filter((c) => c.id !== id));

    try {
      const sb = requireSupabase();
      const { error } = await sb.from('carriers').delete().eq('id', id);
      if (error) throw error;
    } catch (e: any) {
      if (previous) setCarriers((prev) => [...prev, previous]);
      throw new Error(e?.message || 'Falha ao excluir transportadora');
    }
  };

  const addSalesperson = async (input: Omit<Salesperson, 'id' | 'created_at' | 'updated_at'>) => {
    const now = new Date().toISOString();
    const row: Salesperson = { ...input, id: newId(), created_at: now, updated_at: now };
    setSalespeople((prev) => [...prev, row]);

    try {
      const sb = requireSupabase();
      const { error } = await sb.from('salespeople').insert(row);
      if (error) throw error;
      return row;
    } catch (e: any) {
      setSalespeople((prev) => prev.filter((s) => s.id !== row.id));
      throw new Error(e?.message || 'Falha ao salvar vendedor');
    }
  };

  const updateSalesperson = async (id: string, updates: Partial<Omit<Salesperson, 'id' | 'created_at'>>) => {
    const previous = salespeople.find((s) => s.id === id);
    const now = new Date().toISOString();
    setSalespeople((prev) => prev.map((s) => (s.id === id ? { ...s, ...updates, updated_at: now } : s)));

    try {
      const sb = requireSupabase();
      const { error } = await sb.from('salespeople').update({ ...updates, updated_at: now }).eq('id', id);
      if (error) throw error;
    } catch (e: any) {
      if (previous) setSalespeople((prev) => prev.map((s) => (s.id === id ? previous : s)));
      throw new Error(e?.message || 'Falha ao atualizar vendedor');
    }
  };

  const deleteSalesperson = async (id: string) => {
    const previous = salespeople.find((s) => s.id === id);
    setSalespeople((prev) => prev.filter((s) => s.id !== id));

    try {
      const sb = requireSupabase();
      const { error } = await sb.from('salespeople').delete().eq('id', id);
      if (error) throw error;
    } catch (e: any) {
      if (previous) setSalespeople((prev) => [...prev, previous]);
      throw new Error(e?.message || 'Falha ao excluir vendedor');
    }
  };

  const addRawProduct = async (input: Omit<RawProduct, 'id' | 'created_at' | 'updated_at'>) => {
    const now = new Date().toISOString();
    const row: RawProduct = { ...input, id: newId(), created_at: now, updated_at: now };
    setRawProducts((prev) => [...prev, row]);

    try {
      const sb = requireSupabase();
      const { error } = await sb.from('raw_products').insert(row);
      if (error) throw error;
      return row;
    } catch (e: any) {
      setRawProducts((prev) => prev.filter((rp) => rp.id !== row.id));
      throw new Error(e?.message || 'Falha ao salvar bobina');
    }
  };

  const updateRawProduct = async (id: string, updates: Partial<Omit<RawProduct, 'id' | 'created_at'>>) => {
    const previous = rawProducts.find((rp) => rp.id === id);
    const now = new Date().toISOString();
    setRawProducts((prev) => prev.map((rp) => (rp.id === id ? { ...rp, ...updates, updated_at: now } : rp)));

    try {
      const sb = requireSupabase();
      const { error } = await sb.from('raw_products').update({ ...updates, updated_at: now }).eq('id', id);
      if (error) throw error;
    } catch (e: any) {
      if (previous) setRawProducts((prev) => prev.map((rp) => (rp.id === id ? previous : rp)));
      throw new Error(e?.message || 'Falha ao atualizar bobina');
    }
  };

  const deleteRawProduct = async (id: string) => {
    const previous = rawProducts.find((rp) => rp.id === id);
    setRawProducts((prev) => prev.filter((rp) => rp.id !== id));

    try {
      const sb = requireSupabase();
      const { error } = await sb.from('raw_products').delete().eq('id', id);
      if (error) throw error;
    } catch (e: any) {
      if (previous) setRawProducts((prev) => [...prev, previous]);
      throw new Error(e?.message || 'Falha ao excluir bobina');
    }
  };

  const addFinishedProduct = async (input: Omit<FinishedProduct, 'id' | 'created_at' | 'updated_at'>) => {
    const now = new Date().toISOString();
    const row: FinishedProduct = { ...input, id: newId(), created_at: now, updated_at: now };
    setFinishedProducts((prev) => [...prev, row]);

    try {
      const sb = requireSupabase();
      const { error } = await sb.from('finished_products').insert(row);
      if (error) throw error;
      return row;
    } catch (e: any) {
      setFinishedProducts((prev) => prev.filter((fp) => fp.id !== row.id));
      throw new Error(e?.message || 'Falha ao salvar produto');
    }
  };

  const updateFinishedProduct = async (id: string, updates: Partial<Omit<FinishedProduct, 'id' | 'created_at'>>) => {
    const previous = finishedProducts.find((fp) => fp.id === id);
    const now = new Date().toISOString();
    setFinishedProducts((prev) => prev.map((fp) => (fp.id === id ? { ...fp, ...updates, updated_at: now } : fp)));

    try {
      const sb = requireSupabase();
      const { error } = await sb.from('finished_products').update({ ...updates, updated_at: now }).eq('id', id);
      if (error) throw error;
    } catch (e: any) {
      if (previous) setFinishedProducts((prev) => prev.map((fp) => (fp.id === id ? previous : fp)));
      throw new Error(e?.message || 'Falha ao atualizar produto');
    }
  };

  const deleteFinishedProduct = async (id: string) => {
    const previous = finishedProducts.find((fp) => fp.id === id);
    setFinishedProducts((prev) => prev.filter((fp) => fp.id !== id));

    try {
      const sb = requireSupabase();
      const { error } = await sb.from('finished_products').delete().eq('id', id);
      if (error) throw error;
    } catch (e: any) {
      if (previous) setFinishedProducts((prev) => [...prev, previous]);
      throw new Error(e?.message || 'Falha ao excluir produto');
    }
  };

  const addQuote = async (input: Omit<Quote, 'id' | 'created_at' | 'updated_at'>) => {
    const now = new Date().toISOString();
    const row: Quote = { ...input, id: newId(), created_at: now, updated_at: now };
    setQuotes((prev) => [...prev, row]);

    try {
      const sb = requireSupabase();
      const { error } = await sb.from('quotes').insert(row);
      if (error) throw error;
      return row;
    } catch (e: any) {
      setQuotes((prev) => prev.filter((q) => q.id !== row.id));
      throw new Error(e?.message || 'Falha ao salvar orçamento');
    }
  };

  const updateQuote = async (id: string, updates: Partial<Omit<Quote, 'id' | 'created_at'>>) => {
    const previous = quotes.find((q) => q.id === id);
    const now = new Date().toISOString();
    setQuotes((prev) => prev.map((q) => (q.id === id ? { ...q, ...updates, updated_at: now } : q)));

    try {
      const sb = requireSupabase();
      const { error } = await sb.from('quotes').update({ ...updates, updated_at: now }).eq('id', id);
      if (error) throw error;
    } catch (e: any) {
      if (previous) setQuotes((prev) => prev.map((q) => (q.id === id ? previous : q)));
      throw new Error(e?.message || 'Falha ao atualizar orçamento');
    }
  };

  const deleteQuote = async (id: string) => {
    const previous = quotes.find((q) => q.id === id);
    const previousItems = quoteItems.filter((qi) => qi.quote_id === id);
    setQuotes((prev) => prev.filter((q) => q.id !== id));
    setQuoteItems((prev) => prev.filter((qi) => qi.quote_id !== id));

    try {
      const sb = requireSupabase();
      const { error } = await sb.from('quotes').delete().eq('id', id);
      if (error) throw error;
    } catch (e: any) {
      if (previous) setQuotes((prev) => [...prev, previous]);
      if (previousItems.length) setQuoteItems((prev) => [...prev, ...previousItems]);
      throw new Error(e?.message || 'Falha ao excluir orçamento');
    }
  };

  const addQuoteItem = async (input: Omit<QuoteItem, 'id' | 'created_at' | 'updated_at'>) => {
    const now = new Date().toISOString();
    const row: QuoteItem = { ...input, id: newId(), created_at: now, updated_at: now };
    setQuoteItems((prev) => [...prev, row]);

    try {
      const sb = requireSupabase();
      const { error } = await sb.from('quote_items').insert(row);
      if (error) throw error;
      return row;
    } catch (e: any) {
      setQuoteItems((prev) => prev.filter((qi) => qi.id !== row.id));
      throw new Error(e?.message || 'Falha ao salvar item do orçamento');
    }
  };

  const updateQuoteItem = async (id: string, updates: Partial<Omit<QuoteItem, 'id' | 'created_at'>>) => {
    const previous = quoteItems.find((qi) => qi.id === id);
    const now = new Date().toISOString();
    setQuoteItems((prev) => prev.map((qi) => (qi.id === id ? { ...qi, ...updates, updated_at: now } : qi)));

    try {
      const sb = requireSupabase();
      const { error } = await sb.from('quote_items').update({ ...updates, updated_at: now }).eq('id', id);
      if (error) throw error;
    } catch (e: any) {
      if (previous) setQuoteItems((prev) => prev.map((qi) => (qi.id === id ? previous : qi)));
      throw new Error(e?.message || 'Falha ao atualizar item do orçamento');
    }
  };

  const deleteQuoteItem = async (id: string) => {
    const previous = quoteItems.find((qi) => qi.id === id);
    setQuoteItems((prev) => prev.filter((qi) => qi.id !== id));

    try {
      const sb = requireSupabase();
      const { error } = await sb.from('quote_items').delete().eq('id', id);
      if (error) throw error;
    } catch (e: any) {
      if (previous) setQuoteItems((prev) => [...prev, previous]);
      throw new Error(e?.message || 'Falha ao excluir item do orçamento');
    }
  };

  const addWorkOrder = async (input: Omit<WorkOrder, 'id' | 'created_at' | 'updated_at'>) => {
    const now = new Date().toISOString();
    const row: WorkOrder = { ...input, id: newId(), created_at: now, updated_at: now };
    setWorkOrders((prev) => [...prev, row]);

    try {
      const sb = requireSupabase();
      const { error } = await sb.from('work_orders').insert(row);
      if (error) throw error;
      return row;
    } catch (e: any) {
      setWorkOrders((prev) => prev.filter((wo) => wo.id !== row.id));
      throw new Error(e?.message || 'Falha ao salvar OS');
    }
  };

  const updateWorkOrder = async (id: string, updates: Partial<Omit<WorkOrder, 'id' | 'created_at'>>) => {
    const previous = workOrders.find((wo) => wo.id === id);
    const now = new Date().toISOString();
    setWorkOrders((prev) => prev.map((wo) => (wo.id === id ? { ...wo, ...updates, updated_at: now } : wo)));

    try {
      const sb = requireSupabase();
      const { error } = await sb.from('work_orders').update({ ...updates, updated_at: now }).eq('id', id);
      if (error) throw error;
    } catch (e: any) {
      if (previous) setWorkOrders((prev) => prev.map((wo) => (wo.id === id ? previous : wo)));
      throw new Error(e?.message || 'Falha ao atualizar OS');
    }
  };

  const updateWorkOrderStatus = async (id: string, status: WorkOrderStatus) => {
    await updateWorkOrder(id, { status });
  };

  const deleteWorkOrder = async (id: string) => {
    const previous = workOrders.find((wo) => wo.id === id);
    const previousItems = workOrderItems.filter((it) => it.work_order_id === id);
    setWorkOrders((prev) => prev.filter((wo) => wo.id !== id));
    setWorkOrderItems((prev) => prev.filter((it) => it.work_order_id !== id));

    try {
      const sb = requireSupabase();
      const { error } = await sb.from('work_orders').delete().eq('id', id);
      if (error) throw error;
    } catch (e: any) {
      if (previous) setWorkOrders((prev) => [...prev, previous]);
      if (previousItems.length) setWorkOrderItems((prev) => [...prev, ...previousItems]);
      throw new Error(e?.message || 'Falha ao excluir OS');
    }
  };

  const addWorkOrderItem = async (input: Omit<WorkOrderItem, 'id' | 'created_at' | 'updated_at'>) => {
    const now = new Date().toISOString();
    const row: WorkOrderItem = { ...input, id: newId(), created_at: now, updated_at: now };
    setWorkOrderItems((prev) => [...prev, row]);

    try {
      const sb = requireSupabase();
      const { error } = await sb.from('work_order_items').insert(row);
      if (error) throw error;
      return row;
    } catch (e: any) {
      setWorkOrderItems((prev) => prev.filter((it) => it.id !== row.id));
      throw new Error(e?.message || 'Falha ao salvar item da OS');
    }
  };

  const updateWorkOrderItem = async (id: string, updates: Partial<Omit<WorkOrderItem, 'id' | 'created_at'>>) => {
    const previous = workOrderItems.find((it) => it.id === id);
    const now = new Date().toISOString();
    setWorkOrderItems((prev) => prev.map((it) => (it.id === id ? { ...it, ...updates, updated_at: now } : it)));

    try {
      const sb = requireSupabase();
      const { error } = await sb.from('work_order_items').update({ ...updates, updated_at: now }).eq('id', id);
      if (error) throw error;
    } catch (e: any) {
      if (previous) setWorkOrderItems((prev) => prev.map((it) => (it.id === id ? previous : it)));
      throw new Error(e?.message || 'Falha ao atualizar item da OS');
    }
  };

  const deleteWorkOrderItem = async (id: string) => {
    const previous = workOrderItems.find((it) => it.id === id);
    setWorkOrderItems((prev) => prev.filter((it) => it.id !== id));

    try {
      const sb = requireSupabase();
      const { error } = await sb.from('work_order_items').delete().eq('id', id);
      if (error) throw error;
    } catch (e: any) {
      if (previous) setWorkOrderItems((prev) => [...prev, previous]);
      throw new Error(e?.message || 'Falha ao excluir item da OS');
    }
  };

  const saveSystemSettings = async (input: Omit<SystemSettings, 'id' | 'created_at' | 'updated_at'>) => {
    const now = new Date().toISOString();
    const existingId = systemSettings?.id && isUuid(systemSettings.id) ? systemSettings.id : null;

    if (!existingId) {
      try {
        const sb = requireSupabase();
        const { data, error } = await sb
          .from('system_settings')
          .insert({ ...input, created_at: now, updated_at: now })
          .select('*')
          .single();
        if (error) throw error;
        const row = data as SystemSettings;
        setSystemSettings(row);
        return row;
      } catch (e: any) {
        throw new Error(e?.message || 'Falha ao salvar configurações');
      }
    }

    try {
      const sb = requireSupabase();
      const { data, error } = await sb
        .from('system_settings')
        .update({ ...input, updated_at: now })
        .eq('id', existingId)
        .select('*')
        .maybeSingle();
      if (error) throw error;

      if (!data) {
        const { data: created, error: createError } = await sb
          .from('system_settings')
          .insert({ ...input, created_at: now, updated_at: now })
          .select('*')
          .single();
        if (createError) throw createError;
        const row = created as SystemSettings;
        setSystemSettings(row);
        return row;
      }

      const row = data as SystemSettings;
      setSystemSettings(row);
      return row;
    } catch (e: any) {
      throw new Error(e?.message || 'Falha ao salvar configurações');
    }
  };

  const getSalespersonByCompanyId = (companyId: string) => {
    const company = companies.find(c => c.id === companyId);
    if (!company?.salesperson_id) return undefined;
    return salespeople.find(s => s.id === company.salesperson_id);
  };

  const generateNextCompanyCode = () => {
    if (companies.length === 0) return 'CLI-001';
    
    const codes = companies
      .map(c => c.code)
      .filter(code => code && code.startsWith('CLI-'))
      .map(code => parseInt(code.replace(/\D/g, '')))
      .filter(num => !isNaN(num) && num > 0);
    
    if (codes.length === 0) return 'CLI-001';
    
    const maxCode = Math.max(...codes);
    return `CLI-${String(maxCode + 1).padStart(3, '0')}`;
  };

  const addRawMaterialEntry = async (input: Omit<RawMaterialEntry, 'id' | 'kind' | 'created_at' | 'updated_at'>) => {
    const now = new Date().toISOString();
    const row: RawMaterialEntry = { ...input, id: newId(), kind: 'raw_entry', created_at: now, updated_at: now };
    setRawMaterialEntries((prev) => [...prev, row]);
    return row;
  };

  const updateRawMaterialEntry = async (
    id: string,
    updates: Partial<Omit<RawMaterialEntry, 'id' | 'kind' | 'created_at'>>
  ) => {
    const now = new Date().toISOString();
    setRawMaterialEntries((prev) => prev.map((it) => (it.id === id ? { ...it, ...updates, updated_at: now } : it)));
  };

  const deleteRawMaterialEntry = async (id: string) => {
    setRawMaterialEntries((prev) => prev.filter((it) => it.id !== id));
  };

  const addProductionRecord = async (input: Omit<ProductionRecord, 'id' | 'kind' | 'created_at' | 'updated_at'>) => {
    const now = new Date().toISOString();
    const row: ProductionRecord = { ...input, id: newId(), kind: 'production', created_at: now, updated_at: now };
    setProductionRecords((prev) => [...prev, row]);
    return row;
  };

  const updateProductionRecord = async (
    id: string,
    updates: Partial<Omit<ProductionRecord, 'id' | 'kind' | 'created_at'>>
  ) => {
    const now = new Date().toISOString();
    setProductionRecords((prev) => prev.map((it) => (it.id === id ? { ...it, ...updates, updated_at: now } : it)));
  };

  const deleteProductionRecord = async (id: string) => {
    setProductionRecords((prev) => prev.filter((it) => it.id !== id));
  };

  const addFinishedProductEntry = async (
    input: Omit<FinishedProductEntry, 'id' | 'kind' | 'created_at' | 'updated_at'>
  ) => {
    const now = new Date().toISOString();
    const row: FinishedProductEntry = { ...input, id: newId(), kind: 'finished_entry', created_at: now, updated_at: now };
    setFinishedProductEntries((prev) => [...prev, row]);
    return row;
  };

  const updateFinishedProductEntry = async (
    id: string,
    updates: Partial<Omit<FinishedProductEntry, 'id' | 'kind' | 'created_at'>>
  ) => {
    const now = new Date().toISOString();
    setFinishedProductEntries((prev) => prev.map((it) => (it.id === id ? { ...it, ...updates, updated_at: now } : it)));
  };

  const deleteFinishedProductEntry = async (id: string) => {
    setFinishedProductEntries((prev) => prev.filter((it) => it.id !== id));
  };

  const addStockAdjustment = async (input: Omit<StockAdjustment, 'id' | 'kind' | 'created_at' | 'updated_at'>) => {
    const now = new Date().toISOString();
    const row: StockAdjustment = { ...input, id: newId(), kind: 'adjustment', created_at: now, updated_at: now };
    setStockAdjustments((prev) => [...prev, row]);
    return row;
  };

  const updateStockAdjustment = async (
    id: string,
    updates: Partial<Omit<StockAdjustment, 'id' | 'kind' | 'created_at'>>
  ) => {
    const now = new Date().toISOString();
    setStockAdjustments((prev) => prev.map((it) => (it.id === id ? { ...it, ...updates, updated_at: now } : it)));
  };

  const deleteStockAdjustment = async (id: string) => {
    setStockAdjustments((prev) => prev.filter((it) => it.id !== id));
  };

  const stockComputed = useMemo(() => {
    type RawState = { meters: number; stockValue: number; avgCostPerMeter: number };
    type FinishedState = { units: number; stockValue: number; avgCostPerUnit: number };

    const rawLengthById = new Map(rawProducts.map((rp) => [rp.id, Number(rp.length_m) || 0]));
    const finishedUpmById = new Map(finishedProducts.map((fp) => [fp.id, Number(fp.units_per_meter) || 0]));

    const rawStateById = new Map<string, RawState>();
    const finishedStateById = new Map<string, FinishedState>();

    const getRawState = (rawId: string) => {
      const existing = rawStateById.get(rawId);
      if (existing) return existing;
      const created: RawState = { meters: 0, stockValue: 0, avgCostPerMeter: 0 };
      rawStateById.set(rawId, created);
      return created;
    };

    const getFinishedState = (finishedId: string) => {
      const existing = finishedStateById.get(finishedId);
      if (existing) return existing;
      const created: FinishedState = { units: 0, stockValue: 0, avgCostPerUnit: 0 };
      finishedStateById.set(finishedId, created);
      return created;
    };

    const applyRawIn = (rawId: string, metersIn: number, costIn: number | null) => {
      if (!Number.isFinite(metersIn) || metersIn === 0) return;
      const st = getRawState(rawId);
      const effectiveCostIn = costIn ?? metersIn * st.avgCostPerMeter;
      const nextMeters = st.meters + metersIn;
      const nextValue = st.stockValue + effectiveCostIn;
      if (nextMeters === 0) {
        st.meters = 0;
        st.stockValue = 0;
        st.avgCostPerMeter = 0;
        return;
      }
      st.meters = nextMeters;
      st.stockValue = nextValue;
      st.avgCostPerMeter = nextValue / nextMeters;
    };

    const applyRawOut = (rawId: string, metersOut: number) => {
      if (!Number.isFinite(metersOut) || metersOut === 0) return;
      const st = getRawState(rawId);
      const costOut = metersOut * st.avgCostPerMeter;
      const nextMeters = st.meters - metersOut;
      const nextValue = st.stockValue - costOut;
      if (nextMeters === 0) {
        st.meters = 0;
        st.stockValue = 0;
        st.avgCostPerMeter = 0;
        return;
      }
      st.meters = nextMeters;
      st.stockValue = nextValue;
      st.avgCostPerMeter = st.avgCostPerMeter;
    };

    const applyFinishedIn = (finishedId: string, unitsIn: number, costIn: number | null) => {
      if (!Number.isFinite(unitsIn) || unitsIn === 0) return;
      const st = getFinishedState(finishedId);
      const effectiveCostIn = costIn ?? unitsIn * st.avgCostPerUnit;
      const nextUnits = st.units + unitsIn;
      const nextValue = st.stockValue + effectiveCostIn;
      if (nextUnits === 0) {
        st.units = 0;
        st.stockValue = 0;
        st.avgCostPerUnit = 0;
        return;
      }
      st.units = nextUnits;
      st.stockValue = nextValue;
      st.avgCostPerUnit = nextValue / nextUnits;
    };

    const applyFinishedOut = (finishedId: string, unitsOut: number) => {
      if (!Number.isFinite(unitsOut) || unitsOut === 0) return;
      const st = getFinishedState(finishedId);
      const costOut = unitsOut * st.avgCostPerUnit;
      const nextUnits = st.units - unitsOut;
      const nextValue = st.stockValue - costOut;
      if (nextUnits === 0) {
        st.units = 0;
        st.stockValue = 0;
        st.avgCostPerUnit = 0;
        return;
      }
      st.units = nextUnits;
      st.stockValue = nextValue;
      st.avgCostPerUnit = st.avgCostPerUnit;
    };

    const movements = [
      ...rawMaterialEntries.map((m) => ({ kind: m.kind, date: m.date, created_at: m.created_at, id: m.id, payload: m })),
      ...productionRecords.map((m) => ({ kind: m.kind, date: m.date, created_at: m.created_at, id: m.id, payload: m })),
      ...finishedProductEntries.map((m) => ({ kind: m.kind, date: m.date, created_at: m.created_at, id: m.id, payload: m })),
      ...stockAdjustments.map((m) => ({ kind: m.kind, date: m.date, created_at: m.created_at, id: m.id, payload: m })),
    ].sort((a, b) => a.date.localeCompare(b.date) || a.created_at.localeCompare(b.created_at) || a.id.localeCompare(b.id));

    for (const move of movements) {
      if (move.kind === 'raw_entry') {
        const m = move.payload as RawMaterialEntry;
        const lengthM = rawLengthById.get(m.raw_product_id) ?? 0;
        const metersIn = (Number(m.rolls_in) || 0) * lengthM;
        applyRawIn(m.raw_product_id, metersIn, Number(m.total_cost) || 0);
        continue;
      }

      if (move.kind === 'finished_entry') {
        const m = move.payload as FinishedProductEntry;
        applyFinishedIn(m.finished_product_id, Number(m.units_in) || 0, Number(m.total_cost) || 0);
        continue;
      }

      if (move.kind === 'adjustment') {
        const m = move.payload as StockAdjustment;
        const qty = Number(m.quantity) || 0;

        if (m.target === 'raw' && m.raw_product_id) {
          const lengthM = rawLengthById.get(m.raw_product_id) ?? 0;
          const meters = qty * lengthM;
          if (m.direction === 'in') applyRawIn(m.raw_product_id, meters, m.total_cost);
          else applyRawOut(m.raw_product_id, meters);
        }

        if (m.target === 'finished' && m.finished_product_id) {
          if (m.direction === 'in') applyFinishedIn(m.finished_product_id, qty, m.total_cost);
          else applyFinishedOut(m.finished_product_id, qty);
        }

        continue;
      }

      if (move.kind === 'production') {
        const m = move.payload as ProductionRecord;
        const upm = finishedUpmById.get(m.finished_product_id) ?? 0;
        const unitsProduced = Number(m.units_produced) || 0;
        const metersConsumed = upm > 0 ? unitsProduced / upm : 0;

        const rawSt = getRawState(m.raw_product_id);
        const productionCost = metersConsumed * rawSt.avgCostPerMeter;

        applyRawOut(m.raw_product_id, metersConsumed);
        applyFinishedIn(m.finished_product_id, unitsProduced, productionCost);
      }
    }

    const rawById = new Map<string, { meters: number; rolls: number; avg_cost_per_meter: number; stock_value: number }>();
    for (const rp of rawProducts) {
      const st = rawStateById.get(rp.id);
      const meters = st?.meters ?? 0;
      const stockValue = st?.stockValue ?? 0;
      const avgCost = st?.avgCostPerMeter ?? 0;
      const lengthM = rawLengthById.get(rp.id) ?? 0;
      const rolls = lengthM > 0 ? meters / lengthM : 0;
      rawById.set(rp.id, { meters, rolls, avg_cost_per_meter: avgCost, stock_value: stockValue });
    }

    const finishedById = new Map<string, { units: number; avg_cost_per_unit: number; stock_value: number }>();
    for (const fp of finishedProducts) {
      const st = finishedStateById.get(fp.id);
      const units = st?.units ?? 0;
      const stockValue = st?.stockValue ?? 0;
      const avgCost = st?.avgCostPerUnit ?? 0;
      finishedById.set(fp.id, { units, avg_cost_per_unit: avgCost, stock_value: stockValue });
    }

    const negativeCount =
      Array.from(rawById.values()).filter((v) => v.meters < 0).length +
      Array.from(finishedById.values()).filter((v) => v.units < 0).length;

    const totalValue =
      Array.from(rawById.values()).reduce((sum, v) => sum + v.stock_value, 0) +
      Array.from(finishedById.values()).reduce((sum, v) => sum + v.stock_value, 0);

    return { rawById, finishedById, totals: { total_value: totalValue, negative_count: negativeCount } };
  }, [rawProducts, finishedProducts, rawMaterialEntries, productionRecords, finishedProductEntries, stockAdjustments]);

  const getRawStockById = (rawProductId: string) => {
    return stockComputed.rawById.get(rawProductId) ?? { meters: 0, rolls: 0, avg_cost_per_meter: 0, stock_value: 0 };
  };

  const getFinishedStockById = (finishedProductId: string) => {
    return stockComputed.finishedById.get(finishedProductId) ?? { units: 0, avg_cost_per_unit: 0, stock_value: 0 };
  };

  const getStockTotals = () => stockComputed.totals;

  return (
    <AppContext.Provider value={{
      currentProfile, setCurrentProfile,
      systemSettings, setSystemSettings,
      companies, setCompanies, addCompany, updateCompany, deleteCompany,
      carriers, setCarriers, addCarrier, updateCarrier, deleteCarrier,
      salespeople, setSalespeople, addSalesperson, updateSalesperson, deleteSalesperson,
      rawProducts, setRawProducts, addRawProduct, updateRawProduct, deleteRawProduct,
      finishedProducts, setFinishedProducts, addFinishedProduct, updateFinishedProduct, deleteFinishedProduct,
      quotes, setQuotes, addQuote, updateQuote, deleteQuote,
      quoteItems, setQuoteItems, addQuoteItem, updateQuoteItem, deleteQuoteItem,
      workOrders, setWorkOrders, addWorkOrder, updateWorkOrder, updateWorkOrderStatus, deleteWorkOrder,
      workOrderItems, setWorkOrderItems, addWorkOrderItem, updateWorkOrderItem, deleteWorkOrderItem,
      rawMaterialEntries, setRawMaterialEntries, addRawMaterialEntry, updateRawMaterialEntry, deleteRawMaterialEntry,
      productionRecords, setProductionRecords, addProductionRecord, updateProductionRecord, deleteProductionRecord,
      finishedProductEntries, setFinishedProductEntries, addFinishedProductEntry, updateFinishedProductEntry, deleteFinishedProductEntry,
      stockAdjustments, setStockAdjustments, addStockAdjustment, updateStockAdjustment, deleteStockAdjustment,
      getRawStockById,
      getFinishedStockById,
      getStockTotals,
      saveSystemSettings,
      getSalespersonByCompanyId,
      generateNextCompanyCode,
      globalSearch, setGlobalSearch
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}
