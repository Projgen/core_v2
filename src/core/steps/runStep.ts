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
  console.log("Conditions are met");
};
