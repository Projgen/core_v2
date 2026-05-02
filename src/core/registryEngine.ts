import path from "node:path";
import fs from "node:fs/promises";
import { type Registry, registrySchema } from "../types/registry.ts";
import { getConfigDir } from "../utils/getConfigDir.ts";
import type { Template } from "../types/template.ts";

const REGISTRY_VERSION = 1;

const getRegistryPath = (): string => {
  return path.join(getConfigDir(), "registry.json");
};

const ensureRegistryExists = async (): Promise<void> => {
  const configDir = getConfigDir();

  const registryPath = getRegistryPath();

  await fs.mkdir(configDir, { recursive: true });

  try {
    await fs.access(registryPath);
  } catch {
    await fs.writeFile(
      registryPath,
      JSON.stringify({ version: REGISTRY_VERSION, templates: [] }, null, 2),
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

  if (!entry) {
    return null;
  }

  return path.join(getConfigDir(), entry.path);
};

export const addTemplateToRegistry = async (
  template: Template,
  specialAlias: string | null = null,
): Promise<void> => {
  const registry = await loadRegistry();
  const configDir = getConfigDir();
  const templatePath = path.join(configDir, `${template.id}.json`);

  const alias = specialAlias || template.id;

  const aliasExists = registry.templates.some((entry) => entry.alias === alias);
  if (aliasExists) {
    console.error(
      `Error: A template with the same alias already exists in the registry: ${alias}.`,
    );
    process.exit(1);
  }

  const fileExists = await fs
    .access(templatePath)
    .then(() => true)
    .catch(() => false);

  if (fileExists) {
    console.error(
      `Error: A template with the same ID already exists at ${templatePath}.`,
    );
    process.exit(1);
  }

  await fs.writeFile(templatePath, JSON.stringify(template, null, 2), "utf8");
  registry.templates.push({ alias, path: `${template.id}.json` });
  await fs.writeFile(
    getRegistryPath(),
    JSON.stringify(registry, null, 2),
    "utf8",
  );

  console.log(
    `Template "${template.name}" added to registry with alias "${alias}".`,
  );
};
