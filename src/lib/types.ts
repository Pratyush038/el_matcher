// Database types matching our Supabase schema

export interface Cluster {
  id: string;
  name: string;
  created_at: string;
}

export interface Branch {
  id: string;
  name: string;
  code: string;
  cluster_id: string;
  created_at: string;
  cluster?: Cluster;
}

export interface Student {
  usn: string;
  name: string;
  email: string;
  phone: string | null;
  cgpa: number | null;
  branch_id: string;
  semester: number | null;
  interests: string[];
  looking_for_team: boolean;
  auth_id: string;
  created_at: string;
  updated_at: string;
  branch?: Branch;
}

export interface Project {
  id: string;
  name: string;
  description: string | null;
  min_team_size: number;
  max_team_size: number;
  created_by: string;
  is_active: boolean;
  created_at: string;
  constraints?: ProjectConstraint[];
  creator?: Student;
}

export interface ProjectConstraint {
  id: string;
  project_id: string;
  cluster_id: string;
  max_members: number;
  cluster?: Cluster;
}

export interface Team {
  id: string;
  name: string;
  project_id: string;
  leader_usn: string;
  invite_code: string;
  is_open: boolean;
  created_at: string;
  project?: Project;
  leader?: Student;
  members?: TeamMember[];
  requirements?: TeamRequirement[];
}

export interface TeamMember {
  id: string;
  team_id: string;
  student_usn: string;
  joined_at: string;
  student?: Student;
}

export interface TeamRequirement {
  id: string;
  team_id: string;
  cluster_id: string | null;
  branch_id: string | null;
  description: string | null;
  spots_needed: number;
  is_fulfilled: boolean;
  created_at: string;
  cluster?: Cluster;
  branch?: Branch;
  team?: Team;
}
