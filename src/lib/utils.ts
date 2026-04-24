import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export interface CEPAddress {
  address: string;
  neighborhood: string;
  city: string;
  state: string;
}

export async function fetchAddressByCEP(cep: string): Promise<CEPAddress | null> {
  const cleanCEP = cep.replace(/\D/g, '');
  if (cleanCEP.length !== 8) return null;

  try {
    const res = await fetch(`https://viacep.com.br/ws/${cleanCEP}/json/`);
    const data = await res.json();
    if (data.erro) return null;

    return {
      address: data.logradouro || '',
      neighborhood: data.bairro || '',
      city: data.localidade || '',
      state: data.uf || ''
    };
  } catch {
    return null;
  }
}

function toNumber(value: number | string | null | undefined) {
  if (typeof value === 'number') return value;
  if (typeof value === 'string') {
    const n = Number(value);
    return Number.isFinite(n) ? n : 0;
  }
  return 0;
}

export function formatNumberBR(value: number | string | null | undefined, decimals: number) {
  const safe = toNumber(value);
  return safe.toLocaleString('pt-BR', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

export function formatBRL(value: number | string | null | undefined, decimals: number = 2) {
  const safe = toNumber(value);
  return safe.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

export function formatPercentBR(value: number | string | null | undefined, decimals: number = 2) {
  return `${formatNumberBR(value, decimals)}%`;
}

export function formatMM(value: number | string | null | undefined, decimals: number = 0) {
  return `${formatNumberBR(value, decimals)} mm`;
}

export function formatM(value: number | string | null | undefined, decimals: number = 3) {
  return `${formatNumberBR(value, decimals)} m`;
}

export function formatM2(value: number | string | null | undefined, decimals: number = 6) {
  return `${formatNumberBR(value, decimals)} m²`;
}
