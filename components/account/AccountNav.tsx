'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, User, CreditCard } from 'lucide-react';

const iconMap = {
  overview: LayoutDashboard,
  profile: User,
  subscription: CreditCard,
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
        className={`account-nav-link${isActive ? ' active' : ''}`}
      >
        <Icon size={18} />
        <span>{children}</span>
      </Link>
    </li>
  );
}
