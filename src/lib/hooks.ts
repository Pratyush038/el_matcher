import { createSupabaseBrowser } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { useEffect, useState, useCallback } from "react";
import type { Student, Branch, Cluster } from "@/lib/types";

export function useAuth() {
  const supabase = createSupabaseBrowser();
  const router = useRouter();
  const [user, setUser] = useState<Student | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchStudent = useCallback(async () => {
    const { data: { user: authUser } } = await supabase.auth.getUser();
    if (!authUser) {
      setUser(null);
      setLoading(false);
      return;
    }

    const { data: student, error } = await supabase
      .from("students")
      .select("*, branch:branches(*, cluster:clusters(*))")
      .eq("auth_id", authUser.id)
      .maybeSingle();

    if (!student && !error) {
      // Auth user exists but no student record (DB was reset)
      // Sign them out so they can re-register
      await supabase.auth.signOut();
      setUser(null);
      setLoading(false);
      return;
    }

    setUser(student);
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchStudent();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      fetchStudent();
    });

    return () => subscription.unsubscribe();
  }, [supabase, fetchStudent]);

  const signOut = async () => {
    await supabase.auth.signOut();
    router.push("/signin");
  };

  return { user, loading, signOut, refresh: fetchStudent };
}

export function useBranches() {
  const supabase = createSupabaseBrowser();
  const [branches, setBranches] = useState<Branch[]>([]);
  const [clusters, setClusters] = useState<Cluster[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetch() {
      const [branchRes, clusterRes] = await Promise.all([
        supabase.from("branches").select("*, cluster:clusters(*)").order("name"),
        supabase.from("clusters").select("*").order("name"),
      ]);
      setBranches(branchRes.data || []);
      setClusters(clusterRes.data || []);
      setLoading(false);
    }
    fetch();
  }, [supabase]);

  return { branches, clusters, loading };
}

export function useTeamStatus(usn: string | null | undefined) {
  const supabase = createSupabaseBrowser();
  const [isLeader, setIsLeader] = useState(false);
  const [isInTeam, setIsInTeam] = useState(false);
  const [teamId, setTeamId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!usn) {
      return;
    }

    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true);
    let cancelled = false;

    async function checkStatus() {
      const [{ data: ledTeams }, { data: memberships }] = await Promise.all([
        supabase.from("teams").select("id").eq("leader_usn", usn!).limit(1),
        supabase
          .from("team_members")
          .select("team_id")
          .eq("student_usn", usn!)
          .limit(1),
      ]);

      if (cancelled) return;

      setIsLeader((ledTeams?.length || 0) > 0);
      setIsInTeam((memberships?.length || 0) > 0);
      setTeamId(memberships?.[0]?.team_id || null);
      setLoading(false);
    }

    checkStatus();

    return () => {
      cancelled = true;
    };
  }, [usn, supabase]);

  return { isLeader, isInTeam, teamId, loading };
}
