import React, { createContext, useContext, useState, ReactNode } from 'react';
import { 
  Client, 
  RawMaterial, 
  FinishedProduct, 
  Quote, 
  ServiceOrder, 
  UserProfile,
  ProductionStatus 
} from '@/types';
import { 
  mockClients, 
  mockRawMaterials, 
  mockFinishedProducts, 
  mockQuotes, 
  mockServiceOrders 
} from '@/data/mockData';

interface AppContextType {
  // User profile simulation
  currentProfile: UserProfile;
  setCurrentProfile: (profile: UserProfile) => void;
  
  // Data
  clients: Client[];
  setClients: React.Dispatch<React.SetStateAction<Client[]>>;
  rawMaterials: RawMaterial[];
  setRawMaterials: React.Dispatch<React.SetStateAction<RawMaterial[]>>;
  finishedProducts: FinishedProduct[];
  setFinishedProducts: React.Dispatch<React.SetStateAction<FinishedProduct[]>>;
  quotes: Quote[];
  setQuotes: React.Dispatch<React.SetStateAction<Quote[]>>;
  serviceOrders: ServiceOrder[];
  setServiceOrders: React.Dispatch<React.SetStateAction<ServiceOrder[]>>;
  
  // CRUD helpers
  addClient: (client: Client) => void;
  updateClient: (id: string, client: Partial<Client>) => void;
  deleteClient: (id: string) => void;
  
  addRawMaterial: (material: RawMaterial) => void;
  updateRawMaterial: (id: string, material: Partial<RawMaterial>) => void;
  deleteRawMaterial: (id: string) => void;
  
  addFinishedProduct: (product: FinishedProduct) => void;
  updateFinishedProduct: (id: string, product: Partial<FinishedProduct>) => void;
  deleteFinishedProduct: (id: string) => void;
  
  addQuote: (quote: Quote) => void;
  updateQuote: (id: string, quote: Partial<Quote>) => void;
  deleteQuote: (id: string) => void;
  
  addServiceOrder: (order: ServiceOrder) => void;
  updateServiceOrder: (id: string, order: Partial<ServiceOrder>) => void;
  updateServiceOrderStatus: (id: string, status: ProductionStatus, userId?: string) => void;
  deleteServiceOrder: (id: string) => void;
  
  // Global search
  globalSearch: string;
  setGlobalSearch: (search: string) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  // User profile
  const [currentProfile, setCurrentProfile] = useState<UserProfile>('admin');
  
  // Data state
  const [clients, setClients] = useState<Client[]>(mockClients);
  const [rawMaterials, setRawMaterials] = useState<RawMaterial[]>(mockRawMaterials);
  const [finishedProducts, setFinishedProducts] = useState<FinishedProduct[]>(mockFinishedProducts);
  const [quotes, setQuotes] = useState<Quote[]>(mockQuotes);
  const [serviceOrders, setServiceOrders] = useState<ServiceOrder[]>(mockServiceOrders);
  
  // Global search
  const [globalSearch, setGlobalSearch] = useState('');
  
  // Client CRUD
  const addClient = (client: Client) => {
    setClients(prev => [...prev, client]);
  };
  
  const updateClient = (id: string, data: Partial<Client>) => {
    setClients(prev => prev.map(c => c.id === id ? { ...c, ...data, updated_at: new Date().toISOString() } : c));
  };
  
  const deleteClient = (id: string) => {
    setClients(prev => prev.filter(c => c.id !== id));
  };
  
  // Raw Material CRUD
  const addRawMaterial = (material: RawMaterial) => {
    setRawMaterials(prev => [...prev, material]);
  };
  
  const updateRawMaterial = (id: string, data: Partial<RawMaterial>) => {
    setRawMaterials(prev => prev.map(m => m.id === id ? { ...m, ...data, updated_at: new Date().toISOString() } : m));
  };
  
  const deleteRawMaterial = (id: string) => {
    setRawMaterials(prev => prev.filter(m => m.id !== id));
  };
  
  // Finished Product CRUD
  const addFinishedProduct = (product: FinishedProduct) => {
    setFinishedProducts(prev => [...prev, product]);
  };
  
  const updateFinishedProduct = (id: string, data: Partial<FinishedProduct>) => {
    setFinishedProducts(prev => prev.map(p => p.id === id ? { ...p, ...data, updated_at: new Date().toISOString() } : p));
  };
  
  const deleteFinishedProduct = (id: string) => {
    setFinishedProducts(prev => prev.filter(p => p.id !== id));
  };
  
  // Quote CRUD
  const addQuote = (quote: Quote) => {
    setQuotes(prev => [...prev, quote]);
  };
  
  const updateQuote = (id: string, data: Partial<Quote>) => {
    setQuotes(prev => prev.map(q => q.id === id ? { ...q, ...data, updated_at: new Date().toISOString() } : q));
  };
  
  const deleteQuote = (id: string) => {
    setQuotes(prev => prev.filter(q => q.id !== id));
  };
  
  // Service Order CRUD
  const addServiceOrder = (order: ServiceOrder) => {
    setServiceOrders(prev => [...prev, order]);
  };
  
  const updateServiceOrder = (id: string, data: Partial<ServiceOrder>) => {
    setServiceOrders(prev => prev.map(o => o.id === id ? { ...o, ...data, updated_at: new Date().toISOString() } : o));
  };
  
  const updateServiceOrderStatus = (id: string, status: ProductionStatus, userId = 'Sistema') => {
    setServiceOrders(prev => prev.map(o => {
      if (o.id !== id) return o;
      
      const newLog = {
        id: `log-${Date.now()}`,
        timestamp: new Date().toISOString(),
        usuario: userId,
        acao: 'Status alterado',
        detalhes: `${o.status_producao} → ${status}`,
      };
      
      return {
        ...o,
        status_producao: status,
        logs: [...o.logs, newLog],
        updated_at: new Date().toISOString(),
        ...(status === 'entregue' ? { data_saida: new Date().toISOString().split('T')[0] } : {}),
      };
    }));
  };
  
  const deleteServiceOrder = (id: string) => {
    setServiceOrders(prev => prev.filter(o => o.id !== id));
  };
  
  return (
    <AppContext.Provider value={{
      currentProfile,
      setCurrentProfile,
      clients,
      setClients,
      rawMaterials,
      setRawMaterials,
      finishedProducts,
      setFinishedProducts,
      quotes,
      setQuotes,
      serviceOrders,
      setServiceOrders,
      addClient,
      updateClient,
      deleteClient,
      addRawMaterial,
      updateRawMaterial,
      deleteRawMaterial,
      addFinishedProduct,
      updateFinishedProduct,
      deleteFinishedProduct,
      addQuote,
      updateQuote,
      deleteQuote,
      addServiceOrder,
      updateServiceOrder,
      updateServiceOrderStatus,
      deleteServiceOrder,
      globalSearch,
      setGlobalSearch,
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
