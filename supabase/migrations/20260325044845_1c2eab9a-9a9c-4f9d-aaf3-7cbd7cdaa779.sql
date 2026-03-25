
-- Create update_updated_at function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Specialties
CREATE TABLE public.specialties (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Doctors
CREATE TABLE public.doctors (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  specialty_id UUID REFERENCES public.specialties(id) ON DELETE SET NULL,
  qualifications TEXT,
  consultation_fee NUMERIC(10,2),
  avatar_url TEXT,
  bio TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TRIGGER update_doctors_updated_at BEFORE UPDATE ON public.doctors
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Doctor availability slots
CREATE TABLE public.doctor_schedules (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  doctor_id UUID NOT NULL REFERENCES public.doctors(id) ON DELETE CASCADE,
  day_of_week INT NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  slot_duration_minutes INT NOT NULL DEFAULT 30,
  buffer_minutes INT NOT NULL DEFAULT 5,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Blocked dates for doctors
CREATE TABLE public.doctor_blocked_dates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  doctor_id UUID NOT NULL REFERENCES public.doctors(id) ON DELETE CASCADE,
  blocked_date DATE NOT NULL,
  reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Patients
CREATE TABLE public.patients (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  date_of_birth DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TRIGGER update_patients_updated_at BEFORE UPDATE ON public.patients
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Appointments
CREATE TYPE public.appointment_status AS ENUM ('scheduled', 'confirmed', 'completed', 'cancelled', 'no_show');

CREATE TABLE public.appointments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  doctor_id UUID NOT NULL REFERENCES public.doctors(id) ON DELETE CASCADE,
  appointment_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  status appointment_status NOT NULL DEFAULT 'scheduled',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TRIGGER update_appointments_updated_at BEFORE UPDATE ON public.appointments
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_appointments_doctor_date ON public.appointments(doctor_id, appointment_date);
CREATE INDEX idx_appointments_patient ON public.appointments(patient_id);

-- Chat conversations
CREATE TYPE public.conversation_status AS ENUM ('active', 'escalated', 'resolved');

CREATE TABLE public.conversations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_id UUID REFERENCES public.patients(id) ON DELETE SET NULL,
  patient_name TEXT,
  patient_phone TEXT,
  status conversation_status NOT NULL DEFAULT 'active',
  intent TEXT,
  summary TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TRIGGER update_conversations_updated_at BEFORE UPDATE ON public.conversations
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Chat messages
CREATE TABLE public.chat_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_chat_messages_conversation ON public.chat_messages(conversation_id, created_at);

-- Clinic settings
CREATE TABLE public.clinic_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  key TEXT NOT NULL UNIQUE,
  value JSONB NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.specialties ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.doctors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.doctor_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.doctor_blocked_dates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clinic_settings ENABLE ROW LEVEL SECURITY;

-- Public read for specialties and doctors (patient-facing)
CREATE POLICY "Anyone can view specialties" ON public.specialties FOR SELECT USING (true);
CREATE POLICY "Anyone can view active doctors" ON public.doctors FOR SELECT USING (is_active = true);
CREATE POLICY "Anyone can view doctor schedules" ON public.doctor_schedules FOR SELECT USING (true);
CREATE POLICY "Anyone can view blocked dates" ON public.doctor_blocked_dates FOR SELECT USING (true);

-- Conversations and messages: allow insert for anonymous chat
CREATE POLICY "Anyone can create conversations" ON public.conversations FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can view conversations" ON public.conversations FOR SELECT USING (true);
CREATE POLICY "Anyone can update conversations" ON public.conversations FOR UPDATE USING (true);

CREATE POLICY "Anyone can insert chat messages" ON public.chat_messages FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can view chat messages" ON public.chat_messages FOR SELECT USING (true);

-- Patients
CREATE POLICY "Anyone can create patients" ON public.patients FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can view patients" ON public.patients FOR SELECT USING (true);
CREATE POLICY "Anyone can update patients" ON public.patients FOR UPDATE USING (true);

-- Appointments
CREATE POLICY "Anyone can create appointments" ON public.appointments FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can view appointments" ON public.appointments FOR SELECT USING (true);
CREATE POLICY "Anyone can update appointments" ON public.appointments FOR UPDATE USING (true);

-- Clinic settings
CREATE POLICY "Anyone can view clinic settings" ON public.clinic_settings FOR SELECT USING (true);
CREATE POLICY "Anyone can manage clinic settings" ON public.clinic_settings FOR ALL USING (true);

-- Admin policies for doctors/schedules management
CREATE POLICY "Anyone can manage doctors" ON public.doctors FOR ALL USING (true);
CREATE POLICY "Anyone can manage specialties" ON public.specialties FOR ALL USING (true);
CREATE POLICY "Anyone can manage schedules" ON public.doctor_schedules FOR ALL USING (true);
CREATE POLICY "Anyone can manage blocked dates" ON public.doctor_blocked_dates FOR ALL USING (true);

-- Seed specialties
INSERT INTO public.specialties (name, description) VALUES
  ('General Medicine', 'Primary care and general health consultations'),
  ('Cardiology', 'Heart and cardiovascular system'),
  ('Dermatology', 'Skin, hair, and nail conditions'),
  ('Orthopedics', 'Bones, joints, and musculoskeletal system'),
  ('Pediatrics', 'Healthcare for infants, children, and adolescents'),
  ('Ophthalmology', 'Eye care and vision'),
  ('ENT', 'Ear, nose, and throat conditions'),
  ('Dentistry', 'Dental and oral health');

-- Seed clinic settings
INSERT INTO public.clinic_settings (key, value) VALUES
  ('clinic_name', '"MedCare Clinic"'),
  ('clinic_address', '"123 Health Avenue, Medical District"'),
  ('clinic_phone', '"+1 (555) 123-4567"'),
  ('clinic_hours', '{"weekdays": "8:00 AM - 6:00 PM", "saturday": "9:00 AM - 2:00 PM", "sunday": "Closed"}'),
  ('cancellation_cutoff_hours', '2'),
  ('reminder_intervals_hours', '[48, 24, 2]'),
  ('greeting_message', '"Welcome to MedCare Clinic! I am your AI appointment assistant. How can I help you today?"');
