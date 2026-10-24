import { cloudAllowed } from "./settings.js";
import { buildToolDefinitions } from "../tools/definitions.js";
import { toolExecutor } from "../tools/executor.js";
import { optimizeToolResult } from "./tokenOptimizer.js";
import { openaiRequest } from "./openai.js";
import type { PipelineConfig, PipelineEvent, AgentResult } from "@ella/shared";
import type { ToolName } from "@ella/shared";

// ── Vordefinierte Pipelines ──────────────────────────────────────────────────

export const PREDEFINED_PIPELINES: PipelineConfig[] = [
  {
    id: "morning_briefing",
    name: "Morgenbriefing",
    description:
      "Kalender, offene Aufgaben und Wetter — kombiniert zu einem persönlichen Tagesstart.",
    icon: "🌅",
    executionMode: "parallel",
    agents: [
      {
        id: "calendar",
        name: "Kalender",
        role: "Du bist ein Kalender-Assistent. Lies den heutigen Kalender (Outlook und Google falls verfügbar) und liste alle Termine des heutigen Tages übersichtlich auf. Gib nur die Termine aus, keine Erklärungen.",
        tools: [
          "get_datetime",
          "read_calendar",
          "read_google_calendar",
          "list_alarms",
        ],
      },
      {
        id: "tasks",
        name: "Aufgaben",
        role: "Du bist ein Aufgaben-Assistent. Liste alle offenen Aufgaben und fälligen Erinnerungen auf. Sortiere nach Priorität wenn erkennbar. Gib nur die Aufgaben aus, keine Erklärungen.",
        tools: ["list_tasks", "list_reminders", "get_datetime"],
      },
      {
        id: "weather",
        name: "Wetter",
        role: "Du bist ein Wetter-Assistent. Hole das aktuelle Wetter für den aktuellen Standort und gib eine kurze, freundliche Wettervorhersage für heute aus.",
        tools: ["get_weather", "get_location", "get_datetime"],
      },
    ],
  },
  {
    id: "system_report",
    name: "System-Report",
    description:
      "Vollständiger Überblick über Speicher, RAM, Temperaturen, Prozesse und Netzwerk.",
    icon: "📊",
    executionMode: "parallel",
    agents: [
      {
        id: "storage",
        name: "Speicher",
        role: "Du bist ein Speicher-Analyst. Prüfe den Speicherplatz aller Laufwerke und melde kritische Füllstände (>85%). Gib eine kompakte Übersicht aus.",
        tools: ["get_disk_usage"],
      },
      {
        id: "performance",
        name: "Performance",
        role: "Du bist ein Performance-Analyst. Prüfe RAM-Auslastung, CPU-Temperaturen und Systemstatus. Melde nur Werte, die konkrete Schwellwerte überschreiten: RAM >85%, Temperatur >85°C, Akku <15%. Unter diesen Schwellen: kein Kommentar, keine Wertung. Gib eine kompakte Übersicht aus.",
        tools: [
          "get_system_status",
          "get_system_info",
          "get_battery_status",
          "get_temperatures",
          "free_ram",
        ],
      },
      {
        id: "processes",
        name: "Prozesse",
        role: "Du bist ein Prozess-Analyst. Liste die Top-10 Prozesse nach CPU/RAM-Auslastung auf — Name, CPU%, RAM. Keine Wertungen, keine Verdachtshinweise. Zahlen sprechen für sich.",
        tools: ["list_processes"],
      },
      {
        id: "network",
        name: "Netzwerk",
        role: "Du bist ein Netzwerk-Analyst. Zeige: (1) WLAN-Verbindung mit SSID falls verfügbar, sonst 'Kein WLAN'. (2) Anzahl aktiver Verbindungen und die Top-10 nach Prozessname gruppiert. Keine Verdachtshinweise, keine Anomaliemeldungen — ELLA hat kein Kriterium, das gut von böse trennt. Loopback-Adressen (127.0.0.1, ::1) in der Ausgabe weglassen — die verlassen das Gerät nicht. Externe HTTPS-Verbindungen (Port 443) sind normaler Internetverkehr. 'Prozessname unbekannt' ist kein Verdacht — das bedeutet nur dass der Owner nicht aufgelöst werden konnte. Zeige Fakten, keine Wertungen.",
        tools: ["get_wifi_info", "list_connections"],
      },
    ],
  },
];

// ── OpenAI-Hilfsfunktionen ───────────────────────────────────────────────────

