"use client";

import { useEffect, useState } from "react";
import { createSupabaseBrowser } from "@/lib/supabase/client";
import { useAuth, useBranches, useTeamStatus } from "@/lib/hooks";
import { Users, Mail, Phone, Eye, EyeOff } from "lucide-react";
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
import {
  Alert,
  AlertDescription,
} from "@/components/ui/alert";

interface LookingStudent {
  usn: string;
  name: string;
  email: string;
  phone: string | null;
  cgpa: number | null;
  semester: number | null;
  interests: string[];
  branch: { name: string; code: string; cluster: { name: string; id: string } };
}

export default function LookingForTeamPage() {
  const { user, refresh } = useAuth();
  const { isInTeam } = useTeamStatus(user?.usn);
  const { clusters, branches } = useBranches();
  const supabase = createSupabaseBrowser();

  const [students, setStudents] = useState<LookingStudent[]>([]);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState(false);
  const [filterCluster, setFilterCluster] = useState("all");
  const [filterBranch, setFilterBranch] = useState("all");

  useEffect(() => {
    async function fetchLooking() {
      const { data } = await supabase
        .from("students")
        .select(
          "usn, name, email, phone, cgpa, semester, interests, branch:branches(name, code, cluster:clusters(name, id))"
        )
        .eq("looking_for_team", true)
        .order("name");

      setStudents((data || []) as unknown as LookingStudent[]);
      setLoading(false);
    }
    fetchLooking();
  }, [supabase]);

  const toggleLooking = async () => {
    if (!user) return;
    setToggling(true);
    await supabase
      .from("students")
      .update({ looking_for_team: !user.looking_for_team })
      .eq("usn", user.usn);
    await refresh();
    setToggling(false);

    const { data } = await supabase
      .from("students")
      .select(
        "usn, name, email, phone, cgpa, semester, interests, branch:branches(name, code, cluster:clusters(name, id))"
      )
      .eq("looking_for_team", true)
      .order("name");
    setStudents((data || []) as unknown as LookingStudent[]);
  };

  const filtered = students.filter((s) => {
    if (filterCluster !== "all" && s.branch?.cluster?.id !== filterCluster)
      return false;
    if (filterBranch !== "all") {
      const branch = branches.find((b) => b.id === filterBranch);
      if (branch && s.branch?.code !== branch.code) return false;
    }
    return true;
  });

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <div className="grid gap-3">
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Looking for Team
          </h1>
          <p className="text-muted-foreground">
            Students who are looking for a team to join
          </p>
        </div>

        {isInTeam ? (
          <Badge variant="secondary">
            You&apos;re in a team — browse only
          </Badge>
        ) : (
          <Button
            onClick={toggleLooking}
            disabled={toggling}
            variant={user?.looking_for_team ? "default" : "outline"}
          >
            {user?.looking_for_team ? (
              <>
                <Eye size={16} className="mr-2" /> You&apos;re Visible
              </>
            ) : (
              <>
                <EyeOff size={16} className="mr-2" /> Mark as Looking
              </>
            )}
          </Button>
        )}
      </div>

      {user?.looking_for_team && !isInTeam && (
        <Alert>
          <AlertDescription>
            You&apos;re listed as looking for a team. Team leaders can see your
            profile and contact you.
          </AlertDescription>
        </Alert>
      )}

      {/* Filters */}
      <Card>
        <CardContent className="pt-4 pb-4">
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-sm text-muted-foreground">Filter by:</span>

            <Select
              value={filterCluster}
              onValueChange={(val) => {
                setFilterCluster(val);
                setFilterBranch("all");
              }}
            >
              <SelectTrigger className="w-40">
                <SelectValue />
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
                <SelectValue />
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

            {(filterCluster !== "all" || filterBranch !== "all") && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setFilterCluster("all");
                  setFilterBranch("all");
                }}
              >
                Clear
              </Button>
            )}

            <span className="text-sm text-muted-foreground ml-auto">
              {filtered.length} student(s)
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Student List */}
      {filtered.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center">
            <Users
              className="text-muted-foreground mx-auto mb-4"
              size={48}
            />
            <h3 className="font-semibold mb-2">No students found</h3>
            <p className="text-sm text-muted-foreground">
              No students are currently looking for a team
              {filterCluster !== "all" || filterBranch !== "all"
                ? " with the selected filters"
                : ""}
              .
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3">
          {filtered.map((s) => (
            <Card
              key={s.usn}
              className="hover:border-primary/30 transition-colors"
            >
              <CardContent className="pt-4 pb-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold">{s.name}</h3>
                    <p className="text-sm text-muted-foreground">
                      {s.usn} &bull; {s.branch?.name} ({s.branch?.code})
                      &bull; {s.branch?.cluster?.name}
                    </p>
                    <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
                      {s.semester && <span>Sem {s.semester}</span>}
                      {s.cgpa && <span>CGPA: {s.cgpa}</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="sm" asChild>
                      <a href={`mailto:${s.email}`}>
                        <Mail size={14} className="mr-1" />
                        Email
                      </a>
                    </Button>
                    {s.phone && (
                      <Button variant="ghost" size="sm" asChild>
                        <a href={`tel:${s.phone}`}>
                          <Phone size={14} className="mr-1" />
                          Call
                        </a>
                      </Button>
                    )}
                  </div>
                </div>

                {s.interests && s.interests.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {s.interests.map((interest, idx) => (
                      <Badge key={idx} variant="outline" className="text-xs">
                        {interest}
                      </Badge>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
