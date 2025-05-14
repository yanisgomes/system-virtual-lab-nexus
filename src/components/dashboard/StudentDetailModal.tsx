
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Student } from "@/services/dashboard-data";
import { Card, CardContent } from "@/components/ui/card";
import { Form, FormField, FormItem, FormLabel, FormControl } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import ChatTab from "../chat/ChatTab";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";

interface StudentDetailModalProps {
  student: Student | null;
  open: boolean;
  onClose: () => void;
}

// Form validation schema
const studentFormSchema = z.object({
  firstName: z.string().min(1, "Le prénom est requis"),
  lastName: z.string().min(1, "Le nom est requis"),
  headsetName: z.string().min(1, "Le nom du casque est requis"),
  ipAddress: z.string().min(1, "L'adresse IP est requise"),
});

type StudentFormValues = z.infer<typeof studentFormSchema>;

const StudentDetailModal = ({ student, open, onClose }: StudentDetailModalProps) => {
  const { toast } = useToast();
  
  // Initialize form with default empty values
  const form = useForm<StudentFormValues>({
    resolver: zodResolver(studentFormSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      headsetName: "",
      ipAddress: "",
    }
  });

  // Update form values when student changes - coming before any conditionals
  useEffect(() => {
    if (student) {
      const fullName = student.name.split(" ");
      const firstName = fullName[0] || "";
      const lastName = fullName.slice(1).join(" ") || "";
      
      form.reset({
        firstName,
        lastName,
        headsetName: student.headset_id,
        ipAddress: student.ip_address,
      });
    }
  }, [student, form]);

  // Handle form submission
  const onSubmit = (data: StudentFormValues) => {
    // In a real application, this would save the data to the database
    console.log("Student data updated:", data);
    toast({
      title: "Informations mises à jour",
      description: "Les informations de l'étudiant ont été mises à jour avec succès.",
    });
  };

  // Early return AFTER initializing all hooks
  if (!student) {
    return null;
  }

  const { id, name, avatar, metrics } = student;
  const initials = name.split(" ").map((n) => n[0]).join("");

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
        <DialogHeader className="flex flex-row items-center gap-4 pb-2 border-b">
          <Avatar className="h-16 w-16">
            <AvatarImage src={avatar} alt={name} />
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>
          <div>
            <DialogTitle className="text-2xl">{name}</DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground">
              Casque: {student.headset_id} | IP: {student.ip_address}
            </DialogDescription>
          </div>
        </DialogHeader>

        <div className="py-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="firstName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Prénom</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="lastName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nom de famille</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="headsetName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nom du casque</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="ipAddress"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Adresse IP</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>

              <Button type="submit" className="bg-academic-primary hover:bg-academic-accent text-white">
                Mettre à jour les informations
              </Button>
            </form>
          </Form>
        </div>

        <div className="mt-6 border-t pt-6">
          <div className="grid grid-cols-3 gap-4 mb-6">
            <Card>
              <CardContent className="pt-6">
                <Label className="text-sm text-muted-foreground">Attention</Label>
                <div className="text-2xl font-bold mt-2">{metrics.attention}%</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <Label className="text-sm text-muted-foreground">Engagement</Label>
                <div className="text-2xl font-bold mt-2">{metrics.engagement}%</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <Label className="text-sm text-muted-foreground">Interactions</Label>
                <div className="text-2xl font-bold mt-2">
                  {metrics.interactionCounts.blockGrabs + metrics.interactionCounts.menuInteractions}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        <div className="mt-6 border-t pt-6">
          <h3 className="text-xl mb-4">Conversation</h3>
          <ChatTab student={{ id: student.id, name: student.name }} />
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default StudentDetailModal;
