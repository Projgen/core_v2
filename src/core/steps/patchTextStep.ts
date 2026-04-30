import { readFile, writeFile } from "node:fs/promises";
import type { PatchTextStep } from "../../types/template";
import type { Variable } from "../../types/variable";
import { resolveVariablesInString } from "../../utils/replaceVariable.ts";
import { checkCondition } from "../conditional.ts";

export default async (step: PatchTextStep, variables: Variable[]) => {
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

  console.log(
    `\nPatching text in file: ${step.path} with operation: ${step.operation}`,
  );

  // Replace variables and gather the data
  const path = resolveVariablesInString(step.path, variables);
  const find = step.find
    ? resolveVariablesInString(step.find, variables)
    : undefined;

  const rawText = step.url
    ? await fetch(step.url).then((res) => res.text())
    : step.content || "";
  const text = resolveVariablesInString(rawText, variables);

  // Read the target file's current contents
  const fileContent = await readFile(path, "utf8");

  const newContent = await patchText(step, find, text, fileContent);

  await writeFile(path, newContent, "utf8");
};

const patchText = async (
  step: PatchTextStep,
  find: string | undefined,
  text: string,
  fileContent: string,
) => {
  switch (step.operation) {
    case "replace": {
      if (!find) {
        console.warn(
          `The "find" property is required for the "replace" operation in the patch-text step at path "${step.path}". This step will be skipped.`,
        );
        return fileContent;
      }
      return fileContent.replaceAll(find, text);
    }
    case "insert-after": {
      if (!find) {
        console.warn(
          `The "find" property is required for the "insert-after" operation in the patch-text step at path "${step.path}". This step will be skipped.`,
        );
        return fileContent;
      }
      return fileContent.replaceAll(find, `${find}${text}`);
    }
    case "insert-before": {
      if (!find) {
        console.warn(
          `The "find" property is required for the "insert-before" operation in the patch-text step at path "${step.path}". This step will be skipped.`,
        );
        return fileContent;
      }
      return fileContent.replaceAll(find, `${text}${find}`);
    }
    case "append": {
      return `${fileContent}${text}`;
    }
    case "prepend": {
      return `${text}${fileContent}`;
    }
    default: {
      console.warn(
        `Invalid operation "${step.operation}" in the patch-text step at path "${step.path}". This step will be skipped.`,
      );
      return fileContent;
    }
  }
};
