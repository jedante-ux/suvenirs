'use client';

import { Search, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useState, useEffect } from 'react';

interface SearchBarProps {
  onSearchChange: (search: string) => void;
  initialValue?: string;
  placeholder?: string;
}

export default function SearchBar({
  onSearchChange,
  initialValue = '',
  placeholder = 'Buscar productos...'
}: SearchBarProps) {
  const [search, setSearch] = useState(initialValue);

  useEffect(() => {
    setSearch(initialValue);
  }, [initialValue]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearchChange(search);
  };

  const handleClear = () => {
    setSearch('');
    onSearchChange('');
  };

  return (
    <form onSubmit={handleSubmit} className="relative w-full">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          type="text"
          placeholder={placeholder}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10 pr-10"
        />
        {search && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleClear}
            className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>
    </form>
  );
}
