"use client";

import { MapContainer, TileLayer, Marker } from "react-leaflet";
import { useEffect, useState } from "react";
import axios from "axios";

import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

// 🔥 FIX leaflet marker icon บน Next.js / Vercel
delete (L.Icon.Default.prototype as any)._getIconUrl

L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl:
    'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl:
    'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})


type Position = {
  lat: number;
  lng: number;
};

export default function MapComponent() {
  const [pos, setPos] = useState<Position | null>(null);

  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const res = await axios.get<Position>("/api/push-location");
        setPos({
          lat: res.data.lat,
          lng: res.data.lng,
        });
      } catch (err) {
        console.log("fetch location error", err);
      }
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  if (!pos) return <div>Loading map...</div>;

  return (
    <MapContainer
      center={[pos.lat, pos.lng]}
      zoom={16}
      style={{ height: "100vh", width: "100%" }}
    >
      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
      {pos && (
        <Marker key={`${pos.lat}-${pos.lng}`} position={[pos.lat, pos.lng]} />
      )}
    </MapContainer>
  );
}
