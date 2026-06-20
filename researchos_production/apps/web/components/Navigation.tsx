"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_ITEMS = [
  { href: "/",                   label: "Home",              short: "Home"    },
  { href: "/review-copilot",     label: "Review Copilot",   short: "Review"  },
  { href: "/claim-verification", label: "Claim Check",      short: "Claims"  },
  { href: "/reviewer-fatigue",   label: "Reviewer Fatigue", short: "Fatigue" },
  { href: "/research-memory",    label: "Research Memory",  short: "Memory"  },
  { href: "/badges",             label: "Badges",           short: "Badges"  },
  { href: "/copilot",            label: "Copilot",          short: "Chat"    },
  { href: "/supervisor",         label: "Supervisor",       short: "Super."  },
];

export function Navigation() {
  const pathname = usePathname();

  return (
    <nav style={{
      position: "sticky", top: 0, zIndex: 100,
      background: "rgba(10,13,20,.9)", backdropFilter: "blur(14px)",
      borderBottom: "1px solid rgba(255,255,255,.07)",
      padding: "0 16px",
      display: "flex", alignItems: "center", gap: 0,
      overflowX: "auto", scrollbarWidth: "none",
    }}>
      {/* Logo */}
      <Link href="/" style={{
        fontSize: 13, fontWeight: 900, color: "#fff",
        textDecoration: "none", padding: "14px 16px 14px 0",
        flexShrink: 0, marginRight: 8,
        borderRight: "1px solid rgba(255,255,255,.08)",
      }}>
        Research<span style={{ color: "#a78bfa" }}>OS</span>
      </Link>

      {/* Nav links */}
      {NAV_ITEMS.map(item => {
        const active = pathname === item.href ||
          (item.href !== "/" && pathname.startsWith(item.href));
        return (
          <Link key={item.href} href={item.href} style={{
            padding: "14px 12px",
            fontSize: 12, fontWeight: active ? 700 : 500,
            color: active ? "#fff" : "rgba(255,255,255,.45)",
            textDecoration: "none", whiteSpace: "nowrap",
            borderBottom: `2px solid ${active ? "#a78bfa" : "transparent"}`,
            transition: "color .15s, border-color .15s",
          }}>
            <span style={{ display: "none" }}
                  className="nav-full">{item.label}</span>
            <span>{item.short}</span>
          </Link>
        );
      })}

      {/* Right side: auth links */}
      <div style={{ marginLeft: "auto", display: "flex", gap: 6, flexShrink: 0 }}>
        <Link href="/login" style={{
          fontSize: 12, padding: "6px 12px", borderRadius: 7,
          border: "1px solid rgba(255,255,255,.12)",
          background: "transparent", color: "rgba(255,255,255,.55)",
          textDecoration: "none",
        }}>Sign in</Link>
        <Link href="/register" style={{
          fontSize: 12, padding: "6px 12px", borderRadius: 7,
          border: "none", background: "#7c3aed", color: "#fff",
          textDecoration: "none", fontWeight: 700,
        }}>Register</Link>
      </div>
    </nav>
  );
}
