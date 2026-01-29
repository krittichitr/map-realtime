"use client";

import { MapContainer, TileLayer, Marker, Polyline } from "react-leaflet";
import L from "leaflet";
import { useEffect, useState } from "react";
import axios from "axios";

type Pos = { lat: number; lng: number };
type OSRMRoute = {
  routes: {
    geometry: {
      coordinates: [number, number][];
    };
  }[];
};

const icon = new L.Icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

export default function MapComponent() {
  const [myPos, setMyPos] = useState<Pos | null>(null);
  const [targetPos, setTargetPos] = useState<Pos | null>(null);
  const [route, setRoute] = useState<[number, number][]>([]);

  // 📍 ตำแหน่งเราแบบ realtime
  useEffect(() => {
    navigator.geolocation.watchPosition((pos) => {
      setMyPos({
        lat: pos.coords.latitude,
        lng: pos.coords.longitude,
      });
    });
  }, []);

  // 🔁 loop ทุก 4 วิ
  useEffect(() => {
    let running = true;

    const loop = async () => {
      if (!myPos) {
        setTimeout(loop, 4000);
        return;
      }

      try {
        // 1) ดึงตำแหน่งเป้าหมาย
        const res = await axios.get<Pos>("/api/push-location");
        const target = res.data;
        setTargetPos(target);

        // 2) ขอเส้นทางจาก OSRM
        const routeRes = await axios.get<OSRMRoute>(
          `https://router.project-osrm.org/route/v1/driving/${myPos.lng},${myPos.lat};${target.lng},${target.lat}?overview=full&geometries=geojson`,
        );

        const coords = routeRes.data.routes[0].geometry.coordinates.map(
          (c) => [c[1], c[0]] as [number, number],
        );

        setRoute(coords);
      } catch (e) {
        console.log(e);
      }

      if (running) setTimeout(loop, 4000);
    };

    loop();

    return () => {
      running = false;
    };
  }, [myPos]);

  if (!myPos) return <div>กำลังหาตำแหน่งเรา...</div>;

  return (
    <MapContainer
      center={[myPos.lat, myPos.lng]}
      zoom={16}
      style={{ height: "100vh" }}
    >
      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

      {/* หมุดเรา */}
      <Marker position={[myPos.lat, myPos.lng]} icon={icon} />

      {/* หมุดเป้าหมาย */}
      {targetPos && (
        <Marker position={[targetPos.lat, targetPos.lng]} icon={icon} />
      )}

      {/* เส้นนำทาง */}
      {route.length > 0 && <Polyline positions={route} />}
    </MapContainer>
  );
}
