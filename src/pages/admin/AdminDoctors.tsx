import { useEffect, useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { supabase } from "@/integrations/supabase/client";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { Plus, Trash2 } from "lucide-react";

type Doctor = {
  id: string;
  name: string;
  qualifications: string | null;
  consultation_fee: number | null;
  bio: string | null;
  is_active: boolean;
  specialty_id: string | null;
  specialties: { name: string } | null;
};

type Specialty = { id: string; name: string };

export default function AdminDoctors() {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [specialties, setSpecialties] = useState<Specialty[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({ name: "", specialty_id: "", qualifications: "", consultation_fee: "", bio: "" });

  const loadData = async () => {
    const [d, s] = await Promise.all([
      supabase.from("doctors").select("*, specialties(name)").order("name"),
      supabase.from("specialties").select("id, name").order("name"),
    ]);
    setDoctors((d.data as any) || []);
    setSpecialties(s.data || []);
  };

  useEffect(() => { loadData(); }, []);

  const handleAdd = async () => {
    const { error } = await supabase.from("doctors").insert({
      name: form.name,
      specialty_id: form.specialty_id || null,
      qualifications: form.qualifications || null,
      consultation_fee: form.consultation_fee ? parseFloat(form.consultation_fee) : null,
      bio: form.bio || null,
    });
    if (error) {
      toast({ variant: "destructive", title: "Error", description: error.message });
    } else {
      toast({ title: "Doctor added" });
      setDialogOpen(false);
      setForm({ name: "", specialty_id: "", qualifications: "", consultation_fee: "", bio: "" });
      loadData();
    }
  };

  const toggleActive = async (id: string, active: boolean) => {
    await supabase.from("doctors").update({ is_active: !active }).eq("id", id);
    loadData();
  };

  const handleDelete = async (id: string) => {
    await supabase.from("doctors").delete().eq("id", id);
    loadData();
  };

  return (
    <AppLayout>
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-foreground">Doctors</h2>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2"><Plus className="h-4 w-4" /> Add Doctor</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Add New Doctor</DialogTitle></DialogHeader>
              <div className="space-y-3 mt-2">
                <Input placeholder="Full Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
                <Select value={form.specialty_id} onValueChange={(v) => setForm({ ...form, specialty_id: v })}>
                  <SelectTrigger><SelectValue placeholder="Select Specialty" /></SelectTrigger>
                  <SelectContent>
                    {specialties.map((s) => (
                      <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Input placeholder="Qualifications" value={form.qualifications} onChange={(e) => setForm({ ...form, qualifications: e.target.value })} />
                <Input placeholder="Consultation Fee" type="number" value={form.consultation_fee} onChange={(e) => setForm({ ...form, consultation_fee: e.target.value })} />
                <Input placeholder="Short Bio" value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} />
                <Button onClick={handleAdd} disabled={!form.name} className="w-full">Add Doctor</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
        <div className="rounded-xl border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Specialty</TableHead>
                <TableHead>Fee</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {doctors.map((d) => (
                <TableRow key={d.id}>
                  <TableCell className="font-medium">Dr. {d.name}</TableCell>
                  <TableCell>{d.specialties?.name || "—"}</TableCell>
                  <TableCell>{d.consultation_fee ? `$${d.consultation_fee}` : "—"}</TableCell>
                  <TableCell>
                    <Badge variant={d.is_active ? "default" : "secondary"}>
                      {d.is_active ? "Active" : "Inactive"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right space-x-2">
                    <Button variant="outline" size="sm" onClick={() => toggleActive(d.id, d.is_active)}>
                      {d.is_active ? "Deactivate" : "Activate"}
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(d.id)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {doctors.length === 0 && (
                <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">No doctors yet</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </AppLayout>
  );
}
