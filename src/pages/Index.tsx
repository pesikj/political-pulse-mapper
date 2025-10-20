import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { AppHeader } from '@/components/AppHeader';
import { CountrySelector } from '@/components/CountrySelector';
import { PoliticalCompass } from '@/components/PoliticalCompass';
import { PartyDetailDrawer } from '@/components/PartyDetailDrawer';
import { IdeologyLegend } from '@/components/IdeologyLegend';
import { LoadingState, CompassSkeleton } from '@/components/LoadingState';
import { fetchCountries, fetchParties } from '@/data/databaseService';
import { Country, PoliticalParty, Ideology } from '@/types/political';

// Multi-country selector implementation

const Index = () => {
  const [selectedCountries, setSelectedCountries] = useState<Country[]>([]);
  const [selectedParty, setSelectedParty] = useState<PoliticalParty | null>(null);
  const [visibleIdeologies, setVisibleIdeologies] = useState<Set<Ideology>>(
    new Set(['liberal', 'conservative', 'libertarian', 'authoritarian', 'centrist', 'socialist', 'green'])
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // Fetch countries
  const { data: countries = [], isLoading: isLoadingCountries } = useQuery({
    queryKey: ['countries'],
    queryFn: fetchCountries,
  });

  // Fetch parties for selected countries
  const { data: parties = [], isLoading: isLoadingParties } = useQuery({
    queryKey: ['parties', selectedCountries.map(c => c.code).join(',')],
    queryFn: async () => {
      if (selectedCountries.length === 0) return [];
      const allParties = await Promise.all(
        selectedCountries.map(country => fetchParties(country.code))
      );
      return allParties.flat();
    },
    enabled: selectedCountries.length > 0,
  });

  // Filter parties based on visible ideologies and search query
  const filteredParties = useMemo(() => {
    return parties.filter(party => {
      const matchesIdeology = visibleIdeologies.has(party.ideology);
      const matchesSearch = searchQuery === '' || 
        party.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        party.shortName.toLowerCase().includes(searchQuery.toLowerCase());
      
      return matchesIdeology && matchesSearch;
    });
  }, [parties, visibleIdeologies, searchQuery]);

  // Count parties by ideology
  const partyCounts = useMemo(() => {
    const counts: Partial<Record<Ideology, number>> = {};
    parties.forEach(party => {
      counts[party.ideology] = (counts[party.ideology] || 0) + 1;
    });
    return counts;
  }, [parties]);

  const handleCountrySelect = (countries: Country[]) => {
    setSelectedCountries(countries);
    setSelectedParty(null);
    setIsDrawerOpen(false);
  };

  const handlePartyClick = (party: PoliticalParty) => {
    setSelectedParty(party);
    setIsDrawerOpen(true);
  };

  const handleToggleIdeology = (ideology: Ideology) => {
    setVisibleIdeologies(prev => {
      const newSet = new Set(prev);
      if (newSet.has(ideology)) {
        newSet.delete(ideology);
      } else {
        newSet.add(ideology);
      }
      return newSet;
    });
  };

  return (
    <div className="min-h-screen bg-gradient-bg">
      <AppHeader />
      
      <main className="container mx-auto px-6 py-8">
        {/* Controls Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8"
        >
          <div className="flex flex-col lg:flex-row gap-6 items-start">
            <div className="flex-1">
              <CountrySelector
                countries={countries}
                selectedCountries={selectedCountries}
                onCountrySelect={handleCountrySelect}
                isLoading={isLoadingCountries}
              />
            </div>
          </div>
        </motion.div>

        {/* Main Content */}
        <div className="min-h-[600px]">
          {selectedCountries.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6 }}
              className="text-center py-20"
            >
              <div className="max-w-md mx-auto">
                <div className="text-6xl mb-6">🌍</div>
                <h2 className="text-3xl font-bold mb-4 text-foreground">
                  Welcome to the World Political Compass
                </h2>
                <p className="text-lg text-muted-foreground mb-8">
                  Select one or more countries above to explore the political landscape and see where parties position themselves on economic and personal freedom.
                </p>
                <div className="grid grid-cols-2 gap-4 text-sm text-muted-foreground">
                  <div className="text-center">
                    <div className="font-medium">Economic Axis</div>
                    <div>Left ← → Right</div>
                  </div>
                  <div className="text-center">
                    <div className="font-medium">Personal Axis</div>
                    <div>Authoritarian ↑ ↓ Libertarian</div>
                  </div>
                </div>
              </div>
            </motion.div>
          ) : isLoadingParties ? (
            <CompassSkeleton />
          ) : filteredParties.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-20"
            >
              <div className="text-4xl mb-4">🔍</div>
              <h3 className="text-xl font-semibold mb-2">No parties found</h3>
              <p className="text-muted-foreground">
                Try adjusting your filters or search criteria.
              </p>
            </motion.div>
          ) : (
            <PoliticalCompass
              parties={filteredParties}
              onPartyClick={handlePartyClick}
              selectedParty={selectedParty}
            />
          )}
        </div>

        {/* Political Ideologies Section - Bottom of Page */}
        {selectedCountries.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="mt-12"
          >
            <IdeologyLegend
              visibleIdeologies={visibleIdeologies}
              onToggleIdeology={handleToggleIdeology}
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              partyCounts={partyCounts}
            />
          </motion.div>
        )}
      </main>

      {/* Party Detail Drawer */}
      <PartyDetailDrawer
        party={selectedParty}
        isOpen={isDrawerOpen}
        onClose={() => {
          setIsDrawerOpen(false);
          setSelectedParty(null);
        }}
      />
    </div>
  );
};

export default Index;
