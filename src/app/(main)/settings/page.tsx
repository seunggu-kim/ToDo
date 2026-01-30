"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

interface Team {
  id: string;
  name: string;
  inviteCode: string;
  slackWebhookUrl: string | null;
  members: {
    id: string;
    name: string | null;
    email: string;
  }[];
}

export default function SettingsPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [team, setTeam] = useState<Team | null>(null);
  const [slackWebhookUrl, setSlackWebhookUrl] = useState("");
  const [teamName, setTeamName] = useState("");

  useEffect(() => {
    fetchTeam();
  }, []);

  const fetchTeam = async () => {
    try {
      const response = await fetch("/api/team");
      const data = await response.json();
      
      if (data.team) {
        setTeam(data.team);
        setSlackWebhookUrl(data.team.slackWebhookUrl || "");
        setTeamName(data.team.name);
      } else {
        router.push("/team");
      }
    } catch {
      toast.error("팀 정보를 불러오는데 실패했습니다.");
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch("/api/team/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slackWebhookUrl, name: teamName }),
      });

      const data = await response.json();

      if (!response.ok) {
        toast.error(data.error);
      } else {
        toast.success("설정이 저장되었습니다.");
        setTeam(data);
      }
    } catch {
      toast.error("설정 저장 중 오류가 발생했습니다.");
    } finally {
      setIsLoading(false);
    }
  };

  const copyInviteCode = () => {
    if (team?.inviteCode) {
      navigator.clipboard.writeText(team.inviteCode);
      toast.success("초대 코드가 복사되었습니다.");
    }
  };

  const handleLeaveTeam = async () => {
    if (!confirm("정말 팀에서 탈퇴하시겠습니까? 모든 투두 데이터가 삭제됩니다.")) {
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch("/api/team/leave", {
        method: "POST",
      });

      const data = await response.json();

      if (!response.ok) {
        toast.error(data.error);
      } else {
        toast.success("팀에서 탈퇴했습니다.");
        router.push("/team");
      }
    } catch {
      toast.error("탈퇴 처리 중 오류가 발생했습니다.");
    } finally {
      setIsLoading(false);
    }
  };

  if (!team) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-muted-foreground">로딩 중...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">설정</h1>
        <p className="text-muted-foreground">
          팀 설정 및 슬랙 연동을 관리합니다.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>팀 정보</CardTitle>
          <CardDescription>팀 이름과 초대 코드를 확인하세요.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="teamName">팀 이름</Label>
            <Input
              id="teamName"
              value={teamName}
              onChange={(e) => setTeamName(e.target.value)}
              disabled={isLoading}
            />
          </div>
          <div className="space-y-2">
            <Label>초대 코드</Label>
            <div className="flex gap-2">
              <Input value={team.inviteCode} readOnly />
              <Button type="button" variant="outline" onClick={copyInviteCode}>
                복사
              </Button>
            </div>
            <p className="text-sm text-muted-foreground">
              이 코드를 팀원들에게 공유하세요.
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>팀원</CardTitle>
          <CardDescription>현재 팀에 속한 멤버들입니다.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {team.members.map((member) => (
              <div
                key={member.id}
                className="flex items-center justify-between py-2"
              >
                <div>
                  <p className="font-medium">{member.name || "이름 없음"}</p>
                  <p className="text-sm text-muted-foreground">{member.email}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>슬랙 연동</CardTitle>
          <CardDescription>
            슬랙 웹훅 URL을 설정하면 &quot;오늘 시작&quot; 시 팀 채널에 알림이 전송됩니다.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSaveSettings} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="slackWebhookUrl">슬랙 웹훅 URL</Label>
              <Input
                id="slackWebhookUrl"
                value={slackWebhookUrl}
                onChange={(e) => setSlackWebhookUrl(e.target.value)}
                placeholder="https://hooks.slack.com/services/..."
                disabled={isLoading}
              />
              <p className="text-sm text-muted-foreground">
                슬랙 앱 설정에서 Incoming Webhooks를 활성화하고 URL을 복사하세요.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button type="submit" disabled={isLoading}>
                {isLoading ? "저장 중..." : "설정 저장"}
              </Button>
              {team.slackWebhookUrl && (
                <Badge variant="secondary">연동됨</Badge>
              )}
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>슬랙 웹훅 설정 방법</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <ol className="list-decimal list-inside space-y-2">
            <li>슬랙 워크스페이스에서 앱 설정 페이지로 이동</li>
            <li>&quot;Incoming Webhooks&quot; 기능 활성화</li>
            <li>&quot;Add New Webhook to Workspace&quot; 클릭</li>
            <li>알림을 받을 채널 선택</li>
            <li>생성된 웹훅 URL을 위 입력란에 붙여넣기</li>
          </ol>
        </CardContent>
      </Card>

      <Card className="border-destructive">
        <CardHeader>
          <CardTitle className="text-destructive">위험 구역</CardTitle>
          <CardDescription>
            팀 탈퇴 시 모든 투두 데이터가 삭제됩니다. 이 작업은 되돌릴 수 없습니다.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button 
            variant="destructive" 
            onClick={handleLeaveTeam}
            disabled={isLoading}
          >
            팀 탈퇴하기
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
