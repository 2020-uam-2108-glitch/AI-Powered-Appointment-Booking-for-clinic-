import { motion } from "framer-motion";
import { Calendar, MessageSquare, ArrowRight, Stethoscope, Clock, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { ChatWidget } from "@/components/chat/ChatWidget";

const features = [
  { icon: Calendar, title: "Easy Booking", desc: "Book appointments in seconds with our AI assistant" },
  { icon: Stethoscope, title: "Expert Doctors", desc: "Access profiles and availability for all our specialists" },
  { icon: Clock, title: "24/7 Available", desc: "Our AI assistant is always ready to help you" },
  { icon: Shield, title: "Secure & Private", desc: "Your health data is encrypted and protected" },
];

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <header className="border-b bg-card">
        <div className="container mx-auto flex items-center justify-between px-4 py-4">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
              <Stethoscope className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold text-foreground">MedCare</span>
          </div>
          <nav className="flex items-center gap-4">
            <Link to="/doctors" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              Our Doctors
            </Link>
            <Link to="/login">
              <Button variant="outline" size="sm">Staff Login</Button>
            </Link>
          </nav>
        </div>
      </header>

      <section className="container mx-auto px-4 py-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mx-auto max-w-2xl text-center"
        >
          <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-accent px-4 py-1.5 text-sm font-medium text-accent-foreground">
            <MessageSquare className="h-4 w-4" />
            AI-Powered Appointment Booking
          </div>
          <h1 className="mb-4 text-4xl font-extrabold tracking-tight text-foreground sm:text-5xl">
            Your Health,{" "}
            <span className="text-primary">Simplified</span>
          </h1>
          <p className="mb-8 text-lg text-muted-foreground">
            Book, reschedule, or cancel appointments instantly with our intelligent AI assistant.
            No waiting on hold — just a simple conversation.
          </p>
          <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <Button size="lg" className="gap-2 rounded-xl px-6" onClick={() => document.querySelector<HTMLButtonElement>('[data-chat-trigger]')?.click()}>
              Book an Appointment <ArrowRight className="h-4 w-4" />
            </Button>
            <Link to="/doctors">
              <Button variant="outline" size="lg" className="rounded-xl px-6">
                View Our Doctors
              </Button>
            </Link>
          </div>
        </motion.div>
      </section>

      {/* Features */}
      <section className="border-t bg-card py-16">
        <div className="container mx-auto px-4">
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {features.map((f, i) => (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className="rounded-xl border bg-background p-6"
              >
                <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-accent">
                  <f.icon className="h-5 w-5 text-accent-foreground" />
                </div>
                <h3 className="mb-1 font-semibold text-foreground">{f.title}</h3>
                <p className="text-sm text-muted-foreground">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <ChatWidget />
    </div>
  );
};

export default Index;
