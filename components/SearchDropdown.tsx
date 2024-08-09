import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { FormControl, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from '@/lib/utils';

interface SearchDropdownProps {
  items: any[];
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  onSelectItem: (item: any) => void;
  placeholder: string;
  selectedValue: string;
}

const SearchDropdown: React.FC<SearchDropdownProps> = ({
  items,
  searchTerm,
  setSearchTerm,
  onSelectItem,
  placeholder,
  selectedValue,
}) => {
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);

  return (
    <FormItem className="flex flex-col">
      <FormLabel>{placeholder}</FormLabel>
      <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
        <PopoverTrigger asChild>
          <FormControl>
            <Button
              variant="outline"
              role="combobox"
              className={cn(
                "w-full justify-between border-red-500 bg-red-50 cursor-pointer",
                !searchTerm && "text-muted-foreground"
              )}
            >
              {selectedValue || placeholder}
              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </FormControl>
        </PopoverTrigger>
        <PopoverContent className="w-full p-0">
          <Command>
            <CommandInput
              placeholder={`Search ${placeholder.toLowerCase()}...`}
            />
            <CommandList>
              <CommandEmpty>No items found.</CommandEmpty>
              <CommandGroup>
                {items
                  .filter(item => item.descripcion.toLowerCase().includes(searchTerm.toLowerCase()))
                  .map((item) => (
                    <CommandItem
                      value={item.descripcion}
                      key={item.id}
                      onSelect={() => onSelectItem(item)}
                    >
                      <Check className={`mr-2 h-4 w-4 ${item.descripcion === selectedValue ? "opacity-100" : "opacity-0"}`} />
                      {item.descripcion}
                    </CommandItem>
                  ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
      <FormMessage />
    </FormItem>
  );
};

export default SearchDropdown;
