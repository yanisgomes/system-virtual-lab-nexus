import { supabase } from "@/integrations/supabase/client";
import { Json, TablesInsert } from "@/integrations/supabase/types";
import { SystemDef, validateSystemDef } from "@/lib/system-schema";

export interface CreateExerciseInput {
  title: string;
  description: string;
  diff: "1" | "2" | "3" | "4";
  system: SystemDef;
  layout?: Record<string, { x: number; y: number }>; // editor-only, not sent to headset
}

export async function createExercise(input: CreateExerciseInput) {
  const validation = validateSystemDef(input.system);
  if (!validation.ok) {
    throw new Error(
      `Validation échouée: ${validation.issues.map((i) => `${i.path || ''} ${i.message}`).join("; ")}`
    );
  }

  const payload: TablesInsert<"exercises"> = {
    title: input.title,
    description: input.description,
    diff: input.diff,
    system_json: input.system as unknown as Json,
    layout_json: (input.layout ?? null) as unknown as Json,
  };

  const { data, error } = await supabase
    .from("exercises")
    .insert(payload)
    .select("id")
    .single();

  if (error) {
    throw new Error(`Failed to create exercise: ${error.message}`);
  }

  return data?.id as string;
}

export async function assignExerciseToStudents(exerciseId: string, studentIds: string[]) {
  if (!studentIds.length) return { inserted: 0 };
  const rows: TablesInsert<"student_exercises">[] = studentIds.map((sid) => ({
    student_id: sid,
    exercise_id: exerciseId,
    status: "assigned",
  }));

  const { error } = await supabase.from("student_exercises").insert(rows);
  if (error) {
    throw new Error(`Failed to assign exercise: ${error.message}`);
  }

  return { inserted: rows.length };
}

// Enqueue dispatch for a set of students. A bridge service should pick pending rows and send UDP.
export async function enqueueExerciseDispatch(exerciseId: string, studentIds: string[]) {
  if (!studentIds.length) return { enqueued: 0 };
  const rows: TablesInsert<"exercise_dispatch_queue">[] = studentIds.map((sid) => ({
    exercise_id: exerciseId,
    student_id: sid,
    status: "pending",
  }));

  const { error } = await supabase.from("exercise_dispatch_queue").insert(rows);
  if (error) {
    throw new Error(`Failed to enqueue dispatch: ${error.message}`);
  }

  return { enqueued: rows.length };
}

// Helper to save, assign, and enqueue in one go
export async function createAssignAndEnqueue(input: CreateExerciseInput, studentIds: string[]) {
  const exerciseId = await createExercise(input);
  await assignExerciseToStudents(exerciseId, studentIds);
  await enqueueExerciseDispatch(exerciseId, studentIds);
  return exerciseId;
}

export async function getExerciseById(exerciseId: string) {
  const { data, error } = await supabase
    .from("exercises")
    .select("id, title, description, diff, system_json, layout_json")
    .eq("id", exerciseId)
    .single();
  if (error) throw new Error(error.message);
  return data;
}

export async function updateExercise(
  exerciseId: string,
  update: { title: string; description: string; diff: "1" | "2" | "3" | "4"; system: CreateExerciseInput["system"]; layout?: Record<string, { x: number; y: number }> }
) {
  const { system, layout, title, description, diff } = update;
  const validation = validateSystemDef(system);
  if (!validation.ok) {
    throw new Error(
      `Validation échouée: ${validation.issues.map((i) => `${i.path || ''} ${i.message}`).join("; ")}`
    );
  }
  const { error } = await supabase
    .from("exercises")
    .update({
      title,
      description,
      diff,
      system_json: system as unknown as Json,
      layout_json: (layout ?? null) as unknown as Json,
    })
    .eq("id", exerciseId);
  if (error) throw new Error(error.message);
  return true;
}

export interface ExerciseSummary {
  id: string;
  title: string;
  description: string;
  diff: string;
  created_at: string;
}

export async function listExercises(limit: number = 20): Promise<ExerciseSummary[]> {
  const { data, error } = await supabase
    .from("exercises")
    .select("id, title, description, diff, created_at")
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw new Error(error.message);
  return (data || []) as ExerciseSummary[];
}

