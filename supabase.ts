import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export type Lead = {
  id?: string
  created_at?: string
  nombre: string
  apellido: string
  empresa: string
  email: string
  telefono: string
  rol: string
  size_empresa: string
  sector: string
  criticidad_internet: number
  respaldo_conexion: string
  problemas_conectividad: string[]
  cyber_medidas: string[]
  cyber_nivel: number
  cyber_incidente: string
  capacidad_crecer: string
  reto_tecnologico: string
  desea_contacto: string
  score_internet: number
  score_cyber: number
  score_crece: number
  score_respaldo: number
  score_general: number
}
