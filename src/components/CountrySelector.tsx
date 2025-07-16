import React from 'react';
import { motion } from 'framer-motion';
import { Check, ChevronsUpDown, Search } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Country } from '@/types/political';

interface CountrySelectorProps {
  countries: Country[];
  selectedCountry?: Country;
  onCountrySelect: (country: Country) => void;
  isLoading?: boolean;
}

export function CountrySelector({
  countries,
  selectedCountry,
  onCountrySelect,
  isLoading = false
}: CountrySelectorProps) {
  const [open, setOpen] = React.useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5 }}
      className="w-full max-w-sm"
    >
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className={cn(
              "w-full justify-between rounded-2xl border-2 h-12 px-4",
              "bg-card/50 backdrop-blur-sm",
              "hover:bg-card/80 transition-all duration-300",
              "focus:ring-2 focus:ring-primary/20",
              !selectedCountry && "text-muted-foreground"
            )}
            disabled={isLoading}
          >
            <div className="flex items-center gap-3">
              {selectedCountry ? (
                <>
                  <span className="text-lg">{selectedCountry.flag}</span>
                  <span className="font-medium">{selectedCountry.name}</span>
                </>
              ) : (
                <>
                  <Search className="h-4 w-4" />
                  <span>Select country...</span>
                </>
              )}
            </div>
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        
        <PopoverContent className="w-full p-0 rounded-2xl border-2">
          <Command>
            <CommandInput 
              placeholder="Search countries..." 
              className="h-12"
            />
            <CommandEmpty>No country found.</CommandEmpty>
            <CommandGroup className="max-h-64 overflow-y-auto">
              {countries.map((country) => (
                <CommandItem
                  key={country.code}
                  value={`${country.name} ${country.code}`}
                  onSelect={() => {
                    onCountrySelect(country);
                    setOpen(false);
                  }}
                  className="flex items-center gap-3 h-12 px-4 cursor-pointer"
                >
                  <span className="text-lg">{country.flag}</span>
                  <span className="font-medium">{country.name}</span>
                  <Check
                    className={cn(
                      "ml-auto h-4 w-4",
                      selectedCountry?.code === country.code
                        ? "opacity-100"
                        : "opacity-0"
                    )}
                  />
                </CommandItem>
              ))}
            </CommandGroup>
          </Command>
        </PopoverContent>
      </Popover>
    </motion.div>
  );
}