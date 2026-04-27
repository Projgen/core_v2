import type { WriteStep } from "../../types/template";
import type { Variable } from "../../types/variable";
import { replaceVariablesInString } from "../../utils/replaceVariable.ts";
import { writeFile } from "node:fs";
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

  writeFile(path, content, (err) => {
    if (err) {
      console.error(`Error writing file: ${err.message}`);
    } else {
      console.log(`File written successfully to ${path}`);
    }
  });
};
