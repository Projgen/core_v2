import z from "zod";

export const registryEntrySchema = z.object({
  alias: z // The alias to refere to the template by when using the CLI
    .string()
    .min(1) // The alias has to be at least 1 character long
    .regex(/^[a-zA-Z0-9-_]+$/), // The alias can only contain letters, numbers, - and _
  path: z.string().min(1), // The path to the template file
});

export const registrySchema = z
  .object({
    version: z.number().int().positive(),
    templates: z.array(registryEntrySchema),
    linkedRegistries: z.array(z.string()).optional(), // The paths / URLs to other registries to link to
  })
  .superRefine((registry, ctx) => {
    const seen = new Set<string>();

    for (const [index, template] of registry.templates.entries()) {
      if (seen.has(template.alias)) {
        ctx.addIssue({
          code: "custom",
          message: `Duplicate alias: ${template.alias}`,
          path: ["templates", index, "alias"],
        });
      }

      seen.add(template.alias);
    }
  });

export type RegistryEntry = z.infer<typeof registryEntrySchema>;
export type Registry = z.infer<typeof registrySchema>;
