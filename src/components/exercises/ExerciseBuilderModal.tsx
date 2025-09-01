import { useEffect, useMemo, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, Trash } from "lucide-react";
import { BlockDef, PortDef, SystemDef, computeSystemStats, validateSystemDef } from "@/lib/system-schema";
import { Student } from "@/services/dashboard-data";
import { createAssignAndEnqueue } from "@/services/exercise-service";
import { useToast } from "@/hooks/use-toast";

interface ExerciseBuilderModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  students: Student[];
}

type Step = 0 | 1 | 2 | 3 | 4; // Metadata, Blocks, Ports, Review, Assign

export default function ExerciseBuilderModal({ open, onOpenChange }: ExerciseBuilderModalProps) {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>(0);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [diff, setDiff] = useState<"1" | "2" | "3" | "4">("1");
  const [blocks, setBlocks] = useState<BlockDef[]>([]);
  const [selectedStudents, setSelectedStudents] = useState<Record<string, boolean>>({});
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!open) {
      // Reset when closing
      setStep(0);
      setTitle("");
      setDescription("");
      setDiff("1");
      setBlocks([]);
      setSelectedStudents({});
    }
  }, [open]);

  const system: SystemDef = useMemo(() => ({ title, desc: description, diff, blocks }), [title, description, diff, blocks]);
  const validation = useMemo(() => validateSystemDef(system), [system]);
  const stats = useMemo(() => computeSystemStats(system), [system]);

  const canNext = () => {
    switch (step) {
      case 0:
        return title.trim().length > 0 && description.trim().length > 0;
      case 1:
        return blocks.length > 0 && blocks.every((b) => b.title && b.desc && b.id);
      case 2:
        return true; // cross-validation happens in Review
      case 3:
        return validation.ok;
      case 4:
        return Object.values(selectedStudents).some(Boolean);
      default:
        return false;
    }
  };

  const addBlock = () => {
    const newBlock: BlockDef = { id: crypto.randomUUID(), title: "", desc: "", out_ports: [] };
    setBlocks((prev) => [...prev, newBlock]);
  };

  const removeBlock = (id: string) => {
    setBlocks((prev) => prev.filter((b) => b.id !== id));
  };

  const addPort = (blockId: string) => {
    setBlocks((prev) =>
      prev.map((b) =>
        b.id === blockId
          ? {
              ...b,
              out_ports: [
                ...b.out_ports,
                { type: "E", dir: "out", pos: "R", target: "" } as PortDef,
              ],
            }
          : b
      )
    );
  };

  const updatePort = (blockId: string, idx: number, patch: Partial<PortDef>) => {
    setBlocks((prev) =>
      prev.map((b) =>
        b.id === blockId
          ? {
              ...b,
              out_ports: b.out_ports.map((p, i) => (i === idx ? { ...p, ...patch } : p)),
            }
          : b
      )
    );
  };

  const removePort = (blockId: string, idx: number) => {
    setBlocks((prev) =>
      prev.map((b) => (b.id === blockId ? { ...b, out_ports: b.out_ports.filter((_, i) => i !== idx) } : b))
    );
  };

  const toggleStudent = (id: string) => {
    setSelectedStudents((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const selectedIds = useMemo(() => Object.entries(selectedStudents).filter(([, v]) => v).map(([k]) => k), [selectedStudents]);

  const handleSave = async () => {
    try {
      setIsSaving(true);
      const exerciseId = await createAssignAndEnqueue(
        { title, description, diff, system },
        selectedIds
      );
      toast({ title: "Exercice créé et assigné", description: `ID: ${exerciseId}, liens requis: ${stats.requiredLinks}` });
      onOpenChange(false);
    } catch (e: any) {
      toast({ variant: "destructive", title: "Erreur", description: e.message || "Échec de l'enregistrement" });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Redirection vers l'éditeur</DialogTitle>
        </DialogHeader>

        {/* Stepper header */}
        <div className="flex items-center gap-2 text-sm mb-4">
          {[
            "Métadonnées",
            "Blocs",
            "Ports",
            "Revue & Validation",
            "Assigner",
          ].map((label, i) => (
            <div key={i} className={`px-2 py-1 rounded ${i === step ? "bg-slate-900 text-white" : "bg-slate-100"}`}>
              {i + 1}. {label}
            </div>
          ))}
        </div>

        {step === 0 && (
          <div className="grid gap-4">
            <div>
              <Label>Titre</Label>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} />
            </div>
            <div>
              <Label>Description</Label>
              <Textarea value={description} onChange={(e) => setDescription(e.target.value)} />
            </div>
            <div>
              <Label>Difficulté</Label>
              <Select value={diff} onValueChange={(v) => setDiff(v as any)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1 - Facile</SelectItem>
                  <SelectItem value="2">2 - Moyen</SelectItem>
                  <SelectItem value="3">3 - Difficile</SelectItem>
                  <SelectItem value="4">4 - Expert</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        )}

        <div className="py-6 text-sm text-slate-600">Ce dialogue n'est plus utilisé. Vous allez être redirigé vers l'éditeur complet.</div>

        {step === 3 && (
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Aperçu JSON</CardTitle>
              </CardHeader>
              <CardContent>
                <pre className="bg-slate-50 text-xs p-3 rounded overflow-auto max-h-64">{JSON.stringify(system, null, 2)}</pre>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Validation</CardTitle>
              </CardHeader>
              <CardContent>
                {validation.ok ? (
                  <p className="text-green-600">Valide. Liens requis: {stats.requiredLinks}</p>
                ) : (
                  <ul className="list-disc pl-5 text-red-600">
                    {validation.issues.map((i, idx) => (
                      <li key={idx}>{i.path ? `${i.path}: ` : ""}{i.message}</li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {step === 4 && (
          <div className="space-y-3">
            <h3 className="text-lg font-medium mb-2">Assigner aux étudiants</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 max-h-72 overflow-auto p-2 border rounded">
              {students.map((s) => (
                <label key={s.id} className="flex items-center gap-2 text-sm">
                  <Checkbox checked={!!selectedStudents[s.id]} onCheckedChange={() => toggleStudent(s.id)} />
                  <span>{s.name} ({s.headset_id})</span>
                </label>
              ))}
            </div>
          </div>
        )}

        <DialogFooter>
          <div className="flex w-full justify-between">
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => onOpenChange(false)}>Annuler</Button>
              {step > 0 && (
                <Button variant="secondary" onClick={() => setStep((s) => (s - 1) as Step)}>Précédent</Button>
              )}
            </div>
            <div className="flex gap-2">
              {step < 4 ? (
                <Button onClick={() => setStep((s) => (s + 1) as Step)} disabled={!canNext()}>Suivant</Button>
              ) : (
                <Button onClick={handleSave} disabled={!canNext() || isSaving}>{isSaving ? "Enregistrement..." : "Enregistrer & Assigner"}</Button>
              )}
            </div>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

