import { describe, expect, test, vi } from "vitest";
import type { WriteStep } from "../../../types/template.ts";
import type { Variable } from "../../../types/variable.ts";

const { writeFileMock } = vi.hoisted(() => ({
  writeFileMock: vi.fn(
    (
      _path: string,
      _content: string,
      callback: (err: NodeJS.ErrnoException | null) => void,
    ) => {
      callback(null);
    },
  ),
}));

vi.mock("node:fs", () => ({
  writeFile: writeFileMock,
}));

import writeStep from "../../../core/steps/writeStep.ts";

describe("writeStep", () => {
  test("does not write when a condition fails", async () => {
    const step: WriteStep = {
      type: "write",
      path: "output.txt",
      content: "should not be written",
      when: [{ variable: "enabled", operator: "eq", value: true }],
    };
    const variables: Variable[] = [{ name: "enabled", content: false }];

    await writeStep(step, variables);

    expect(writeFileMock).not.toHaveBeenCalled();
  });

  test("writes replaced path and content when conditions pass", async () => {
    const step: WriteStep = {
      type: "write",
      path: "output/{{name}}.txt",
      content: "Hello {{name}}",
    };
    const variables: Variable[] = [{ name: "name", content: "Alice" }];

    await writeStep(step, variables);

    expect(writeFileMock).toHaveBeenCalledTimes(1);
    expect(writeFileMock).toHaveBeenCalledWith(
      "output/Alice.txt",
      "Hello Alice",
      expect.any(Function),
    );
  });
});
