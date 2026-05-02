import path from "node:path";
import fs from "node:fs/promises";
import { type Registry, registrySchema } from "../types/registry.ts";
import { getConfigDir } from "../utils/getConfigDir.ts";

const REGISTRY_VERSION = 1;

const getRegistryPath = (): string => {
  return path.join(getConfigDir(), "registry.json");
};

const ensureRegistryExists = async (): Promise<void> => {
  const configDir = getConfigDir();
  console.log(`Looking for registry entry at: ${configDir}`);

  const registryPath = getRegistryPath();

  await fs.mkdir(configDir, { recursive: true });

  try {
    await fs.access(registryPath);
  } catch {
    await fs.writeFile(
      registryPath,
      JSON.stringify({ version: 1, templates: [] }, null, 2),
      "utf8",
    );
  }
};

const loadRegistry = async (): Promise<Registry> => {
  await ensureRegistryExists();
  const registryPath = getRegistryPath();
  const registryContent = await fs.readFile(registryPath, "utf-8");
  const parsedRegistry = JSON.parse(registryContent);
  const validationResult = registrySchema.safeParse(parsedRegistry);

  if (!validationResult.success) {
    throw new Error(
      `Error: Invalid registry file. ${validationResult.error.message}`,
    );
  }

  if (validationResult.data.version !== REGISTRY_VERSION) {
    throw new Error(
      `Error: Unsupported registry version. Expected version ${REGISTRY_VERSION}.`,
    );
  }

  return validationResult.data;
};

export const getTemplatePathFromRegistry = async (
  alias: string,
): Promise<string | null> => {
  const registry = await loadRegistry();
  const entry = registry.templates.find((template) => template.alias === alias);
  return entry ? entry.path : null;
};
