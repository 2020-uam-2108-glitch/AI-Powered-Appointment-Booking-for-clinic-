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
    const { messages, conversationId } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch doctors and specialties for context
    const { data: doctors } = await supabase
      .from("doctors")
      .select("id, name, specialty_id, consultation_fee, qualifications, bio, specialties(name)")
      .eq("is_active", true);

    const { data: schedules } = await supabase
      .from("doctor_schedules")
      .select("*")
      .eq("is_active", true);

    const { data: settings } = await supabase
      .from("clinic_settings")
      .select("key, value");

    // Build context about the clinic
    const clinicContext = settings?.reduce((acc: Record<string, string>, s: any) => {
      acc[s.key] = typeof s.value === "string" ? s.value : JSON.stringify(s.value);
      return acc;
    }, {}) || {};

    const today = new Date().toISOString().split("T")[0];
    const dayOfWeek = new Date().getDay();

    // Get existing appointments for conflict checking
    const { data: existingAppts } = await supabase
      .from("appointments")
      .select("doctor_id, appointment_date, start_time, end_time, patient_id, patients(name, phone)")
      .in("status", ["scheduled", "confirmed"])
      .gte("appointment_date", today);

    const doctorInfo = doctors?.map((d: any) => 
      `- Dr. ${d.name} (${d.specialties?.name || "General"}), Fee: $${d.consultation_fee || "N/A"}, ID: ${d.id}`
    ).join("\n") || "No doctors available";

    const scheduleInfo = schedules?.map((s: any) => {
      const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
      return `- Doctor ${s.doctor_id}: ${days[s.day_of_week]} ${s.start_time}-${s.end_time} (${s.slot_duration_minutes}min slots)`;
    }).join("\n") || "No schedules configured";

    const apptInfo = existingAppts?.map((a: any) =>
      `- ${a.appointment_date} ${a.start_time}-${a.end_time} with doctor ${a.doctor_id} for ${a.patients?.name}`
    ).join("\n") || "No upcoming appointments";

    const systemPrompt = `You are the AI appointment assistant for ${clinicContext.clinic_name || "the clinic"}.
Address: ${clinicContext.clinic_address || "N/A"}
Phone: ${clinicContext.clinic_phone || "N/A"}
Hours: ${JSON.stringify(clinicContext.clinic_hours || "N/A")}
Today's date: ${today} (${["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"][dayOfWeek]})

AVAILABLE DOCTORS:
${doctorInfo}

DOCTOR SCHEDULES:
${scheduleInfo}

EXISTING APPOINTMENTS (for conflict checking):
${apptInfo}

CANCELLATION POLICY: Appointments can be cancelled up to ${clinicContext.cancellation_cutoff_hours || 2} hours before.

YOUR CAPABILITIES:
1. Book new appointments - collect patient name, phone, preferred doctor/specialty, date, time
2. Reschedule existing appointments - verify patient identity first
3. Cancel appointments - check cancellation policy
4. Answer FAQs about clinic hours, doctors, services
5. Provide doctor information and availability

RULES:
- Be friendly, professional, and concise
- Never provide medical advice or diagnoses
- If the patient mentions an emergency (chest pain, difficulty breathing, severe pain), immediately tell them to call emergency services (911) and do NOT proceed with booking
- If the patient is frustrated or asks for a human, acknowledge and offer to escalate
- When booking: confirm all details before finalizing
- Suggest alternative slots if preferred time is unavailable
- Always confirm: doctor name, date, time, and patient details before booking
- When a patient wants to book, collect info step by step, don't ask for everything at once
- Use a warm, caring tone appropriate for healthcare

When you have all booking details confirmed, respond with a JSON block like this at the end of your message:
\`\`\`json
{"action": "book", "patient_name": "...", "patient_phone": "...", "doctor_id": "...", "date": "YYYY-MM-DD", "start_time": "HH:MM", "end_time": "HH:MM"}
\`\`\`

For cancellations:
\`\`\`json
{"action": "cancel", "patient_phone": "...", "appointment_date": "YYYY-MM-DD"}
\`\`\`

For escalation:
\`\`\`json
{"action": "escalate", "reason": "..."}
\`\`\``;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          ...messages,
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limited. Please try again shortly." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please add funds." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(JSON.stringify({ error: "AI service error" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("chat error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
