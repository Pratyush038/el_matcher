-- ============================================
-- EL Matcher - Database Schema
-- ============================================

-- 1. Clusters: groups of related branches
CREATE TABLE clusters (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,          -- e.g. 'CS Cluster', 'Mech Cluster'
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Branches: individual branches belonging to a cluster
CREATE TABLE branches (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,          -- e.g. 'CSE', 'AI&ML', 'ECE'
  code TEXT NOT NULL UNIQUE,          -- short code e.g. 'CS', 'AI', 'EC'
  cluster_id UUID NOT NULL REFERENCES clusters(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Students: USN is the primary key
CREATE TABLE students (
  usn TEXT PRIMARY KEY,               -- e.g. '1RV22CS001'
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  phone TEXT,
  cgpa NUMERIC(4,2),
  branch_id UUID NOT NULL REFERENCES branches(id),
  semester INTEGER,
  interests TEXT[] DEFAULT '{}',      -- array of interest tags
  looking_for_team BOOLEAN DEFAULT false,
  auth_id UUID UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 4. Projects: a project/subject that requires teams
CREATE TABLE projects (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,                 -- e.g. 'EL Project 2026'
  description TEXT,
  min_team_size INTEGER DEFAULT 2,
  max_team_size INTEGER DEFAULT 5,
  created_by TEXT NOT NULL REFERENCES students(usn),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 5. Project constraints: max N from a given cluster
CREATE TABLE project_constraints (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  cluster_id UUID NOT NULL REFERENCES clusters(id),
  max_members INTEGER NOT NULL DEFAULT 2,
  UNIQUE(project_id, cluster_id)
);

-- 6. Teams: created by a leader, has an invite code
CREATE TABLE teams (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  leader_usn TEXT NOT NULL REFERENCES students(usn),
  invite_code TEXT NOT NULL UNIQUE,   -- 8-char unique code
  is_open BOOLEAN DEFAULT true,       -- accepting new members?
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 7. Team members: who is in which team
CREATE TABLE team_members (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  student_usn TEXT NOT NULL REFERENCES students(usn),
  joined_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(team_id, student_usn)
);

-- 8. Team requirements: what the team still needs
CREATE TABLE team_requirements (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  cluster_id UUID REFERENCES clusters(id),        -- needs someone from this cluster
  branch_id UUID REFERENCES branches(id),          -- or specifically this branch
  description TEXT,                                 -- free text e.g. 'need someone good at ML'
  spots_needed INTEGER DEFAULT 1,
  is_fulfilled BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- Indexes for performance
-- ============================================
CREATE INDEX idx_students_branch ON students(branch_id);
CREATE INDEX idx_students_looking ON students(looking_for_team) WHERE looking_for_team = true;
CREATE INDEX idx_teams_project ON teams(project_id);
CREATE INDEX idx_teams_invite ON teams(invite_code);
CREATE INDEX idx_team_members_team ON team_members(team_id);
CREATE INDEX idx_team_members_student ON team_members(student_usn);
CREATE INDEX idx_team_requirements_cluster ON team_requirements(cluster_id) WHERE is_fulfilled = false;
CREATE INDEX idx_team_requirements_branch ON team_requirements(branch_id) WHERE is_fulfilled = false;

-- ============================================
-- Row Level Security (RLS)
-- ============================================
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_constraints ENABLE ROW LEVEL SECURITY;
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_requirements ENABLE ROW LEVEL SECURITY;
ALTER TABLE clusters ENABLE ROW LEVEL SECURITY;
ALTER TABLE branches ENABLE ROW LEVEL SECURITY;

-- Everyone can read clusters and branches
CREATE POLICY "Anyone can read clusters" ON clusters FOR SELECT USING (true);
CREATE POLICY "Anyone can read branches" ON branches FOR SELECT USING (true);

-- Students: can read all, update own
CREATE POLICY "Anyone can read students" ON students FOR SELECT USING (true);
CREATE POLICY "Users can insert own student" ON students FOR INSERT WITH CHECK (auth_id = auth.uid());
CREATE POLICY "Users can update own student" ON students FOR UPDATE USING (auth_id = auth.uid());

-- Projects: anyone can create and read
CREATE POLICY "Anyone can read projects" ON projects FOR SELECT USING (true);
CREATE POLICY "Authenticated users can create projects" ON projects FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Creator can update project" ON projects FOR UPDATE USING (
  created_by IN (SELECT usn FROM students WHERE auth_id = auth.uid())
);

-- Project constraints: read all, creator can manage
CREATE POLICY "Anyone can read constraints" ON project_constraints FOR SELECT USING (true);
CREATE POLICY "Project creator can manage constraints" ON project_constraints FOR INSERT WITH CHECK (
  project_id IN (SELECT id FROM projects WHERE created_by IN (SELECT usn FROM students WHERE auth_id = auth.uid()))
);

-- Teams: read all, leader manages
CREATE POLICY "Anyone can read teams" ON teams FOR SELECT USING (true);
CREATE POLICY "Authenticated can create teams" ON teams FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Leader can update team" ON teams FOR UPDATE USING (
  leader_usn IN (SELECT usn FROM students WHERE auth_id = auth.uid())
);

-- Team members: read all, team leader or self can manage
CREATE POLICY "Anyone can read team members" ON team_members FOR SELECT USING (true);
CREATE POLICY "Can join team" ON team_members FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Leader or self can remove" ON team_members FOR DELETE USING (
  student_usn IN (SELECT usn FROM students WHERE auth_id = auth.uid())
  OR team_id IN (SELECT id FROM teams WHERE leader_usn IN (SELECT usn FROM students WHERE auth_id = auth.uid()))
);

-- Team requirements: read all, leader manages
CREATE POLICY "Anyone can read requirements" ON team_requirements FOR SELECT USING (true);
CREATE POLICY "Leader can add requirements" ON team_requirements FOR INSERT WITH CHECK (
  team_id IN (SELECT id FROM teams WHERE leader_usn IN (SELECT usn FROM students WHERE auth_id = auth.uid()))
);
CREATE POLICY "Leader can update requirements" ON team_requirements FOR UPDATE USING (
  team_id IN (SELECT id FROM teams WHERE leader_usn IN (SELECT usn FROM students WHERE auth_id = auth.uid()))
);
CREATE POLICY "Leader can delete requirements" ON team_requirements FOR DELETE USING (
  team_id IN (SELECT id FROM teams WHERE leader_usn IN (SELECT usn FROM students WHERE auth_id = auth.uid()))
);

-- ============================================
-- Seed data: Clusters and Branches
-- ============================================
INSERT INTO clusters (name) VALUES
  ('CS Cluster'),
  ('EC Cluster'),
  ('ME Cluster');

-- CS Cluster branches
INSERT INTO branches (name, code, cluster_id) VALUES
  ('Artificial Intelligence & Machine Learning', 'AI', (SELECT id FROM clusters WHERE name = 'CS Cluster')),
  ('Computer Science & Engineering (Data Science)', 'CD', (SELECT id FROM clusters WHERE name = 'CS Cluster')),
  ('Computer Science & Engineering', 'CS', (SELECT id FROM clusters WHERE name = 'CS Cluster')),
  ('Computer Science & Engineering (Cyber Security)', 'CY', (SELECT id FROM clusters WHERE name = 'CS Cluster')),
  ('Information Science & Engineering', 'IS', (SELECT id FROM clusters WHERE name = 'CS Cluster'));

-- EC Cluster branches
INSERT INTO branches (name, code, cluster_id) VALUES
  ('Electronics & Communication Engineering', 'EC', (SELECT id FROM clusters WHERE name = 'EC Cluster')),
  ('Electrical & Electronics Engineering', 'EE', (SELECT id FROM clusters WHERE name = 'EC Cluster')),
  ('Electronics & Instrumentation Engineering', 'EI', (SELECT id FROM clusters WHERE name = 'EC Cluster')),
  ('Electronics & Telecommunication Engineering', 'ET', (SELECT id FROM clusters WHERE name = 'EC Cluster'));

-- ME Cluster branches
INSERT INTO branches (name, code, cluster_id) VALUES
  ('Aerospace Engineering', 'AS', (SELECT id FROM clusters WHERE name = 'ME Cluster')),
  ('Biotechnology', 'BT', (SELECT id FROM clusters WHERE name = 'ME Cluster')),
  ('Chemical Engineering', 'CH', (SELECT id FROM clusters WHERE name = 'ME Cluster')),
  ('Industrial Engineering & Management', 'IM', (SELECT id FROM clusters WHERE name = 'ME Cluster')),
  ('Mechanical Engineering', 'ME', (SELECT id FROM clusters WHERE name = 'ME Cluster')),
  ('Civil Engineering', 'CV', (SELECT id FROM clusters WHERE name = 'ME Cluster'));
