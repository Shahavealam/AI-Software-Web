export async function POST(req: Request) {
  const body = await req.json();
  const backend = process.env.BACKEND_URL ?? "http://localhost:8000";
  const upstream = await fetch(`${backend}/v1/run`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  console.log("Upstream response status:", upstream);
  return new Response(upstream.body, {
    status: upstream.status,
    headers: { "Content-Type": "text/event-stream" },
  });
}
