'use client'

import { MapContainer, TileLayer, Marker, useMap } from 'react-leaflet'
import { useEffect, useState } from 'react'
import axios from 'axios'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

// ✅ แก้ marker icon หาย
delete (L.Icon.Default.prototype as any)._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl:
    'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

// ✅ ทำให้ map เลื่อนตามตำแหน่งใหม่
function Recenter({ lat, lng }: { lat: number; lng: number }) {
  const map = useMap()

  useEffect(() => {
    map.setView([lat, lng], map.getZoom())
  }, [lat, lng, map])

  return null
}

export default function MapComponent() {
  const [pos, setPos] = useState<{ lat: number; lng: number } | null>(null)

  // ⏱ ดึงตำแหน่งทุก 3 วิ
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const res = await axios.get('/api/push-location')
        setPos(res.data)
      } catch (err) {
        console.log('fetch location error', err)
      }
    }, 3000)

    return () => clearInterval(interval)
  }, [])

  return (
    <MapContainer
      center={[13.7563, 100.5018]}
      zoom={16}
      style={{ height: '100vh', width: '100%' }}
    >
      <TileLayer
        attribution='&copy; OpenStreetMap contributors'
        url='https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
      />

      {pos && (
        <>
          {/* ✅ key สำคัญมาก ทำให้ marker ขยับ */}
          <Marker
            key={`${pos.lat}-${pos.lng}`}
            position={[pos.lat, pos.lng]}
          />
          <Recenter lat={pos.lat} lng={pos.lng} />
        </>
      )}
    </MapContainer>
  )
}
