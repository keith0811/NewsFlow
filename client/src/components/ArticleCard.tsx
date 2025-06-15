import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Bookmark, StickyNote, Share2, Clock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import { cn } from "@/lib/utils";
import NoteModal from "@/components/NoteModal";

interface ArticleCardProps {
  article: any;
  featured?: boolean;
}

export default function ArticleCard({ article, featured = false }: ArticleCardProps) {
  const { toast } = useToast();
  const [isBookmarked, setIsBookmarked] = useState(article.userArticle?.isBookmarked || false);
  const [showNotesModal, setShowNotesModal] = useState(false);

  const bookmarkMutation = useMutation({
    mutationFn: async () => {
      await apiRequest('POST', '/api/user/articles', {
        articleId: article.id,
        isBookmarked: !isBookmarked,
      });
    },
    onSuccess: () => {
      setIsBookmarked(!isBookmarked);
      toast({
        title: isBookmarked ? "Bookmark removed" : "Article bookmarked",
        description: isBookmarked ? "Article removed from bookmarks" : "Article saved to bookmarks",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/user/articles'] });
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
        description: "Failed to update bookmark",
        variant: "destructive",
      });
    },
  });

  const handleShare = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: article.title,
          url: article.url,
        });
      } catch (error) {
        // User cancelled sharing
      }
    } else {
      // Fallback - copy to clipboard
      navigator.clipboard.writeText(article.url);
      toast({
        title: "Link copied",
        description: "Article link copied to clipboard",
      });
    }
  };

  const cardClass = cn(
    "bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow",
    featured && "md:col-span-2"
  );

  const imageHeight = featured ? "h-48 sm:h-64" : "h-40";

  const trackReadingMutation = useMutation({
    mutationFn: async () => {
      // Mark article as read
      await apiRequest('POST', '/api/user/articles', {
        articleId: article.id,
        isRead: true,
      });
      
      // Add to reading history for analytics
      await apiRequest('POST', '/api/user/reading-history', {
        articleId: article.id,
        readingTime: article.readingTime || 5,
      });
    },
    onSuccess: () => {
      // Invalidate cache to update reading stats
      queryClient.invalidateQueries({ queryKey: ['/api/user/stats'] });
      queryClient.invalidateQueries({ queryKey: ['/api/user/articles'] });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        // User is not logged in, still open the article
        return;
      }
    },
  });

  const handleArticleClick = () => {
    // Track that the article was read
    trackReadingMutation.mutate();
    
    // Open the original article
    window.open(article.url, '_blank', 'noopener,noreferrer');
  };

  return (
    <Card className={cardClass} onClick={handleArticleClick} style={{ cursor: 'pointer' }}>
      {/* Article Image */}
      {article.imageUrl && (
        <img 
          src={article.imageUrl} 
          alt={article.title}
          className={cn("w-full object-cover", imageHeight)}
        />
      )}
      
      <CardContent className="p-5">
        {/* Article Meta */}
        <div className="flex items-center space-x-2 mb-3">
          {featured && (
            <Badge className="bg-primary text-white">Featured</Badge>
          )}
          <span className="text-gray-500 text-sm">
            {article.source?.displayName || 'Unknown Source'}
          </span>
          <span className="text-gray-500 text-sm">•</span>
          <span className="text-gray-500 text-sm">
            {new Date(article.publishedAt).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric'
            })}
          </span>
        </div>
        
        {/* Title */}
        <h3 className={cn(
          "font-semibold text-gray-900 mb-2 leading-tight",
          featured ? "text-2xl mb-3" : "text-lg"
        )}>
          {article.title}
        </h3>
        
        {/* Summary */}
        <p className={cn(
          "text-gray-600 leading-relaxed mb-4",
          featured ? "text-base" : "text-sm"
        )}>
          {article.summary || article.aiSummary}
        </p>
        
        {/* Actions */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                bookmarkMutation.mutate();
              }}
              disabled={bookmarkMutation.isPending}
              className="text-gray-500 hover:text-primary"
            >
              <Bookmark className={cn("h-4 w-4", isBookmarked && "fill-current")} />
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              className="text-gray-500 hover:text-primary"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setShowNotesModal(true);
              }}
            >
              <StickyNote className="h-4 w-4" />
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={handleShare}
              className="text-gray-500 hover:text-primary"
            >
              <Share2 className="h-4 w-4" />
            </Button>
          </div>
          
          <div className="flex items-center space-x-2 text-xs text-gray-500">
            <Clock className="h-3 w-3" />
            <span>{article.readingTime || 5} min read</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
