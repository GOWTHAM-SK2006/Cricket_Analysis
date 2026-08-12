package com.cpi.cpi_backend.config;

import com.cpi.cpi_backend.entity.Coach;
import com.cpi.cpi_backend.entity.CpiContentConfig;
import com.cpi.cpi_backend.entity.Role;
import com.cpi.cpi_backend.repository.CoachRepository;
import com.cpi.cpi_backend.repository.CpiContentConfigRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;

@Component
@RequiredArgsConstructor
@Slf4j
public class AdminSeeder implements CommandLineRunner {

    private final CoachRepository coachRepository;
    private final CpiContentConfigRepository configRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) {
        seedAdminAccount();
        seedDefaultConfig();
    }

    private void seedAdminAccount() {
        String adminEmail = "cpi@admin.com";
        String rawPassword = "cpiadmin@10";

        var existingOld = coachRepository.findByEmail("cpicoach@cpi.com");
        if (existingOld.isPresent()) {
            Coach oldAdmin = existingOld.get();
            oldAdmin.setEmail(adminEmail);
            oldAdmin.setPassword(passwordEncoder.encode(rawPassword));
            oldAdmin.setRole(Role.ADMIN);
            coachRepository.save(oldAdmin);
            log.info("Migrated CPI Admin user email to: {}", adminEmail);
            return;
        }

        var existingCoach = coachRepository.findByEmail(adminEmail);
        if (existingCoach.isEmpty()) {
            Coach admin = Coach.builder()
                    .name("CPI Master Admin")
                    .email(adminEmail)
                    .password(passwordEncoder.encode(rawPassword))
                    .role(Role.ADMIN)
                    .build();
            coachRepository.save(admin);
            log.info("CPI Master Admin user created with email: {}", adminEmail);
        } else {
            Coach admin = existingCoach.get();
            admin.setPassword(passwordEncoder.encode(rawPassword));
            admin.setRole(Role.ADMIN);
            coachRepository.save(admin);
            log.info("CPI Master Admin user password synchronized for: {}", adminEmail);
        }

        // Ensure ONLY cpi@admin.com is Role.ADMIN; all other coaches must be Role.USER
        var allCoaches = coachRepository.findAll();
        for (Coach c : allCoaches) {
            if (!adminEmail.equalsIgnoreCase(c.getEmail()) && !"cpicoach@cpi.com".equalsIgnoreCase(c.getEmail())) {
                if (c.getRole() == Role.ADMIN) {
                    c.setRole(Role.USER);
                    coachRepository.save(c);
                    log.info("Reset coach {} role to Role.USER", c.getEmail());
                }
            }
        }
    }

    private void seedDefaultConfig() {
        if (configRepository.findById("MAIN_CONFIG").isEmpty()) {
            String defaultParameters = """
                [
                  {"id": 1, "name": "Technical Execution", "description": "Assessment of biomechanical efficiency, shot technique, and mechanical consistency.", "ratingDescription": "Evaluates footwork, bat path, body balance, and follow-through quality.", "guidance": "Observe head position at impact and balance through shot completion.", "instructions": "Rate from 1-10 based on mechanical perfection and repeatability under pressure.", "recommendation": "Focus on high-volume mirror drills and video review to eliminate technical leaks."},
                  {"id": 2, "name": "Skill Level", "description": "Raw capability, stroke versatility, bowling variations, and positional adaptability.", "ratingDescription": "Evaluates range of shots, control over spin/seam variations, and fielding range.", "guidance": "Assess execution accuracy when trying advanced variations in match scenarios.", "instructions": "Evaluate execution rate across different line and length variations.", "recommendation": "Expand repertoire by practicing non-dominant strokes and specialized variations."},
                  {"id": 3, "name": "Game Plan", "description": "Tactical awareness, match situations awareness, and strategy execution.", "ratingDescription": "Evaluates field placement reading, target pacing, and bowler targeting tactics.", "guidance": "Look for deliberate decision-making tailored to dynamic pitch conditions.", "instructions": "Rate tactical discipline and adherence to agreed team match strategies.", "recommendation": "Conduct post-match tactical debriefs to sharpen situational decision-making."},
                  {"id": 4, "name": "Preparation", "description": "Pre-match routines, physical warmup, mental focus, and equipment readiness.", "ratingDescription": "Evaluates punctuality, pre-game visualization, hydration, and warmup structure.", "guidance": "Observe arrival time, warmup intensity, and focus prior to session start.", "instructions": "Assess consistency and thoroughness of pre-performance preparation.", "recommendation": "Establish a rigid 45-minute structured pre-match warmup and visualization protocol."},
                  {"id": 5, "name": "Intensity", "description": "Energy output, running between wickets, fielding urgency, and pitch presence.", "ratingDescription": "Evaluates effort levels on every ball, backup running, and body language.", "guidance": "Measure sprint speeds between wickets and diving commitment in fielding.", "instructions": "Rate sustained high-energy effort from first ball to session completion.", "recommendation": "Incorporate high-intensity interval conditioning into regular practice sessions."},
                  {"id": 6, "name": "Focus", "description": "Concentration, ball-by-ball reset capability, and distraction management.", "ratingDescription": "Evaluates focus maintenance over long innings/spells and post-error recovery.", "guidance": "Track concentration lapses during middle overs or after contentious calls.", "instructions": "Rate ability to maintain clear cognitive focus across full match duration.", "recommendation": "Practice breathwork and 5-second reset routines between deliveries."},
                  {"id": 7, "name": "Resilience", "description": "Mental toughness, response to adversity, fight under pressure, and bounce-back capacity.", "ratingDescription": "Evaluates performance after getting hit, dropping a catch, or early wicket loss.", "guidance": "Observe body language and aggressiveness after making an error.", "instructions": "Rate emotional stability and determination when team is under severe pressure.", "recommendation": "Simulate high-pressure match scenarios during net sessions to build mental toughness."}
                ]
                """;

            String defaultHelp = """
                {
                  "welcomeText": "Welcome to the Cricket Performance Index (CPI) platform. This guide explains how our index works, how to interpret scores on an out-of-10 scale, and provides the complete Coach’s Plan of Action for player development.",
                  "coachPlanData": [
                    {
                      "id": "technical_execution",
                      "name": "Technical Execution",
                      "description": "Technical Execution measures how consistently and effectively a player performs the basic techniques required for their role in both practice and matches when the difficulty and demands increase.",
                      "highPoints": [
                        { "title": "PRESSURE TEST IT", "detail": "Add pace, spin, fatigue, and tougher match scenarios in practice." },
                        { "title": "PROTECT THE BASICS", "detail": "Maintain and reinforce strong fundamentals, avoiding unnecessary changes." },
                        { "title": "OWN THE CORRECTION", "detail": "Encourage the player to recognise and self-correct technical drift." }
                      ],
                      "highSummary": "A high score shows the player has a strong, reliable technical base that holds up under pressure. The focus now is to protect the basics, keep raising the standard, and continue testing the technique in more demanding cricket situations.",
                      "mediumPoints": [
                        { "title": "REFINE CORE MECHANICS", "detail": "Fix minor technical breakdowns that appear when pace or pressure rises." },
                        { "title": "BUILD CONSISTENCY", "detail": "Repeat sound technique across longer practice sets and multi-over spells." },
                        { "title": "CONTROLLED PRESSURE NETS", "detail": "Expose technique to moderate match drills with clear execution targets." }
                      ],
                      "mediumSummary": "A medium score shows the player has a functional technical foundation but requires greater consistency under pressure. The focus now is to refine core mechanics, eliminate minor breakdowns, and build repeatable technique.",
                      "lowPoints": [
                        { "title": "IDENTIFY MAIN ISSUE", "detail": "Find the single technical breakdown having the greatest effect on performance." },
                        { "title": "KEEP CORRECTION SIMPLE", "detail": "Work on one clear technical cue rather than changing multiple things." },
                        { "title": "RETURN TO BASICS", "detail": "Slow down the movement in drill work before increasing execution speed." }
                      ],
                      "lowSummary": "A low score shows the player needs to strengthen their technical base and build greater consistency under pressure. The focus now is to rebuild the basics, raise the standard, and keep testing the technique in demanding cricket situations.",
                      "coachSummary": {
                        "overview": "The Technical Execution Index helps the coach understand whether the player's technique is reliable enough to perform in both practice and matches.",
                        "high": "protect, challenge and refine.",
                        "medium": "refine, stabilize and test under moderate pressure.",
                        "low": "identify, simplify and rebuild.",
                        "goal": "develop a technique the player can trust and repeat when the game places it under pressure."
                      }
                    },
                    {
                      "id": "skill_level",
                      "name": "Skill Level",
                      "description": "Skill Level measures how effectively a player applies their range of cricket-specific skills in both practice and matches. It is not simply about how many skills they have. It is about how well they can use those skills as the level of difficulty, pressure and competition increases.",
                      "highPoints": [
                        { "title": "EXPAND SKILL VARIETY", "detail": "Add secondary options and subtle variations that complement main strengths." },
                        { "title": "INCREASE EXECUTION SPEED", "detail": "Challenge execution under reduced reaction time and changing conditions." },
                        { "title": "MONITOR MATCH TRANSFER", "detail": "Ensure high-level skills practiced in nets translate directly into matches." }
                      ],
                      "highSummary": "A high score shows that the player has a strong and reliable skill set. The next step is to make those skills more adaptable, consistent and effective under pressure.",
                      "mediumPoints": [
                        { "title": "CONSOLIDATE CORE SKILLS", "detail": "Ensure primary batting strokes or bowling deliveries are 100% reliable." },
                        { "title": "SCENARIO APPLICATION", "detail": "Apply skills within specific field settings and match situation targets." },
                        { "title": "BUILD EXECUTION DEPTH", "detail": "Develop consistent control across different pitch types and lengths." }
                      ],
                      "mediumSummary": "A medium score shows the player possesses a solid basic skill set but needs greater execution variety and adaptability under match pressure. The focus now is to consolidate core skills and expand match options.",
                      "lowPoints": [
                        { "title": "IDENTIFY SKILL GAP", "detail": "Pinpoint missing or inconsistent fundamentals limiting match contribution." },
                        { "title": "REPETITION & QUALITY", "detail": "Build confidence and muscle memory through high-quality basic repetitions." },
                        { "title": "MATCH DEMAND TO LEVEL", "detail": "Focus on mastering basic skill execution before attempting complex variations." }
                      ],
                      "lowSummary": "A low score shows that the player needs to develop their core skill set and build greater execution consistency under pressure. The focus now is to identify skill gaps, rebuild fundamentals, and test skills in demanding cricket situations.",
                      "coachSummary": {
                        "overview": "The Skill Level Index helps the coach understand whether the player has the range and quality of skills needed to meet the demands of practice and competition.",
                        "high": "challenge, expand and apply.",
                        "medium": "consolidate, expand and execute.",
                        "low": "identify, build and repeat.",
                        "goal": "develop the right skills, then make sure the player can use them when the game demands them."
                      }
                    },
                    {
                      "id": "gameplan",
                      "name": "Game Plan",
                      "description": "Game Plan measures how clearly a player understands what they are trying to achieve and how they intend to go about it in both practice and matches. The key question for the coach is simple: does the player give the impression that they have a plan? They should show purpose in their decisions, understand their role and be able to adjust when the situation changes.",
                      "highPoints": [
                        { "title": "CHALLENGE FLEXIBILITY", "detail": "Expose the player to rapidly changing match situations requiring tactical shifts." },
                        { "title": "REINFORCE ROLE MASTERY", "detail": "Deepen understanding of phase-specific responsibilities in team tactics." },
                        { "title": "ENCOURAGE INDEPENDENCE", "detail": "Empower the player to make smart tactical choices on the field without instruction." }
                      ],
                      "highSummary": "A high score shows that the player performs with purpose and understands what they are trying to achieve. The next step is to make that thinking more flexible and effective under pressure.",
                      "mediumPoints": [
                        { "title": "CLARIFY MATCH ROLE", "detail": "Define clear tactical objectives for their specific role in the team." },
                        { "title": "IMPROVE MATCHUP AWARENESS", "detail": "Study field placements, bowler/batter matchups, and scoring options." },
                        { "title": "PRACTICE IN-GAME SHIFTS", "detail": "Rehearse adjusting plans when early wickets fall or match conditions change." }
                      ],
                      "mediumSummary": "A medium score shows the player understands their game plan but occasionally struggles to adapt when match situations shift. The focus now is to sharpen role clarity, improve tactical adjustments, and build situational awareness.",
                      "lowPoints": [
                        { "title": "SIMPLIFY THE PLAN", "detail": "Give the player one simple, actionable objective to focus on." },
                        { "title": "CONNECT DRILLS TO MATCHES", "detail": "Run practice scenarios that mirror exact match situations they will face." },
                        { "title": "REVIEW DECISION MAKING", "detail": "Discuss post-play whether decisions matched the plan or were reactive." }
                      ],
                      "lowSummary": "A low score shows that the player needs clearer role understanding and tactical direction. The focus now is to simplify decision-making, establish clear match objectives, and test adaptability under pressure.",
                      "coachSummary": {
                        "overview": "The Game Plan Index helps the coach understand whether the player is performing with clear purpose or simply reacting to what happens.",
                        "high": "confirm, challenge and adapt.",
                        "medium": "sharpen, adapt and execute.",
                        "low": "clarify, simplify and rehearse.",
                        "goal": "every player should know what they are trying to do, why they are doing it and when the game requires them to change."
                      }
                    },
                    {
                      "id": "preparation",
                      "name": "Preparation",
                      "description": "Preparation measures how physically, mentally and practically ready a player is to perform in both practice and matches. The key question is: does the player arrive ready to make the most of the session or game? Good preparation gives performance a better chance before the first ball is even bowled.",
                      "highPoints": [
                        { "title": "AUTOMATE ROUTINES", "detail": "Make pre-session warm-ups, hydration, and goal setting completely automatic." },
                        { "title": "PREPARE FOR EXTREMES", "detail": "Plan ahead for adverse weather, slow pitches, travels, and tough umpires." },
                        { "title": "BUILD PLAYER OWNERSHIP", "detail": "Ensure the player takes full personal charge of equipment and readiness." }
                      ],
                      "highSummary": "A high score shows that the player is giving themselves the best possible chance to perform well. The next step is to make those habits automatic and player-led.",
                      "mediumPoints": [
                        { "title": "STANDARDIZE ROUTINES", "detail": "Follow a consistent physical warm-up, kit check, and mental prep routine." },
                        { "title": "VISUALIZE MATCH ROLES", "detail": "Spend 5 minutes before play mentally rehearsing key match scenarios." },
                        { "title": "ARRIVE MATCH READY", "detail": "Settle mentally and complete all preparation before stepping onto the field." }
                      ],
                      "mediumSummary": "A medium score shows the player follows standard preparation habits but can improve consistency and mental readiness before matches. The focus now is to refine pre-session routines and build personal ownership.",
                      "lowPoints": [
                        { "title": "IDENTIFY PREP GAPS", "detail": "Fix disorganization, rushed arrivals, or lack of focus before sessions." },
                        { "title": "USE A SIMPLE CHECKLIST", "detail": "Create an easy equipment, hydration, and warm-up checklist to follow." },
                        { "title": "SET CLEAR EXPECTATIONS", "detail": "Establish what proper pre-session and pre-match readiness looks like." }
                      ],
                      "lowSummary": "A low score shows that the player needs consistent pre-match and pre-session preparation habits. The focus now is to establish structured routines, build personal accountability, and arrive ready for competition.",
                      "coachSummary": {
                        "overview": "The Preparation Index helps the coach understand whether the player is ready to perform or already playing catch-up before they begin.",
                        "high": "reinforce, own and maintain.",
                        "medium": "standardize, visualize and own.",
                        "low": "clarify, organise and improve.",
                        "goal": "arrive ready, so performance has the best possible chance to follow."
                      }
                    },
                    {
                      "id": "intensity",
                      "name": "Intensity",
                      "description": "Intensity measures the energy, purpose and competitive intent a player brings to both practice and matches. It's not about being loud or overactive. The key question is: does the player look fully engaged and ready to compete in the moment? Good intensity should support skill, decision making and team performance.",
                      "highPoints": [
                        { "title": "CHANNEL ENERGY POSITIVELY", "detail": "Keep competitive drive high while maintaining tactical discipline." },
                        { "title": "LIFT SQUAD STANDARDS", "detail": "Use competitive energy to inspire and raise standards for teammates." },
                        { "title": "SUSTAIN IN HIGH FATIGUE", "detail": "Maintain explosive effort and sharp movement during long spells and innings." }
                      ],
                      "highSummary": "A high score shows that the player brings strong purpose and competitive effort. The next step is to make that intensity controlled, consistent and useful.",
                      "mediumPoints": [
                        { "title": "SUSTAIN CONSISTENT EFFORT", "detail": "Eliminate energy lulls between overs or drill sets." },
                        { "title": "SET SESSION BENCHMARKS", "detail": "Use clear physical and target benchmarks to maintain urgency in nets." },
                        { "title": "ACTIVE FIELDING EFFORT", "detail": "Attack the ball in the field, communicate loudly, and stay alert." }
                      ],
                      "mediumSummary": "A medium score shows the player brings good energy but experiences periodic intensity lulls during long sessions or matches. The focus now is to sustain competitive effort and maintain active engagement.",
                      "lowPoints": [
                        { "title": "FIND THE ENERGY TRIGGER", "detail": "Determine if low intensity stems from fatigue, boredom, or unclear goals." },
                        { "title": "SET SHORT TARGETS", "detail": "Break practice into short 5-minute competitive challenges." },
                        { "title": "INCREASE INVOLVEMENT", "detail": "Use active, high-touch drills to keep the player physically engaged." }
                      ],
                      "lowSummary": "A low score shows that the player needs higher competitive energy and focus during practice and matches. The focus now is to set clear targets, build effort habits, and maintain intensity throughout sessions.",
                      "coachSummary": {
                        "overview": "The Intensity Index helps the coach understand whether the player is fully engaged or simply present.",
                        "high": "channel, challenge and sustain.",
                        "medium": "sustain, target and engage.",
                        "low": "identify, engage and rebuild.",
                        "goal": "bring the right energy, with the right purpose, for the demands of the moment."
                      }
                    },
                    {
                      "id": "focus",
                      "name": "Focus",
                      "description": "Focus measures how well a player stays mentally present, attentive and connected to the task in both practice and matches. The key question is: does the player stay engaged with what matters, or does their concentration drift when pressure, fatigue or distractions increase?",
                      "highPoints": [
                        { "title": "REINFORCE RESET ROUTINE", "detail": "Maintain a quick physical/breath reset between balls to conserve focus." },
                        { "title": "EXTEND CONCENTRATION SPANS", "detail": "Test mental stamina with longer, unbroken practice scenarios." },
                        { "title": "STAY CALM UNDER PRESSURE", "detail": "Ensure intense focus remains relaxed and free from overthinking." }
                      ],
                      "highSummary": "A high score shows that the player can stay connected to the task and give each moment proper attention. The next step is to make that focus more durable under pressure.",
                      "mediumPoints": [
                        { "title": "BALL-BY-BALL RECONFINEMENT", "detail": "Use a focal trigger to lock in complete attention before every delivery." },
                        { "title": "FILTER DISTRACTIONS", "detail": "Practice staying switched on despite noise, fatigue, or bad decisions." },
                        { "title": "TRACK FOCUS DURATIONS", "detail": "Notice when concentration drifts and trigger an instant mental reset." }
                      ],
                      "mediumSummary": "A medium score shows the player has solid concentration with occasional focus lapses during prolonged play. The focus now is to strengthen ball-by-ball reset routines and build mental stamina.",
                      "lowPoints": [
                        { "title": "SIMPLIFY FOCAL POINTS", "detail": "Focus on just one key cue instead of trying to process multiple inputs." },
                        { "title": "TEACH 5-SECOND RESET", "detail": "Use a simple physical trigger to reset after a mistake or distraction." },
                        { "title": "SHORTER DRILL BLOCKS", "detail": "Practice in brief 3-minute sets to build concentration step-by-step." }
                      ],
                      "lowSummary": "A low score shows that the player experiences concentration lapses during demanding periods. The focus now is to shorten focus tasks, introduce mental reset triggers, and sustain attention ball by ball.",
                      "coachSummary": {
                        "overview": "The Focus Index helps the coach understand whether the player is mentally present or only physically involved.",
                        "high": "reinforce, challenge and sustain.",
                        "medium": "reset, focus and sustain.",
                        "low": "simplify, reset and rebuild.",
                        "goal": "stay present, reset quickly and give the next ball your full attention."
                      }
                    },
                    {
                      "id": "resilience",
                      "name": "Resilience",
                      "description": "Resilience measures how well a player responds to adversity, pressure, mistakes and setbacks in both practice and matches. The key question is: does the player maintain effort, focus and body language when things go wrong, or do they fold under pressure?",
                      "highPoints": [
                        { "title": "ANCHOR CRUNCH MOMENTS", "detail": "Step up to bowl tough overs or bat during difficult collapse phases." },
                        { "title": "LEAD SQUAD RECOVERY", "detail": "Guide teammates calmly when match momentum swings against the team." },
                        { "title": "EXPOSE TO HARD DRILLS", "detail": "Train in high-consequence drills where mistakes carry realistic penalty." }
                      ],
                      "highSummary": "A high score shows that the player thrives under pressure and bounces back quickly from errors. The next step is to anchor that resilience as a core team asset.",
                      "mediumPoints": [
                        { "title": "BOUNCE BACK QUICKER", "detail": "Cut down emotional dwell time after a boundary, drop, or bad shot." },
                        { "title": "MAINTAIN POSITIVE POSTURE", "detail": "Keep strong, upright body language regardless of match score." },
                        { "title": "ACCEPT COACHING CUES", "detail": "Process mid-game advice constructively without losing self-belief." }
                      ],
                      "mediumSummary": "A medium score shows the player handles standard match pressure reasonably well but can bounce back faster from unexpected setbacks. The focus now is to strengthen post-error recovery routines and build composure.",
                      "lowPoints": [
                        { "title": "SEPARATE SELF FROM ERROR", "detail": "Learn that one mistake does not define overall ability or value." },
                        { "title": "POST-ERROR RESET ROUTINE", "detail": "Take a deep breath and physically reset posture immediately post-mistake." },
                        { "title": "BUILD CONFIDENCE GRADUALLY", "detail": "Practice recovery in low-stakes scenarios to build emotional composure." }
                      ],
                      "lowSummary": "A low score shows that the player struggles to bounce back quickly from errors under pressure. The focus now is to build emotional control, practice recovery routines, and strengthen mental toughness.",
                      "coachSummary": {
                        "overview": "The Resilience Index helps the coach understand whether the player has the mental toughness to handle pressure and bounce back from setbacks.",
                        "high": "anchor, challenge and lead.",
                        "medium": "compose, recover and push.",
                        "low": "identify, reset and rebuild.",
                        "goal": "develop unshakeable mental toughness under competitive pressure."
                      }
                    }
                  ],
                  "ppiDescription": "The Practice Performance Index (PPI) is a structured coaching tool used to assess how effectively a young cricketer trains and develops during practice. It measures performance across key areas on a 0 – 10 scale: technique, intensity, execution, adaptability, discipline, concentration, coachability and preparation.",
                  "mpiDescription": "The Match Performance Index is a structured coaching tool used to assess how effectively a young cricketer performs and responds during competitive play on a 0 – 10 scale. It measures key areas such as technical execution, decision making, game awareness, resilience, emotional control, teamwork, match impact and preparation.",
                  "cpiDescription": "The Cricket Performance Index (CPI) is a structured coaching tool built around one simple truth: how you practise is how you will play. By measuring key performance areas in both practice and matches on a 0 – 10 scale, the CPI shows what is transferring, where performance is breaking down and what is holding a player back.",
                  "below5Text": "Performance is being limited in one or more key areas. Identify the main cause and make it a coaching priority.",
                  "between5And7Text": "There are positive signs, but performance is still inconsistent. Focus on improving consistency and transfer into matches.",
                  "above7Text": "Performance is strong across the key areas. Protect what is working, maintain standards and continue to challenge the player."
                }
                """;

            String defaultInstructions = """
                {
                  "general": "Ensure all player assessments are submitted within 24 hours of session completion to maintain longitudinal tracking accuracy.",
                  "practice": "Focus practice ratings strictly on execution consistency, technical mechanics, and effort level during net drills.",
                  "match": "Evaluate match ratings based on real-time situational execution, tactical adherence, and emotional resilience under competitive pressure."
                }
                """;

            String defaultRecommendations = """
                [
                  {"parameter": "Technical Execution", "high": "Maintain mechanical precision through periodic high-speed video feedback.", "avg": "Incorporate stationary shadow batting and tee-work to refine bat path.", "low": "Revisit fundamental grip, stance, and balance setup with dedicated 1-on-1 coaching."},
                  {"parameter": "Skill Level", "high": "Incorporate complex scenario drills with unpredictable pitch conditions.", "avg": "Practice target bowling and specific boundary options against spin.", "low": "Focus on core 2-3 primary shots/deliveries before expanding variation repertoire."},
                  {"parameter": "Game Plan", "high": "Encourage player to lead field placement decisions and tactical discussions.", "avg": "Provide pre-over tactical checklist cards to enforce strategic discipline.", "low": "Simplify match role to clear, single-objective tactical targets."},
                  {"parameter": "Preparation", "high": "Designate player as preparation mentor for junior squad members.", "avg": "Standardize a written 30-minute pre-session physical & mental warmup routine.", "low": "Enforce strict mandatory arrival times 45 minutes prior to session start."},
                  {"parameter": "Intensity", "high": "Sustain high work-rate through leadership and team energy encouragement.", "avg": "Set sprint benchmark targets for running between wickets during practice.", "low": "Implement short, explosive physical conditioning blocks into daily schedule."},
                  {"parameter": "Focus", "high": "Challenge player with multi-tasking and high-distraction training environments.", "avg": "Implement 5-second breathing reset triggers between deliveries.", "low": "Use visual cues on bat/ball to anchor concentration prior to every ball."},
                  {"parameter": "Resilience", "high": "Position player in high-pressure match crunch overs.", "avg": "Simulate pressure scenarios in nets with consequences for lost wickets.", "low": "Conduct cognitive reframing sessions to separate personal identity from match errors."}
                ]
                """;

            String defaultAiCoach = """
                {
                  "systemInstructions": "You are the CPI AI Head Performance Analyst. Provide objective, evidence-based performance feedback for cricket players using the CPI 7-parameter framework.",
                  "coachingTone": "Professional, encouraging, analytical, and actionable.",
                  "responseGuidance": "Format outputs clearly with executive summary, parameter rankings from strongest to weakest, and targeted action points.",
                  "recommendationBehaviour": "Focus on high-impact technical and mental adjustments that yield rapid performance improvements.",
                  "parameterAnalysisInstructions": "Evaluate all 7 parameters (Technical Execution, Skill Level, Game Plan, Preparation, Intensity, Focus, Resilience) on a 10-point scale."
                }
                """;

            String defaultReports = """
                {
                  "heading": "CPI Comprehensive Player Performance Assessment Report",
                  "subheading": "Detailed 7-Parameter Evaluation & AI Coach Performance Breakdown",
                  "section3Title": "Complete Parameter Performance Breakdown (Strongest → Weakest)",
                  "recommendationWording": "Targeted Development Plan based on current CPI Parameter Scores:",
                  "strengthWeaknessWording": "Full 7-Parameter Spectrum Analysis:",
                  "scoreFormatNote": "All scores normalized to 10-point CPI scale (e.g. 7.7 / 10)",
                  "helpItems": [
                    {"parameter": "Technical Execution", "explanation": "Refers to how biomechanically sound and repeatable a player's fundamental techniques are.", "rangeHigh": "Scores 8.0-10.0: Flawless technique, balanced weight distribution, precise bat path.", "rangeAvg": "Scores 5.0-7.9: Solid core technique with occasional mechanical flaws under pressure.", "rangeLow": "Scores 1.0-4.9: Significant technical breakdowns requiring fundamental rework."},
                    {"parameter": "Skill Level", "explanation": "Refers to stroke repertoire, bowling variations, and fielding dexterity.", "rangeHigh": "Scores 8.0-10.0: Masterful control over all shot/bowling variations.", "rangeAvg": "Scores 5.0-7.9: Good standard skillset with limited advanced variations.", "rangeLow": "Scores 1.0-4.9: Restricted skill set with execution difficulties."},
                    {"parameter": "Game Plan", "explanation": "Tactical comprehension of match scenarios, field settings, and match pace.", "rangeHigh": "Scores 8.0-10.0: Elite tactical execution and situational awareness.", "rangeAvg": "Scores 5.0-7.9: Understands strategy but occasionally deviates under stress.", "rangeLow": "Scores 1.0-4.9: Poor situational decisions and strategy execution."},
                    {"parameter": "Preparation", "explanation": "Professionalism in warmup, mental readiness, and physical prep.", "rangeHigh": "Scores 8.0-10.0: Meticulous professional warmup and mental visualization.", "rangeAvg": "Scores 5.0-7.9: Standard preparation routine lacking deep focus.", "rangeLow": "Scores 1.0-4.9: Casual or rushed preparation leading to slow starts."},
                    {"parameter": "Intensity", "explanation": "Physical energy, sprinting between wickets, and fielding commitment.", "rangeHigh": "Scores 8.0-10.0: Relentless high energy and total physical effort.", "rangeAvg": "Scores 5.0-7.9: Inconsistent energy output across match phases.", "rangeLow": "Scores 1.0-4.9: Passive body language and low physical intensity."},
                    {"parameter": "Focus", "explanation": "Concentration maintenance and ball-by-ball cognitive reset.", "rangeHigh": "Scores 8.0-10.0: Laser concentration and instant mental reset.", "rangeAvg": "Scores 5.0-7.9: Solid focus with occasional middle-session lapses.", "rangeLow": "Scores 1.0-4.9: Easily distracted, carrying errors from ball to ball."},
                    {"parameter": "Resilience", "explanation": "Mental toughness under pressure and bounce-back capacity.", "rangeHigh": "Scores 8.0-10.0: Thrives in high-pressure crunch situations.", "rangeAvg": "Scores 5.0-7.9: Competent response to setback with occasional hesitation.", "rangeLow": "Scores 1.0-4.9: Folds quickly when match pressure escalates."}
                  ]
                }
                """;

            String defaultSettings = """
                {
                  "platformName": "Cricket Performance Index (CPI) Platform",
                  "supportEmail": "support@cpicoach.com",
                  "website": "https://cpicoach.com",
                  "termsUrl": "/terms",
                  "privacyUrl": "/privacy",
                  "copyright": "© 2026 CPI – Cricket Performance Index. All rights reserved."
                }
                """;

            String defaultTerms = """
                {
                  "title": "TERMS & CONDITIONS",
                  "subtitle": "LEGAL AGREEMENTS",
                  "introText": "Welcome to the Cricket Performance Index (CPI). These Terms and Conditions govern your access and use of the CPI platform, services, and related applications. By registering or using our platform, you agree to comply with these terms.",
                  "lastUpdated": "July 2026",
                  "sections": [
                    {
                      "id": "1",
                      "number": "1.",
                      "title": "PLATFORM SERVICES",
                      "category": "SCOPE AND USAGE",
                      "icon": "Shield",
                      "description": "CPI provides coaching staff, academies, and players with performance tracking tools, rating systems (PPI and MPI), and data visualization.",
                      "bullets": [
                        "The platform is provided \\"as is\\" and as an athletic performance assessment aid.",
                        "We reserve the right to modify, suspend, or discontinue any feature at any time."
                      ]
                    },
                    {
                      "id": "2",
                      "number": "2.",
                      "title": "ACCOUNTS & REGISTRATION",
                      "category": "ACCESS REQUIREMENTS",
                      "icon": "UserCheck",
                      "description": "To use CPI, users must register an account by providing accurate and complete registration details.",
                      "bullets": [
                        "You are responsible for keeping your login credentials confidential.",
                        "Accounts cannot be shared or transferred to other individuals without permission.",
                        "Coaching credentials must be verified and approved by the academy administrator."
                      ]
                    },
                    {
                      "id": "3",
                      "number": "3.",
                      "title": "PRIVACY & PERFORMANCE DATA",
                      "category": "INFORMATION & PRIVACY",
                      "icon": "Lock",
                      "description": "By using the platform, you agree to let CPI process athletic performance metrics, coaching feedback, and training logs.",
                      "bullets": [
                        "Coaches can view and grade individual players' practice and match metrics.",
                        "Administrators may generate reports summarizing collective or individual progress.",
                        "Performance logs are secured and not shared with unauthorized third parties."
                      ]
                    },
                    {
                      "id": "4",
                      "number": "4.",
                      "title": "CODE OF CONDUCT",
                      "category": "FAIR PLAY & RESPECT",
                      "icon": "FileText",
                      "description": "Users must maintain professional and respectful behavior. Fair play and integrity are central values of the CPI platform.",
                      "bullets": [
                        "Inputting false metrics or spamming reviews is strictly prohibited.",
                        "Abusive behavior or harassment toward other players or staff will lead to account suspension."
                      ]
                    },
                    {
                      "id": "5",
                      "number": "5.",
                      "title": "LIABILITY & DISCLAIMERS",
                      "category": "LIMIT OF RESPONSIBILITY",
                      "icon": "HelpCircle",
                      "description": "CPI ratings are subjective coaching assessments designed solely to support developmental training.",
                      "bullets": [
                        "Ratings do not guarantee selection for official league matches or professional contracts.",
                        "We are not responsible for any physical injury incurred during training, practice, or match situations."
                      ]
                    }
                  ]
                }
                """;

            CpiContentConfig defaultConfig = CpiContentConfig.builder()
                    .configKey("MAIN_CONFIG")
                    .parametersJson(defaultParameters)
                    .helpJson(defaultHelp)
                    .instructionsJson(defaultInstructions)
                    .recommendationsJson(defaultRecommendations)
                    .aiCoachJson(defaultAiCoach)
                    .reportsJson(defaultReports)
                    .settingsJson(defaultSettings)
                    .termsJson(defaultTerms)
                    .lastUpdatedAt(LocalDateTime.now())
                    .changeLogsJson("[]")
                    .versionsJson("[]")
                    .build();

            configRepository.save(defaultConfig);
            log.info("Default CPI Master Admin Content Configuration seeded successfully.");
        }
    }
}
