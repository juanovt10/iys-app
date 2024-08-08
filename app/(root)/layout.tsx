import MobileNav from "@/components/MobileNav";
import Sidebar from "@/components/Sidebar";
import Image from "next/image";

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <main className="flex h-screen w-full font-inter">
      <Sidebar />
      
      <div className='flex size-full flex-col'>
        <div className='flex h-16 items-center justify-between p-5 sm:p-8 md:hidden'>
          <Image
            src='/images/logo.png'
            width={50}
            height={50}
            alt='menu icon'
          />
          <div>
            <MobileNav />
          </div>
        </div>
        {children}
      </div>
    </main>
  );
}
