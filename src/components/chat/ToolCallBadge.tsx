"use client";

import { ToolInvocation } from "ai";
import { Loader2 } from "lucide-react";

/**
 * Converts raw tool name + args into a human-readable action label.
 * Exported separately so it can be unit-tested without rendering.
 */
export function getToolLabel(toolName: string, args: Record<string, unknown>): string {
  if (toolName === "str_replace_editor") {
    const path = String(args.path ?? "");
    switch (args.command) {
      case "create":     return `Creating ${path}`;
      case "str_replace":
      case "insert":     return `Editing ${path}`;
      case "view":       return `Viewing ${path}`;
      case "undo_edit":  return `Undoing edit in ${path}`;
    }
  }

  if (toolName === "file_manager") {
    const path = String(args.path ?? "");
    switch (args.command) {
      case "rename": return `Renaming ${path}`;
      case "delete": return `Deleting ${path}`;
    }
  }

  return toolName;
}

interface ToolCallBadgeProps {
  toolInvocation: ToolInvocation;
}

export function ToolCallBadge({ toolInvocation }: ToolCallBadgeProps) {
  const label = getToolLabel(toolInvocation.toolName, toolInvocation.args as Record<string, unknown>);
  const isDone = toolInvocation.state === "result" && "result" in toolInvocation && toolInvocation.result != null;

  return (
    <div className="inline-flex items-center gap-2 mt-2 px-3 py-1.5 bg-neutral-50 rounded-lg text-xs font-mono border border-neutral-200">
      {isDone ? (
        <>
          <div className="w-2 h-2 rounded-full bg-emerald-500" />
          <span className="text-neutral-700">{label}</span>
        </>
      ) : (
        <>
          <Loader2 className="w-3 h-3 animate-spin text-blue-600" />
          <span className="text-neutral-700">{label}</span>
        </>
      )}
    </div>
  );
}
