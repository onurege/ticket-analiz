import ExcelJS from "exceljs";
import { listMembersOfCategory, listTopicsFromBundle, loadBundle } from "@/lib/ticket/recategorizer";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  const bundle = loadBundle();
  if (!bundle) {
    return Response.json(
      { error: "Sınıflandırma verisi yok (data/topics-v2)." },
      { status: 404 },
    );
  }
  const topics = listTopicsFromBundle(bundle);
  const total = topics.reduce((s, t) => s + t.count, 0);

  const wb = new ExcelJS.Workbook();
  wb.creator = "EnRoute Destek Merkezi";
  wb.created = new Date();

  // === Sheet 1: Özet ===
  const ws1 = wb.addWorksheet("Özet", { views: [{ state: "frozen", ySplit: 1 }] });
  ws1.columns = [
    { header: "Sıra", key: "rank", width: 6 },
    { header: "Kategori", key: "title", width: 50 },
    { header: "Sayı", key: "count", width: 8 },
    { header: "%", key: "pct", width: 8 },
    { header: "Kritik", key: "kritik", width: 8 },
    { header: "Yüksek", key: "yuksek", width: 8 },
    { header: "Normal", key: "normal", width: 8 },
    { header: "Diğer", key: "diger", width: 8 },
    { header: "İlk Görülme", key: "first", width: 14 },
    { header: "Son Görülme", key: "last", width: 14 },
    { header: "ID", key: "id", width: 32 },
  ];
  topics.forEach((t, i) => {
    ws1.addRow({
      rank: i + 1,
      title: t.category.title,
      count: t.count,
      pct: total > 0 ? Number((t.count / total).toFixed(4)) : 0,
      kritik: t.severityMix.Kritik,
      yuksek: t.severityMix.Yüksek,
      normal: t.severityMix.Normal,
      diger: t.severityMix.other,
      first: t.firstSeen ?? "",
      last: t.lastSeen ?? "",
      id: t.category.id,
    });
  });
  // Header stilizasyon
  ws1.getRow(1).font = { bold: true };
  ws1.getColumn("pct").numFmt = "0.0%";
  ws1.autoFilter = {
    from: { row: 1, column: 1 },
    to: { row: 1, column: ws1.columnCount },
  };

  // === Sheet 2: Atamalar (her ticket bir satır) ===
  const ws2 = wb.addWorksheet("Atamalar", { views: [{ state: "frozen", ySplit: 1 }] });
  ws2.columns = [
    { header: "Bildirim_No", key: "bildirim_no", width: 14 },
    { header: "Kategori", key: "kategori", width: 40 },
    { header: "Güven %", key: "guven", width: 10 },
    { header: "Tarih", key: "tarih", width: 12 },
    { header: "Proje", key: "proje", width: 22 },
    { header: "Öncelik", key: "oncelik", width: 10 },
    { header: "Açıklama", key: "aciklama", width: 80 },
    { header: "Orijinal Kategori (bilgi)", key: "orjKategori", width: 60 },
  ];
  // Tüm kategoriler için üyeleri tek-tek topla; sayfada sayı/sıraya göre.
  for (const t of topics) {
    const members = listMembersOfCategory(bundle, t.category.id, 10_000);
    for (const m of members) {
      ws2.addRow({
        bildirim_no: m.bildirim_no,
        kategori: t.category.title,
        guven: Math.round(m.confidence * 100) / 100,
        tarih: m.bildirim_tarihi ?? "",
        proje: m.proje ?? "",
        oncelik: m.oncelik ?? "",
        aciklama: (m.aciklama ?? "").replace(/\s+/g, " ").trim(),
        orjKategori: m.kategori_uzun ?? "",
      });
    }
  }
  ws2.getRow(1).font = { bold: true };
  ws2.getColumn("guven").numFmt = "0%";
  ws2.autoFilter = {
    from: { row: 1, column: 1 },
    to: { row: 1, column: ws2.columnCount },
  };

  // === Sheet 3: Taksonomi ===
  const ws3 = wb.addWorksheet("Taksonomi");
  ws3.columns = [
    { header: "ID", key: "id", width: 32 },
    { header: "Başlık", key: "title", width: 50 },
    { header: "Açıklama", key: "description", width: 110 },
  ];
  for (const c of bundle.categories) {
    ws3.addRow(c);
  }
  ws3.getRow(1).font = { bold: true };

  // === Sheet 4: Meta ===
  const ws4 = wb.addWorksheet("Meta");
  const meta = bundle.meta;
  ws4.columns = [
    { header: "Alan", key: "k", width: 24 },
    { header: "Değer", key: "v", width: 60 },
  ];
  ws4.addRows([
    { k: "Üretim Zamanı", v: meta.generatedAt },
    { k: "Kaynak", v: meta.model },
    { k: "Ticket Sayısı", v: meta.ticketCount },
    { k: "Kategori Sayısı", v: meta.categoryCount },
    { k: "Lookback (gün)", v: meta.lookbackDays },
  ]);
  ws4.getRow(1).font = { bold: true };

  const buffer = await wb.xlsx.writeBuffer();
  const stamp = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const filename = `enroute-konular-${stamp}.xlsx`;

  return new Response(buffer, {
    status: 200,
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
