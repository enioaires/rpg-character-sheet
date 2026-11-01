// Testes unitários de lib/calculations (CALC-02)
//
// Os valores esperados são os números produzidos pelo app no commit 832fa9b
// (ver o plano da tarefa rápida 261101-iig). Nunca edite um valor para
// acompanhar uma fórmula alterada: um teste falhando significa que o CALC-01
// mudou um número derivado.

import { describe, expect, it } from 'bun:test'
import * as calculations from '@/lib/calculations'
import { calculateAttributeTotal } from '@/lib/calculations'

describe('calculateAttributeTotal', () => {
  const attribute = { race: 10, class: 12, bonus: 2 }

  it('nível 0 não aplica bônus de nível', () => {
    expect(calculateAttributeTotal(attribute, 0)).toBe(24)
  })

  it('nível 4 ainda não tem bônus e nível 5 soma +1', () => {
    expect(calculateAttributeTotal(attribute, 4)).toBe(24)
    expect(calculateAttributeTotal(attribute, 5)).toBe(25)
  })

  it('nível 9 mantém +1 e nível 10 soma +2', () => {
    expect(calculateAttributeTotal(attribute, 9)).toBe(25)
    expect(calculateAttributeTotal(attribute, 10)).toBe(26)
  })

  it('nível 99 soma +19', () => {
    expect(calculateAttributeTotal(attribute, 99)).toBe(43)
  })
})

// Mantém o namespace importado para o guard de exports (Task 2)
void calculations
