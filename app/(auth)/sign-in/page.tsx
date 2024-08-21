'use client'

import CustomInput from '@/components/CustomInput'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Form } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import supabase from '@/lib/supabase/client'
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

  const form = useForm<z.infer<typeof authSchema>>({
    resolver: zodResolver(authSchema),
    defaultValues: {
      email: '',
      password: '',
    }
  });

  const onSubmit = async (data: z.infer<typeof authSchema>) => {
    const { email, password } = data;

    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      setError(error.message);
    } else {
      // Redirect to the dashboard or another page on successful sign-in
      router.push('/');
    }
  };

  return (
    <div className='flex h-screen items-center justify-center'>
      <Card className="w-[350px]">
        <CardHeader className='flex flex-col items-center justify-center'>
          <Image
            src='/images/logo.png'
            width={60}
            height={60}
            alt='logo'
          />
          <CardTitle>Iniciar session</CardTitle>
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
                    label='Password'
                    placeholder='Ingrese su email'
                  />
                </div>
              </div>
              {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
              <CardFooter className="flex justify-beween">
                <Button variant="outline" onClick={() => router.push('/')}>Cancel</Button>
                <Button type="submit">Sign In</Button>
              </CardFooter>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  )
}

export default SignIn
