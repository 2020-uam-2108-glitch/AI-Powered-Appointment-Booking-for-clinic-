import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { action, patient_name, patient_phone, doctor_id, date, start_time, end_time, appointment_date, conversation_id } = await req.json();
    
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    if (action === "book") {
      // Check for conflicts
      const { data: conflicts } = await supabase
        .from("appointments")
        .select("id")
        .eq("doctor_id", doctor_id)
        .eq("appointment_date", date)
        .eq("start_time", start_time)
        .in("status", ["scheduled", "confirmed"]);

      if (conflicts && conflicts.length > 0) {
        return new Response(JSON.stringify({ success: false, error: "This slot is already booked." }), {
          status: 409, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Find or create patient
      let patientId: string;
      const { data: existingPatient } = await supabase
        .from("patients")
        .select("id")
        .eq("phone", patient_phone)
        .maybeSingle();

      if (existingPatient) {
        patientId = existingPatient.id;
      } else {
        const { data: newPatient, error: pErr } = await supabase
          .from("patients")
          .insert({ name: patient_name, phone: patient_phone })
          .select("id")
          .single();
        if (pErr) throw pErr;
        patientId = newPatient.id;
      }

      // Create appointment
      const { data: appointment, error: aErr } = await supabase
        .from("appointments")
        .insert({
          patient_id: patientId,
          doctor_id,
          appointment_date: date,
          start_time,
          end_time,
          status: "scheduled",
        })
        .select("id")
        .single();

      if (aErr) throw aErr;

      // Update conversation
      if (conversation_id) {
        await supabase.from("conversations").update({
          patient_id: patientId,
          patient_name,
          patient_phone,
          intent: "booking",
        }).eq("id", conversation_id);
      }

      return new Response(JSON.stringify({ 
        success: true, 
        appointment_id: appointment.id,
        message: `Appointment booked successfully for ${patient_name} on ${date} at ${start_time}`
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "cancel") {
      const { data: patient } = await supabase
        .from("patients")
        .select("id")
        .eq("phone", patient_phone)
        .maybeSingle();

      if (!patient) {
        return new Response(JSON.stringify({ success: false, error: "Patient not found." }), {
          status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const { error } = await supabase
        .from("appointments")
        .update({ status: "cancelled" })
        .eq("patient_id", patient.id)
        .eq("appointment_date", appointment_date)
        .in("status", ["scheduled", "confirmed"]);

      if (error) throw error;

      return new Response(JSON.stringify({ success: true, message: "Appointment cancelled." }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "escalate") {
      if (conversation_id) {
        await supabase.from("conversations").update({ status: "escalated" }).eq("id", conversation_id);
      }
      return new Response(JSON.stringify({ success: true, message: "Escalated to staff." }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Unknown action" }), {
      status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("book-appointment error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
