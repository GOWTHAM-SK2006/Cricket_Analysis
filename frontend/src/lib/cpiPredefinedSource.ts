/**
 * STRICT CPI 7 PARAMETERS SOURCE WORDING MODULE
 * 
 * Contains EXACT character-for-character statements extracted from:
 * CPI_7_Parameters_Practice_And_Match_Separate.txt
 * 
 * Rules:
 * 1. Only the 7 approved CPI parameters are present.
 * 2. Exact wording is preserved with zero paraphrasing, zero word changes, and zero AI additions.
 * 3. Both Practice and Match versions are specified separately.
 */

export const APPROVED_CPI_7_PARAMETERS = [
  "Technique",
  "Skill Level",
  "Game Plan",
  "Preparation",
  "Intensity",
  "Focus",
  "Resilience"
] as const;

export type ApprovedCpiParameter = typeof APPROVED_CPI_7_PARAMETERS[number];

export interface ParameterWordingBlock {
  high: {
    actionPoints: string[];
    summary: string;
  };
  low: {
    actionPoints: string[];
    summary: string;
  };
  overview: string;
  goal: string;
}

export interface DualContextParameterWording {
  description: string;
  practice: ParameterWordingBlock;
  match: ParameterWordingBlock;
}

export const CPI_PREDEFINED_SOURCE: Record<ApprovedCpiParameter, DualContextParameterWording> = {
  "Technique": {
    description: "Technical execution measures how effectively a player applies their skills during competitive play and practice.",
    practice: {
      high: {
        actionPoints: [
          "Protect what already works. Do not make technical changes simply to demonstrate that you are coaching.",
          "Increase the challenge. Test the player’s technique under greater speed, fatigue, pressure and unpredictability.",
          "Develop self-awareness. Ask the player to explain why their method works and what they feel when performing well.",
          "Monitor transfer. Check whether the same technical quality appears in competitive practice and matches.",
          "Refine rather than rebuild. Make small, purposeful adjustments while protecting the player’s confidence and individuality."
        ],
        summary: "protect, challenge and refine."
      },
      low: {
        actionPoints: [
          "Identify the root cause. Establish whether the problem is technical, physical, mental, tactical or a combination of these.",
          "Prioritise one correction. Give the player one clear focus and one simple coaching cue.",
          "Simplify the practice. Reduce the speed or complexity until the player can perform the movement correctly.",
          "Rebuild through quality repetition. Progress gradually from controlled drills to realistic, pressure-based practice.",
          "Review the response. Monitor whether the player understands the correction, gains confidence and improves over several sessions."
        ],
        summary: "diagnose, simplify and rebuild."
      },
      overview: "A high score tells you that the player’s technique is currently a strength. A low score tells you that something is limiting the player’s ability to perform the skill consistently.",
      goal: "The Technique Index is not there to tell a young player whether they are good or bad. It is there to show the coach and player what is working, what needs attention and what they should do next."
    },
    match: {
      high: {
        actionPoints: [
          "Confirm the process. Identify the movements, routines and decisions that allowed the player to execute effectively under match pressure.",
          "Protect what works. Avoid unnecessary technical changes after a strong performance or isolated mistake.",
          "Increase the challenge. Expose the player to tougher challenges at practices which reinforce his technical skills and ability.",
          "Monitor repeatability. Assess whether good execution is sustained throughout the match, not produced only in occasional moments.",
          "Build self-correction. Encourage the player to recognise technical changes and make simple adjustments without waiting for the coach."
        ],
        summary: "confirm, protect and stretch."
      },
      low: {
        actionPoints: [
          "Separate outcome from method. Establish whether the player executed poorly or produced a poor result despite having an effective technique.",
          "Identify the pressure point. Determine whether the breakdown occurred through technical limitation, fatigue, a mental mistake, brilliant delivery or a bad surface before taking action.",
          "Find the recurring fault. Focus on repeated patterns rather than reacting to every individual mistake.",
          "Recreate the situation. Design future practices that reproduce the type of delivery, bowler, match situation and pitch conditions that exposed the weakness. This is very important.",
          "Give one clear correction. Provide the player with a simple technical focus they can understand and apply in the next performance."
        ],
        summary: "separate, diagnose and recreate."
      },
      overview: "The Technique Index helps the coach judge whether the player can carry their method from practice into competition.",
      goal: "The goal is not technical perfection. It is a technique the player can trust and execute when the match places it under genuine pressure."
    }
  },
  "Skill Level": {
    description: "Skill Level measures how effectively a player applies their range of cricket-specific skills in both practice and matches.",
    practice: {
      high: {
        actionPoints: [
          "Identify the strengths. Understand which skills the player performs consistently and confidently.",
          "Increase the difficulty. Challenge the player with greater speed, variation, pressure and more demanding situations.",
          "Expand the skill set. Introduce new skills that complement what the player already does well.",
          "Encourage smart use of skills. Help the player understand when and where each skill is most effective.",
          "Monitor transfer. Check that skills performed successfully in practice are also being used effectively in matches."
        ],
        summary: "challenge, expand and apply."
      },
      low: {
        actionPoints: [
          "Identify the gap. Establish which important skills are missing, inconsistent or limiting performance.",
          "Prioritise the basics. Focus on the most important skills for the player’s role before adding greater complexity.",
          "Build through repetition. Give the player enough quality practice to develop confidence and consistency.",
          "Match the challenge to the player. Avoid asking for skills that are beyond their current level of development.",
          "Track the progress. Look for improvement in practice first, then whether that improvement transfers into matches."
        ],
        summary: "identify, build and repeat."
      },
      overview: "The Skill Level Index helps the coach understand whether the player has the range and quality of skills needed to meet the demands of practice and competition.",
      goal: "The goal is simple: develop the right skills, then make sure the player can use them when the game demands them."
    },
    match: {
      high: {
        actionPoints: [
          "Identify the strengths. Understand which skills the player performs consistently and confidently.",
          "Increase the difficulty. Challenge the player with greater speed, variation, pressure and more demanding situations.",
          "Expand the skill set. Introduce new skills that complement what the player already does well.",
          "Encourage smart use of skills. Help the player understand when and where each skill is most effective.",
          "Monitor transfer. Check that skills performed successfully in practice are also being used effectively in matches."
        ],
        summary: "challenge, expand and apply."
      },
      low: {
        actionPoints: [
          "Identify the gap. Establish which important skills are missing, inconsistent or limiting performance.",
          "Prioritise the basics. Focus on the most important skills for the player’s role before adding greater complexity.",
          "Build through repetition. Give the player enough quality practice to develop confidence and consistency.",
          "Match the challenge to the player. Avoid asking for skills that are beyond their current level of development.",
          "Track the progress. Look for improvement in practice first, then whether that improvement transfers into matches."
        ],
        summary: "identify, build and repeat."
      },
      overview: "The Skill Level Index helps the coach understand whether the player has the range and quality of skills needed to meet the demands of practice and competition.",
      goal: "The goal is simple: develop the right skills, then make sure the player can use them when the game demands them."
    }
  },
  "Game Plan": {
    description: "Game Plan measures how clearly a player understands what they are trying to achieve and how they intend to go about it in both practice and matches.",
    practice: {
      high: {
        actionPoints: [
          "Confirm the thinking. Ask the player what their plan was and why they chose it.",
          "Reinforce role clarity. Make sure the player understands what their role requires in different situations.",
          "Increase the challenge. Use changing practice and match scenarios that force the player to think and adjust.",
          "Encourage independence. Allow the player to make tactical decisions without constant instruction.",
          "Monitor adaptability. Check that the player can stick to a good plan but also recognise when it needs to change."
        ],
        summary: "confirm, challenge and adapt."
      },
      low: {
        actionPoints: [
          "Establish whether there is a plan. Ask the player what they were trying to do and listen for clarity or uncertainty.",
          "Simplify the thinking. Give the player one or two clear objectives for their role.",
          "Connect practice to matches. Create scenarios that require the player to practise the same plans they will need in competition.",
          "Teach adjustment. Help the player recognise when conditions, opposition or the match situation require a different approach.",
          "Review the decisions. Discuss whether the player followed the plan, abandoned it too quickly or never had one clearly in mind."
        ],
        summary: "clarify, simplify and rehearse."
      },
      overview: "The Game Plan Index helps the coach understand whether the player is performing with clear purpose or simply reacting to what happens.",
      goal: "The goal is simple: every player should know what they are trying to do, why they are doing it and when the game requires them to change."
    },
    match: {
      high: {
        actionPoints: [
          "Confirm the thinking. Ask the player what their plan was and why they chose it.",
          "Reinforce role clarity. Make sure the player understands what their role requires in different situations.",
          "Increase the challenge. Use changing practice and match scenarios that force the player to think and adjust.",
          "Encourage independence. Allow the player to make tactical decisions without constant instruction.",
          "Monitor adaptability. Check that the player can stick to a good plan but also recognise when it needs to change."
        ],
        summary: "confirm, challenge and adapt."
      },
      low: {
        actionPoints: [
          "Establish whether there is a plan. Ask the player what they were trying to do and listen for clarity or uncertainty.",
          "Simplify the thinking. Give the player one or two clear objectives for their role.",
          "Connect practice to matches. Create scenarios that require the player to practise the same plans they will need in competition.",
          "Teach adjustment. Help the player recognise when conditions, opposition or the match situation require a different approach.",
          "Review the decisions. Discuss whether the player followed the plan, abandoned it too quickly or never had one clearly in mind."
        ],
        summary: "clarify, simplify and rehearse."
      },
      overview: "The Game Plan Index helps the coach understand whether the player is performing with clear purpose or simply reacting to what happens.",
      goal: "The goal is simple: every player should know what they are trying to do, why they are doing it and when the game requires them to change."
    }
  },
  "Preparation": {
    description: "Preparation measures how physically, mentally and practically ready a player is to perform in both practice and matches.",
    practice: {
      high: {
        actionPoints: [
          "Reinforce the routine. Help the player identify the habits and routines that allow them to arrive organised, focused and ready to perform.",
          "Increase ownership. Encourage the player to take responsibility for equipment, warm ups, hydration and personal practice goals.",
          "Connect preparation to performance. Show the player how good preparation improves concentration, confidence, execution and consistency.",
          "Develop match day habits. Use practice routines that can be repeated before matches, trials and important performances.",
          "Monitor consistency. Ensure the player prepares properly for every session, not only when highly motivated or expecting individual attention."
        ],
        summary: "reinforce, connect and transfer."
      },
      low: {
        actionPoints: [
          "Identify what is missing. Establish whether the problem is poor organisation, unclear expectations, tiredness, lack of support, low motivation or simple forgetfulness.",
          "Set clear standards. Explain exactly what the player must bring, wear, complete and understand before each session.",
          "Create a simple routine. Give the player a short preparation checklist that can be followed before leaving home and before practice begins.",
          "Build accountability gradually. Assign age appropriate responsibility rather than allowing parents or coaches to prepare everything for the player.",
          "Review the consequences. Help the player understand how poor preparation reduces practice time, learning quality, safety and team standards."
        ],
        summary: "clarify, organise and build responsibility."
      },
      overview: "The Preparation Index helps the coach identify whether the player is giving themselves a genuine opportunity to improve.",
      goal: "The goal is not simply to arrive at practice. It is to arrive ready physically, mentally and practically to make the session count."
    },
    match: {
      high: {
        actionPoints: [
          "Confirm the routine. Identify the habits that help the player arrive organised, focused and ready.",
          "Build ownership. Encourage the player to take responsibility for equipment, warm-up, hydration and personal goals.",
          "Connect preparation to performance. Help them see how good preparation improves confidence, concentration and execution.",
          "Prepare for different demands. Teach the player to adjust for travel, weather, pitch conditions, aggressive opposition, questionable umpires and different roles.",
          "Monitor consistency. Make sure preparation standards remain high for every practice and match."
        ],
        summary: "reinforce, own and maintain."
      },
      low: {
        actionPoints: [
          "Identify what is missing. Is the issue poor planning, low energy, unclear goals, lack of passion, lack of interest or weak routines?",
          "Set clear expectations. Make sure the player knows what ready should look like.",
          "Create a simple checklist. Keep equipment, hydration, warm-up and role preparation easy to follow.",
          "Build responsibility gradually. Give the player age-appropriate ownership instead of letting others do everything for them.",
          "Review the impact. Show how poor preparation may have affected the quality of practice or match performance."
        ],
        summary: "clarify, organise and improve."
      },
      overview: "The Preparation Index helps the coach understand whether the player is ready to perform or already playing catch-up before they begin.",
      goal: "The goal is simple: arrive ready, so performance has the best possible chance to follow."
    }
  },
  "Intensity": {
    description: "Intensity measures the energy, purpose and competitive effort a player brings to practice and matches.",
    practice: {
      high: {
        actionPoints: [
          "Channel the energy. Ensure the player’s effort remains controlled and purposeful rather than rushed, emotional or reckless.",
          "Raise the challenge. Introduce competitive targets, time pressure, consequences and match-related scenarios that stretch the player.",
          "Protect quality. Monitor whether technical execution and decision-making remain strong as the intensity increases.",
          "Encourage leadership. Use the player’s energy to lift standards, support teammates and create a stronger practice environment.",
          "Monitor sustainability. Make sure the player can maintain intensity throughout the session without burning out or losing discipline."
        ],
        summary: "channel, challenge and sustain."
      },
      low: {
        actionPoints: [
          "Identify the reason. Establish whether the low intensity is caused by fatigue, poor health, low confidence, boredom, unclear expectations or a lack of motivation.",
          "Clarify the standard. Explain exactly what good intensity should look like in movement, effort, communication and response between repetitions.",
          "Create short targets. Break the session into smaller, measurable challenges that give the player an immediate purpose.",
          "Increase involvement. Use competitive drills, clear roles and regular feedback to keep the player mentally and physically engaged.",
          "Review the response. Monitor whether the player’s energy improves when the practice becomes more relevant, demanding and enjoyable."
        ],
        summary: "investigate, engage and rebuild."
      },
      overview: "The Intensity Index helps the coach distinguish between genuine competitive effort and meaningless activity.",
      goal: "The goal is not maximum intensity at every moment. The goal is the right intensity, for the right task, maintained for the right length of time."
    },
    match: {
      high: {
        actionPoints: [
          "Channel the energy. Ensure the player’s effort remains controlled and purposeful rather than rushed, emotional or reckless.",
          "Raise the challenge. Introduce competitive targets, time pressure, consequences and match-related scenarios that stretch the player.",
          "Protect quality. Monitor whether technical execution and decision-making remain strong as the intensity increases.",
          "Encourage leadership. Use the player’s energy to lift standards, support teammates and create a stronger practice environment.",
          "Monitor sustainability. Make sure the player can maintain intensity throughout the session without burning out or losing discipline."
        ],
        summary: "channel, challenge and sustain."
      },
      low: {
        actionPoints: [
          "Identify the reason. Establish whether the low intensity is caused by fatigue, poor health, low confidence, boredom, unclear expectations or a lack of motivation.",
          "Clarify the standard. Explain exactly what good intensity should look like in movement, effort, communication and response between repetitions.",
          "Create short targets. Break the session into smaller, measurable challenges that give the player an immediate purpose.",
          "Increase involvement. Use competitive drills, clear roles and regular feedback to keep the player mentally and physically engaged.",
          "Review the response. Monitor whether the player’s energy improves when the practice becomes more relevant, demanding and enjoyable."
        ],
        summary: "investigate, engage and rebuild."
      },
      overview: "The Intensity Index helps the coach distinguish between genuine competitive effort and meaningless activity.",
      goal: "The goal is not maximum intensity at every moment. The goal is the right intensity, for the right task, maintained for the right length of time."
    }
  },
  "Focus": {
    description: "Focus measures how well a player stays mentally present, attentive and connected to the task in both practice and matches.",
    practice: {
      high: {
        actionPoints: [
          "Confirm the routine. Identify what helps the player stay present, mentally switched on and preserving their concentration energy.",
          "Increase the challenge. Use longer, more demanding drills and match scenarios in practice that test concentration.",
          "Reinforce reset habits. Encourage simple routines between balls, overs or repetitions.",
          "Protect calm thinking. Make sure strong focus does not become tension or overthinking.",
          "Monitor consistency. Check whether the player can stay focused when tired, frustrated or under pressure."
        ],
        summary: "reinforce, challenge and sustain."
      },
      low: {
        actionPoints: [
          "Identify the cause. Is the player distracted, tired, anxious, bored or unclear about what matters?",
          "Simplify the task. Give one clear focus point rather than too many instructions.",
          "Teach a reset. Use a simple routine to help the player reconnect after mistakes or distractions.",
          "Create shorter challenges. Break practice into smaller, purposeful blocks.",
          "Review the pattern. Look for when focus drops and what tends to trigger it."
        ],
        summary: "simplify, reset and rebuild."
      },
      overview: "The Focus Index helps the coach understand whether the player is mentally present or only physically involved.",
      goal: "The goal is simple: stay present, reset quickly and give the next ball your full attention."
    },
    match: {
      high: {
        actionPoints: [
          "Confirm the routine. Identify what helps the player stay present, mentally switched on and preserving their concentration energy.",
          "Increase the challenge. Use longer, more demanding drills and match scenarios in practice that test concentration.",
          "Reinforce reset habits. Encourage simple routines between balls, overs or repetitions.",
          "Protect calm thinking. Make sure strong focus does not become tension or overthinking.",
          "Monitor consistency. Check whether the player can stay focused when tired, frustrated or under pressure."
        ],
        summary: "reinforce, challenge and sustain."
      },
      low: {
        actionPoints: [
          "Identify the cause. Is the player distracted, tired, anxious, bored or unclear about what matters?",
          "Simplify the task. Give one clear focus point rather than too many instructions.",
          "Teach a reset. Use a simple routine to help the player reconnect after mistakes or distractions.",
          "Create shorter challenges. Break practice into smaller, purposeful blocks.",
          "Review the pattern. Look for when focus drops and what tends to trigger it."
        ],
        summary: "simplify, reset and rebuild."
      },
      overview: "The Focus Index helps the coach understand whether the player is mentally present or only physically involved.",
      goal: "The goal is simple: stay present, reset quickly and give the next ball your full attention."
    }
  },
  "Resilience": {
    description: "Resilience measures how well a player responds to mistakes, pressure, disappointment and setbacks in both practice and matches.",
    practice: {
      high: {
        actionPoints: [
          "Confirm what worked. Ask the player how they recovered after a mistake or difficult moment.",
          "Reinforce the reset routine. Encourage simple habits such as breathing, refocusing and committing to the next ball.",
          "Increase the challenge. Use tougher practice scenarios and more competitive situations to test the response.",
          "Develop leadership. Encourage the player to stay composed and help teammates recover from setbacks.",
          "Monitor consistency. Make sure the player can respond well in both practice and matches, not only when things are going their way."
        ],
        summary: "reinforce, challenge and lead."
      },
      low: {
        actionPoints: [
          "Identify the trigger. Find out whether the player struggles most after mistakes, criticism, poor decisions, umpiring calls or pressure.",
          "Keep one moment in perspective. Help the player understand that one bad ball, shot or error does not define the whole performance.",
          "Teach a simple reset. Give the player a routine they can use after every setback.",
          "Practise recovery. Create scenarios where mistakes and pressure are part of the session, then coach the response.",
          "Review the comeback. Focus on how quickly the player recovered, not only on what went wrong."
        ],
        summary: "understand, reset and rebuild."
      },
      overview: "The Resilience Index is not about whether the player makes mistakes. It is about what they do next.",
      goal: "The goal is simple: do not let the last ball or moment control the next one."
    },
    match: {
      high: {
        actionPoints: [
          "Confirm what worked. Ask the player how they recovered after a mistake or difficult moment.",
          "Reinforce the reset routine. Encourage simple habits such as breathing, refocusing and committing to the next ball.",
          "Increase the challenge. Use tougher practice scenarios and more competitive situations to test the response.",
          "Develop leadership. Encourage the player to stay composed and help teammates recover from setbacks.",
          "Monitor consistency. Make sure the player can respond well in both practice and matches, not only when things are going their way."
        ],
        summary: "reinforce, challenge and lead."
      },
      low: {
        actionPoints: [
          "Identify the trigger. Find out whether the player struggles most after mistakes, criticism, poor decisions, umpiring calls or pressure.",
          "Keep one moment in perspective. Help the player understand that one bad ball, shot or error does not define the whole performance.",
          "Teach a simple reset. Give the player a routine they can use after every setback.",
          "Practise recovery. Create scenarios where mistakes and pressure are part of the session, then coach the response.",
          "Review the comeback. Focus on how quickly the player recovered, not only on what went wrong."
        ],
        summary: "understand, reset and rebuild."
      },
      overview: "The Resilience Index is not about whether the player makes mistakes. It is about what they do next.",
      goal: "The goal is simple: do not let the last ball or moment control the next one."
    }
  }
};

