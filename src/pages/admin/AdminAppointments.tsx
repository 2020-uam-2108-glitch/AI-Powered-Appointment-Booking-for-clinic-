import { useEffect, useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { supabase } from "@/integrations/supabase/client";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

type Appointment = {
  id: string;
  appointment_date: string;
  start_time: string;
  end_time: string;
  status: string;
  notes: string | null;
  doctors: { name: string } | null;
  patients: { name: string; phone: string | null } | null;
};

const statusColors: Record<string, string> = {
  scheduled: "default",
  confirmed: "default",
  completed: "secondary",
  cancelled: "destructive",
  no_show: "outline",
};

export default function AdminAppointments() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);

  useEffect(() => {
    supabase
      .from("appointments")
      .select("*, doctors(name), patients(name, phone)")
      .order("appointment_date", { ascending: false })
      .then(({ data }) => setAppointments((data as any) || []));
  }, []);

  return (
    <AppLayout>
      <div className="p-6">
        <h2 className="text-2xl font-bold text-foreground mb-6">Appointments</h2>
        <div className="rounded-xl border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Time</TableHead>
                <TableHead>Patient</TableHead>
                <TableHead>Doctor</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {appointments.map((a) => (
                <TableRow key={a.id}>
                  <TableCell>{a.appointment_date}</TableCell>
                  <TableCell>{a.start_time} – {a.end_time}</TableCell>
                  <TableCell className="font-medium">{a.patients?.name || "Unknown"}</TableCell>
                  <TableCell>Dr. {a.doctors?.name || "Unknown"}</TableCell>
                  <TableCell>
                    <Badge variant={statusColors[a.status] as any}>{a.status}</Badge>
                  </TableCell>
                </TableRow>
              ))}
              {appointments.length === 0 && (
                <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">No appointments yet</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </AppLayout>
  );
}
