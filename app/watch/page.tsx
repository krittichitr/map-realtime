'use client'
import { useEffect } from 'react'
import axios from 'axios'

export default function Watch() {
  useEffect(() => {
    const interval = setInterval(() => {
      navigator.geolocation.getCurrentPosition(async (pos) => {
        await axios.post('/api/push-location', {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        });
      });
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  return <h1>มือถือกำลังส่ง GPS...</h1>;
}