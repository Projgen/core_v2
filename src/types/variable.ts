export interface Variable {
  name: string; // The name of the variable by which it can be referenced later in the template
  content: string | number | boolean | string[] | number[]; // The value of the variable
}
