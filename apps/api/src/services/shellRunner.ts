import { execSync } from "child_process";
import * as fs from "fs";
import * as os from "os";
import * as path from "path";

const BLOCKED_PATTERNS = [
  "invoke-expression",
  "; iex",
  " iex ",
  "|iex",
  "invoke-webrequest",
  "invoke-restmethod",
  "start-bitstransfer",
  "start-process",
  "start-job",
  "remove-item",
  "del ",
  "rmdir",
  "rd ",
  "set-content",
  "out-file",
  "add-content",
  "clear-content",
  "new-item",
  "new-object -com",
  "new-object -typename",
  "copy-item",
  "move-item",
  "rename-item",
  "stop-process",
  "stop-service",
  "foreach-object",
  " % {",
  "%{",
  "invoke-command",
  "enter-pssession",
  "downloadstring",
  "downloadfile",
  "[net.webclient",
  "[system.net.",
  "[system.io.file]",
  "net use",
  "net share",
  "net localgroup",
  "reg add",
  "reg delete",
  "reg import",
  "schtasks",
  "certutil",
  "bitsadmin",
  "wscript",
  "cscript",
  "cmd /c",
  "cmd.exe",
  "powershell.exe",
  "powershell -",
  "& {",
  "& '",
  '& "',
  ".exe ",
  ".bat ",
  ".cmd ",
  ".vbs ",
  ".ps1 ",
];

export function runSafeCommand(command: string): {
  success: boolean;
  output?: string;
  error?: string;
  blockedPattern?: string;
} {
  const lower = command.toLowerCase().trim();

  const blocked = BLOCKED_PATTERNS.find((p) => lower.includes(p.toLowerCase()));
  if (blocked) {
    return {
      success: false,
      error: `Befehl enthält gesperrte Operation.`,
      blockedPattern: blocked.trim(),
    };
  }

  const ps = `Set-StrictMode -Off
try {
  $result = ${command} | Out-String -Width 200
  $result
} catch {
  Write-Error $_.Exception.Message
}`.trim();

  const tmpFile = path.join(os.tmpdir(), `ella-run-${Date.now()}.ps1`);
  try {
    fs.writeFileSync(tmpFile, ps, "utf-8");
    const output = execSync(
      `powershell -NoProfile -NonInteractive -ExecutionPolicy Bypass -File "${tmpFile}"`,
      { timeout: 15000, encoding: "utf-8" },
    ).trim();
    return { success: true, output: output.slice(0, 5000) };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return { success: false, error: msg.slice(0, 1000) };
  } finally {
    try {
      fs.unlinkSync(tmpFile);
    } catch {
      /* best effort */
    }
  }
}
