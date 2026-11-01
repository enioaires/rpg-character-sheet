// Teste de rota do PUT /api/characters/:id (API-01)
//
// Nunca toca um banco real: @/lib/db é substituído por um stub que lança em
// qualquer acesso, ANTES de a rota ser carregada. Por isso a rota é carregada
// com import dinâmico (imports estáticos são içados acima do mock.module).

import { describe, expect, it, mock } from 'bun:test'

const touched: string[] = []
const forbiddenDb = new Proxy(
  {},
  {
    get(_target, prop) {
      touched.push(String(prop))
      throw new Error(`Acesso ao banco proibido nos testes: ${String(prop)}`)
    },
  },
)

mock.module('@/lib/db', () => ({ db: forbiddenDb }))

const { default: app } = await import('./index')

function put(body: unknown) {
  return app.request('/qualquer-id', {
    method: 'PUT',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  })
}

describe('PUT /:id com JSON malformado', () => {
  it('weapons como objeto responde 400 com issues e sem acessar o banco', async () => {
    const res = await put({ weapons: {} })
    expect(res.status).toBe(400)
    const json = (await res.json()) as {
      error: string
      issues: { path: string; message: string }[]
    }
    expect(json.error).toBe('Dados inválidos')
    expect(Array.isArray(json.issues)).toBe(true)
    expect(json.issues.some(issue => issue.path.startsWith('weapons'))).toBe(true)
    expect(touched).toEqual([])
  })

  it('não reflete o payload na resposta', async () => {
    const res = await put({ weapons: [{ name: 'SEGREDO-123', level: 'x' }] })
    expect(res.status).toBe(400)
    const text = await res.text()
    expect(text).not.toContain('SEGREDO-123')
    expect(touched).toEqual([])
  })

  it('finances com valor não numérico responde 400 com path finances', async () => {
    const res = await put({ finances: { ouro: 'muito' } })
    expect(res.status).toBe(400)
    const json = (await res.json()) as { issues: { path: string }[] }
    expect(json.issues.some(issue => issue.path.startsWith('finances'))).toBe(true)
    expect(touched).toEqual([])
  })
})
