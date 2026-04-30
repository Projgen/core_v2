import { beforeEach, describe, expect, test, vi } from "vitest";
import type { PatchJsonStep } from "../../../types/template.ts";
import type { Variable } from "../../../types/variable.ts";

const { readFileMock, writeFileMock } = vi.hoisted(() => ({
  readFileMock: vi.fn(async (_path: string, _encoding: string) => {
    return "{}";
  }),
  writeFileMock: vi.fn(async (_path: string, _content: string) => {
    return;
  }),
}));

vi.mock("node:fs/promises", () => ({
  readFile: readFileMock,
  writeFile: writeFileMock,
}));

import patchJsonStep from "../../../core/steps/patchJsonStep.ts";

describe("patchJsonStep", () => {
  const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});

  beforeEach(() => {
    vi.clearAllMocks();
    readFileMock.mockResolvedValue("{}");
    writeFileMock.mockResolvedValue(undefined);
  });

  test("set operation sets nested value", async () => {
    readFileMock.mockResolvedValue(JSON.stringify({ a: { b: 1 } }));

    const step: PatchJsonStep = {
      type: "patch-json",
      path: "file.json",
      operation: "set",
      jsonPath: ["a", "b"],
      value: 2,
    };
    const variables: Variable[] = [];

    await patchJsonStep(step, variables);

    expect(writeFileMock).toHaveBeenCalledWith(
      "file.json",
      JSON.stringify({ a: { b: 2 } }, null, 2),
      "utf8",
    );
    expect(logSpy).toHaveBeenCalledWith(
      expect.stringContaining("Patching JSON file"),
    );
  });

  test("append operation appends to array and single value", async () => {
    readFileMock.mockResolvedValue(JSON.stringify({ arr: [1, 2] }));

    const stepArray: PatchJsonStep = {
      type: "patch-json",
      path: "file.json",
      operation: "append",
      jsonPath: ["arr"],
      value: [3],
    };

    await patchJsonStep(stepArray, []);

    expect(writeFileMock).toHaveBeenCalledWith(
      "file.json",
      JSON.stringify({ arr: [1, 2, 3] }, null, 2),
      "utf8",
    );

    // single value
    readFileMock.mockResolvedValue(JSON.stringify({ arr: [1, 2] }));
    const stepSingle: PatchJsonStep = {
      type: "patch-json",
      path: "file.json",
      operation: "append",
      jsonPath: ["arr"],
      value: 3,
    };

    await patchJsonStep(stepSingle, []);

    expect(writeFileMock).toHaveBeenCalledWith(
      "file.json",
      JSON.stringify({ arr: [1, 2, 3] }, null, 2),
      "utf8",
    );
  });

  test("append operation merges objects", async () => {
    readFileMock.mockResolvedValue(JSON.stringify({ obj: { a: 1 } }));

    const step: PatchJsonStep = {
      type: "patch-json",
      path: "file.json",
      operation: "append",
      jsonPath: ["obj"],
      value: { b: 2 },
    };

    await patchJsonStep(step, []);

    expect(writeFileMock).toHaveBeenCalledWith(
      "file.json",
      JSON.stringify({ obj: { a: 1, b: 2 } }, null, 2),
      "utf8",
    );
  });

  test("append operation spreads array into object (current behavior)", async () => {
    readFileMock.mockResolvedValue(JSON.stringify({ obj: { a: 1 } }));

    const step: PatchJsonStep = {
      type: "patch-json",
      path: "file.json",
      operation: "append",
      jsonPath: ["obj"],
      value: [1, 2, 3],
    };

    await patchJsonStep(step, []);

    expect(writeFileMock).toHaveBeenCalledWith(
      "file.json",
      JSON.stringify({ obj: { a: 1, 0: 1, 1: 2, 2: 3 } }, null, 2),
      "utf8",
    );
  });

  test("remove operation deletes key", async () => {
    readFileMock.mockResolvedValue(JSON.stringify({ a: 1, b: 2 }));

    const step: PatchJsonStep = {
      type: "patch-json",
      path: "file.json",
      operation: "remove",
      jsonPath: ["a"],
    };

    await patchJsonStep(step, []);

    expect(writeFileMock).toHaveBeenCalledWith(
      "file.json",
      JSON.stringify({ b: 2 }, null, 2),
      "utf8",
    );
  });

  test("interpolates variables in path and value", async () => {
    readFileMock.mockResolvedValue(JSON.stringify({ settings: { greet: "" } }));

    const step: PatchJsonStep = {
      type: "patch-json",
      path: "config/{{name}}.json",
      operation: "set",
      jsonPath: ["settings", "greet"],
      value: { message: "Hello {{who}}" },
    };

    const variables: Variable[] = [
      { name: "name", content: "app" },
      { name: "who", content: "Bob" },
    ];

    await patchJsonStep(step, variables);

    expect(writeFileMock).toHaveBeenCalledWith(
      "config/app.json",
      JSON.stringify(
        { settings: { greet: { message: "Hello Bob" } } },
        null,
        2,
      ),
      "utf8",
    );
  });

  test("skips when condition fails", async () => {
    const step: PatchJsonStep = {
      type: "patch-json",
      path: "file.json",
      operation: "append",
      jsonPath: ["arr"],
      value: [1],
      when: [{ variable: "enabled", operator: "eq", value: true }],
    };

    const variables: Variable[] = [{ name: "enabled", content: false }];

    await patchJsonStep(step, variables);

    expect(readFileMock).not.toHaveBeenCalled();
    expect(writeFileMock).not.toHaveBeenCalled();
  });

  test("set operation creates missing nested path", async () => {
    readFileMock.mockResolvedValue(JSON.stringify({}));

    const step: PatchJsonStep = {
      type: "patch-json",
      path: "file.json",
      operation: "set",
      jsonPath: ["x", "y", "z"],
      value: 42,
    };

    await patchJsonStep(step, []);

    expect(writeFileMock).toHaveBeenCalledWith(
      "file.json",
      JSON.stringify({ x: { y: { z: 42 } } }, null, 2),
      "utf8",
    );
  });
});
