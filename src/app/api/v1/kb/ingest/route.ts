/*
 * POST /v1/kb/ingest — PDF/DOCX dosyalarını upload edip KB'ye ingest eder.
 *
 * Auth: Bearer token
 * Content-Type: multipart/form-data
 * Form alanları:
 *   files: PDF veya DOCX dosyaları (multi)
 *   embedNow: "true" → ingest sonrası embedding'i de hemen çalıştır (yavaş)
 *
 * Yanıt:
 *   {
 *     ingested: [{file, doc_id, chunks, tokens, changed}],
 *     errors: [{file, error}],
 *     embeddingsRun: { embedded, skipped, durationMs } | null
 *   }
 *
 * NOT: PDF'ler `data/kb/pdfs/<tenantId>/` altına, DOCX'ler `data/kb/docs/<tenantId>/`
 * altına kaydedilir → tenant izolasyonu.
 */

import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { v1Endpoint } from "@/lib/api/handler";
import { apiErrorResponse } from "@/lib/api/auth";
import { ingestPdfFile } from "@/lib/kb/sources/pdf";
import { ingestDocxFile } from "@/lib/kb/sources/docx";
import { embedPendingChunks } from "@/lib/kb/embedder";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 600; // 10 dakika — büyük dosyalar + embed için

type IngestResult = {
  file: string;
  doc_id: string;
  chunks: number;
  tokens: number;
  changed: boolean;
};

const SAFE_FILENAME_RE = /^[A-Za-z0-9._\- ()çğıöşüÇĞİÖŞÜ]+$/;
const MAX_FILES_PER_REQUEST = 20;
const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50 MB

export const POST = v1Endpoint(async (req, caller) => {
  // multipart/form-data parse
  let form: FormData;
  try {
    form = await req.formData();
  } catch (err) {
    return apiErrorResponse(
      `Multipart parse hatası: ${(err as Error).message}. Content-Type multipart/form-data olmalı.`,
      400,
    );
  }

  const fileEntries = form.getAll("files").filter((f) => f instanceof File) as File[];
  if (fileEntries.length === 0) {
    return apiErrorResponse(
      "Yüklenecek dosya yok. Form alanı: 'files'",
      400,
    );
  }
  if (fileEntries.length > MAX_FILES_PER_REQUEST) {
    return apiErrorResponse(
      `Tek istekte en fazla ${MAX_FILES_PER_REQUEST} dosya yüklenebilir.`,
      400,
    );
  }

  const embedNowStr = form.get("embedNow");
  const embedNow = embedNowStr === "true" || embedNowStr === "1";

  // Tenant izole klasörlerini hazırla
  const cwd = process.cwd();
  const pdfDir = path.resolve(cwd, "data/kb/pdfs", caller.tenantId);
  const docsDir = path.resolve(cwd, "data/kb/docs", caller.tenantId);
  mkdirSync(pdfDir, { recursive: true });
  mkdirSync(docsDir, { recursive: true });

  const ingested: IngestResult[] = [];
  const errors: Array<{ file: string; error: string }> = [];

  for (const file of fileEntries) {
    try {
      const name = file.name;
      // Güvenlik: dosya adı sanitize
      if (!SAFE_FILENAME_RE.test(name)) {
        errors.push({
          file: name,
          error: "Dosya adı geçersiz karakterler içeriyor.",
        });
        continue;
      }
      if (file.size > MAX_FILE_SIZE) {
        errors.push({
          file: name,
          error: `Dosya çok büyük (>${MAX_FILE_SIZE / 1024 / 1024} MB).`,
        });
        continue;
      }
      const lower = name.toLowerCase();
      const isPdf = lower.endsWith(".pdf");
      const isDocx = lower.endsWith(".docx");
      if (!isPdf && !isDocx) {
        errors.push({
          file: name,
          error: "Sadece .pdf ve .docx desteklenir.",
        });
        continue;
      }

      const buffer = Buffer.from(await file.arrayBuffer());
      const targetDir = isPdf ? pdfDir : docsDir;
      const targetPath = path.join(targetDir, name);
      writeFileSync(targetPath, buffer);

      const result = isPdf
        ? await ingestPdfFile(targetPath)
        : await ingestDocxFile(targetPath);
      ingested.push({
        file: name,
        doc_id: result.doc_id,
        chunks: result.chunks,
        tokens: result.tokens,
        changed: result.changed,
      });
    } catch (err) {
      errors.push({
        file: file.name,
        error: (err as Error).message,
      });
    }
  }

  // Opsiyonel: embedding'i de hemen üret
  let embeddingsRun: {
    embedded: number;
    skipped: number;
    durationMs: number;
  } | null = null;
  if (embedNow && ingested.length > 0) {
    try {
      embeddingsRun = await embedPendingChunks({
        batchSize: 16,
        maxChunks: 10000,
      });
    } catch (err) {
      errors.push({
        file: "(embedding)",
        error: `Embedding hatası: ${(err as Error).message}`,
      });
    }
  }

  return Response.json({
    tenant: caller.tenantId,
    ingested,
    errors,
    embeddings_run: embeddingsRun,
  });
});

export const OPTIONS = v1Endpoint(async () => new Response(null, { status: 204 }));
