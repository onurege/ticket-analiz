/*
 * Süper admin oluşturucu — interaktif.
 *
 *   npx tsx scripts/init-super-admin.ts
 *
 * Akış:
 *   1. .env'i okur, CC_SESSION_SECRET varlığını doğrular
 *   2. cc_users tablosunda zaten aktif bir super_admin varsa uyarır
 *      (devam edebilir; ikinci bir super-admin ekleyebilir)
 *   3. Terminal'den email + ad + şifre sorar (şifre maskelidir)
 *   4. bcrypt ile hashler, DB'ye yazar
 */

import "dotenv/config";
import * as readline from "node:readline";
import { Writable } from "node:stream";
import { hashPassword } from "../src/lib/cc/auth";
import {
  countSuperAdmins,
  createUser,
  getUserByEmail,
} from "../src/lib/cc/db";
import { env } from "../src/lib/env";

type Muteable = Writable & { muted?: boolean };

function prompt(question: string, opts: { mask?: boolean } = {}): Promise<string> {
  return new Promise((resolve, reject) => {
    const mutableStdout: Muteable = new Writable({
      write(chunk, _enc, cb) {
        if (!mutableStdout.muted) process.stdout.write(chunk);
        cb();
      },
    });
    const rl = readline.createInterface({
      input: process.stdin,
      output: mutableStdout,
      terminal: true,
    });
    process.stdout.write(question);
    if (opts.mask) mutableStdout.muted = true;
    rl.question("", (answer) => {
      if (opts.mask) process.stdout.write("\n");
      rl.close();
      resolve(answer.trim());
    });
    rl.on("close", () => mutableStdout.muted = false);
    rl.on("error", reject);
  });
}

function validateEmail(s: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);
}

async function main(): Promise<void> {
  try {
    env(); // env doğrula
  } catch (err) {
    console.error("✖ .env eksik/hatalı:", (err as Error).message);
    process.exit(1);
  }

  console.log("─".repeat(50));
  console.log("Çağrı Merkezi — Süper Admin Oluştur");
  console.log("─".repeat(50));

  const existing = countSuperAdmins();
  if (existing > 0) {
    console.log(`Uyarı: Sistemde zaten ${existing} aktif super_admin var.`);
    const proceed = await prompt("Yeni bir super_admin daha eklensin mi? (e/h): ");
    if (proceed.toLowerCase() !== "e") {
      console.log("İptal edildi.");
      return;
    }
  }

  let email = "";
  for (;;) {
    email = (await prompt("E-posta: ")).toLowerCase();
    if (!validateEmail(email)) {
      console.log("✖ Geçersiz e-posta. Tekrar deneyin.");
      continue;
    }
    if (getUserByEmail(email)) {
      console.log("✖ Bu e-posta zaten kayıtlı. Tekrar deneyin.");
      continue;
    }
    break;
  }

  let name = "";
  for (;;) {
    name = await prompt("Ad Soyad: ");
    if (name.length < 2) {
      console.log("✖ En az 2 karakter olmalı.");
      continue;
    }
    if (/^\d+$/.test(name)) {
      console.log(
        "✖ Ad Soyad sadece rakamdan oluşamaz (parolanızı yanlışlıkla yazdıysanız buraya değil sonraki adımda istenecek).",
      );
      continue;
    }
    if (!/[a-zA-ZçğıöşüÇĞİÖŞÜ]/.test(name)) {
      console.log("✖ Ad Soyad en az bir harf içermeli.");
      continue;
    }
    if (name.length > 120) {
      console.log("✖ Ad Soyad en fazla 120 karakter olabilir.");
      continue;
    }
    break;
  }

  let password = "";
  for (;;) {
    password = await prompt("Parola (en az 8 karakter): ", { mask: true });
    if (password.length < 8) {
      console.log("✖ Parola en az 8 karakter olmalı.");
      continue;
    }
    const confirm = await prompt("Parola (tekrar): ", { mask: true });
    if (password !== confirm) {
      console.log("✖ Parolalar eşleşmiyor.");
      continue;
    }
    break;
  }

  const password_hash = await hashPassword(password);
  const user = createUser({
    email,
    name,
    role: "super_admin",
    password_hash,
    created_by: null,
  });

  console.log();
  console.log("✓ Süper admin oluşturuldu:");
  console.log(`  id:    ${user.id}`);
  console.log(`  email: ${user.email}`);
  console.log(`  ad:    ${user.name}`);
  console.log(`  rol:   ${user.role}`);
  console.log();
  console.log("Şimdi http://localhost:3002/login ile giriş yapabilirsiniz.");
}

main().catch((err) => {
  console.error("Hata:", err);
  process.exit(1);
});
