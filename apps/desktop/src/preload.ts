import { contextBridge, ipcRenderer } from "electron";

contextBridge.exposeInMainWorld("electronAPI", {
  minimize: () => ipcRenderer.send("window:minimize"),
  maximize: () => ipcRenderer.send("window:maximize"),
  close: () => ipcRenderer.send("window:close"),
  isMaximized: (): Promise<boolean> => ipcRenderer.invoke("window:isMaximized"),
  onMaximizeChange: (cb: (maximized: boolean) => void) => {
    const handler = (_: Electron.IpcRendererEvent, val: boolean) => cb(val);
    ipcRenderer.on("window:maximized", handler);
    return () => ipcRenderer.removeListener("window:maximized", handler);
  },
  notifyAlert: (message: string, severity?: "warning" | "error") =>
    ipcRenderer.send("ella:alert", {
      message,
      severity: severity ?? "warning",
    }),
  notifyDevice: (
    message: string,
    type: "connected" | "disconnected" | "network",
  ) => ipcRenderer.send("ella:device", { message, type }),
});
