"use client";

import { useState } from "react";
import { createSupabaseBrowser } from "@/lib/supabase/client";
import { useAuth, useBranches, useTeamStatus } from "@/lib/hooks";
import { useRouter } from "next/navigation";
import { nanoid } from "nanoid";
import { Copy, Check, X, AlertCircle } from "lucide-react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";

export default function CreateTeamPage() {
  const { user, loading: authLoading } = useAuth();
  const { isInTeam, teamId, loading: teamStatusLoading } = useTeamStatus(user?.usn);
  const { clusters } = useBranches();
  const supabase = createSupabaseBrowser();
  const router = useRouter();

  const [teamName, setTeamName] = useState("");
  const [projectName, setProjectName] = useState("");
  const [projectDesc, setProjectDesc] = useState("");
  const [minSize, setMinSize] = useState(2);
  const [maxSize, setMaxSize] = useState(5);
  const [constraints, setConstraints] = useState<
    { cluster_id: string; max_members: number }[]
  >([]);

  const [loading, setLoading] = useState(false);
  const [createdCode, setCreatedCode] = useState<string | null>(null);
  const [createdTeamId, setCreatedTeamId] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const addConstraint = () => {
    if (clusters.length > 0) {
      setConstraints([
        ...constraints,
        { cluster_id: clusters[0].id, max_members: 2 },
      ]);
    }
  };

  const removeConstraint = (idx: number) => {
    setConstraints(constraints.filter((_, i) => i !== idx));
  };

  const updateConstraint = (
    idx: number,
    field: "cluster_id" | "max_members",
    value: string | number
  ) => {
    const updated = [...constraints];
    if (field === "cluster_id") updated[idx].cluster_id = value as string;
    else updated[idx].max_members = value as number;
    setConstraints(updated);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast.error("You must be signed in with a student profile to create a team.");
      return;
    }
    setLoading(true);

    const inviteCode = nanoid(8).toUpperCase();

    const { data: project, error: projErr } = await supabase
      .from("projects")
      .insert({
        name: projectName,
        description: projectDesc || null,
        min_team_size: minSize,
        max_team_size: maxSize,
        created_by: user.usn,
      })
      .select()
      .single();

    if (projErr || !project) {
      toast.error(projErr?.message || "Failed to create project");
      setLoading(false);
      return;
    }

    if (constraints.length > 0) {
      const { error: conErr } = await supabase
        .from("project_constraints")
        .insert(
          constraints.map((c) => ({
            project_id: project.id,
            cluster_id: c.cluster_id,
            max_members: c.max_members,
          }))
        );

      if (conErr) {
        toast.error(conErr.message);
        setLoading(false);
        return;
      }
    }

    const { data: team, error: teamErr } = await supabase
      .from("teams")
      .insert({
        name: teamName,
        project_id: project.id,
        leader_usn: user.usn,
        invite_code: inviteCode,
      })
      .select()
      .single();

    if (teamErr || !team) {
      toast.error(teamErr?.message || "Failed to create team");
      setLoading(false);
      return;
    }

    await supabase.from("team_members").insert({
      team_id: team.id,
      student_usn: user.usn,
    });

    // Turn off looking_for_team since they now have a team
    await supabase
      .from("students")
      .update({ looking_for_team: false })
      .eq("usn", user.usn);

    setCreatedCode(inviteCode);
    setCreatedTeamId(team.id);
    setLoading(false);
    toast.success("Team created successfully!");
  };

  const copyCode = () => {
    if (createdCode) {
      navigator.clipboard.writeText(createdCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (authLoading || teamStatusLoading) {
    return (
      <div className="max-w-2xl mx-auto space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (createdCode) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Card className="max-w-md w-full text-center">
          <CardContent className="pt-8 pb-8">
            <div className="w-16 h-16 bg-amber-400/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <Check className="text-amber-600 dark:text-amber-400" size={32} />
            </div>
            <h2 className="text-xl font-bold mb-2">Team Created!</h2>
            <p className="text-muted-foreground mb-6">
              Share this invite code with your teammates:
            </p>
            <div className="flex items-center justify-center gap-3 mb-6">
              <code className="bg-muted text-amber-600 dark:text-amber-400 px-6 py-3 rounded-lg font-mono text-2xl tracking-wider">
                {createdCode}
              </code>
              <Button variant="ghost" size="icon" onClick={copyCode}>
                {copied ? (
                  <Check size={20} className="text-amber-600 dark:text-amber-400" />
                ) : (
                  <Copy size={20} />
                )}
              </Button>
            </div>
            <div className="flex gap-3 justify-center">
              <Button onClick={() => router.push(`/teams/${createdTeamId}`)}>
                Manage Team
              </Button>
              <Button
                variant="outline"
                onClick={() => router.push("/dashboard")}
              >
                Go to Dashboard
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isInTeam && !createdCode) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Card className="max-w-md w-full text-center">
          <CardContent className="pt-8 pb-8">
            <AlertCircle className="mx-auto mb-4 text-muted-foreground" size={48} />
            <h2 className="text-xl font-bold mb-2">Already in a Team</h2>
            <p className="text-muted-foreground mb-6">
              You&apos;re already a member of a team. You must leave your
              current team before creating a new one.
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
    <div className="max-w-2xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>Create a Team</CardTitle>
          <CardDescription>
            Set up your team and get an invite code to share with friends
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleCreate} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="teamName">Team Name</Label>
              <Input
                id="teamName"
                value={teamName}
                onChange={(e) => setTeamName(e.target.value)}
                placeholder="e.g. Team Alpha"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="projectName">Project / Subject Name</Label>
              <Input
                id="projectName"
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                placeholder="e.g. EL Project 2026"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="desc">Description</Label>
              <Textarea
                id="desc"
                value={projectDesc}
                onChange={(e) => setProjectDesc(e.target.value)}
                placeholder="Brief description of the project..."
                rows={2}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Min Team Size</Label>
                <Input
                  type="number"
                  value={minSize}
                  onChange={(e) => setMinSize(parseInt(e.target.value))}
                  min={2}
                  max={10}
                />
              </div>
              <div className="space-y-2">
                <Label>Max Team Size</Label>
                <Input
                  type="number"
                  value={maxSize}
                  onChange={(e) => setMaxSize(parseInt(e.target.value))}
                  min={2}
                  max={10}
                />
              </div>
            </div>

            {/* Cluster Constraints */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Cluster Constraints (optional)</Label>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={addConstraint}
                >
                  + Add Constraint
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Set max number of members allowed from each cluster
              </p>
              {constraints.map((c, idx) => (
                <div key={idx} className="flex items-center gap-3">
                  <Select
                    value={c.cluster_id}
                    onValueChange={(val) =>
                      updateConstraint(idx, "cluster_id", val)
                    }
                  >
                    <SelectTrigger className="flex-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {clusters.map((cl) => (
                        <SelectItem key={cl.id} value={cl.id}>
                          {cl.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">Max</span>
                    <Input
                      type="number"
                      value={c.max_members}
                      onChange={(e) =>
                        updateConstraint(
                          idx,
                          "max_members",
                          parseInt(e.target.value)
                        )
                      }
                      min={1}
                      max={10}
                      className="w-16"
                    />
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive"
                    onClick={() => removeConstraint(idx)}
                  >
                    <X size={16} />
                  </Button>
                </div>
              ))}
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Creating..." : "Create Team & Get Invite Code"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
