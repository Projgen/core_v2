import { describe, expect, test, vi } from "vitest";
import runStep from "../../../core/steps/runStep.ts";
import type { RunStep } from "../../../types/template.ts";
import type { Variable } from "../../../types/variable.ts";

describe("runStep", () => {
  test("calls custom executer with replaced command and cwd", async () => {
    const step: RunStep = {
      type: "run",
      command: "echo {{name}}",
      cwd: "./project",
    };
    const variables: Variable[] = [{ name: "name", content: "Alice" }];

    const executer = vi.fn(
      (
        _arg: string,
        _options: { cwd: string | undefined },
        callback: (error: Error | null, stdout: string, stderr: string) => void,
      ) => {
        callback(null, "ok", "");
      },
    );

    await runStep(step, variables, executer);

    expect(executer).toHaveBeenCalledTimes(1);
    expect(executer).toHaveBeenCalledWith(
      "echo Alice",
      { cwd: "./project" },
      expect.any(Function),
    );
  });

  test("does not call custom executer when a condition fails", async () => {
    const step: RunStep = {
      type: "run",
      command: "echo should-not-run",
      when: [{ variable: "enabled", operator: "eq", value: true }],
    };
    const variables: Variable[] = [{ name: "enabled", content: false }];

    const executer = vi.fn();

    await runStep(step, variables, executer);

    expect(executer).not.toHaveBeenCalled();
  });

  test("calls custom executer when all conditions pass", async () => {
    const step: RunStep = {
      type: "run",
      command: "echo run",
      when: [
        { variable: "enabled", operator: "eq", value: true },
        { variable: "count", operator: "gt", value: 1 },
      ],
    };
    const variables: Variable[] = [
      { name: "enabled", content: true },
      { name: "count", content: 2 },
    ];

    const executer = vi.fn(
      (
        _arg: string,
        _options: { cwd: string | undefined },
        callback: (error: Error | null, stdout: string, stderr: string) => void,
      ) => {
        callback(null, "ran", "");
      },
    );

    await runStep(step, variables, executer);

    expect(executer).toHaveBeenCalledTimes(1);
    expect(executer).toHaveBeenCalledWith(
      "echo run",
      { cwd: undefined },
      expect.any(Function),
    );
  });
});
