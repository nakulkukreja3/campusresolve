import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles,
  Send,
  Loader2,
  MapPin,
  EyeOff,
  Brain,
  Tag,
  AlertTriangle,
  CheckCircle2,
  UploadCloud,
  X,
  FileText,
  Image,
  Video,
  FileSpreadsheet,
  Paperclip,
  Building2,
} from "lucide-react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import {
  PageHeader,
  PriorityBadge,
  SentimentBadge,
} from "@/components/app/Primitives";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/submit")({
  component: SubmitComplaint,
});

const schema = z.object({
  title: z.string().trim().min(6, "Title must be at least 6 characters").max(140),
  description: z
    .string()
    .trim()
    .min(20, "Describe the issue in at least 20 characters")
    .max(4000),
  location: z.string().trim().max(140).optional(),
  department_id: z.string().optional(),
});

type Departments = {
  id: string;
  code: string;
  name: string;
}[];

type AiResult = {
  category: string;
  department_code: string;
  priority: "low" | "medium" | "high" | "critical";
  sentiment: "positive" | "neutral" | "concerned" | "negative" | "urgent";
  confidence: number;
  reasoning: string;
  tags: string[];
};

const MAX_FILES = 5;
const MAX_FILE_SIZE = 25 * 1024 * 1024;

const allowedTypes = [
  "image/png",
  "image/jpeg",
  "image/jpg",
  "image/webp",
  "application/pdf",
  "video/mp4",
  "video/webm",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "text/csv",
];

