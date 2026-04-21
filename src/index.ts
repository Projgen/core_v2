#!/usr/bin/env node

// TODO: Add linting and script for linting 'npm run lint'

import path from "node:path";
import yargs from "yargs";
import { hideBin } from "yargs/helpers";
import fs from "node:fs";
import { tryCatchSync } from "./utils/tryCatch.ts";
import { type Template, TemplateSchema } from "./types/template.ts";
import { scaffoldFromTemplate } from "./core/templatingEngine.ts";

// Checks if templatePath is valid and returns template if it is, otherwise throws an error
const verifyTemplatePath = (inputPath: string): string => {
  // get absolute path to the template file
  const templatePath = path.resolve(process.cwd(), inputPath);

  // check if file is a json
  if (path.extname(templatePath) !== ".json") {
    throw new Error("Error: Template file must be a JSON file.");
  }

  // make sure file exists
  const templateExists = fs.existsSync(templatePath);
  if (!templateExists) {
    throw new Error("Error: Template file not found.");
  }

  // read the template file
  const templateContent = fs.readFileSync(templatePath, "utf-8");

  // parse the template file
  const templateData = tryCatchSync(() => JSON.parse(templateContent));

  if (templateData.error) {
    throw new Error("Error: Failed to parse template file.");
  }
  return templateData.data;
};

const validateTemplate = (template: string): Template => {
  const validationResult = TemplateSchema.safeParse(template);

  if (!validationResult.success) {
    throw new Error(
      `Error: Invalid template file. ${validationResult.error.message}`,
    );
  }

  return validationResult.data;
};

const main = (template: string) => {
  const templateData = tryCatchSync(() => verifyTemplatePath(template));

  if (templateData.error) {
    console.error(templateData.error.message);
    process.exit(1);
  }

  const validatedTemplate = tryCatchSync(() =>
    validateTemplate(templateData.data),
  );

  if (validatedTemplate.error) {
    console.error(validatedTemplate.error.message);
    process.exit(1);
  }

  scaffoldFromTemplate(validatedTemplate.data);
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
    handler: (argv) => {
      main(argv.templatePath as string);
    },
  })
  .help()
  .parse(hideBin(process.argv));
