/**
 * Role-Aware Coaching Context Layer for CPI Framework.
 * 
 * Provides role-specific coaching applications for:
 * - Batsman
 * - Bowler
 * - Wicketkeeper
 * - Fielder
 * 
 * Strictly follows coach-approved guidelines. If role-specific context is unavailable,
 * returns a safe role-neutral fallback statement.
 */

export interface RoleParameterContext {
  highContext: string;
  lowContext: string;
  generalContext: string;
}

export type SupportedRole = "Batsman" | "Bowler" | "Wicketkeeper" | "Fielder";

export const ROLE_CONTEXT_MAP: Record<SupportedRole, Record<string, RoleParameterContext>> = {
  Batsman: {
    "Technical Execution": {
      highContext: "Technique remains stable against pace and spin. Focus on bat-face control, footwork alignment, and late point of contact under match pressure.",
      lowContext: "Identify bat-path drift, balance breakdown, or early movement errors. Return to drop-feed throwdowns to stabilize contact point.",
      generalContext: "Refine stroke mechanics, footwork alignment, and crease balance across different bowling types."
    },
    "Skill Level": {
      highContext: "Stroke range is established. Expand shot selection, placement accuracy, and boundary options against varying pitch lengths.",
      lowContext: "Focus on primary defensive and run-scoring strokes. Consolidate basic contact before introducing aerial or high-risk options.",
      generalContext: "Develop execution control across defensive, drive, pull, and rotation strokes."
    },
    "Game Plan": {
      highContext: "Clear role awareness in building innings, pacing run chases, and adapting to changing field placements.",
      lowContext: "Establish clear target zones, scoring options, and phase objectives for each match situation.",
      generalContext: "Sharpen inning construction, target pacing, and field-setting awareness."
    },
    "Preparation": {
      highContext: "Pre-innings routine, throwdown sets, equipment readiness, and pitch assessment are fully automated.",
      lowContext: "Structure pre-innings warm-up, kit organization, and mental visualization before stepping out to bat.",
      generalContext: "Ensure consistent pre-innings routines and pitch condition readiness."
    },
    "Intensity": {
      highContext: "Maintains purposeful running between wickets, aggressive intent, and focused posture throughout long innings.",
      lowContext: "Eliminate energy lulls between deliveries. Increase urgency in running between wickets and attacking loose balls.",
      generalContext: "Sustain competitive intent and sharp running between wickets."
    },
    "Focus": {
      highContext: "Sustains ball-by-ball concentration, filtering out crowd noise, bowler aggression, and scoreboard pressure.",
      lowContext: "Implement a step-back reset routine between deliveries to refocus complete attention on the bowler's release point.",
      generalContext: "Lock complete attention on the ball release point for every delivery."
    },
    "Resilience": {
      highContext: "Bounces back immediately after play-and-misses, close calls, or early partner dismissals.",
      lowContext: "Separate individual errors from overall performance. Reset mentally after beaten edges or dot-ball pressure.",
      generalContext: "Maintain composure and positive body language after setbacks."
    }
  },
  Bowler: {
    "Technical Execution": {
      highContext: "Repeatable run-up, gather, release point, and seam orientation under fatigue and match pressure.",
      lowContext: "Identify run-up rhythm breakdown, front-foot plant collapse, or wrist alignment drift. Rebuild with target-line spot bowling.",
      generalContext: "Stabilize run-up rhythm, gathering posture, release point, and follow-through."
    },
    "Skill Level": {
      highContext: "Strong control over line, length, and movement variations (swing, seam, or turn). Expand stock ball accuracy.",
      lowContext: "Prioritize consistent landing area on a good length before attempting slower balls or tactical variations.",
      generalContext: "Master stock delivery accuracy before adding tactical pace or movement variations."
    },
    "Game Plan": {
      highContext: "Understands bowling spells, field settings, batter weaknesses, and situational boundary control.",
      lowContext: "Simplify spell objectives: stick to one bowling plan and set matching fields with captain.",
      generalContext: "Align bowling line and length plans with active field settings."
    },
    "Preparation": {
      highContext: "Pre-spell warm-up, shoulder activation, ball maintenance, and batter matchup analysis are routine.",
      lowContext: "Build a structured pre-spell routine ensuring physical readiness before taking the ball.",
      generalContext: "Maintain pre-spell activation and matchup preparation routines."
    },
    "Intensity": {
      highContext: "Brings strong energy into every run-up, attacking the crease and maintaining pace across multi-over spells.",
      lowContext: "Eliminate passive approach runs. Increase drive through the crease on every delivery.",
      generalContext: "Drive through the crease with maximum effort on every repetition."
    },
    "Focus": {
      highContext: "Stays switched on delivery after delivery, maintaining line discipline despite boundaries or dropped chances.",
      lowContext: "Use a mark-reset routine at the top of the mark to refocus on target execution before starting run-up.",
      generalContext: "Execute target spot concentration at the start of every run-up."
    },
    "Resilience": {
      highContext: "Responds aggressively to boundary hits or misfields by hitting target length on the next ball.",
      lowContext: "Cut down emotional reaction after boundaries or dropped catches. Refocus immediately on executing stock delivery.",
      generalContext: "Recover instantly after misfields or boundaries to bowl a disciplined next ball."
    }
  },
  Wicketkeeper: {
    "Technical Execution": {
      highContext: "Clean stance balance, glove tracking, soft hands, and seamless footwork mobility to pace and spin.",
      lowContext: "Address footwork alignment, head movement, or stiff glove posture. Practice drop-feed collection to isolate soft hands.",
      generalContext: "Maintain soft hands, balance posture, and clean glove tracking behind the stumps."
    },
    "Skill Level": {
      highContext: "High-level execution on stumping speed, standing up to seamers, and diving collection width.",
      lowContext: "Consolidate clean basic gathers on line before working on standing up or rapid stumping movements.",
      generalContext: "Consolidate clean gathering mechanics to both seam and spin bowlers."
    },
    "Game Plan": {
      highContext: "Directs field angles, bowler energy, and tactical feedback on pitch bounce/spin behavior.",
      lowContext: "Focus on clear communication with captain and bowler regarding edge line and pitch behavior.",
      generalContext: "Provide active fielding leadership and pitch feedback to bowlers."
    },
    "Preparation": {
      highContext: "Glove maintenance, reaction drills, vision warmup, and seamer/spinner stance checks are thorough.",
      lowContext: "Establish pre-match glove warm-up, eye-tracking drills, and physical posture preparation.",
      generalContext: "Execute thorough reaction warmups and eye-tracking preparation before play."
    },
    "Intensity": {
      highContext: "Maintains high voice energy, physical agility, and bowler encouragement over full 50+ over innings.",
      lowContext: "Eliminate static posture between overs. Keep energy high, encouraging bowlers and staying low until release.",
      generalContext: "Sustain voice energy, fielding encouragement, and low athletic posture throughout innings."
    },
    "Focus": {
      highContext: "Unbroken ball-by-ball glove alertness across extended spells without dropping concentration.",
      lowContext: "Track the ball visually from bowler's hand into the gloves on every single delivery.",
      generalContext: "Track the ball visually into gloves on every single delivery without exception."
    },
    "Resilience": {
      highContext: "Bounces back cleanly after missed chances or bye concessions without letting it affect glove posture.",
      lowContext: "Reset glove posture instantly after a fumble or miss. Treat the next ball as a fresh opportunity.",
      generalContext: "Maintain confident glove stance after missed chances."
    }
  },
  Fielder: {
    "Technical Execution": {
      highContext: "Clean attack on ground balls, balance on pick-up, flat trajectory throw, and high-catch positioning.",
      lowContext: "Correct cup stance, foot alignment to target, or head movement during high-catch tracking.",
      generalContext: "Maintain balanced posture on ground attacks, high catches, and accurate throwing."
    },
    "Skill Level": {
      highContext: "Versatile across inner-ring savings, direct hits, slip catching, and boundary outfield slide collections.",
      lowContext: "Master basic two-handed ground gathering and secure chest catches before complex direct hits.",
      generalContext: "Develop reliable two-handed gathering, secure catching, and direct-hit throwing."
    },
    "Game Plan": {
      highContext: "Anticipates batter stroke angles, backing up throws proactively, and closing down singles in inner ring.",
      lowContext: "Understand field position boundaries, backup responsibilities, and bowler line expectations.",
      generalContext: "Anticipate batter scoring angles and execute backup responsibilities."
    },
    "Preparation": {
      highContext: "High-catch readiness, throwing arm warm-up, field surface check, and sun/lighting assessment done early.",
      lowContext: "Complete proper throwing shoulder activation and catch tracking warm-ups prior to match start.",
      generalContext: "Ensure throwing arm warm-up and high-catch tracking before stepping on field."
    },
    "Intensity": {
      highContext: "Attacks ground balls with speed, diving urgency, and positive body language that lifts fielding energy.",
      lowContext: "Increase movement speed towards the ball. Eliminate walking or passive waiting in field positions.",
      generalContext: "Attack ground balls with urgency and maintain active field presence."
    },
    "Focus": {
      highContext: "Alert on every single delivery in the field, tracking batter stroke setup and bowler release.",
      lowContext: "Stay ready on toes as bowler enters run-up rather than flat-footed watching.",
      generalContext: "Stay light on toes, anticipating stroke direction on every delivery."
    },
    "Resilience": {
      highContext: "Responds to dropped catches or misfields with immediate backing up and positive team communication.",
      lowContext: "Put misfields behind immediately. Show positive posture and focus on the next fielding opportunity.",
      generalContext: "Maintain positive posture and backing-up effort after misfields."
    }
  }
};

