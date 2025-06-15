import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import { Settings, Globe, Rss, Plus, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface SourceManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SourceManagementModal({ isOpen, onClose }: SourceManagementModalProps) {
  const { toast } = useToast();
  const [newCategory, setNewCategory] = useState("");
  const [customCategories, setCustomCategories] = useState<string[]>([]);

  const { data: sources, isLoading } = useQuery({
    queryKey: ['/api/sources'],
    enabled: isOpen,
    retry: false,
  });

  const { data: userPreferences } = useQuery({
    queryKey: ['/api/user/preferences'],
    enabled: isOpen,
    retry: false,
  });

  const updatePreferencesMutation = useMutation({
    mutationFn: async (preferences: any) => {
      await apiRequest('POST', '/api/user/preferences', preferences);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/user/preferences'] });
      toast({
        title: "Preferences updated",
        description: "Your source preferences have been saved",
      });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: "Failed to update preferences",
        variant: "destructive",
      });
    },
  });

  const refreshArticlesMutation = useMutation({
    mutationFn: async () => {
      await apiRequest('POST', '/api/articles/refresh');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/articles'] });
      toast({
        title: "Articles refreshed",
        description: "Latest articles have been fetched from all sources",
      });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: "Failed to refresh articles",
        variant: "destructive",
      });
    },
  });

  const handleSourceToggle = (sourceId: number, enabled: boolean) => {
    const currentSources = (userPreferences as any)?.sources || [];
    const updatedSources = enabled 
      ? [...currentSources.filter((id: string) => id !== sourceId.toString()), sourceId.toString()]
      : currentSources.filter((id: string) => id !== sourceId.toString());

    updatePreferencesMutation.mutate({
      categories: (userPreferences as any)?.categories || [],
      sources: updatedSources,
      dailyReadingGoal: (userPreferences as any)?.dailyReadingGoal || 15,
    });
  };

  const handleCategoryToggle = (category: string, enabled: boolean) => {
    const currentCategories = (userPreferences as any)?.categories || [];
    const updatedCategories = enabled
      ? [...currentCategories.filter((cat: string) => cat !== category), category]
      : currentCategories.filter((cat: string) => cat !== category);

    updatePreferencesMutation.mutate({
      categories: updatedCategories,
      sources: (userPreferences as any)?.sources || [],
      dailyReadingGoal: (userPreferences as any)?.dailyReadingGoal || 15,
    });
  };

  const handleAddCategory = () => {
    if (newCategory.trim() && !customCategories.includes(newCategory.trim())) {
      const categoryId = newCategory.trim().toLowerCase().replace(/\s+/g, '_');
      setCustomCategories(prev => [...prev, categoryId]);
      setNewCategory("");
      
      // Auto-enable the new category
      const currentCategories = (userPreferences as any)?.categories || [];
      updatePreferencesMutation.mutate({
        categories: [...currentCategories, categoryId],
        sources: (userPreferences as any)?.sources || [],
        dailyReadingGoal: (userPreferences as any)?.dailyReadingGoal || 15,
      });
    }
  };

  const handleRemoveCustomCategory = (categoryId: string) => {
    setCustomCategories(prev => prev.filter(cat => cat !== categoryId));
    
    // Remove from user preferences too
    const currentCategories = (userPreferences as any)?.categories || [];
    updatePreferencesMutation.mutate({
      categories: currentCategories.filter((cat: string) => cat !== categoryId),
      sources: (userPreferences as any)?.sources || [],
      dailyReadingGoal: (userPreferences as any)?.dailyReadingGoal || 15,
    });
  };

  const predefinedCategories = [
    { id: 'technology', name: 'Technology', color: 'bg-blue-100 text-blue-800' },
    { id: 'ai', name: 'AI & Machine Learning', color: 'bg-purple-100 text-purple-800' },
    { id: 'business', name: 'Business', color: 'bg-green-100 text-green-800' },
    { id: 'markets', name: 'Markets', color: 'bg-orange-100 text-orange-800' },
  ];

  const customCategoryItems = customCategories.map(catId => ({
    id: catId,
    name: catId.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
    color: 'bg-gray-100 text-gray-800',
    isCustom: true
  }));

  const allCategories = [...predefinedCategories, ...customCategoryItems];

  if (isLoading) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center">
              <Settings className="mr-2 h-5 w-5" />
              Manage Sources & Preferences
            </DialogTitle>
          </DialogHeader>
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-gray-600">Loading sources...</p>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <Settings className="mr-2 h-5 w-5" />
            Manage Sources & Preferences
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Category Preferences */}
          <div>
            <h3 className="text-lg font-semibold mb-3">Content Categories</h3>
            <div className="grid grid-cols-2 gap-3">
              {allCategories.map((category) => {
                const isEnabled = (userPreferences as any)?.categories?.includes(category.id) ?? true;
                return (
                  <Card key={category.id} className={`cursor-pointer transition-colors ${isEnabled ? 'ring-2 ring-primary' : ''}`}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <Badge className={category.color}>
                            {category.name}
                          </Badge>
                          {(category as any).isCustom && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleRemoveCustomCategory(category.id);
                              }}
                              className="text-gray-400 hover:text-red-500 p-1"
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          )}
                        </div>
                        <Switch
                          checked={isEnabled}
                          onCheckedChange={(checked) => handleCategoryToggle(category.id, checked)}
                          disabled={updatePreferencesMutation.isPending}
                        />
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
            
            {/* Add Custom Category */}
            <div className="mt-4 pt-4 border-t">
              <Label className="text-sm font-medium">Add Custom Category</Label>
              <div className="flex space-x-2 mt-2">
                <Input
                  placeholder="Enter category name..."
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      handleAddCategory();
                    }
                  }}
                  className="flex-1"
                />
                <Button
                  onClick={handleAddCategory}
                  disabled={!newCategory.trim() || updatePreferencesMutation.isPending}
                  size="sm"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* News Sources */}
          <div>
            <h3 className="text-lg font-semibold mb-3">News Sources</h3>
            <div className="space-y-3">
              {(sources as any)?.map((source: any) => {
                const isEnabled = (userPreferences as any)?.sources?.includes(source.id.toString()) ?? true;
                return (
                  <Card key={source.id}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
                            <Globe className="text-white h-5 w-5" />
                          </div>
                          <div>
                            <h4 className="font-medium">{source.displayName}</h4>
                            <p className="text-sm text-gray-500 capitalize">{source.category}</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge variant={source.isActive ? "default" : "secondary"}>
                            {source.isActive ? "Active" : "Inactive"}
                          </Badge>
                          <Switch
                            checked={isEnabled}
                            onCheckedChange={(checked) => handleSourceToggle(source.id, checked)}
                            disabled={updatePreferencesMutation.isPending || !source.isActive}
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-between pt-4 border-t">
            <Button
              variant="outline"
              onClick={() => refreshArticlesMutation.mutate()}
              disabled={refreshArticlesMutation.isPending}
              className="flex items-center"
            >
              <Rss className="mr-2 h-4 w-4" />
              {refreshArticlesMutation.isPending ? "Refreshing..." : "Refresh Articles"}
            </Button>
            
            <Button onClick={onClose}>
              Done
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}