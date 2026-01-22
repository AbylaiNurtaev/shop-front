import { Clock, Users, ChefHat } from 'lucide-react';
import { Recipe } from '../types';

interface RecipeCardProps {
  recipe: Recipe;
  onClick: () => void;
  compact?: boolean;
}

export function RecipeCard({ recipe, onClick, compact = false }: RecipeCardProps) {
  return (
    <div 
      onClick={onClick}
      className={`bg-card border border-border rounded-lg overflow-hidden cursor-pointer hover:shadow-lg transition-shadow ${compact ? 'h-full' : ''}`}
    >
      <div className={`${compact ? 'h-24' : 'h-32'} overflow-hidden bg-muted`}>
        <img 
          src={recipe.image} 
          alt={recipe.name}
          className="w-full h-full object-cover"
        />
      </div>
      <div className={`p-3 ${compact ? 'space-y-1' : 'space-y-2'}`}>
        <h3 className={`font-medium line-clamp-1 ${compact ? 'text-sm' : ''}`}>{recipe.name}</h3>
        {!compact && (
          <>
            <p className="text-sm text-muted-foreground line-clamp-2">{recipe.description}</p>
            <div className="flex items-center gap-3 text-xs text-muted-foreground pt-1">
              <div className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                <span>{recipe.time}</span>
              </div>
              <div className="flex items-center gap-1">
                <Users className="w-3 h-3" />
                <span>{recipe.servings}</span>
              </div>
              <div className="flex items-center gap-1">
                <ChefHat className="w-3 h-3" />
                <span>{recipe.difficulty}</span>
              </div>
            </div>
          </>
        )}
        {compact && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Clock className="w-3 h-3" />
            <span>{recipe.time}</span>
          </div>
        )}
      </div>
    </div>
  );
}
