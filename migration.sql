-- Run this in your Supabase SQL Editor
CREATE TABLE IF NOT EXISTS leads (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at timestamptz DEFAULT now(),
  nombre text,
  apellido text,
  empresa text,
  email text,
  telefono text,
  rol text,
  size_empresa text,
  sector text,
  criticidad_internet int,
  respaldo_conexion text,
  problemas_conectividad text[],
  cyber_medidas text[],
  cyber_nivel int,
  cyber_incidente text,
  capacidad_crecer text,
  reto_tecnologico text,
  desea_contacto text,
  score_internet int,
  score_cyber int,
  score_crece int,
  score_respaldo int,
  score_general int
);

-- Allow public inserts (anon key)
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public insert" ON leads
  FOR INSERT TO anon WITH CHECK (true);

CREATE POLICY "Allow public select" ON leads
  FOR SELECT TO anon USING (true);
