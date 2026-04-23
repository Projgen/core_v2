import { exec } from "node:child_process";
import type { RunStep } from "../../types/template";
import type { Variable } from "../../types/variable";
import { checkCondition } from "../conditional.ts";
import { replaceVariablesInString } from "../../utils/replaceVariable.ts";

export default async (step: RunStep, variables: Variable[]) => {
  if (
    step.when &&
    !step.when.every((condition) => checkCondition(condition, variables))
  ) {
    return;
  }

  const command = replaceVariablesInString(step.command, variables);

  exec(command, { cwd: step.cwd }, (error, stdout, stderr) => {
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
