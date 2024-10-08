import React from 'react';
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Control, FieldPath, FieldValues } from 'react-hook-form';
import { formatWithCommas } from '@/lib/utils';

interface CustomInputProps<T extends FieldValues> {
  control: Control<T>;
  name: FieldPath<T>;
  label: string;
  placeholder: string;
}

const CustomInput = <T extends FieldValues>({
  control,
  name,
  label,
  placeholder,
}: CustomInputProps<T>) => {
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <div className="flex flex-col gap-1.5">
          <FormLabel className="text-14 w-full max-w-[280px] font-medium text-gray-700">
            {label}
          </FormLabel>
          <div className="flex w-full flex-col">
            <FormControl>
              <Input
                placeholder={placeholder}
                className="text-16 placeholder:text-16 rounded-lg border border-gray-300 text-gray-900 placeholder:text-gray-500"
                type={name === 'password' ? 'password' : 'text'}
                {...field}
              />
            </FormControl>
            <FormMessage className="text-12 text-red-500 mt-2" />
          </div>
        </div>
      )}
    />
  );
};

export default CustomInput;
