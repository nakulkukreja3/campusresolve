-- =========== ENUMS ===========
CREATE TYPE public.app_role AS ENUM ('student', 'admin', 'super_admin', 'department_staff');
CREATE TYPE public.complaint_status AS ENUM ('submitted', 'under_review', 'assigned', 'in_progress', 'escalated', 'resolved', 'closed');
CREATE TYPE public.complaint_priority AS ENUM ('low', 'medium', 'high', 'critical');
CREATE TYPE public.complaint_sentiment AS ENUM ('positive', 'neutral', 'concerned', 'negative', 'urgent');

-- =========== PROFILES ===========
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  email TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Profiles are viewable by everyone authenticated"
  ON public.profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);

-- =========== USER ROLES ===========
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN
LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  );
$$;

CREATE OR REPLACE FUNCTION public.is_staff(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id
      AND role IN ('admin','super_admin','department_staff')
  );
$$;

CREATE POLICY "Users can view their own roles"
  ON public.user_roles FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR public.is_staff(auth.uid()));

-- =========== DEPARTMENTS ===========
CREATE TABLE public.departments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  code TEXT NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Departments viewable by all authenticated"
  ON public.departments FOR SELECT TO authenticated USING (true);
CREATE POLICY "Staff can manage departments"
  ON public.departments FOR ALL TO authenticated
  USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));

-- =========== COMPLAINTS ===========
CREATE TABLE public.complaints (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tracking_id TEXT NOT NULL UNIQUE DEFAULT ('CR-' || upper(substr(md5(random()::text), 1, 8))),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT,
  is_anonymous BOOLEAN NOT NULL DEFAULT false,
  location TEXT,
  urgency public.complaint_priority NOT NULL DEFAULT 'medium',
  status public.complaint_status NOT NULL DEFAULT 'submitted',
  assigned_department_id UUID REFERENCES public.departments(id),
  assigned_to UUID REFERENCES auth.users(id),
  escalation_level INT NOT NULL DEFAULT 0,
  -- AI fields
  ai_category TEXT,
  ai_department_id UUID REFERENCES public.departments(id),
  ai_priority public.complaint_priority,
  ai_sentiment public.complaint_sentiment,
  ai_confidence NUMERIC(5,2),
  ai_reasoning TEXT,
  ai_tags TEXT[],
  -- timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  resolved_at TIMESTAMPTZ
);
ALTER TABLE public.complaints ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_complaints_user ON public.complaints(user_id);
CREATE INDEX idx_complaints_status ON public.complaints(status);
CREATE INDEX idx_complaints_dept ON public.complaints(assigned_department_id);
CREATE INDEX idx_complaints_created ON public.complaints(created_at DESC);

CREATE POLICY "Users view own complaints, staff view all"
  ON public.complaints FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR public.is_staff(auth.uid()));
CREATE POLICY "Users create own complaints"
  ON public.complaints FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Owners and staff update complaints"
  ON public.complaints FOR UPDATE TO authenticated
  USING (auth.uid() = user_id OR public.is_staff(auth.uid()));

-- =========== COMPLAINT LOGS ===========
CREATE TABLE public.complaint_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  complaint_id UUID NOT NULL REFERENCES public.complaints(id) ON DELETE CASCADE,
  actor_id UUID REFERENCES auth.users(id),
  action TEXT NOT NULL,
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.complaint_logs ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_logs_complaint ON public.complaint_logs(complaint_id);

CREATE POLICY "Logs viewable by complaint owner or staff"
  ON public.complaint_logs FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.complaints c
      WHERE c.id = complaint_id
        AND (c.user_id = auth.uid() OR public.is_staff(auth.uid()))
    )
  );
CREATE POLICY "Authenticated can insert logs"
  ON public.complaint_logs FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = actor_id);

-- =========== NOTIFICATIONS ===========
CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  complaint_id UUID REFERENCES public.complaints(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT,
  read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_notif_recipient ON public.notifications(recipient_id, read);

CREATE POLICY "Users view own notifications"
  ON public.notifications FOR SELECT TO authenticated
  USING (auth.uid() = recipient_id);
CREATE POLICY "Users update own notifications"
  ON public.notifications FOR UPDATE TO authenticated
  USING (auth.uid() = recipient_id);
CREATE POLICY "Authenticated can insert notifications"
  ON public.notifications FOR INSERT TO authenticated
  WITH CHECK (true);

-- =========== TRIGGERS ===========
-- updated_at maintenance
CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

CREATE TRIGGER trg_profiles_updated BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE TRIGGER trg_complaints_updated BEFORE UPDATE ON public.complaints
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- auto-create profile + student role on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    NEW.raw_user_meta_data->>'avatar_url'
  );
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'student')
  ON CONFLICT DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =========== SEED DEPARTMENTS ===========
INSERT INTO public.departments (name, code, description) VALUES
  ('IT Support', 'IT', 'Computer labs, network, projectors, software issues'),
  ('Hostel Administration', 'HOSTEL', 'Hostel rooms, mess, common areas'),
  ('Hostel Maintenance', 'HOSTEL_MAINT', 'Plumbing, electrical, carpentry in hostels'),
  ('Academic Office', 'ACADEMIC', 'Classes, faculty, exams, grades'),
  ('Campus Safety', 'SAFETY', 'Harassment, security, emergencies'),
  ('Facilities & Maintenance', 'FACILITIES', 'Campus infrastructure, classrooms, equipment');