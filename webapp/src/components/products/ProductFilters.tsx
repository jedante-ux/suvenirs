'use client';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { ArrowUpDown } from 'lucide-react';

export interface FilterOptions {
  sort: string;
  order: 'asc' | 'desc';
}

interface ProductFiltersProps {
  onFilterChange: (filters: FilterOptions) => void;
  initialFilters?: FilterOptions;
}

const SORT_OPTIONS = [
  { value: 'createdAt', label: 'Fecha de creación' },
  { value: 'name', label: 'Nombre' },
  { value: 'quantity', label: 'Stock disponible' },
];

const ORDER_OPTIONS = [
  { value: 'desc', label: 'Descendente' },
  { value: 'asc', label: 'Ascendente' },
];

export default function ProductFilters({
  onFilterChange,
  initialFilters = { sort: 'createdAt', order: 'desc' },
}: ProductFiltersProps) {
  const handleSortChange = (sort: string) => {
    onFilterChange({ ...initialFilters, sort });
  };

  const handleOrderChange = (order: 'asc' | 'desc') => {
    onFilterChange({ ...initialFilters, order });
  };

  return (
    <div className="flex flex-wrap gap-4 items-end">
      <div className="flex items-center gap-2">
        <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm font-medium">Ordenar por:</span>
      </div>

      <div className="flex gap-2">
        <div className="space-y-1.5">
          <Label htmlFor="sort" className="text-xs text-muted-foreground">
            Campo
          </Label>
          <Select
            value={initialFilters.sort}
            onValueChange={handleSortChange}
          >
            <SelectTrigger id="sort" className="w-[180px]">
              <SelectValue placeholder="Seleccionar..." />
            </SelectTrigger>
            <SelectContent>
              {SORT_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="order" className="text-xs text-muted-foreground">
            Orden
          </Label>
          <Select
            value={initialFilters.order}
            onValueChange={handleOrderChange}
          >
            <SelectTrigger id="order" className="w-[150px]">
              <SelectValue placeholder="Seleccionar..." />
            </SelectTrigger>
            <SelectContent>
              {ORDER_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
}
