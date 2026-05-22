import type { ToolName } from '@ella/shared';

const ENABLED_TOOLS = new Set<ToolName>([
  'open_app',
  'get_disk_usage',
  'clean_temp',
  'empty_recycle_bin',
]);

export const toolRegistry = {
  isEnabled:   (name: ToolName): boolean   => ENABLED_TOOLS.has(name),
  listEnabled: ():               ToolName[] => [...ENABLED_TOOLS],
  enable:      (name: ToolName): void      => { ENABLED_TOOLS.add(name); },
  disable:     (name: ToolName): void      => { ENABLED_TOOLS.delete(name); },
};
