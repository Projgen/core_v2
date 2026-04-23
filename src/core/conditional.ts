import type { StepCondition } from "../types/template.ts";
import type { Variable } from "../types/variable.ts";

export const checkCondition = (
  condition: StepCondition,
  variables: Variable[],
): boolean => {
  switch (condition.operator) {
    case "eq": {
      const variable = getVariableValue(condition.variable, variables);
      return variable.content === condition.value;
    }
    case "neq": {
      const variable = getVariableValue(condition.variable, variables);
      return variable.content !== condition.value;
    }
    case "gt": {
      const { condition: _condition, variable } = getNumberVariableValue(
        condition,
        variables,
      );
      return variable.content > _condition.value;
    }
    case "lt": {
      const { condition: _condition, variable } = getNumberVariableValue(
        condition,
        variables,
      );
      return variable.content < _condition.value;
    }
    case "gte": {
      const { condition: _condition, variable } = getNumberVariableValue(
        condition,
        variables,
      );
      return variable.content >= _condition.value;
    }
    case "lte": {
      const { condition: _condition, variable } = getNumberVariableValue(
        condition,
        variables,
      );
      return variable.content <= _condition.value;
    }
    case "contains": {
      const { condition: _condition, variable } = getArrayVariableValue(
        condition,
        variables,
      );
      return variable.content.includes(_condition.value);
    }
    case "notContains": {
      const { condition: _condition, variable } = getArrayVariableValue(
        condition,
        variables,
      );
      return !variable.content.includes(_condition.value);
    }
    case "isNull": {
      const variable = getVariableValue(condition.variable, variables);
      return variable.content === null;
    }
    case "isNotNull": {
      const variable = getVariableValue(condition.variable, variables);
      return variable.content !== null;
    }
    case "matches": {
      const { condition: _condition, variable } = getStringVariableValue(
        condition,
        variables,
      );
      const regex = new RegExp(_condition.value);
      return regex.test(variable.content);
    }
    default:
      throw new Error(
        `Unsupported operator "${condition.operator}" in condition`,
      );
  }
};

const getStringVariableValue = (
  condition: StepCondition,
  variables: Variable[],
) => {
  const variable = getVariableValue(condition.variable, variables);
  if (
    typeof variable.content !== "string" ||
    typeof condition.value !== "string"
  ) {
    throw new Error(
      `Operator "${condition.operator}" can only be used with string variables`,
    );
  }
  return {
    variable: variable as Variable & { content: string },
    condition: condition as StepCondition & { value: string },
  };
};

const getArrayVariableValue = (
  condition: StepCondition,
  variables: Variable[],
) => {
  const variable = getVariableValue(condition.variable, variables);
  if (!Array.isArray(variable.content)) {
    throw new Error(
      `Operator "${condition.operator}" can only be used with array variables`,
    );
  }
  return {
    variable: variable as Variable & { content: unknown[] },
    condition: condition as StepCondition & { value: unknown[] },
  };
};

const getNumberVariableValue = (
  condition: StepCondition,
  variables: Variable[],
) => {
  const variable = getVariableValue(condition.variable, variables);
  if (
    typeof variable.content !== "number" ||
    typeof condition.value !== "number" ||
    isNaN(variable.content) ||
    isNaN(condition.value)
  ) {
    throw new Error(
      `Operator "lt" can only be used with number variables and values`,
    );
  }
  return {
    variable: variable as Variable & { content: number },
    condition: condition as StepCondition & { value: number },
  };
};

const getVariableValue = (variableName: string, variables: Variable[]) => {
  const variable = variables.find((v) => v.name === variableName);
  if (!variable) {
    throw new Error(`Variable "${variableName}" not found for condition check`);
  }
  return variable;
};
