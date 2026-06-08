import { loadBundle, listTopicsFromBundle } from "@/lib/ticket/recategorizer";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  const bundle = loadBundle();
  if (!bundle) {
    return Response.json(
      { error: "Henüz sınıflandırma yapılmadı. /api/topics/build çağır." },
      { status: 404 },
    );
  }
  const topics = listTopicsFromBundle(bundle);
  return Response.json({ meta: bundle.meta, topics });
}
