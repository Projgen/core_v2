import type { Template, Variable } from "../types/template";
import type { Variable as VariableValue } from "../types/variable";
import prompter from "../utils/prompter.ts";

export const scaffoldFromTemplate = async (template: Template) => {
  template.variables = [
    {
      name: "tempString",
      type: "string",
      message: "Enter a string variable",
      required: true,
    },
    {
      name: "tempNumber",
      type: "number",
      message: "Enter a number variable",
      required: true,
    },
    {
      name: "tempBoolean",
      type: "boolean",
      message: "Enter a boolean variable",
    },
    {
      name: "tempSingleSelect",
      type: "select",
      message: "Select an option",
      options: ["Option 1", "Option 2", "Option 3"],
      multiple: false,
      required: true,
    },
    {
      name: "tempMultiSelect",
      type: "select",
      message: "Select multiple options",
      options: ["Option 1", "Option 2", "Option 3"],
      multiple: true,
      required: true,
    },
  ];
  const variables = await promptForVariables(template.variables);
  console.log(variables);
};

const promptForVariables = async (
  variables: Variable[],
): Promise<VariableValue[]> => {
  // Implementation for prompting users for variable values
  let variableValues: VariableValue[] = [];
  for (const variable of variables) {
    switch (variable.type) {
      case "string":
        const value = await prompter.promptForString(variable);
        variableValues.push(value);
        break;
      case "number":
        const numValue = await prompter.promptForNumber(variable);
        variableValues.push(numValue);
        break;
      case "boolean":
        const boolValue = await prompter.promptForBoolean(variable);
        variableValues.push(boolValue);
        break;
      case "select":
        const selectValue = await prompter.promptForSelect(variable);
        variableValues.push(selectValue);
        break;
    }
  }
  return variableValues;
};
