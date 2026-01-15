// Helper para operaciones de base de datos sin tipos estrictos
// Usar esto temporalmente hasta generar tipos con `supabase gen types`
// Una vez ejecutado el migration, ejecutar:
// npx supabase gen types typescript --project-id <project-id> > src/types/database.generated.ts

import { SupabaseClient } from '@supabase/supabase-js'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnySupabaseClient = SupabaseClient<any, any, any>

export function getTable(supabase: AnySupabaseClient, table: string) {
  return supabase.from(table)
}

// Helper para insert
export async function dbInsert(
  supabase: AnySupabaseClient,
  table: string,
  data: Record<string, unknown>
) {
  return supabase.from(table).insert(data)
}

// Helper para update
export async function dbUpdate(
  supabase: AnySupabaseClient,
  table: string,
  data: Record<string, unknown>,
  match: Record<string, unknown>
) {
  let query = supabase.from(table).update(data)
  for (const [key, value] of Object.entries(match)) {
    query = query.eq(key, value)
  }
  return query
}

// Helper para delete
export async function dbDelete(
  supabase: AnySupabaseClient,
  table: string,
  match: Record<string, unknown>
) {
  let query = supabase.from(table).delete()
  for (const [key, value] of Object.entries(match)) {
    query = query.eq(key, value)
  }
  return query
}

// Helper para select
export async function dbSelect(
  supabase: AnySupabaseClient,
  table: string,
  columns: string = '*',
  match?: Record<string, unknown>
) {
  let query = supabase.from(table).select(columns)
  if (match) {
    for (const [key, value] of Object.entries(match)) {
      query = query.eq(key, value)
    }
  }
  return query
}
