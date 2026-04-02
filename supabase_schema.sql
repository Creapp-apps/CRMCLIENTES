-- =====================================================
-- CreApp CRM SaaS - Schema Completo para Supabase
-- Generado para entorno de Producción
-- =====================================================

-- =====================================================
-- 1. ENUM TYPES
-- =====================================================

CREATE TYPE pricing_type AS ENUM ('monthly', 'one-time', 'percentage');
CREATE TYPE user_role AS ENUM ('super_admin', 'sdr');
CREATE TYPE commission_type AS ENUM ('percentage', 'fixed');
CREATE TYPE lead_source AS ENUM ('inbound', 'outbound');
CREATE TYPE lead_status AS ENUM ('uncontacted', 'contacting', 'won', 'lost');
CREATE TYPE action_type AS ENUM ('whatsapp', 'call', 'email', 'presencial');
CREATE TYPE interaction_outcome AS ENUM ('contacted', 'busy', 'no_answer', 'lost');

-- =====================================================
-- 2. TABLAS
-- =====================================================

-- PROJECTS (Tenants / Clientes de la Agencia)
CREATE TABLE projects (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL,
  code        TEXT NOT NULL,
  pricing_type pricing_type NOT NULL DEFAULT 'monthly',
  base_price  NUMERIC NOT NULL DEFAULT 0,
  is_active   BOOLEAN NOT NULL DEFAULT TRUE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- PROFILES (Usuarios vinculados a auth.users)
CREATE TABLE profiles (
  id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name   TEXT NOT NULL,
  role        user_role NOT NULL DEFAULT 'sdr',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- SDR_PROJECT_COMMISSIONS (Tabla pivote: qué SDR trabaja en qué proyecto y su comisión)
CREATE TABLE sdr_project_commissions (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sdr_id            UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  project_id        UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  commission_type   commission_type NOT NULL DEFAULT 'percentage',
  commission_value  NUMERIC NOT NULL DEFAULT 0,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(sdr_id, project_id)
);

-- PROJECT_PLANS (Paquetes / Precios disponibles para un proyecto)
CREATE TABLE project_plans (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id  UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  price       NUMERIC NOT NULL,
  billing_cycle pricing_type NOT NULL DEFAULT 'monthly',
  is_active   BOOLEAN NOT NULL DEFAULT TRUE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- LEADS (Prospectos)
CREATE TABLE leads (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id          UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  name                TEXT NOT NULL,
  company             TEXT,
  location            TEXT,
  phone               TEXT,
  website             TEXT,
  source              lead_source NOT NULL DEFAULT 'inbound',
  channel             TEXT NOT NULL DEFAULT 'instagram',
  status              lead_status NOT NULL DEFAULT 'uncontacted',
  next_contact_date   TIMESTAMPTZ,
  assigned_to         UUID REFERENCES profiles(id) ON DELETE SET NULL,
  deal_plan_id        UUID REFERENCES project_plans(id) ON DELETE SET NULL,
  promo_code          TEXT,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- INTERACTIONS (Logs de contacto — historial para IA futura)
CREATE TABLE interactions (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id     UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  sdr_id      UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  action_type action_type NOT NULL,
  outcome     interaction_outcome NOT NULL,
  notes       TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =====================================================
-- 3. ÍNDICES para rendimiento en consultas frecuentes
-- =====================================================

CREATE INDEX idx_leads_project_id       ON leads(project_id);
CREATE INDEX idx_leads_assigned_to      ON leads(assigned_to);
CREATE INDEX idx_leads_status           ON leads(status);
CREATE INDEX idx_leads_next_contact     ON leads(next_contact_date);
CREATE INDEX idx_interactions_lead_id   ON interactions(lead_id);
CREATE INDEX idx_interactions_sdr_id    ON interactions(sdr_id);
CREATE INDEX idx_sdr_commissions_sdr    ON sdr_project_commissions(sdr_id);
CREATE INDEX idx_sdr_commissions_proj   ON sdr_project_commissions(project_id);
CREATE INDEX idx_project_plans_project_id ON project_plans(project_id);

-- =====================================================
-- 4. HABILITAR ROW LEVEL SECURITY
-- =====================================================

ALTER TABLE projects                ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles                ENABLE ROW LEVEL SECURITY;
ALTER TABLE sdr_project_commissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_plans           ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads                   ENABLE ROW LEVEL SECURITY;
ALTER TABLE interactions            ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- 5. FUNCIÓN HELPER: Obtener el rol del usuario actual
-- =====================================================

CREATE OR REPLACE FUNCTION get_my_role()
RETURNS user_role
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT role FROM profiles WHERE id = auth.uid();
$$;

-- =====================================================
-- 6. POLÍTICAS DE SEGURIDAD (RLS POLICIES)
-- =====================================================

-- ----- PROFILES -----

-- Super Admin: acceso total
CREATE POLICY "super_admin_all_profiles"
  ON profiles FOR ALL
  USING (get_my_role() = 'super_admin')
  WITH CHECK (get_my_role() = 'super_admin');

-- SDR: solo puede ver su propio perfil
CREATE POLICY "sdr_select_own_profile"
  ON profiles FOR SELECT
  USING (id = auth.uid());

-- ----- PROJECTS -----

-- Super Admin: acceso total
CREATE POLICY "super_admin_all_projects"
  ON projects FOR ALL
  USING (get_my_role() = 'super_admin')
  WITH CHECK (get_my_role() = 'super_admin');

-- SDR: solo puede VER proyectos a los que está asignado
CREATE POLICY "sdr_select_assigned_projects"
  ON projects FOR SELECT
  USING (
    id IN (
      SELECT project_id 
      FROM sdr_project_commissions 
      WHERE sdr_id = auth.uid()
    )
  );

-- ----- PROJECT PLANS -----
-- Super Admin: acceso total
CREATE POLICY "super_admin_all_project_plans"
  ON project_plans FOR ALL
  USING (get_my_role() = 'super_admin')
  WITH CHECK (get_my_role() = 'super_admin');

-- SDR: solo puede VER planes de proyectos asignados
CREATE POLICY "sdr_select_assigned_plans"
  ON project_plans FOR SELECT
  USING (
    project_id IN (
      SELECT project_id 
      FROM sdr_project_commissions 
      WHERE sdr_id = auth.uid()
    )
  );

-- ----- SDR_PROJECT_COMMISSIONS -----

-- Super Admin: acceso total (él setea las comisiones)
CREATE POLICY "super_admin_all_commissions"
  ON sdr_project_commissions FOR ALL
  USING (get_my_role() = 'super_admin')
  WITH CHECK (get_my_role() = 'super_admin');

-- SDR: solo puede VER sus propias comisiones
CREATE POLICY "sdr_select_own_commissions"
  ON sdr_project_commissions FOR SELECT
  USING (sdr_id = auth.uid());

-- ----- LEADS -----

-- Super Admin: acceso total
CREATE POLICY "super_admin_all_leads"
  ON leads FOR ALL
  USING (get_my_role() = 'super_admin')
  WITH CHECK (get_my_role() = 'super_admin');

-- SDR: puede VER leads de los proyectos que tiene asignados
CREATE POLICY "sdr_select_project_leads"
  ON leads FOR SELECT
  USING (
    project_id IN (
      SELECT project_id 
      FROM sdr_project_commissions 
      WHERE sdr_id = auth.uid()
    )
  );

-- SDR: puede CREAR leads en proyectos asignados
CREATE POLICY "sdr_insert_project_leads"
  ON leads FOR INSERT
  WITH CHECK (
    project_id IN (
      SELECT project_id 
      FROM sdr_project_commissions 
      WHERE sdr_id = auth.uid()
    )
  );

-- SDR: puede EDITAR leads de proyectos asignados (cambiar status, next_contact_date, etc)
CREATE POLICY "sdr_update_project_leads"
  ON leads FOR UPDATE
  USING (
    project_id IN (
      SELECT project_id 
      FROM sdr_project_commissions 
      WHERE sdr_id = auth.uid()
    )
  )
  WITH CHECK (
    project_id IN (
      SELECT project_id 
      FROM sdr_project_commissions 
      WHERE sdr_id = auth.uid()
    )
  );

-- ----- INTERACTIONS -----

-- Super Admin: acceso total
CREATE POLICY "super_admin_all_interactions"
  ON interactions FOR ALL
  USING (get_my_role() = 'super_admin')
  WITH CHECK (get_my_role() = 'super_admin');

-- SDR: puede VER interacciones de leads que pertenecen a sus proyectos
CREATE POLICY "sdr_select_project_interactions"
  ON interactions FOR SELECT
  USING (
    lead_id IN (
      SELECT l.id FROM leads l
      INNER JOIN sdr_project_commissions spc ON spc.project_id = l.project_id
      WHERE spc.sdr_id = auth.uid()
    )
  );

-- SDR: puede CREAR interacciones en leads de sus proyectos
CREATE POLICY "sdr_insert_project_interactions"
  ON interactions FOR INSERT
  WITH CHECK (
    lead_id IN (
      SELECT l.id FROM leads l
      INNER JOIN sdr_project_commissions spc ON spc.project_id = l.project_id
      WHERE spc.sdr_id = auth.uid()
    )
    AND sdr_id = auth.uid()  -- Solo puede loguear interacciones a su nombre
  );

-- =====================================================
-- 7. TRIGGER: Crear perfil automáticamente al registrar usuario
-- =====================================================

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'Sin Nombre'),
    'sdr'  -- Por defecto todo usuario nuevo es SDR; el admin lo promueve manualmente
  );
  RETURN NEW;
END;
$$;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- =====================================================
-- FIN DEL SCHEMA
-- =====================================================
-- Listo para copiar y pegar en el SQL Editor de Supabase.
-- Después de ejecutar esto, crea tu primer usuario Super Admin
-- manualmente ejecutando:
--
--   UPDATE profiles SET role = 'super_admin' WHERE id = 'TU_USER_UUID_AQUI';
--
-- (Reemplaza TU_USER_UUID_AQUI con el UUID que aparece en 
--  Authentication > Users en tu dashboard de Supabase)
-- =====================================================
