import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api, type CategorizeResponse, type Labels9 } from "../lib/api";

const TAXONOMY: Record<keyof Labels9, string[]> = {
  kategori: [
    "Müşteri / Cari İşlemleri", "Ürün / Stok İşlemleri", "Sipariş / Satış İşlemleri",
    "Alış İşlemleri", "İade İşlemleri", "E-Belge İşlemleri", "Belge Basım / Dizayn",
    "Tahsilat / Ödeme", "Kullanıcı / Yetki Yönetimi", "Satış Ekibi / Rut / Ziyaret",
    "Raporlama / Dashboard", "Aktarım / SmartConnect", "İskonto / Promosyon / Fiyat",
    "Sevkiyat / Stok / Depo", "Sözleşme / Hedef / Prim",
  ],
  etkilenen_nesne: [
    "Müşteri / Cari Kartı","Ürün / Stok Kartı","Fiyat Listesi","Sipariş","Satış Faturası",
    "Alış Faturası","İade Faturası","İrsaliye","E-Fatura","E-Arşiv","Matbu / Seri No",
    "Belge Dizaynı","Tahsilat","Kredi Kartı / POS","Banka / EFT / Havale","Çek / Senet",
    "Kullanıcı / Şifre","Yetki / Rol","Lisans","Satış Temsilcisi","Rut / Ziyaret",
    "Rapor","Dashboard","SmartConnect / Aktarım","İskonto / Promosyon","Depo / Stok Yeri",
    "Sevkiyat","Sözleşme / Hedef","Cihaz / Mobil","Diğer",
  ],
  platform: ["Backoffice","Mobil","El Terminali","Unidox / 3.Parti Portal"],
  islem_tipi: [
    "Oluşturma / Kayıt","Görüntüleme / Sorgu","Güncelleme / Düzeltme","İptal Etme / Silme",
    "Onaylama","E-Belge Gönderme","Aktarma (Ticari Pakete)","Yazdırma / Basım",
    "Bilgi Gönderme (Mobil Senkron)","Bilgi Alma (Mobil Senkron)","Giriş / Bağlanma",
    "Rapor Alma","Hesaplama / Tutar Kontrolü","Bilgilendirme Talebi","Hata Aldım",
  ],
  etki: ["İş tamamen durdu","Tüm kullanıcılar / distribütör etkileniyor","Tek kullanıcı etkileniyor"],
  kok_neden_grup: [
    "Kullanım / Eğitim","E-Belge / Entegratör (3. parti)","Ana Veri / Kart Tanımı",
    "Parametre / Konfigürasyon","Yetki / Rol","Veri Tutarsızlığı","Dizayn / Matbu / Baskı",
    "Sunucu / Altyapı / Performans","Cihaz / Mobil Ortam","Yazılım Hatası",
    "Hesaplama / İş Kuralı","Entegrasyon / Aktarım","Veri / Veritabanı Hatası",
  ],
  kok_neden_detay: [], // dolu gelir, validate edilmez
  cozum_tipi: [
    "Bilgilendirme","Self-Servis Yönlendirmesi","Parametre düzeltme","Yetki düzenleme",
    "Veri / kart düzeltme","Script çalıştırma (DbUpdate)","Entegratör / servis müdahalesi",
    "Dizayn düzeltme","DLL Geçişi","Versiyon geçişi","Eğitim","Doküman / SSS","Ürün geliştirme",
  ],
  self_servis: [
    "Evet — kullanıcı kendi yapabilirdi",
    "Hayır — operatör müdahalesi gerekiyor",
    "Kısmi — bilgi/yönlendirmeyle yapabilir",
  ],
};

const LABELS_TR: Record<keyof Labels9, string> = {
  kategori: "Kategori (İş Süreci)",
  etkilenen_nesne: "Etkilenen Nesne",
  platform: "Platform",
  islem_tipi: "Müşteri Problem Tipi",
  etki: "Etki",
  kok_neden_grup: "Kök Neden Grubu",
  kok_neden_detay: "Kök Neden Detayı",
  cozum_tipi: "Çözüm Tipi",
  self_servis: "Self-Servis Mümkün mü?",
};

