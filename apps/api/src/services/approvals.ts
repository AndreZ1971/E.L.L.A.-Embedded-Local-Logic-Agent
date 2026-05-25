const pending = new Map<string, (approved: boolean) => void>();

export function requestApproval(id: string): Promise<boolean> {
  return new Promise((resolve) => {
    pending.set(id, resolve);
    setTimeout(() => {
      if (pending.delete(id)) resolve(false); // auto-deny nach 60s
    }, 60_000);
  });
}

export function resolveApproval(id: string, approved: boolean): boolean {
  const fn = pending.get(id);
  if (!fn) return false;
  pending.delete(id);
  fn(approved);
  return true;
}
