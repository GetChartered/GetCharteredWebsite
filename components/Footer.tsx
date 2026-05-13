// components/Footer.tsx - NEW FILE (OPTIONAL)
// Reusable footer component with all your links

"use client";

import { useTheme } from "@/components/ThemeProvider";
import { useUser } from "@auth0/nextjs-auth0";
import Link from "next/link";
import { SUBSCRIPTIONS_ENABLED } from "@/lib/features";

export function Footer() {
  const { theme } = useTheme();
  const { user } = useUser();

  return (
    <footer
      className="border-t py-12"
      style={{ borderColor: "var(--color-border-subtle)" }}
    >
      <div className="container">
        {/* Logo & Description */}
        <div className="mb-8">
          <Link
            href="/"
            className="flex items-center gap-4 mb-4"
            style={{
              textDecoration: "none",
              width: "fit-content",
              transition: "opacity 0.2s ease",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.7")}
            onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
          >
            <img
              src={theme === "dark" ? "/logo_dark.png" : "/logo_light.png"}
              alt="GetChartered Logo"
              style={{ width: "38px", height: "38px", objectFit: "contain" }}
            />
            <span
              className="text-kpi-title"
              style={{ color: "var(--color-text)" }}
            >
              GetChartered
            </span>
          </Link>
          <p
            className="text-sm"
            style={{ color: "var(--color-text-secondary)" }}
          >
            Master your professional exams with confidence.
          </p>
        </div>

        {/* Product, Account, Legal - Side by Side */}
        <div className="grid grid-cols-3 gap-8 mb-8">
          {/* Product */}
          <div>
            <h4
              className="font-semibold mb-4"
              style={{ textDecoration: "underline" }}
            >
              Product
            </h4>
            <ul className="space-y-2" style={{ listStyle: "none" }}>
              {SUBSCRIPTIONS_ENABLED && (
                <li>
                  <Link
                    href="/purchase"
                    className="text-sm transition-colors"
                    style={{
                      color: "var(--color-text-secondary)",
                      textDecoration: "none",
                    }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.color = "var(--color-tint)")
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.color =
                        "var(--color-text-secondary)")
                    }
                  >
                    Purchase
                  </Link>
                </li>
              )}
              <li>
                <Link
                  href="/faq"
                  className="text-sm transition-colors"
                  style={{
                    color: "var(--color-text-secondary)",
                    textDecoration: "none",
                  }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.color = "var(--color-tint)")
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.color =
                      "var(--color-text-secondary)")
                  }
                >
                  FAQ
                </Link>
              </li>
            </ul>
          </div>

          {/* Account */}
          <div>
            <h4
              className="font-semibold mb-4"
              style={{ textDecoration: "underline" }}
            >
              Account
            </h4>
            <ul className="space-y-2" style={{ listStyle: "none" }}>
              <li>
                <Link
                  href="/my-account"
                  className="text-sm transition-colors"
                  style={{
                    color: "var(--color-text-secondary)",
                    textDecoration: "none",
                  }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.color = "var(--color-tint)")
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.color =
                      "var(--color-text-secondary)")
                  }
                >
                  My Account
                </Link>
              </li>
              {!user && (
                <li>
                  <a
                    href="/auth/login"
                    className="text-sm transition-colors"
                    style={{
                      color: "var(--color-text-secondary)",
                      textDecoration: "none",
                    }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.color = "var(--color-tint)")
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.color =
                        "var(--color-text-secondary)")
                    }
                  >
                    Sign In
                  </a>
                </li>
              )}
            </ul>
          </div>

          {/* Legal & Contact */}
          <div>
            <h4
              className="font-semibold mb-4"
              style={{ textDecoration: "underline" }}
            >
              Legal & Contact
            </h4>
            <ul className="space-y-2" style={{ listStyle: "none" }}>
              <li>
                <Link
                  href="/contact"
                  className="text-sm transition-colors"
                  style={{
                    color: "var(--color-text-secondary)",
                    textDecoration: "none",
                  }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.color = "var(--color-tint)")
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.color =
                      "var(--color-text-secondary)")
                  }
                >
                  Contact
                </Link>
              </li>
              <li>
                <Link
                  href="/privacy"
                  className="text-sm transition-colors"
                  style={{
                    color: "var(--color-text-secondary)",
                    textDecoration: "none",
                  }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.color = "var(--color-tint)")
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.color =
                      "var(--color-text-secondary)")
                  }
                >
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link
                  href="/terms"
                  className="text-sm transition-colors"
                  style={{
                    color: "var(--color-text-secondary)",
                    textDecoration: "none",
                  }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.color = "var(--color-tint)")
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.color =
                      "var(--color-text-secondary)")
                  }
                >
                  Terms & Conditions
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom */}
        <div
          className="pt-8 border-t text-center"
          style={{
            borderColor: "var(--color-border-subtle)",
            color: "var(--color-text-secondary)",
          }}
        >
          <p className="text-sm">
            © {new Date().getFullYear()} GetChartered. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
