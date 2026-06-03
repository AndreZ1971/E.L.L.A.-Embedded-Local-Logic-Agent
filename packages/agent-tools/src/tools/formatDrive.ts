import { exec } from 'child_process';
import { promisify } from 'util';
import type { ToolResult } from '@ella/shared';

const execAsync = promisify(exec);

// Laufwerke die NIEMALS formatiert oder umbenannt werden dürfen
// Directive [01] harm — irreversible Datenzerstörung auf System-Laufwerken
const PROTECTED_DRIVES = new Set(['C', 'D']); // D oft Recovery-Partition

// DriveType-Codes: 2 = Wechseldatenträger (USB), 3 = Lokale Festplatte
// Erlaubt: nur Wechseldatenträger (Typ 2) — keine internen Festplatten
const ALLOWED_DRIVE_TYPE = 2;

async function getDriveInfo(letter: string): Promise<{ driveType: number; label: string } | null> {
  try {
    const script = `Get-CimInstance Win32_LogicalDisk -Filter "DeviceID='${letter}:'" | Select-Object DriveType,VolumeName | ConvertTo-Json -Compress`;
    const encoded = Buffer.from(script, 'utf16le').toString('base64');
    const { stdout } = await execAsync(
      `powershell -NoProfile -NonInteractive -EncodedCommand ${encoded}`,
      { timeout: 8000 },
    );
    const parsed = JSON.parse(stdout.trim()) as { DriveType: number; VolumeName: string | null };
    return { driveType: parsed.DriveType, label: parsed.VolumeName ?? '' };
  } catch {
    return null;
  }
}

export async function formatDrive(args: {
  drive: string;
  label?: string;
  filesystem?: string;
  quick?: boolean;
}): Promise<ToolResult> {
  const drive = (args.drive ?? '').replace(':', '').trim().toUpperCase();

  if (!drive || drive.length !== 1 || !/^[A-Z]$/.test(drive)) {
    return { success: false, error: 'Ungültiger Laufwerksbuchstabe.' };
  }

  // Directive [01] harm — System- und Recovery-Laufwerke sind geschützt
  if (PROTECTED_DRIVES.has(drive)) {
    return {
      success: false,
      directive: true,
      error: `Laufwerk ${drive}: ist systemgeschützt und kann nicht formatiert werden.`,
    };
  }

  const info = await getDriveInfo(drive);
  if (!info) {
    return { success: false, error: `Laufwerk ${drive}: nicht gefunden oder nicht bereit.` };
  }

  // Nur USB/Wechseldatenträger erlaubt
  if (info.driveType !== ALLOWED_DRIVE_TYPE) {
    return {
      success: false,
      directive: true,
      error: `Laufwerk ${drive}: ist kein Wechseldatenträger (USB). Nur USB-Sticks und externe Laufwerke können formatiert werden.`,
    };
  }

  const fs = (args.filesystem ?? 'FAT32').toUpperCase();
  const validFs = ['FAT32', 'NTFS', 'exFAT'];
  if (!validFs.includes(fs)) {
    return { success: false, error: `Ungültiges Dateisystem "${fs}". Erlaubt: ${validFs.join(', ')}.` };
  }

  const label = (args.label ?? 'USB').slice(0, 11); // FAT32 max 11 Zeichen
  const quick = args.quick !== false; // Standard: Quick-Format

  try {
    // format.com via cmd — Quick-Format standardmäßig
    const quickFlag = quick ? '/Q' : '';
    const cmd = `format ${drive}: /FS:${fs} /V:"${label}" ${quickFlag} /Y`;
    await execAsync(`cmd /C ${cmd}`, { timeout: 120_000 });
    return {
      success: true,
      output: `Laufwerk ${drive}: wurde als ${fs} mit Label "${label}" formatiert.`,
      executedAt: new Date().toISOString(),
    };
  } catch (err) {
    return { success: false, error: `Format fehlgeschlagen: ${String(err)}` };
  }
}

export async function renameDrive(args: {
  drive: string;
  label: string;
}): Promise<ToolResult> {
  const drive = (args.drive ?? '').replace(':', '').trim().toUpperCase();
  const label = (args.label ?? '').trim();

  if (!drive || drive.length !== 1 || !/^[A-Z]$/.test(drive)) {
    return { success: false, error: 'Ungültiger Laufwerksbuchstabe.' };
  }

  if (!label) {
    return { success: false, error: 'Kein Name angegeben.' };
  }

  // Directive [01] harm — System-Laufwerke nicht umbenennen
  if (PROTECTED_DRIVES.has(drive)) {
    return {
      success: false,
      directive: true,
      error: `Laufwerk ${drive}: ist systemgeschützt und kann nicht umbenannt werden.`,
    };
  }

  const info = await getDriveInfo(drive);
  if (!info) {
    return { success: false, error: `Laufwerk ${drive}: nicht gefunden.` };
  }

  if (info.driveType !== ALLOWED_DRIVE_TYPE) {
    return {
      success: false,
      directive: true,
      error: `Laufwerk ${drive}: ist kein Wechseldatenträger. Nur USB-Sticks und externe Laufwerke können umbenannt werden.`,
    };
  }

  try {
    const script = `Set-Volume -DriveLetter ${drive} -NewFileSystemLabel "${label}"`;
    const encoded = Buffer.from(script, 'utf16le').toString('base64');
    await execAsync(
      `powershell -NoProfile -NonInteractive -EncodedCommand ${encoded}`,
      { timeout: 10_000 },
    );
    return {
      success: true,
      output: `Laufwerk ${drive}: wurde in "${label}" umbenannt.`,
      executedAt: new Date().toISOString(),
    };
  } catch (err) {
    return { success: false, error: `Umbenennen fehlgeschlagen: ${String(err)}` };
  }
}
