import { useQuery } from "@tanstack/react-query";
import { useState } from "react";

interface Article {
  id: number;
  title: string;
  summary: string;
  url: string;
  category: string;
  published_at: string;
}

export default function SimpleHome() {
  const [refreshing, setRefreshing] = useState(false);
  
  const { data: articles = [], isLoading, refetch } = useQuery<Article[]>({
    queryKey: ['/api/articles'],
  });

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      const response = await fetch('/api/refresh');
      const result = await response.json();
      console.log(result.message);
      refetch();
    } catch (error) {
      console.error('Refresh failed:', error);
    } finally {
      setRefreshing(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">NewsFlow</h1>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="bg-white p-6 rounded-lg shadow animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2 mb-4"></div>
                <div className="h-3 bg-gray-200 rounded w-full"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">NewsFlow</h1>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
          >
            {refreshing ? 'Refreshing...' : 'Refresh News'}
          </button>
        </div>

        {articles.length === 0 ? (
          <div className="text-center py-12">
            <h2 className="text-xl font-semibold text-gray-600 mb-4">No articles yet</h2>
            <p className="text-gray-500 mb-6">Click "Refresh News" to load the latest articles</p>
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
            >
              {refreshing ? 'Loading...' : 'Load Articles'}
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {articles.map((article) => (
              <article key={article.id} className="bg-white p-6 rounded-lg shadow hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start mb-2">
                  <h2 className="text-xl font-semibold text-gray-900 mb-2 flex-1">
                    <a 
                      href={article.url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="hover:text-blue-600 transition-colors"
                    >
                      {article.title}
                    </a>
                  </h2>
                  <span className="text-xs font-medium text-blue-600 bg-blue-100 px-2 py-1 rounded-full ml-4">
                    {article.category}
                  </span>
                </div>
                
                <p className="text-gray-600 mb-3 leading-relaxed">
                  {article.summary}
                </p>
                
                <div className="flex justify-between items-center text-sm text-gray-500">
                  <time dateTime={article.published_at}>
                    {new Date(article.published_at).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </time>
                  <a 
                    href={article.url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-800 font-medium"
                  >
                    Read Full Article →
                  </a>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}