/**
 * Standardizes any input parameter name string to the exact 7 approved CPI parameter names.
 */
export function normalizeCpiParameterName(inputName: string): ApprovedCpiParameter {
  const lower = (inputName || "").trim().toLowerCase();
  if (lower.includes("tech")) return "Technique";
  if (lower.includes("skill")) return "Skill Level";
  if (lower.includes("game")) return "Game Plan";
  if (lower.includes("prep")) return "Preparation";
  if (lower.includes("intens")) return "Intensity";
  if (lower.includes("foc") || lower.includes("concentr")) return "Focus";
  if (lower.includes("resil")) return "Resilience";
  return "Technique";
}

/**
 * Returns exact predefined source wording sentence(s) for Recommendations and Player Reports.
 */
export function getPredefinedCpiRecommendation(
  parameterName: string,
  score: number,
  context: "practice" | "match" = "practice"
): {
  parameter: ApprovedCpiParameter;
  actionPoints: string[];
  summary: string;
  overview: string;
  goal: string;
  selectedStatement: string;
} {
  const normName = normalizeCpiParameterName(parameterName);
  const source = CPI_PREDEFINED_SOURCE[normName];
  const block = score >= 7.0 ? source[context].high : source[context].low;
  
  return {
    parameter: normName,
    actionPoints: block.actionPoints,
    summary: block.summary,
    overview: source[context].overview,
    goal: source[context].goal,
    selectedStatement: block.actionPoints[0] || ""
  };
}
