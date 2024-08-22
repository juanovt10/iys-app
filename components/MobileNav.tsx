// 'use client'

// import {
//   Sheet,
//   SheetClose,
//   SheetContent,
//   SheetDescription,
//   SheetFooter,
//   SheetHeader,
//   SheetTitle,
//   SheetTrigger,
// } from "@/components/ui/sheet"
// import Image from "next/image"
// import Link from "next/link"
// import { sidebarLinks } from '@/constants'
// import { usePathname } from 'next/navigation'
// import { cn } from '@/lib/utils'
// import { Button } from "./ui/button"
// import { Label } from "./ui/label"
// import { Input } from "./ui/input"
// import { logout } from "@/lib/actions"

// const MobileNav = () => {
//   const pathname = usePathname();

//   return (
//     <Sheet>
//       <SheetTrigger asChild>
//         <Button variant="outline">
//           <Image
//               src='/icons/hamburger.svg'
//               width={30}
//               height={30}
//               alt="menu"
//               className="cursor-pointer"
//             />
//         </Button>
//       </SheetTrigger>
//       <SheetContent side='right' className="border-none bg-white">
//         <Link href='/' className='cursor-pointer flex justify-center items-center'>
//           <Image
//             src='/images/logo.png'
//             width={60}
//             height={60}
//             alt='logo'
//           />
//         </Link>
//         <div className="flex h-[calc(100vh-72px)] flex-col justify-between overflow-y-auto">
//           <SheetClose asChild>
//             <nav className="flex flex-col pt-5 gap-6 text-white">
//             {sidebarLinks.map((item) => {
//                   const isActive = pathname === item.route || pathname?.startsWith(`${item.route}/`);
//                   return (
//                     <SheetClose asChild key={item.route}>
//                       <Link
//                         href={item.route}
//                         key={item.label}
//                         className={cn
//                           ('flex gap-3 items-center p-4 rounded-lg max-w-60 w-full', {
//                             'bg-companyGradient': isActive
//                           })}
//                       >
//                         <Image
//                           src={item.imgURL}
//                           alt={item.label}
//                           width={20}
//                           height={20}
//                           className={cn({ 'brightness-[3] invert-0': isActive })}
//                         />
//                         <p className={cn('text-16 font-semibold text-black', { '!text-white': isActive })}>
//                           {item.label}
//                         </p>
//                       </Link>
//                     </SheetClose>
//                   )
//             })}
//             </nav>
//             <Button onClick={() => logout()}>Sign Out</Button>
//           </SheetClose>
//         </div>
//       </SheetContent>
//     </Sheet>
//   )
// }

// export default MobileNav

'use client'

import { usePathname } from 'next/navigation'; // Assuming you're using Next.js
import Link from 'next/link';
import Image from 'next/image';
import { Sheet, SheetTrigger, SheetContent, SheetClose } from '@/components/ui/sheet'; // Adjust the import according to your structure
import { Button } from '@/components/ui/button'; // Adjust the import according to your structure
import { cn } from '@/lib/utils'; // Assuming you have a utility for conditional class names
import { sidebarLinks } from '@/constants'; // Adjust to your actual sidebar links source
import { logout } from '@/lib/actions';

const MobileNav = () => {
  const pathname = usePathname();

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline">
          <Image
            src='/icons/hamburger.svg'
            width={30}
            height={30}
            alt="menu"
            className="cursor-pointer"
          />
        </Button>
      </SheetTrigger>
      <SheetContent side='right' className="border-none bg-white">
        <Link href='/' className='cursor-pointer flex justify-center items-center'>
          <Image
            src='/images/logo.png'
            width={60}
            height={60}
            alt='logo'
          />
        </Link>
        <div className="flex h-[calc(100vh-72px)] flex-col justify-between overflow-y-auto">
          <nav className="flex flex-col pt-5 gap-6 text-white">
            {sidebarLinks.map((item) => {
              const isActive = pathname === item.route || pathname?.startsWith(`${item.route}/`);
              return (
                <SheetClose asChild key={item.route}>
                  <Link
                    href={item.route}
                    className={cn(
                      'flex gap-3 items-center p-4 rounded-lg max-w-60 w-full', {
                        'bg-companyGradient': isActive
                      })}
                  >
                    <Image
                      src={item.imgURL}
                      alt={item.label}
                      width={20}
                      height={20}
                      className={cn({ 'brightness-[3] invert-0': isActive })}
                    />
                    <p className={cn('text-16 font-semibold text-black', { '!text-white': isActive })}>
                      {item.label}
                    </p>
                  </Link>
                </SheetClose>
              );
            })}
          </nav>
          <SheetClose className='mb-10' asChild>
            <Button onClick={() => logout()}>Cerrar session</Button>
          </SheetClose>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default MobileNav;
