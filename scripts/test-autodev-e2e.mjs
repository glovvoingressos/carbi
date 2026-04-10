const baseUrl = process.env.BASE_URL || 'http://127.0.0.1:3000'

async function assertJson(url, expectedStatus, predicate, label) {
  const response = await fetch(url, {
    method: 'GET',
    headers: { Accept: 'application/json' },
  })

  const body = await response.json().catch(() => null)

  if (response.status !== expectedStatus) {
    throw new Error(`${label}: status ${response.status} != ${expectedStatus}`)
  }

  if (!predicate(body)) {
    throw new Error(`${label}: payload inesperado ${JSON.stringify(body)}`)
  }

  console.log(`OK: ${label}`)
}

async function assertPost(url, expectedStatus, label) {
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify({}),
  })

  const body = await response.json().catch(() => null)

  if (response.status !== expectedStatus) {
    throw new Error(`${label}: status ${response.status} != ${expectedStatus}`)
  }

  if (!body || typeof body.success !== 'boolean') {
    throw new Error(`${label}: envelope inválido`)
  }

  console.log(`OK: ${label}`)
}

async function run() {
  await assertJson(
    `${baseUrl}/api/vehicles/not-a-uuid/enrichment`,
    400,
    (body) => body && body.success === false,
    'vehicle enrichment params validation',
  )

  await assertPost(
    `${baseUrl}/api/vehicles/00000000-0000-0000-0000-000000000000/enrichment/refresh`,
    401,
    'refresh requires auth',
  )

  await assertPost(
    `${baseUrl}/api/admin/vehicles/00000000-0000-0000-0000-000000000000/decode-vin`,
    401,
    'decode vin requires auth',
  )

  await assertPost(
    `${baseUrl}/api/admin/vehicles/00000000-0000-0000-0000-000000000000/sync-autodev`,
    401,
    'sync autodev requires auth',
  )

  if (process.env.TEST_VEHICLE_ID) {
    await assertJson(
      `${baseUrl}/api/vehicles/${process.env.TEST_VEHICLE_ID}/enrichment`,
      200,
      (body) => body && body.success === true,
      'cached enrichment envelope',
    )
  }

  console.log('Auto.dev route checks concluídos.')
}

run().catch((error) => {
  console.error(error)
  process.exit(1)
})