export default function Categorize() {
  const [text, setText] = useState("Müşterime ait bir fatura gönderimi yapmak istediğimde müşterimin alıcı etiketi listelenmiyor bundan dolayı gönderimini yapamıyorum");
  const [result, setResult] = useState<CategorizeResponse | null>(null);
  const [labels, setLabels] = useState<Labels9 | null>(null);
  const [loading, setLoading] = useState(false);
  const [savedMsg, setSavedMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const embHealth = useQuery({ queryKey: ["emb-health"], queryFn: api.embeddingsHealth, refetchInterval: 30_000 });

  async function suggest() {
    if (text.trim().length < 10) {
      setErr("Metin çok kısa");
      return;
    }
    setErr(null);
    setLoading(true);
    setResult(null);
    setLabels(null);
    setSavedMsg(null);
    try {
      const r = await api.categorize(text);
      setResult(r);
      setLabels(r.labels);
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  async function save(wasCorrected: boolean) {
    if (!labels) return;
    setLoading(true);
    try {
      const r = await api.feedback({
        sourceText: text,
        aiSuggestion: result?.labels ?? null,
        finalLabels: labels,
        wasCorrected,
      });
      setSavedMsg(`✓ Kaydedildi (KB #${r.bildirimNo}). Vector store boyutu: ${r.vectorStoreSize}. Sonraki tahminler bu örneği kullanır.`);
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  function setLabel(k: keyof Labels9, v: string) {
    if (!labels) return;
    setLabels({ ...labels, [k]: v });
  }

  const aiChanged = result && labels && (Object.keys(result.labels) as (keyof Labels9)[]).some((k) => result.labels[k] !== labels[k]);

  return (
    <div className="wrap">
      <h1 className="page-title">AI ile Kategorize</h1>
      <p className="page-sub">
        Bilgi tabanı: <strong>{embHealth.data?.total ?? "…"}</strong> ticket indexed ·
        Model: <code>{embHealth.data?.model ?? "—"}</code>
      </p>

      <div className="card" style={{ marginTop: 16 }}>
        <h3 style={{ marginTop: 0 }}>Müşteri metni</h3>
        <p className="card-desc">Müşterinin yazdığını yapıştır → RAG sistem benzer geçmiş vakaları bulup öneri sunsun.</p>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={4}
          style={{ width: "100%", padding: 12, fontSize: 13.5, fontFamily: "Inter", border: "1px solid var(--border)", borderRadius: 6, resize: "vertical" }}
        />
        <div style={{ marginTop: 10, display: "flex", gap: 8, alignItems: "center" }}>
          <button onClick={suggest} disabled={loading} style={{ padding: "8px 16px", background: "var(--brand)", color: "#fff", border: "none", borderRadius: 6, cursor: "pointer", fontWeight: 600 }}>
            {loading ? "⟳ Düşünüyor…" : "✨ AI ile Önerle"}
          </button>
          {err && <span style={{ color: "var(--p1)", fontSize: 12 }}>{err}</span>}
        </div>
      </div>

      {result && labels && (
        <>
          <div className="card" style={{ marginTop: 16, borderLeft: "4px solid #2563eb" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 12, flexWrap: "wrap" }}>
              <h3 style={{ margin: 0 }}>AI Önerisi</h3>
              <div style={{ display: "flex", gap: 12, alignItems: "center", fontSize: 12 }}>
                <span style={{ color: result.confidence >= 0.8 ? "#16a34a" : result.confidence >= 0.6 ? "#ea580c" : "#dc2626", fontWeight: 700 }}>
                  Güven: %{Math.round(result.confidence * 100)}
                </span>
                <span className="mono" style={{ color: "var(--muted)", fontSize: 11 }}>
                  {result.meta.similarSearchMs}ms sim · {result.meta.aiMs}ms ai
                </span>
              </div>
            </div>
            <p style={{ fontSize: 12.5, color: "var(--txt-2)", margin: "8px 0 14px", fontStyle: "italic" }}>
              {result.reasoning}
            </p>

            <div className="detail-tags">
              {(Object.keys(LABELS_TR) as (keyof Labels9)[]).map((k) => (
                <div key={k} className="detail-tag" style={{ borderLeft: "3px solid #2563eb" }}>
                  <span className="lbl">{LABELS_TR[k]}</span>
                  {TAXONOMY[k].length > 0 ? (
                    <select
                      value={labels[k]}
                      onChange={(e) => setLabel(k, e.target.value)}
                      style={{ font: "inherit", fontSize: 12.5, fontWeight: 600, padding: "5px 8px", border: "1px solid var(--border)", borderRadius: 4, background: "#fff", marginTop: 2 }}
                    >
                      {!TAXONOMY[k].includes(labels[k]) && <option value={labels[k]}>{labels[k]}</option>}
                      {TAXONOMY[k].map((v) => <option key={v} value={v}>{v}</option>)}
                    </select>
                  ) : (
                    <input
                      type="text"
                      value={labels[k]}
                      onChange={(e) => setLabel(k, e.target.value)}
                      style={{ font: "inherit", fontSize: 12.5, fontWeight: 600, padding: "5px 8px", border: "1px solid var(--border)", borderRadius: 4, background: "#fff", marginTop: 2 }}
                    />
                  )}
                </div>
              ))}
            </div>

            <div style={{ marginTop: 14, display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
              {aiChanged ? (
                <button onClick={() => save(true)} disabled={loading} style={{ padding: "8px 16px", background: "#f59e0b", color: "#fff", border: "none", borderRadius: 6, cursor: "pointer", fontWeight: 600 }}>
                  ✏️ Düzelttim, Kaydet (sisteme öğret)
                </button>
              ) : (
                <button onClick={() => save(false)} disabled={loading} style={{ padding: "8px 16px", background: "#16a34a", color: "#fff", border: "none", borderRadius: 6, cursor: "pointer", fontWeight: 600 }}>
                  ✅ AI Doğru, Onayla (KB'ye ekle)
                </button>
              )}
              {savedMsg && <span style={{ color: "#16a34a", fontSize: 12 }}>{savedMsg}</span>}
            </div>
          </div>

          <div className="card" style={{ marginTop: 16 }}>
            <h3 style={{ marginTop: 0 }}>Benzer Geçmiş Vakalar ({result.similarExamples.length})</h3>
            <p className="card-desc">AI bu örneklere bakarak karar verdi:</p>
            <table className="tickets-table">
              <thead>
                <tr>
                  <th style={{ width: 60 }}>Benzerlik</th>
                  <th>ID</th>
                  <th>Müşteri Sorusu</th>
                  <th>Kategori</th>
                  <th>İşlem Tipi</th>
                  <th>Kök Neden</th>
                </tr>
              </thead>
              <tbody>
                {result.similarExamples.map((s) => (
                  <tr key={s.bildirimNo}>
                    <td style={{ fontFamily: "JetBrains Mono", fontWeight: 700, color: s.similarity > 0.85 ? "#16a34a" : s.similarity > 0.7 ? "#ea580c" : "#71717a" }}>
                      %{Math.round(s.similarity * 100)}
                    </td>
                    <td><span className="id">#{s.bildirimNo}</span></td>
                    <td className="summary">{s.musteriSorunu}</td>
                    <td>{s.labels.kategori}</td>
                    <td>{s.labels.islem_tipi}</td>
                    <td>{s.labels.kok_neden_grup}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
