import type { Template, Variable } from "../types/template";
import type { Variable as VariableValue } from "../types/variable";

export const scaffoldFromTemplate = (template: Template) => {
  const variables = promptForVariables(template.variables);
};

export const promptForVariables = (variables: Variable[]): VariableValue[] => {
  // Implementation for prompting users for variable values
  return [];
};
