/**
 * Role-Aware Coaching Context Layer for CPI Framework.
 * 
 * Provides role-specific coaching applications for:
 * - Batsman
 * - Bowler
 * - Wicketkeeper
 * - Fielder
 * 
 * Strictly follows coach-approved guidelines and exact source wording from CPI_PREDEFINED_SOURCE.
 */

import { CPI_PREDEFINED_SOURCE, normalizeCpiParameterName, ApprovedCpiParameter } from "./cpiPredefinedSource";

export interface RoleParameterContext {
  highContext: string;
  lowContext: string;
  generalContext: string;
}

export type SupportedRole = "Batsman" | "Bowler" | "Wicketkeeper" | "Fielder";

function getSourceWordingForParam(paramName: ApprovedCpiParameter) {
  const src = CPI_PREDEFINED_SOURCE[paramName];
  return {
    highContext: src.practice.high.actionPoints[0] || src.practice.high.summary,
    lowContext: src.practice.low.actionPoints[0] || src.practice.low.summary,
    generalContext: src.practice.overview
  };
}

export const ROLE_CONTEXT_MAP: Record<SupportedRole, Record<ApprovedCpiParameter, RoleParameterContext>> = {
  Batsman: {
    "Technique": getSourceWordingForParam("Technique"),
    "Skill Level": getSourceWordingForParam("Skill Level"),
    "Game Plan": getSourceWordingForParam("Game Plan"),
    "Preparation": getSourceWordingForParam("Preparation"),
    "Intensity": getSourceWordingForParam("Intensity"),
    "Focus": getSourceWordingForParam("Focus"),
    "Resilience": getSourceWordingForParam("Resilience")
  },
  Bowler: {
    "Technique": getSourceWordingForParam("Technique"),
    "Skill Level": getSourceWordingForParam("Skill Level"),
    "Game Plan": getSourceWordingForParam("Game Plan"),
    "Preparation": getSourceWordingForParam("Preparation"),
    "Intensity": getSourceWordingForParam("Intensity"),
    "Focus": getSourceWordingForParam("Focus"),
    "Resilience": getSourceWordingForParam("Resilience")
  },
  Wicketkeeper: {
    "Technique": getSourceWordingForParam("Technique"),
    "Skill Level": getSourceWordingForParam("Skill Level"),
    "Game Plan": getSourceWordingForParam("Game Plan"),
    "Preparation": getSourceWordingForParam("Preparation"),
    "Intensity": getSourceWordingForParam("Intensity"),
    "Focus": getSourceWordingForParam("Focus"),
    "Resilience": getSourceWordingForParam("Resilience")
  },
  Fielder: {
    "Technique": getSourceWordingForParam("Technique"),
    "Skill Level": getSourceWordingForParam("Skill Level"),
    "Game Plan": getSourceWordingForParam("Game Plan"),
    "Preparation": getSourceWordingForParam("Preparation"),
    "Intensity": getSourceWordingForParam("Intensity"),
    "Focus": getSourceWordingForParam("Focus"),
    "Resilience": getSourceWordingForParam("Resilience")
  }
};

export function getRoleContextForParameter(
  role: string | undefined,
  parameterName: string,
  score: number
): { isRoleSpecific: boolean; roleName: string; contextText: string } {
  const normRole = (role || "").trim();
  const normParamName = normalizeCpiParameterName(parameterName);
  let matchedRole: SupportedRole = "Batsman";

  if (/bowl/i.test(normRole)) matchedRole = "Bowler";
  else if (/keeper|wicket/i.test(normRole)) matchedRole = "Wicketkeeper";
  else if (/field/i.test(normRole)) matchedRole = "Fielder";
  else matchedRole = "Batsman";

  const pContext = ROLE_CONTEXT_MAP[matchedRole][normParamName];
  const contextText = score >= 7.0 ? pContext.highContext : pContext.lowContext;

  return {
    isRoleSpecific: true,
    roleName: matchedRole,
    contextText
  };
}
