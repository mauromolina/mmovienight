# MMovieNight 🎬

**"Después de los créditos, empieza la charla."**

Una aplicación web para grupos de amigos que disfrutan ver películas juntos. Registrá lo que ven, calificá cada película, y descubrí qué piensan los demás del grupo.

## Características

- **Autenticación segura** con email/password o magic links
- **Grupos privados** para ver películas con amigos
- **Búsqueda de películas** integrada con TMDb
- **Sistema de ratings** de 1 a 10 con comentarios opcionales
- **Invitaciones por email** con tokens seguros
- **Diseño dark cinematic** con acentos turquesa

## Stack Tecnológico

- **Frontend**: Next.js 15 (App Router) + TypeScript + Tailwind CSS
- **Backend**: Server Components + Server Actions + Route Handlers
- **Base de datos**: Supabase (PostgreSQL) con Row Level Security
- **Autenticación**: Supabase Auth
- **Datos de películas**: TMDb API
- **Emails**: Resend
- **Deploy**: Vercel (free tier)

## Inicio Rápido

### Prerequisitos

- Node.js 18+
- Cuenta en [Supabase](https://supabase.com) (free tier)
- API key de [TMDb](https://www.themoviedb.org/settings/api)
- Cuenta en [Resend](https://resend.com) (opcional, para emails)

### 1. Clonar e instalar

```bash
git clone <repo-url>
cd mmovie-night
npm install
```

### 2. Configurar variables de entorno

Copiá el archivo de ejemplo y completá los valores:

```bash
cp .env.example .env.local
```

Variables requeridas:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu-anon-key
SUPABASE_SERVICE_ROLE_KEY=tu-service-role-key

# TMDb
TMDB_API_KEY=tu-api-key-de-tmdb

# Resend (opcional)
RESEND_API_KEY=re_tu-api-key

# App URL
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 3. Configurar la base de datos

1. Creá un nuevo proyecto en [Supabase](https://supabase.com)
2. Andá a **SQL Editor** y ejecutá el script de migración:

```bash
cat supabase/migrations/001_initial_schema.sql
```

Copiá todo el contenido y ejecutalo en el SQL Editor de Supabase.

### 4. Configurar autenticación en Supabase

1. Andá a **Authentication > URL Configuration**
2. Agregá tu URL de redirect: `http://localhost:3000/auth/callback`
3. (Opcional) Habilitá otros providers en **Authentication > Providers**

### 5. Ejecutar en desarrollo

```bash
npm run dev
```

Abrí [http://localhost:3000](http://localhost:3000)

## Scripts Disponibles

```bash
npm run dev          # Servidor de desarrollo
npm run build        # Build de producción
npm run start        # Servidor de producción
npm run lint         # Linter
npm run lint:fix     # Fix automático del linter
npm run format       # Formatear código con Prettier
npm run test         # Tests en modo watch
npm run test:run     # Tests una sola vez
npm run typecheck    # Verificar tipos TypeScript
```

## Estructura del Proyecto

```
src/
├── app/                    # App Router de Next.js
│   ├── (auth)/            # Rutas de autenticación
│   │   ├── login/
│   │   └── registro/
│   ├── (dashboard)/       # Rutas protegidas
│   │   └── grupos/
│   │       └── [groupId]/
│   │           └── pelicula/[movieId]/
│   ├── api/               # API Routes
│   │   └── tmdb/
│   ├── auth/callback/     # OAuth callback
│   └── join/              # Unirse por invitación
├── components/
│   ├── layout/            # Navbar, etc.
│   ├── movies/            # Componentes de películas
│   └── ui/                # Componentes base reutilizables
├── lib/
│   ├── email/             # Servicio de emails (Resend)
│   ├── supabase/          # Clientes de Supabase
│   ├── tmdb/              # Cliente de TMDb
│   ├── validations/       # Schemas de Zod
│   └── utils.ts           # Utilidades generales
├── services/              # Lógica de negocio
├── tests/                 # Tests
└── types/                 # Tipos TypeScript
```

## Modelo de Datos

### Tablas principales

- **profiles**: Usuarios (sincronizado con auth.users)
- **groups**: Grupos de amigos
- **memberships**: Relación usuarios-grupos
- **movies**: Cache de películas de TMDb
- **group_movies**: Películas agregadas a un grupo
- **ratings**: Calificaciones de usuarios
- **invites**: Invitaciones pendientes

### Row Level Security

Todas las tablas tienen RLS habilitado:

- Los usuarios solo ven datos de grupos a los que pertenecen
- Solo los miembros pueden agregar películas/ratings
- Solo los owners pueden modificar/eliminar grupos
- Los tokens de invitación se almacenan hasheados

## API de TMDb

La integración con TMDb se hace server-side:

```typescript
// Búsqueda de películas
GET /api/tmdb/search?query=el+padrino

// Los detalles se obtienen y cachean automáticamente
// cuando se agrega una película al grupo
```

## Deploy en Vercel

1. Conectá tu repositorio con Vercel
2. Configurá las variables de entorno en el dashboard
3. Actualizá `NEXT_PUBLIC_APP_URL` a tu dominio de Vercel
4. En Supabase, agregá la URL de callback de producción

## Checklist de Seguridad

### Protegido con RLS en Supabase
- [x] profiles (solo propios y de miembros del grupo)
- [x] groups (solo miembros)
- [x] memberships (solo miembros del grupo)
- [x] group_movies (solo miembros)
- [x] ratings (solo miembros, edición solo propia)
- [x] invites (solo miembros o destinatario)

### Validaciones del servidor
- [x] Todos los inputs validados con Zod
- [x] Verificación de membresía antes de acciones
- [x] Tokens de invitación hasheados (SHA-256)
- [x] Rate limiting básico en búsqueda TMDb

### Variables de entorno
- [x] `SUPABASE_SERVICE_ROLE_KEY` solo en servidor
- [x] `TMDB_API_KEY` solo en servidor
- [x] `RESEND_API_KEY` solo en servidor

## TODO - Batch 2 (Próximas pantallas)

Funcionalidades para futuras iteraciones:

1. **Discover** - Explorar películas populares/nuevas desde TMDb
2. **Watchlist** - Lista de películas pendientes por grupo
3. **Activity Feed** - Timeline de actividad del grupo
4. **Perfil de usuario** - Editar nombre, avatar, preferencias
5. **Estadísticas del grupo** - Visualizaciones de ratings y participación
6. **Notificaciones** - Cuando alguien califica una película que viste
7. **Exportar datos** - Descargar historial del grupo
8. **Eliminar cuenta** - GDPR compliant
9. **Dark/Light mode toggle** - Preferencia de tema
10. **PWA support** - Instalable como app

## Decisiones Técnicas

### ¿Por qué Next.js 15 App Router?
- Server Components reducen JS en el cliente
- Server Actions simplifican mutations
- Streaming y Suspense mejoran UX
- Deployment óptimo en Vercel

### ¿Por qué Supabase?
- PostgreSQL real con RLS para seguridad
- Auth integrada con múltiples providers
- Free tier generoso
- SDK con TypeScript

### ¿Por qué cachear películas de TMDb?
- No depender siempre de una API externa
- Datos consistentes aunque TMDb cambie
- Menor latencia en consultas frecuentes
- Rate limiting de TMDb no afecta la app

## Licencia

MIT

---

Hecho con ❤️ para los amantes del cine
