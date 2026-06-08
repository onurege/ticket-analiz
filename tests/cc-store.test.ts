import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import {
  closeCcDb,
  createUser,
  getUserByEmail,
  getUserById,
  listUsers,
  countSuperAdmins,
  updateUser,
  deactivateUser,
  type CcRole,
} from "@/lib/cc/db";
import {
  createTicket,
  getTicketById,
  getTicketByNo,
  nextTicketNo,
  takeTicket,
  escalateToL2,
  deescalateToL1,
  closeTicket,
  updateResolution,
  listTickets,
  listTicketEvents,
} from "@/lib/cc/store";

let tmp: string;
let prevCwd: string;

beforeEach(() => {
  tmp = mkdtempSync(path.join(tmpdir(), "cc-store-"));
  prevCwd = process.cwd();
  process.chdir(tmp);
  closeCcDb();
});

afterEach(() => {
  closeCcDb();
  process.chdir(prevCwd);
  rmSync(tmp, { recursive: true, force: true });
});

function makeAgent(email: string, role: CcRole) {
  return createUser({
    email,
    name: `User ${email}`,
    role,
    password_hash: "$2b$12$mockmockmockmockmockmockmockmockmockmockmock",
    created_by: null,
  });
}

describe("cc/db users", () => {
  it("yeni kullanıcı oluşturur, e-posta lowercase yapar", () => {
    const u = createUser({
      email: "TEST@univera.com",
      name: "Test",
      role: "L1_agent",
      password_hash: "h",
    });
    expect(u.email).toBe("test@univera.com");
    expect(u.active).toBe(1);
    expect(u.role).toBe("L1_agent");
  });

  it("e-posta ile bulur", () => {
    makeAgent("agent@x.com", "L1_agent");
    const u = getUserByEmail("AGENT@x.com");
    expect(u?.email).toBe("agent@x.com");
    expect(u?.password_hash).toBeDefined();
  });

  it("countSuperAdmins doğru sayar", () => {
    expect(countSuperAdmins()).toBe(0);
    makeAgent("sa1@x.com", "super_admin");
    makeAgent("sa2@x.com", "super_admin");
    makeAgent("l1@x.com", "L1_agent");
    expect(countSuperAdmins()).toBe(2);
  });

  it("listUsers ID sırasına göre döner", () => {
    makeAgent("a@x.com", "L1_agent");
    makeAgent("b@x.com", "L1_agent");
    const list = listUsers();
    expect(list).toHaveLength(2);
    expect(list[0]?.email).toBe("a@x.com");
  });

  it("updateUser alanları günceller", () => {
    const u = makeAgent("u@x.com", "L1_agent");
    const updated = updateUser(u.id, { role: "L1_lead", name: "Yeni" });
    expect(updated?.role).toBe("L1_lead");
    expect(updated?.name).toBe("Yeni");
  });

  it("deactivateUser active=0 yapar", () => {
    const u = makeAgent("d@x.com", "L1_agent");
    deactivateUser(u.id);
    expect(getUserById(u.id)?.active).toBe(0);
    // active=0 olanlar listUsers'da hâlâ görünür (audit), activeOnly=true ise filtre
    const active = listUsers({ activeOnly: true });
    expect(active.find((x) => x.id === u.id)).toBeUndefined();
  });
});

describe("cc/store ticket_no generator", () => {
  it("artımlı CC-YYYY-NNNNNN üretir", () => {
    const year = new Date().getFullYear();
    const n1 = nextTicketNo();
    const n2 = nextTicketNo();
    const n3 = nextTicketNo();
    expect(n1).toBe(`CC-${year}-000001`);
    expect(n2).toBe(`CC-${year}-000002`);
    expect(n3).toBe(`CC-${year}-000003`);
  });
});

