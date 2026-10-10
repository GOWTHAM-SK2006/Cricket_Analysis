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

        // Ensure user's active accounts exist for login and password reset testing
        String[] registeredEmails = {
            "sec24am042@sairamtap.edu.in",
            "gowtham@cpicoach.com",
            "surulivelgowtham@gmail.com"
        };
        for (String userEmail : registeredEmails) {
            if (coachRepository.findByEmail(userEmail.toLowerCase()).isEmpty()) {
                Coach userCoach = Coach.builder()
                        .name("Gowtham")
                        .email(userEmail.toLowerCase())
                        .password(passwordEncoder.encode(rawPassword))
                        .role(Role.USER)
                        .build();
                coachRepository.save(userCoach);
                log.info("Registered user account for: {}", userEmail);
            }
        }
    }

    private void seedDefaultConfig() {
        String defaultParameters = """
                [
                  {"id": 1, "name": "Technique", "description": "Technique measures how effectively a player applies their skills during competitive play and practice.", "ratingDescription": "A high score tells you that the player's technique is currently a strength. A low score tells you that something is limiting the player's ability to perform the skill consistently.", "guidance": "The Technique Index is not there to tell a young player whether they are good or bad. It is there to show the coach and player what is working, what needs attention and what they should do next.", "instructions": "Evaluate technique on a 1-10 scale based on approved CPI parameters.", "recommendation": "Protect what already works. Do not make technical changes simply to demonstrate that you are coaching."},
                  {"id": 2, "name": "Skill Level", "description": "Skill Level measures how effectively a player applies their range of cricket-specific skills in both practice and matches.", "ratingDescription": "The Skill Level Index helps the coach understand whether the player has the range and quality of skills needed to meet the demands of practice and competition.", "guidance": "The goal is simple: develop the right skills, then make sure the player can use them when the game demands them.", "instructions": "Evaluate skill level on a 1-10 scale based on approved CPI parameters.", "recommendation": "Identify the strengths. Understand which skills the player performs consistently and confidently."},
                  {"id": 3, "name": "Game Plan", "description": "Game Plan measures how clearly a player understands what they are trying to achieve and how they intend to go about it in both practice and matches.", "ratingDescription": "The Game Plan Index helps the coach understand whether the player is performing with clear purpose or simply reacting to what happens.", "guidance": "The goal is simple: every player should know what they are trying to do, why they are doing it and when the game requires them to change.", "instructions": "Evaluate game plan execution on a 1-10 scale based on approved CPI parameters.", "recommendation": "Confirm the thinking. Ask the player what their plan was and why they chose it."},
                  {"id": 4, "name": "Preparation", "description": "Preparation measures how physically, mentally and practically ready a player is to perform in both practice and matches.", "ratingDescription": "The Preparation Index helps the coach identify whether the player is giving themselves a genuine opportunity to improve.", "guidance": "The goal is not simply to arrive at practice. It is to arrive ready physically, mentally and practically to make the session count.", "instructions": "Evaluate preparation on a 1-10 scale based on approved CPI parameters.", "recommendation": "Reinforce the routine. Help the player identify the habits and routines that allow them to arrive organised, focused and ready to perform."},
                  {"id": 5, "name": "Intensity", "description": "Intensity measures the energy, purpose and competitive effort a player brings to practice and matches.", "ratingDescription": "The Intensity Index helps the coach distinguish between genuine competitive effort and meaningless activity.", "guidance": "The goal is not maximum intensity at every moment. The goal is the right intensity, for the right task, maintained for the right length of time.", "instructions": "Evaluate intensity on a 1-10 scale based on approved CPI parameters.", "recommendation": "Channel the energy. Ensure the player’s effort remains controlled and purposeful rather than rushed, emotional or reckless."}
                ]
                """;

            String defaultHelp = """
                {
                  "welcomeText": "Welcome to the Cricket Performance Index (CPI) platform. This guide explains how our index works, how to interpret scores on an out-of-10 scale, and provides the complete Coach’s Plan of Action for player development.",
                  "coachPlanData": [
                    {
                      "id": "technical_execution",
                      "name": "Technique",
                      "description": "The Technique Index measures how strong a player's basic technique is during practice and matches.",
                      "highPoints": [
                        { "title": "Fundamentals Are Reliable", "detail": "Fundamentals Are Reliable" },
                        { "title": "Technique Holds Up", "detail": "Technique Holds Up" },
                        { "title": "Movement Is Consistent", "detail": "Movement Is Consistent" },
                        { "title": "Self-Correction Is Strong", "detail": "Self-Correction Is Strong" },
                        { "title": "Technique Enables Performance", "detail": "Technique Enables Performance" }
                      ],
                      "highSummary": "An elite score (7–10) shows reliable fundamentals, consistent movement, and strong self-correction under pressure. Technique enables high-level performance.",
                      "mediumPoints": [
                        { "title": "Basics Are Sound", "detail": "Basics Are Sound" },
                        { "title": "Execution Is Improving", "detail": "Execution Is Improving" },
                        { "title": "Pressure Causes Drift", "detail": "Pressure Causes Drift" },
                        { "title": "Gaps Are Specific", "detail": "Gaps Are Specific" },
                        { "title": "Transfer Is Good", "detail": "Transfer Is Good" }
                      ],
                      "mediumSummary": "A developing score (5–7) shows sound basics with execution improving, though pressure can cause drift. Focus on specific technical gaps and consistent match transfer.",
                      "lowPoints": [
                        { "title": "Basics Break Down", "detail": "Basics Break Down" },
                        { "title": "Movement Lacks Control", "detail": "Movement Lacks Control" },
                        { "title": "Pressure Exposes Faults", "detail": "Pressure Exposes Faults" },
                        { "title": "Faults Keep Returning", "detail": "Faults Keep Returning" },
                        { "title": "Technique Limits Performance", "detail": "Technique Limits Performance" }
                      ],
                      "lowSummary": "A score needing attention (0–5) shows that basic technique breaks down under pressure and limits performance. Focus on controlled movement and fundamental mechanics.",
                      "coachSummary": {
                        "overview": "The Technique Index measures how strong a player's basic technique is during practice and matches.",
                        "high": "Fundamentals are reliable, technique holds up, and self-correction is strong.",
                        "medium": "Basics are sound and execution is improving, but pressure can cause drift.",
                        "low": "Basics break down under pressure, movement lacks control, and technique limits performance.",
                        "goal": "Technique enables performance through reliable, consistent fundamentals under match pressure."
                      }
                    },
                    {
                      "id": "skill_level",
                      "name": "Skill Level",
                      "description": "The Skill Level Index measures the quality and range of a player's skills during practice and matches.",
                      "highPoints": [
                        { "title": "Broad Skill Set", "detail": "Broad Skill Set" },
                        { "title": "Skills Are Reliable", "detail": "Skills Are Reliable" },
                        { "title": "Skills Hold Under Pressure", "detail": "Skills Hold Under Pressure" },
                        { "title": "Skills Are Adaptable", "detail": "Skills Are Adaptable" },
                        { "title": "Advanced Development Is Possible", "detail": "Advanced Development Is Possible" }
                      ],
                      "highSummary": "An elite score (7–10) shows a broad, adaptable skill set that holds under pressure, enabling advanced development and game control.",
                      "mediumPoints": [
                        { "title": "Good Core Skills", "detail": "Good Core Skills" },
                        { "title": "Attack and Defence Are Developing", "detail": "Attack and Defence Are Developing" },
                        { "title": "Range Needs Expanding", "detail": "Range Needs Expanding" },
                        { "title": "Application Is Inconsistent", "detail": "Application Is Inconsistent" },
                        { "title": "Adaptability Is Growing", "detail": "Adaptability Is Growing" }
                      ],
                      "mediumSummary": "A developing score (5–7) shows good core skills with growing adaptability, but range needs expansion and application remains inconsistent.",
                      "lowPoints": [
                        { "title": "Skill Set Is Limited", "detail": "Skill Set Is Limited" },
                        { "title": "Core Skills Are Unreliable", "detail": "Core Skills Are Unreliable" },
                        { "title": "Options Are Limited", "detail": "Options Are Limited" },
                        { "title": "Pressure Reduces Skill", "detail": "Pressure Reduces Skill" },
                        { "title": "Below Current Requirement", "detail": "Below Current Requirement" }
                      ],
                      "lowSummary": "A score needing attention (0–5) shows a limited skill set with unreliable core skills under pressure. Focus on core skill repetition and building options.",
                      "coachSummary": {
                        "overview": "The Skill Level Index measures the quality and range of a player's skills during practice and matches.",
                        "high": "Broad, reliable skill set that holds under pressure and adapts quickly.",
                        "medium": "Good core skills with growing adaptability, but range needs expanding.",
                        "low": "Skill set is limited, core skills are unreliable, and pressure reduces execution.",
                        "goal": "Build a broad, versatile skill set that remains reliable under match pressure."
                      }
                    },
                    {
                      "id": "gameplan",
                      "name": "Game Plan",
                      "description": "The Game Plan Index measures whether the player has a clear and effective plan to train, practice and compete.",
                      "highPoints": [
                        { "title": "Clear Strategy and Purpose", "detail": "Clear Strategy and Purpose" },
                        { "title": "Plan Fits the Situation and Role", "detail": "Plan Fits the Situation and Role" },
                        { "title": "Stays Ahead of the Game", "detail": "Stays Ahead of the Game" },
                        { "title": "Adapts Quickly", "detail": "Adapts Quickly" },
                        { "title": "Thinks Independently", "detail": "Thinks Independently" }
                      ],
                      "highSummary": "An elite score (7–10) shows a clear strategy and purpose that fits every role and situation, allowing the player to stay ahead of the game.",
                      "mediumPoints": [
                        { "title": "Basic Plan Is Evident", "detail": "Basic Plan Is Evident" },
                        { "title": "Role Awareness Is Good", "detail": "Role Awareness Is Good" },
                        { "title": "Plan Works in Periods", "detail": "Plan Works in Periods" },
                        { "title": "Adjustment Can Be Slow", "detail": "Adjustment Can Be Slow" },
                        { "title": "Independent Thinking Is Growing", "detail": "Independent Thinking Is Growing" }
                      ],
                      "mediumSummary": "A developing score (5–7) shows good role awareness and a basic plan that works in periods, though in-game tactical adjustments can be slow.",
                      "lowPoints": [
                        { "title": "No Clear Plan", "detail": "No Clear Plan" },
                        { "title": "Role Is Unclear", "detail": "Role Is Unclear" },
                        { "title": "Mostly Reactive", "detail": "Mostly Reactive" },
                        { "title": "Plan Does Not Fit Role", "detail": "Plan Does Not Fit Role" },
                        { "title": "Relies on Instruction", "detail": "Relies on Instruction" }
                      ],
                      "lowSummary": "A score needing attention (0–5) shows an unclear role and reactive play, relying heavily on coach instruction. Focus on defining a simple match strategy.",
                      "coachSummary": {
                        "overview": "The Game Plan Index measures whether the player has a clear and effective plan to train, practice and compete.",
                        "high": "Clear strategy and purpose, stays ahead of the game, and adapts quickly.",
                        "medium": "Basic plan is evident with good role awareness, but tactical adjustments can be slow.",
                        "low": "No clear plan, role is unclear, mostly reactive, and relies heavily on instruction.",
                        "goal": "Develop independent tactical thinking with a clear strategy that fits every game situation."
                      }
                    },
                    {
                      "id": "preparation",
                      "name": "Preparation",
                      "description": "The Preparation Index measures how well the player prepares physically and mentally for practices and matches.",
                      "highPoints": [
                        { "title": "Preparation Is Consistent", "detail": "Preparation Is Consistent" },
                        { "title": "Physically Ready", "detail": "Physically Ready" },
                        { "title": "Mentally Ready", "detail": "Mentally Ready" },
                        { "title": "Tactically Prepared", "detail": "Tactically Prepared" },
                        { "title": "Player-Led", "detail": "Player-Led" }
                      ],
                      "highSummary": "An elite score (7–10) shows consistent, player-led physical, mental, and tactical preparation before every session and match.",
                      "mediumPoints": [
                        { "title": "Basic Routine Exists", "detail": "Basic Routine Exists" },
                        { "title": "Usually Ready to Perform", "detail": "Usually Ready to Perform" },
                        { "title": "Some Tactical Preparation", "detail": "Some Tactical Preparation" },
                        { "title": "Detail Is Inconsistent", "detail": "Detail Is Inconsistent" },
                        { "title": "Ownership Is Growing", "detail": "Ownership Is Growing" }
                      ],
                      "mediumSummary": "A developing score (5–7) shows a basic routine with growing player ownership, though attention to preparation detail remains inconsistent.",
                      "lowPoints": [
                        { "title": "Physical Readiness Is Poor", "detail": "Physical Readiness Is Poor" },
                        { "title": "Mental Readiness Is Low", "detail": "Mental Readiness Is Low" },
                        { "title": "Little Tactical Thought", "detail": "Little Tactical Thought" },
                        { "title": "Purpose Is Unclear", "detail": "Purpose Is Unclear" },
                        { "title": "Coach Dependent", "detail": "Coach Dependent" }
                      ],
                      "lowSummary": "A score needing attention (0–5) shows poor physical/mental readiness and lack of tactical thought prior to play. Focus on basic pre-session routines.",
                      "coachSummary": {
                        "overview": "The Preparation Index measures how well the player prepares physically and mentally for practices and matches.",
                        "high": "Consistent, player-led preparation; physically, mentally, and tactically ready.",
                        "medium": "Basic routine exists and usually ready, with growing personal ownership.",
                        "low": "Physical and mental readiness is poor, purpose is unclear, and coach dependent.",
                        "goal": "Build player-led, consistent preparation routines for physical, mental, and tactical readiness."
                      }
                    },
                    {
                      "id": "intensity",
                      "name": "Intensity",
                      "description": "The Intensity Index measures the mental focus and competitive intent the player brings to practices and matches.",
                      "highPoints": [
                        { "title": "Intensity Is Consistent", "detail": "Intensity Is Consistent" },
                        { "title": "Work Rate Remains High", "detail": "Work Rate Remains High" },
                        { "title": "No Distracted", "detail": "No Distracted" },
                        { "title": "Pressure Raises Engagement", "detail": "Pressure Raises Engagement" },
                        { "title": "Self-Driven Standards", "detail": "Self-Driven Standards" }
                      ],
                      "highSummary": "An elite score (7–10) shows consistent intensity, high work rate, and self-driven standards where pressure raises competitive engagement.",
                      "mediumPoints": [
                        { "title": "Generally Good Energy", "detail": "Generally Good Energy" },
                        { "title": "Standards Occasionally Drop", "detail": "Standards Occasionally Drop" },
                        { "title": "Fatigue Has an Effect", "detail": "Fatigue Has an Effect" },
                        { "title": "Responds to Reminders", "detail": "Responds to Reminders" },
                        { "title": "Consistency Is Growing", "detail": "Consistency Is Growing" }
                      ],
                      "mediumSummary": "A developing score (5–7) shows good energy and growing consistency, though fatigue can affect standards and occasional reminders are needed.",
                      "lowPoints": [
                        { "title": "Effort Is Inconsistent", "detail": "Effort Is Inconsistent" },
                        { "title": "Energy Drops Easily", "detail": "Energy Drops Easily" },
                        { "title": "Fatigue Reduces Standards", "detail": "Fatigue Reduces Standards" },
                        { "title": "Competitive Intent Is Limited", "detail": "Competitive Intent Is Limited" },
                        { "title": "Needs External Motivation", "detail": "Needs External Motivation" }
                      ],
                      "lowSummary": "A score needing attention (0–5) shows inconsistent effort, energy drops, and limited competitive intent without external motivation.",
                      "coachSummary": {
                        "overview": "The Intensity Index measures the mental focus and competitive intent the player brings to practices and matches.",
                        "high": "Consistent high work rate, focused without distraction, and self-driven standards under pressure.",
                        "medium": "Generally good energy with growing consistency, responding well to coach reminders.",
                        "low": "Inconsistent effort, energy drops easily under fatigue, requiring external motivation.",
                        "goal": "Maintain self-driven competitive intent and high intensity throughout every session and match."
                      }
                  ],
                  "ppiDescription": "The Practice Performance Index (PPI) is a structured coaching tool used to assess how effectively a young cricketer trains and develops during practice. It measures performance across the 5 core parameters on a 0 – 10 scale: technique, skill level, game plan, preparation, and intensity.",
                  "mpiDescription": "The Match Performance Index (MPI) is a structured coaching tool used to assess how effectively a young cricketer performs during competitive play on a 0 – 10 scale. It measures performance across the 5 core parameters on a 0 – 10 scale: technique, skill level, game plan, preparation, and intensity.",
                  "cpiDescription": "The Cricket Performance Index (CPI) is a structured coaching tool built around one simple truth: how you practise is how you will play. By measuring key performance areas in both practice and matches on a 0 – 10 scale, the CPI shows what is transferring, where performance is breaking down and what is holding a player back.",
                  "below5Text": "Performance is being limited in one or more key areas. Identify the main cause and make it a coaching priority.",
                  "between5And7Text": "There are positive signs, but performance is still inconsistent. Focus on improving consistency and transfer into matches.",
                  "above7Text": "Performance is strong across the key areas. Protect what is working, maintain standards and continue to challenge the player."
                }
                """;

            var existingConfigOpt = configRepository.findById("MAIN_CONFIG");
            if (existingConfigOpt.isPresent()) {
                CpiContentConfig existing = existingConfigOpt.get();
                if (existing.getHelpJson() != null && (existing.getHelpJson().contains("PRESSURE TEST IT") || existing.getHelpJson().contains("IDENTIFY MAIN ISSUE"))) {
                    log.info("Upgrading existing MAIN_CONFIG helpJson to new 5-point assessment benchmarks...");
                    existing.setHelpJson(defaultHelp);
                    configRepository.save(existing);
                }
                return;
            }

            String defaultInstructions = """
                {
                  "general": "Ensure all player assessments are submitted within 24 hours of session completion to maintain longitudinal tracking accuracy.",
                  "practice": "Focus practice ratings strictly on execution consistency, technical mechanics, and effort level during net drills.",
                  "match": "Evaluate match ratings based on real-time situational execution, tactical adherence, and competitive effort under pressure."
                }
                """;

            String defaultRecommendations = """
                [
                  {"parameter": "Technique", "high": "Protect what already works. Do not make technical changes simply to demonstrate that you are coaching.", "avg": "High score: protect, challenge and refine.", "low": "Identify the root cause. Establish whether the problem is technical, physical, mental, tactical or a combination of these."},
                  {"parameter": "Skill Level", "high": "Identify the strengths. Understand which skills the player performs consistently and confidently.", "avg": "High score: challenge, expand and apply.", "low": "Identify the gap. Establish which important skills are missing, inconsistent or limiting performance."},
                  {"parameter": "Game Plan", "high": "Confirm the thinking. Ask the player what their plan was and why they chose it.", "avg": "High score: confirm, challenge and adapt.", "low": "Establish whether there is a plan. Ask the player what they were trying to do and listen for clarity or uncertainty."},
                  {"parameter": "Preparation", "high": "Reinforce the routine. Help the player identify the habits and routines that allow them to arrive organised, focused and ready to perform.", "avg": "High score: reinforce, connect and transfer.", "low": "Identify what is missing. Establish whether the problem is poor organisation, unclear expectations, tiredness, lack of support, low motivation or simple forgetfulness."},
                  {"parameter": "Intensity", "high": "Channel the energy. Ensure the player’s effort remains controlled and purposeful rather than rushed, emotional or reckless.", "avg": "High score: channel, challenge and sustain.", "low": "Identify the reason. Establish whether the low intensity is caused by fatigue, poor health, low confidence, boredom, unclear expectations or a lack of motivation."}
                ]
                """;

            String defaultAiCoach = """
                {
                  "systemInstructions": "You are the CPI AI Head Performance Analyst. Provide objective, evidence-based performance feedback for cricket players using ONLY the exact wording from the CPI 5-parameter framework. DO NOT generate, display, or reference any Coach's Summary or 'THE COACH'S SUMMARY' sections anywhere.",
                  "coachingTone": "Professional, encouraging, analytical, and actionable.",
                  "responseGuidance": "Format outputs clearly using exact parameter headings (HOW TO COACH TECHNIQUE, HOW TO COACH SKILL LEVEL, HOW TO COACH GAME PLAN, HOW TO COACH PREPARATION, HOW TO COACH INTENSITY). Do not generate any 'THE COACH'S SUMMARY' sections.",
                  "recommendationBehaviour": "Outputs must contain ONLY exact sentences from CPI Framework. Do not paraphrase, rewrite, or add any Coach's Summary."
                }
                """;

            String defaultReports = """
                {
                  "heading": "CPI Comprehensive Player Performance Assessment Report",
                  "subheading": "Detailed 5-Parameter Evaluation & AI Coach Performance Breakdown",
                  "section3Title": "Complete Parameter Performance Breakdown (Strongest → Weakest)",
                  "recommendationWording": "Targeted Development Plan based on current CPI Parameter Scores:",
                  "strengthWeaknessWording": "Full 5-Parameter Spectrum Analysis:",
                  "scoreFormatNote": "All scores normalized to 10-point CPI scale (e.g. 7.7 / 10)",
                  "helpItems": [
                    {"parameter": "Technique", "explanation": "Technique measures how effectively a player applies their skills during competitive play and practice.", "rangeHigh": "Scores 7.0-10.0: High score: protect, challenge and refine.", "rangeAvg": "Scores 5.0-6.9: A high score tells you that the player's technique is currently a strength.", "rangeLow": "Scores 0.0-4.9: Low score: diagnose, simplify and rebuild."},
                    {"parameter": "Skill Level", "explanation": "Skill Level measures how effectively a player applies their range of cricket-specific skills in both practice and matches.", "rangeHigh": "Scores 7.0-10.0: High score: challenge, expand and apply.", "rangeAvg": "Scores 5.0-6.9: The Skill Level Index helps the coach understand whether the player has the range and quality of skills.", "rangeLow": "Scores 0.0-4.9: Low score: identify, build and repeat."},
                    {"parameter": "Game Plan", "explanation": "Game Plan measures how clearly a player understands what they are trying to achieve and how they intend to go about it.", "rangeHigh": "Scores 7.0-10.0: High score: confirm, challenge and adapt.", "rangeAvg": "Scores 5.0-6.9: The Game Plan Index helps the coach understand whether the player is performing with clear purpose.", "rangeLow": "Scores 0.0-4.9: Low score: clarify, simplify and rehearse."},
                    {"parameter": "Preparation", "explanation": "Preparation measures how physically, mentally and practically ready a player is to perform in both practice and matches.", "rangeHigh": "Scores 7.0-10.0: High score: reinforce, connect and transfer.", "rangeAvg": "Scores 5.0-6.9: The Preparation Index helps the coach identify whether the player is giving themselves a genuine opportunity to improve.", "rangeLow": "Scores 0.0-4.9: Low score: clarify, organise and build responsibility."},
                    {"parameter": "Intensity", "explanation": "Intensity measures the energy, purpose and competitive effort a player brings to practice and matches.", "rangeHigh": "Scores 7.0-10.0: High score: channel, challenge and sustain.", "rangeAvg": "Scores 5.0-6.9: The Intensity Index helps the coach distinguish between genuine competitive effort and meaningless activity.", "rangeLow": "Scores 0.0-4.9: Low score: investigate, engage and rebuild."}
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
