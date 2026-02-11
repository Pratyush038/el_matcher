"use client";

import { useAuth, useTeamStatus } from "@/lib/hooks";
import { useEffect, useState } from "react";
import { createSupabaseBrowser } from "@/lib/supabase/client";
import Link from "next/link";
import type { Team, TeamMember } from "@/lib/types";
import {
  Users,
  PlusCircle,
  KeyRound,
  Search,
  ArrowRight,
  Copy,
  Check,
  Hand,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

export default function DashboardPage() {
  const { user, loading } = useAuth();
  const { isInTeam, teamId } = useTeamStatus(user?.usn);
  const supabase = createSupabaseBrowser();
  const [myTeams, setMyTeams] = useState<(TeamMember & { team: Team })[]>([]);
  const [ledTeams, setLedTeams] = useState<Team[]>([]);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;

    async function fetchData() {
      const { data: memberOf } = await supabase
        .from("team_members")
        .select(
          "*, team:teams(*, project:projects(*), leader:students(name, usn))"
        )
        .eq("student_usn", user!.usn);

      setMyTeams(
        (memberOf || []) as unknown as (TeamMember & { team: Team })[]
      );

      const { data: leading } = await supabase
        .from("teams")
        .select(
          "*, project:projects(*), members:team_members(*, student:students(name, usn, branch:branches(name, code)))"
        )
        .eq("leader_usn", user!.usn);

      setLedTeams((leading || []) as unknown as Team[]);
    }
    fetchData();
  }, [user, supabase]);

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-4 w-48" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          Welcome, {user?.name}!
        </h1>
        <p className="text-muted-foreground">
          {user?.branch?.name} &bull; Semester {user?.semester || "N/A"} &bull;{" "}
          {user?.usn}
        </p>
      </div>

      {/* Quick Actions */}
      {isInTeam ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Link href={teamId ? `/teams/${teamId}` : "/dashboard"}>
            <Card className="hover:border-primary/50 transition-colors cursor-pointer group h-full">
              <CardContent className="pt-6">
                <Users className="text-primary mb-3" size={28} />
                <h3 className="font-semibold mb-1">Your Team</h3>
                <p className="text-sm text-muted-foreground">
                  View and manage your current team
                </p>
                <ArrowRight
                  className="text-muted-foreground/40 group-hover:text-primary mt-3 transition-colors"
                  size={18}
                />
              </CardContent>
            </Card>
          </Link>

          <Link href="/looking">
            <Card className="hover:border-purple-500/50 transition-colors cursor-pointer group h-full">
              <CardContent className="pt-6">
                <Hand className="text-purple-500 mb-3" size={28} />
                <h3 className="font-semibold mb-1">Find Members</h3>
                <p className="text-sm text-muted-foreground">
                  Browse students who are looking for a team
                </p>
                <ArrowRight
                  className="text-muted-foreground/40 group-hover:text-purple-500 mt-3 transition-colors"
                  size={18}
                />
              </CardContent>
            </Card>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link href="/teams/create">
            <Card className="hover:border-primary/50 transition-colors cursor-pointer group h-full">
              <CardContent className="pt-6">
                <PlusCircle className="text-primary mb-3" size={28} />
                <h3 className="font-semibold mb-1">Create a Team</h3>
                <p className="text-sm text-muted-foreground">
                  Start a new team and get an invite code
                </p>
                <ArrowRight
                  className="text-muted-foreground/40 group-hover:text-primary mt-3 transition-colors"
                  size={18}
                />
              </CardContent>
            </Card>
          </Link>

          <Link href="/teams/join">
            <Card className="hover:border-green-500/50 transition-colors cursor-pointer group h-full">
              <CardContent className="pt-6">
                <KeyRound className="text-amber-600 dark:text-amber-400 mb-3" size={28} />
                <h3 className="font-semibold mb-1">Join with Code</h3>
                <p className="text-sm text-muted-foreground">
                  Enter an invite code to join a friend&apos;s team
                </p>
                <ArrowRight
                  className="text-muted-foreground/40 group-hover:text-amber-600 dark:group-hover:text-amber-400 mt-3 transition-colors"
                  size={18}
                />
              </CardContent>
            </Card>
          </Link>

          <Link href="/browse">
            <Card className="hover:border-purple-500/50 transition-colors cursor-pointer group h-full">
              <CardContent className="pt-6">
                <Search className="text-purple-500 mb-3" size={28} />
                <h3 className="font-semibold mb-1">Find a Team</h3>
                <p className="text-sm text-muted-foreground">
                  Browse teams looking for your branch
                </p>
                <ArrowRight
                  className="text-muted-foreground/40 group-hover:text-purple-500 mt-3 transition-colors"
                  size={18}
                />
              </CardContent>
            </Card>
          </Link>
        </div>
      )}

      {/* Teams I Lead */}
      {ledTeams.length > 0 && (
        <section>
          <h2 className="text-lg font-semibold mb-4">Teams You Lead</h2>
          <div className="grid gap-4">
            {ledTeams.map((team) => (
              <Card key={team.id}>
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-semibold text-lg">{team.name}</h3>
                      <p className="text-sm text-muted-foreground">
                        {(team.project as unknown as { name: string })?.name ||
                          "No project"}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">
                        Invite:
                      </span>
                      <code className="bg-muted text-amber-600 dark:text-amber-400 px-3 py-1 rounded font-mono text-sm">
                        {team.invite_code}
                      </code>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => copyCode(team.invite_code)}
                      >
                        {copiedCode === team.invite_code ? (
                          <Check size={14} className="text-amber-600 dark:text-amber-400" />
                        ) : (
                          <Copy size={14} />
                        )}
                      </Button>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 mb-3">
                    <Users size={16} className="text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">
                      {team.members?.length || 0} member(s)
                    </span>
                    {team.is_open && <Badge variant="secondary">Open</Badge>}
                  </div>

                  {team.members && team.members.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {team.members.map((member) => (
                        <Badge key={member.id} variant="outline">
                          {
                            (
                              member.student as unknown as {
                                name: string;
                                usn: string;
                              }
                            )?.name
                          }{" "}
                          (
                          {
                            (member.student as unknown as { usn: string })?.usn
                          }
                          )
                        </Badge>
                      ))}
                    </div>
                  )}

                  <div className="mt-4">
                    <Button variant="link" className="px-0" asChild>
                      <Link href={`/teams/${team.id}`}>Manage Team &rarr;</Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      )}

      {/* Teams I'm a member of */}
      {myTeams.length > 0 && (
        <section>
          <h2 className="text-lg font-semibold mb-4">Teams You&apos;re In</h2>
          <div className="grid gap-4">
            {myTeams.map((tm) => (
              <Card key={tm.id}>
                <CardContent className="pt-6">
                  <h3 className="font-semibold">
                    {(tm.team as unknown as { name: string })?.name}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Led by{" "}
                    {
                      (
                        tm.team as unknown as {
                          leader: { name: string };
                        }
                      )?.leader?.name
                    }{" "}
                    &bull;{" "}
                    {
                      (
                        tm.team as unknown as {
                          project: { name: string };
                        }
                      )?.project?.name
                    }
                  </p>
                  <Button variant="link" className="px-0 mt-2" asChild>
                    <Link href={`/teams/${tm.team_id}`}>
                      View Team &rarr;
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      )}

      {myTeams.length === 0 && ledTeams.length === 0 && (
        <Card>
          <CardContent className="py-10 text-center">
            <Users className="text-muted-foreground mx-auto mb-4" size={48} />
            <h3 className="font-semibold text-lg mb-2">
              You&apos;re not in any teams yet
            </h3>
            <p className="text-muted-foreground mb-6">
              Create a new team, join one with a code, or browse teams looking
              for members.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
