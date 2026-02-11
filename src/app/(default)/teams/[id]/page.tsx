"use client";

import { useEffect, useState } from "react";
import { createSupabaseBrowser } from "@/lib/supabase/client";
import { useAuth, useBranches } from "@/lib/hooks";
import { useParams, useRouter } from "next/navigation";
import { Copy, Check, Users, Plus, Trash2, LogOut } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";

interface TeamData {
  id: string;
  name: string;
  invite_code: string;
  is_open: boolean;
  leader_usn: string;
  project: {
    id: string;
    name: string;
    description: string | null;
    min_team_size: number;
    max_team_size: number;
    constraints: {
      id: string;
      cluster_id: string;
      max_members: number;
      cluster: { id: string; name: string };
    }[];
  };
  members: {
    id: string;
    student_usn: string;
    student: {
      usn: string;
      name: string;
      email: string;
      phone: string | null;
      cgpa: number | null;
      branch: { name: string; code: string; cluster: { name: string } };
    };
  }[];
  requirements: {
    id: string;
    cluster_id: string | null;
    branch_id: string | null;
    description: string | null;
    spots_needed: number;
    is_fulfilled: boolean;
    cluster?: { name: string };
    branch?: { name: string; code: string };
  }[];
}

export default function TeamDetailPage() {
  const params = useParams();
  const teamId = params.id as string;
  const { user } = useAuth();
  const { clusters, branches } = useBranches();
  const supabase = createSupabaseBrowser();
  const router = useRouter();

  const [team, setTeam] = useState<TeamData | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  const [showReqForm, setShowReqForm] = useState(false);
  const [reqType, setReqType] = useState<"cluster" | "branch">("cluster");
  const [reqClusterId, setReqClusterId] = useState("");
  const [reqBranchId, setReqBranchId] = useState("");
  const [reqDesc, setReqDesc] = useState("");
  const [reqSpots, setReqSpots] = useState(1);

  const fetchTeam = async () => {
    const { data } = await supabase
      .from("teams")
      .select(
        `*, project:projects(*, constraints:project_constraints(*, cluster:clusters(*))),
         members:team_members(*, student:students(*, branch:branches(*, cluster:clusters(*)))),
         requirements:team_requirements(*, cluster:clusters(*), branch:branches(*))`
      )
      .eq("id", teamId)
      .single();

    setTeam(data as unknown as TeamData);
    setLoading(false);
  };

  useEffect(() => {
    fetchTeam();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [teamId]);

  const isLeader = user?.usn === team?.leader_usn;
  const isMember = team?.members?.some((m) => m.student_usn === user?.usn) ?? false;

  const copyCode = () => {
    if (team) {
      navigator.clipboard.writeText(team.invite_code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const toggleOpen = async () => {
    if (!team || !isLeader) return;
    await supabase
      .from("teams")
      .update({ is_open: !team.is_open })
      .eq("id", team.id);
    toast.success(team.is_open ? "Team closed" : "Team opened");
    fetchTeam();
  };

  const removeMember = async (memberUsn: string) => {
    if (!team || !isLeader || memberUsn === team.leader_usn) return;
    await supabase
      .from("team_members")
      .delete()
      .eq("team_id", team.id)
      .eq("student_usn", memberUsn);
    toast.success("Member removed");
    fetchTeam();
  };

  const leaveTeam = async () => {
    if (!team || !user) return;

    if (isLeader) {
      const otherMembers = team.members?.filter(
        (m) => m.student_usn !== user.usn
      );
      if (otherMembers && otherMembers.length > 0) {
        // Transfer leadership to next member
        const { error: transferErr } = await supabase
          .from("teams")
          .update({ leader_usn: otherMembers[0].student_usn })
          .eq("id", team.id);
        if (transferErr) {
          toast.error("Failed to transfer leadership: " + transferErr.message);
          return;
        }
        // Remove self from team
        const { error } = await supabase
          .from("team_members")
          .delete()
          .eq("team_id", team.id)
          .eq("student_usn", user.usn);
        if (error) {
          toast.error(error.message);
          return;
        }
      } else {
        // Last member — delete the team (cascades to members & requirements)
        const { error } = await supabase
          .from("teams")
          .delete()
          .eq("id", team.id);
        if (error) {
          toast.error(error.message);
          return;
        }
      }
    } else {
      const { error } = await supabase
        .from("team_members")
        .delete()
        .eq("team_id", team.id)
        .eq("student_usn", user.usn);
      if (error) {
        toast.error(error.message);
        return;
      }
    }

    toast.success("You have left the team.");
    router.push("/dashboard");
  };

  const deleteTeam = async () => {
    if (!team || !isLeader) return;
    const { error } = await supabase
      .from("teams")
      .delete()
      .eq("id", team.id);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Team deleted.");
    router.push("/dashboard");
  };

  const addRequirement = async () => {
    if (!team || !isLeader) return;

    const insert: Record<string, unknown> = {
      team_id: team.id,
      description: reqDesc || null,
      spots_needed: reqSpots,
    };

    if (reqType === "cluster" && reqClusterId) {
      insert.cluster_id = reqClusterId;
    } else if (reqType === "branch" && reqBranchId) {
      insert.branch_id = reqBranchId;
    } else {
      toast.error("Please select a cluster or branch");
      return;
    }

    const { error } = await supabase.from("team_requirements").insert(insert);
    if (error) {
      toast.error(error.message);
      return;
    }

    toast.success("Requirement added");
    setShowReqForm(false);
    setReqDesc("");
    setReqSpots(1);
    fetchTeam();
  };

  const removeRequirement = async (reqId: string) => {
    if (!isLeader) return;
    await supabase.from("team_requirements").delete().eq("id", reqId);
    toast.success("Requirement removed");
    fetchTeam();
  };

  const fulfillRequirement = async (reqId: string) => {
    if (!isLeader) return;
    await supabase
      .from("team_requirements")
      .update({ is_fulfilled: true })
      .eq("id", reqId);
    toast.success("Marked as fulfilled");
    fetchTeam();
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-48 w-full" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Skeleton className="h-64" />
          <Skeleton className="h-64" />
        </div>
      </div>
    );
  }

  if (!team) {
    return (
      <Card>
        <CardContent className="py-10 text-center">
          <p className="text-muted-foreground">Team not found</p>
        </CardContent>
      </Card>
    );
  }

  const openRequirements =
    team.requirements?.filter((r) => !r.is_fulfilled) || [];

  return (
    <div className="space-y-6">
      {/* Header Card */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-2xl font-bold">{team.name}</h1>
              <p className="text-muted-foreground mt-1">
                {team.project?.name}{" "}
                {team.project?.description && (
                  <span>&bull; {team.project.description}</span>
                )}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant={team.is_open ? "default" : "destructive"}>
                {team.is_open ? "Open" : "Closed"}
              </Badge>
              {isLeader && (
                <Button variant="ghost" size="sm" onClick={toggleOpen}>
                  {team.is_open ? "Close" : "Open"}
                </Button>
              )}
            </div>
          </div>

          <div className="flex items-center gap-4 mt-4 pt-4 border-t">
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">
                Invite Code:
              </span>
              <code className="bg-muted text-amber-400 px-3 py-1 rounded font-mono">
                {team.invite_code}
              </code>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={copyCode}
              >
                {copied ? (
                  <Check size={14} className="text-amber-400" />
                ) : (
                  <Copy size={14} />
                )}
              </Button>
            </div>
            <div className="text-sm text-muted-foreground flex items-center gap-1">
              <Users size={14} />
              {team.members?.length || 0} / {team.project?.max_team_size}{" "}
              members
            </div>
            <div className="flex items-center gap-2 ml-auto">
              {isMember && (
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={leaveTeam}
                >
                  <LogOut size={14} className="mr-1" />
                  Leave Team
                </Button>
              )}
              {isLeader && (
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={deleteTeam}
                >
                  <Trash2 size={14} className="mr-1" />
                  Delete Team
                </Button>
              )}
            </div>
          </div>

          {/* Constraints */}
          {team.project?.constraints &&
            team.project.constraints.length > 0 && (
              <div className="mt-4 pt-4 border-t">
                <p className="text-sm text-muted-foreground mb-2">
                  Cluster Constraints:
                </p>
                <div className="flex flex-wrap gap-2">
                  {team.project.constraints.map((c) => {
                    const count =
                      team.members?.filter(
                        (m) =>
                          m.student?.branch?.cluster?.name ===
                          c.cluster?.name
                      ).length || 0;
                    const atLimit = count >= c.max_members;
                    return (
                      <Badge
                        key={c.id}
                        variant={atLimit ? "destructive" : "outline"}
                      >
                        {c.cluster?.name}: {count}/{c.max_members}
                      </Badge>
                    );
                  })}
                </div>
              </div>
            )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Members */}
        <Card>
          <CardHeader>
            <CardTitle>Members</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {team.members?.map((m) => (
              <div
                key={m.id}
                className="flex items-center justify-between bg-muted/50 rounded-lg p-3"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm">
                      {m.student?.name}
                    </span>
                    {m.student_usn === team.leader_usn && (
                      <Badge variant="secondary" className="text-xs">
                        Leader
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {m.student?.usn} &bull; {m.student?.branch?.name} (
                    {m.student?.branch?.code})
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {m.student?.email}
                    {m.student?.phone && ` \u2022 ${m.student.phone}`}
                  </p>
                </div>
                {isLeader && m.student_usn !== team.leader_usn && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-destructive"
                    onClick={() => removeMember(m.student_usn)}
                  >
                    <Trash2 size={14} />
                  </Button>
                )}
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Requirements */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Looking For</CardTitle>
            {isLeader && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowReqForm(!showReqForm)}
              >
                <Plus size={16} className="mr-1" />
                Add
              </Button>
            )}
          </CardHeader>
          <CardContent className="space-y-3">
            {showReqForm && (
              <div className="bg-muted/50 rounded-lg p-4 space-y-3">
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="radio"
                      checked={reqType === "cluster"}
                      onChange={() => setReqType("cluster")}
                    />
                    By Cluster
                  </label>
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="radio"
                      checked={reqType === "branch"}
                      onChange={() => setReqType("branch")}
                    />
                    By Branch
                  </label>
                </div>

                {reqType === "cluster" ? (
                  <Select value={reqClusterId} onValueChange={setReqClusterId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select cluster" />
                    </SelectTrigger>
                    <SelectContent>
                      {clusters.map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <Select value={reqBranchId} onValueChange={setReqBranchId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select branch" />
                    </SelectTrigger>
                    <SelectContent>
                      {branches.map((b) => (
                        <SelectItem key={b.id} value={b.id}>
                          {b.name} ({b.code})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}

                <Input
                  value={reqDesc}
                  onChange={(e) => setReqDesc(e.target.value)}
                  placeholder="Additional details (optional)"
                />

                <div className="flex items-center gap-2">
                  <Label className="text-sm">Spots:</Label>
                  <Input
                    type="number"
                    value={reqSpots}
                    onChange={(e) => setReqSpots(parseInt(e.target.value))}
                    min={1}
                    max={5}
                    className="w-16"
                  />
                </div>

                <div className="flex gap-2">
                  <Button size="sm" onClick={addRequirement}>
                    Add
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowReqForm(false)}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            )}

            {openRequirements.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No open requirements.{" "}
                {isLeader && "Add what you're looking for!"}
              </p>
            ) : (
              openRequirements.map((req) => (
                <div
                  key={req.id}
                  className="flex items-center justify-between bg-muted/50 rounded-lg p-3"
                >
                  <div>
                    <p className="text-sm font-medium">
                      {req.cluster?.name || req.branch?.name || "Any"}{" "}
                      <span className="text-muted-foreground font-normal">
                        x {req.spots_needed}
                      </span>
                    </p>
                    {req.description && (
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {req.description}
                      </p>
                    )}
                  </div>
                  {isLeader && (
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-amber-400 h-7"
                        onClick={() => fulfillRequirement(req.id)}
                      >
                        Filled
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-destructive"
                        onClick={() => removeRequirement(req.id)}
                      >
                        <Trash2 size={14} />
                      </Button>
                    </div>
                  )}
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
