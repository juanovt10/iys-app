import React from 'react';
import {
  FormControl,
  FormField,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Control, FieldPath, FieldValues } from 'react-hook-form';
import { formatWithCommas } from '@/lib/utils';

interface CustomNumberInputProps<T extends FieldValues> {
  control: Control<T>;
  name: FieldPath<T>;
  label: string;
  placeholder: string;
}

const CustomNumberInput = <T extends FieldValues>({
  control,
  name,
  label,
  placeholder,
}: CustomNumberInputProps<T>) => {
  // Handle number input with formatting
  const handleNumberChange = (event: React.ChangeEvent<HTMLInputElement>, onChange: (value: number) => void) => {
    const inputValue = event.target.value;
    const sanitizedValue = inputValue.replace(/[^0-9]/g, '');
    const numberValue = Number(sanitizedValue);

    if (!isNaN(numberValue)) {
      onChange(numberValue);
    }
  };

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
                type="text" // Always use text to allow formatting
                value={formatWithCommas(field.value?.toString() || '')}
                onChange={(e) => handleNumberChange(e, field.onChange)}
              />
            </FormControl>
            <FormMessage className="text-12 text-red-500 mt-2" />
          </div>
        </div>
      )}
    />
  );
};

export default CustomNumberInput;
