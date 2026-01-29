'use client'

import { MapContainer, TileLayer, Marker } from 'react-leaflet'
import L from 'leaflet'
import { useEffect, useState } from 'react'
import axios from 'axios'

const icon = new L.Icon({
  iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
})

type Pos = { lat: number; lng: number }

export default function MapComponent() {
  const [pos, setPos] = useState<Pos | null>(null)

  useEffect(() => {
    let running = true

    const fetchLoop = async () => {
      try {
        const res = await axios.get<Pos>('/api/push-location')
        if (running) {
          setPos(res.data)
        }
      } catch (e) {
        console.log(e)
      }

      // รอ 3 วิ แล้วเรียกใหม่
      if (running) {
        setTimeout(fetchLoop, 3000)
      }
    }

    fetchLoop()

    return () => {
      running = false
    }
  }, [])

  if (!pos) return <div>Loading...</div>

  return (
    <MapContainer
      center={[pos.lat, pos.lng]}
      zoom={17}
      style={{ height: '100vh' }}
    >
      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
      <Marker position={[pos.lat, pos.lng]} icon={icon} />
    </MapContainer>
  )
}
