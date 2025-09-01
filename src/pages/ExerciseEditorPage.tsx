import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Plus, Trash, ArrowLeft, ArrowRight, ArrowUp, ArrowDown } from "lucide-react";
import { BlockDef, PortDef, SystemDef, validateSystemDef } from "@/lib/system-schema";
import { getExerciseById, updateExercise, createAssignAndEnqueue } from "@/services/exercise-service";

interface ExerciseEditorPageProps {
  mode: "create" | "edit";
}

type Point = { x: number; y: number };

export default function ExerciseEditorPage({ mode }: ExerciseEditorPageProps) {
  const navigate = useNavigate();
  const { exerciseId } = useParams();
  const [title, setTitle] = useState("Nouvel exercice");
  const [description, setDescription] = useState("Décrire l'objectif de l'exercice...");
  const [diff, setDiff] = useState<"1" | "2" | "3" | "4">("1");
  const [blocks, setBlocks] = useState<(BlockDef & { position: Point })[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [editingBlockId, setEditingBlockId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState<boolean>(false);
  const [editingDesc, setEditingDesc] = useState<boolean>(false);
  const [connections, setConnections] = useState<Record<string, { targetBlockId: string; targetIdx: number }>>({});
  const blockDimsRef = useRef<Record<string, { w: number; h: number }>>({});
  const [measureTick, setMeasureTick] = useState(0); // force rerender when sizes change

  useEffect(() => {
    const load = async () => {
      if (mode === "edit" && exerciseId) {
        const data = await getExerciseById(exerciseId);
        const system = data.system_json as unknown as SystemDef;
        setTitle(data.title);
        setDescription(data.description);
        setDiff((data.diff as any) || "1");
        // Seed default positions if absent
        const seeded = (system.blocks || []).map((b, i) => ({
          ...b,
          position: { x: 80 + i * 40, y: 80 + i * 40 },
        }));
        setBlocks(seeded as any);
      }
    };
    load();
  }, [mode, exerciseId]);

  const system: SystemDef = useMemo(() => ({
    title,
    desc: description,
    diff,
    blocks: blocks.map(({ position, ...rest }) => rest),
  }), [title, description, diff, blocks]);

  const validation = useMemo(() => validateSystemDef(system), [system]);

  const addBlock = () => {
    setBlocks((prev) => [
      ...prev,
      { id: crypto.randomUUID(), title: "Bloc", desc: "", out_ports: [], position: { x: 120, y: 120 } },
    ]);
  };

  const removeBlock = (id: string) => setBlocks((prev) => prev.filter((b) => b.id !== id));

  // Drag-n-drop basic impl: absolute-positioned cards
  const draggingRef = useRef<{ id: string; offset: Point } | null>(null);

  const onMouseDown = (e: React.MouseEvent, id: string) => {
    const target = e.currentTarget as HTMLElement;
    const rect = target.getBoundingClientRect();
    draggingRef.current = { id, offset: { x: e.clientX - rect.left, y: e.clientY - rect.top } };
  };
  const onMouseMove = (e: React.MouseEvent) => {
    if (!draggingRef.current) return;
    const { id, offset } = draggingRef.current;
    const canvas = document.getElementById("canvas-area");
    if (!canvas) return;
    const cRect = canvas.getBoundingClientRect();
    const x = e.clientX - cRect.left - offset.x;
    const y = e.clientY - cRect.top - offset.y;
    setBlocks((prev) => prev.map((b) => (b.id === id ? { ...b, position: { x: Math.max(0, x), y: Math.max(0, y) } } : b)));
  };
  const onMouseUp = () => (draggingRef.current = null);

  const addPort = (blockId: string) => {
    setBlocks((prev) => prev.map((b) => (b.id === blockId ? { ...b, out_ports: [...b.out_ports, { type: "E", dir: "out", pos: "R", target: "" } as PortDef] } : b)));
  };

  const updatePort = (blockId: string, idx: number, patch: Partial<PortDef>) => {
    setBlocks((prev) => prev.map((b) => (b.id === blockId ? { ...b, out_ports: b.out_ports.map((p, i) => (i === idx ? { ...p, ...patch } : p)) } : b)));
  };

  const removePortAt = (blockId: string, idx: number) => {
    setBlocks((prev) => prev.map((b) => (b.id === blockId ? { ...b, out_ports: b.out_ports.filter((_, i) => i !== idx) } : b)));
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      if (mode === "edit" && exerciseId) {
        await updateExercise(exerciseId, system);
      } else {
        await createAssignAndEnqueue({ title, description, diff, system }, []);
      }
      navigate("/");
    } catch (e: any) {
      // eslint-disable-next-line no-console
      console.error(e);
    } finally {
      setIsSaving(false);
    }
  };

  const PortArrow = ({ dir, pos }: { dir: PortDef["dir"]; pos: PortDef["pos"] }) => {
    // Choose icon pointing outward for 'out', inward for 'in'
    const choose = () => {
      if (pos === "L") return dir === "out" ? <ArrowLeft className="h-3 w-3" /> : <ArrowRight className="h-3 w-3" />;
      if (pos === "R") return dir === "out" ? <ArrowRight className="h-3 w-3" /> : <ArrowLeft className="h-3 w-3" />;
      if (pos === "T") return dir === "out" ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />;
      return dir === "out" ? <ArrowDown className="h-3 w-3" /> : <ArrowUp className="h-3 w-3" />;
    };
    return choose();
  };

  // Compute absolute coords of a port center for drawing connections
  const getPortCoords = (b: BlockDef & { position: Point }, p: PortDef): { x: number; y: number } => {
    const { left, top } = getPortRelativePosition(b, p);
    return { x: b.position.x + left + 8, y: b.position.y + top + 8 };
  };

  const typeColor = (t: PortDef["type"]) => {
    if (t === "E") return { stroke: "#06b6d4", bg: "from-cyan-100 to-cyan-50", ring: "ring-cyan-400" };
    if (t === "M") return { stroke: "#f59e0b", bg: "from-amber-100 to-amber-50", ring: "ring-amber-400" };
    return { stroke: "#10b981", bg: "from-emerald-100 to-emerald-50", ring: "ring-emerald-400" };
  };
  // Layout constants for block and ports
  const BLOCK_W = 260;
  const BLOCK_H_FALLBACK = 100; // fallback if not yet measured
  const PORT_SIZE = 16;

  const sideCountFor = (b: BlockDef, side: PortDef["pos"]) => b.out_ports.filter(pt => pt.pos === side).length;
  const sideIndexFor = (b: BlockDef, p: PortDef, globalIdx: number) => {
    let idx = 0;
    for (let i = 0; i <= globalIdx; i++) {
      if (b.out_ports[i].pos === p.pos) {
        if (i === globalIdx) return idx;
        idx++;
      }
    }
    return idx;
  };

  const spacedOffset = (length: number, count: number, index: number) => {
    // spread ports evenly along side length, clamped away from extreme corners
    const inner = Math.max(0, length - PORT_SIZE);
    const step = inner / (count + 1);
    return Math.round(step * (index + 1));
  };

  const getPortRelativePosition = (b: BlockDef, p: PortDef, globalIdx?: number): { left: number; top: number } => {
    const dims = blockDimsRef.current[b.id];
    const W = dims?.w ?? BLOCK_W;
    const H = dims?.h ?? BLOCK_H_FALLBACK;
    const count = sideCountFor(b, p.pos);
    const gIdx = globalIdx ?? b.out_ports.indexOf(p);
    const sideIdx = sideIndexFor(b, p, gIdx);
    if (p.pos === "L") return { left: -PORT_SIZE, top: spacedOffset(H, count, sideIdx) };
    if (p.pos === "R") return { left: W, top: spacedOffset(H, count, sideIdx) };
    if (p.pos === "T") return { left: spacedOffset(W, count, sideIdx), top: -PORT_SIZE };
    return { left: spacedOffset(W, count, sideIdx), top: H };
  };

  const measureBlock = (id: string, el: HTMLDivElement | null) => {
    if (!el) return;
    const w = el.offsetWidth;
    const h = el.offsetHeight;
    const prev = blockDimsRef.current[id];
    if (!prev || prev.w !== w || prev.h !== h) {
      blockDimsRef.current[id] = { w, h };
      setMeasureTick((t) => t + 1);
    }
  };
  const typeSolid = (t: PortDef["type"]) => {
    if (t === "E") return "bg-cyan-600";
    if (t === "M") return "bg-amber-600";
    return "bg-emerald-600";
  };

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          {editingTitle ? (
            <input
              className="text-2xl font-extrabold border rounded px-2 h-10"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onBlur={() => setEditingTitle(false)}
              onKeyDown={(e) => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur(); }}
              autoFocus
            />
          ) : (
            <h1 className="text-2xl font-extrabold cursor-text" onClick={() => setEditingTitle(true)}>{title}</h1>
          )}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className={`px-2 py-1 text-sm rounded border ${diff === '1' ? 'bg-emerald-50 border-emerald-300' : diff === '2' ? 'bg-amber-50 border-amber-300' : diff === '3' ? 'bg-rose-50 border-rose-300' : 'bg-slate-100 border-slate-300'}`}>
                Difficulté: {diff}
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              {["1","2","3","4"].map((d) => (
                <DropdownMenuItem key={d} onClick={() => setDiff(d as any)}>Niveau {d}</DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        <div className="flex items-center gap-3 text-sm">
          {validation.ok ? <span className="text-green-600">Valide</span> : <span className="text-red-600">Invalide</span>}
          <Button variant="outline" onClick={() => navigate(-1)}>Annuler</Button>
          <Button onClick={handleSave} disabled={!validation.ok || isSaving}>{isSaving ? "Enregistrement..." : "Enregistrer"}</Button>
        </div>
      </div>
      {editingDesc ? (
        <textarea
          className="w-full border rounded p-2 text-slate-700"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          onBlur={() => setEditingDesc(false)}
          onKeyDown={(e) => { if (e.key === 'Enter') (e.target as HTMLTextAreaElement).blur(); }}
          autoFocus
        />
      ) : (
        <p className="text-slate-600 cursor-text" onClick={() => setEditingDesc(true)}>{description}</p>
      )}

      <ScrollArea className="h-[78vh] border rounded relative">
        <div id="canvas-area"
             className="relative w-full h-[1400px] bg-white bg-[linear-gradient(transparent,transparent_23px,_#e5e7eb_24px),linear-gradient(90deg,transparent,transparent_23px,_#e5e7eb_24px)] bg-[length:24px_24px]"
             onMouseMove={onMouseMove} onMouseUp={onMouseUp}
             onClick={() => { setEditingBlockId(null); setEditingTitle(false); setEditingDesc(false); }}>
          <div className="absolute top-4 right-4 z-20">
            <Button onClick={addBlock}><Plus className="h-4 w-4 mr-1" />Ajouter un bloc</Button>
          </div>

          {/* Connection lines */}
          <svg className="absolute inset-0 pointer-events-none" width="100%" height="100%">
            {blocks.map((b, bi) => (
              b.out_ports.map((p, pi) => {
                const targetBlockId = p.target || connections[`${b.id}:${pi}`]?.targetBlockId;
                if (!targetBlockId) return null;
                const targetBlock = blocks.find((bb) => bb.id === targetBlockId);
                if (!targetBlock) return null;
                // pick target port index: prefer stored, else first matching
                const matchIdx = connections[`${b.id}:${pi}`]?.targetIdx ?? targetBlock.out_ports.findIndex((pp) => pp.type === p.type && pp.dir !== p.dir);
                const targetPort = targetBlock.out_ports[matchIdx] || targetBlock.out_ports[0];
                if (!targetPort) return null;
                const a = getPortCoords(b, p);
                const z = getPortCoords(targetBlock, targetPort);
                const col = typeColor(p.type).stroke;
                return (
                  <line key={`${b.id}:${pi}`} x1={a.x} y1={a.y} x2={z.x} y2={z.y} stroke={col} strokeWidth="2" strokeOpacity="0.9" />
                );
              })
            ))}
          </svg>

          {blocks.map((b) => (
            <div key={b.id}
                 style={{ left: b.position.x, top: b.position.y }}
                 className="absolute select-none">
              <div className="relative">
                <div className="absolute -top-3 -left-3 z-10">
                  <Button size="icon" variant="ghost" onClick={() => removeBlock(b.id)}><Trash className="h-4 w-4 text-destructive" /></Button>
                </div>
                <div
                  ref={(el) => measureBlock(b.id, el)}
                  className="bg-white border rounded-lg shadow px-4 py-3 w-[260px] cursor-move transition-shadow hover:shadow-md"
                  onMouseDown={(e) => { if (editingBlockId !== b.id) onMouseDown(e, b.id); }}
                  onClick={(e) => { e.stopPropagation(); setEditingBlockId(b.id); }}
                >
                  {editingBlockId === b.id ? (
                    <div className="space-y-2">
                      <input
                        className="w-full text-center text-lg font-bold focus:outline-none border rounded h-9"
                        value={b.title}
                        onChange={(e) => setBlocks((prev) => prev.map((x) => x.id === b.id ? { ...x, title: e.target.value } : x))}
                        autoFocus
                      />
                      <textarea
                        className="w-full text-center text-sm text-slate-600 focus:outline-none border rounded h-16 resize-none"
                        value={b.desc}
                        onChange={(e) => setBlocks((prev) => prev.map((x) => x.id === b.id ? { ...x, desc: e.target.value } : x))}
                        onBlur={() => setEditingBlockId(null)}
                      />
                    </div>
                  ) : (
                    <div>
                      <div className="text-center text-lg font-extrabold mb-1">{b.title || "Sans titre"}</div>
                      <div className="text-center text-sm text-slate-600">{b.desc || "Cliquez pour éditer la description"}</div>
                    </div>
                  )}
                </div>
                {/* Ports around borders */}
                {b.out_ports.map((p, i) => (
                  <Popover key={i}>
                    <PopoverTrigger asChild>
                      <button
                        className={`absolute flex items-center gap-1 px-1.5 py-0.5 rounded-md border ring-1 shadow transition-colors bg-gradient-to-br ${typeColor(p.type).bg} ${typeColor(p.type).ring}`}
                        style={getPortRelativePosition(b, p, i)}
                        title={`${p.type} ${p.dir} ${p.pos}`}
                      >
                        <span className={`inline-flex h-4 w-4 items-center justify-center rounded-sm text-white ${typeSolid(p.type)} animate-[pulse_2s_ease-in-out_infinite]`}>
                          <PortArrow dir={p.dir} pos={p.pos} />
                        </span>
                        <span className="font-semibold text-[11px]">{p.type}</span>
                      </button>
                    </PopoverTrigger>
                    <PopoverContent className="w-64">
                      <div className="space-y-2">
                        <div>
                          Type
                          <Select value={p.type} onValueChange={(v) => updatePort(b.id, i, { type: v as PortDef["type"] })}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="E">E</SelectItem>
                              <SelectItem value="I">I</SelectItem>
                              <SelectItem value="M">M</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          Direction
                          <Select value={p.dir} onValueChange={(v) => updatePort(b.id, i, { dir: v as PortDef["dir"] })}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="in">in</SelectItem>
                              <SelectItem value="out">out</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          Position
                          <Select value={p.pos} onValueChange={(v) => updatePort(b.id, i, { pos: v as PortDef["pos"] })}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="L">L</SelectItem>
                              <SelectItem value="R">R</SelectItem>
                              <SelectItem value="T">T</SelectItem>
                              <SelectItem value="B">B</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          Target block
                          <Select
                            value={p.target || undefined}
                            onValueChange={(val) => {
                              const targetBlockId = val;
                              // store connection target index as best matching
                              const targetBlock = blocks.find(bb => bb.id === targetBlockId);
                              const matchIdx = targetBlock ? targetBlock.out_ports.findIndex(pp => pp.type === p.type && pp.dir !== p.dir) : -1;
                              setConnections(prev => ({ ...prev, [`${b.id}:${i}`]: { targetBlockId, targetIdx: Math.max(0, matchIdx) } }));
                              updatePort(b.id, i, { target: targetBlockId });
                            }}
                          >
                            <SelectTrigger><SelectValue placeholder="Select target" /></SelectTrigger>
                            <SelectContent>
                              {blocks.filter(bb => bb.id !== b.id).map((bb) => (
                                bb.out_ports.some(pp => pp.type === p.type && pp.dir !== p.dir) ? (
                                  <SelectItem key={bb.id} value={bb.id}>{bb.title || bb.id}</SelectItem>
                                ) : null
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="pt-1">
                          <Button variant="ghost" className="text-destructive" onClick={() => removePortAt(b.id, i)}>Supprimer le port</Button>
                        </div>
                      </div>
                    </PopoverContent>
                  </Popover>
                ))}

                {/* Add port button on block */}
                <div className="absolute -top-3 -right-3 z-10">
                  <Button size="icon" variant="secondary" onClick={() => addPort(b.id)}><Plus className="h-4 w-4" /></Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}


