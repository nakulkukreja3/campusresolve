import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  User,
  Mail,
  Shield,
  MapPin,
  Calendar,
  Hash,
  Phone,
  Save,
  GraduationCap,
  CheckCircle2,
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_app/profile")({
  component: ProfilePage,
});

type ProfileForm = {
  full_name: string;
  username: string;
  age: string;
  roll_number: string;
  phone: string;
  address: string;
  course: string;
  semester: string;
};

const initialForm: ProfileForm = {
  full_name: "",
  username: "",
  age: "",
  roll_number: "",
  phone: "",
  address: "",
  course: "",
  semester: "",
};

function ProfilePage() {
  const { user, isStaff } = useAuth();
  const [form, setForm] = useState<ProfileForm>(initialForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function loadProfile() {
      if (!user) return;

      setLoading(true);

      const { data, error } = await supabase
        .from("profiles")
        .select(
          "full_name, username, age, roll_number, phone, address, course, semester",
        )
        .eq("id", user.id)
        .maybeSingle();

      if (error) {
        toast.error(error.message);
      }

      if (data) {
        setForm({
          full_name: data.full_name ?? "",
          username: data.username ?? "",
          age: data.age ? String(data.age) : "",
          roll_number: data.roll_number ?? "",
          phone: data.phone ?? "",
          address: data.address ?? "",
          course: data.course ?? "",
          semester: data.semester ?? "",
        });
      }

      setLoading(false);
    }

    loadProfile();
  }, [user]);

  const displayName =
    form.full_name.trim() ||
    form.username.trim() ||
    user?.email?.split("@")[0] ||
    "there";

  const completion = useMemo(() => {
    const fields = [
      form.full_name,
      form.username,
      form.age,
      form.roll_number,
      form.phone,
      form.address,
      form.course,
      form.semester,
      user?.email,
    ];

    const filled = fields.filter((value) => String(value ?? "").trim()).length;

    return Math.round((filled / fields.length) * 100);
  }, [form, user]);

  function updateField(key: keyof ProfileForm, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function saveProfile() {
    if (!user) return;

    setSaving(true);

    const payload = {
      id: user.id,
      email: user.email,
      full_name: form.full_name.trim() || null,
      username: form.username.trim() || null,
      age: form.age ? Number(form.age) : null,
      roll_number: form.roll_number.trim() || null,
      phone: form.phone.trim() || null,
      address: form.address.trim() || null,
      course: form.course.trim() || null,
      semester: form.semester.trim() || null,
      updated_at: new Date().toISOString(),
    };

    const { error } = await supabase.from("profiles").upsert(payload);

    setSaving(false);

    if (error) {
      toast.error(error.message);
      return;
    }

    toast.success("Profile updated successfully");
  }

  return (
    <div className="min-h-screen bg-background px-5 py-6 md:px-8">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.24 }}
        className="mx-auto max-w-6xl space-y-6"
      >
        <motion.section
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.24 }}
          className="overflow-hidden rounded-3xl border border-border bg-gradient-to-br from-primary/10 via-background to-background p-6 shadow-card"
        >
          <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-sm font-medium uppercase tracking-[0.22em] text-muted-foreground">
                CampusResolve Profile
              </p>

              <h1 className="mt-3 font-display text-4xl font-black tracking-tight md:text-6xl">
                Hello,{" "}
                <span className="bg-gradient-to-r from-primary via-violet-500 to-cyan-400 bg-clip-text text-transparent">
                  {displayName}
                </span>
              </h1>

              <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
                Manage your student identity, contact details, and account
                information for smoother grievance tracking.
              </p>
            </div>

            <div className="rounded-2xl border border-primary/20 bg-primary/10 px-4 py-2 text-sm font-semibold text-primary">
              {isStaff ? "Staff Account" : "Student Account"}
            </div>
          </div>
        </motion.section>

        <section className="grid gap-5 lg:grid-cols-[360px,1fr]">
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.24, delay: 0.04 }}
            className="rounded-3xl border border-border bg-gradient-card p-6 shadow-card"
          >
            <div>
              <h2 className="text-xl font-semibold">Profile strength</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Your profile becomes stronger as you complete more details.
              </p>
            </div>

            <div className="mt-7 rounded-2xl border border-border bg-background/50 p-4">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-sm font-medium">Completion</span>
                <span className="text-sm font-semibold text-primary">
                  {completion}%
                </span>
              </div>

              <div className="h-2 overflow-hidden rounded-full bg-muted">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${completion}%` }}
                  transition={{ duration: 0.35, ease: "easeOut" }}
                  className="h-full rounded-full bg-gradient-primary"
                />
              </div>

              <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
                Add your academic and contact details to improve verification
                and complaint handling.
              </p>
            </div>

            <div className="mt-5 grid gap-3">
              <InfoCard
                icon={Mail}
                label="Email"
                value={user?.email ?? "Not available"}
              />
              <InfoCard
                icon={Shield}
                label="Role"
                value={isStaff ? "Staff" : "Student"}
              />
              <InfoCard icon={CheckCircle2} label="Status" value="Active" />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.24, delay: 0.08 }}
            className="rounded-3xl border border-border bg-card p-6 shadow-card"
          >
            <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-xl font-semibold">Personal details</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Keep your profile accurate and updated.
                </p>
              </div>

              <button
                type="button"
                onClick={saveProfile}
                disabled={saving || loading}
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-glow transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Save className="h-4 w-4" />
                {saving ? "Saving..." : "Save changes"}
              </button>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <ProfileInput
                icon={User}
                label="Full name"
                value={form.full_name}
                placeholder="Enter your full name"
                onChange={(value) => updateField("full_name", value)}
              />

              <ProfileInput
                icon={Hash}
                label="Username"
                value={form.username}
                placeholder="e.g. nakul_kukreja"
                onChange={(value) => updateField("username", value)}
              />

              <ProfileInput
                icon={Calendar}
                label="Age"
                value={form.age}
                type="number"
                placeholder="Enter your age"
                onChange={(value) => updateField("age", value)}
              />

              <ProfileInput
                icon={GraduationCap}
                label="Roll number"
                value={form.roll_number}
                placeholder="Enter roll number"
                onChange={(value) => updateField("roll_number", value)}
              />

              <ProfileInput
                icon={Phone}
                label="Phone"
                value={form.phone}
                placeholder="Enter phone number"
                onChange={(value) => updateField("phone", value)}
              />

              <ProfileInput
                icon={GraduationCap}
                label="Course"
                value={form.course}
                placeholder="e.g. BCA"
                onChange={(value) => updateField("course", value)}
              />

              <ProfileInput
                icon={Hash}
                label="Semester"
                value={form.semester}
                placeholder="e.g. 6th Semester"
                onChange={(value) => updateField("semester", value)}
              />

              <ProfileInput
                icon={MapPin}
                label="Address"
                value={form.address}
                placeholder="Enter address"
                onChange={(value) => updateField("address", value)}
              />
            </div>
          </motion.div>
        </section>
      </motion.div>
    </div>
  );
}

function ProfileInput({
  icon: Icon,
  label,
  value,
  placeholder,
  type = "text",
  onChange,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  placeholder: string;
  type?: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="group block rounded-2xl border border-border bg-background/50 p-4 transition hover:border-primary/40 hover:bg-background">
      <div className="mb-2 flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
        <Icon className="h-4 w-4 text-primary" />
        {label}
      </div>

      <input
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground/60"
      />
    </label>
  );
}

function InfoCard({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-border bg-background/50 p-3">
      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
        <Icon className="h-4 w-4" />
      </div>

      <div className="min-w-0">
        <div className="text-[11px] uppercase tracking-wide text-muted-foreground">
          {label}
        </div>
        <div className="truncate text-sm font-medium">{value}</div>
      </div>
    </div>
  );
}
