# Projgen

**Projgen** is a powerful, template-driven CLI tool for scaffolding new projects. Instead of manually setting up boilerplate code every time, you define a JSON template once and let Projgen handle the rest — running commands, writing files, patching configs, and cloning repositories.

## Installation

```bash
npm install -g @projgen/cli
```

Or run directly without installing:

```bash
npx @projgen/cli create ./my-template.json
```

## Usage

```bash
projgen create [templatePath]
```

| Alias | Description            |
| ----- | ---------------------- |
| `c`   | Shorthand for `create` |
| `cr`  | Shorthand for `create` |

**Example:**

```bash
projgen create ./templates/test.json
```

Projgen will validate the template, prompt you for any defined variables, and then execute all steps in order.

## Template Structure

A template is a JSON file that defines variables (user prompts) and steps (actions to scaffold the project).

```json
{
  "id": "my-template",
  "name": "My Template",
  "description": "A short description of what this template creates",
  "version": "1.0.0",
  "author": "Your Name",
  "variables": [...],
  "steps": [...]
}
```

### Variables

Variables are prompted to the user interactively before any steps run. They can be referenced inside step fields using `{{variableName}}` syntax.

| Type      | Description                                        |
| --------- | -------------------------------------------------- |
| `string`  | Free-text input, supports `default` and `required` |
| `number`  | Numeric input, supports `default` and `required`   |
| `boolean` | True/false toggle, supports `default`              |
| `select`  | Single or multi-select from a list of `options`    |

**Example:**

```json
{
  "variables": [
    {
      "name": "projectName",
      "type": "string",
      "message": "What is the name of your project?",
      "required": true
    },
    {
      "name": "framework",
      "type": "select",
      "message": "Which framework would you like to use?",
      "options": ["react", "vue", "svelte"],
      "multiple": false,
      "required": true
    }
  ]
}
```

### Steps

Steps are executed in order after all variables have been collected. Each step supports an optional `when` condition to control whether it runs.

---

#### `run` — Execute a shell command

```json
{
  "type": "run",
  "command": "npm install",
  "cwd": "./my-project"
}
```

| Parameter | Required | Description                                   |
| --------- | -------- | --------------------------------------------- |
| `type`    | Required | Is `run` to define Run step                   |
| `when`    | Optional | Any potential conditionals                    |
| `command` | Required | The command to Run                            |
| `cwd`     | Optional | Path to the directory to run the command from |

---

#### `write` — Write a file

Creates the file if it doesn't exist, overwrites it if it does.

```json
{
  "type": "write",
  "path": "src/index.ts",
  "content": "console.log('Hello, {{projectName}}!');"
}
```

