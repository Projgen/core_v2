import { exec } from "node:child_process";
import type { RunStep } from "../../types/template";
import type { Variable } from "../../types/variable";
import { checkCondition } from "../conditional.ts";

export default async (step: RunStep, variables: Variable[]) => {
  if (
    step.when &&
    !step.when.every((condition) => checkCondition(condition, variables))
  ) {
    return;
  }

  exec(step.command, { cwd: step.cwd }, (error, stdout, stderr) => {
    if (error) {
      console.error(`Error executing command: ${error.message}`);
      return;
    }
    if (stderr) {
      console.error(`Command error output: ${stderr}`);
      return;
    }
    console.log(`Command output: ${stdout}`);
  });
};
