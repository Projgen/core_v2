import os from "node:os";
import path from "node:path";

export const getConfigDir = (): string => {
  const home = os.homedir();

  if (process.platform === "win32") {
    return path.join(process.env.APPDATA || home, "projgen");
  }

  if (process.platform === "linux") {
    return path.join(
      process.env.XDG_CONFIG_HOME || path.join(home, ".config"),
      "projgen",
    );
  }

  return path.join(home, ".config", "projgen");
};
