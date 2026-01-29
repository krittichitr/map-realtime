let latestLocation = {
  lat: 13.7563,
  lng: 100.5018,
}

export async function POST(req: Request) {
  const body = await req.json()
  const { lat, lng } = body

  latestLocation = { lat, lng }

  return new Response(JSON.stringify({ ok: true }), { status: 200 })
}

export async function GET() {
  return new Response(JSON.stringify(latestLocation), {
    status: 200,
    headers: { 'Cache-Control': 'no-store' },
  })
}
