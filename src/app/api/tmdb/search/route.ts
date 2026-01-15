import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getTMDbClient, mapSearchResultToSimple } from '@/lib/tmdb'
import { searchSchema, validate } from '@/lib/validations'

// Rate limiting simple por IP (en memoria, se pierde al reiniciar)
const rateLimitMap = new Map<string, { count: number; timestamp: number }>()
const RATE_LIMIT_WINDOW = 60000 // 1 minuto
const RATE_LIMIT_MAX = 30 // 30 requests por minuto

function isRateLimited(ip: string): boolean {
  const now = Date.now()
  const record = rateLimitMap.get(ip)

  if (!record || now - record.timestamp > RATE_LIMIT_WINDOW) {
    rateLimitMap.set(ip, { count: 1, timestamp: now })
    return false
  }

  if (record.count >= RATE_LIMIT_MAX) {
    return true
  }

  record.count++
  return false
}

export async function GET(request: NextRequest) {
  // Verificar autenticación
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  // Rate limiting
  const ip = request.headers.get('x-forwarded-for') || 'unknown'
  if (isRateLimited(ip)) {
    return NextResponse.json(
      { error: 'Demasiadas solicitudes. Esperá un momento.' },
      { status: 429 }
    )
  }

  // Validar parámetros
  const searchParams = request.nextUrl.searchParams
  const query = searchParams.get('query') || ''
  const page = parseInt(searchParams.get('page') || '1', 10)

  const validation = validate(searchSchema, { query })
  if (!validation.success) {
    return NextResponse.json(
      { error: Object.values(validation.errors)[0] },
      { status: 400 }
    )
  }

  try {
    const tmdb = getTMDbClient()
    const results = await tmdb.searchMovies(query, page)

    return NextResponse.json({
      results: results.results.map(mapSearchResultToSimple),
      page: results.page,
      total_pages: results.total_pages,
      total_results: results.total_results,
    })
  } catch (error) {
    console.error('TMDb search error:', error)
    return NextResponse.json(
      { error: 'Error al buscar películas' },
      { status: 500 }
    )
  }
}
