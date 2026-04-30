import { beforeEach, describe, expect, test, vi } from "vitest";
import type { PatchTextStep } from "../../../types/template.ts";
import type { Variable } from "../../../types/variable.ts";

const { readFileMock, writeFileMock } = vi.hoisted(() => ({
  readFileMock: vi.fn(async (_path: string, _encoding: string) => {
    return "Original content";
  }),
  writeFileMock: vi.fn(async (_path: string, _content: string) => {
    return;
  }),
}));

vi.mock("node:fs/promises", () => ({
  readFile: readFileMock,
  writeFile: writeFileMock,
}));

import patchTextStep from "../../../core/steps/patchTextStep.ts";

describe("patchTextStep", () => {
  const fetchMock = vi.fn();
  const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
  const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

  beforeEach(() => {
    vi.clearAllMocks();
    readFileMock.mockResolvedValue("Original content");
    writeFileMock.mockResolvedValue(undefined);
    fetchMock.mockReset();
    fetchMock.mockResolvedValue({
      text: vi.fn().mockResolvedValue("Fetched {{name}} content"),
    });
    vi.stubGlobal("fetch", fetchMock);
  });

  describe("replace operation", () => {
    test("replaces found text with new content", async () => {
      const step: PatchTextStep = {
        type: "patch-text",
        path: "file.txt",
        operation: "replace",
        find: "Original",
        content: "Modified",
      };
      const variables: Variable[] = [];

      await patchTextStep(step, variables);

      expect(readFileMock).toHaveBeenCalledWith("file.txt", "utf8");
      expect(writeFileMock).toHaveBeenCalledWith(
        "file.txt",
        "Modified content",
        "utf8",
      );
    });

    test("replaces all instances of found text", async () => {
      readFileMock.mockResolvedValue("foo bar foo baz");
      const step: PatchTextStep = {
        type: "patch-text",
        path: "file.txt",
        operation: "replace",
        find: "foo",
        content: "replaced",
      };
      const variables: Variable[] = [];

      await patchTextStep(step, variables);

      expect(writeFileMock).toHaveBeenCalledWith(
        "file.txt",
        "replaced bar replaced baz",
        "utf8",
      );
    });

    test("warns when find is not provided for replace operation", async () => {
      const step: PatchTextStep = {
        type: "patch-text",
        path: "file.txt",
        operation: "replace",
        content: "Modified",
      };
      const variables: Variable[] = [];

      await patchTextStep(step, variables);

      expect(warnSpy).toHaveBeenCalledWith(
        expect.stringContaining(
          'The "find" property is required for the "replace" operation',
        ),
      );
      expect(writeFileMock).toHaveBeenCalledWith(
        "file.txt",
        "Original content",
        "utf8",
      );
    });
  });

  describe("insert-after operation", () => {
    test("inserts content after found text", async () => {
      readFileMock.mockResolvedValue("line 1\nline 2\nline 3");
      const step: PatchTextStep = {
        type: "patch-text",
        path: "file.txt",
        operation: "insert-after",
        find: "line 2",
        content: "inserted line",
      };
      const variables: Variable[] = [];

      await patchTextStep(step, variables);

      expect(writeFileMock).toHaveBeenCalledWith(
        "file.txt",
        "line 1\nline 2inserted line\nline 3",
        "utf8",
      );
    });

    test("inserts after all instances of found text", async () => {
      readFileMock.mockResolvedValue("foo bar foo baz");
      const step: PatchTextStep = {
        type: "patch-text",
        path: "file.txt",
        operation: "insert-after",
        find: "foo",
        content: " inserted",
      };
      const variables: Variable[] = [];

      await patchTextStep(step, variables);

      expect(writeFileMock).toHaveBeenCalledWith(
        "file.txt",
        "foo inserted bar foo inserted baz",
        "utf8",
      );
    });

    test("warns when find is not provided for insert-after operation", async () => {
      const step: PatchTextStep = {
        type: "patch-text",
        path: "file.txt",
        operation: "insert-after",
        content: "inserted",
      };
      const variables: Variable[] = [];

      await patchTextStep(step, variables);

      expect(warnSpy).toHaveBeenCalledWith(
        expect.stringContaining(
          'The "find" property is required for the "insert-after" operation',
        ),
      );
      expect(writeFileMock).toHaveBeenCalledWith(
        "file.txt",
        "Original content",
        "utf8",
      );
    });
  });

  describe("insert-before operation", () => {
    test("inserts content before found text", async () => {
      readFileMock.mockResolvedValue("line 1\nline 2\nline 3");
      const step: PatchTextStep = {
        type: "patch-text",
        path: "file.txt",
        operation: "insert-before",
        find: "line 2",
        content: "inserted line\n",
      };
      const variables: Variable[] = [];

      await patchTextStep(step, variables);

      expect(writeFileMock).toHaveBeenCalledWith(
        "file.txt",
        "line 1\ninserted line\nline 2\nline 3",
        "utf8",
      );
    });

    test("inserts before all instances of found text", async () => {
      readFileMock.mockResolvedValue("foo bar foo baz");
      const step: PatchTextStep = {
        type: "patch-text",
        path: "file.txt",
        operation: "insert-before",
        find: "foo",
        content: "[",
      };
      const variables: Variable[] = [];

      await patchTextStep(step, variables);

      expect(writeFileMock).toHaveBeenCalledWith(
        "file.txt",
        "[foo bar [foo baz",
        "utf8",
      );
    });

    test("warns when find is not provided for insert-before operation", async () => {
      const step: PatchTextStep = {
        type: "patch-text",
        path: "file.txt",
        operation: "insert-before",
        content: "inserted",
      };
      const variables: Variable[] = [];

      await patchTextStep(step, variables);

      expect(warnSpy).toHaveBeenCalledWith(
        expect.stringContaining(
          'The "find" property is required for the "insert-before" operation',
        ),
      );
      expect(writeFileMock).toHaveBeenCalledWith(
        "file.txt",
        "Original content",
        "utf8",
      );
    });
  });

  describe("append operation", () => {
    test("appends content to end of file", async () => {
      readFileMock.mockResolvedValue("Original content");
      const step: PatchTextStep = {
        type: "patch-text",
        path: "file.txt",
        operation: "append",
        content: "\nAppended line",
      };
      const variables: Variable[] = [];

      await patchTextStep(step, variables);

      expect(writeFileMock).toHaveBeenCalledWith(
        "file.txt",
        "Original content\nAppended line",
        "utf8",
      );
    });

    test("appends without requiring find", async () => {
      const step: PatchTextStep = {
        type: "patch-text",
        path: "file.txt",
        operation: "append",
        content: "appended",
      };
      const variables: Variable[] = [];

      await patchTextStep(step, variables);

      expect(warnSpy).not.toHaveBeenCalled();
      expect(writeFileMock).toHaveBeenCalledWith(
        "file.txt",
        "Original contentappended",
        "utf8",
      );
    });
  });

  describe("prepend operation", () => {
    test("prepends content to beginning of file", async () => {
      readFileMock.mockResolvedValue("Original content");
      const step: PatchTextStep = {
        type: "patch-text",
        path: "file.txt",
        operation: "prepend",
        content: "Prepended line\n",
      };
      const variables: Variable[] = [];

      await patchTextStep(step, variables);

      expect(writeFileMock).toHaveBeenCalledWith(
        "file.txt",
        "Prepended line\nOriginal content",
        "utf8",
      );
    });

    test("prepends without requiring find", async () => {
      const step: PatchTextStep = {
        type: "patch-text",
        path: "file.txt",
        operation: "prepend",
        content: "prepended",
      };
      const variables: Variable[] = [];

      await patchTextStep(step, variables);

      expect(warnSpy).not.toHaveBeenCalled();
      expect(writeFileMock).toHaveBeenCalledWith(
        "file.txt",
        "prependedOriginal content",
        "utf8",
      );
    });
  });

  describe("variable interpolation", () => {
    test("interpolates variables in path", async () => {
      const step: PatchTextStep = {
        type: "patch-text",
        path: "src/{{moduleName}}/file.ts",
        operation: "append",
        content: "added",
      };
      const variables: Variable[] = [{ name: "moduleName", content: "utils" }];

      await patchTextStep(step, variables);

      expect(readFileMock).toHaveBeenCalledWith("src/utils/file.ts", "utf8");
      expect(writeFileMock).toHaveBeenCalledWith(
        "src/utils/file.ts",
        expect.any(String),
        "utf8",
      );
    });

    test("interpolates variables in find text", async () => {
      readFileMock.mockResolvedValue("export const API_KEY = 'old'");
      const step: PatchTextStep = {
        type: "patch-text",
        path: "file.ts",
        operation: "replace",
        find: "{{oldValue}}",
        content: "'new'",
      };
      const variables: Variable[] = [{ name: "oldValue", content: "'old'" }];

      await patchTextStep(step, variables);

      expect(writeFileMock).toHaveBeenCalledWith(
        "file.ts",
        "export const API_KEY = 'new'",
        "utf8",
      );
    });

    test("interpolates variables in content", async () => {
      readFileMock.mockResolvedValue("// TODO");
      const step: PatchTextStep = {
        type: "patch-text",
        path: "file.ts",
        operation: "replace",
        find: "// TODO",
        content: "// Done by {{author}}",
      };
      const variables: Variable[] = [{ name: "author", content: "Alice" }];

      await patchTextStep(step, variables);

      expect(writeFileMock).toHaveBeenCalledWith(
        "file.ts",
        "// Done by Alice",
        "utf8",
      );
    });

    test("interpolates multiple variables", async () => {
      readFileMock.mockResolvedValue("placeholder");
      const step: PatchTextStep = {
        type: "patch-text",
        path: "{{dir}}/{{file}}.ts",
        operation: "replace",
        find: "placeholder",
        content: "{{name}} from {{author}}",
      };
      const variables: Variable[] = [
        { name: "dir", content: "src" },
        { name: "file", content: "index" },
        { name: "name", content: "MyFunction" },
        { name: "author", content: "Bob" },
      ];

      await patchTextStep(step, variables);

      expect(readFileMock).toHaveBeenCalledWith("src/index.ts", "utf8");
      expect(writeFileMock).toHaveBeenCalledWith(
        "src/index.ts",
        "MyFunction from Bob",
        "utf8",
      );
    });
  });

  describe("fetching content from URL", () => {
    test("fetches content from URL when provided", async () => {
      const step: PatchTextStep = {
        type: "patch-text",
        path: "file.ts",
        operation: "append",
        url: "https://example.com/content.ts",
      };
      const variables: Variable[] = [{ name: "name", content: "John" }];

      await patchTextStep(step, variables);

      expect(fetchMock).toHaveBeenCalledWith("https://example.com/content.ts");
      expect(writeFileMock).toHaveBeenCalledWith(
        "file.ts",
        "Original contentFetched John content",
        "utf8",
      );
    });

    test("uses url content over inline content and warns", async () => {
      const step: PatchTextStep = {
        type: "patch-text",
        path: "file.ts",
        operation: "replace",
        find: "Original",
        content: "Inline content",
        url: "https://example.com/content.ts",
      };
      const variables: Variable[] = [{ name: "name", content: "Alice" }];

      await patchTextStep(step, variables);

      expect(warnSpy).toHaveBeenCalledWith(
        expect.stringContaining(
          'Both "url" and "content" are provided for the write step',
        ),
      );
      expect(fetchMock).toHaveBeenCalledTimes(1);
      expect(writeFileMock).toHaveBeenCalledWith(
        "file.ts",
        "Fetched Alice content content",
        "utf8",
      );
    });

    test("interpolates variables in fetched content", async () => {
      fetchMock.mockResolvedValue({
        text: vi
          .fn()
          .mockResolvedValue("export const userName = '{{userName}}';"),
      });
      const step: PatchTextStep = {
        type: "patch-text",
        path: "file.ts",
        operation: "append",
        url: "https://example.com/template.ts",
      };
      const variables: Variable[] = [{ name: "userName", content: "admin" }];

      await patchTextStep(step, variables);

      expect(writeFileMock).toHaveBeenCalledWith(
        "file.ts",
        "Original contentexport const userName = 'admin';",
        "utf8",
      );
    });
  });

  describe("conditions", () => {
    test("does not patch when condition fails", async () => {
      const step: PatchTextStep = {
        type: "patch-text",
        path: "file.ts",
        operation: "append",
        content: "should not be added",
        when: [{ variable: "enabled", operator: "eq", value: true }],
      };
      const variables: Variable[] = [{ name: "enabled", content: false }];

      await patchTextStep(step, variables);

      expect(readFileMock).not.toHaveBeenCalled();
      expect(writeFileMock).not.toHaveBeenCalled();
    });

    test("patches when condition passes", async () => {
      const step: PatchTextStep = {
        type: "patch-text",
        path: "file.ts",
        operation: "append",
        content: "added",
        when: [{ variable: "enabled", operator: "eq", value: true }],
      };
      const variables: Variable[] = [{ name: "enabled", content: true }];

      await patchTextStep(step, variables);

      expect(readFileMock).toHaveBeenCalledWith("file.ts", "utf8");
      expect(writeFileMock).toHaveBeenCalled();
    });

    test("does not patch when any condition in array fails", async () => {
      const step: PatchTextStep = {
        type: "patch-text",
        path: "file.ts",
        operation: "append",
        content: "should not be added",
        when: [
          { variable: "enabled", operator: "eq", value: true },
          { variable: "version", operator: "gte", value: 2 },
        ],
      };
      const variables: Variable[] = [
        { name: "enabled", content: true },
        { name: "version", content: 1 },
      ];

      await patchTextStep(step, variables);

      expect(readFileMock).not.toHaveBeenCalled();
      expect(writeFileMock).not.toHaveBeenCalled();
    });

    test("patches when all conditions pass", async () => {
      const step: PatchTextStep = {
        type: "patch-text",
        path: "file.ts",
        operation: "append",
        content: "added",
        when: [
          { variable: "enabled", operator: "eq", value: true },
          { variable: "version", operator: "gte", value: 2 },
        ],
      };
      const variables: Variable[] = [
        { name: "enabled", content: true },
        { name: "version", content: 2 },
      ];

      await patchTextStep(step, variables);

      expect(readFileMock).toHaveBeenCalled();
      expect(writeFileMock).toHaveBeenCalled();
    });
  });

  describe("invalid operation", () => {
    test("warns on invalid operation and skips patch", async () => {
      const step = {
        type: "patch-text",
        path: "file.ts",
        operation: "invalid-op" as unknown,
        content: "content",
      } as PatchTextStep;
      const variables: Variable[] = [];

      await patchTextStep(step, variables);

      expect(warnSpy).toHaveBeenCalledWith(
        expect.stringContaining(
          'Invalid operation "invalid-op" in the patch-text step',
        ),
      );
      expect(writeFileMock).toHaveBeenCalledWith(
        "file.ts",
        "Original content",
        "utf8",
      );
    });
  });

  describe("edge cases", () => {
    test("handles empty content", async () => {
      const step: PatchTextStep = {
        type: "patch-text",
        path: "file.txt",
        operation: "append",
        content: "",
      };
      const variables: Variable[] = [];

      await patchTextStep(step, variables);

      expect(writeFileMock).toHaveBeenCalledWith(
        "file.txt",
        "Original content",
        "utf8",
      );
    });

    test("handles empty file content", async () => {
      readFileMock.mockResolvedValue("");
      const step: PatchTextStep = {
        type: "patch-text",
        path: "file.txt",
        operation: "prepend",
        content: "first line",
      };
      const variables: Variable[] = [];

      await patchTextStep(step, variables);

      expect(writeFileMock).toHaveBeenCalledWith(
        "file.txt",
        "first line",
        "utf8",
      );
    });

    test("handles special characters in find and replace", async () => {
      readFileMock.mockResolvedValue("test.js with dots");
      const step: PatchTextStep = {
        type: "patch-text",
        path: "file.txt",
        operation: "replace",
        find: "test.js",
        content: "main.ts",
      };
      const variables: Variable[] = [];

      await patchTextStep(step, variables);

      expect(writeFileMock).toHaveBeenCalledWith(
        "file.txt",
        "main.ts with dots",
        "utf8",
      );
    });

    test("handles multiline content", async () => {
      readFileMock.mockResolvedValue("line 1\nline 2\nline 3");
      const step: PatchTextStep = {
        type: "patch-text",
        path: "file.txt",
        operation: "insert-after",
        find: "line 2",
        content: "\nline 2.5\nline 2.6",
      };
      const variables: Variable[] = [];

      await patchTextStep(step, variables);

      expect(writeFileMock).toHaveBeenCalledWith(
        "file.txt",
        "line 1\nline 2\nline 2.5\nline 2.6\nline 3",
        "utf8",
      );
    });

    test("logs operation details", async () => {
      const step: PatchTextStep = {
        type: "patch-text",
        path: "src/file.ts",
        operation: "replace",
        find: "old",
        content: "new",
      };
      const variables: Variable[] = [];

      await patchTextStep(step, variables);

      expect(logSpy).toHaveBeenCalledWith(
        expect.stringContaining(
          "Patching text in file: src/file.ts with operation: replace",
        ),
      );
    });
  });
});
