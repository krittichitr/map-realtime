"use client";

export const dynamic = "force-dynamic";

import { Suspense } from "react";
import WatchClient from "./watch-client";

export default function Page() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <WatchClient />
    </Suspense>
  );
}
