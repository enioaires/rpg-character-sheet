import { hc } from 'hono/client'
import type { AppType } from '@/app/api/[[...route]]/route'

// Criar o cliente tipado
export const client = hc<AppType>(process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000')

// Exportar apenas a parte da API
export const api = client.api