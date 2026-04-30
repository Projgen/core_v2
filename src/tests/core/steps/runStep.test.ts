import { EventEmitter } from "node:events";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";

const { spawnMock } = vi.hoisted(() => ({
  spawnMock: vi.fn(),
}));

vi.mock("node:child_process", () => ({
  spawn: spawnMock,
}));

import runStep from "../../../core/steps/runStep.ts";
import type { RunStep } from "../../../types/template.ts";
import type { Variable } from "../../../types/variable.ts";

describe("runStep", () => {
  const stdoutWriteSpy = vi
    .spyOn(process.stdout, "write")
    .mockImplementation(() => true);
  const stderrWriteSpy = vi
    .spyOn(process.stderr, "write")
    .mockImplementation(() => true);

  beforeEach(() => {
    spawnMock.mockReset();
    stdoutWriteSpy.mockClear();
    stderrWriteSpy.mockClear();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  test("runs the command with replaced variables and cwd", async () => {
    const step: RunStep = {
      type: "run",
      command: "echo {{name}}",
      cwd: "./project",
    };
    const variables: Variable[] = [{ name: "name", content: "Alice" }];

    const childProcess = new EventEmitter() as EventEmitter & {
      stdout: EventEmitter;
      stderr: EventEmitter;
    };
    childProcess.stdout = new EventEmitter();
    childProcess.stderr = new EventEmitter();

    spawnMock.mockReturnValue(childProcess);

    const runPromise = runStep(step, variables);

    childProcess.stdout.emit("data", "ok");
    childProcess.emit("close", 0);

    await runPromise;

    expect(spawnMock).toHaveBeenCalledTimes(1);
    expect(spawnMock).toHaveBeenCalledWith("echo Alice", {
      cwd: "./project",
      shell: true,
    });
    expect(stdoutWriteSpy).toHaveBeenCalledWith("ok");
  });

  test("does not start the process when a condition fails", async () => {
    const step: RunStep = {
      type: "run",
      command: "echo should-not-run",
      when: [{ variable: "enabled", operator: "eq", value: true }],
    };
    const variables: Variable[] = [{ name: "enabled", content: false }];

    await runStep(step, variables);

    expect(spawnMock).not.toHaveBeenCalled();
  });

  test("streams output before resolving on close", async () => {
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

    const childProcess = new EventEmitter() as EventEmitter & {
      stdout: EventEmitter;
      stderr: EventEmitter;
    };
    childProcess.stdout = new EventEmitter();
    childProcess.stderr = new EventEmitter();

    spawnMock.mockReturnValue(childProcess);

    const runPromise = runStep(step, variables);

    let settled = false;
    runPromise.then(() => {
      settled = true;
    });

    childProcess.stderr.emit("data", "warning");

    await Promise.resolve();

    expect(settled).toBe(false);
    expect(stderrWriteSpy).toHaveBeenCalledWith("warning");

    childProcess.emit("close", 0);

    await runPromise;

    expect(spawnMock).toHaveBeenCalledTimes(1);
    expect(spawnMock).toHaveBeenCalledWith("echo run", {
      cwd: undefined,
      shell: true,
    });
    expect(settled).toBe(true);
  });
});
