/*
 * POST /api/admin/kb/upload — admin panel'den PDF/DOCX upload + ingest.
 *
 * Super-admin yetkili. Form alanları:
 *   files: PDF/DOCX dosyaları (multi)
 *   tenant: opsiyonel (default 'varuna')
 *
 * Yanıt: ingested array + errors.
 */

import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import {
  requireSuperAdmin,
  ForbiddenError,
  UnauthorizedError,
} from "@/lib/cc/auth";
import { ingestPdfFile } from "@/lib/kb/sources/pdf";
import { ingestDocxFile } from "@/lib/kb/sources/docx";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 600;

const SAFE_FILENAME_RE = /^[A-Za-z0-9._\- ()çğıöşüÇĞİÖŞÜ]+$/;
const MAX_FILES = 20;
const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50 MB

function authError(err: unknown): Response | null {
  if (err instanceof UnauthorizedError)
    return Response.json({ error: err.message }, { status: 401 });
  if (err instanceof ForbiddenError)
    return Response.json({ error: err.message }, { status: 403 });
  return null;
}

export async function POST(req: Request) {
  try {
    await requireSuperAdmin();
  } catch (err) {
    const r = authError(err);
    if (r) return r;
    throw err;
  }

  let form: FormData;
  try {
    form = await req.formData();
  } catch (err) {
    return Response.json(
      { error: `Multipart parse hatası: ${(err as Error).message}` },
      { status: 400 },
    );
  }

  const files = form.getAll("files").filter((f) => f instanceof File) as File[];
  if (files.length === 0) {
    return Response.json({ error: "Dosya yok ('files' alanı)" }, { status: 400 });
  }
  if (files.length > MAX_FILES) {
    return Response.json(
      { error: `Maksimum ${MAX_FILES} dosya/istek.` },
      { status: 400 },
    );
  }

  const tenantId = (form.get("tenant") as string) || "varuna";
  const cwd = process.cwd();
  const pdfDir = path.resolve(cwd, "data/kb/pdfs", tenantId);
  const docsDir = path.resolve(cwd, "data/kb/docs", tenantId);
  mkdirSync(pdfDir, { recursive: true });
  mkdirSync(docsDir, { recursive: true });

  const ingested: Array<{
    file: string;
    doc_id: string;
    chunks: number;
    tokens: number;
    changed: boolean;
  }> = [];
  const errors: Array<{ file: string; error: string }> = [];

  for (const file of files) {
    try {
      const name = file.name;
      if (!SAFE_FILENAME_RE.test(name)) {
        errors.push({
          file: name,
          error: "Geçersiz karakter (sadece harf/rakam/. - _ vs.)",
        });
        continue;
      }
      if (file.size > MAX_FILE_SIZE) {
        errors.push({
          file: name,
          error: `Çok büyük (>${MAX_FILE_SIZE / 1024 / 1024} MB).`,
        });
        continue;
      }
      const lower = name.toLowerCase();
      const isPdf = lower.endsWith(".pdf");
      const isDocx = lower.endsWith(".docx");
      if (!isPdf && !isDocx) {
        errors.push({ file: name, error: "Sadece .pdf ve .docx desteklenir." });
        continue;
      }
      const buffer = Buffer.from(await file.arrayBuffer());
      const target = path.join(isPdf ? pdfDir : docsDir, name);
      writeFileSync(target, buffer);
      const result = isPdf
        ? await ingestPdfFile(target)
        : await ingestDocxFile(target);
      ingested.push({
        file: name,
        doc_id: result.doc_id,
        chunks: result.chunks,
        tokens: result.tokens,
        changed: result.changed,
      });
    } catch (err) {
      errors.push({ file: file.name, error: (err as Error).message });
    }
  }

  return Response.json({ tenant: tenantId, ingested, errors });
}
