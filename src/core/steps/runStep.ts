import { spawn } from "node:child_process";
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

  console.log(`\nRunning command: ${command}`);

  await new Promise<void>((resolve, reject) => {
    const childProcess = spawn(command, {
      cwd: step.cwd,
      shell: true,
    });

    childProcess.stdout?.on("data", (chunk) => {
      process.stdout.write(chunk);
    });

    childProcess.stderr?.on("data", (chunk) => {
      process.stderr.write(chunk);
    });

    childProcess.on("error", (error) => {
      console.error(`Error executing command: ${error.message}`);
      reject(error);
    });

    childProcess.on("close", (code) => {
      if (code === 0) {
        resolve();
        return;
      }

      const exitCode = code ?? "unknown";
      const error = new Error(`Command exited with code ${exitCode}`);
      console.error(error.message);
      reject(error);
    });
  });
  console.log();
};
