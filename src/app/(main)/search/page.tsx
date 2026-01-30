"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search as SearchIcon } from "lucide-react";
import { toast } from "sonner";

interface SearchResult {
  date: string;
  todos: {
    id: string;
    content: string;
    completed: boolean;
    carryOverCount: number;
  }[];
}

interface SearchData {
  query: string;
  results: SearchResult[];
  totalCount: number;
}

export default function SearchPage() {
  const [query, setQuery] = useState("");
  const [searchData, setSearchData] = useState<SearchData | null>(null);
  const [isSearching, setIsSearching] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!query.trim()) {
      toast.error("검색어를 입력해주세요.");
      return;
    }

    setIsSearching(true);

    try {
      const response = await fetch(`/api/todos/search?q=${encodeURIComponent(query.trim())}`);
      const data = await response.json();

      if (!response.ok) {
        toast.error(data.error);
      } else {
        setSearchData(data);
        if (data.totalCount === 0) {
          toast.info("검색 결과가 없습니다.");
        }
      }
    } catch {
      toast.error("검색 중 오류가 발생했습니다.");
    } finally {
      setIsSearching(false);
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("ko-KR", {
      year: "numeric",
      month: "long",
      day: "numeric",
      weekday: "short",
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">할일 검색</h1>
        <p className="text-muted-foreground">
          과거 할일을 검색하세요 (최근 90일)
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>검색</CardTitle>
          <CardDescription>할일 내용으로 검색합니다</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSearch} className="flex gap-2">
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="검색어를 입력하세요..."
              className="flex-1"
              autoFocus
            />
            <Button type="submit" disabled={isSearching}>
              <SearchIcon className="h-4 w-4 mr-2" />
              {isSearching ? "검색 중..." : "검색"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {searchData && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">
              &quot;{searchData.query}&quot; 검색 결과
            </h2>
            <Badge variant="secondary">
              {searchData.totalCount}개 발견
            </Badge>
          </div>

          {searchData.results.length > 0 ? (
            searchData.results.map((result) => (
              <Card key={result.date}>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">
                    {formatDate(result.date)}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {result.todos.map((todo) => (
                    <div
                      key={todo.id}
                      className={`flex items-start gap-2 p-2 rounded text-sm ${
                        todo.completed ? "text-muted-foreground" : ""
                      }`}
                    >
                      <span className="mt-0.5">
                        {todo.completed ? "✓" : "○"}
                      </span>
                      <span className={todo.completed ? "line-through" : ""}>
                        {todo.content}
                      </span>
                      {todo.carryOverCount > 0 && (
                        <Badge variant="outline" className="text-xs ml-auto">
                          {todo.carryOverCount}회 이월
                        </Badge>
                      )}
                    </div>
                  ))}
                </CardContent>
              </Card>
            ))
          ) : (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                검색 결과가 없습니다.
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {!searchData && (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            검색어를 입력하고 검색 버튼을 눌러주세요.
          </CardContent>
        </Card>
      )}
    </div>
  );
}
