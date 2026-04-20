#!/usr/bin/env node

// TODO: Add linting and script for linting 'npm run lint'

import yargs from "yargs";
import { hideBin } from "yargs/helpers";

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
      console.log("Creating project with template at", argv.templatePath);
    },
  })
  .help()
  .parse(hideBin(process.argv));
