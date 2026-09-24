"use client";

import { createContext, useContext } from "react";
import type { AdapterMode } from "./types";

/** `WebMcpProvider` writes this; only `AgentToolsStatus` reads it (SPEC §2.7). */
export interface WebMcpStatus {
  mode: AdapterMode | "checking";
  count: number;
}

export const INITIAL_WEBMCP_STATUS: WebMcpStatus = { mode: "checking", count: 0 };

export const WebMcpStatusContext = createContext<WebMcpStatus>(INITIAL_WEBMCP_STATUS);

export function useWebMcpStatus(): WebMcpStatus {
  return useContext(WebMcpStatusContext);
}
