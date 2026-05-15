// Lovable AI Gateway — classify a complaint into category, department, priority, sentiment.
// Public function (no JWT required) so any authenticated user can call it freely.
import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const SYSTEM = `You are CampusResolve AI, a triage engine for university grievances.
Given a complaint title + description and a list of departments, you must:
- pick the best matching department from the list
- assign a category (e.g. Infrastructure, Safety, Academic, Maintenance, Hostel, IT, Administrative)
- assign a priority: low | medium | high | critical
- assign a sentiment: positive | neutral | concerned | negative | urgent
- give a confidence 0-100
- short reasoning (max 2 sentences)
- 2-4 short tags

Safety/harassment/violence -> critical priority + urgent sentiment.
Electrical/water hazards -> high priority.`;

const tools = [
  {
    type: "function",
    function: {
      name: "classify_complaint",
      description: "Return a structured triage classification.",
      parameters: {
        type: "object",
        properties: {
          category: { type: "string" },
          department_code: { type: "string" },
          priority: {
            type: "string",
            enum: ["low", "medium", "high", "critical"],
          },
          sentiment: {
            type: "string",
            enum: ["positive", "neutral", "concerned", "negative", "urgent"],
          },
          confidence: { type: "number" },
          reasoning: { type: "string" },
          tags: { type: "array", items: { type: "string" } },
        },
        required: [
          "category",
          "department_code",
          "priority",
          "sentiment",
          "confidence",
          "reasoning",
          "tags",
        ],
        additionalProperties: false,
      },
    },
  },
];

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { title, description, departments } = await req.json();
    if (!description || typeof description !== "string") {
      return new Response(JSON.stringify({ error: "description required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const deptList = (departments ?? [])
      .map((d: { code: string; name: string }) => `- ${d.code}: ${d.name}`)
      .join("\n");

    const userMsg = `Departments available:\n${deptList}\n\nComplaint Title: ${title ?? "(none)"}\n\nComplaint Description:\n${description}`;

    const aiRes = await fetch(
      "https://ai.gateway.lovable.dev/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: [
            { role: "system", content: SYSTEM },
            { role: "user", content: userMsg },
          ],
          tools,
          tool_choice: { type: "function", function: { name: "classify_complaint" } },
        }),
      }
    );

    if (!aiRes.ok) {
      const t = await aiRes.text();
      console.error("AI gateway error", aiRes.status, t);
      if (aiRes.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limited. Please wait and try again." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (aiRes.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI credits exhausted. Add funds to your workspace." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      throw new Error(`AI gateway ${aiRes.status}`);
    }

    const data = await aiRes.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) throw new Error("No tool call in AI response");
    const args = JSON.parse(toolCall.function.arguments);

    return new Response(JSON.stringify(args), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("classify error", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
