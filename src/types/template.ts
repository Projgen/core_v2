import * as z from "zod";

export const JsonValueSchema: z.ZodType = z.lazy(() =>
  z.union([z.string(), z.number(), z.boolean(), z.null()]),
);

export const StepConditionSchema = z.object({
  variable: z.string(), // The name of the variable to check the condition against, should reference a variable defined in the template's variables array
  operator: z.enum([
    "eq",
    "neq",
    "gt",
    "lt",
    "gte",
    "lte",
    "contains",
    "notContains",
    "isNull",
    "isNotNull",
    "matches", // checks for regex match
    "notMatches", // checks for regex not match
  ]), // The operator to use for the condition (e.g., "eq" for equals, "neq" for not equals, "gt" for greater than, etc.)
  value: JsonValueSchema, // The value to compare the variable against, should be of the same type as the variable being checked
});

export const baseVariableSchema = z.object({
  name: z.string(), // The name of the variable by which it can be referenced later in the template
  message: z.string(), // The message to display when prompting the user for input for this variable
});

// The Schema for a string variable
export const stringVariableSchema = baseVariableSchema.safeExtend({
  type: z.literal("string"), // The type of the variable, used to determine how to prompt the user for input
  default: z.string().optional(), // An optional default value for the variable
  required: z.boolean(), // Whether the user must provide a value when prompted
});

// The Schema for a number variable
export const numberVariableSchema = baseVariableSchema.safeExtend({
  type: z.literal("number"), // The type of the variable, used to determine how to prompt the user for input
  default: z.number().optional(), // An optional default value for the variable
  required: z.boolean(), // Whether the user must provide a value when prompted
});

// The Schema for a boolean variable
export const booleanVariableSchema = baseVariableSchema.safeExtend({
  type: z.literal("boolean"), // The type of the variable, used to determine how to prompt the user for input
  default: z.boolean().optional(), // An optional default value for the variable
  // Doesn't need a required field since it will always have a value (true or false)
});

// The Schema for a select variable
export const selectVariableSchema = baseVariableSchema.safeExtend({
  type: z.literal("select"), // The type of the variable, used to determine how to prompt the user for input
  required: z.boolean(), // Whether the user must provide a value when prompted, is ignored for single selects (one must be selected there)
  options: z.array(z.union([z.string(), z.number()])), // An array of option for the select variable type, should only be provided if the variable type is "select", will be ignored otherwhise
  multiple: z.boolean().optional(), // Whether the user can select multiple options
});

export const VariableSchema = z.discriminatedUnion("type", [
  stringVariableSchema,
  numberVariableSchema,
  booleanVariableSchema,
  selectVariableSchema,
]);

/*
export const VariableSchema = z.object({
  name: z.string(), // The name of the variable by which it can be referenced later in the template
  type: VariableTypeSchema, // The type of the variable, used to determine how to prompt the user for input (e.g., "string", "number", "boolean", "select", etc.)
  message: z.string(), // The message to display when prompting the user for input for this variable
  default: z.string().optional(), // An optional default value for the variable
  required: z.boolean(), // Whether the user must provide a value when prompted
  options: z.array(JsonValueSchema).optional(), // An array of option for the select variable type, should only be provided if the variable type is "select", will be ignored otherwhise
});
*/

// A Step to execute shell commands
export const RunStepSchema = z.object({
  // Common properties for all step types
  type: z.literal("run"), // Defines what kind of step it is
  when: z.array(StepConditionSchema).optional(), // An optional condition that determines whether this step should be executed, if not provided the step will always be executed

  // Unique properties for the "run" step type
  command: z.string(), // The command to run
  cwd: z.string().optional(), // The directory to run the command in relative to the project root, if not provided it will run in the root of the project
});

// A Step to write files to the file system. Will create the file if it doesn't exist and overwrite it if it does exist
export const WriteStepSchema = z.object({
  // Common properties for all step types
  type: z.literal("write"), // Defines what kind of step it is
  when: z.array(StepConditionSchema).optional(), // An optional condition that determines whether this step should be executed, if not provided the step will always be executed

  // Unique properties for the "write" step type
  path: z.string(), // The path to the file to write, relative to the project root
  content: z.string().optional(), // The content to write to the file
  url: z.string().optional(), // An optional url to fetch the content from, if provided it will ignore the content field and use the fetched content for the file instead,can be used to copy a file from github for example
});

