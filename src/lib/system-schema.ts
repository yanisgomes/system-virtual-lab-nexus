import { z } from "zod";

export const PortDefSchema = z.object({
  type: z.enum(["E", "I", "M"], {
    required_error: "Le type de port est requis (E/I/M)",
  }),
  dir: z.enum(["in", "out"], {
    required_error: "La direction du port est requise (in/out)",
  }),
  pos: z.enum(["L", "R", "T", "B"], {
    required_error: "La position du port est requise (L/R/T/B)",
  }),
  target: z.string().min(1, "La cible du port est requise"),
});

export type PortDef = z.infer<typeof PortDefSchema>;

export const BlockDefSchema = z.object({
  id: z.string().min(1, "L'identifiant du bloc est requis"),
  title: z.string().min(1, "Le titre du bloc est requis"),
  desc: z.string().min(1, "La description du bloc est requise"),
  out_ports: z.array(PortDefSchema),
});

export type BlockDef = z.infer<typeof BlockDefSchema>;

export const SystemDefSchema = z.object({
  title: z.string().min(1, "Le titre est requis"),
  desc: z.string().min(1, "La description est requise"),
  // Unity samples use string difficulty. Accept 1-4 to future-proof.
  diff: z.enum(["1", "2", "3", "4"], {
    required_error: "La difficulté doit être 1, 2, 3 ou 4",
  }),
  blocks: z.array(BlockDefSchema).min(1, "Au moins un bloc est requis"),
});

export type SystemDef = z.infer<typeof SystemDefSchema>;

export interface ValidationIssue {
  path?: string;
  message: string;
}

export interface ValidationResult {
  ok: boolean;
  issues: ValidationIssue[];
  parsed?: SystemDef;
}

// Validate against schema and enforce cross-references: every port.target must match an existing block id
export function validateSystemDef(input: unknown): ValidationResult {
  const result = SystemDefSchema.safeParse(input);
  if (!result.success) {
    const issues: ValidationIssue[] = result.error.issues.map((i) => ({
      path: i.path.join("."),
      message: i.message,
    }));
    return { ok: false, issues };
  }

  const system = result.data;
  const issues: ValidationIssue[] = [];

  const blockIds = new Set(system.blocks.map((b) => b.id));
  system.blocks.forEach((block, bIdx) => {
    block.out_ports.forEach((port, pIdx) => {
      if (!blockIds.has(port.target)) {
        issues.push({
          path: `blocks[${bIdx}].out_ports[${pIdx}].target`,
          message: `Cible inconnue: ${port.target}`,
        });
      }
    });
  });

  return { ok: issues.length === 0, issues, parsed: system };
}

// Utility to compute simple stats (e.g., required links) that UI may display
export function computeSystemStats(system: SystemDef) {
  const requiredLinks = system.blocks.reduce((sum, b) => sum + (b.out_ports?.length || 0), 0);
  return { requiredLinks };
}

