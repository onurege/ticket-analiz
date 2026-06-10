/**
 * Kural-tabanlı 7 alanlı kategorize.
 *
 * Python `categorize_v2.py`'nin TS portu — birebir keyword setleri.
 * Hiç LLM çağrısı yok, %100 deterministik.
 */

export type Tags = {
  isSureci: string;
  islemTipi: string;
  etkilenenNesne: string;
  etki: string;
  kokNedenGrup: string;
  kokNedenDetay: string;
  cozumTipi: string;
};

/**
 * Keyword match — Turkish-aware word boundary.
 *
 * Strateji (substring false-positive'leri önlemek için):
 *   - Çok kelimeli ifade ("e belge", "yetki ver") → düz substring
 *   - 3 karakter veya daha kısa ("ram", "gib", "pos", "cek") → tam word boundary \bX\b
 *     ("panorama" içinde "ram" ARTIK match etmez; "gibi" içinde "gib" match etmez)
 *   - 4 karakter ve üzeri ("yetki", "yavas", "musteri") → sol word boundary \bX
 *     (Türkçe ekleri yakalar: "yetki" → "yetkili", "yavas" → "yavaslik", "musteri" → "musteriler")
 */
const RE_CACHE = new Map<string, RegExp>();

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function reFor(k: string): RegExp {
  let r = RE_CACHE.get(k);
  if (r) return r;
  const lower = k.toLowerCase();
  let pattern: string;
  if (lower.includes(" ")) {
    pattern = escapeRegex(lower); // multi-word: substring
  } else if (lower.length <= 3) {
    pattern = `\\b${escapeRegex(lower)}\\b`; // short: full boundary
  } else {
    pattern = `\\b${escapeRegex(lower)}`; // long: prefix boundary (TR stem)
  }
  r = new RegExp(pattern);
  RE_CACHE.set(k, r);
  return r;
}

function has(txt: string, ...kw: string[]): boolean {
  return kw.some((k) => reFor(k).test(txt));
}

