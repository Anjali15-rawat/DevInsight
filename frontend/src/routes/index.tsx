import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Navbar } from "@/components/landing/navbar";
import { Hero } from "@/components/landing/hero";
import { LogoCloud } from "@/components/landing/logo-cloud";
import { Features } from "@/components/landing/features";
import { ProductDemo } from "@/components/landing/product-demo";
import { Benefits } from "@/components/landing/benefits";
import { Testimonials } from "@/components/landing/testimonials";
import { Pricing } from "@/components/landing/pricing";
import { FAQ } from "@/components/landing/faq";
import { Footer } from "@/components/landing/footer";
import { BookDemoModal } from "@/components/landing/book-demo-modal";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "DevInsight — Engineering Intelligence, Powered by AI" },
      {
        name: "description",
        content:
          "AI-powered pull request reviews, issue triage, repository health, security detection, knowledge search, and engineering analytics — all in one platform.",
      },
      { property: "og:title", content: "DevInsight — Engineering Intelligence, Powered by AI" },
      {
        property: "og:description",
        content:
          "Automate code review, catch security risks, and understand your codebase with DevInsight.",
      },
    ],
  }),
  component: Index,
});

function Index() {
  const [showDemo, setShowDemo] = useState(false);

  const handleBookDemo = () => setShowDemo(true);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main>
        <Hero onBookDemo={handleBookDemo} />
        <LogoCloud />
        <Features />
        <ProductDemo />
        <Benefits />
        <Testimonials />
        <Pricing />
        <FAQ />
      </main>
      <Footer onBookDemo={handleBookDemo} />
      <BookDemoModal open={showDemo} onOpenChange={setShowDemo} />
    </div>
  );
}
