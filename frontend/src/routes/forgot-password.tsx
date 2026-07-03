import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { GitPullRequest, Mail, ArrowLeft, CheckCircle2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export const Route = createFileRoute("/forgot-password")({
  component: ForgotPasswordComponent,
});

function ForgotPasswordComponent() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  const handleResetRequest = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setError("Please enter your email address.");
      return;
    }
    setError("");
    setLoading(true);

    setTimeout(() => {
      setLoading(false);
      setSubmitted(true);
    }, 1500);
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background px-4 py-12">
      {/* Background glow effects */}
      <div className="absolute inset-0 -z-10 bg-hero-glow opacity-30 dark:opacity-20" />
      <div className="absolute top-1/4 left-1/4 h-96 w-96 rounded-full bg-primary/10 blur-3xl" />
      <div className="absolute bottom-1/4 right-1/4 h-96 w-96 rounded-full bg-accent/10 blur-3xl" />

      <div className="w-full max-w-[440px]">
        {/* Logo */}
        <div className="mb-8 flex flex-col items-center text-center">
          <Link to="/" className="flex items-center gap-2.5">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-brand shadow-md shadow-primary/20">
              <GitPullRequest className="h-5 w-5 text-primary-foreground" />
            </span>
            <span className="font-display text-2xl font-extrabold tracking-tight text-foreground">
              DevInsight
            </span>
          </Link>
          <h2 className="mt-4 font-display text-xl font-bold text-foreground">Reset password</h2>
          <p className="mt-1.5 text-sm text-muted-foreground">
            We'll send you an email with password recovery instructions
          </p>
        </div>

        <Card className="border-border/50 bg-card/60 shadow-xl backdrop-blur-xl dark:bg-card/40">
          <CardHeader className="space-y-1 pb-4">
            <CardTitle className="text-lg">Recovery</CardTitle>
            <CardDescription>
              Enter the email associated with your DevInsight account
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {submitted ? (
              <div className="rounded-xl bg-success/10 p-4 text-center text-sm font-medium text-success-foreground border border-success/20">
                <CheckCircle2 className="mx-auto h-8 w-8 text-success mb-2" />
                <h3 className="font-bold text-base text-foreground">Check your inbox</h3>
                <p className="mt-1 text-xs text-muted-foreground max-w-xs mx-auto">
                  We have sent password reset instructions to{" "}
                  <strong className="text-foreground">{email}</strong>.
                </p>
              </div>
            ) : (
              <form onSubmit={handleResetRequest} className="space-y-4">
                {error && (
                  <div className="flex items-center gap-2 rounded-lg bg-destructive/10 p-3 text-xs font-medium text-destructive">
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <div className="relative">
                    <Mail className="absolute top-2.5 left-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="name@company.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-9"
                      required
                    />
                  </div>
                </div>

                <Button type="submit" className="w-full animate-fade-in" disabled={loading}>
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
                      Sending instructions...
                    </span>
                  ) : (
                    "Send Reset Link"
                  )}
                </Button>
              </form>
            )}
          </CardContent>

          <CardFooter className="flex justify-center border-t border-border/40 p-4 text-center">
            <Link
              to="/login"
              className="inline-flex items-center gap-2 text-xs font-semibold text-muted-foreground hover:text-foreground hover:underline"
            >
              <ArrowLeft className="h-4.5 w-4.5" /> Back to Sign In
            </Link>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
