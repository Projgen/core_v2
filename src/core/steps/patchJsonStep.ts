import { readFile } from "fs/promises";
import type { PatchJsonStep } from "../../types/template";
import type { Variable } from "../../types/variable";
import { resolveVariablesInString } from "../../utils/replaceVariable.ts";
import { checkCondition } from "../conditional.ts";
import { writeFile } from "fs/promises";

export default async (step: PatchJsonStep, variables: Variable[]) => {
  if (
    step.when &&
    !step.when.every((condition) => checkCondition(condition, variables))
  ) {
    return;
  }

  console.log(`\nPatching JSON file at path: ${step.path}`);

  const path = resolveVariablesInString(step.path, variables);
  const operation = step.operation;
  const jsonPath = step.jsonPath;

  // Has to be done this way, because value isn't just a string but a json object. This way, every part of the object can have variables in it
  const value = step.value
    ? JSON.parse(
        resolveVariablesInString(JSON.stringify(step.value), variables),
      )
    : undefined;

  const fileContent = await readFile(path, "utf8");

  const json = JSON.parse(fileContent);

  const newContent = patchJson(json, operation, value, jsonPath);
  await writeFile(path, JSON.stringify(newContent, null, 2), "utf8");
};

const patchJson = (
  json: unknown,
  operation: "set" | "append" | "remove",
  value: unknown,
  jsonPath: string[],
): unknown => {
  switch (operation) {
    case "set": {
      return setValueAtJsonPath(json, jsonPath, value);
    }
    case "append": {
      return appendValueAtJsonPath(json, jsonPath, value);
    }
    case "remove": {
      return removeValueAtJsonPath(json, jsonPath);
    }
  }
};

const setValueAtJsonPath = (
  json: unknown,
  jsonPath: string[],
  value: unknown,
): unknown => {
  if (typeof jsonPath[0] !== "string")
    throw new Error("jsonPath has to be an array of strings");

  // Ensure we have an object to operate on; create missing objects along the path
  const obj: Record<string, unknown> = isRecord(json)
    ? (json as Record<string, unknown>)
    : {};

  if (jsonPath.length > 1) {
    obj[jsonPath[0]] = setValueAtJsonPath(
      obj[jsonPath[0]],
      jsonPath.slice(1),
      value,
    );
    return obj;
  }

  obj[jsonPath[0]] = value;
  return obj;
};

const appendValueAtJsonPath = (
  json: unknown,
  jsonPath: string[],
  value: unknown,
): unknown => {
  if (typeof jsonPath[0] !== "string")
    throw new Error("jsonPath has to be an array of strings");
  if (isRecord(json)) {
    if (jsonPath.length > 1) {
      json[jsonPath[0]] = appendValueAtJsonPath(
        json[jsonPath[0]],
        jsonPath.slice(1),
        value,
      );
      return json;
    }
    const target = json[jsonPath[0]];

    if (Array.isArray(target) && Array.isArray(value)) {
      json[jsonPath[0]] = [...target, ...value];
    } else if (Array.isArray(target) && !Array.isArray(value)) {
      json[jsonPath[0]] = [...target, value];
    } else if (typeof target === "object" && isRecord(value)) {
      json[jsonPath[0]] = { ...target, ...value };
    } else {
      throw new Error(
        `Cannot append value to target at jsonPath ${jsonPath.join(
          ".",
        )} because they are not compatible types`,
      );
    }
  }

  return json;
};

const removeValueAtJsonPath = (json: unknown, jsonPath: string[]): unknown => {
  if (typeof jsonPath[0] !== "string")
    throw new Error("jsonPath has to be an array of strings");
  if (isRecord(json)) {
    if (jsonPath.length > 1) {
      json[jsonPath[0]] = removeValueAtJsonPath(
        json[jsonPath[0]],
        jsonPath.slice(1),
      );
      return json;
    }
    delete json[jsonPath[0]];
    return json;
  }
};

function isRecord(check: unknown): check is Record<string, unknown> {
  if (check && typeof check === "object") {
    return !!(check as Record<string, unknown>);
  }
  return false;
}
