import { X, Clock, Users, ChefHat, Tag } from 'lucide-react';
import { Recipe } from '../types';

interface RecipeModalProps {
  recipe: Recipe;
  onClose: () => void;
  onAddToMeal: (mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack') => void;
}

export function RecipeModal({ recipe, onClose, onAddToMeal }: RecipeModalProps) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-card rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="sticky top-0 bg-card border-b border-border p-4 flex items-center justify-between z-10">
          <h2>{recipe.name}</h2>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-accent rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="p-6 space-y-6">
          <div className="aspect-video rounded-lg overflow-hidden bg-muted">
            <img 
              src={recipe.image} 
              alt={recipe.name}
              className="w-full h-full object-cover"
            />
          </div>
          
          <p className="text-muted-foreground">{recipe.description}</p>
          
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-muted-foreground" />
              <span>{recipe.time}</span>
            </div>
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-muted-foreground" />
              <span>{recipe.servings}</span>
            </div>
            <div className="flex items-center gap-2">
              <ChefHat className="w-5 h-5 text-muted-foreground" />
              <span>{recipe.difficulty}</span>
            </div>
          </div>
          
          <div className="flex flex-wrap gap-2">
            {recipe.tags.map((tag) => (
              <div key={tag} className="flex items-center gap-1 px-3 py-1 bg-accent rounded-full text-sm">
                <Tag className="w-3 h-3" />
                {tag}
              </div>
            ))}
          </div>
          
          <div>
            <h3 className="mb-3">Ingredients</h3>
            <ul className="space-y-2">
              {recipe.ingredients.map((ingredient, index) => (
                <li key={index} className="flex items-start gap-2">
                  <span className="text-primary mt-1">•</span>
                  <span className="text-muted-foreground">{ingredient}</span>
                </li>
              ))}
            </ul>
          </div>
          
          <div>
            <h3 className="mb-3">Instructions</h3>
            <ol className="space-y-3">
              {recipe.instructions.map((instruction, index) => (
                <li key={index} className="flex gap-3">
                  <span className="flex-shrink-0 w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm">
                    {index + 1}
                  </span>
                  <span className="text-muted-foreground pt-0.5">{instruction}</span>
                </li>
              ))}
            </ol>
          </div>
          
          <div className="border-t border-border pt-4">
            <h3 className="mb-3">Add to Meal Plan</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              <button
                onClick={() => onAddToMeal('breakfast')}
                className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity"
              >
                Breakfast
              </button>
              <button
                onClick={() => onAddToMeal('lunch')}
                className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity"
              >
                Lunch
              </button>
              <button
                onClick={() => onAddToMeal('dinner')}
                className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity"
              >
                Dinner
              </button>
              <button
                onClick={() => onAddToMeal('snack')}
                className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity"
              >
                Snack
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