// A Step to edit text in a file
export const PatchTextStepSchema = z.object({
  // Common properties for all step types
  type: z.literal("patch-text"), // Defines what kind of step it is
  when: z.array(StepConditionSchema).optional(), // An optional condition that determines whether this step should be executed, if not provided the step will always be executed

  // Unique properties for the "patch-text" step type
  path: z.string(), // The path to the file to patch, relative to the project root
  operation: z.enum([
    "replace",
    "insert-after",
    "insert-before",
    "append",
    "prepend",
  ]), // The operation to perform on the file. Replace can be used to delete the part as well
  find: z.string().optional(), // The text to find in the file to determine where to apply the patch. The operation will be applied to all instances of the found text in the file
  // find is not used for append and prepend, since they are relative to the whole file, not to a specific part of it

  // Either use content or url, not both
  content: z.string().optional(), // The content to use for the patch, use empty string and replace to remove the found text
  url: z.string().optional(), // An optional url to fetch the content from, if provided it will ignore the content field and use the fetched content for the patch instead,can be used to copy a file from github for example
});

// A Step to edit JSON files (usefull for config files)
export const PatchJsonStepSchema = z.object({
  // Common properties for all step types
  type: z.literal("patch-json"), // Defines what kind of step it is
  when: z.array(StepConditionSchema).optional(), // An optional condition that determines whether this step should be executed, if not provided the step will always be executed

  // Unique properties for the "patch-json" step type
  path: z.string(), // The path to the JSON file to patch, relative to the project root
  operation: z.enum(["set", "append", "remove"]), // The operation to perform on the JSON file.
  // set: set the value the the defined path, removing anything that was there before, will create the path if it doesn't exist.
  // append: only works if the value at the defined path is an array or object, will append the provided value to the array, will create the array if it doesn't exist.
  // remove: will remove the value at the defined path
  jsonPath: z.array(z.string()), // The path to the value relative to the root of the json file as an array (e.g., compilerOptions.paths -> ["compilerOptions", "paths"])
  value: JsonValueSchema.optional(), // The value to use for the patch, required for "set" and "append" operations, will be ignored for "remove" operation
});

export const StepSchema = z.discriminatedUnion("type", [
  RunStepSchema,
  WriteStepSchema,
  PatchTextStepSchema,
  PatchJsonStepSchema,
]);

export const TemplateSchema = z.object({
  id: z.string(), // Used to identify the template when running the command (projgen create <template-id>)
  name: z.string(), // Display name, should be a human-friendly version of the id
  description: z.string(), // A short description of the template
  version: z.string(), // The version of the template, should follow semantic versioning (e.g., "1.0.0")
  author: z.string(), // The author of the template
  variables: z.array(VariableSchema), // Defines the variables that can be used in the template and are prompted for when running the create command
  steps: z.array(StepSchema), // Defines the steps to execute to scaffold the project with the template
});

export type Template = z.infer<typeof TemplateSchema>;

export type Variable = z.infer<typeof VariableSchema>;
export type StringVariable = z.infer<typeof stringVariableSchema>;
export type NumberVariable = z.infer<typeof numberVariableSchema>;
export type BooleanVariable = z.infer<typeof booleanVariableSchema>;
export type SelectVariable = z.infer<typeof selectVariableSchema>;

export type Step = z.infer<typeof StepSchema>;
export type StepCondition = z.infer<typeof StepConditionSchema>;
export type RunStep = z.infer<typeof RunStepSchema>;
export type WriteStep = z.infer<typeof WriteStepSchema>;
export type PatchTextStep = z.infer<typeof PatchTextStepSchema>;
export type PatchJsonStep = z.infer<typeof PatchJsonStepSchema>;

export type JsonValue = z.infer<typeof JsonValueSchema>;
