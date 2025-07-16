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
  selectedCountries: Country[];
  onCountrySelect: (countries: Country[]) => void;
  isLoading?: boolean;
}

export function CountrySelector({
  countries,
  selectedCountries,
  onCountrySelect,
  isLoading = false
}: CountrySelectorProps) {
  const [open, setOpen] = React.useState(false);

  const handleCountryToggle = (country: Country) => {
    const isSelected = selectedCountries.some(c => c.code === country.code);
    if (isSelected) {
      onCountrySelect(selectedCountries.filter(c => c.code !== country.code));
    } else {
      onCountrySelect([...selectedCountries, country]);
    }
  };

  const displayText = () => {
    if (selectedCountries.length === 0) {
      return "Select countries...";
    } else if (selectedCountries.length === 1) {
      return selectedCountries[0].name;
    } else {
      return `${selectedCountries.length} countries selected`;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5 }}
      className="w-full max-w-lg"
    >
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className={cn(
              "w-full justify-between rounded-2xl border-2 h-14 px-6 text-lg",
              "bg-card/50 backdrop-blur-sm",
              "hover:bg-card/80 transition-all duration-300",
              "focus:ring-2 focus:ring-primary/20",
              selectedCountries.length === 0 && "text-muted-foreground"
            )}
            disabled={isLoading}
          >
            <div className="flex items-center gap-3">
              {selectedCountries.length > 0 ? (
                <>
                  {selectedCountries.length === 1 ? (
                    <>
                      <span className="text-lg">{selectedCountries[0].flag}</span>
                      <span className="font-medium">{selectedCountries[0].name}</span>
                    </>
                  ) : (
                    <>
                      <div className="flex -space-x-1">
                        {selectedCountries.slice(0, 3).map((country, index) => (
                          <span 
                            key={country.code} 
                            className="text-sm border border-background rounded-full"
                            style={{ zIndex: 3 - index }}
                          >
                            {country.flag}
                          </span>
                        ))}
                        {selectedCountries.length > 3 && (
                          <span className="text-xs text-muted-foreground ml-1">
                            +{selectedCountries.length - 3}
                          </span>
                        )}
                      </div>
                      <span className="font-medium">{displayText()}</span>
                    </>
                  )}
                </>
              ) : (
                <>
                  <Search className="h-4 w-4" />
                  <span>{displayText()}</span>
                </>
              )}
            </div>
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        
        <PopoverContent className="w-[32rem] p-0 rounded-2xl border-2">
          <Command>
            <CommandInput 
              placeholder="Search countries..." 
              className="h-12"
            />
            <CommandEmpty>No country found.</CommandEmpty>
            <CommandGroup className="max-h-64 overflow-y-auto">
              {countries.map((country) => {
                const isSelected = selectedCountries.some(c => c.code === country.code);
                return (
                  <CommandItem
                    key={country.code}
                    value={`${country.name} ${country.code}`}
                    onSelect={() => handleCountryToggle(country)}
                    className="flex items-center gap-3 h-12 px-4 cursor-pointer"
                  >
                    <span className="text-lg">{country.flag}</span>
                    <span className="font-medium">{country.name}</span>
                    <Check
                      className={cn(
                        "ml-auto h-4 w-4",
                        isSelected ? "opacity-100" : "opacity-0"
                      )}
                    />
                  </CommandItem>
                );
              })}
            </CommandGroup>
          </Command>
        </PopoverContent>
      </Popover>
    </motion.div>
  );
}