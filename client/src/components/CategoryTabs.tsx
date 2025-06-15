import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";

interface Category {
  id: string;
  name: string;
}

interface CategoryTabsProps {
  categories: Category[];
  selectedCategory: string;
  onCategoryChange: (categoryId: string) => void;
}

export default function CategoryTabs({ 
  categories, 
  selectedCategory, 
  onCategoryChange 
}: CategoryTabsProps) {
  return (
    <nav className="bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <ScrollArea className="w-full whitespace-nowrap">
          <div className="flex space-x-8 py-4">
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => onCategoryChange(category.id)}
                className={cn(
                  "flex-shrink-0 pb-2 font-medium transition-colors",
                  selectedCategory === category.id
                    ? "text-primary border-b-2 border-primary"
                    : "text-gray-500 hover:text-gray-900"
                )}
              >
                {category.name}
              </button>
            ))}
          </div>
        </ScrollArea>
      </div>
    </nav>
  );
}
