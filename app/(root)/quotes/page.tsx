import React from 'react'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from "@/components/ui/input"




const Quotes = () => {
  return (
    <div className='flex flex-col gap-4 p-5 w-full'>
      {/* here is the title + breadcrumb layout inside layoyut? */}
      <h1 className='text-2xl font-extrabold'>Cotizaciones</h1>
      <div className='flex flex-col gap-4'>
        <Button className='w-full bg-companyGradient'>
          Crear Cotizacion
        </Button>

        <Input type="text" placeholder="Buscar cotización" />
        <div>
          <div className="p-4 border border-gray-200 rounded shadow">
            <p className="text-lg font-semibold">Quote content goes here</p>
            <p className="text-sm text-gray-600">- Author Name</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Quotes