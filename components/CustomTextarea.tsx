import React from 'react'
import { FormControl, FormField, FormLabel, FormMessage } from './ui/form'
import { Textarea } from './ui/textarea'
import { Control, FieldPath, FieldValues } from 'react-hook-form'

interface CustomTextareaProps<T extends FieldValues> {
  control: Control<T>;
  name: FieldPath<T>;
  label: string;
  placeholder: string;
}


// const CustomTextarea = ({ control, name, label, placeholder}: CustomTextarea) => {
const CustomTextarea = <T extends FieldValues>({
  control,
  name,
  label,
  placeholder,
}: CustomTextareaProps<T>) => {
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <div className='flex flex-col gap-1.5'>
          <FormLabel>
            {label}
          </FormLabel>
          <div className='flex w-full flex-col'>
            <FormControl>
              <Textarea
                placeholder={placeholder}
                className='text-16 placeholder:text-16 rounded-lg border border-gray-300 text-gray-900 placeholder:text-gray-500 resize-none'
                {...field}
              />
            </FormControl>
            <FormMessage
              className='text-12 text-red-500 mt-2'
            />
          </div>
        </div>
      )}
    />
  )
}

export default CustomTextarea