#!/usr/bin/env node

import path from "node:path";
import yargs from "yargs";
import { hideBin } from "yargs/helpers";
import fs from "node:fs";
import { tryCatch, tryCatchSync } from "./utils/tryCatch.ts";
import { type Template, TemplateSchema } from "./types/template.ts";
import {
  getTemplateEngineVersion,
  scaffoldFromTemplate,
} from "./core/templatingEngine.ts";
import {
  addTemplateToRegistry,
  getTemplatePathFromRegistry,
} from "./core/registryEngine.ts";

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
    throw new Error(
      `Error: Invalid template file at path "${templatePath}". ${validatedTemplate.error.message}`,
    );
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
    const templateFromRegistryPath = await tryCatch(
      getTemplateFromPath(registryTemplatePath),
    );

    if (templateFromRegistryPath.error) {
      throw new Error(templateFromRegistryPath.error.message);
    }

    return templateFromRegistryPath.data;
  }

  throw new Error(
    `Error: Template not found at path "${inputPath}" or in registry with alias "${inputPath}".`,
  );
};

const create = async (templateArg: string) => {
  const template = await getTemplate(templateArg);

  if (!template) {
    throw new Error(
      `Error: Template not found at path "${templateArg}" or in registry with alias "${templateArg}".`,
    );
  }

  if (template.engineVersion !== getTemplateEngineVersion()) {
    throw new Error(
      `Error: Template version ${template.engineVersion} is not compatible with template engine version ${getTemplateEngineVersion()}.`,
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
      await create(argv.templatePath as string);
    },
  })
  .command({
    command: "add [templatePath] [alias]",
    describe: "Add a template to the registry",
    aliases: ["a"],
    builder: (yargs) => {
      return yargs
        .positional("templatePath", {
          type: "string",
          describe: "Path to the template file",
        })
        .positional("alias", {
          type: "string",
          describe: "Alias to refer to the template by in the registry",
        });
    },
    handler: async (argv) => {
      const template = await getTemplateFromPath(argv.templatePath as string);
      if (!template) {
        throw new Error(
          `Error: Template not found at path "${argv.templatePath}".`,
        );
      }
      await addTemplateToRegistry(template, argv.alias as string);
    },
  })
  .help()
  .parse(hideBin(process.argv));
