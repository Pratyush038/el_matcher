"use client";

import { useState } from "react";
import { createSupabaseBrowser } from "@/lib/supabase/client";
import { useAuth, useBranches } from "@/lib/hooks";
import { Save, Check } from "lucide-react";
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
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";

export default function ProfilePage() {
  const { user, refresh } = useAuth();
  const { branches } = useBranches();
  const supabase = createSupabaseBrowser();

  const [name, setName] = useState(user?.name || "");
  const [phone, setPhone] = useState(user?.phone || "");
  const [cgpa, setCgpa] = useState(user?.cgpa?.toString() || "");
  const [branchId, setBranchId] = useState(user?.branch_id || "");
  const [semester, setSemester] = useState(user?.semester?.toString() || "");
  const [interests, setInterests] = useState(
    user?.interests?.join(", ") || ""
  );

  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // Sync form when user loads
  const [initialized, setInitialized] = useState(false);
  if (user && !initialized) {
    setName(user.name);
    setPhone(user.phone || "");
    setCgpa(user.cgpa?.toString() || "");
    setBranchId(user.branch_id);
    setSemester(user.semester?.toString() || "");
    setInterests(user.interests?.join(", ") || "");
    setInitialized(true);
  }

  // Group branches by cluster
  const branchesByCluster = branches.reduce(
    (acc, branch) => {
      const clusterName = branch.cluster?.name || "Other";
      if (!acc[clusterName]) acc[clusterName] = [];
      acc[clusterName].push(branch);
      return acc;
    },
    {} as Record<string, typeof branches>
  );

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSaving(true);

    const { error: updateErr } = await supabase
      .from("students")
      .update({
        name,
        phone: phone || null,
        cgpa: cgpa ? parseFloat(cgpa) : null,
        branch_id: branchId,
        semester: semester ? parseInt(semester) : null,
        interests: interests
          ? interests.split(",").map((i) => i.trim().toLowerCase())
          : [],
        updated_at: new Date().toISOString(),
      })
      .eq("usn", user.usn);

    if (updateErr) {
      toast.error(updateErr.message);
    } else {
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
      toast.success("Profile updated!");
      refresh();
    }
    setSaving(false);
  };

  if (!user) {
    return (
      <div className="max-w-2xl mx-auto space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>Your Profile</CardTitle>
          <CardDescription>
            Update your personal information and preferences
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSave} className="space-y-4">
            <div className="space-y-2">
              <Label>USN (cannot change)</Label>
              <Input value={user.usn} disabled />
            </div>

            <div className="space-y-2">
              <Label>Email (cannot change)</Label>
              <Input value={user.email} disabled />
            </div>

            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label>Branch</Label>
              <Select value={branchId} onValueChange={setBranchId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select branch" />
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

            <Button type="submit" className="w-full" disabled={saving}>
              {saved ? (
                <>
                  <Check size={18} className="mr-2" /> Saved!
                </>
              ) : saving ? (
                "Saving..."
              ) : (
                <>
                  <Save size={18} className="mr-2" /> Save Changes
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
