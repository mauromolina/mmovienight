import type { Metadata } from 'next'
import { Lato } from 'next/font/google'
import './globals.css'

const lato = Lato({
  variable: '--font-lato',
  subsets: ['latin'],
  weight: ['100', '300', '400', '700', '900'],
  display: 'swap',
})

export const metadata: Metadata = {
  title: {
    default: 'MMovieNight',
    template: '%s | MMovieNight',
  },
  description: 'Después de los créditos, empieza la charla. Registrá películas, calificá y compartí con tus amigos.',
  keywords: ['películas', 'cine', 'amigos', 'calificaciones', 'grupos'],
  authors: [{ name: 'MMovieNight' }],
  openGraph: {
    type: 'website',
    locale: 'es_AR',
    siteName: 'MMovieNight',
    title: 'MMovieNight',
    description: 'Después de los créditos, empieza la charla.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'MMovieNight',
    description: 'Después de los créditos, empieza la charla.',
  },
  robots: {
    index: true,
    follow: true,
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="es">
      <body className={`${lato.variable} font-sans antialiased`}>
        {children}
      </body>
    </html>
  )
}
