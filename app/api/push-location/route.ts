const users: Record<string, { lat: number; lng: number }> = {}

export async function POST(req: Request) {
  const { uid, lat, lng } = await req.json()

  if (!uid) {
    return Response.json({ error: "no uid" }, { status: 400 })
  }

  users[uid] = { lat, lng }

  return Response.json({ success: true })
}

export async function GET() {
  return Response.json(users)
}
