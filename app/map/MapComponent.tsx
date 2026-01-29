'use client'

import { MapContainer, TileLayer, Marker } from 'react-leaflet'
import { useEffect, useState } from 'react'
import axios from 'axios'
import L from 'leaflet'

type Position = {
  lat: number
  lng: number
}

export default function MapComponent() {
  const [pos, setPos] = useState<Position | null>(null)

  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const res = await axios.get<Position>('/api/push-location')
        setPos(res.data)
      } catch (err) {
        console.log('fetch location error', err)
      }
    }, 3000)

    return () => clearInterval(interval)
  }, [])

  if (!pos) return <div>Loading map...</div>

  return (
    <MapContainer
      center={[pos.lat, pos.lng]}
      zoom={16}
      style={{ height: '100vh', width: '100%' }}
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <Marker position={[pos.lat, pos.lng]} />
    </MapContainer>
  )
}
