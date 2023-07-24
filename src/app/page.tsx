'use client';

import { useRef } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();
  const hashRef = useRef<HTMLInputElement>(null);

  const go = () => {
    router.push(`/${hashRef.current!.value}`);
  };

  return (
    <main className="bg-slate-50 flex min-h-screen flex-col items-center justify-between p-24">
      <div>
        <div className="text-2xl text-center mb-8">XRPL Path Visualizer</div>
        <div>
          <input
            ref={hashRef}
            type="text"
            className="input rounded-r-none min-w-[25rem]"
            placeholder="Enter Txn hash"
          />
          <button className="btn btn-primary px-8 rounded-l-none" onClick={go}>
            Go
          </button>
        </div>
      </div>
    </main>
  );
}
