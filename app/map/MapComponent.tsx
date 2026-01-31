"use client";

import { MapContainer, TileLayer, Marker, Polyline, useMap } from "react-leaflet";
import L from "leaflet";
import { useEffect, useRef, useState } from "react";
import axios from "axios";

type Pos = { lat: number; lng: number };
type OSRMRoute = {
  routes: {
    geometry: {
      coordinates: [number, number][];
    };
  }[];
};

// 🔵 หมุดเรา
const myIcon = L.divIcon({
  className: "",
  html: `<div style="
    width:18px;
    height:18px;
    background:#1e90ff;
    border-radius:50%;
    border:3px solid white;
    box-shadow:0 0 6px #1e90ff;
  "></div>`,
  iconSize: [18, 18],
});

// 🔴 หมุดเป้าหมาย
const targetIcon = new L.Icon({
  iconUrl:
    "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

// 📌 ให้แมพตามเรา
function FollowMe({ pos }: { pos: Pos }) {
  const map = useMap();
  useEffect(() => {
    map.setView([pos.lat, pos.lng]);
  }, [pos, map]);
  return null;
}

export default function MapComponent() {
  const [myPos, setMyPos] = useState<Pos | null>(null);
  const [targetPos, setTargetPos] = useState<Pos | null>(null);
  const [route, setRoute] = useState<[number, number][]>([]);
  const watchId = useRef<number | null>(null);

  // ✅ GPS realtime (สำคัญมาก)
  useEffect(() => {
    watchId.current = navigator.geolocation.watchPosition(
      (pos) => {
        setMyPos({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        });
      },
      console.log,
      {
        enableHighAccuracy: true,
        maximumAge: 0,
        timeout: 5000,
      }
    );

    return () => {
      if (watchId.current) navigator.geolocation.clearWatch(watchId.current);
    };
  }, []);

  // ✅ แก้ iOS รีหน้าแล้วเส้นหาย
  useEffect(() => {
    const refreshGPS = () => {
      navigator.geolocation.getCurrentPosition((pos) => {
        setMyPos({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        });
      });
    };

    window.addEventListener("focus", refreshGPS);
    document.addEventListener("visibilitychange", refreshGPS);

    return () => {
      window.removeEventListener("focus", refreshGPS);
      document.removeEventListener("visibilitychange", refreshGPS);
    };
  }, []);

  // ✅ Loop ดึงตำแหน่ง + คำนวณเส้นทาง
  useEffect(() => {
    let running = true;

    const loop = async () => {
      if (!myPos) {
        setTimeout(loop, 3000);
        return;
      }

      try {
        // ดึงตำแหน่งเป้าหมาย
        const res = await axios.get<Pos>("/api/push-location");
        const target = res.data;
        setTargetPos(target);

        // ❗ ป้องกัน iOS GPS ค้างค่าเดิม
        if (
          Math.abs(myPos.lat - target.lat) < 0.00001 &&
          Math.abs(myPos.lng - target.lng) < 0.00001
        ) {
          setTimeout(loop, 3000);
          return;
        }

        // ขอเส้นทาง
        const routeRes = await axios.get<OSRMRoute>(
          `https://router.project-osrm.org/route/v1/driving/${myPos.lng},${myPos.lat};${target.lng},${target.lat}?overview=full&geometries=geojson`
        );

        if (!routeRes.data.routes.length) {
          setTimeout(loop, 3000);
          return;
        }

        const coords = routeRes.data.routes[0].geometry.coordinates.map(
          (c) => [c[1], c[0]] as [number, number]
        );

        setRoute(coords);
      } catch (e) {
        console.log(e);
      }

      if (running) setTimeout(loop, 3000);
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
      zoom={17}
      style={{ height: "100vh" }}
    >
      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

      <FollowMe pos={myPos} />

      {/* หมุดเรา */}
      <Marker position={[myPos.lat, myPos.lng]} icon={myIcon} />

      {/* หมุดเป้าหมาย */}
      {targetPos && (
        <Marker position={[targetPos.lat, targetPos.lng]} icon={targetIcon} />
      )}

      {/* เส้นทาง */}
      {route.length > 0 && (
        <Polyline positions={route} pathOptions={{ color: "blue", weight: 5 }} />
      )}
    </MapContainer>
  );
}
