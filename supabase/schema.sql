create extension if not exists pgcrypto;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table if not exists public.salespeople (
  id uuid primary key default gen_random_uuid(),
  code text,
  name text not null,
  phone text,
  whatsapp text,
  email text,
  commission_type text not null default 'percentage' check (commission_type in ('percentage','fixed')),
  commission_value numeric(12,2) not null default 0,
  notes text,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger trg_salespeople_updated_at
before update on public.salespeople
for each row execute function public.set_updated_at();

create index if not exists idx_salespeople_name on public.salespeople (name);

create table if not exists public.carriers (
  id uuid primary key default gen_random_uuid(),
  code text,
  name text not null,
  cnpj text,
  phone text,
  whatsapp text,
  email text,
  zip_code text,
  address text,
  number text,
  complement text,
  neighborhood text,
  city text,
  state text,
  delivery_time_days integer not null default 0,
  notes text,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger trg_carriers_updated_at
before update on public.carriers
for each row execute function public.set_updated_at();

create index if not exists idx_carriers_name on public.carriers (name);

create table if not exists public.companies (
  id uuid primary key default gen_random_uuid(),
  code text,
  name text,
  trade_name text not null,
  cnpj text,
  state_registration text,
  phone text,
  whatsapp text,
  email text,
  zip_code text,
  address text,
  number text,
  complement text,
  neighborhood text,
  city text,
  state text,
  salesperson_id uuid references public.salespeople(id) on delete set null,
  default_carrier_id uuid references public.carriers(id) on delete set null,
  notes text,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger trg_companies_updated_at
before update on public.companies
for each row execute function public.set_updated_at();

create index if not exists idx_companies_trade_name on public.companies (trade_name);
create index if not exists idx_companies_city on public.companies (city);

create table if not exists public.raw_products (
  id uuid primary key default gen_random_uuid(),
  code text,
  name text not null,
  material_type text,
  width_mm numeric(12,3) not null default 0,
  length_m numeric(12,3) not null default 0,
  thickness_microns numeric(12,3) not null default 0,
  usable_width_mm numeric(12,3) not null default 0,
  waste_percentage numeric(8,3) not null default 0,
  cost_per_meter numeric(12,4) not null default 0,
  cost_per_kg numeric(12,4),
  supplier_name text,
  notes text,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger trg_raw_products_updated_at
before update on public.raw_products
for each row execute function public.set_updated_at();

create index if not exists idx_raw_products_name on public.raw_products (name);
create index if not exists idx_raw_products_code on public.raw_products (code);

create table if not exists public.finished_products (
  id uuid primary key default gen_random_uuid(),
  code text,
  name text not null,
  product_type text not null default 'label' check (product_type in ('label','card','tag','sticker','custom')),
  width_mm numeric(12,3) not null default 0,
  height_mm numeric(12,3) not null default 0,
  units_per_row integer not null default 0,
  units_per_meter numeric(12,3) not null default 0,
  requires_specific_raw_material boolean not null default false,
  default_raw_product_id uuid references public.raw_products(id) on delete set null,
  base_price numeric(12,2) not null default 0,
  minimum_quantity integer not null default 0,
  notes text,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger trg_finished_products_updated_at
before update on public.finished_products
for each row execute function public.set_updated_at();

create index if not exists idx_finished_products_name on public.finished_products (name);
create index if not exists idx_finished_products_code on public.finished_products (code);

create table if not exists public.quotes (
  id uuid primary key default gen_random_uuid(),
  quote_number text not null,
  company_id uuid not null references public.companies(id) on delete restrict,
  salesperson_id uuid references public.salespeople(id) on delete set null,
  carrier_id uuid references public.carriers(id) on delete set null,
  status text not null default 'draft' check (status in ('draft','approved','rejected','canceled')),
  issue_date date not null default current_date,
  valid_until date not null default current_date,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger trg_quotes_updated_at
before update on public.quotes
for each row execute function public.set_updated_at();

create unique index if not exists idx_quotes_quote_number on public.quotes (quote_number);
create index if not exists idx_quotes_status on public.quotes (status);
create index if not exists idx_quotes_company on public.quotes (company_id);

create table if not exists public.quote_items (
  id uuid primary key default gen_random_uuid(),
  quote_id uuid not null references public.quotes(id) on delete cascade,
  finished_product_id uuid references public.finished_products(id) on delete set null,
  raw_product_id uuid references public.raw_products(id) on delete set null,
  description text,
  quantity integer not null default 0,
  width_mm numeric(12,3) not null default 0,
  height_mm numeric(12,3) not null default 0,
  units_per_row integer not null default 0,
  units_per_meter numeric(12,3) not null default 0,
  material_used_meters numeric(12,3) not null default 0,
  waste_meters numeric(12,3) not null default 0,
  total_cost numeric(12,2) not null default 0,
  unit_cost numeric(12,2) not null default 0,
  sale_price numeric(12,2) not null default 0,
  total_price numeric(12,2) not null default 0,
  profit_margin numeric(12,3) not null default 0,
  technical_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger trg_quote_items_updated_at
before update on public.quote_items
for each row execute function public.set_updated_at();

create index if not exists idx_quote_items_quote_id on public.quote_items (quote_id);

create table if not exists public.work_orders (
  id uuid primary key default gen_random_uuid(),
  os_number text not null,
  quote_id uuid references public.quotes(id) on delete set null,
  company_id uuid not null references public.companies(id) on delete restrict,
  salesperson_id uuid references public.salespeople(id) on delete set null,
  carrier_id uuid references public.carriers(id) on delete set null,
  status text not null default 'pending' check (status in ('pending','in_production','finished','canceled')),
  workflow_stage text not null default 'a_fazer' check (workflow_stage in ('a_fazer','preparacao','impressao','rebobinagem_corte','acabamento','qualidade','pronto_para_nf','nf_emitida','entregue')),
  issue_date date not null default current_date,
  deadline date not null default current_date,
  production_notes text,
  internal_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger trg_work_orders_updated_at
before update on public.work_orders
for each row execute function public.set_updated_at();

create unique index if not exists idx_work_orders_os_number on public.work_orders (os_number);
create index if not exists idx_work_orders_status on public.work_orders (status);
create index if not exists idx_work_orders_company on public.work_orders (company_id);
create index if not exists idx_work_orders_workflow_stage on public.work_orders (workflow_stage);

create table if not exists public.work_order_items (
  id uuid primary key default gen_random_uuid(),
  work_order_id uuid not null references public.work_orders(id) on delete cascade,
  finished_product_id uuid references public.finished_products(id) on delete set null,
  raw_product_id uuid references public.raw_products(id) on delete set null,
  description text,
  quantity integer not null default 0,
  width_mm numeric(12,3) not null default 0,
  height_mm numeric(12,3) not null default 0,
  units_per_row integer not null default 0,
  units_per_meter numeric(12,3) not null default 0,
  material_used_meters numeric(12,3) not null default 0,
  waste_meters numeric(12,3) not null default 0,
  setup_notes text,
  technical_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger trg_work_order_items_updated_at
before update on public.work_order_items
for each row execute function public.set_updated_at();

create index if not exists idx_work_order_items_work_order_id on public.work_order_items (work_order_id);

create table if not exists public.system_settings (
  id uuid primary key default gen_random_uuid(),
  company_name text not null,
  document_footer text,
  default_quote_validity_days integer not null default 0,
  default_waste_percentage numeric(12,3) not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger trg_system_settings_updated_at
before update on public.system_settings
for each row execute function public.set_updated_at();

alter table public.salespeople enable row level security;
alter table public.carriers enable row level security;
alter table public.companies enable row level security;
alter table public.raw_products enable row level security;
alter table public.finished_products enable row level security;
alter table public.quotes enable row level security;
alter table public.quote_items enable row level security;
alter table public.work_orders enable row level security;
alter table public.work_order_items enable row level security;
alter table public.system_settings enable row level security;

create policy "salespeople_all_authenticated" on public.salespeople for all to authenticated using (true) with check (true);
create policy "carriers_all_authenticated" on public.carriers for all to authenticated using (true) with check (true);
create policy "companies_all_authenticated" on public.companies for all to authenticated using (true) with check (true);
create policy "raw_products_all_authenticated" on public.raw_products for all to authenticated using (true) with check (true);
create policy "finished_products_all_authenticated" on public.finished_products for all to authenticated using (true) with check (true);
create policy "quotes_all_authenticated" on public.quotes for all to authenticated using (true) with check (true);
create policy "quote_items_all_authenticated" on public.quote_items for all to authenticated using (true) with check (true);
create policy "work_orders_all_authenticated" on public.work_orders for all to authenticated using (true) with check (true);
create policy "work_order_items_all_authenticated" on public.work_order_items for all to authenticated using (true) with check (true);
create policy "system_settings_all_authenticated" on public.system_settings for all to authenticated using (true) with check (true);

