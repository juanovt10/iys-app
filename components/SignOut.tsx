import { logout } from '@/lib/actions';
import { SidebarMenuButton } from '@/components/ui/sidebar';
import { LogOut } from 'lucide-react';

const SignOutButton = () => {
  return (
    <SidebarMenuButton onClick={() => logout()} className="text-black hover:bg-companyGradient hover:text-white w-full justify-start px-2">
      <LogOut className="size-4" />
      <span>Cerrar Sesión</span>
    </SidebarMenuButton>
  );
};

export default SignOutButton;