function SubmitComplaint() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [selectedDepartmentId, setSelectedDepartmentId] = useState("");
  const [anonymous, setAnonymous] = useState(false);

  const [departments, setDepartments] = useState<Departments>([]);
  const [ai, setAi] = useState<AiResult | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);

  const [submitting, setSubmitting] = useState(false);
  const [files, setFiles] = useState<File[]>([]);

  const debounceRef = useRef<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    supabase
      .from("departments")
      .select("id, code, name")
      .order("name")
      .then(({ data }) => setDepartments(data ?? []));
  }, []);

  const canClassify = description.trim().length >= 20;

  useEffect(() => {
    if (!canClassify) {
      setAi(null);
      setAiError(null);
      return;
    }

    if (debounceRef.current) window.clearTimeout(debounceRef.current);

    debounceRef.current = window.setTimeout(async () => {
      setAiLoading(true);
      setAiError(null);

      try {
        const { data, error } = await supabase.functions.invoke(
          "classify-complaint",
          {
            body: {
              title,
              description,
              departments: departments.map((d) => ({
                code: d.code,
                name: d.name,
              })),
            },
          },
        );

        if (error) throw error;
        if ((data as any)?.error) throw new Error((data as any).error);

        setAi(data as AiResult);
      } catch (e: any) {
        setAiError(e?.message ?? "AI classification failed");
        setAi(null);
      } finally {
        setAiLoading(false);
      }
    }, 900);

    return () => {
      if (debounceRef.current) window.clearTimeout(debounceRef.current);
    };
  }, [title, description, canClassify, departments]);

  const matchedDept = useMemo(
    () => departments.find((d) => d.code === ai?.department_code),
    [departments, ai],
  );

  const selectedDept = useMemo(
    () => departments.find((d) => d.id === selectedDepartmentId),
    [departments, selectedDepartmentId],
  );

  const finalDepartmentId = selectedDepartmentId || matchedDept?.id || null;

  function handleFiles(selectedFiles: FileList | null) {
    if (!selectedFiles) return;

    const incoming = Array.from(selectedFiles);

    const validFiles = incoming.filter((file) => {
      if (!allowedTypes.includes(file.type)) {
        toast.error(`${file.name} is not supported`);
        return false;
      }

      if (file.size > MAX_FILE_SIZE) {
        toast.error(`${file.name} is larger than 25 MB`);
        return false;
      }

      const alreadyExists = files.some(
        (existing) =>
          existing.name === file.name &&
          existing.size === file.size &&
          existing.lastModified === file.lastModified,
      );

      if (alreadyExists) {
        toast.error(`${file.name} is already added`);
        return false;
      }

      return true;
    });

    const finalFiles = [...files, ...validFiles].slice(0, MAX_FILES);

    if (files.length + validFiles.length > MAX_FILES) {
      toast.error(`You can upload maximum ${MAX_FILES} files`);
    }

    setFiles(finalFiles);

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  function removeFile(index: number) {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  }

  async function uploadAttachments(complaintId: string) {
    if (!user || files.length === 0) return;

    for (const file of files) {
      const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
      const uniqueName = `${crypto.randomUUID()}_${safeName}`;
      const filePath = `${user.id}/${complaintId}/${uniqueName}`;

      const { error: uploadError } = await supabase.storage
        .from("complaint-evidence")
        .upload(filePath, file, {
          cacheControl: "3600",
          upsert: false,
        });

      if (uploadError) throw uploadError;

      const { error: dbError } = await supabase
        .from("complaint_attachments")
        .insert({
          complaint_id: complaintId,
          user_id: user.id,
          file_name: file.name,
          file_path: filePath,
          file_type: file.type,
          file_size: file.size,
          bucket: "complaint-evidence",
        });

      if (dbError) throw dbError;
    }
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();

    const parsed = schema.safeParse({
      title,
      description,
      location,
      department_id: selectedDepartmentId,
    });

    if (!parsed.success) {
      toast.error(parsed.error.issues[0].message);
      return;
    }

    if (!user) {
      toast.error("Please sign in first");
      return;
    }

    setSubmitting(true);

    try {
      const insert = {
        user_id: user.id,
        title: parsed.data.title,
        description: parsed.data.description,
        location: parsed.data.location || null,
        is_anonymous: anonymous,

        urgency: (ai?.priority ?? "medium") as any,
        category: ai?.category ?? null,
        status: "submitted" as any,

        ai_category: ai?.category ?? null,
        ai_priority: (ai?.priority ?? null) as any,
        ai_sentiment: (ai?.sentiment ?? null) as any,
        ai_confidence: ai?.confidence ?? null,
        ai_reasoning: ai?.reasoning ?? null,
        ai_tags: ai?.tags ?? null,
        ai_department_id: matchedDept?.id ?? null,

        assigned_department_id: finalDepartmentId,
      };

      const { data, error } = await supabase
        .from("complaints")
        .insert(insert)
        .select("id, tracking_id")
        .single();

      if (error) throw error;

      await uploadAttachments(data.id);

      const routingNote = selectedDept
        ? `Manually selected department: ${selectedDept.name}`
        : ai
          ? `Auto-routed to ${matchedDept?.name ?? ai.department_code} (${ai.priority})`
          : "Submitted without department routing";

      await supabase.from("complaint_logs").insert({
        complaint_id: data.id,
        actor_id: user.id,
        action: "created",
        note: routingNote,
      });

      await supabase.from("notifications").insert({
        recipient_id: user.id,
        complaint_id: data.id,
        type: "submitted",
        title: `Complaint ${data.tracking_id} submitted`,
        message:
          selectedDept || matchedDept
            ? `Routed to ${selectedDept?.name ?? matchedDept?.name}`
            : "We received your complaint.",
      });

      toast.success(`Submitted as ${data.tracking_id}`);
      navigate({ to: "/complaints/$id", params: { id: data.id } });
    } catch (e: any) {
      toast.error(e?.message ?? "Failed to submit complaint");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div>
      <PageHeader
        title="Submit a complaint"
        subtitle="Add issue details, choose a department if known, and attach evidence."
      />

      <div className="grid gap-6 p-8 lg:grid-cols-[1fr,380px]">
        <form
          onSubmit={onSubmit}
          className="space-y-5 rounded-2xl border border-border bg-gradient-card p-6 shadow-card"
        >
          <Field label="Title" hint="A short summary of the issue">
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Water leakage in hostel block C, room 214"
              maxLength={140}
              className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/30"
            />
          </Field>

          <Field
            label="Description"
            hint="Be specific about when, where, and impact"
          >
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={8}
              maxLength={4000}
              placeholder="Describe the issue in detail."
              className="w-full resize-none rounded-lg border border-input bg-background px-3 py-2.5 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/30"
            />

            <div className="mt-1 flex justify-end text-[11px] text-muted-foreground">
              {description.length}/4000
            </div>
          </Field>

          <Field label="Department" hint="Optional, AI can decide if unsure">
            <div className="relative">
              <Building2 className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />

              <select
                value={selectedDepartmentId}
                onChange={(e) => setSelectedDepartmentId(e.target.value)}
                className="w-full appearance-none rounded-lg border border-input bg-background py-2.5 pl-9 pr-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/30"
              >
                <option value="">Let AI decide</option>
                {departments.map((dept) => (
                  <option key={dept.id} value={dept.id}>
                    {dept.name} ({dept.code})
                  </option>
                ))}
              </select>
            </div>
          </Field>

          <Field label="Location" hint="Optional">
            <div className="relative">
              <MapPin className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />

              <input
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Building, room, area"
                className="w-full rounded-lg border border-input bg-background py-2.5 pl-9 pr-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/30"
              />
            </div>
          </Field>

          <Field label="Evidence" hint="Photos, PDF, Excel, CSV, or video">
            <label className="group flex cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-background/50 px-4 py-6 text-center transition hover:border-primary/50 hover:bg-primary/5">
              <UploadCloud className="mb-2 h-8 w-8 text-muted-foreground transition group-hover:text-primary" />

              <div className="text-sm font-medium">Upload evidence files</div>

              <div className="mt-1 text-xs text-muted-foreground">
                Maximum 5 files, 25 MB each
              </div>

              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/*,application/pdf,video/mp4,video/webm,.xls,.xlsx,.csv"
                onChange={(e) => handleFiles(e.target.files)}
                className="hidden"
              />
            </label>

            {files.length > 0 && (
              <div className="mt-3 space-y-2">
                {files.map((file, index) => (
                  <FileRow
                    key={`${file.name}-${file.size}-${index}`}
                    file={file}
                    onRemove={() => removeFile(index)}
                  />
                ))}
              </div>
            )}
          </Field>

          <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-dashed border-border bg-background/40 px-3 py-2.5 text-sm">
            <input
              type="checkbox"
              checked={anonymous}
              onChange={(e) => setAnonymous(e.target.checked)}
              className="h-4 w-4 rounded border-input accent-primary"
            />

            <EyeOff className="h-4 w-4 text-muted-foreground" />

            <span>Submit anonymously</span>
          </label>

          <div className="flex items-center justify-between gap-4 border-t border-border pt-4">
            <div className="text-xs text-muted-foreground">
              Evidence files will be stored securely with your complaint.
            </div>

            <button
              type="submit"
              disabled={submitting || !canClassify}
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-glow transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {submitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}

              {submitting ? "Submitting..." : "Submit complaint"}
            </button>
          </div>
        </form>

        <aside className="space-y-4">
          <div className="rounded-2xl border border-border bg-gradient-card p-5 shadow-card">
            <div className="mb-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/15 text-primary">
                  <Brain className="h-4 w-4" />
                </span>

                <div>
                  <div className="text-sm font-semibold">AI triage preview</div>
                  <div className="text-[11px] text-muted-foreground">
                    Updates as you type
                  </div>
                </div>
              </div>

              {aiLoading && (
                <Loader2 className="h-4 w-4 animate-spin text-primary" />
              )}
            </div>

            <AnimatePresence mode="wait">
              {!canClassify && (
                <motion.p
                  key="hint"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="text-xs text-muted-foreground"
                >
                  Type at least 20 characters in the description to see live AI
                  predictions.
                </motion.p>
              )}

              {aiError && (
                <motion.div
                  key="err"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex items-start gap-2 rounded-lg bg-destructive/10 p-3 text-xs text-destructive"
                >
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                  <span>{aiError}</span>
                </motion.div>
              )}

              {ai && !aiError && (
                <motion.div
                  key="result"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-3"
                >
                  <Row label="AI Department">
                    <span className="text-xs font-medium">
                      {matchedDept?.name ?? ai.department_code}
                    </span>
                  </Row>

                  {selectedDept && (
                    <Row label="Selected">
                      <span className="text-xs font-medium text-primary">
                        {selectedDept.name}
                      </span>
                    </Row>
                  )}

                  <Row label="Category">
                    <span className="text-xs font-medium">{ai.category}</span>
                  </Row>

                  <Row label="Priority">
                    <PriorityBadge priority={ai.priority} />
                  </Row>

                  <Row label="Sentiment">
                    <SentimentBadge sentiment={ai.sentiment} />
                  </Row>

                  <Row label="Confidence">
                    <div className="flex items-center gap-2">
                      <div className="h-1.5 w-20 overflow-hidden rounded-full bg-muted">
                        <div
                          className="h-full rounded-full bg-gradient-primary"
                          style={{ width: `${ai.confidence}%` }}
                        />
                      </div>

                      <span className="text-xs font-medium">
                        {Math.round(ai.confidence)}%
                      </span>
                    </div>
                  </Row>

                  {ai.tags?.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {ai.tags.map((t) => (
                        <span
                          key={t}
                          className="inline-flex items-center gap-1 rounded-md bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary"
                        >
                          <Tag className="h-2.5 w-2.5" />
                          {t}
                        </span>
                      ))}
                    </div>
                  )}

                  <p className="border-t border-border pt-3 text-[11px] leading-relaxed text-muted-foreground">
                    {ai.reasoning}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="rounded-2xl border border-border bg-background/40 p-5 text-xs text-muted-foreground">
            <div className="mb-2 flex items-center gap-2 text-foreground">
              <Sparkles className="h-3.5 w-3.5 text-primary" />
              <span className="font-semibold">How routing works</span>
            </div>

            <ul className="space-y-2">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="mt-0.5 h-3 w-3 text-success" />
                You can select a department manually if you know the right one.
              </li>

              <li className="flex items-start gap-2">
                <CheckCircle2 className="mt-0.5 h-3 w-3 text-success" />
                If no department is selected, AI routes it automatically.
              </li>

              <li className="flex items-start gap-2">
                <CheckCircle2 className="mt-0.5 h-3 w-3 text-success" />
                Evidence files stay attached for staff review.
              </li>
            </ul>
          </div>
        </aside>
      </div>
    </div>
  );
}

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="mb-1.5 flex items-end justify-between gap-3">
        <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          {label}
        </label>

        {hint && (
          <span className="text-right text-[11px] text-muted-foreground/70">
            {hint}
          </span>
        )}
      </div>

      {children}
    </div>
  );
}

function Row({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-[11px] uppercase tracking-wider text-muted-foreground">
        {label}
      </span>

      {children}
    </div>
  );
}

function FileRow({
  file,
  onRemove,
}: {
  file: File;
  onRemove: () => void;
}) {
  const Icon = getFileIcon(file.type);

  return (
    <div className="flex items-center gap-3 rounded-xl border border-border bg-background/70 px-3 py-2">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
        <Icon className="h-4 w-4" />
      </div>

      <div className="min-w-0 flex-1">
        <div className="truncate text-sm font-medium">{file.name}</div>

        <div className="text-[11px] text-muted-foreground">
          {formatFileSize(file.size)}
        </div>
      </div>

      <button
        type="button"
        onClick={onRemove}
        className="rounded-lg p-1.5 text-muted-foreground transition hover:bg-destructive/10 hover:text-destructive"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}

function getFileIcon(type: string) {
  if (type.startsWith("image/")) return Image;
  if (type.startsWith("video/")) return Video;

  if (
    type.includes("spreadsheet") ||
    type.includes("excel") ||
    type.includes("csv")
  ) {
    return FileSpreadsheet;
  }

  if (type.includes("pdf")) return FileText;

  return Paperclip;
}

function formatFileSize(size: number) {
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;

  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}
