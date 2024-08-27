'use client'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import Link from 'next/link'
import React from 'react'

const Designs = () => {
  return (
    <div className='flex flex-col gap-4 p-5 w-full'>
      <h1 className='text-2xl font-extrabold'>Disenos</h1>
      <div className='flex flex-col gap-4'>
        <Button
          className='w-full bg-companyGradient border border-gray-200 rounded-md shadow'
        >
          <Link href={'/designs/create'}>Crear Diseno</Link>
        </Button>

        <Input
          type="text"
          placeholder="Buscar diseno por nombre de projecto o cliente"
          onChange={() => {}}
          className='border border-gray-200 rounded-md shadow'
        />

        <div className="space-y-4 pb-10">
          display Designs
        </div>
      </div>
    </div>
  )
}

export default Designs