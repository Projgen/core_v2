import { type Template, type Variable } from "../types/template.ts";
import type { Variable as VariableValue } from "../types/variable.ts";
import prompter, { type Prompter } from "../utils/prompter.ts";
import steps from "./steps/steps.ts";

export const scaffoldFromTemplate = async (template: Template) => {
  printTemplateInfo(template);
  const variables = await promptForVariables(template.variables);

  // Run Steps
  for (const step of template.steps) {
    switch (step.type) {
      case "run":
        await steps.runStep(step, variables);
        break;
      case "write":
        await steps.writeStep(step, variables);
        break;
      case "patch-text":
        await steps.patchTextStep(step, variables);
        break;
      default:
        console.warn(`Unknown step type: ${step.type}`); // This should never happen due to the schema validation, but it's good to have just in case
    }
  }
};

const printTemplateInfo = (
  template: Template,
  logger: (message: string) => void = console.log,
) => {
  logger(`\n${template.name} #${template.version} - ${template.author}`);
  logger(`${template.description}\n`);
};

const promptForVariables = async (
  variables: Variable[],
  _prompter: Prompter = prompter,
): Promise<VariableValue[]> => {
  // Implementation for prompting users for variable values
  let variableValues: VariableValue[] = [];
  for (const variable of variables) {
    switch (variable.type) {
      case "string":
        const value = await _prompter.promptForString(variable);
        variableValues.push(value);
        break;
      case "number":
        const numValue = await _prompter.promptForNumber(variable);
        variableValues.push(numValue);
        break;
      case "boolean":
        const boolValue = await _prompter.promptForBoolean(variable);
        variableValues.push(boolValue);
        break;
      case "select":
        const selectValue = await _prompter.promptForSelect(variable);
        variableValues.push(selectValue);
        break;
    }
  }
  return variableValues;
};
