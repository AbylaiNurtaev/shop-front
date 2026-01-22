import { Plus, X } from 'lucide-react';
import { Recipe } from '../types';

interface MealSlotProps {
  meal?: Recipe;
  mealType: string;
  onAdd: () => void;
  onRemove: () => void;
}

export function MealSlot({ meal, mealType, onAdd, onRemove }: MealSlotProps) {
  if (!meal) {
    return (
      <button
        onClick={onAdd}
        className="h-24 border-2 border-dashed border-border rounded-lg flex flex-col items-center justify-center gap-1 hover:border-primary hover:bg-accent/50 transition-colors text-muted-foreground"
      >
        <Plus className="w-5 h-5" />
        <span className="text-xs">Add {mealType}</span>
      </button>
    );
  }
  
  return (
    <div className="relative h-24 border border-border rounded-lg overflow-hidden group">
      <div className="absolute inset-0 flex">
        <div className="w-24 flex-shrink-0 bg-muted">
          <img 
            src={meal.image} 
            alt={meal.name}
            className="w-full h-full object-cover"
          />
        </div>
        <div className="flex-1 p-2 flex flex-col justify-between min-w-0">
          <div>
            <p className="text-sm font-medium line-clamp-1">{meal.name}</p>
            <p className="text-xs text-muted-foreground">{meal.time}</p>
          </div>
        </div>
      </div>
      <button
        onClick={onRemove}
        className="absolute top-1 right-1 p-1 bg-destructive text-destructive-foreground rounded opacity-0 group-hover:opacity-100 transition-opacity"
      >
        <X className="w-3 h-3" />
      </button>
    </div>
  );
}
