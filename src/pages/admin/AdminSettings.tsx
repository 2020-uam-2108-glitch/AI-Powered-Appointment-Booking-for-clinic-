import { useEffect, useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";
import { Save } from "lucide-react";

type Setting = { id: string; key: string; value: any };

export default function AdminSettings() {
  const [settings, setSettings] = useState<Setting[]>([]);
  const [edits, setEdits] = useState<Record<string, string>>({});

  useEffect(() => {
    supabase.from("clinic_settings").select("*").then(({ data }) => {
      setSettings(data || []);
      const initial: Record<string, string> = {};
      data?.forEach((s) => { initial[s.key] = typeof s.value === "string" ? s.value : JSON.stringify(s.value); });
      setEdits(initial);
    });
  }, []);

  const handleSave = async (key: string) => {
    let value: any = edits[key];
    try { value = JSON.parse(value); } catch { /* keep as string */ }

    const { error } = await supabase
      .from("clinic_settings")
      .update({ value })
      .eq("key", key);

    if (error) {
      toast({ variant: "destructive", title: "Error", description: error.message });
    } else {
      toast({ title: "Saved", description: `${key} updated.` });
    }
  };

  const labels: Record<string, string> = {
    clinic_name: "Clinic Name",
    clinic_address: "Address",
    clinic_phone: "Phone Number",
    clinic_hours: "Opening Hours (JSON)",
    cancellation_cutoff_hours: "Cancellation Cutoff (hours)",
    reminder_intervals_hours: "Reminder Intervals (JSON array)",
    greeting_message: "AI Greeting Message",
  };

  return (
    <AppLayout>
      <div className="p-6 max-w-2xl">
        <h2 className="text-2xl font-bold text-foreground mb-6">Clinic Settings</h2>
        <div className="space-y-4">
          {settings.map((s) => (
            <Card key={s.key}>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {labels[s.key] || s.key}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex gap-2">
                  <Input
                    value={edits[s.key] || ""}
                    onChange={(e) => setEdits({ ...edits, [s.key]: e.target.value })}
                  />
                  <Button size="icon" variant="outline" onClick={() => handleSave(s.key)}>
                    <Save className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </AppLayout>
  );
}
