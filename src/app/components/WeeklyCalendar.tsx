import { MealSlot } from './MealSlot';
import { MealPlan, Recipe } from '../types';

interface WeeklyCalendarProps {
  mealPlan: MealPlan;
  onAddMeal: (day: string, mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack') => void;
  onRemoveMeal: (day: string, mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack') => void;
}

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const MEAL_TYPES: Array<'breakfast' | 'lunch' | 'dinner' | 'snack'> = ['breakfast', 'lunch', 'dinner', 'snack'];

export function WeeklyCalendar({ mealPlan, onAddMeal, onRemoveMeal }: WeeklyCalendarProps) {
  return (
    <div className="bg-card rounded-lg border border-border overflow-hidden">
      <div className="overflow-x-auto">
        <div className="min-w-[900px]">
          {/* Header */}
          <div className="grid grid-cols-8 border-b border-border bg-muted/50">
            <div className="p-3 border-r border-border">
              <span className="font-medium">Meal</span>
            </div>
            {DAYS.map((day) => (
              <div key={day} className="p-3 border-r border-border last:border-r-0">
                <span className="font-medium">{day.slice(0, 3)}</span>
              </div>
            ))}
          </div>
          
          {/* Meal Rows */}
          {MEAL_TYPES.map((mealType) => (
            <div key={mealType} className="grid grid-cols-8 border-b border-border last:border-b-0">
              <div className="p-3 border-r border-border bg-muted/30 flex items-center">
                <span className="font-medium capitalize">{mealType}</span>
              </div>
              {DAYS.map((day) => (
                <div key={`${day}-${mealType}`} className="p-2 border-r border-border last:border-r-0">
                  <MealSlot
                    meal={mealPlan[day]?.[mealType]}
                    mealType={mealType}
                    onAdd={() => onAddMeal(day, mealType)}
                    onRemove={() => onRemoveMeal(day, mealType)}
                  />
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
