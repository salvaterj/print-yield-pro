import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { 
  Company, 
  Carrier,
  RawProduct, 
  FinishedProduct, 
  Quote, 
  QuoteItem,
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
  mockSalespeople,
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
  
  // Global search
  globalSearch: string;
  setGlobalSearch: (search: string) => void;
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
    }
    
  }, [systemSettings, companies, carriers, salespeople, rawProducts, finishedProducts, quotes, quoteItems, workOrders, workOrderItems]);
  
  const [globalSearch, setGlobalSearch] = useState('');

  const newId = () => {
    return (globalThis.crypto && 'randomUUID' in globalThis.crypto)
      ? globalThis.crypto.randomUUID()
      : `${Date.now()}-${Math.random()}`.replace('.', '');
  };

  const requireSupabase = () => {
    if (!isSupabaseConfigured || !supabase) throw new Error('Supabase não está configurado');
    if (!user) throw new Error('Faça login para salvar no Supabase');
    return supabase;
  };

  const addCompany = async (input: Omit<Company, 'id' | 'created_at' | 'updated_at'>) => {
    const now = new Date().toISOString();
    const row: Company = { ...input, id: newId(), created_at: now, updated_at: now };
    setCompanies((prev) => [...prev, row]);

    try {
      const sb = requireSupabase();
      const { error } = await sb.from('companies').insert(row);
      if (error) throw error;
      return row;
    } catch (e: any) {
      setCompanies((prev) => prev.filter((c) => c.id !== row.id));
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
      if (error) throw error;
    } catch (e: any) {
      if (previous) setCompanies((prev) => prev.map((c) => (c.id === id ? previous : c)));
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
    const existingId = systemSettings?.id && systemSettings.id.length > 10 ? systemSettings.id : null;

    if (!existingId) {
      const row: SystemSettings = { ...input, id: newId(), created_at: now, updated_at: now };
      setSystemSettings(row);
      try {
        const sb = requireSupabase();
        const { error } = await sb.from('system_settings').insert(row);
        if (error) throw error;
        return row;
      } catch (e: any) {
        throw new Error(e?.message || 'Falha ao salvar configurações');
      }
    }

    const next: SystemSettings = { ...systemSettings, ...input, updated_at: now };
    setSystemSettings(next);
    try {
      const sb = requireSupabase();
      const { error } = await sb.from('system_settings').update({ ...input, updated_at: now }).eq('id', existingId);
      if (error) throw error;
      return next;
    } catch (e: any) {
      throw new Error(e?.message || 'Falha ao salvar configurações');
    }
  };

  const getSalespersonByCompanyId = (companyId: string) => {
    const company = companies.find(c => c.id === companyId);
    if (!company?.salesperson_id) return undefined;
    return salespeople.find(s => s.id === company.salesperson_id);
  };

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
      saveSystemSettings,
      getSalespersonByCompanyId,
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
