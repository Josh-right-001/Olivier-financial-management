-- OLIVIER Database Schema
-- Creates all necessary tables for financial, logistics, and HR management

-- Sessions table for anonymous session tracking
CREATE TABLE IF NOT EXISTS sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_active TIMESTAMPTZ DEFAULT NOW(),
  metadata JSONB DEFAULT '{}'::JSONB
);

CREATE INDEX IF NOT EXISTS idx_sessions_session_id ON sessions(session_id);

-- Transactions table
CREATE TABLE IF NOT EXISTS transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id TEXT NOT NULL,
  transaction_id TEXT UNIQUE,
  type TEXT NOT NULL CHECK (type IN ('income', 'expense', 'transfer')),
  nom TEXT NOT NULL,
  reference TEXT,
  montant DECIMAL(15, 2) NOT NULL,
  devise TEXT DEFAULT 'USD',
  motif TEXT,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  heure TIME,
  telephone TEXT,
  mode_paiement TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_transactions_session_id ON transactions(session_id);
CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(date);
CREATE INDEX IF NOT EXISTS idx_transactions_type ON transactions(type);

-- Employees table
CREATE TABLE IF NOT EXISTS employees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id TEXT NOT NULL,
  employee_id TEXT UNIQUE,
  nom TEXT NOT NULL,
  post_nom TEXT,
  role TEXT,
  salaire_unitaire DECIMAL(15, 2),
  unite TEXT,
  salaire_mensuel DECIMAL(15, 2),
  banque TEXT,
  compte_bancaire TEXT,
  telephone TEXT,
  email TEXT,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_employees_session_id ON employees(session_id);
CREATE INDEX IF NOT EXISTS idx_employees_status ON employees(status);

-- Inventory table
CREATE TABLE IF NOT EXISTS inventory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id TEXT NOT NULL,
  item_id TEXT UNIQUE,
  produit TEXT NOT NULL,
  quantite DECIMAL(15, 2) NOT NULL DEFAULT 0,
  unite TEXT,
  prix_unitaire DECIMAL(15, 2),
  valeur_totale DECIMAL(15, 2) GENERATED ALWAYS AS (quantite * COALESCE(prix_unitaire, 0)) STORED,
  fournisseur TEXT,
  date_entree DATE DEFAULT CURRENT_DATE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_inventory_session_id ON inventory(session_id);
CREATE INDEX IF NOT EXISTS idx_inventory_produit ON inventory(produit);

-- Fuel log table (mazout)
CREATE TABLE IF NOT EXISTS fuel_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id TEXT NOT NULL,
  record_id TEXT UNIQUE,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  heure TIME,
  quantite_litres DECIMAL(10, 2) NOT NULL,
  prix_par_litre DECIMAL(10, 2) NOT NULL,
  cout_total DECIMAL(15, 2) GENERATED ALWAYS AS (quantite_litres * prix_par_litre) STORED,
  vehicule TEXT,
  conducteur TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_fuel_log_session_id ON fuel_log(session_id);
CREATE INDEX IF NOT EXISTS idx_fuel_log_date ON fuel_log(date);

-- Debts table
CREATE TABLE IF NOT EXISTS debts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id TEXT NOT NULL,
  debt_id TEXT UNIQUE,
  nom_creancier TEXT NOT NULL,
  montant_total DECIMAL(15, 2) NOT NULL,
  avance DECIMAL(15, 2) DEFAULT 0,
  reste DECIMAL(15, 2) GENERATED ALWAYS AS (montant_total - COALESCE(avance, 0)) STORED,
  motif TEXT,
  echeance DATE,
  statut TEXT DEFAULT 'pending' CHECK (statut IN ('pending', 'partial', 'paid', 'overdue')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_debts_session_id ON debts(session_id);
CREATE INDEX IF NOT EXISTS idx_debts_statut ON debts(statut);
CREATE INDEX IF NOT EXISTS idx_debts_echeance ON debts(echeance);

-- Suppliers table
CREATE TABLE IF NOT EXISTS suppliers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id TEXT NOT NULL,
  supplier_id TEXT UNIQUE,
  nom TEXT NOT NULL,
  contact TEXT,
  telephone TEXT,
  email TEXT,
  adresse TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_suppliers_session_id ON suppliers(session_id);

-- Clients table
CREATE TABLE IF NOT EXISTS clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id TEXT NOT NULL,
  client_id TEXT UNIQUE,
  nom TEXT NOT NULL,
  contact TEXT,
  telephone TEXT,
  email TEXT,
  adresse TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_clients_session_id ON clients(session_id);

-- Settings table for custom fields and preferences
CREATE TABLE IF NOT EXISTS settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id TEXT NOT NULL,
  param TEXT NOT NULL,
  valeur TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(session_id, param)
);

CREATE INDEX IF NOT EXISTS idx_settings_session_id ON settings(session_id);

-- Audit log for tracking changes
CREATE TABLE IF NOT EXISTS audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id TEXT NOT NULL,
  table_name TEXT NOT NULL,
  record_id UUID,
  action TEXT NOT NULL CHECK (action IN ('create', 'update', 'delete')),
  old_data JSONB,
  new_data JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_log_session_id ON audit_log(session_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_table_name ON audit_log(table_name);
CREATE INDEX IF NOT EXISTS idx_audit_log_created_at ON audit_log(created_at);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER update_transactions_updated_at BEFORE UPDATE ON transactions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_employees_updated_at BEFORE UPDATE ON employees
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_inventory_updated_at BEFORE UPDATE ON inventory
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_fuel_log_updated_at BEFORE UPDATE ON fuel_log
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_debts_updated_at BEFORE UPDATE ON debts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_suppliers_updated_at BEFORE UPDATE ON suppliers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_clients_updated_at BEFORE UPDATE ON clients
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_settings_updated_at BEFORE UPDATE ON settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
