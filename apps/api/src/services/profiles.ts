import { pool } from "../config/database.js";
import { randomBytes, pbkdf2Sync, timingSafeEqual } from "crypto";

export interface Profile {
  id: number;
  name: string;
  color: string;
  hasPин: boolean;
  isActive: boolean;
  createdAt: string;
}

function hashPin(pin: string): string {
  const salt = randomBytes(16).toString("hex");
  const hash = pbkdf2Sync(pin, salt, 100_000, 32, "sha256").toString("hex");
  return `${salt}:${hash}`;
}

function verifyPin(pin: string, stored: string): boolean {
  const [salt, expected] = stored.split(":");
  if (!salt || !expected) return false;
  const actual = pbkdf2Sync(pin, salt, 100_000, 32, "sha256");
  const expectedBuf = Buffer.from(expected, "hex");
  if (actual.length !== expectedBuf.length) return false;
  return timingSafeEqual(actual, expectedBuf);
}

export async function listProfiles(): Promise<Profile[]> {
  const [rows] = await pool.execute<any[]>(
    `SELECT id, name, color, pin_hash IS NOT NULL AS has_pin, is_active, created_at
     FROM profiles ORDER BY id ASC`,
  );

  return rows.map((r) => ({
    id: r.id,
    name: r.name,
    color: r.color,
    hasPин: Boolean(r.has_pin),
    isActive: Boolean(r.is_active),
    createdAt: String(r.created_at),
  }));
}

export async function createProfile(
  name: string,
  color = "#7c3aed",
  pin?: string,
): Promise<Profile> {
  const pinHash = pin ? hashPin(pin) : null;
  const [result] = await pool.execute<any>(
    `INSERT INTO profiles (name, color, pin_hash, is_active) VALUES (?, ?, ?, 0)`,
    [name, color, pinHash],
  );

  return {
    id: result.insertId as number,
    name,
    color,
    hasPин: Boolean(pin),
    isActive: false,
    createdAt: new Date().toISOString(),
  };
}

export async function switchProfile(
  id: number,
  pin?: string,
): Promise<{ success: boolean; error?: string }> {
  const [rows] = await pool.execute<any[]>(
    `SELECT id, pin_hash FROM profiles WHERE id = ?`,
    [id],
  );

  if (!rows[0]) return { success: false, error: "Profil nicht gefunden." };

  const { pin_hash } = rows[0];
  if (pin_hash) {
    if (!pin) return { success: false, error: "PIN erforderlich." };
    const ok = verifyPin(pin, pin_hash as string);
    if (!ok) return { success: false, error: "Falscher PIN." };
  }

  // Transaktion: erst alle deaktivieren, dann gewähltes aktivieren
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    await conn.execute(`UPDATE profiles SET is_active = 0`);
    await conn.execute(`UPDATE profiles SET is_active = 1 WHERE id = ?`, [id]);
    await conn.commit();
    return { success: true };
  } catch (err) {
    await conn.rollback();
    return {
      success: false,
      error: err instanceof Error ? err.message : "Datenbankfehler.",
    };
  } finally {
    conn.release();
  }
}

export async function deleteProfile(
  id: number,
): Promise<{ success: boolean; error?: string }> {
  const [rows] = await pool.execute<any[]>(
    `SELECT id, is_active FROM profiles WHERE id = ?`,
    [id],
  );

  if (!rows[0]) return { success: false, error: "Profil nicht gefunden." };
  if (rows[0].is_active)
    return {
      success: false,
      error: "Aktives Profil kann nicht gelöscht werden.",
    };
  if (rows[0].id === 1)
    return {
      success: false,
      error: "Standard-Profil kann nicht gelöscht werden.",
    };

  await pool.execute(`DELETE FROM profiles WHERE id = ?`, [id]);
  return { success: true };
}

export async function getActiveProfileId(): Promise<number> {
  const [rows] = await pool.execute<any[]>(
    `SELECT id FROM profiles WHERE is_active = 1 LIMIT 1`,
  );
  return (rows[0]?.id as number) ?? 1;
}
