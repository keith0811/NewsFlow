import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Bookmark, StickyNote, List } from "lucide-react";
import SourceManagementModal from "@/components/SourceManagementModal";

interface SidebarProps {
  stats?: any;
  sources?: any[];
}

export default function Sidebar({ stats, sources }: SidebarProps) {
  const [showSourceModal, setShowSourceModal] = useState(false);
  
  const { data: bookmarkedArticles } = useQuery({
    queryKey: ['/api/user/articles/bookmarked'],
    retry: false,
  });

  const { data: userNotes } = useQuery({
    queryKey: ['/api/user/notes'],
    retry: false,
  });

  const readingProgress = stats?.articlesRead ? (stats.articlesRead / 15) * 100 : 0;
  const timeProgress = stats?.totalReadingTime ? Math.min((stats.totalReadingTime / 60) * 100, 100) : 0;

  return (
    <div className="space-y-6">
      {/* Reading Progress Dashboard */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Today's Progress</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span className="text-gray-500">Articles Read</span>
              <span className="font-medium">{stats?.articlesRead || 0}/15</span>
            </div>
            <Progress value={readingProgress} className="h-2" />
          </div>
          
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span className="text-gray-500">Reading Time</span>
              <span className="font-medium">{stats?.totalReadingTime || 0} min</span>
            </div>
            <Progress value={timeProgress} className="h-2" />
          </div>
          
          <div className="pt-4 border-t border-gray-200">
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">{stats?.streak || 0}</div>
              <div className="text-sm text-gray-500">Day Reading Streak</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Quick Actions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Button 
            variant="ghost" 
            className="w-full justify-start p-3 h-auto"
            onClick={() => {
              // TODO: Navigate to bookmarks
            }}
          >
            <Bookmark className="mr-3 h-5 w-5 text-primary" />
            <div className="text-left">
              <div className="font-medium">Saved Articles</div>
              <div className="text-sm text-gray-500">
                {bookmarkedArticles?.length || 0} articles
              </div>
            </div>
          </Button>
          
          <Button 
            variant="ghost" 
            className="w-full justify-start p-3 h-auto"
            onClick={() => {
              // TODO: Navigate to notes
            }}
          >
            <StickyNote className="mr-3 h-5 w-5 text-orange-500" />
            <div className="text-left">
              <div className="font-medium">My Notes</div>
              <div className="text-sm text-gray-500">
                {userNotes?.length || 0} notes
              </div>
            </div>
          </Button>
          
          <Button 
            variant="ghost" 
            className="w-full justify-start p-3 h-auto"
            onClick={() => {
              // TODO: Navigate to reading list
            }}
          >
            <List className="mr-3 h-5 w-5 text-green-600" />
            <div className="text-left">
              <div className="font-medium">Reading List</div>
              <div className="text-sm text-gray-500">8 articles</div>
            </div>
          </Button>
        </CardContent>
      </Card>

      {/* News Sources */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">News Sources</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {sources?.map((source: any) => (
            <div key={source.id} className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                  <span className="text-white text-xs font-bold">
                    {source.displayName.substring(0, 2).toUpperCase()}
                  </span>
                </div>
                <span className="font-medium">{source.displayName}</span>
              </div>
              <span className="text-sm text-gray-500">Active</span>
            </div>
          ))}
          
          <Button 
            variant="ghost" 
            className="w-full mt-4 text-primary hover:text-blue-700"
            onClick={() => setShowSourceModal(true)}
          >
            Manage Sources
          </Button>
        </CardContent>
      </Card>

      {/* Source Management Modal */}
      <SourceManagementModal
        isOpen={showSourceModal}
        onClose={() => setShowSourceModal(false)}
      />
    </div>
  );
}
