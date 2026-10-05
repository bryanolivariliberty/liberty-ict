import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Assessment ICT – Liberty Business',
  description: 'Descubre cómo la tecnología puede apoyar el crecimiento y la continuidad de tu empresa.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body style={{ margin: 0, fontFamily: 'system-ui, -apple-system, sans-serif', background: '#F5F6F8' }}>{children}</body>
    </html>
  )
}
