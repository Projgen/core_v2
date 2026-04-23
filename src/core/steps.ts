import type { RunStep } from "../types/template.ts";
import { checkCondition } from "./conditional.ts";
import type { Variable } from "../types/variable.ts";

const runStep = async (step: RunStep, variables: Variable[]) => {
  if (step.when) {
    let conditionMet = step.when.every((condition) =>
      checkCondition(condition, variables),
    );
    if (!conditionMet) {
      return;
    }
    console.log("Conditions are met");
  }
};

export default { runStep };
