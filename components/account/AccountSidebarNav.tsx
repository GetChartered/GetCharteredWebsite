"use client";

import { useEffect, useState } from "react";

interface SidebarSection {
  id: string;
  label: string;
}

const ALL_SECTIONS: SidebarSection[] = [
  { id: "practice", label: "Practice" },
  { id: "my-exams", label: "My Exams" },
  { id: "subscription", label: "Subscription" },
  { id: "security", label: "Security" },
];

// Same value as --account-sidebar-sticky-top in globals.css — kept as a
// literal here rather than read from CSS since IntersectionObserver's
// rootMargin can't reference a custom property. If that offset changes,
// update both.
const STICKY_OFFSET = 96;

/**
 * Jump-to-section links for the account sidebar (desktop: vertical list;
 * mobile: horizontal scrollable pills — see .account-sidebar-nav's media
 * query in globals.css, same markup either way). Smooth-scrolls to the
 * target section on click and highlights whichever section is currently
 * under the sticky offset as the user scrolls (scrollspy).
 *
 * Deliberately NOT an IntersectionObserver "detection band" (an early
 * version used one) — with a band tall enough to be useful, the compact,
 * closely-packed Subscription/Security rows can both intersect it at once,
 * and picking "whichever's last in document order" then reports Security as
 * active even when Subscription is what's actually pinned at the top of the
 * viewport (confirmed by scrolling to Subscription directly and watching
 * the wrong link light up). A single trigger *line* just below the sticky
 * offset avoids that ambiguity entirely: the active section is simply the
 * last one (in document order) whose top has scrolled up past that line —
 * there's no band width for two short sections to both fall inside.
 */
export function AccountSidebarNav({ includeSecurity }: { includeSecurity: boolean }) {
  const sections = includeSecurity ? ALL_SECTIONS : ALL_SECTIONS.filter((s) => s.id !== "security");
  const [activeId, setActiveId] = useState(sections[0]?.id ?? "");

  useEffect(() => {
    const elements = sections
      .map((s) => document.getElementById(s.id))
      .filter((el): el is HTMLElement => el !== null);
    if (elements.length === 0) return;

    const triggerLine = STICKY_OFFSET + 16;
    let ticking = false;

    const computeActive = () => {
      ticking = false;

      // The last section (Security, or Subscription when Security is
      // hidden) can sit close enough to the bottom of the page that there's
      // no longer enough scrollable content below it to ever push its top
      // up past the trigger line — Danger Zone + the footer just aren't
      // tall enough. Scrolled-to-bottom is itself an unambiguous "you're
      // looking at the last section" signal, so special-case it rather than
      // relying on the trigger line there.
      //
      // Gated on the page actually being taller than the viewport — without
      // this, a viewport tall enough to fit the whole page at once (a big
      // monitor, or simply not much content yet) has scrollY permanently 0
      // AND innerHeight+scrollY >= scrollHeight permanently true, which
      // would make this fire on initial load with no scrolling at all and
      // wrongly light up the last link instead of the first (confirmed via
      // a 1440x2600 viewport, where this fired at scrollY 0).
      const pageScrolls = document.documentElement.scrollHeight > window.innerHeight + 4;
      const atBottom =
        pageScrolls && window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 2;
      if (atBottom) {
        setActiveId(elements[elements.length - 1].id);
        return;
      }

      // Otherwise: sections are in document order top-to-bottom, so the
      // last one whose top has crossed the trigger line is "current";
      // before any of them have (top of page), this falls through to the
      // first section correctly.
      let current = elements[0].id;
      for (const el of elements) {
        if (el.getBoundingClientRect().top <= triggerLine) {
          current = el.id;
        } else {
          break;
        }
      }
      setActiveId(current);
    };

    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(computeActive);
    };

    computeActive();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
    // sections' identity is stable across renders for a given includeSecurity
    // value (derived fresh each render from a module-level const array, but
    // its *contents* never change once mounted) — re-running this effect
    // only when that value flips is correct and avoids re-binding the
    // listener on every unrelated re-render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [includeSecurity]);

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
    e.preventDefault();
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <nav className="account-sidebar-nav" aria-label="Account sections">
      {sections.map((s) => (
        <a
          key={s.id}
          href={`#${s.id}`}
          className={`account-sidebar-nav-link${activeId === s.id ? " active" : ""}`}
          onClick={(e) => handleClick(e, s.id)}
        >
          {s.label}
        </a>
      ))}
    </nav>
  );
}
