/**
 * Panorama Kullanım Kılavuzu (HelpNDoc) HTML dosyalarını parse edip
 * data/panorama-docs/screens.json içine yapısal kayıt halinde yazar.
 *
 * Her sayfa için çıkar:
 *   id          : dosya adı (uzantısız)
 *   breadcrumb  : "EnRoute Panorama > Modül > Alt-Modül > Ekran"
 *   modulePath  : ["Müşteriler", "İşlemler"]  (breadcrumb'tan)
 *   title       : ekran adı (H2 veya breadcrumb son parça)
 *   menuStep    : "Müşteriler → İşlemler → Müşteri Durum Değiştirme"
 *   summary     : "Ekran Tanımı:" sonrası tek cümle
 *   fields      : [{ name, description }]
 *   buttons     : [{ name, description }]
 *   rawText     : tam normalize edilmiş metin (arama için)
 *
 * Sadece "Menü Adımı" içeren sayfalar gerçek ekran kılavuzu sayılır;
 * diğerleri (hub/kategori/copyright vs.) atlanır.
 */
import fs from "node:fs";
import path from "node:path";

const SOURCE = "/Users/egeusluer/Downloads/Doküman";
const OUT_DIR = path.resolve(process.cwd(), "data/panorama-docs");
fs.mkdirSync(OUT_DIR, { recursive: true });

const ENT = {
  nbsp: " ",
  amp: "&",
  lt: "<",
  gt: ">",
  quot: '"',
  apos: "'",
  ouml: "ö",
  Ouml: "Ö",
  uuml: "ü",
  Uuml: "Ü",
  auml: "ä",
  szlig: "ß",
  ccedil: "ç",
  Ccedil: "Ç",
  Iuml: "İ",
  ETH: "Ğ",
  eth: "ğ",
  THORN: "Ş",
  thorn: "ş",
  Aacute: "Á",
  aacute: "á",
  iacute: "í",
};

