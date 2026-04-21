import type {
  StringVariable,
  NumberVariable,
  Template,
  Variable,
  BooleanVariable,
  SelectVariable,
} from "../types/template";
import type { Variable as VariableValue } from "../types/variable";

export const scaffoldFromTemplate = (template: Template) => {
  const variables = promptForVariables(template.variables);

  console.log(variables);
};

const promptForVariables = (variables: Variable[]): VariableValue[] => {
  // Implementation for prompting users for variable values
  return [];
};

const promptForString = (
  variableInfo: StringVariable,
): { name: string; content: string | null } => {
  return { name: "temp", content: null };
};
const promptForNumber = (
  variableInfo: NumberVariable,
): { name: string; content: number | null } => {
  return { name: "temp", content: null };
};
const promptForBoolean = (
  variableInfo: BooleanVariable,
): { name: string; content: boolean } => {
  return { name: "temp", content: false };
};
const promptForSelect = (
  variableInfo: SelectVariable,
): { name: string; content: string | string[] | number | number[] | null } => {
  return { name: "temp", content: null };
};
