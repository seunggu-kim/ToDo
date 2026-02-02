"use client";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { format } from "date-fns";
import { ko } from "date-fns/locale";
import { CheckCircle2, Circle, AlertCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface Todo {
    id: string;
    content: string;
    completed: boolean;
    carryOverCount: number;
    completedAt: string | null;
    date: string; // ISO String
}

interface MemberHistoryProps {
    member: {
        id: string;
        name: string | null;
        email: string;
        image: string | null;
        todos: Todo[];
        totalCount: number;
        completedCount: number;
        progress: number;
    };
}

export function HistoryMemberCard({ member }: MemberHistoryProps) {
    // Sort tasks into completed and pending/unfinished
    // Filter out tasks that are not done
    const completedTasks = member.todos.filter(t => t.completed);
    const pendingTasks = member.todos.filter(t => !t.completed);

    // Helper to format date label
    const getDateLabel = (dateStr: string) => {
        return format(new Date(dateStr), "M.d(eee)", { locale: ko });
    };

    // Group by date for cleaner list? Or just list them?
    // Let's list them with date badges for context

    return (
        <Card className="overflow-hidden">
            <CardHeader className="bg-muted/30 pb-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10 border">
                            <AvatarImage src={member.image || ""} />
                            <AvatarFallback>{member.name?.[0] || member.email[0]}</AvatarFallback>
                        </Avatar>
                        <div>
                            <div className="font-semibold">{member.name || "이름 없음"}</div>
                            <div className="text-xs text-muted-foreground">{member.email}</div>
                        </div>
                    </div>
                    <div className="text-right">
                        <div className="text-sm font-medium">
                            {member.completedCount} / {member.totalCount} 완료
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                            <Progress value={member.progress} className="w-24 h-2" />
                            <span className="text-xs text-muted-foreground">{member.progress}%</span>
                        </div>
                    </div>
                </div>
            </CardHeader>

            <CardContent className="p-0">
                <div className="grid md:grid-cols-2 divide-y md:divide-y-0 md:divide-x h-full">
                    {/* Completed Section */}
                    <div className="p-4 bg-green-50/30 flex flex-col h-full">
                        <h3 className="flex items-center gap-2 font-semibold text-green-700 mb-3">
                            <CheckCircle2 className="h-4 w-4" />
                            완료한 일
                        </h3>

                        {completedTasks.length > 0 ? (
                            <ul className="space-y-3">
                                {completedTasks.map((todo) => (
                                    <li key={todo.id} className="text-sm">
                                        <div className="flex items-start gap-2">
                                            <span className="mt-0.5 text-green-600/70">•</span>
                                            <span className="flex-1 text-foreground/90">
                                                {todo.content}
                                                <Badge variant="outline" className="ml-2 text-[10px] px-1 py-0 h-4 text-muted-foreground font-normal border-green-200">
                                                    {getDateLabel(todo.date)}
                                                </Badge>
                                            </span>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <p className="text-sm text-muted-foreground italic py-2">완료된 업무가 없습니다.</p>
                        )}
                    </div>

                    {/* Pending Section */}
                    <div className="p-4 bg-orange-50/30 flex flex-col h-full">
                        <h3 className="flex items-center gap-2 font-semibold text-orange-700 mb-3">
                            <AlertCircle className="h-4 w-4" />
                            못다한 일
                        </h3>

                        {pendingTasks.length > 0 ? (
                            <ul className="space-y-3">
                                {pendingTasks.map((todo) => (
                                    <li key={todo.id} className="text-sm">
                                        <div className="flex items-start gap-2">
                                            <span className="mt-0.5 text-orange-600/70">•</span>
                                            <span className="flex-1 text-foreground/90">
                                                {todo.content}
                                                <Badge variant="outline" className="ml-2 text-[10px] px-1 py-0 h-4 text-muted-foreground font-normal border-orange-200">
                                                    {getDateLabel(todo.date)}
                                                </Badge>
                                                {todo.carryOverCount > 0 && (
                                                    <span className="ml-1 text-[10px] text-orange-600 font-medium">
                                                        +{todo.carryOverCount}회 연기됨
                                                    </span>
                                                )}
                                            </span>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <p className="text-sm text-muted-foreground italic py-2">미완료된 업무가 없습니다.</p>
                        )}
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
