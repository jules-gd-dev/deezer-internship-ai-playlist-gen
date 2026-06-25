import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const backendUrl = process.env.BACKEND_URL || "http://backend:8000";

    console.log(`[Next.js API Proxy] Forwarding generate request to backend: ${backendUrl}/api/generate`);

    const res = await fetch(`${backendUrl}/api/generate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      console.error(`[Next.js API Proxy] Backend returned error status ${res.status}:`, errData);
      return NextResponse.json(errData, { status: res.status });
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (error: any) {
    console.error("[Next.js API Proxy] Request failed:", error);
    return NextResponse.json(
      { error: error.message || "Failed to communicate with the generation backend" },
      { status: 502 }
    );
  }
}