interface OAIMessage {
  role: "system" | "user" | "assistant" | "tool";
  content: string | null;
  tool_call_id?: string;
  tool_calls?: Array<{
    id: string;
    type: "function";
    function: { name: string; arguments: string };
  }>;
}

interface OAIStreamChunk {
  choices: Array<{
    delta: {
      content?: string | null;
      tool_calls?: Array<{
        index: number;
        id?: string;
        function?: { name?: string; arguments?: string };
      }>;
    };
    finish_reason?: string | null;
  }>;
}

async function runAgentWithOpenAI(
  agentRole: string,
  toolNames: string[],
  previousContext: string,
  onEvent: (event: PipelineEvent) => void,
  agentId: string,
  agentName: string,
): Promise<AgentResult> {
  if (!cloudAllowed())
    throw new Error("Multi-Agenten benötigen den Cloud-Modus");

  const allDefs = buildToolDefinitions([]);
  const agentTools = allDefs.filter((t) => toolNames.includes(t.function.name));

  const userMessage = previousContext
    ? `Kontext aus vorherigen Agenten:\n${previousContext}\n\nBitte führe deine Aufgabe aus.`
    : "Bitte führe deine Aufgabe aus.";

  const messages: OAIMessage[] = [
    { role: "system", content: agentRole },
    { role: "user", content: userMessage },
  ];

  const toolsUsed: string[] = [];
  let finalContent = "";
  const MAX_ROUNDS = 4;

  for (let round = 0; round < MAX_ROUNDS; round++) {
    const response = await openaiRequest(
      "/v1/chat/completions",
      {
        body: JSON.stringify({
          model: "gpt-4o",
          messages,
          stream: true,
          ...(agentTools.length > 0 && {
            tools: agentTools.map((t) => ({
              type: "function",
              function: t.function,
            })),
          }),
        }),
      },
      "pipeline",
    );

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`OpenAI Fehler ${response.status}: ${text}`);
    }

    const reader = response.body!.getReader();
    const decoder = new TextDecoder();
    let buffer = "";

    // Sammle Tool-Calls über den Stream
    const pendingToolCalls: Map<
      number,
      { id: string; name: string; args: string }
    > = new Map();
    let roundContent = "";
    let finishReason: string | null = null;

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() ?? "";

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || trimmed === "data: [DONE]") continue;
        const jsonStr = trimmed.startsWith("data: ")
          ? trimmed.slice(6)
          : trimmed;
        try {
          const chunk = JSON.parse(jsonStr) as OAIStreamChunk;
          const delta = chunk.choices[0]?.delta;
          if (!delta) continue;

          if (delta.content) {
            roundContent += delta.content;
            onEvent({ type: "agent_chunk", agentId, text: delta.content });
          }

          if (delta.tool_calls) {
            for (const tc of delta.tool_calls) {
              const existing = pendingToolCalls.get(tc.index) ?? {
                id: "",
                name: "",
                args: "",
              };
              if (tc.id) existing.id = tc.id;
              if (tc.function?.name) existing.name += tc.function.name;
              if (tc.function?.arguments)
                existing.args += tc.function.arguments;
              pendingToolCalls.set(tc.index, existing);
            }
          }

          if (chunk.choices[0]?.finish_reason) {
            finishReason = chunk.choices[0].finish_reason;
          }
        } catch {
          // Ungültiger JSON-Chunk — ignorieren
        }
      }
    }

    // Keine Tool-Calls → fertig
    if (pendingToolCalls.size === 0 || finishReason !== "tool_calls") {
      finalContent = roundContent;
      break;
    }

    // Tool-Calls ausführen
    const assistantToolCalls = [...pendingToolCalls.values()].map((tc) => ({
      id: tc.id || `call_${Date.now()}`,
      type: "function" as const,
      function: { name: tc.name, arguments: tc.args },
    }));

    messages.push({
      role: "assistant",
      content: roundContent || null,
      tool_calls: assistantToolCalls,
    });

    for (const tc of assistantToolCalls) {
      onEvent({ type: "agent_tool", agentId, toolName: tc.function.name });
      if (!toolsUsed.includes(tc.function.name))
        toolsUsed.push(tc.function.name);

      let parsedArgs: Record<string, unknown> = {};
      try {
        parsedArgs = JSON.parse(tc.function.arguments) as Record<
          string,
          unknown
        >;
      } catch {
        // leere Args
      }

      const result = await toolExecutor.execute({
        tool: tc.function.name as ToolName,
        args: parsedArgs,
      });

      messages.push({
        role: "tool",
        tool_call_id: tc.id,
        content: optimizeToolResult(result),
      });
    }
  }

  onEvent({ type: "agent_done", agentId, content: finalContent, toolsUsed });
  return {
    agentId,
    agentName,
    content: finalContent,
    toolsUsed,
    status: "done",
  };
}

