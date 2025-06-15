import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Newspaper, BookOpen, Search, Bell } from "lucide-react";

export default function Landing() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-gray-100">
      <div className="container mx-auto px-4 py-16">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="flex justify-center items-center mb-6">
            <div className="w-16 h-16 bg-primary rounded-xl flex items-center justify-center">
              <Newspaper className="text-white text-2xl" />
            </div>
          </div>
          <h1 className="text-5xl font-bold text-gray-900 mb-4">NewsFlow</h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Your intelligent news companion. Stay informed with AI-enhanced articles, 
            personalized recommendations, and seamless reading tracking.
          </p>
        </div>

        {/* Features */}
        <div className="grid md:grid-cols-3 gap-8 mb-16">
          <Card className="text-center">
            <CardHeader>
              <div className="mx-auto w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                <Search className="text-primary" />
              </div>
              <CardTitle>Smart Aggregation</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                Curated news from top sources like TechCrunch, Reuters, and AI publications, 
                all in one place.
              </p>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardHeader>
              <div className="mx-auto w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mb-4">
                <BookOpen className="text-accent" />
              </div>
              <CardTitle>AI Enhancement</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                Get AI-powered summaries, key insights, and enhanced context 
                for every article you read.
              </p>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardHeader>
              <div className="mx-auto w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
                <Bell className="text-green-600" />
              </div>
              <CardTitle>Personal Dashboard</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                Track your reading progress, save articles, take notes, 
                and build your personal knowledge base.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* CTA */}
        <div className="text-center">
          <Button 
            size="lg" 
            className="bg-primary hover:bg-blue-700 text-white px-8 py-3 rounded-lg font-semibold"
            onClick={() => window.location.href = '/api/login'}
          >
            Get Started - Sign In
          </Button>
          <p className="text-sm text-gray-500 mt-4">
            Free to use • No credit card required
          </p>
        </div>
      </div>
    </div>
  );
}
