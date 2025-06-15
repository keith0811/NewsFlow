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
import { Settings, Globe, Rss } from "lucide-react";

interface SourceManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SourceManagementModal({ isOpen, onClose }: SourceManagementModalProps) {
  const { toast } = useToast();

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
    const currentSources = userPreferences?.sources || [];
    const updatedSources = enabled 
      ? [...currentSources.filter(id => id !== sourceId.toString()), sourceId.toString()]
      : currentSources.filter(id => id !== sourceId.toString());

    updatePreferencesMutation.mutate({
      categories: userPreferences?.categories || [],
      sources: updatedSources,
      dailyReadingGoal: userPreferences?.dailyReadingGoal || 15,
    });
  };

  const handleCategoryToggle = (category: string, enabled: boolean) => {
    const currentCategories = userPreferences?.categories || [];
    const updatedCategories = enabled
      ? [...currentCategories.filter(cat => cat !== category), category]
      : currentCategories.filter(cat => cat !== category);

    updatePreferencesMutation.mutate({
      categories: updatedCategories,
      sources: userPreferences?.sources || [],
      dailyReadingGoal: userPreferences?.dailyReadingGoal || 15,
    });
  };

  const categories = [
    { id: 'technology', name: 'Technology', color: 'bg-blue-100 text-blue-800' },
    { id: 'ai', name: 'AI & Machine Learning', color: 'bg-purple-100 text-purple-800' },
    { id: 'business', name: 'Business', color: 'bg-green-100 text-green-800' },
    { id: 'markets', name: 'Markets', color: 'bg-orange-100 text-orange-800' },
  ];

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
              {categories.map((category) => {
                const isEnabled = userPreferences?.categories?.includes(category.id) ?? true;
                return (
                  <Card key={category.id} className={`cursor-pointer transition-colors ${isEnabled ? 'ring-2 ring-primary' : ''}`}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <Badge className={category.color}>
                            {category.name}
                          </Badge>
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
          </div>

          {/* News Sources */}
          <div>
            <h3 className="text-lg font-semibold mb-3">News Sources</h3>
            <div className="space-y-3">
              {sources?.map((source: any) => {
                const isEnabled = userPreferences?.sources?.includes(source.id.toString()) ?? true;
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