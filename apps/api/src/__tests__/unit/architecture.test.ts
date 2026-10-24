import { describe, it, expect } from "vitest";
import * as fs from "fs";
import * as path from "path";

function findTsFiles(dir: string): string[] {
  const results: string[] = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (
      entry.isDirectory() &&
      entry.name !== "node_modules" &&
      entry.name !== "__tests__"
    ) {
      results.push(...findTsFiles(full));
    } else if (entry.isFile() && entry.name.endsWith(".ts")) {
      results.push(full);
    }
  }
  return results;
}

const SRC = path.resolve(__dirname, "../..");

describe("architecture constraints", () => {
  it("api.openai.com only appears in services/openai.ts", () => {
    const files = findTsFiles(SRC);
    const matches = files.filter((f) =>
      fs.readFileSync(f, "utf-8").includes("api.openai.com"),
    );
    const relative = matches.map((f) =>
      path.relative(SRC, f).replace(/\\/g, "/"),
    );
    expect(relative).toEqual(["services/openai.ts"]);
  });

  it("env.openaiApiKey is not referenced anywhere", () => {
    const files = findTsFiles(SRC);
    const matches = files.filter((f) =>
      fs.readFileSync(f, "utf-8").includes("env.openaiApiKey"),
    );
    expect(matches).toEqual([]);
  });
});
