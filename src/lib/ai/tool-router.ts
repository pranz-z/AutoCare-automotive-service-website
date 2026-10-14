/**
 * Demo tool router - validates and executes tool calls with role-based permissions.
 */

import {
  publicTools,
  staffTools,
  toolDefinitions,
  type ToolResult,
} from "./demo-tools";
import type { ToolDefinition } from "./demo-tools";

export type ToolCall = {
  name: string;
  arguments: Record<string, unknown>;
};

export type ToolResponse = {
  tool: string;
  result: ToolResult;
};

// Re-export toolDefinitions for convenience
export { toolDefinitions };

/**
 * Get all tools available for a given permission level
 */
export function getToolsForRole(role: "public" | "staff") {
  return toolDefinitions.filter((t) => t.permission === role);
}

/**
 * Validate tool arguments against the tool definition
 */
function validateToolArguments(toolName: string, args: Record<string, unknown>): { valid: boolean; error?: string } {
  const tool = toolDefinitions.find((t) => t.name === toolName);
  if (!tool) {
    return { valid: false, error: `Unknown tool: ${toolName}` };
  }

  // Check for required arguments (we don't enforce required, just validate types)
  // This is a simplified validation - in production you'd check more rigorously
  for (const [key, value] of Object.entries(args)) {
    if (value !== undefined && value !== null) {
      if (typeof value !== "string" && typeof value !== "number" && typeof value !== "boolean") {
        return { valid: false, error: `Invalid type for argument ${key}` };
      }
    }
  }

  return { valid: true };
}

/**
 * Execute a tool call with proper permissions
 */
export async function executeTool(
  toolName: string,
  args: Record<string, unknown>,
  isStaff: boolean
): Promise<ToolResponse> {
  const tool = toolDefinitions.find((t) => t.name === toolName);

  if (!tool) {
    return {
      tool: toolName,
      result: { success: false, error: `Unknown tool: ${toolName}` },
    };
  }

  // Check permission
  if (tool.permission === "staff" && !isStaff) {
    return {
      tool: toolName,
      result: { success: false, error: "This tool requires staff access. Please use the admin/demo mode." },
    };
  }

  // Validate arguments
  const validation = validateToolArguments(toolName, args);
  if (!validation.valid) {
    return {
      tool: toolName,
      result: { success: false, error: validation.error },
    };
  }

  // Get the appropriate tool map
  const tools = isStaff ? staffTools : publicTools;
  const execute = tools[toolName];

  if (!execute) {
    return {
      tool: toolName,
      result: { success: false, error: `Tool not available: ${toolName}` },
    };
  }

  try {
    const result = await execute(args);
    return { tool: toolName, result };
  } catch (error) {
    return {
      tool: toolName,
      result: {
        success: false,
        error: error instanceof Error ? error.message : "Tool execution failed",
      },
    };
  }
}

/**
 * Execute multiple tool calls in parallel
 */
export async function executeTools(
  toolCalls: ToolCall[],
  isStaff: boolean
): Promise<ToolResponse[]> {
  const results = await Promise.all(
    toolCalls.map((call) => executeTool(call.name, call.arguments, isStaff))
  );
  return results;
}

/**
 * Format tool results for the AI model
 */
export function formatToolResultsForModel(responses: ToolResponse[]): string {
  const lines: string[] = [];
  for (const response of responses) {
    lines.push(`[Tool: ${response.tool}]`);
    if (response.result.success) {
      lines.push(`Result: ${JSON.stringify(response.result.data)}`);
    } else {
      lines.push(`Error: ${response.result.error}`);
    }
    lines.push("");
  }
  return lines.join("\n");
}