// ── Pipeline-Runner ──────────────────────────────────────────────────────────

export async function runPipeline(
  config: PipelineConfig,
  onEvent: (event: PipelineEvent) => void,
  setupName?: string,
): Promise<void> {
  const results: AgentResult[] = [];

  if (config.executionMode === "parallel") {
    // Alle Agents parallel starten
    const promises = config.agents.map(async (agent) => {
      onEvent({
        type: "agent_start",
        agentId: agent.id,
        agentName: agent.name,
      });
      try {
        const result = await runAgentWithOpenAI(
          agent.role,
          agent.tools,
          "",
          onEvent,
          agent.id,
          agent.name,
        );
        return result;
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Unbekannter Fehler";
        onEvent({
          type: "agent_chunk",
          agentId: agent.id,
          text: `[Fehler: ${msg}]`,
        });
        onEvent({
          type: "agent_done",
          agentId: agent.id,
          content: "",
          toolsUsed: [],
        });
        return {
          agentId: agent.id,
          agentName: agent.name,
          content: "",
          toolsUsed: [],
          status: "error" as const,
          error: msg,
        };
      }
    });

    const agentResults = await Promise.all(promises);
    results.push(...agentResults);
  } else {
    // Sequenziell — Ergebnis des vorherigen Agents als Kontext
    for (const agent of config.agents) {
      onEvent({
        type: "agent_start",
        agentId: agent.id,
        agentName: agent.name,
      });
      const previousContext = results
        .map((r) => `[${r.agentName}]: ${r.content}`)
        .join("\n\n");
      try {
        const result = await runAgentWithOpenAI(
          agent.role,
          agent.tools,
          previousContext,
          onEvent,
          agent.id,
          agent.name,
        );
        results.push(result);
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Unbekannter Fehler";
        onEvent({
          type: "agent_chunk",
          agentId: agent.id,
          text: `[Fehler: ${msg}]`,
        });
        onEvent({
          type: "agent_done",
          agentId: agent.id,
          content: "",
          toolsUsed: [],
        });
        results.push({
          agentId: agent.id,
          agentName: agent.name,
          content: "",
          toolsUsed: [],
          status: "error",
          error: msg,
        });
      }
    }
  }

  // Zusammenfassung durch separaten Synthese-Aufruf
  let summary = "";

  if (cloudAllowed() && results.some((r) => r.content)) {
    const synthMessages: OAIMessage[] = [
      {
        role: "system",
        content:
          "Du bist ein Assistent der Ergebnisse mehrerer Analyse-Agenten zu einer klaren, freundlichen Zusammenfassung kombiniert. Fasse kompakt zusammen ohne Redundanz.",
      },
      {
        role: "user",
        content:
          `Pipeline: ${config.name}\n\n` +
          results
            .filter((r) => r.content)
            .map((r) => `**${r.agentName}:**\n${r.content}`)
            .join("\n\n"),
      },
    ];

    try {
      const resp = await openaiRequest(
        "/v1/chat/completions",
        {
          body: JSON.stringify({ model: "gpt-4o", messages: synthMessages }),
        },
        "pipeline",
      );
      if (resp.ok) {
        const data = (await resp.json()) as {
          choices: Array<{ message: { content: string } }>;
        };
        summary = data.choices[0]?.message?.content ?? "";
      }
    } catch {
      // Synthese optional — kein harter Fehler
    }
  }

  onEvent({ type: "pipeline_done", results, summary });

  if (setupName) {
    try {
      const result = await toolExecutor.execute({
        tool: "load_setup",
        args: { name: setupName },
      });
      onEvent({
        type: "setup_executed",
        setupName,
        success: result.success,
        message: result.success
          ? ((result.output as string) ?? `${setupName} ausgeführt.`)
          : ((result.error as string) ?? "Setup fehlgeschlagen."),
      });
    } catch (err) {
      onEvent({
        type: "setup_executed",
        setupName,
        success: false,
        message: err instanceof Error ? err.message : "Setup fehlgeschlagen.",
      });
    }
  }
}
