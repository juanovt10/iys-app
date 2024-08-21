import React, { useState } from 'react';
import { Check, ChevronsUpDown } from "lucide-react";
import { Button } from '@/components/ui/button';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn, getDynamicMaxLength, truncateText } from '@/lib/utils';

interface SearchDropdownProps<T> {
  items: T[];
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  onSelectItem: (item: T) => void;
  placeholder: string;
  selectedValue?: string;
  searchProperty: keyof T;
}

const SearchDropdown = <T extends { id: number; descripcion: string }>({
  items,
  searchTerm,
  setSearchTerm,
  onSelectItem,
  placeholder,
  selectedValue,
  searchProperty,
}: SearchDropdownProps<T>) => {
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);

  console.log('Items in SearchDropdown:', items);
  console.log(truncateText("This is a very long text that should be truncated", 20));

  const maxLength = getDynamicMaxLength();

  return (
    <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          className={cn(
            "w-full justify-between border-red-500 bg-red-50 cursor-pointer",
            !searchTerm && "text-muted-foreground"
          )}
        >
          {searchTerm
            ? truncateText(String(items.find((item) => item[searchProperty] === searchTerm)?.[searchProperty] || ''), maxLength)
            : placeholder}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0">
        <Command>
          <CommandInput
            placeholder={`Buscar ${placeholder.toLowerCase()}...`}
            value={searchTerm}
            onValueChange={setSearchTerm}
          />
          <CommandList>
            <CommandEmpty>No se encontraron {placeholder.toLowerCase()}.</CommandEmpty>
            <CommandGroup>
              {items
                .filter(item => String(item[searchProperty])?.toLowerCase().includes(searchTerm.toLowerCase()))
                .map((item) => (
                  <CommandItem
                    value={String(item[searchProperty])}
                    key={item.id}
                    onSelect={() => {
                      onSelectItem(item);
                      setIsPopoverOpen(false);
                    }}
                  >
                    <Check className={`mr-2 h-4 w-4 ${String(item.id) === selectedValue ? "opacity-100" : "opacity-0"}`} />
                    {truncateText(String(item[searchProperty]) || 'Unnamed Item', maxLength)} {/* Apply truncation */}
                  </CommandItem>
                ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );

};

export default SearchDropdown;
