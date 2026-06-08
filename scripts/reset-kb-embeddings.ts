/*
 * KB embedding'lerini sıfırla — yeni embedding modeline geçiş için.
 *
 *   npx tsx scripts/reset-kb-embeddings.ts
 *
 * Yapılan:
 *   1. kb_embeddings tablosu boşaltılır (tüm modeller)
 *   2. kb_vec virtual table DROP edilir
 *   3. getKbDb() çağrısında yeni KB_EMBED_DIM ile tekrar yaratılır
 *
 * kb_documents ve kb_chunks dokunulmaz; chunk'lar korunur, yalnız
 * embedding'ler yeniden üretilecek.
 */

import "dotenv/config";
import { closeKbDb, getKbDb, kbStats, KB_EMBED_DIM } from "../src/lib/kb/db";

function main(): void {
  console.log(`KB embedding sıfırlama başlıyor (yeni dim: ${KB_EMBED_DIM})`);

  const db = getKbDb();
  const before = kbStats();
  console.log("Önce:", before);

  db.exec(`
    DELETE FROM kb_embeddings;
    DROP TABLE IF EXISTS kb_vec;
  `);
  console.log("✓ kb_embeddings boşaltıldı, kb_vec DROP edildi");

  // DB'yi kapatıp tekrar açarak schema yeniden oluştursun (initSchema vec0'ı yeniden açar)
  closeKbDb();
  getKbDb();
  console.log("✓ kb_vec yeniden oluşturuldu (dim =", KB_EMBED_DIM, ")");

  const after = kbStats();
  console.log("Sonra:", after);
}

main();
