import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { pool } from "../../config/database.js";
import { remember, forgetById, listMemories } from "../../services/memory.js";

let skipDb = false;
const TAG = "__integration_mem_test__";

beforeAll(async () => {
  try {
    await pool.execute("SELECT 1");
  } catch {
    skipDb = true;
  }
});

afterAll(async () => {
  // Clean up any leftover test memories
  await pool
    .execute("DELETE FROM memories WHERE source = ?", [TAG])
    .catch(() => {});
  await pool.end().catch(() => {});
});

describe("remember → listMemories round-trip", () => {
  it("stored memory appears in listMemories", async () => {
    if (skipDb) return;

    // Bypass Ollama embed by inserting directly — remember() needs Ollama.
    // Insert via pool so we can test listMemories without needing Ollama.
    await pool.execute(
      "INSERT INTO memories (type, content, embedding, source) VALUES (?, ?, ?, ?)",
      ["note", "integration-test-memory", "[]", TAG],
    );

    const rows = await listMemories("note", 50);
    const found = rows.find((r) => r.content === "integration-test-memory");
    expect(found).toBeDefined();
  });
});

describe("forgetById — DB integration", () => {
  it("deletes a specific memory by id", async () => {
    if (skipDb) return;

    const [result] = await pool.execute<any>(
      "INSERT INTO memories (type, content, embedding, source) VALUES (?, ?, ?, ?)",
      ["note", "to-be-deleted", "[]", TAG],
    );
    const id = result.insertId as number;
    expect(id).toBeGreaterThan(0);

    const res = await forgetById(id);
    expect(res.success).toBe(true);

    const rows = await listMemories("note", 100);
    expect(rows.find((r) => r.id === id)).toBeUndefined();
  });

  it("returns success even when id does not exist", async () => {
    if (skipDb) return;
    const res = await forgetById(999_999_999);
    expect(res.success).toBe(true);
  });
});
