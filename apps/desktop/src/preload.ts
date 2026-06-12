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
  onSpeak: (cb: (text: string) => void) => {
    const handler = (_: Electron.IpcRendererEvent, text: string) => cb(text);
    ipcRenderer.on("ella:speak", handler);
    return () => ipcRenderer.removeListener("ella:speak", handler);
  },
  onBackground: (cb: (isBackground: boolean) => void) => {
    const handler = (_: Electron.IpcRendererEvent, val: boolean) => cb(val);
    ipcRenderer.on("ella:background", handler);
    return () => ipcRenderer.removeListener("ella:background", handler);
  },
  executeShutdown: (cmd: string) => ipcRenderer.send("ella:shutdown", cmd),
  notifyAlert: (message: string, severity?: "warning" | "error") =>
    ipcRenderer.send("ella:alert", {
      message,
      severity: severity ?? "warning",
    }),
  notifyDevice: (
    message: string,
    type: "connected" | "disconnected" | "network",
  ) => ipcRenderer.send("ella:device", { message, type }),
  onSetupStatus: (cb: (msg: string) => void) => {
    const handler = (_: Electron.IpcRendererEvent, msg: string) => cb(msg);
    ipcRenderer.on("ella:setup", handler);
    return () => ipcRenderer.removeListener("ella:setup", handler);
  },
});
