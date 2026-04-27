import { beforeEach, describe, expect, test, vi } from "vitest";
import type { WriteStep } from "../../../types/template.ts";
import type { Variable } from "../../../types/variable.ts";

const { mkdirMock, writeFileMock } = vi.hoisted(() => ({
  mkdirMock: vi.fn(async (_path: string, _options: { recursive: boolean }) => {
    return;
  }),
  writeFileMock: vi.fn(async (_path: string, _content: string) => {
    return;
  }),
}));

vi.mock("node:fs/promises", () => ({
  mkdir: mkdirMock,
  writeFile: writeFileMock,
}));

import writeStep from "../../../core/steps/writeStep.ts";

describe("writeStep", () => {
  const fetchMock = vi.fn();
  const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

  beforeEach(() => {
    vi.clearAllMocks();
    mkdirMock.mockResolvedValue(undefined);
    writeFileMock.mockResolvedValue(undefined);
    fetchMock.mockReset();
    fetchMock.mockResolvedValue({
      text: vi.fn().mockResolvedValue("Downloaded {{name}}"),
    });
    vi.stubGlobal("fetch", fetchMock);
  });

  test("creates parent folder before writing", async () => {
    const step: WriteStep = {
      type: "write",
      path: "output/nested/{{name}}.txt",
      content: "ignored content",
    };
    const variables: Variable[] = [{ name: "name", content: "Alice" }];

    await writeStep(step, variables);

    expect(mkdirMock).toHaveBeenCalledTimes(1);
    expect(mkdirMock).toHaveBeenCalledWith("output/nested", {
      recursive: true,
    });
  });

  test("interpolates variables and writes the resolved file path and content", async () => {
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
    );
  });

  test("does not write when a condition fails", async () => {
    const step: WriteStep = {
      type: "write",
      path: "output.txt",
      content: "should not be written",
      when: [{ variable: "enabled", operator: "eq", value: true }],
    };
    const variables: Variable[] = [{ name: "enabled", content: false }];

    await writeStep(step, variables);

    expect(mkdirMock).not.toHaveBeenCalled();
    expect(writeFileMock).not.toHaveBeenCalled();
  });

  test("does not write when creating parent folder fails", async () => {
    mkdirMock.mockRejectedValueOnce(new Error("mkdir failed"));

    const step: WriteStep = {
      type: "write",
      path: "output/{{name}}.txt",
      content: "Hello {{name}}",
    };
    const variables: Variable[] = [{ name: "name", content: "Alice" }];

    await writeStep(step, variables);

    expect(mkdirMock).toHaveBeenCalledTimes(1);
    expect(mkdirMock).toHaveBeenCalledWith("output", { recursive: true });
    expect(writeFileMock).not.toHaveBeenCalled();
  });

  test("writes fetched content when url is provided", async () => {
    const step: WriteStep = {
      type: "write",
      path: "output/{{name}}.txt",
      url: "https://example.com/template.txt",
    };
    const variables: Variable[] = [{ name: "name", content: "Alice" }];

    await writeStep(step, variables);

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledWith("https://example.com/template.txt");
    expect(writeFileMock).toHaveBeenCalledTimes(1);
    expect(writeFileMock).toHaveBeenCalledWith(
      "output/Alice.txt",
      "Downloaded Alice",
    );
  });

  test("uses url content over inline content and warns", async () => {
    const step: WriteStep = {
      type: "write",
      path: "output/{{name}}.txt",
      content: "Inline {{name}}",
      url: "https://example.com/template.txt",
    };
    const variables: Variable[] = [{ name: "name", content: "Alice" }];

    await writeStep(step, variables);

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(warnSpy).toHaveBeenCalledTimes(1);
    expect(writeFileMock).toHaveBeenCalledWith(
      "output/Alice.txt",
      "Downloaded Alice",
    );
  });
});
