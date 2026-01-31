"use client";

import { useSearchParams } from "next/navigation";
import { useEffect } from "react";
import axios from "axios";

export default function Watch() {
  const searchParams = useSearchParams();
  const uid = searchParams?.get("uid");

  useEffect(() => {
    if (!uid) return;

    navigator.geolocation.watchPosition((pos) => {
      axios.post("/api/push-location", {
        uid,
        lat: pos.coords.latitude,
        lng: pos.coords.longitude,
      });
    });
  }, [uid]);

  return <div>กำลังส่งตำแหน่งของ {uid}...</div>;
}