export function categorize(rawText: string): Tags {
  // Metin anonymize edilmiş + normalize edilmiş olmalı (lowercase ASCII).
  const txt = rawText.toLowerCase();

  // ─── İŞ SÜRECİ ────────────────────────────────────────────────
  let isSureci: string;
  if (has(txt, "unidox", "gib", "e fatura", "efatura", "e arsiv", "ettn",
    "zarf", "imza", "kolaysoft", "xslt", "kamusm", "hsm", "e belge", "mukellef",
    "matbu no", "entegrator")) {
    isSureci = "E-Belge";
  } else if (has(txt, "tablet", "apk", "mobil cihaz", "senkron", "bilgi gonderme",
    "bilgi alma", "bluetooth", "mobil yazici", "cihaza baglan", "mobil panorama",
    "panorama mobil")) {
    isSureci = "Mobil Saha";
  } else if (has(txt, "el terminal", "quest cihaz")) {
    isSureci = "El Terminali/Cihaz";
  } else if (has(txt, "musteri kart", "cari kart", "crm", "nokta devr",
    "durum degist", "bayi tanim", "bayi yetki", "sahibi bayi")) {
    isSureci = "Müşteri/Cari/CRM";
  } else if (has(txt, "dizayn", "matbu", "sablon", "tasarim")) {
    isSureci = "Belge Dizaynı/Matbu";
  } else if (has(txt, "rapor", "dashboard", "qlik", "one or more")) {
    isSureci = "Raporlama";
  } else if (has(txt, "arac yukle", "sipariste arac", "sevkiyat", "dagit kanal")) {
    isSureci = "Dağıtım/Stok/Araç";
  } else if (has(txt, "rut tanim", "satis temsilci tanim", "ziyaret", "satis ekib")) {
    isSureci = "Satış Ekibi/Rut";
  } else if (has(txt, "iskonto", "promosyon", "fiyat", "kampanya")) {
    isSureci = "İskonto/Promosyon/Fiyat";
  } else if (has(txt, "yetki", "kullanici tanim", "sifre", "login",
    "giris yapamiyor", "lisans", "rol tan")) {
    isSureci = "Kullanıcı/Yetki/Giriş";
  } else if (has(txt, "tahsil", "havale", "eft", "odeme", "kredi kart", "pos", "banka",
    "cek", "senet", "nakit")) {
    isSureci = "Finans/Tahsilat";
  } else if (has(txt, "web servis", "webservis", "smart connect", "smartconnect", "aktarim",
    "ticari paket", "muhasebe paket", "logo", "sap ")) {
    isSureci = "Entegrasyon/Aktarım";
  } else if (has(txt, "stokbar", "back office")) {
    isSureci = "Stokbar BackOffice";
  } else if (has(txt, "siparis", "fatura", "irsaliye", "iade")) {
    isSureci = "Satış-Alış Belgeleri";
  } else {
    isSureci = "Müşteri/Cari/CRM";
  }

  // ─── İŞLEM TİPİ ───────────────────────────────────────────────
  let islemTipi: string;
  if (has(txt, "e belge gonder", "fatura gonderem", "kuyrukta kal",
    "gib e gonder", "imza dogrulanam", "zarf bulunam", "gonderim hatas") &&
    isSureci === "E-Belge") {
    islemTipi = "E-Belge gönderemiyorum";
  } else if (has(txt, "senkron olmuyor", "bilgi alm", "bilgi gonderm",
    "veri gelmiyor", "veri gitmiyor")) {
    islemTipi = "Senkron olmuyor (bilgi alma/gönderme)";
  } else if (has(txt, "aktaramiyor", "ticari pakete", "muhasebe paket aktarim",
    "logo ya gitm", "aktarim hatas")) {
    islemTipi = "Aktaramıyorum (muhasebe/ticari paket)";
  } else if (has(txt, "giremiyor", "baglanam", "login hatas", "oturum acam",
    "giris yapami")) {
    islemTipi = "Giremiyorum/Bağlanamıyorum";
  } else if (has(txt, "rapor bos", "rapor yanlis",
    "one or more", "rapor gelm", "rapor cikm")) {
    islemTipi = "Rapor boş/yanlış geliyor";
  } else if (has(txt, "yazdir", "basamiyor", "yazici cikm", "matbu bas")) {
    islemTipi = "Yazdıramıyorum/Basamıyorum";
  } else if (has(txt, "yavas", "timeout", "performans", "gecikme")) {
    islemTipi = "Yavaş çalışıyor";
  } else if (has(txt, "hesaplama", "tutar yanl", "yanlis hesap", "kdv hatal",
    "fiyat hatal", "iskonto hatal")) {
    islemTipi = "Hesaplama/Tutar yanlış";
  } else if (has(txt, "nasil yap", "bilgi verildi", "bilgilendirme yapildi",
    "aciklama yapil", "sureci anlat", "detayli sekilde")) {
    islemTipi = "Bilgi/Talep (nasıl yapılır)";
  } else if (has(txt, "kaydet", "kayit edem", "olustur")) {
    islemTipi = "Kaydedemiyorum/Oluşturamıyorum";
  } else {
    islemTipi = "Güncelleyemiyorum/Düzeltemiyorum";
  }

  // ─── ETKİLENEN NESNE ──────────────────────────────────────────
  let etkilenenNesne: string;
  if (has(txt, "iade fatura", "saticiya iade")) {
    etkilenenNesne = "İade Faturası";
  } else if (has(txt, "fatura") && isSureci === "E-Belge") {
    etkilenenNesne = "E-Belge";
  } else if (has(txt, "fatura")) {
    etkilenenNesne = "Fatura";
  } else if (has(txt, "irsaliye")) {
    etkilenenNesne = "İrsaliye";
  } else if (has(txt, "siparis")) {
    etkilenenNesne = "Sipariş";
  } else if (has(txt, "e belge", "unidox", "gib", "ettn", "imza")) {
    etkilenenNesne = "E-Belge";
  } else if (has(txt, "kredi kart", "tahsil", "havale", "pos", "odeme")) {
    etkilenenNesne = "Kredi Kartı / Tahsilat";
  } else if (has(txt, "matbu")) {
    etkilenenNesne = "Matbu No";
  } else if (has(txt, "rut tanim", "satis temsilci", "plasiyer", "temsilci")) {
    etkilenenNesne = "Satış Temsilcisi";
  } else if (has(txt, "rapor")) {
    etkilenenNesne = "Rapor";
  } else if (has(txt, "iskonto", "promosyon")) {
    etkilenenNesne = "İskonto / Promosyon";
  } else if (has(txt, "yetki", "kullanici")) {
    etkilenenNesne = "Kullanıcı / Yetki";
  } else if (has(txt, "musteri kart", "cari")) {
    etkilenenNesne = "Müşteri / Cari Kartı";
  } else if (has(txt, "depo")) {
    etkilenenNesne = "Depo";
  } else if (has(txt, "arac")) {
    etkilenenNesne = "Araç";
  } else if (has(txt, "el terminal", "cihaz", "tablet")) {
    etkilenenNesne = "El Terminali / Cihaz";
  } else if (has(txt, "urun", "stok kart")) {
    etkilenenNesne = "Ürün / Stok Kartı";
  } else {
    etkilenenNesne = "Fatura";
  }

  // ─── ETKİ ─────────────────────────────────────────────────────
  let etki: string;
  if (has(txt, "tum musteri", "tum kullan", "sistem genel", "tum distrib", "tum plasiyer")) {
    etki = "Tüm kullanıcılar / distribütör etkileniyor";
  } else if (has(txt, "is durdu", "sistem durdu", "tamamen durdu", "kritik",
    "urun gelistirme acild", "acil mudahale")) {
    etki = "İş tamamen durdu";
  } else {
    etki = "Tek kullanıcı etkileniyor";
  }

  // ─── KÖK NEDEN GRUBU + DETAY ──────────────────────────────────
  let kokNedenGrup: string;
  let kokNedenDetay: string;

  // E-Belge/Entegratör (3.parti) — Unidox, GİB validation, sertifika/mukellef vb.
  if (has(txt, "unidox", "kolaysoft", "kamusm", "hsm cihaz", "kontor", "ard ekib",
    "schematron", "sematron", "ettn",
    "mukellefiyet", "1230", "1163", "1150", "1196",
    "entegrator tarafinda", "entegrator tarafindan", "entegratorun",
    "entegrator ile iletisime", "entegrator gelistirme", "entegrator bu konuda",
    "gib portal", "gib uyari", "gib reddet", "gib e gonder", "gib e iletildi",
    "xslt", "kabul edemiy", "kabul edemed",
    "ard ye", "ard tarafinda", "ard nin", "ard nun", "ard nde",
    "v1 tarafinda", "v2 tarafinda", "v1 portal", "v2 portal",
    "zarf id bulunamadi", "zarf bulunam", "imza dogrulan")) {
    kokNedenGrup = "E-Belge/Entegratör (3.parti)";
    // Detay önceliği: en spesifikten en genele
    if (has(txt, "xslt")) kokNedenDetay = "XSLT şablon eksik";
    else if (has(txt, "kontor", "servis adres", "parola", "entegrator sifre")) kokNedenDetay = "Entegratör servis / şifre / kontör";
    else if (has(txt, "gib portal", "schematron", "sematron", "validasyon", "1230", "1163", "1150", "1196")) kokNedenDetay = "GİB / Schematron hatası";
    else if (has(txt, "mukellefiyet", "sertifika", "hsm cihaz", "imza dogrulan", "mukellef olm", "mukellef degil")) kokNedenDetay = "Mükellefiyet / sertifika";
    else if (has(txt, "v1 tarafinda", "v2 tarafinda", "unidox v1", "unidox v2", "v1 v2", "v1 portal", "v2 portal")) kokNedenDetay = "Unidox V1 / V2 geçişi";
    else if (has(txt, "kuyruk", "kuyrukta", "gecikme", "gecmedi", "kabul edemed", "kabul edemiy")) kokNedenDetay = "Entegratör kuyruk gecikmesi";
    else kokNedenDetay = "Entegratör kuyruk gecikmesi";
  } else if (has(txt, "nasil yap", "bilgilendirme yap", "aciklama yap",
    "detayli aciklama", "temsilci aranmis", "operatore aciklama")) {
    kokNedenGrup = "Kullanım/Eğitim";
    if (has(txt, "nasil yap", "bilgilendirme")) kokNedenDetay = "Bilgi / nasıl yapılır";
    else if (has(txt, "operatorluk", "merkez onay")) kokNedenDetay = "Operatörlük/merkez onayı gereken işlem";
    else if (has(txt, "8 gun", "yasal", "ay kapan")) kokNedenDetay = "Yasal süreç (8 gün / ay kapanışı)";
    else kokNedenDetay = "Kullanıcı işlem adımı hatası";
  } else if (has(txt, "parametre", "ayar duzelt", "konfigur",
    "smartconnect parametr", "smart connect parametr", "parametre eksik")) {
    kokNedenGrup = "Parametre/Konfigürasyon";
    if (has(txt, "e belge ayar")) kokNedenDetay = "E-Belge ayarı / entegratör şifresi";
    else if (has(txt, "smartconnect", "smart connect")) kokNedenDetay = "Aktarım (SmartConnect) parametresi";
    else if (has(txt, "matbu", "basim")) kokNedenDetay = "Matbu / basım parametresi";
    else if (has(txt, "eksik")) kokNedenDetay = "Eksik parametre";
    else kokNedenDetay = "Yanlış parametre";
  } else if (has(txt, "musteri kart eksik", "musteri kartin", "musteri karti", "kart hatal",
    "cari kart hatal", "urun kart eksik", "fiyat tanim hatal",
    "temsilci tanim hatal", "eksik kart",
    "alici e posta", "alici eposta", "e posta adresi", "alici il", "alici ilce",
    "vergi kimlik", "vergi numara", "tckn", "vkn", "musteri vergi",
    "depo tanim", "depo eksik", "depo kodu eksik")) {
    kokNedenGrup = "Ana Veri/Kart Tanımı";
    if (has(txt, "musteri kart", "alici e posta", "alici eposta", "musteri vergi", "vergi kimlik", "vkn")) kokNedenDetay = "Müşteri kartı eksik / hatalı";
    else if (has(txt, "urun", "stok kart")) kokNedenDetay = "Ürün / stok kartı eksik";
    else if (has(txt, "fiyat", "kdv")) kokNedenDetay = "Fiyat / KDV tanımı hatalı";
    else if (has(txt, "temsilci")) kokNedenDetay = "Satış temsilcisi tanımı hatalı";
    else kokNedenDetay = "Eksik kart ilişkisi (depo / sevk / seri)";
  } else if (has(txt, "menu yetki", "islem yetki", "yetki eksik",
    "yetki yok", "yetki ver", "yetki ile alakal", "yetki ile ilgili",
    "yetki talep", "yetki olmad", "yetki konus", "yetki kontrol",
    "yetki tan", "yetki acild", "yetki olarak", "yetkili olmad",
    "onay yetki", "distributor yetki", "lisans dolu", "lisans yetersiz",
    "yetki veremey", "yetki verilm")) {
    kokNedenGrup = "Yetki/Rol";
    if (has(txt, "menu", "secenek olmad", "secenekler oldug")) kokNedenDetay = "Menü yetkisi eksik";
    else if (has(txt, "distrib")) kokNedenDetay = "Distribütör / şube yetkisi eksik";
    else if (has(txt, "onay")) kokNedenDetay = "Onay yetkisi yok";
    else if (has(txt, "lisans")) kokNedenDetay = "Lisans limiti dolu";
    else kokNedenDetay = "İşlem yetkisi eksik";
  } else if (has(txt, "view hatas", "webservis hatas", "web servis hatas", "eslesme hatal",
    "servis timeout", "alan eslesm")) {
    kokNedenGrup = "Entegrasyon/Aktarım";
    if (has(txt, "view")) kokNedenDetay = "Web servis / view hatası";
    else if (has(txt, "timeout", "gecikme")) kokNedenDetay = "Servis timeout";
    else if (has(txt, "alan eslesm")) kokNedenDetay = "Alan eşleşmesi hatalı";
    else kokNedenDetay = "Eşleştirme eksik";
  } else if (has(txt, "apk versiyon", "cihaz baglant", "tablet versiyon",
    "cihaz tarih", "cihaz saat")) {
    kokNedenGrup = "Cihaz/Mobil Ortam";
    if (has(txt, "apk")) kokNedenDetay = "APK versiyon uyumsuz";
    else if (has(txt, "baglant", "eslem")) kokNedenDetay = "Cihaz bağlantısı / eşleştirme";
    else if (has(txt, "tarih", "saat")) kokNedenDetay = "Cihaz tarih / saat";
    else kokNedenDetay = "Dosya indirilemiyor";
  } else if (has(txt, "fix dll", "fix-dll", "fixdll", "object reference", "urun hatas",
    "urun gelistir", "validasyon hatas", "kod hatas")) {
    kokNedenGrup = "Ürün Hatası";
    if (has(txt, "object reference")) kokNedenDetay = "Görev çalışmıyor (object reference)";
    else if (has(txt, "fix dll", "fix-dll", "fixdll")) kokNedenDetay = "Versiyon uyumsuzluğu (Fix-DLL)";
    else if (has(txt, "validasyon")) kokNedenDetay = "Validasyon hatası";
    else kokNedenDetay = "Kod hatası";
  } else if (has(txt, "belge dizayn", "dizayn eksik", "tasarim eksik", "matbu no")) {
    kokNedenGrup = "Dizayn/Matbu/Baskı";
    if (has(txt, "matbu")) kokNedenDetay = "Matbu no / sıra";
    else if (has(txt, "yazici", "logo")) kokNedenDetay = "Yazıcı / logo basım ayarı";
    else kokNedenDetay = "Belge dizaynı eksik / hatalı";
  } else if (has(txt, "iskonto hatal", "iskonto yanl", "fiyat yanl", "kdv yanl", "kredi limit")) {
    kokNedenGrup = "Hesaplama/İş Kuralı";
    if (has(txt, "iskonto", "promosyon")) kokNedenDetay = "İskonto / promosyon";
    else if (has(txt, "fiyat")) kokNedenDetay = "Fiyat";
    else if (has(txt, "kdv")) kokNedenDetay = "KDV / muafiyet";
    else kokNedenDetay = "Gecikme / kredi limiti";
  } else if (has(txt, "yavas", "timeout", "sunucu", "disk", "ram", "internet kesik",
    "replikasyon")) {
    kokNedenGrup = "Sunucu/Altyapı/Performans";
    if (has(txt, "yavas", "timeout", "internet")) kokNedenDetay = "Yavaşlık / timeout (internet)";
    else if (has(txt, "disk", "temp")) kokNedenDetay = "Disk / temp yetersizliği";
    else if (has(txt, "ram")) kokNedenDetay = "RAM / kaynak tüketimi";
    else if (has(txt, "replikasyon")) kokNedenDetay = "Replikasyon durması";
    else kokNedenDetay = "Giriş / sunucu hatası";
  } else if (has(txt, "bozuk kayit", "mukerrer", "mukerrer kay", "mukerrer geld",
    "ayni matbu numarasi", "ayni belge gonderil", "matbu numarasi ile 2",
    "eksik iliski", "elle mudahale", "gecmis veri", "veri tutarsiz",
    "iade fatura mukerrer", "view de mukerrer", "viewinde mukerrer")) {
    kokNedenGrup = "Veri Tutarsızlığı";
    if (has(txt, "bozuk")) kokNedenDetay = "Bozuk kayıt (stok tipi / belge detayı)";
    else if (has(txt, "mukerrer", "ayni matbu", "ayni belge")) kokNedenDetay = "Mükerrer kayıt";
    else if (has(txt, "eksik iliski")) kokNedenDetay = "Eksik ilişki";
    else kokNedenDetay = "Elle müdahale / geçmiş veri";
  } else {
    kokNedenGrup = "Kullanım/Eğitim";
    kokNedenDetay = "Bilgi / nasıl yapılır";
  }

  // ─── ÇÖZÜM TİPİ ───────────────────────────────────────────────
  let cozumTipi: string;
  if (has(txt, "fix dll", "fix-dll", "fixdll", "script calist", "script calistiril",
    "arka planda script", "sql duzelt", "manuel sql", "update sql",
    "tablo guncel")) {
    cozumTipi = "Script çalıştırma (Fix-DLL)";
  } else if (has(txt, "parametre duzelt", "ayar duzelt",
    "ayarlardan", "parametre acild", "parametre kapat", "parametre aktif", "parametre acik")) {
    cozumTipi = "Parametre düzeltme";
  } else if (has(txt, "unidox ekib", "entegrator ekib", "kolaysoft ekib", "ard ekib",
    "iletisime gec", "durum bildirildi", "servis mudahale", "entegrator tarafinda gelistir",
    "unidox ekibine durum")) {
    cozumTipi = "Entegratör/servis müdahalesi";
  } else if (has(txt, "dizayn duzelt", "tasarim duzelt", "belge dizay", "matbu numaras", "logo bas")) {
    cozumTipi = "Dizayn düzeltme";
  } else if (has(txt, "versiyon gecis", "versiyon yukselt", "guncel versiy", "hotfix", "yeni versiyon")) {
    cozumTipi = "Versiyon geçişi";
  } else if (has(txt, "urun gelistir", "gelistirme talebi", "devops ekip", "gelistirme yapil")) {
    cozumTipi = "Ürün geliştirme";
  } else if (has(txt, "kart guncel", "kart duzelt", "veri duzelt", "manuel veri",
    "cari kart guncel", "musteri kart guncel", "durum guncel", "manuel olarak", "manuel duzeltme",
    "veritabanin", "kayit duzelt")) {
    cozumTipi = "Veri/kart düzeltme";
  } else if (has(txt, "bilgilendirme", "aciklama yap", "bilgi verildi", "detayli aciklama",
    "nasil yap", "temsilciye aciklama", "operatore aciklama", "bilgi paylas")) {
    cozumTipi = "Bilgilendirme";
  } else {
    // Kök neden ile uyumlu default
    switch (kokNedenGrup) {
      case "E-Belge/Entegratör (3.parti)": cozumTipi = "Entegratör/servis müdahalesi"; break;
      case "Parametre/Konfigürasyon": cozumTipi = "Parametre düzeltme"; break;
      case "Ana Veri/Kart Tanımı": cozumTipi = "Veri/kart düzeltme"; break;
      case "Kullanım/Eğitim": cozumTipi = "Bilgilendirme"; break;
      case "Ürün Hatası": cozumTipi = "Script çalıştırma (Fix-DLL)"; break;
      case "Dizayn/Matbu/Baskı": cozumTipi = "Dizayn düzeltme"; break;
      case "Veri Tutarsızlığı": cozumTipi = "Veri/kart düzeltme"; break;
      default: cozumTipi = "Bilgilendirme";
    }
  }

  return { isSureci, islemTipi, etkilenenNesne, etki, kokNedenGrup, kokNedenDetay, cozumTipi };
}
