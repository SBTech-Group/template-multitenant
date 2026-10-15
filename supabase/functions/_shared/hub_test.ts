// Sem dependência externa: o teste roda offline.
function assertEquals<T>(actual: T, expected: T) {
  if (JSON.stringify(actual) !== JSON.stringify(expected)) throw new Error(`esperado ${JSON.stringify(expected)}, veio ${JSON.stringify(actual)}`)
}
import { equal, invalidProvision, isHub } from './hub.ts'

Deno.test('equal compara conteúdo', async () => {
  assertEquals(await equal('abc', 'abc'), true)
  assertEquals(await equal('abc', 'abd'), false)
  assertEquals(await equal('', 'x'), false)
})

Deno.test('isHub exige o token configurado', async () => {
  const req = (h?: string) => new Request('https://x', { headers: h ? { authorization: h } : {} })
  assertEquals(await isHub(req('Bearer segredo'), 'segredo'), true)
  assertEquals(await isHub(req('Bearer outro'), 'segredo'), false)
  assertEquals(await isHub(req(), 'segredo'), false)
  assertEquals(await isHub(req('Bearer '), ''), false)
})

Deno.test('invalidProvision valida slug, módulos e e-mail', () => {
  assertEquals(invalidProvision({ slug: 'arena-centro', modulos: ['admin'] }), null)
  assertEquals(invalidProvision({ slug: 'Arena', modulos: [] }) !== null, true)
  assertEquals(invalidProvision({ slug: 'ok', modulos: 'admin' }) !== null, true)
  assertEquals(invalidProvision({ slug: 'ok', modulos: [], admin_email: 'sem-arroba' }) !== null, true)
  assertEquals(invalidProvision(null) !== null, true)
})
