import { useState } from "react";
import { CheckCircle2, Calendar, Mail, Building2, Users } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface BookDemoModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function BookDemoModal({ open, onOpenChange }: BookDemoModalProps) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [company, setCompany] = useState("");
  const [teamSize, setTeamSize] = useState("");
  const [message, setMessage] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // Simulate API request to register demo request
    setTimeout(() => {
      setLoading(false);
      setSubmitted(true);
    }, 1200);
  };

  const handleClose = () => {
    onOpenChange(false);
    // Reset form after closing
    setTimeout(() => {
      setName("");
      setEmail("");
      setCompany("");
      setTeamSize("");
      setMessage("");
      setSubmitted(false);
    }, 200);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[480px] border-border/50 bg-card/95 shadow-xl backdrop-blur-xl dark:bg-card/90">
        {!submitted ? (
          <>
            <DialogHeader className="text-left space-y-1">
              <DialogTitle className="flex items-center gap-2 text-xl font-bold tracking-tight text-foreground">
                <span className="grid h-8 w-8 place-items-center rounded-lg bg-primary/10 text-primary">
                  <Calendar className="h-4.5 w-4.5" />
                </span>
                Book a DevInsight Demo
              </DialogTitle>
              <DialogDescription className="text-sm leading-relaxed text-muted-foreground pt-1">
                See how DevInsight can automate code reviews, secure your repository, and elevate
                developer velocity. Fill out the details below.
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-4 pt-1">
              <div className="space-y-1.5">
                <Label htmlFor="demo-name">Full Name</Label>
                <Input
                  id="demo-name"
                  type="text"
                  placeholder="Jane Doe"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="demo-email">Work Email</Label>
                <div className="relative">
                  <Mail className="absolute top-3 left-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="demo-email"
                    type="email"
                    placeholder="jane@company.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-9"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="demo-company">Company</Label>
                  <div className="relative">
                    <Building2 className="absolute top-3 left-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="demo-company"
                      placeholder="Acme Corp"
                      value={company}
                      onChange={(e) => setCompany(e.target.value)}
                      className="pl-9"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="demo-team">Team Size</Label>
                  <div className="relative">
                    <Users className="absolute top-3 left-3 h-4 w-4 text-muted-foreground pointer-events-none" />
                    <select
                      id="demo-team"
                      value={teamSize}
                      onChange={(e) => setTeamSize(e.target.value)}
                      className="flex h-10 w-full rounded-md border border-input bg-background/50 pl-9 pr-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 appearance-none cursor-pointer"
                      required
                    >
                      <option value="" disabled>
                        Select size
                      </option>
                      <option value="1-10">1 - 10 developers</option>
                      <option value="11-50">11 - 50 developers</option>
                      <option value="51-200">51 - 200 developers</option>
                      <option value="200+">200+ developers</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="demo-message">What are you looking to automate?</Label>
                <Textarea
                  id="demo-message"
                  placeholder="PR analysis, security scanners, custom AI policies, etc."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="h-20 resize-none"
                />
              </div>

              <Button type="submit" className="w-full mt-2 cursor-pointer" disabled={loading}>
                {loading ? (
                  <span className="flex items-center gap-2">
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
                    Scheduling demo...
                  </span>
                ) : (
                  "Request Demo"
                )}
              </Button>
            </form>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center py-6 text-center">
            <span className="grid h-12 w-12 place-items-center rounded-full bg-success/10 text-success mb-4">
              <CheckCircle2 className="h-7 w-7" />
            </span>
            <DialogTitle className="text-xl font-bold text-foreground">
              Demo Request Received!
            </DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground mt-2 max-w-[340px] leading-relaxed">
              Thank you, {name}. We've sent a demo request confirmation to{" "}
              <strong className="text-foreground">{email}</strong>. Our engineering representative
              will reach out to you within 24 hours to schedule a session.
            </DialogDescription>
            <Button onClick={handleClose} className="mt-6 w-[120px] cursor-pointer">
              Close
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
