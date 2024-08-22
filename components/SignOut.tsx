import { Button } from '@/components/ui/button';
import { logout } from '@/lib/actions';

const SignOutButton = () => {
  return (
    <Button className='w-full' onClick={() => logout()}>Cerrar sesión</Button>
  );
};

export default SignOutButton;
