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

const myIcon = L.divIcon({
  className: "",
  html: '<div class="my-location"></div>',
  iconSize: [18, 18],
});

const targetIcon = new L.Icon({
  iconUrl:
    "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

export default function MapComponent() {
  const [myPos, setMyPos] = useState<Pos | null>(null);
  const [targetPos, setTargetPos] = useState<Pos | null>(null);
  const [route, setRoute] = useState<[number, number][]>([]);

  // ✅ ปุ่มนำทางต้องอยู่ในนี้
  const openNavigation = () => {
    if (!targetPos) return;

    const url = `https://www.google.com/maps/dir/?api=1&destination=${targetPos.lat},${targetPos.lng}&travelmode=driving`;
    window.open(url, "_blank");
  };

  useEffect(() => {
    navigator.geolocation.watchPosition((pos) => {
      setMyPos({
        lat: pos.coords.latitude,
        lng: pos.coords.longitude,
      });
    });
  }, []);

  useEffect(() => {
    let running = true;

    const loop = async () => {
      if (!myPos) {
        setTimeout(loop, 4000);
        return;
      }

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

      if (running) setTimeout(loop, 4000);
    };

    loop();

    return () => {
      running = false;
    };
  }, [myPos]);

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

      {/* ✅ ปุ่มนำทาง */}
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
