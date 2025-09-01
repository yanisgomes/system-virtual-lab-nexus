
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Trash, Plus, Minus } from "lucide-react";
import { SystemExercise, SystemExerciseBlock, SystemExercisePort } from "./SystemExerciseCard";

interface SystemExerciseModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialExercise: SystemExercise;
  onSave: (exercise: SystemExercise) => void;
}

const SystemExerciseModal = ({ 
  open, 
  onOpenChange, 
  initialExercise, 
  onSave 
}: SystemExerciseModalProps) => {
  const [exercise, setExercise] = useState<SystemExercise>({ 
    title: "", 
    desc: "", 
    diff: "1", 
    blocks: [] 
  });
  
  useEffect(() => {
    if (initialExercise) {
      setExercise(JSON.parse(JSON.stringify(initialExercise)));
    }
  }, [initialExercise, open]);
  
  const handleSave = () => {
    onSave(exercise);
  };
  
  const updateExerciseField = (field: keyof SystemExercise, value: any) => {
    setExercise(prev => ({ ...prev, [field]: value }));
  };
  
  const updateBlock = (index: number, field: keyof SystemExerciseBlock, value: any) => {
    setExercise(prev => {
      const updatedBlocks = [...prev.blocks];
      updatedBlocks[index] = { ...updatedBlocks[index], [field]: value };
      return { ...prev, blocks: updatedBlocks };
    });
  };
  
  const addBlock = () => {
    const newBlock: SystemExerciseBlock = {
      id: crypto.randomUUID(),
      title: "",
      desc: "",
      out_ports: []
    };
    
    setExercise(prev => ({
      ...prev,
      blocks: [...prev.blocks, newBlock]
    }));
  };
  
  const removeBlock = (index: number) => {
    setExercise(prev => {
      const updatedBlocks = [...prev.blocks];
      updatedBlocks.splice(index, 1);
      return { ...prev, blocks: updatedBlocks };
    });
  };
  
  const addPort = (blockIndex: number) => {
    const newPort: SystemExercisePort = {
      type: "E",
      dir: "in",
      pos: "L",
      target: ""
    };
    
    setExercise(prev => {
      const updatedBlocks = [...prev.blocks];
      updatedBlocks[blockIndex].out_ports = [
        ...updatedBlocks[blockIndex].out_ports,
        newPort
      ];
      return { ...prev, blocks: updatedBlocks };
    });
  };
  
  const updatePort = (blockIndex: number, portIndex: number, field: keyof SystemExercisePort, value: any) => {
    setExercise(prev => {
      const updatedBlocks = [...prev.blocks];
      updatedBlocks[blockIndex].out_ports[portIndex] = { 
        ...updatedBlocks[blockIndex].out_ports[portIndex], 
        [field]: value 
      };
      return { ...prev, blocks: updatedBlocks };
    });
  };
  
  const removePort = (blockIndex: number, portIndex: number) => {
    setExercise(prev => {
      const updatedBlocks = [...prev.blocks];
      updatedBlocks[blockIndex].out_ports.splice(portIndex, 1);
      return { ...prev, blocks: updatedBlocks };
    });
  };
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Exercice système</DialogTitle>
        </DialogHeader>
        
        <div className="grid gap-6 py-4">
          {/* Main Exercise Details */}
          <div className="grid gap-4">
            <div className="grid grid-cols-1 gap-2">
              <Label htmlFor="title">Titre</Label>
              <Input
                id="title"
                value={exercise.title}
                onChange={(e) => updateExerciseField("title", e.target.value)}
              />
            </div>
            
            <div className="grid grid-cols-1 gap-2">
              <Label htmlFor="desc">Description</Label>
              <Textarea
                id="desc"
                value={exercise.desc}
                onChange={(e) => updateExerciseField("desc", e.target.value)}
              />
            </div>
            
            <div className="grid grid-cols-1 gap-2">
              <Label htmlFor="difficulty">Difficulté</Label>
              <Select
                value={exercise.diff}
                onValueChange={(value) => updateExerciseField("diff", value)}
              >
                <SelectTrigger id="difficulty">
                  <SelectValue placeholder="Sélectionner la difficulté" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">Facile</SelectItem>
                  <SelectItem value="2">Moyen</SelectItem>
                  <SelectItem value="3">Difficile</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          {/* Blocks Section */}
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium">Blocs</h3>
              <Button 
                onClick={addBlock} 
                variant="outline" 
                size="sm" 
                className="flex items-center gap-1"
              >
                <Plus className="h-4 w-4" />
                Ajouter un bloc
              </Button>
            </div>
            
            {exercise.blocks.map((block, blockIndex) => (
              <Card key={block.id} className="border border-slate-200">
                <CardHeader className="pb-2 pt-4 px-4 flex flex-row items-start justify-between space-y-0">
                  <CardTitle className="text-base font-medium">Bloc {blockIndex + 1}</CardTitle>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => removeBlock(blockIndex)}
                    className="h-8 w-8 p-0 text-destructive"
                  >
                    <Trash className="h-4 w-4" />
                  </Button>
                </CardHeader>
                
                <CardContent className="space-y-4 px-4 pb-4">
                  <div className="grid gap-3">
                    <div>
                      <Label htmlFor={`block-${blockIndex}-title`}>Titre de bloc</Label>
                      <Input
                        id={`block-${blockIndex}-title`}
                        value={block.title}
                        onChange={(e) => updateBlock(blockIndex, "title", e.target.value)}
                        className="mt-1"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor={`block-${blockIndex}-desc`}>Description de bloc</Label>
                      <Textarea
                        id={`block-${blockIndex}-desc`}
                        value={block.desc}
                        onChange={(e) => updateBlock(blockIndex, "desc", e.target.value)}
                        className="mt-1"
                      />
                    </div>
                    
                    {/* Ports Section */}
                    <div className="space-y-3 pt-2">
                      <div className="flex items-center justify-between">
                        <Label>Ports</Label>
                        <Button 
                          onClick={() => addPort(blockIndex)} 
                          variant="outline" 
                          size="sm" 
                          className="flex items-center gap-1"
                        >
                          <Plus className="h-4 w-4" />
                          Ajouter un port
                        </Button>
                      </div>
                      
                      {block.out_ports.map((port, portIndex) => (
                        <div key={portIndex} className="grid grid-cols-1 sm:grid-cols-5 gap-3 items-center border rounded-md p-3">
                          <div>
                            <Label htmlFor={`block-${blockIndex}-port-${portIndex}-type`}>Type</Label>
                            <Select
                              value={port.type}
                              onValueChange={(value) => updatePort(blockIndex, portIndex, "type", value)}
                            >
                              <SelectTrigger id={`block-${blockIndex}-port-${portIndex}-type`}>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="E">E</SelectItem>
                                <SelectItem value="I">I</SelectItem>
                                <SelectItem value="M">M</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          
                          <div>
                            <Label htmlFor={`block-${blockIndex}-port-${portIndex}-dir`}>Direction</Label>
                            <Select
                              value={port.dir}
                              onValueChange={(value) => updatePort(blockIndex, portIndex, "dir", value)}
                            >
                              <SelectTrigger id={`block-${blockIndex}-port-${portIndex}-dir`}>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="in">in</SelectItem>
                                <SelectItem value="out">out</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          
                          <div>
                            <Label htmlFor={`block-${blockIndex}-port-${portIndex}-pos`}>Position</Label>
                            <Select
                              value={port.pos}
                              onValueChange={(value) => updatePort(blockIndex, portIndex, "pos", value)}
                            >
                              <SelectTrigger id={`block-${blockIndex}-port-${portIndex}-pos`}>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="L">L</SelectItem>
                                <SelectItem value="R">R</SelectItem>
                                <SelectItem value="T">T</SelectItem>
                                <SelectItem value="B">B</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          
                          <div>
                            <Label htmlFor={`block-${blockIndex}-port-${portIndex}-target`}>Cible</Label>
                            <Input
                              id={`block-${blockIndex}-port-${portIndex}-target`}
                              value={port.target}
                              onChange={(e) => updatePort(blockIndex, portIndex, "target", e.target.value)}
                            />
                          </div>
                          
                          <div className="flex justify-end items-end h-full">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removePort(blockIndex, portIndex)}
                              className="h-8 w-8 p-0 text-destructive"
                            >
                              <Minus className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                      
                      {block.out_ports.length === 0 && (
                        <p className="text-sm text-slate-500 italic">Aucun port ajouté</p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
            
            {exercise.blocks.length === 0 && (
              <div className="text-center p-6 border border-dashed rounded-md">
                <p className="text-slate-500">Aucun bloc ajouté</p>
                <Button onClick={addBlock} variant="outline" size="sm" className="mt-2">
                  <Plus className="h-4 w-4 mr-1" />
                  Ajouter un bloc
                </Button>
              </div>
            )}
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Annuler
          </Button>
          <Button onClick={handleSave}>
            Enregistrer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default SystemExerciseModal;
