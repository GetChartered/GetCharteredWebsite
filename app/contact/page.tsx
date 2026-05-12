import { Mail } from "lucide-react";
import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";

const SUPPORT_EMAIL = "devs@getchartered.app";

export default function ContactPage() {
  return (
    <div className="min-h-screen">
      <Navigation />

      <section className="py-24">
        <div className="container">
          <div className="max-w-xl mx-auto text-center">
            <div
              className="rounded-full flex items-center justify-center mx-auto mb-6"
              style={{ backgroundColor: "rgba(0, 173, 181, 0.12)", width: "64px", height: "64px", flexShrink: 0 }}
            >
              <Mail size={28} style={{ color: "var(--accent-blue)" }} />
            </div>

            <h1 className="text-display mb-4">Get in Touch</h1>

            <p
              className="text-lg mb-8"
              style={{ color: "var(--color-text-secondary)" }}
            >
              Have a question, feedback, or want to partner with us? We&apos;d
              love to hear from you. Send us an email and we&apos;ll get back to
              you as soon as we can.
            </p>

            <a
              href={`mailto:${SUPPORT_EMAIL}`}
              className="btn btn-primary btn-lg"
              style={{ textDecoration: "none" }}
            >
              <Mail size={20} />
              Email Us
            </a>

            <p
              className="text-sm mt-6"
              style={{ color: "var(--color-text-muted)" }}
            >
              Or copy our address:{" "}
              <a
                href={`mailto:${SUPPORT_EMAIL}`}
                style={{ color: "var(--color-tint)", fontWeight: 600 }}
              >
                {SUPPORT_EMAIL}
              </a>
            </p>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
