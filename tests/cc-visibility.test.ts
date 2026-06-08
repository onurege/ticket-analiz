import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import {
  closeCcDb,
  createUser,
  type CcRole,
} from "@/lib/cc/db";
import { canAccessTicket, visibilityFor } from "@/lib/cc/visibility";

let tmp: string;
let prevCwd: string;

beforeEach(() => {
  tmp = mkdtempSync(path.join(tmpdir(), "cc-vis-"));
  prevCwd = process.cwd();
  process.chdir(tmp);
  closeCcDb();
});

afterEach(() => {
  closeCcDb();
  process.chdir(prevCwd);
  rmSync(tmp, { recursive: true, force: true });
});

function user(email: string, role: CcRole) {
  return createUser({
    email,
    name: email,
    role,
    password_hash: "h",
  });
}

describe("visibilityFor", () => {
  it("super_admin için 1=1 (her şey)", () => {
    const sa = user("sa@x.com", "super_admin");
    const v = visibilityFor(sa);
    expect(v.whereSql).toBe("1 = 1");
  });

  it("L1_agent için self + open-unassigned filtresi", () => {
    const a = user("a@x.com", "L1_agent");
    const v = visibilityFor(a);
    expect(v.whereSql).toContain("assigned_to = @me_l1");
    expect(v.whereSql).toContain("status = 'open'");
    expect(v.whereSql).toContain("escalated_to_role IS NULL");
    expect(v.whereParams.me_l1).toBe(a.id);
  });

  it("L2_agent için self + L2 havuzu filtresi", () => {
    const a = user("a@x.com", "L2_agent");
    const v = visibilityFor(a);
    expect(v.whereSql).toContain("assigned_to = @me_l2");
    expect(v.whereSql).toContain("escalated_to_role = 'L2'");
  });
});

describe("canAccessTicket", () => {
  it("super_admin her şeye erişir", () => {
    const sa = user("sa@x.com", "super_admin");
    expect(
      canAccessTicket(sa, {
        assigned_to: 999,
        status: "in_progress",
        escalated_to_role: null,
      }),
    ).toBe(true);
  });

  it("L1_agent kendine atanan ticket'ı görür", () => {
    const a = user("a@x.com", "L1_agent");
    expect(
      canAccessTicket(a, {
        assigned_to: a.id,
        status: "in_progress",
        escalated_to_role: null,
      }),
    ).toBe(true);
  });

  it("L1_agent başka L1'e atanan ticket'ı görmez", () => {
    const a = user("a@x.com", "L1_agent");
    const b = user("b@x.com", "L1_agent");
    expect(
      canAccessTicket(a, {
        assigned_to: b.id,
        status: "in_progress",
        escalated_to_role: null,
      }),
    ).toBe(false);
  });

  it("L1_agent atanmamış L1 havuzunu görür", () => {
    const a = user("a@x.com", "L1_agent");
    expect(
      canAccessTicket(a, {
        assigned_to: null,
        status: "open",
        escalated_to_role: null,
      }),
    ).toBe(true);
  });

  it("L1_agent L2 havuzunu görmez", () => {
    const a = user("a@x.com", "L1_agent");
    expect(
      canAccessTicket(a, {
        assigned_to: null,
        status: "escalated",
        escalated_to_role: "L2",
      }),
    ).toBe(false);
  });

  it("L2_agent L2 havuzunu görür", () => {
    const a = user("a@x.com", "L2_agent");
    expect(
      canAccessTicket(a, {
        assigned_to: null,
        status: "escalated",
        escalated_to_role: "L2",
      }),
    ).toBe(true);
  });

  it("L2_agent L1 havuzunu görmez", () => {
    const a = user("a@x.com", "L2_agent");
    expect(
      canAccessTicket(a, {
        assigned_to: null,
        status: "open",
        escalated_to_role: null,
      }),
    ).toBe(false);
  });

  it("L1_lead tüm L1 ticket'ları görür", () => {
    const lead = user("lead@x.com", "L1_lead");
    const a = user("a@x.com", "L1_agent");
    expect(
      canAccessTicket(lead, {
        assigned_to: a.id,
        status: "in_progress",
        escalated_to_role: null,
      }),
    ).toBe(true);
  });

  it("L1_lead L2 havuzunu görmez", () => {
    const lead = user("lead@x.com", "L1_lead");
    expect(
      canAccessTicket(lead, {
        assigned_to: null,
        status: "escalated",
        escalated_to_role: "L2",
      }),
    ).toBe(false);
  });

  it("L2_lead L1 atamasını da görür", () => {
    const lead = user("lead@x.com", "L2_lead");
    const a = user("a@x.com", "L1_agent");
    expect(
      canAccessTicket(lead, {
        assigned_to: a.id,
        status: "in_progress",
        escalated_to_role: null,
      }),
    ).toBe(true);
  });
});
