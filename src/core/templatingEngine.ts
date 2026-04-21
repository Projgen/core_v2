import type { Template, Variable } from "../types/template";
import type { Variable as VariableValue } from "../types/variable";
import prompter, { type Prompter } from "../utils/prompter.ts";

export const scaffoldFromTemplate = async (template: Template) => {
  printTemplateInfo(template);
  const variables = await promptForVariables(template.variables);
  console.log(variables);
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
