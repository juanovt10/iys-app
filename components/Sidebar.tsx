'use client'

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { sidebarLinks } from '@/constants';
import { cn } from '@/lib/utils';

const Sidebar = () => {
  const pathname = usePathname();

  return (
    <section className="sidebar">
      <nav className="flex flex-col gap-4">
        <Link
          href={"/"}
          className='mb-5 cursor-pointer flex items-center gap-2'
        >
          <Image
            src='/images/logo.png'
            width={100}
            height={100}
            alt='logo'
          />
        </Link>

        {sidebarLinks.map((item) => {
          const isActive = pathname === item.route || pathname?.startsWith(`${item.route}/`);

          return (
            <Link 
              href={item.route}
              key={item.label}
              className={cn
                ('sidebar-link', {
                  'bg-companyGradient': isActive
                })}
            >
              <div className='relative size-6'>
                <Image 
                  src={item.imgURL}
                  alt={item.label}
                  fill
                  className={cn({'brightness-[3] invert-0': isActive})}
                />
              </div>
              <p className={cn('sidebar-label', {'!text-white': isActive})}>
                {item.label}
              </p>
            </Link>
          )
        })}
      </nav>
    </section>
  );
};

export default Sidebar;
