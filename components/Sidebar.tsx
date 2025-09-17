'use client'

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { sidebarLinks } from '@/constants';
import { useSessionRole } from '@/components/themes.provider';
import { cn } from '@/lib/utils';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar';
import SignOutButton from './SignOut';

const AppSidebar = () => {
  const pathname = usePathname();
  const { role } = useSessionRole();

  // Mock user data - in a real app this would come from your auth provider
  const user = {
    name: "Usuario",
    email: "usuario@empresa.com"
  };

  return (
    <Sidebar>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild className="px-2">
              <Link href="/" className='cursor-pointer'>
                <div className="flex size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                  <Image
                    src='/images/logo.png'
                    width={70}
                    height={70}
                    alt='logo'
                    className="rounded"
                  />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">IYS App</span>
                  <span className="truncate text-xs">Enterprise</span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent className="px-2">
        <SidebarMenu>
          {sidebarLinks.map((item) => {
            const isActive = pathname === item.route || pathname?.startsWith(`${item.route}/`);
            const isLocked = role === 'site_manager' && item.label !== 'Proyectos';

            return (
              <SidebarMenuItem key={item.label}>
                <SidebarMenuButton asChild isActive={isActive} disabled={isLocked} className={cn(
                  "group/item text-black hover:bg-companyGradient hover:text-white px-2",
                  isActive && "bg-companyGradient text-white",
                  // Force override shadcn defaults
                  "[&[data-active=true]]:bg-companyGradient [&[data-active=true]]:text-white"
                )}>
                  <Link href={isLocked ? '#': item.route} onClick={(e) => { if (isLocked) e.preventDefault(); }}>
                    <div className='relative size-4'>
                      <Image
                        src={isLocked ? '/icons/lock-closed.svg' : item.imgURL}
                        alt={item.label}
                        fill
                        className={cn(
                          'brightness-0',
                          'group-hover/item:brightness-0 group-hover/item:invert',
                          isActive && 'brightness-0 invert'
                        )}
                      />
                    </div>
                    <span className={cn('group-hover/item:text-white', isActive && 'text-white')}>{item.label}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            );
          })}
        </SidebarMenu>
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <div className="flex items-center gap-2 px-2 py-1.5 text-left text-sm">
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-semibold text-black">{user.name}</span>
                <span className="truncate text-xs text-gray-600">{user.email}</span>
              </div>
            </div>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SignOutButton />
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
};

export default AppSidebar;
