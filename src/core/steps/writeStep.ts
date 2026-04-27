import type { WriteStep } from "../../types/template";
import type { Variable } from "../../types/variable";
import { replaceVariablesInString } from "../../utils/replaceVariable.ts";
import { mkdir, writeFile } from "node:fs/promises";
import { dirname } from "node:path";
import { checkCondition } from "../conditional.ts";

export default async (step: WriteStep, variables: Variable[]) => {
  if (
    step.when &&
    !step.when.every((condition) => checkCondition(condition, variables))
  ) {
    return;
  }

  const path = replaceVariablesInString(step.path, variables);
  const content = replaceVariablesInString(step.content, variables);

  try {
    await mkdir(dirname(path), { recursive: true });
    await writeFile(path, content);
    console.log(`File written successfully to ${path}`);
  } catch (err) {
    if (err instanceof Error) {
      console.error(`Error writing file: ${err.message}`);
      return;
    }

    console.error("Error writing file: Unknown error");
  }
};
