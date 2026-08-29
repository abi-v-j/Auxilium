export const schemaSql = `
create table if not exists users (
  id bigserial primary key,
  telegram_id bigint not null unique,
  username text,
  first_name text,
  currency text not null default 'INR',
  timezone text not null default 'Asia/Kolkata',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists categories (
  id bigserial primary key,
  user_id bigint references users(id) on delete cascade,
  name text not null,
  type text not null check (type in ('income', 'expense')),
  icon text not null default '',
  is_default boolean not null default false,
  created_at timestamptz not null default now(),
  unique (user_id, name, type)
);

create table if not exists transactions (
  id bigserial primary key,
  user_id bigint not null references users(id) on delete cascade,
  category_id bigint references categories(id) on delete set null,
  type text not null check (type in ('income', 'expense')),
  amount numeric(12, 2) not null check (amount > 0),
  description text,
  transaction_date date not null default current_date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists debts (
  id bigserial primary key,
  user_id bigint not null references users(id) on delete cascade,
  person_name text not null,
  type text not null check (type in ('i_owe', 'owes_me')),
  original_amount numeric(12, 2) not null check (original_amount > 0),
  remaining_amount numeric(12, 2) not null check (remaining_amount >= 0),
  status text not null default 'active' check (status in ('active', 'paid', 'cancelled')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists debt_payments (
  id bigserial primary key,
  debt_id bigint not null references debts(id) on delete cascade,
  amount numeric(12, 2) not null check (amount > 0),
  payment_date date not null default current_date,
  note text,
  created_at timestamptz not null default now()
);

create table if not exists budgets (
  id bigserial primary key,
  user_id bigint not null references users(id) on delete cascade,
  category_id bigint references categories(id) on delete cascade,
  monthly_limit numeric(12, 2) not null check (monthly_limit > 0),
  month integer not null check (month between 1 and 12),
  year integer not null check (year >= 2000),
  unique (user_id, category_id, month, year)
);

create index if not exists idx_transactions_user_date on transactions(user_id, transaction_date desc);
create index if not exists idx_categories_user_type on categories(user_id, type);
create index if not exists idx_debts_user_status on debts(user_id, status);
`;
