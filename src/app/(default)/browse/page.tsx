"use client";

import { useEffect, useState } from "react";
import { createSupabaseBrowser } from "@/lib/supabase/client";
import { useAuth, useBranches, useTeamStatus } from "@/lib/hooks";
import { Search, Users, MapPin, Mail, Phone, AlertCircle } from "lucide-react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface TeamRequirementWithTeam {
  id: string;
  team_id: string;
  cluster_id: string | null;
  branch_id: string | null;
  description: string | null;
  spots_needed: number;
  is_fulfilled: boolean;
  cluster?: { id: string; name: string };
  branch?: { id: string; name: string; code: string };
  team: {
    id: string;
    name: string;
    invite_code: string;
    is_open: boolean;
    leader_usn: string;
    leader: {
      usn: string;
      name: string;
      email: string;
      phone: string | null;
    };
    project: {
      name: string;
      description: string | null;
      max_team_size: number;
    };
    members: {
      id: string;
      student: {
        usn: string;
        name: string;
        branch: { code: string };
      };
    }[];
  };
}

export default function BrowseTeamsPage() {
  const { user } = useAuth();
  const { isInTeam, teamId } = useTeamStatus(user?.usn);
  const { clusters, branches } = useBranches();
  const supabase = createSupabaseBrowser();

  const [requirements, setRequirements] = useState<
    TeamRequirementWithTeam[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [filterCluster, setFilterCluster] = useState("all");
  const [filterBranch, setFilterBranch] = useState("all");
  const [showMyMatches, setShowMyMatches] = useState(false);

  useEffect(() => {
    async function fetchRequirements() {
      const { data } = await supabase
        .from("team_requirements")
        .select(
          `*, cluster:clusters(*), branch:branches(*),
           team:teams(*, leader:students(usn, name, email, phone),
           project:projects(*),
           members:team_members(*, student:students(usn, name, semester, branch:branches(code, cluster_id))))`
        )
        .eq("is_fulfilled", false)
        .order("created_at", { ascending: false });

      const openTeamReqs = (data || []).filter(
        (r: TeamRequirementWithTeam) => r.team?.is_open
      );

      setRequirements(
        openTeamReqs as unknown as TeamRequirementWithTeam[]
      );
      setLoading(false);
    }
    fetchRequirements();
  }, [supabase]);

  const filtered = requirements.filter((req) => {
    // Semester constraint: only show teams from same semester
    if (user?.semester) {
      const leaderMember = req.team?.members?.find(
        (m) => m.student?.usn === req.team?.leader_usn
      );
      const leaderSemester = (leaderMember?.student as { semester?: number | null })?.semester;
      if (leaderSemester && leaderSemester !== user.semester) return false;
    }

    if (showMyMatches && user) {
      const myBranch = branches.find((b) => b.id === user.branch_id);
      if (!myBranch) return false;
      const matchesBranch = req.branch_id === user.branch_id;
      const matchesCluster = req.cluster_id === myBranch.cluster_id;
      if (!matchesBranch && !matchesCluster) return false;
    }

    if (filterCluster !== "all" && req.cluster_id !== filterCluster)
      return false;
    if (filterBranch !== "all" && req.branch_id !== filterBranch)
      return false;

    return true;
  });

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-12 w-full" />
        <div className="grid gap-4">
          <Skeleton className="h-40" />
          <Skeleton className="h-40" />
        </div>
      </div>
    );
  }

  if (isInTeam) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Card className="max-w-md w-full text-center">
          <CardContent className="pt-8 pb-8">
            <AlertCircle className="mx-auto mb-4 text-muted-foreground" size={48} />
            <h2 className="text-xl font-bold mb-2">Already in a Team</h2>
            <p className="text-muted-foreground mb-6">
              You&apos;re already in a team. Check the &quot;Looking for
              Team&quot; page to find members instead.
            </p>
            <div className="flex gap-3 justify-center">
              <Button asChild>
                <Link href={teamId ? `/teams/${teamId}` : "/dashboard"}>
                  Go to Your Team
                </Link>
              </Button>
              <Button variant="outline" asChild>
                <Link href="/looking">Find Members</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Browse Teams</h1>
        <p className="text-muted-foreground">
          Find teams that are looking for someone like you
        </p>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-4 pb-4">
          <div className="flex flex-wrap items-center gap-3">
            <Search size={16} className="text-muted-foreground" />

            <Button
              variant={showMyMatches ? "default" : "outline"}
              size="sm"
              onClick={() => setShowMyMatches(!showMyMatches)}
            >
              My Matches Only
            </Button>

            <Select
              value={filterCluster}
              onValueChange={(val) => {
                setFilterCluster(val);
                setFilterBranch("all");
              }}
            >
              <SelectTrigger className="w-40">
                <SelectValue placeholder="All Clusters" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Clusters</SelectItem>
                {clusters.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={filterBranch}
              onValueChange={(val) => {
                setFilterBranch(val);
                if (val !== "all") {
                  const branch = branches.find((b) => b.id === val);
                  if (branch) setFilterCluster(branch.cluster_id);
                }
              }}
            >
              <SelectTrigger className="w-48">
                <SelectValue placeholder="All Branches" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">
                  {filterCluster !== "all" ? "All in Cluster" : "All Branches"}
                </SelectItem>
                {(filterCluster !== "all"
                  ? branches.filter((b) => b.cluster_id === filterCluster)
                  : branches
                ).map((b) => (
                  <SelectItem key={b.id} value={b.id}>
                    {b.name} ({b.code})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {(filterCluster !== "all" ||
              filterBranch !== "all" ||
              showMyMatches) && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setFilterCluster("all");
                  setFilterBranch("all");
                  setShowMyMatches(false);
                }}
              >
                Clear
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      {filtered.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center">
            <Search
              className="text-muted-foreground mx-auto mb-4"
              size={48}
            />
            <h3 className="font-semibold mb-2">No matching teams found</h3>
            <p className="text-sm text-muted-foreground">
              Try changing your filters or check back later.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {filtered.map((req) => (
            <Card
              key={req.id}
              className="hover:border-primary/30 transition-colors"
            >
              <CardContent className="pt-5">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold text-lg">
                      {req.team?.name}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {req.team?.project?.name}
                      {req.team?.project?.description &&
                        ` \u2013 ${req.team.project.description}`}
                    </p>
                  </div>
                  <Badge>
                    Needs {req.spots_needed}{" "}
                    {req.cluster?.name ||
                      req.branch?.name ||
                      "member(s)"}
                  </Badge>
                </div>

                {req.description && (
                  <p className="text-sm mt-2 bg-muted/50 rounded-lg px-3 py-2">
                    {req.description}
                  </p>
                )}

                <div className="flex items-center gap-4 mt-3 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Users size={14} />
                    {req.team?.members?.length || 0}/
                    {req.team?.project?.max_team_size} members
                  </span>
                  <span className="flex items-center gap-1">
                    <MapPin size={14} />
                    Looking for:{" "}
                    {req.cluster?.name || req.branch?.name}
                  </span>
                </div>

                {req.team?.members && req.team.members.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-3">
                    {req.team.members.map((m) => (
                      <Badge key={m.id} variant="outline" className="text-xs">
                        {m.student?.name} ({m.student?.branch?.code})
                      </Badge>
                    ))}
                  </div>
                )}

                <div className="mt-4 pt-3 border-t">
                  <p className="text-xs text-muted-foreground mb-1">
                    Contact Team Leader:
                  </p>
                  <div className="flex flex-wrap items-center gap-4 text-sm">
                    <span className="font-medium">
                      {req.team?.leader?.name} ({req.team?.leader?.usn})
                    </span>
                    <a
                      href={`mailto:${req.team?.leader?.email}`}
                      className="flex items-center gap-1 text-primary hover:underline"
                    >
                      <Mail size={14} />
                      {req.team?.leader?.email}
                    </a>
                    {req.team?.leader?.phone && (
                      <a
                        href={`tel:${req.team.leader.phone}`}
                        className="flex items-center gap-1 text-amber-500 hover:underline"
                      >
                        <Phone size={14} />
                        {req.team.leader.phone}
                      </a>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
