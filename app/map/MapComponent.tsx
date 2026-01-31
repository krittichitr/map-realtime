"use client";

import { MapContainer, TileLayer, Marker, Polyline } from "react-leaflet";
import L from "leaflet";
import { useEffect, useState, useRef } from "react";
import axios from "axios";

type Pos = { lat: number; lng: number };
type OSRMRoute = {
  routes: {
    geometry: {
      coordinates: [number, number][];
    };
  }[];
};

const myIcon = L.divIcon({
  className: "",
  html: '<div class="my-location"></div>',
  iconSize: [18, 18],
});

const targetIcon = new L.Icon({
  iconUrl:
    "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png",
  shadowUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

function distance(a: Pos, b: Pos) {
  const R = 6371e3;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const x =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(a.lat) *
      Math.cos(b.lat) *
      Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));
}

export default function MapComponent() {
  const [myPos, setMyPos] = useState<Pos | null>(null);
  const [targetPos, setTargetPos] = useState<Pos | null>(null);
  const [route, setRoute] = useState<[number, number][]>([]);
  const lastTargetRef = useRef<Pos | null>(null);
  const navigatingRef = useRef(false);

  // ตำแหน่งเรา
  useEffect(() => {
    navigator.geolocation.watchPosition((pos) => {
      setMyPos({
        lat: pos.coords.latitude,
        lng: pos.coords.longitude,
      });
    });
  }, []);

  // ปุ่มนำทาง
  const openNavigation = () => {
    if (!targetPos) return;
    navigatingRef.current = true;

    const url = `https://www.google.com/maps/dir/?api=1&destination=${targetPos.lat},${targetPos.lng}&travelmode=driving&dir_action=navigate`;
    window.open(url, "_blank");
  };

  // 🔁 Loop คำนวณเส้นทาง realtime (ของเดิมที่เวิร์ค)
  useEffect(() => {
    const interval = setInterval(async () => {
      if (!myPos) return;

      try {
        const res = await axios.get<Pos>("/api/push-location");
        const target = res.data;
        setTargetPos(target);

        const routeRes = await axios.get<OSRMRoute>(
          `https://router.project-osrm.org/route/v1/driving/${myPos.lng},${myPos.lat};${target.lng},${target.lat}?overview=full&geometries=geojson`
        );

        const coords = routeRes.data.routes[0].geometry.coordinates.map(
          (c) => [c[1], c[0]] as [number, number]
        );

        setRoute(coords);
      } catch (e) {
        console.log(e);
      }
    }, 4000);

    return () => clearInterval(interval);
  }, [myPos]);

  // 🧠 Watch เป้าขยับ (แยกจาก loop)
  useEffect(() => {
    if (!targetPos) return;

    if (lastTargetRef.current && navigatingRef.current) {
      const d = distance(lastTargetRef.current, targetPos);
      if (d > 30) {
        console.log("Target moved → re-navigate");
        openNavigation();
      }
    }

    lastTargetRef.current = targetPos;
  }, [targetPos]);

  if (!myPos) return <div>กำลังหาตำแหน่งเรา...</div>;

  return (
    <>
      <MapContainer
        center={[myPos.lat, myPos.lng]}
        zoom={16}
        style={{ height: "100vh" }}
      >
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

        <Marker position={[myPos.lat, myPos.lng]} icon={myIcon} />

        {targetPos && (
          <Marker
            position={[targetPos.lat, targetPos.lng]}
            icon={targetIcon}
          />
        )}

        {route.length > 0 && <Polyline positions={route} />}
      </MapContainer>

      <button
        onClick={openNavigation}
        style={{
          position: "absolute",
          bottom: 20,
          left: "50%",
          transform: "translateX(-50%)",
          padding: "12px 20px",
          background: "#1e90ff",
          color: "white",
          border: "none",
          borderRadius: "8px",
          fontSize: "16px",
          zIndex: 1000,
        }}
      >
        🧭 นำทางไปหาเป้าหมาย
      </button>
    </>
  );
}
