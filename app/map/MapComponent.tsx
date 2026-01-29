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

// 🔵 วงกลมตำแหน่งเรา
const myIcon = L.divIcon({
  className: "",
  html: '<div class="my-location"></div>',
  iconSize: [18, 18],
});

// 🔴 หมุดเป้าหมาย
const targetIcon = new L.Icon({
  iconUrl:
    "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png",
  shadowUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

// 📏 คำนวณระยะทาง (เมตร)
function distance(a: Pos, b: Pos) {
  const R = 6371e3;
  const φ1 = (a.lat * Math.PI) / 180;
  const φ2 = (b.lat * Math.PI) / 180;
  const Δφ = ((b.lat - a.lat) * Math.PI) / 180;
  const Δλ = ((b.lng - a.lng) * Math.PI) / 180;

  const x =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) *
    Math.sin(Δλ / 2) * Math.sin(Δλ / 2);

  const c = 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));
  return R * c;
}

export default function MapComponent() {
  const [myPos, setMyPos] = useState<Pos | null>(null);
  const [targetPos, setTargetPos] = useState<Pos | null>(null);
  const [route, setRoute] = useState<[number, number][]>([]);
  const [lastTarget, setLastTarget] = useState<Pos | null>(null);
  const [isNavigating, setIsNavigating] = useState(false);

  // 📍 ตำแหน่งเรา
  useEffect(() => {
    navigator.geolocation.watchPosition((pos) => {
      setMyPos({
        lat: pos.coords.latitude,
        lng: pos.coords.longitude,
      });
    });
  }, []);

  // 🧭 เปิด Google Maps นำทาง
  const openNavigation = (target: Pos) => {
    const url = `https://www.google.com/maps/dir/?api=1&destination=${target.lat},${target.lng}&travelmode=driving&dir_action=navigate`;
    window.open(url, "_blank");
    setIsNavigating(true);
  };

  // 🔁 loop realtime
  useEffect(() => {
    let running = true;

    const loop = async () => {
      if (!myPos) {
        setTimeout(loop, 4000);
        return;
      }

      try {
        // ดึงเป้าล่าสุด
        const res = await axios.get<Pos>("/api/push-location");
        const target = res.data;
        setTargetPos(target);

        // ถ้ากำลังนำทาง และเป้าขยับ
        if (lastTarget && isNavigating) {
          const d = distance(lastTarget, target);

          if (d > 25) {
            console.log("Target moved → re-navigate");
            openNavigation(target);
          }
        }

        setLastTarget(target);

        // ขอเส้นทาง OSRM
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

      if (running) setTimeout(loop, 4000);
    };

    loop();

    return () => {
      running = false;
    };
  }, [myPos, lastTarget, isNavigating]);

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

      {/* ปุ่มนำทาง */}
      <button
        onClick={() => targetPos && openNavigation(targetPos)}
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