Can also be used with a URL instead of content to simplify writing a bigger file. Is best used with something like (gist)[https://gist.github.com/] for sharing.

```json
{
  "type": "write",
  "path": "src/index.ts",
  "url": "https://gist.githubusercontent.com/LorisRue/ae20c81981af5c3d7aa7f2139b30a89c/raw/ee9ceda05a598c5cd0601d6cd40d86f1c8729686/example"
}
```

| Parameter | Required   | Description                     |
| --------- | ---------- | ------------------------------- |
| `type`    | Required   | Is `write` to define Write step |
| `when`    | Optional   | Any potential conditionals      |
| `path`    | Required   | The Path to the file to write   |
| `content` | Optional\* | The text to write to the file   |
| `url`     | Optional\* | A URL to pull the text from     |

\*Either `content` or `url` have to be set. If both are set, url gets priority.

---

#### `patch-text` — Edit a text file

Modify specific parts of an existing file.

| Operation       | Description                                       |
| --------------- | ------------------------------------------------- |
| `replace`       | Replace matched text (use empty string to delete) |
| `insert-after`  | Insert content after the matched text             |
| `insert-before` | Insert content before the matched text            |
| `append`        | Append content to the end of the file             |
| `prepend`       | Prepend content to the beginning of the file      |

```json
{
  "type": "patch-text",
  "path": "README.md",
  "operation": "append",
  "content": "\n## License\nMIT"
}
```

You can also fetch content from a URL instead of providing it inline:

```json
{
  "type": "patch-text",
  "path": ".eslintrc.json",
  "operation": "replace",
  "find": "{}",
  "url": "https://raw.githubusercontent.com/my-org/configs/main/.eslintrc.json"
}
```

| Parameter   | Required     | Description                                                     |
| ----------- | ------------ | --------------------------------------------------------------- |
| `type`      | Required     | Is `run` to define Run step                                     |
| `when`      | Optional     | Any potential conditionals                                      |
| `path`      | Required     | Path to file to patch                                           |
| `operation` | Required     | The operation to perform (mentioned above)                      |
| `find`      | Optional\*   | A string to search for in the file to perform the operation to. |
| `content`   | Optional\*\* | The text to patch (replace, insert...).                         |
| `url`       | Optional\*\* | The Url to get the text to patch from                           |

\*`find` is required for all operations except for append and prepend, since they are relative to the entire file.
\*\*Either `content` or `url` have to be set. If both are set, url gets priority.

Use `content=""` and `operation="replace"` to remove the text defined in `find`

---

#### `patch-json` — Edit a JSON file

Surgically modify JSON config files using a path array.

| Operation | Description                                                |
| --------- | ---------------------------------------------------------- |
| `set`     | Set a value at a path, creating it if it doesn't exist     |
| `append`  | Append a value to an array or object (key-value) at a path |
| `remove`  | Remove the value at a path                                 |

Example JSON:

```json
{
  "name": "my-app",
  "scripts": {
    "test": "vitest",
    "build": "tsc"
  }
}
```

Template Step Example

```json
{
  "type": "patch-json",
  "path": "package.json",
  "operation": "set",
  "jsonPath": ["scripts", "test"],
  "value": "vitest run"
}
```

To access the `test` property inside that example JSON, use `jsonPath: ["scripts", "test"]`. That points to `package.json.scripts.test`.

| Parameter   | Required   | Description                                          |
| ----------- | ---------- | ---------------------------------------------------- |
| `type`      | Required   | Is `run` to define Run step                          |
| `when`      | Optional   | Any potential conditionals                           |
| `path`      | Required   | Path to json file to patch                           |
| `operation` | Required   | The operation to perform (mentioned above)           |
| `jsonPath`  | Required   | The "json path" to the entry to change (see example) |
| `value`     | Optional\* | The value to insert                                  |

\*`value` is required for set and append, but will be ignored for remove

---

### Conditional Steps

Any step can include a `when` array to conditionally execute based on variable values. The step will only execute if all conditions are met.

```json
{
  "type": "run",
  "command": "npm install tailwindcss",
  "when": [
    {
      "variable": "useTailwind",
      "operator": "eq",
      "value": true
    }
  ]
}
```

| Parameter | Description                                                  |
| --------- | ------------------------------------------------------------ |
| variable  | The name of a variable defined in the variables array        |
| operator  | the operator to use (see below)                              |
| value     | The value to check for (not needed for isNull and isNotNull) |

**Available operators:**

| Operator    | Name                  | Description                                                | Valid Datatypes     |
| ----------- | --------------------- | ---------------------------------------------------------- | ------------------- |
| eq          | Equals                | Checks if variable is equal to value                       | All                 |
| neq         | Not Equals            | Checks if variable is not equal to value                   | All                 |
| gt          | Greater Than          | Checks if variable is greater than value                   | Number              |
| lt          | Less Than             | Checks if variable is less than value                      | Number              |
| gte         | Greater Than or Equal | Checks if variable is greater than or equal to value       | Number              |
| lte         | Less Than or Equal    | Checks if variable is less than or equal to value          | Number              |
| contains    | Contains              | Checks if an array variable contains the value             | Array               |
| notContains | Does Not Contain      | Checks if an array variable does not contain the value     | Array               |
| isNull      | Is Null               | Checks if variable content is null                         | All (value ignored) |
| isNotNull   | Is Not Null           | Checks if variable content is not null                     | All (value ignored) |
| matches     | Matches Regex         | Checks if a string variable matches a regex pattern        | String              |
| notMatches  | Does Not Match Regex  | Checks if a string variable does not match a regex pattern | String              |

## Development

### Prerequisites

- Node.js >= 18
- npm

### Setup

```bash
git clone https://github.com/Projgen/core_v2.git
cd core_v2
npm install
```

### Scripts

| Script           | Description                        |
| ---------------- | ---------------------------------- |
| `npm run dev`    | Start in development mode (watch)  |
| `npm run build`  | Compile TypeScript to `dist/`      |
| `npm start`      | Run the compiled code from `dist/` |
| `npm test`       | Run tests with Vitest              |
| `npm run lint`   | Lint the codebase with ESLint      |
| `npm run format` | Format code with Prettier          |

## License

MIT — see [LICENSE](./LICENSE) for details.
