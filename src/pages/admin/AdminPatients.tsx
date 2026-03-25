import { useEffect, useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { supabase } from "@/integrations/supabase/client";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

type Patient = {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  created_at: string;
};

export default function AdminPatients() {
  const [patients, setPatients] = useState<Patient[]>([]);

  useEffect(() => {
    supabase
      .from("patients")
      .select("*")
      .order("created_at", { ascending: false })
      .then(({ data }) => setPatients(data || []));
  }, []);

  return (
    <AppLayout>
      <div className="p-6">
        <h2 className="text-2xl font-bold text-foreground mb-6">Patients</h2>
        <div className="rounded-xl border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Registered</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {patients.map((p) => (
                <TableRow key={p.id}>
                  <TableCell className="font-medium">{p.name}</TableCell>
                  <TableCell>{p.phone || "—"}</TableCell>
                  <TableCell>{p.email || "—"}</TableCell>
                  <TableCell>{new Date(p.created_at).toLocaleDateString()}</TableCell>
                </TableRow>
              ))}
              {patients.length === 0 && (
                <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground py-8">No patients yet</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </AppLayout>
  );
}
