import { hc } from 'hono/client'
import type { AppType } from '@/app/api/[[...route]]/route'

// Função para obter a URL base correta
function getBaseURL() {
    // Em produção, usar a URL atual do browser
    if (typeof window !== 'undefined') {
        return window.location.origin
    }

    // No servidor, usar variáveis de ambiente
    if (process.env.VERCEL_URL) {
        return `https://${process.env.VERCEL_URL}`
    }

    if (process.env.NEXT_PUBLIC_APP_URL) {
        return process.env.NEXT_PUBLIC_APP_URL
    }

    // Fallback para desenvolvimento
    return 'http://localhost:3000'
}

// Criar o cliente tipado
export const client = hc<AppType>(getBaseURL())

// Exportar apenas a parte da API
export const api = client.api