"use client";

import { useState } from "react";
import { createSupabaseBrowser } from "@/lib/supabase/client";
import { useAuth, useTeamStatus } from "@/lib/hooks";
import { useRouter } from "next/navigation";
import { AlertCircle } from "lucide-react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export default function JoinTeamPage() {
  const { user } = useAuth();
  const { isInTeam, teamId } = useTeamStatus(user?.usn);
  const supabase = createSupabaseBrowser();
  const router = useRouter();

  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setLoading(true);

    // Find team by invite code
    const { data: team, error: teamErr } = await supabase
      .from("teams")
      .select("*, project:projects(*, constraints:project_constraints(*, cluster:clusters(*))), members:team_members(*, student:students(*, branch:branches(*, cluster:clusters(*))))")
      .eq("invite_code", code.toUpperCase().trim())
      .single();

    if (teamErr || !team) {
      toast.error("Invalid invite code. Please check and try again.");
      setLoading(false);
      return;
    }

    if (!team.is_open) {
      toast.error("This team is no longer accepting members.");
      setLoading(false);
      return;
    }

    // Check if already a member
    const alreadyMember = team.members?.some(
      (m: { student_usn: string }) => m.student_usn === user.usn
    );
    if (alreadyMember) {
      toast.error("You are already a member of this team.");
      setLoading(false);
      return;
    }

    // Check team size limit
    if (team.members && team.members.length >= team.project?.max_team_size) {
      toast.error("This team is already full.");
      setLoading(false);
      return;
    }

    // Check cluster constraints
    if (team.project?.constraints && user.branch?.cluster) {
      for (const constraint of team.project.constraints) {
        if (constraint.cluster_id === user.branch.cluster_id) {
          const clusterCount = team.members?.filter(
            (m: { student?: { branch?: { cluster_id?: string } } }) => m.student?.branch?.cluster_id === constraint.cluster_id
          ).length || 0;
          if (clusterCount >= constraint.max_members) {
            toast.error(
              `Cannot join: max ${constraint.max_members} members from ${constraint.cluster?.name || "this cluster"} already reached.`
            );
            setLoading(false);
            return;
          }
        }
      }
    }

    // Join the team
    const { error: joinErr } = await supabase.from("team_members").insert({
      team_id: team.id,
      student_usn: user.usn,
    });

    if (joinErr) {
      toast.error(joinErr.message);
      setLoading(false);
      return;
    }

    toast.success("Successfully joined the team!");
    router.push(`/teams/${team.id}`);
  };

  if (isInTeam) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Card className="max-w-md w-full text-center">
          <CardContent className="pt-8 pb-8">
            <AlertCircle className="mx-auto mb-4 text-muted-foreground" size={48} />
            <h2 className="text-xl font-bold mb-2">Already in a Team</h2>
            <p className="text-muted-foreground mb-6">
              You&apos;re already a member of a team. You must leave your
              current team before joining another one.
            </p>
            <Button asChild>
              <Link href={teamId ? `/teams/${teamId}` : "/dashboard"}>
                Go to Your Team
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>Join a Team</CardTitle>
          <CardDescription>
            Enter the 8-character invite code shared by your team leader
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleJoin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="code">Invite Code</Label>
              <Input
                id="code"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="e.g. ABCD1234"
                className="text-center font-mono text-lg tracking-widest uppercase"
                maxLength={8}
                required
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Joining..." : "Join Team"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
