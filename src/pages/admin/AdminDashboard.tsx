import { useEffect, useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, Users, MessageSquare, Clock } from "lucide-react";

export default function AdminDashboard() {
  const [stats, setStats] = useState({ appointments: 0, patients: 0, conversations: 0, doctors: 0 });

  useEffect(() => {
    Promise.all([
      supabase.from("appointments").select("id", { count: "exact", head: true }),
      supabase.from("patients").select("id", { count: "exact", head: true }),
      supabase.from("conversations").select("id", { count: "exact", head: true }),
      supabase.from("doctors").select("id", { count: "exact", head: true }),
    ]).then(([a, p, c, d]) => {
      setStats({
        appointments: a.count || 0,
        patients: p.count || 0,
        conversations: c.count || 0,
        doctors: d.count || 0,
      });
    });
  }, []);

  const cards = [
    { title: "Total Appointments", value: stats.appointments, icon: Calendar, color: "text-primary" },
    { title: "Patients", value: stats.patients, icon: Users, color: "text-info" },
    { title: "AI Conversations", value: stats.conversations, icon: MessageSquare, color: "text-success" },
    { title: "Active Doctors", value: stats.doctors, icon: Clock, color: "text-warning" },
  ];

  return (
    <AppLayout>
      <div className="p-6">
        <h2 className="text-2xl font-bold text-foreground mb-6">Dashboard</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {cards.map((c) => (
            <Card key={c.title}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">{c.title}</CardTitle>
                <c.icon className={`h-4 w-4 ${c.color}`} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-foreground">{c.value}</div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </AppLayout>
  );
}
