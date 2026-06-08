"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/spinner";
import {
  Upload,
  Trash2,
  RefreshCw,
  Sparkles,
  FileText,
  Database,
} from "lucide-react";

type SourceType = "pdf" | "panorama_screen" | "ticket_resolution";

type Doc = {
  doc_id: string;
  tenant_id: string;
  source_type: SourceType;
  source_uri: string | null;
  title: string | null;
  chunk_count: number;
  token_count: number;
  ingested_at: string;
  embedding_count: number;
};

type Stats = {
  documents: number;
  chunks: number;
  embeddings: number;
  embedding_coverage: number;
  by_type: Record<string, number>;
  by_tenant: Record<string, number>;
  last_ingest_at: string | null;
  db_size_mb: number;
  vec_available: boolean;
};

const SOURCE_LABELS: Record<SourceType, string> = {
  pdf: "PDF/DOCX",
  panorama_screen: "Ekran",
  ticket_resolution: "Geçmiş Çözüm",
};

const SOURCE_TONES: Record<SourceType, "accent" | "warn" | "good"> = {
  pdf: "accent",
  panorama_screen: "warn",
  ticket_resolution: "good",
};

export default function AdminKbPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [docs, setDocs] = useState<Doc[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [embedding, setEmbedding] = useState(false);
  const [typeFilter, setTypeFilter] = useState<SourceType | "all">("all");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [statsRes, docsRes] = await Promise.all([
        fetch("/api/admin/kb/stats"),
        fetch(
          `/api/admin/kb/documents${typeFilter !== "all" ? `?type=${typeFilter}` : ""}`,
        ),
      ]);
      if (statsRes.status === 403) {
        setError("Bu sayfa sadece Süper Admin için.");
        return;
      }
      const statsData = (await statsRes.json()) as Stats;
      const docsData = (await docsRes.json()) as { documents: Doc[] };
      setStats(statsData);
      setDocs(docsData.documents);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, [typeFilter]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleUpload(files: FileList | null) {
    if (!files || files.length === 0) return;
    setUploading(true);
    setError(null);
    try {
      const form = new FormData();
      for (const file of Array.from(files)) {
        form.append("files", file);
      }
      const res = await fetch("/api/admin/kb/upload", {
        method: "POST",
        body: form,
      });
      const data = (await res.json()) as {
        ingested?: Array<{ file: string; chunks: number }>;
        errors?: Array<{ file: string; error: string }>;
        error?: string;
      };
      if (!res.ok || data.error) {
        throw new Error(data.error || `Hata ${res.status}`);
      }
      if (data.errors && data.errors.length > 0) {
        setError(
          `${data.ingested?.length ?? 0} dosya yüklendi, ${data.errors.length} hata: ${data.errors[0]?.error}`,
        );
      }
      await load();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  async function handleEmbedPending() {
    if (!confirm("Bekleyen tüm chunk'lar için embedding üretilecek. Devam?")) return;
    setEmbedding(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/kb/embed", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ maxChunks: 10000 }),
      });
      const data = (await res.json()) as {
        embedded?: number;
        skipped?: number;
        durationMs?: number;
        error?: string;
      };
      if (!res.ok || data.error) throw new Error(data.error || `Hata ${res.status}`);
      alert(
        `${data.embedded} chunk gömüldü (${data.skipped} atlandı, ${((data.durationMs ?? 0) / 1000).toFixed(1)}s)`,
      );
      await load();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setEmbedding(false);
    }
  }

  async function handleDelete(doc: Doc) {
    if (
      !confirm(
        `"${doc.title}" silinecek (${doc.chunk_count} chunk + embeddings). Diski de silmek ister misiniz?`,
      )
    )
      return;
    const deleteFile = confirm(
      "Orijinal dosyayı da diskten silmek ister misiniz? (Tamam = sil, Vazgeç = sadece DB)",
    );
    try {
      const res = await fetch(
        `/api/admin/kb/documents/${encodeURIComponent(doc.doc_id)}${
          deleteFile ? "?deleteFile=true" : ""
        }`,
        { method: "DELETE" },
      );
      const data = (await res.json()) as { ok?: boolean; error?: string };
      if (!res.ok || data.error) throw new Error(data.error || `Hata ${res.status}`);
      await load();
    } catch (err) {
      setError((err as Error).message);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Bilgi Bankası</h1>
        <p className="text-sm text-muted mt-1">
          PDF/DOCX dokümanlarını yönet, chunk + embedding üretimi.
        </p>
      </div>

      {/* Stats kartı */}
      {stats && (
        <Card padding="lg">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <Stat icon={<FileText size={14} />} label="Doküman" value={stats.documents.toLocaleString("tr")} />
            <Stat icon={<Database size={14} />} label="Chunk" value={stats.chunks.toLocaleString("tr")} />
            <Stat
              icon={<Sparkles size={14} />}
              label="Embedding"
              value={`${stats.embeddings.toLocaleString("tr")} (${Math.round(stats.embedding_coverage * 100)}%)`}
            />
            <Stat label="DB Boyutu" value={`${stats.db_size_mb} MB`} />
            <Stat
              label="Son Ingest"
              value={
                stats.last_ingest_at
                  ? new Date(stats.last_ingest_at).toLocaleString("tr-TR", {
                      day: "2-digit",
                      month: "2-digit",
                      hour: "2-digit",
                      minute: "2-digit",
                    })
                  : "—"
              }
            />
          </div>
          <div className="flex flex-wrap gap-1 mt-3">
            <Badge tone="muted" size="sm">
              vec0: {stats.vec_available ? "✓" : "✗"}
            </Badge>
            {Object.entries(stats.by_type).map(([type, n]) => (
              <Badge
                key={type}
                tone={SOURCE_TONES[type as SourceType] ?? "muted"}
                size="sm"
              >
                {SOURCE_LABELS[type as SourceType] ?? type}: {n}
              </Badge>
            ))}
          </div>
        </Card>
      )}

      {/* Upload + actions */}
      <Card padding="lg" tone="accent">
        <CardHeader>Yeni Doküman</CardHeader>
        <div className="flex flex-wrap gap-2 items-center">
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.docx"
            multiple
            onChange={(e) => handleUpload(e.target.files)}
            disabled={uploading}
            className="text-sm"
          />
          {uploading && (
            <span className="text-xs text-muted inline-flex items-center gap-1.5">
              <Spinner size={12} /> Yükleniyor + chunk'lanıyor…
            </span>
          )}
          <div className="ml-auto flex gap-2">
            <Button
              variant="secondary"
              size="sm"
              loading={embedding}
              iconLeft={<Sparkles size={14} />}
              onClick={handleEmbedPending}
            >
              Bekleyen Embedding Üret
            </Button>
            <Button
              variant="ghost"
              size="sm"
              iconLeft={<RefreshCw size={14} />}
              onClick={load}
              disabled={loading}
            >
              Yenile
            </Button>
          </div>
        </div>
        <p className="text-[11px] text-muted mt-2">
          Maksimum 20 dosya/istek, 50 MB/dosya. PDF + DOCX kabul edilir. Yüklenenler
          tenant izole klasörlere kaydedilir (data/kb/pdfs/&lt;tenant&gt;/).
        </p>
      </Card>

      {/* Filter */}
      <div className="flex gap-1">
        {(["all", "pdf", "panorama_screen", "ticket_resolution"] as const).map(
          (t) => (
            <Button
              key={t}
              variant={typeFilter === t ? "primary" : "ghost"}
              size="sm"
              onClick={() => setTypeFilter(t)}
            >
              {t === "all" ? "Hepsi" : SOURCE_LABELS[t as SourceType]}
            </Button>
          ),
        )}
      </div>

      {error && (
        <Card tone="bad" padding="md">
          <p className="text-sm">{error}</p>
        </Card>
      )}

      {/* Document table */}
      {loading && !docs && (
        <Card padding="lg" tone="muted">
          <p className="text-sm text-muted">Yükleniyor…</p>
        </Card>
      )}
      {docs && docs.length === 0 && (
        <Card padding="lg" tone="muted">
          <p className="text-sm text-muted">Bu filtreyle eşleşen doküman yok.</p>
        </Card>
      )}
      {docs && docs.length > 0 && (
        <Card padding="none">
          <table className="w-full text-sm">
            <thead className="text-[10px] uppercase tracking-wider text-muted border-b border-border">
              <tr>
                <th className="text-left p-3">Başlık</th>
                <th className="text-left p-3">Tip</th>
                <th className="text-right p-3">Chunk</th>
                <th className="text-right p-3">Embed</th>
                <th className="text-left p-3">Tarih</th>
                <th className="text-right p-3">İşlem</th>
              </tr>
            </thead>
            <tbody>
              {docs.map((d) => (
                <tr
                  key={d.doc_id}
                  className="border-b border-border last:border-0"
                >
                  <td className="p-3 font-medium max-w-md truncate" title={d.title ?? ""}>
                    {d.title ?? d.doc_id}
                  </td>
                  <td className="p-3">
                    <Badge tone={SOURCE_TONES[d.source_type]} size="sm">
                      {SOURCE_LABELS[d.source_type]}
                    </Badge>
                  </td>
                  <td className="p-3 text-right font-mono text-xs">
                    {d.chunk_count}
                  </td>
                  <td className="p-3 text-right">
                    {d.embedding_count === d.chunk_count ? (
                      <span className="text-good font-mono text-xs">
                        {d.embedding_count}/{d.chunk_count} ✓
                      </span>
                    ) : (
                      <span className="text-warn font-mono text-xs">
                        {d.embedding_count}/{d.chunk_count}
                      </span>
                    )}
                  </td>
                  <td className="p-3 text-xs text-muted">
                    {new Date(d.ingested_at).toLocaleDateString("tr-TR")}
                  </td>
                  <td className="p-3 text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      iconLeft={<Trash2 size={12} />}
                      onClick={() => handleDelete(d)}
                    >
                      Sil
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  );
}

function Stat({
  icon,
  label,
  value,
}: {
  icon?: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-wider text-muted flex items-center gap-1">
        {icon}
        {label}
      </div>
      <div className="text-lg font-semibold tracking-tight mt-1">{value}</div>
    </div>
  );
}
