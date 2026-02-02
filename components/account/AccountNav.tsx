'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, User, CreditCard, Settings } from 'lucide-react';

const iconMap = {
  overview: LayoutDashboard,
  profile: User,
  subscription: CreditCard,
  settings: Settings,
};

interface NavItemProps {
  href: string;
  icon: keyof typeof iconMap;
  children: React.ReactNode;
}

export function AccountNavItem({ href, icon, children }: NavItemProps) {
  const pathname = usePathname();
  const isActive = pathname === href || (href !== '/my-account' && pathname.startsWith(href));
  const Icon = iconMap[icon];

  return (
    <li style={{ listStyle: 'none' }}>
      <Link
        href={href}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          padding: '10px 16px',
          borderRadius: 'var(--radius-md)',
          textDecoration: 'none',
          fontWeight: isActive ? 600 : 400,
          color: isActive ? 'var(--color-tint)' : 'var(--color-text-secondary)',
          backgroundColor: isActive ? 'rgba(0, 173, 181, 0.08)' : 'transparent',
          transition: 'all 200ms',
        }}
      >
        <Icon size={18} />
        <span>{children}</span>
      </Link>
    </li>
  );
}
