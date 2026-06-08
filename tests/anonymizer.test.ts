import { describe, it, expect } from "vitest";
import {
  detectCustomerNames,
  anonymizeCustomers,
  assertNoCustomerName,
  CustomerSearchBlockedError,
} from "@/lib/ticket/anonymizer";

/*
 * Bu testler data/customer-blocklist.json'ın diskte olduğunu varsayar.
 * Blocklist scripts/build-customer-blocklist.mjs ile üretilir; bu testler
 * lokal embeddings.sqlite'tan beslenen gerçek listeyi kullanır.
 */

describe("müşteri-anonimizasyon", () => {
  describe("detectCustomerNames", () => {
    it("ham müşteri adı sorgusunu yakalar", () => {
      const d = detectCustomerNames("Pernod Ricard'ın en çok şikayet ettiği konu");
      expect(d.hit).toBe(true);
      expect(d.matches.some((m) => m.toLowerCase().includes("pernod"))).toBe(true);
    });

    it("Türkçe/büyük harf varyantını yakalar", () => {
      const d = detectCustomerNames("PERNOD RİCARD için fatura sorunu");
      expect(d.hit).toBe(true);
    });

    it("tek-kelime müşteriyi yakalar", () => {
      const d = detectCustomerNames("Nestle Waters üretiminde sorun");
      expect(d.hit).toBe(true);
    });

    it("teknik sorguda false-positive vermez", () => {
      const d = detectCustomerNames("fatura gönderim hatası irsaliye birleştirme");
      expect(d.hit).toBe(false);
      expect(d.matches).toHaveLength(0);
    });

    it("boş girişi güvenli işler", () => {
      expect(detectCustomerNames(null).hit).toBe(false);
      expect(detectCustomerNames("").hit).toBe(false);
      expect(detectCustomerNames("   ").hit).toBe(false);
    });

    it("genel kelimeleri (müşteri/firma/şirket) müşteri olarak görmez", () => {
      const d = detectCustomerNames("müşteri merhaba lütfen yardım edin");
      expect(d.hit).toBe(false);
    });
  });

  describe("anonymizeCustomers", () => {
    it("müşteri adını <MUSTERI> ile değiştirir", () => {
      const a = anonymizeCustomers("Pernod Ricard fatura sorunu");
      expect(a.text).toContain("<MUSTERI>");
      expect(a.text.toLowerCase()).not.toContain("pernod");
      expect(a.text.toLowerCase()).not.toContain("ricard");
      expect(a.redactions.length).toBeGreaterThan(0);
    });

    it("Türkçe karakterli ismi normalize edip maskeler", () => {
      const a = anonymizeCustomers("ARMA İLAÇ stoğu güncellemiyor");
      expect(a.text).toContain("<MUSTERI>");
      expect(a.text.toLowerCase()).not.toContain("arma");
    });

    it("teknik metni dokunmaz (placeholder hariç)", () => {
      const a = anonymizeCustomers("fatura gönderim hatası irsaliye birleştirme");
      expect(a.text).not.toContain("<MUSTERI>");
      expect(a.redactions).toHaveLength(0);
    });
  });

  describe("assertNoCustomerName", () => {
    it("müşteri adı yoksa fırlatmaz", () => {
      expect(() =>
        assertNoCustomerName("fatura gönderim hatası"),
      ).not.toThrow();
    });

    it("müşteri adı varsa CustomerSearchBlockedError fırlatır", () => {
      expect(() =>
        assertNoCustomerName("Pernod Ricard'ın ticketları"),
      ).toThrowError(CustomerSearchBlockedError);
    });

    it("fırlatılan hatada eşleşen müşteri(ler) yer alır", () => {
      try {
        assertNoCustomerName("Nestle ile ilgili tüm bildirimler");
        expect.unreachable("hata fırlatılmalıydı");
      } catch (err) {
        expect(err).toBeInstanceOf(CustomerSearchBlockedError);
        const e = err as CustomerSearchBlockedError;
        expect(e.matches.length).toBeGreaterThan(0);
      }
    });
  });
});
