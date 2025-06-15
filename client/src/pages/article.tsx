import { useParams } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useState } from "react";
import Header from "@/components/Header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, Bookmark, StickyNote, Share2, Clock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import NoteModal from "@/components/NoteModal";
import { isUnauthorizedError } from "@/lib/authUtils";

export default function Article() {
  const { id } = useParams();
  const { toast } = useToast();
  const [showNotes, setShowNotes] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);

  const { data: article, isLoading } = useQuery({
    queryKey: [`/api/articles/${id}`],
    retry: false,
  });

  const { data: notes } = useQuery({
    queryKey: ['/api/user/notes', { articleId: id }],
    retry: false,
  });

  const bookmarkMutation = useMutation({
    mutationFn: async () => {
      await apiRequest('POST', '/api/user/articles', {
        articleId: parseInt(id!),
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

  const markAsReadMutation = useMutation({
    mutationFn: async () => {
      await apiRequest('POST', '/api/user/articles', {
        articleId: parseInt(id!),
        isRead: true,
        readAt: new Date().toISOString(),
      });
    },
    onSuccess: () => {
      // Track reading history
      apiRequest('POST', '/api/user/reading-history', {
        articleId: parseInt(id!),
        readingTime: article?.readingTime || 5,
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
    },
  });

  // Mark as read when component mounts
  useState(() => {
    if (article) {
      markAsReadMutation.mutate();
    }
  });

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: article?.title,
          url: article?.url,
        });
      } catch (error) {
        // User cancelled sharing
      }
    } else {
      // Fallback - copy to clipboard
      navigator.clipboard.writeText(article?.url || '');
      toast({
        title: "Link copied",
        description: "Article link copied to clipboard",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <main className="max-w-4xl mx-auto px-4 py-8">
          <div className="space-y-6">
            <Skeleton className="h-8 w-24" />
            <Skeleton className="h-12 w-full" />
            <div className="flex space-x-4">
              <Skeleton className="h-6 w-20" />
              <Skeleton className="h-6 w-20" />
            </div>
            <Skeleton className="h-64 w-full" />
            <div className="space-y-4">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (!article) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <main className="max-w-4xl mx-auto px-4 py-8">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <h1 className="text-2xl font-bold text-gray-900 mb-4">Article Not Found</h1>
                <p className="text-gray-600 mb-4">The article you're looking for doesn't exist.</p>
                <Button onClick={() => window.history.back()}>
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Go Back
                </Button>
              </div>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <main className="max-w-4xl mx-auto px-4 py-8">
        {/* Back button */}
        <Button 
          variant="ghost" 
          className="mb-6"
          onClick={() => window.history.back()}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Articles
        </Button>

        <Card>
          <CardContent className="pt-6">
            {/* Article meta */}
            <div className="flex items-center space-x-2 mb-4">
              <Badge variant="secondary">{article.category}</Badge>
              <span className="text-muted-foreground text-sm">•</span>
              <span className="text-muted-foreground text-sm">
                {new Date(article.publishedAt).toLocaleDateString()}
              </span>
              <span className="text-muted-foreground text-sm">•</span>
              <div className="flex items-center text-muted-foreground text-sm">
                <Clock className="mr-1 h-3 w-3" />
                {article.readingTime} min read
              </div>
            </div>

            {/* Title */}
            <h1 className="text-3xl font-bold text-gray-900 mb-6 leading-tight">
              {article.title}
            </h1>

            {/* Article actions */}
            <div className="flex items-center space-x-4 mb-6">
              <Button
                variant="outline"
                size="sm"
                onClick={() => bookmarkMutation.mutate()}
                disabled={bookmarkMutation.isPending}
              >
                <Bookmark className={`mr-2 h-4 w-4 ${isBookmarked ? 'fill-current' : ''}`} />
                {isBookmarked ? 'Bookmarked' : 'Bookmark'}
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowNotes(true)}
              >
                <StickyNote className="mr-2 h-4 w-4" />
                Notes {notes?.length ? `(${notes.length})` : ''}
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={handleShare}
              >
                <Share2 className="mr-2 h-4 w-4" />
                Share
              </Button>
            </div>

            <Separator className="mb-6" />

            {/* AI Summary */}
            {article.aiSummary && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <h3 className="font-semibold text-blue-900 mb-2">AI Summary</h3>
                <p className="text-blue-800">{article.aiSummary}</p>
              </div>
            )}

            {/* Article content */}
            <div className="prose prose-lg max-w-none">
              <div dangerouslySetInnerHTML={{ __html: article.content }} />
            </div>

            {/* AI Enhancement */}
            {article.aiEnhancement && (
              <>
                <Separator className="my-8" />
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
                  <h3 className="font-semibold text-gray-900 mb-4">AI Analysis & Context</h3>
                  <div className="prose prose-gray max-w-none">
                    <div dangerouslySetInnerHTML={{ __html: article.aiEnhancement }} />
                  </div>
                </div>
              </>
            )}

            {/* Original article link */}
            <div className="mt-8 pt-6 border-t border-gray-200">
              <p className="text-sm text-muted-foreground">
                Read the original article at{" "}
                <a 
                  href={article.url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  {new URL(article.url).hostname}
                </a>
              </p>
            </div>
          </CardContent>
        </Card>
      </main>

      {/* Notes Modal */}
      <NoteModal
        isOpen={showNotes}
        onClose={() => setShowNotes(false)}
        articleId={parseInt(id!)}
        articleTitle={article.title}
      />
    </div>
  );
}
