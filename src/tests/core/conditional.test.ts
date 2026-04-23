import { describe, expect, test } from "vitest";
import { checkCondition } from "../../core/conditional.ts";
import type { StepCondition } from "../../types/template.ts";
import type { Variable } from "../../types/variable.ts";

const testVariables: Variable[] = [
  { name: "var1", content: "test" },
  { name: "var2", content: 5 },
  { name: "var3", content: [1, 2, 3] },
  { name: "var4", content: null },
  { name: "var5", content: true },
];

describe("checkCondition", () => {
  test("eq returns true when variable content equals condition value", () => {
    const condition: StepCondition = {
      variable: "var1",
      operator: "eq",
      value: "test",
    };
    const result = checkCondition(condition, testVariables);

    expect(result).toBe(true);
  });

  test("eq returns false when variable content does not equal condition value", () => {
    const condition: StepCondition = {
      variable: "var1",
      operator: "eq",
      value: "not-test",
    };
    const result = checkCondition(condition, testVariables);

    expect(result).toBe(false);
  });

  test("neq returns true when variable content does not equal condition value", () => {
    const condition: StepCondition = {
      variable: "var1",
      operator: "neq",
      value: "other",
    };
    const result = checkCondition(condition, testVariables);

    expect(result).toBe(true);
  });

  test("neq returns false when variable content equals condition value", () => {
    const condition: StepCondition = {
      variable: "var1",
      operator: "neq",
      value: "test",
    };
    const result = checkCondition(condition, testVariables);

    expect(result).toBe(false);
  });

  test("gt returns true when variable content is greater than condition value", () => {
    const condition: StepCondition = {
      variable: "var2",
      operator: "gt",
      value: 4,
    };
    const result = checkCondition(condition, testVariables);

    expect(result).toBe(true);
  });

  test("gt returns false when variable content is not greater than condition value", () => {
    const condition: StepCondition = {
      variable: "var2",
      operator: "gt",
      value: 5,
    };
    const result = checkCondition(condition, testVariables);

    expect(result).toBe(false);
  });

  test("lt returns true when variable content is less than condition value", () => {
    const condition: StepCondition = {
      variable: "var2",
      operator: "lt",
      value: 10,
    };
    const result = checkCondition(condition, testVariables);

    expect(result).toBe(true);
  });

  test("lt returns false when variable content is not less than condition value", () => {
    const condition: StepCondition = {
      variable: "var2",
      operator: "lt",
      value: 5,
    };
    const result = checkCondition(condition, testVariables);

    expect(result).toBe(false);
  });

  test("gte returns true when variable content equals condition value", () => {
    const condition: StepCondition = {
      variable: "var2",
      operator: "gte",
      value: 5,
    };
    const result = checkCondition(condition, testVariables);

    expect(result).toBe(true);
  });

  test("gte returns false when variable content is less than condition value", () => {
    const condition: StepCondition = {
      variable: "var2",
      operator: "gte",
      value: 8,
    };
    const result = checkCondition(condition, testVariables);

    expect(result).toBe(false);
  });

  test("lte returns true when variable content equals condition value", () => {
    const condition: StepCondition = {
      variable: "var2",
      operator: "lte",
      value: 5,
    };
    const result = checkCondition(condition, testVariables);

    expect(result).toBe(true);
  });

  test("lte returns false when variable content is greater than condition value", () => {
    const condition: StepCondition = {
      variable: "var2",
      operator: "lte",
      value: 1,
    };
    const result = checkCondition(condition, testVariables);

    expect(result).toBe(false);
  });

  test("contains returns false when array does not contain condition value", () => {
    const condition: StepCondition = {
      variable: "var3",
      operator: "contains",
      value: 99,
    };
    const result = checkCondition(condition, testVariables);

    expect(result).toBe(false);
  });

  test("contains returns true when array contains condition value", () => {
    const condition: StepCondition = {
      variable: "var3",
      operator: "contains",
      value: 2,
    };
    const result = checkCondition(condition, testVariables);

    expect(result).toBe(true);
  });

  test("notContains returns true when array does not contain condition value", () => {
    const condition = {
      variable: "var3",
      operator: "notContains",
      value: 99,
    } as unknown as StepCondition;
    const result = checkCondition(condition, testVariables);

    expect(result).toBe(true);
  });

  test("notContains returns false when array contains condition value", () => {
    const condition: StepCondition = {
      variable: "var3",
      operator: "notContains",
      value: 2,
    };
    const result = checkCondition(condition, testVariables);

    expect(result).toBe(false);
  });

  test("isNull returns true when variable content is null", () => {
    const condition: StepCondition = {
      variable: "var4",
      operator: "isNull",
      value: null,
    };
    const result = checkCondition(condition, testVariables);

    expect(result).toBe(true);
  });

  test("isNull returns false when variable content is not null", () => {
    const condition: StepCondition = {
      variable: "var1",
      operator: "isNull",
      value: null,
    };
    const result = checkCondition(condition, testVariables);

    expect(result).toBe(false);
  });

  test("isNotNull returns true when variable content is not null", () => {
    const condition: StepCondition = {
      variable: "var1",
      operator: "isNotNull",
      value: null,
    };
    const result = checkCondition(condition, testVariables);

    expect(result).toBe(true);
  });

  test("isNotNull returns false when variable content is null", () => {
    const condition: StepCondition = {
      variable: "var4",
      operator: "isNotNull",
      value: null,
    };
    const result = checkCondition(condition, testVariables);

    expect(result).toBe(false);
  });

  test("matches returns true when variable content matches the regex", () => {
    const condition: StepCondition = {
      variable: "var1",
      operator: "matches",
      value: "^te.*$",
    };
    const result = checkCondition(condition, testVariables);

    expect(result).toBe(true);
  });

  test("matches returns false when variable content does not match the regex", () => {
    const condition: StepCondition = {
      variable: "var1",
      operator: "matches",
      value: "^foo$",
    };
    const result = checkCondition(condition, testVariables);

    expect(result).toBe(false);
  });

  test("throws when matches is used with a non-string variable", () => {
    const condition: StepCondition = {
      variable: "var2",
      operator: "matches",
      value: "^5$",
    };

    expect(() => checkCondition(condition, testVariables)).toThrow(
      'Operator "matches" can only be used with string variables',
    );
  });

  test("throws when variable does not exist", () => {
    const condition: StepCondition = {
      variable: "unknown",
      operator: "eq",
      value: "test",
    };

    expect(() => checkCondition(condition, testVariables)).toThrow(
      'Variable "unknown" not found for condition check',
    );
  });

  test("throws for number operators when variable content is not a number", () => {
    const condition: StepCondition = {
      variable: "var1",
      operator: "gt",
      value: 1,
    };

    expect(() => checkCondition(condition, testVariables)).toThrow(
      'Operator "lt" can only be used with number variables and values',
    );
  });

  test("throws for number operators when condition value is not a number", () => {
    const condition = {
      variable: "var2",
      operator: "gte",
      value: "5",
    } as unknown as StepCondition;

    expect(() => checkCondition(condition, testVariables)).toThrow(
      'Operator "lt" can only be used with number variables and values',
    );
  });

  test("throws for number operators when variable content is NaN", () => {
    const variablesWithNaN: Variable[] = [{ name: "nanVar", content: NaN }];
    const condition: StepCondition = {
      variable: "nanVar",
      operator: "lt",
      value: 10,
    };

    expect(() => checkCondition(condition, variablesWithNaN)).toThrow(
      'Operator "lt" can only be used with number variables and values',
    );
  });

  test("throws for array operators when variable content is not an array", () => {
    const condition = {
      variable: "var2",
      operator: "contains",
      value: 2,
    } as unknown as StepCondition;

    expect(() => checkCondition(condition, testVariables)).toThrow(
      'Operator "contains" can only be used with array variables',
    );
  });

  test("throws for unsupported operator", () => {
    const condition = {
      variable: "var1",
      operator: "invalidOperator",
      value: "test",
    } as unknown as StepCondition;

    expect(() => checkCondition(condition, testVariables)).toThrow(
      'Unsupported operator "invalidOperator" in condition',
    );
  });
});
