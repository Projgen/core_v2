import type { WriteStep } from "../../types/template";
import type { Variable } from "../../types/variable";
import { resolveVariablesInString } from "../../utils/replaceVariable.ts";
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

  if (step.url && step.content) {
    console.warn(
      `Both "url" and "content" are provided for the write step at path "${step.path}". The "url" will take precedence and the "content" will be ignored.`,
    );
  }

  console.log(`\nWriting file at path: ${step.path}`);

  const path = resolveVariablesInString(step.path, variables);
  const rawContent = step.url
    ? await fetch(step.url).then((res) => res.text())
    : step.content || "";

  const content = resolveVariablesInString(rawContent, variables);

  try {
    await mkdir(dirname(path), { recursive: true });
    await writeFile(path, content);
  } catch (err) {
    if (err instanceof Error) {
      console.error(`Error writing file: ${err.message}`);
      return;
    }

    console.error("Error writing file: Unknown error");
  }
};
