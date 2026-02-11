"use client";

import { useState, useEffect, useTransition } from "react";
import { createSupabaseBrowser } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { Branch } from "@/lib/types";
import { Loader2, Users } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import Squares from "@/components/ui/squares-background";

export default function RegisterPage() {
  const supabase = createSupabaseBrowser();
  const router = useRouter();
  const [branches, setBranches] = useState<Branch[]>([]);
  const [isPending, startTransition] = useTransition();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [usn, setUsn] = useState("");
  const [phone, setPhone] = useState("");
  const [cgpa, setCgpa] = useState("");
  const [branchId, setBranchId] = useState("");
  const [semester, setSemester] = useState("");
  const [interests, setInterests] = useState("");

  useEffect(() => {
    async function fetchBranches() {
      const { data } = await supabase
        .from("branches")
        .select("*, cluster:clusters(*)")
        .order("name");
      setBranches(data || []);
    }
    fetchBranches();
  }, [supabase]);

  const branchesByCluster = branches.reduce(
    (acc, branch) => {
      const clusterName = branch.cluster?.name || "Other";
      if (!acc[clusterName]) acc[clusterName] = [];
      acc[clusterName].push(branch);
      return acc;
    },
    {} as Record<string, Branch[]>
  );

  const handleSignup = (e: React.FormEvent) => {
    e.preventDefault();

    if (!email.endsWith("@rvce.edu.in")) {
      toast.error("Please use your @rvce.edu.in email address");
      return;
    }

    startTransition(async () => {
      try {
        const res = await fetch("/api/signup", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email,
            password,
            usn: usn.toUpperCase(),
            name,
            phone: phone || null,
            cgpa: cgpa ? parseFloat(cgpa) : null,
            branch_id: branchId,
            semester: semester ? parseInt(semester) : null,
            interests: interests
              ? interests.split(",").map((i) => i.trim().toLowerCase())
              : [],
          }),
        });

        const data = await res.json();

        if (!res.ok) {
          toast.error(data.error || "Signup failed");
          return;
        }

        if (data.needsLogin) {
          toast.success("Account created! Please sign in.");
          router.push("/signin");
        } else {
          await supabase.auth.signInWithPassword({ email, password });
          toast.success("Account created!");
          router.push("/dashboard");
        }
      } catch {
        toast.error("Something went wrong. Please try again.");
      }
    });
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center px-4 py-12 bg-background overflow-hidden">
      <div className="absolute inset-0 z-0">
        <Squares
          speed={0.5}
          squareSize={40}
          direction="diagonal"
          borderColor="#3a2a1a"
          hoverFillColor="#1a1a1a"
        />
      </div>
      <Card className="relative z-10 w-full max-w-lg">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-amber-400 to-orange-400 shadow-lg">
              <Users className="h-6 w-6 text-white" />
            </div>
          </div>
          <CardTitle className="text-2xl">Create Account</CardTitle>
          <CardDescription>
            Join EL Matcher and find your perfect team
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSignup} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Full Name *</Label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="John Doe"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>USN *</Label>
                <Input
                  value={usn}
                  onChange={(e) => setUsn(e.target.value)}
                  placeholder="1RV22CS001"
                  required
                  className="uppercase"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>College Email *</Label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@rvce.edu.in"
                required
              />
            </div>

            <div className="space-y-2">
              <Label>Password *</Label>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Min 6 characters"
                required
                minLength={6}
              />
            </div>

            <div className="space-y-2">
              <Label>Branch *</Label>
              <Select value={branchId} onValueChange={setBranchId} required>
                <SelectTrigger>
                  <SelectValue placeholder="Select your branch" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(branchesByCluster).map(
                    ([clusterName, clusterBranches]) => (
                      <SelectGroup key={clusterName}>
                        <SelectLabel>{clusterName}</SelectLabel>
                        {clusterBranches.map((b) => (
                          <SelectItem key={b.id} value={b.id}>
                            {b.name} ({b.code})
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    )
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Semester</Label>
                <Input
                  type="number"
                  value={semester}
                  onChange={(e) => setSemester(e.target.value)}
                  placeholder="5"
                  min={1}
                  max={8}
                />
              </div>
              <div className="space-y-2">
                <Label>CGPA</Label>
                <Input
                  type="number"
                  value={cgpa}
                  onChange={(e) => setCgpa(e.target.value)}
                  placeholder="8.5"
                  step="0.01"
                  min={0}
                  max={10}
                />
              </div>
              <div className="space-y-2">
                <Label>Phone</Label>
                <Input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="9876543210"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Interests (comma-separated)</Label>
              <Input
                value={interests}
                onChange={(e) => setInterests(e.target.value)}
                placeholder="web dev, machine learning, IoT"
              />
            </div>

            <Button type="submit" className="w-full" disabled={isPending}>
              {isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Create Account
            </Button>

            <p className="text-center text-sm text-muted-foreground">
              Already have an account?{" "}
              <Link
                href="/signin"
                className="text-primary hover:underline font-medium"
              >
                Sign In
              </Link>
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
