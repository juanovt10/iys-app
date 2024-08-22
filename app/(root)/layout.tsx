import MobileNav from "@/components/MobileNav";
import Sidebar from "@/components/Sidebar";
import { createClient } from "@/lib/supabase/server";
import Image from "next/image";
import { redirect } from "next/navigation";

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {

  const supabase = createClient()

  const { data, error } = await supabase.auth.getUser()
  if (error || !data?.user) {
    redirect('/')
  }

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
        <div className="flex-grow overflow-y-auto">
          {children}
        </div>
      </div>
    </main>
  );
}
