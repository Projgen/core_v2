#!/usr/bin/env node

import path from "node:path";
import yargs from "yargs";
import { hideBin } from "yargs/helpers";
import fs from "node:fs";
import { tryCatchSync } from "./utils/tryCatch.ts";
import { type Template, TemplateSchema } from "./types/template.ts";
import { scaffoldFromTemplate } from "./core/templatingEngine.ts";
import { getTemplatePathFromRegistry } from "./core/registryEngine.ts";
import { getConfigDir } from "./utils/getConfigDir.ts";

const validateTemplate = (template: unknown): Template => {
  const validationResult = TemplateSchema.safeParse(template);

  if (!validationResult.success) {
    throw new Error(
      `Error: Invalid template file. ${validationResult.error.message}`,
    );
  }

  return validationResult.data;
};

const getTemplateFromPath = async (
  templatePath: string,
): Promise<Template | null> => {
  const absolutePath = path.resolve(process.cwd(), templatePath);

  console.log(`Checking for template at ${absolutePath}`);

  if (!fs.existsSync(absolutePath)) {
    return null;
  }

  const templateContent = fs.readFileSync(absolutePath, "utf-8");
  const templateData = tryCatchSync(() => JSON.parse(templateContent));

  if (templateData.error) {
    return null;
  }

  const validatedTemplate = tryCatchSync(() =>
    validateTemplate(templateData.data),
  );
  if (validatedTemplate.error) {
    return null;
  }

  return validatedTemplate.data;
};

// Checks if templatePath is valid and returns template if it is, otherwise throws an error
const getTemplate = async (inputPath: string): Promise<Template | null> => {
  // First check if the inputPath is a valid path to a template file
  const templateFromPath = await getTemplateFromPath(inputPath);

  if (templateFromPath) {
    return templateFromPath;
  }

  // If not, check if it's an alias in the registry
  const registryTemplatePath = await getTemplatePathFromRegistry(inputPath);
  if (registryTemplatePath) {
    const absoluteRegistryTemplatePath = path.resolve(
      getConfigDir(),
      registryTemplatePath,
    );
    const templateFromRegistryPath = await getTemplateFromPath(
      absoluteRegistryTemplatePath,
    );
    if (templateFromRegistryPath) {
      return templateFromRegistryPath;
    }
  }

  throw new Error(
    `Error: Template not found at path "${inputPath}" or in registry with alias "${inputPath}".`,
  );
};

const main = async (templateArg: string) => {
  const template = await getTemplate(templateArg);

  if (!template) {
    throw new Error(
      `Error: Template not found at path "${templateArg}" or in registry with alias "${templateArg}".`,
    );
  }

  await scaffoldFromTemplate(template);
};

yargs()
  .scriptName("projgen")
  .usage("$0 <command> [args]")
  .command({
    command: "create [templatePath]",
    describe: "Create a new project from a template",
    aliases: ["c", "cr"],
    builder: (yargs) => {
      return yargs.positional("templatePath", {
        type: "string",
        describe: "Path to the template file",
      });
    },
    handler: async (argv) => {
      await main(argv.templatePath as string);
    },
  })
  .help()
  .parse(hideBin(process.argv));
