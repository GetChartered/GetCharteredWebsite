"use client";

import { useState, useEffect } from "react";
import { Moon, Sun, User, Menu, X, Home } from "lucide-react";
import { Button } from "@/components/ui";
import { useTheme } from "@/components/ThemeProvider";
import { useUser } from "@auth0/nextjs-auth0/client";
import { usePathname } from "next/navigation";
import Link from "next/link";

export function Navigation() {
  const { theme, setTheme } = useTheme();
  const { user } = useUser();
  const pathname = usePathname();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  const isOnMyAccount = pathname === "/my-account";

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
  }, [isMobileMenuOpen]);

  // Close menu on Escape key press
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isMobileMenuOpen) {
        setIsMobileMenuOpen(false);
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isMobileMenuOpen]);

  return (
    <>
      {/* Backdrop overlay for mobile menu */}
      {isMobileMenuOpen && (
        <div
          onClick={() => setIsMobileMenuOpen(false)}
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            zIndex: 40,
            transition: 'opacity 0.3s ease',
          }}
        />
      )}

      <nav
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 50,
          borderBottom: '1px solid var(--color-border-subtle)',
          backgroundColor: 'var(--color-card)',
          transition: 'all 0.3s ease',
        }}
      >
      <div className="container">
        <div
          className="flex items-center justify-between transition-all duration-300"
          style={{
            paddingTop: (isMobile || isScrolled) ? "12px" : "24px",
            paddingBottom: (isMobile || isScrolled) ? "12px" : "24px",
          }}
        >
          {/* Logo */}
          <Link
            href="/"
            className="flex items-center gap-4"
            style={{ textDecoration: "none" }}
          >
            <img
              src={theme === "dark" ? "/logo_dark.png" : "/logo_light.png"}
              alt="GetChartered Logo"
              suppressHydrationWarning
              style={{
                width: (isMobile || isScrolled) ? '43px' : '58px',
                height: (isMobile || isScrolled) ? '43px' : '58px',
                objectFit: 'contain',
                transition: 'all 0.3s ease',
              }}
            />
            <span
              className="text-kpi-title font-semibold transition-all duration-300"
              style={{
                fontSize: (isMobile || isScrolled) ? '24px' : '32px',
                color: 'var(--color-text)',
              }}
            >
              GetChartered
            </span>
          </Link>

          {/* Desktop Navigation Buttons */}
          <div className="nav-desktop items-center gap-3">
            <a href="/purchase" style={{ textDecoration: "none" }}>
              <Button variant="ghost" size="sm">
                Purchase
              </Button>
            </a>
            <a href="/resources" style={{ textDecoration: "none" }}>
              <Button variant="ghost" size="sm">
                Resources
              </Button>
            </a>
            <a href="/demos" style={{ textDecoration: "none" }}>
              <Button variant="ghost" size="sm">
                Demos
              </Button>
            </a>
            <a href={isOnMyAccount ? "/" : "/my-account"} style={{ textDecoration: "none" }}>
              <Button variant="ghost" size="sm">
                {isOnMyAccount ? (
                  <Home size={20} />
                ) : (
                  <User size={20} style={{ color: user ? '#10b981' : 'inherit' }} />
                )}
              </Button>
            </a>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            >
              {theme === "dark" ? <Sun size={20} /> : <Moon size={20} />}
            </Button>
          </div>

          {/* Mobile Menu Button */}
          <div className="nav-mobile items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </Button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div
            className="nav-mobile"
            style={{
              borderTop: '1px solid var(--color-border-subtle)',
              paddingTop: '16px',
              paddingBottom: '16px',
              flexDirection: 'column',
            }}
          >
            <div className="flex flex-col gap-2">
              <a
                href="/purchase"
                style={{ textDecoration: "none" }}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <Button variant="ghost" size="md" fullWidth>
                  Purchase
                </Button>
              </a>
              <a
                href="/resources"
                style={{ textDecoration: "none" }}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <Button variant="ghost" size="md" fullWidth>
                  Resources
                </Button>
              </a>
              <a
                href="/demos"
                style={{ textDecoration: "none" }}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <Button variant="ghost" size="md" fullWidth>
                  Demos
                </Button>
              </a>
              <a
                href={isOnMyAccount ? "/" : "/my-account"}
                style={{ textDecoration: "none" }}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <Button variant="ghost" size="md" fullWidth>
                  {isOnMyAccount ? (
                    <>
                      <Home size={20} style={{ marginRight: '8px' }} />
                      Home
                    </>
                  ) : (
                    <>
                      <User size={20} style={{ marginRight: '8px', color: user ? '#10b981' : 'inherit' }} />
                      My Account
                    </>
                  )}
                </Button>
              </a>
              <Button
                variant="ghost"
                size="md"
                fullWidth
                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              >
                {theme === "dark" ? <Sun size={20} style={{ marginRight: '8px' }} /> : <Moon size={20} style={{ marginRight: '8px' }} />}
                {theme === "dark" ? "Light Mode" : "Dark Mode"}
              </Button>
            </div>
          </div>
        )}
      </div>
    </nav>
    </>
  );
}
