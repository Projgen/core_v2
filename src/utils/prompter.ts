import { de } from "zod/locales";
import type {
  BooleanVariable,
  SelectVariable,
  NumberVariable,
  StringVariable,
} from "../types/template";
import inquirer from "inquirer";

const promptForString = async (
  variableInfo: StringVariable,
): Promise<{ name: string; content: string | null }> => {
  const { [variableInfo.name]: content } = await inquirer.prompt([
    {
      name: variableInfo.name,
      message: variableInfo.message,
      type: "input",
      required: variableInfo.required,
      default: variableInfo.default,
    },
  ]);
  return { name: variableInfo.name, content };
};

const promptForNumber = async (
  variableInfo: NumberVariable,
): Promise<{ name: string; content: number | null }> => {
  const { [variableInfo.name]: content } = await inquirer.prompt([
    {
      name: variableInfo.name,
      message: variableInfo.message,
      type: "number",
      required: variableInfo.required,
      default: variableInfo.default,
    },
  ]);
  const parsedContent = parseFloat(content);
  return { name: variableInfo.name, content: parsedContent };
};

const promptForBoolean = async (
  variableInfo: BooleanVariable,
): Promise<{ name: string; content: boolean }> => {
  const { [variableInfo.name]: content } = await inquirer.prompt([
    {
      name: variableInfo.name,
      message: variableInfo.message,
      type: "confirm",
      default: variableInfo.default || false,
    },
  ]);
  return { name: variableInfo.name, content: Boolean(content) };
};

const promptForSelect = async (
  variableInfo: SelectVariable,
): Promise<{
  name: string;
  content: string | string[] | number | number[] | null;
}> => {
  const { [variableInfo.name]: content } = await inquirer.prompt([
    {
      name: variableInfo.name,
      message: variableInfo.message,
      type: variableInfo.multiple ? "checkbox" : "select",
      choices: variableInfo.options,
      required: variableInfo.required,
    },
  ]);
  return { name: variableInfo.name, content: content };
};

export type Prompter = {
  promptForString: typeof promptForString;
  promptForNumber: typeof promptForNumber;
  promptForBoolean: typeof promptForBoolean;
  promptForSelect: typeof promptForSelect;
};

export default {
  promptForString,
  promptForNumber,
  promptForBoolean,
  promptForSelect,
};