function decodeEntities(s) {
  return s
    .replace(/&([a-zA-Z]+);/g, (_, n) => (ENT[n] != null ? ENT[n] : `&${n};`))
    .replace(/&#(\d+);/g, (_, c) => String.fromCharCode(parseInt(c, 10)))
    .replace(/&#x([0-9a-fA-F]+);/g, (_, c) => String.fromCharCode(parseInt(c, 16)));
}

function stripTags(html) {
  // Önce script/style bloklarını tamamen at
  let s = html
    .replace(/<script\b[\s\S]*?<\/script>/gi, " ")
    .replace(/<style\b[\s\S]*?<\/style>/gi, " ")
    .replace(/<!--[\s\S]*?-->/g, " ");
  // <br>, <p>, <tr>, </td> sınırlarını newline'a çevir
  s = s.replace(/<\/(p|div|tr|h[1-6]|li)>/gi, "\n");
  s = s.replace(/<br\s*\/?>/gi, "\n");
  s = s.replace(/<\/td>/gi, "\t");
  // Tüm tag'leri sil
  s = s.replace(/<[^>]+>/g, " ");
  return decodeEntities(s);
}

function extractArticle(html) {
  const m = html.match(/<article[^>]*>([\s\S]*?)<\/article>/i);
  return m ? m[1] : html;
}

function extractBreadcrumb(html) {
  // .breadcrumb içindeki <li> linkleri
  const m = html.match(/<ol[^>]*class="[^"]*breadcrumb[^"]*"[^>]*>([\s\S]*?)<\/ol>/i);
  if (!m) return [];
  const items = [...m[1].matchAll(/<li[^>]*>([\s\S]*?)<\/li>/gi)].map((x) =>
    decodeEntities(stripTags(x[1])).replace(/\s+/g, " ").trim(),
  );
  return items.filter(Boolean);
}

function extractTitle(html) {
  const m = html.match(/<h2[^>]*>([\s\S]*?)<\/h2>/i);
  if (m) return decodeEntities(stripTags(m[1])).replace(/\s+/g, " ").trim();
  return null;
}

/**
 * "SAHA AÇIKLAMA" formatındaki tabloları parse et — her satır 2 hücreli.
 * Çoğu sayfada birden fazla tablo var (Alan tablosu + Buton tablosu).
 */
function extractTables(html) {
  const tables = [];
  const tableRe = /<table[^>]*>([\s\S]*?)<\/table>/gi;
  let m;
  while ((m = tableRe.exec(html)) !== null) {
    const rows = [];
    const trRe = /<tr[^>]*>([\s\S]*?)<\/tr>/gi;
    let r;
    while ((r = trRe.exec(m[1])) !== null) {
      const cells = [...r[1].matchAll(/<t[dh][^>]*>([\s\S]*?)<\/t[dh]>/gi)].map(
        (c) => decodeEntities(stripTags(c[1])).replace(/\s+/g, " ").trim(),
      );
      if (cells.length >= 2 && cells.some((c) => c.length > 0)) {
        rows.push({ name: cells[0], description: cells.slice(1).join(" ") });
      }
    }
    if (rows.length >= 2) tables.push(rows);
  }
  return tables;
}

/**
 * "Menü Adımı : X --> Y --> Z" satırını çıkar.
 */
function extractMenuStep(text) {
  const m = text.match(/Menü Adımı\s*:\s*([^\n.]{3,250})/);
  if (!m) return null;
  return m[1]
    .replace(/-->/g, "→")
    .replace(/&gt;/g, "→")
    .replace(/\s+/g, " ")
    .trim();
}

function extractSummary(text) {
  // "Ekran Tanımı : ..." veya "Ekran Tanımı: ..."
  const m = text.match(/Ekran Tanımı\s*:\s*([^\n]{5,500})/);
  return m ? m[1].trim() : null;
}

function parseFile(filePath) {
  const html = fs.readFileSync(filePath, "utf8");
  const article = extractArticle(html);
  const text = stripTags(article).replace(/[ \t]+/g, " ").replace(/\n{2,}/g, "\n").trim();

  // Sadece "Menü Adımı" içeren sayfalar gerçek ekran kılavuzudur
  if (!/Menü Adımı/.test(text)) return null;

  const breadcrumb = extractBreadcrumb(html);
  const title = extractTitle(html) ?? (breadcrumb.at(-1) || path.basename(filePath, ".html"));
  const menuStep = extractMenuStep(text);
  const summary = extractSummary(text);

  // Tablolardan alan/buton listesi
  const tables = extractTables(article);
  // İlk tablo genelde Alan, ikinci tablo Buton — ama her zaman değil.
  // Heuristik: tabloların başlığı veya hemen önündeki başlık "Buton" içeriyor mu?
  const fields = [];
  const buttons = [];
  // Tabloları sıra ile incele
  const tableRe = /<table[\s\S]*?<\/table>/gi;
  const tableMatches = [...article.matchAll(tableRe)];
  for (let i = 0; i < tableMatches.length; i++) {
    const t = tableMatches[i];
    const tableHtml = t[0];
    const rows = (function () {
      const out = [];
      const trRe = /<tr[^>]*>([\s\S]*?)<\/tr>/gi;
      let r;
      while ((r = trRe.exec(tableHtml)) !== null) {
        const cells = [...r[1].matchAll(/<t[dh][^>]*>([\s\S]*?)<\/t[dh]>/gi)].map(
          (c) => decodeEntities(stripTags(c[1])).replace(/\s+/g, " ").trim(),
        );
        if (cells.length >= 2 && cells.some((c) => c.length > 0)) {
          out.push({ name: cells[0], description: cells.slice(1).join(" ") });
        }
      }
      return out;
    })();
    if (rows.length < 2) continue;

    // Bu tablonun önündeki ~400 karaktere bak — "Buton" geçiyor mu?
    const before = article.slice(Math.max(0, t.index - 400), t.index).toLowerCase();
    const isButtonTable = /buton/.test(before);
    // Header satırını ("SAHA / AÇIKLAMA") atla
    const dataRows = rows.filter(
      (r) =>
        !/^saha$/i.test(r.name) &&
        !/açıklama/i.test(r.name) &&
        r.name.length >= 2 &&
        r.name.length <= 60,
    );
    if (isButtonTable) buttons.push(...dataRows);
    else fields.push(...dataRows);
  }

  // Modül yolu — breadcrumb'tan "EnRoute Panorama" ve son ekran adını çıkar
  const modulePath = breadcrumb.length > 1
    ? breadcrumb.slice(1, -1).filter((x) => x && x !== "EnRoute Panorama")
    : [];

  return {
    id: path.basename(filePath, ".html"),
    breadcrumb,
    modulePath,
    title,
    menuStep,
    summary,
    fields,
    buttons,
    // İlk 3000 karakter — arama için yeterli
    rawText: text.slice(0, 3000),
  };
}

// === Main ===
const files = fs.readdirSync(SOURCE).filter((f) => f.endsWith(".html"));
const screens = [];
let parsedCount = 0;
let skippedCount = 0;

for (const file of files) {
  try {
    const parsed = parseFile(path.join(SOURCE, file));
    if (parsed) {
      screens.push(parsed);
      parsedCount++;
    } else {
      skippedCount++;
    }
  } catch (err) {
    console.warn(`HATA ${file}: ${err.message}`);
    skippedCount++;
  }
}

// Modül istatistikleri
const moduleCounts = new Map();
for (const s of screens) {
  const key = s.modulePath[0] ?? "(modülsüz)";
  moduleCounts.set(key, (moduleCounts.get(key) ?? 0) + 1);
}

// Kayıt
const screensPath = path.join(OUT_DIR, "screens.json");
fs.writeFileSync(screensPath, JSON.stringify(screens, null, 2));

const modulesPath = path.join(OUT_DIR, "modules.json");
const modulesList = Array.from(moduleCounts.entries())
  .map(([name, count]) => ({ name, count }))
  .sort((a, b) => b.count - a.count);
fs.writeFileSync(modulesPath, JSON.stringify(modulesList, null, 2));

console.log(`Parse tamamlandı.`);
console.log(`  Ekran kılavuzu (parsed) : ${parsedCount}`);
console.log(`  Atlanan dosya           : ${skippedCount}`);
console.log(`  Çıktı                   : ${screensPath}`);
console.log(`  Modül özeti             : ${modulesPath}`);
console.log();
console.log("=== Üst Modül Dağılımı ===");
for (const m of modulesList.slice(0, 20)) {
  console.log(`  ${String(m.count).padStart(3)}  ${m.name}`);
}
// İçerik istatistiği
const withFields = screens.filter((s) => s.fields.length > 0).length;
const withButtons = screens.filter((s) => s.buttons.length > 0).length;
const withMenuStep = screens.filter((s) => s.menuStep).length;
const withSummary = screens.filter((s) => s.summary).length;
console.log();
console.log(`Saha tablosu olan       : ${withFields}/${parsedCount}`);
console.log(`Buton tablosu olan      : ${withButtons}/${parsedCount}`);
console.log(`Menü adımı olan         : ${withMenuStep}/${parsedCount}`);
console.log(`Ekran tanımı olan       : ${withSummary}/${parsedCount}`);