/**
 * Resolves role-specific context for a given player role and parameter.
 */
export function getRoleContextForParameter(
  role: string | undefined | null,
  parameterName: string,
  score: number
): { isRoleSpecific: boolean; roleName: string; contextText: string } {
  if (!role || typeof role !== "string") {
    return {
      isRoleSpecific: false,
      roleName: "Player",
      contextText: "Role-specific guidance is not currently available for this parameter. The recommendation therefore follows the coach-approved general guidance."
    };
  }

  const normalizedRole = role.trim();
  let matchedRole: SupportedRole | null = null;

  if (/bat/i.test(normalizedRole)) matchedRole = "Batsman";
  else if (/bowl/i.test(normalizedRole)) matchedRole = "Bowler";
  else if (/keeper|wicket/i.test(normalizedRole)) matchedRole = "Wicketkeeper";
  else if (/field/i.test(normalizedRole)) matchedRole = "Fielder";
  else if (/all[- ]?round/i.test(normalizedRole)) matchedRole = "Batsman"; // Default all-rounder to primary role context

  if (!matchedRole || !ROLE_CONTEXT_MAP[matchedRole]) {
    return {
      isRoleSpecific: false,
      roleName: normalizedRole,
      contextText: "Role-specific guidance is not currently available for this parameter. The recommendation therefore follows the coach-approved general guidance."
    };
  }

  const roleParams = ROLE_CONTEXT_MAP[matchedRole];
  const matchedParamKey = Object.keys(roleParams).find(
    (k) => k.toLowerCase() === parameterName.toLowerCase()
  );

  if (!matchedParamKey || !roleParams[matchedParamKey]) {
    return {
      isRoleSpecific: false,
      roleName: matchedRole,
      contextText: "Role-specific guidance is not currently available for this parameter. The recommendation therefore follows the coach-approved general guidance."
    };
  }

  const pContext = roleParams[matchedParamKey];
  const contextText = score >= 7.0 ? pContext.highContext : score <= 5.0 ? pContext.lowContext : pContext.generalContext;

  return {
    isRoleSpecific: true,
    roleName: matchedRole,
    contextText
  };
}
