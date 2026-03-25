import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Stethoscope, DollarSign, GraduationCap, ArrowLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ChatWidget } from "@/components/chat/ChatWidget";

type Doctor = {
  id: string;
  name: string;
  qualifications: string | null;
  consultation_fee: number | null;
  bio: string | null;
  avatar_url: string | null;
  specialties: { name: string } | null;
};

export default function DoctorsPage() {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from("doctors")
      .select("id, name, qualifications, consultation_fee, bio, avatar_url, specialties(name)")
      .eq("is_active", true)
      .then(({ data }) => {
        setDoctors((data as any) || []);
        setLoading(false);
      });
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="container mx-auto flex items-center justify-between px-4 py-4">
          <div className="flex items-center gap-2">
            <Link to="/">
              <Button variant="ghost" size="icon"><ArrowLeft className="h-4 w-4" /></Button>
            </Link>
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
              <Stethoscope className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold text-foreground">Our Doctors</span>
          </div>
          <Link to="/admin">
            <Button variant="outline" size="sm">Staff Portal</Button>
          </Link>
        </div>
      </header>

      <div className="container mx-auto px-4 py-12">
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          </div>
        ) : doctors.length === 0 ? (
          <div className="text-center py-20">
            <Stethoscope className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h2 className="text-xl font-semibold text-foreground mb-2">No Doctors Yet</h2>
            <p className="text-muted-foreground">Doctors will appear here once added by the admin.</p>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {doctors.map((doc, i) => (
              <motion.div
                key={doc.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="rounded-xl border bg-card p-6 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start gap-4 mb-4">
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-accent text-xl font-bold text-accent-foreground">
                    {doc.name.charAt(0)}
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">Dr. {doc.name}</h3>
                    <p className="text-sm text-primary font-medium">{doc.specialties?.name || "General"}</p>
                  </div>
                </div>
                {doc.bio && <p className="text-sm text-muted-foreground mb-3 line-clamp-3">{doc.bio}</p>}
                <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                  {doc.qualifications && (
                    <span className="flex items-center gap-1">
                      <GraduationCap className="h-3.5 w-3.5" /> {doc.qualifications}
                    </span>
                  )}
                  {doc.consultation_fee && (
                    <span className="flex items-center gap-1">
                      <DollarSign className="h-3.5 w-3.5" /> ${doc.consultation_fee}
                    </span>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
      <ChatWidget />
    </div>
  );
}