describe("cc/store tickets", () => {
  it("ticket oluşturur, ticket_no döner", () => {
    const u = makeAgent("opener@x.com", "L1_agent");
    const t = createTicket({
      description: "Faturayı GİB'e gönderemiyorum",
      project: "Nestle",
      customer_name: "Müşteri",
      opened_by: u.id,
    });
    expect(t.id).toBeGreaterThan(0);
    expect(t.ticket_no).toMatch(/^CC-\d{4}-\d{6}$/);
    expect(t.status).toBe("open");
    expect(t.assigned_to).toBeNull();
  });

  it("getTicketByNo ile bulunur", () => {
    const u = makeAgent("o@x.com", "L1_agent");
    const t = createTicket({
      description: "test",
      opened_by: u.id,
    });
    const found = getTicketByNo(t.ticket_no);
    expect(found?.id).toBe(t.id);
  });

  it("created event log'lanır", () => {
    const u = makeAgent("o@x.com", "L1_agent");
    const t = createTicket({ description: "test", opened_by: u.id });
    const events = listTicketEvents(t.id);
    expect(events).toHaveLength(1);
    expect(events[0]?.event_type).toBe("created");
  });

  it("takeTicket atama yapar, status=in_progress", () => {
    const opener = makeAgent("o@x.com", "L1_agent");
    const taker = makeAgent("t@x.com", "L1_agent");
    const t = createTicket({ description: "test", opened_by: opener.id });
    const updated = takeTicket(t.id, taker.id);
    expect(updated?.assigned_to).toBe(taker.id);
    expect(updated?.status).toBe("in_progress");
  });

  it("escalateToL2 status=escalated yapar, assigned_to=null", () => {
    const u = makeAgent("u@x.com", "L1_agent");
    const t = createTicket({ description: "test", opened_by: u.id });
    takeTicket(t.id, u.id);
    const esc = escalateToL2(t.id, u.id);
    expect(esc?.status).toBe("escalated");
    expect(esc?.assigned_to).toBeNull();
    expect(esc?.escalated_to_role).toBe("L2");
    expect(esc?.escalated_at).not.toBeNull();
  });

  it("deescalateToL1 status=open yapar", () => {
    const u = makeAgent("u@x.com", "L1_agent");
    const l2 = makeAgent("l2@x.com", "L2_agent");
    const t = createTicket({ description: "test", opened_by: u.id });
    escalateToL2(t.id, u.id);
    const de = deescalateToL1(t.id, l2.id);
    expect(de?.status).toBe("open");
    expect(de?.assigned_to).toBeNull();
    expect(de?.escalated_to_role).toBeNull();
  });

  it("closeTicket çözüm yazar, status=closed", () => {
    const u = makeAgent("u@x.com", "L1_agent");
    const t = createTicket({ description: "test", opened_by: u.id });
    const closed = closeTicket(t.id, u.id, {
      resolution: "Sorun parametreyi düzelterek çözüldü",
      close_kok_neden_grubu: "Parametre / Konfigürasyon",
      close_kok_neden_detayi: "Yanlış parametre",
      close_cozum_tipi: "Parametre düzeltme",
    });
    expect(closed?.status).toBe("closed");
    expect(closed?.agent_resolution).toContain("parametreyi");
    expect(closed?.closed_at).not.toBeNull();
    expect(closed?.resolved_by).toBe(u.id);
  });

  it("updateResolution sadece çözüm metnini günceller", () => {
    const u = makeAgent("u@x.com", "L1_agent");
    const t = createTicket({ description: "test", opened_by: u.id });
    const upd = updateResolution(t.id, u.id, "Taslak çözüm v1");
    expect(upd?.agent_resolution).toBe("Taslak çözüm v1");
    expect(upd?.status).toBe("open"); // status değişmedi
  });

  it("listTickets status filtresi ile çalışır", () => {
    const u = makeAgent("u@x.com", "L1_agent");
    const t1 = createTicket({ description: "a", opened_by: u.id });
    const t2 = createTicket({ description: "b", opened_by: u.id });
    closeTicket(t2.id, u.id, {
      resolution: "ok çözüm metni",
      close_kok_neden_grubu: "Kullanım / Eğitim",
      close_kok_neden_detayi: "Bilgi / nasıl yapılır",
      close_cozum_tipi: "Bilgilendirme",
    });

    const openOnly = listTickets({ status: "open" });
    expect(openOnly.total).toBe(1);
    expect(openOnly.rows[0]?.id).toBe(t1.id);

    const closedOnly = listTickets({ status: "closed" });
    expect(closedOnly.total).toBe(1);
    expect(closedOnly.rows[0]?.id).toBe(t2.id);
  });
});
