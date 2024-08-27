'use client'

import CustomInput from '@/components/CustomInput'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Form } from '@/components/ui/form'
import { login, signup } from '@/lib/actions'
import { authSchema } from '@/lib/utils'
import { zodResolver } from '@hookform/resolvers/zod'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import React, { useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'

const SignIn = () => {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  

  const form = useForm<z.infer<typeof authSchema>>({
    resolver: zodResolver(authSchema),
    defaultValues: {
      email: '',
      password: '',
    }
  });

  const onSubmit = async (data: z.infer<typeof authSchema>) => {
    setIsLoading(true);

    try {
      const formData = new FormData();
      formData.append('email', data.email);
      formData.append('password', data.password);
  
      await login(formData); 
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to log in.');
    } finally {
      setIsLoading(false);
    }
  };


  return (
    <div className='flex min-h-screen items-center justify-center'>
      <Card className="w-[350px]">
        <CardHeader className='flex flex-col items-center justify-center'>
          <Image
            src='/images/logo.png'
            width={60}
            height={60}
            alt='logo'
          />
          <CardTitle className='text-center'>Infraestructura y Señalizacion</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)}>
              <div className="grid w-full items-center gap-4">
                <div className="flex flex-col space-y-1.5">
                  <CustomInput 
                    control={form.control}
                    name="email"
                    label='Email'
                    placeholder='Ingrese su email'
                  />
                </div>
                <div className="flex flex-col space-y-1.5">
                  <CustomInput
                    control={form.control}
                    name="password"
                    label='Contraseña'
                    placeholder='Ingrese su contraseña'
                  />
                </div>
                <Button
                  className="w-full"
                  type='submit'
                  disabled={isLoading}
                >
                  {isLoading ? (
                    'Iniciando sesión...'
                  ) : (
                    'Iniciar sesión'
                  )}
                </Button>
              </div>
              {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  )
}

export default SignIn
