"use client";

import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import { useEffect, useState } from "react";
import axios from "axios";
import "leaflet/dist/leaflet.css";

type Pos = { lat: number; lng: number };

const icon = new L.Icon({
  iconUrl:
    "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

export default function MapPage() {
  const [users, setUsers] = useState<Record<string, Pos>>({});

  useEffect(() => {
    const interval = setInterval(async () => {
      const res = await axios.get<Record<string, Pos>>("/api/push-location");
      setUsers(res.data);
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  return (
    <MapContainer
      center={[16.8211, 100.2659]}
      zoom={15}
      style={{ height: "100vh" }}
    >
      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

      {Object.entries(users).map(([uid, pos]) => (
        <Marker key={uid} position={[pos.lat, pos.lng]} icon={icon}>
          <Popup>
            <b>{uid}</b>
            <br />
            {pos.lat}, {pos.lng}
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
