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
                [
                  {"parameter": "Technical Execution", "explanation": "Refers to how biomechanically sound and repeatable a player's fundamental techniques are.", "rangeHigh": "Scores 8.0-10.0: Flawless technique, balanced weight distribution, precise bat path.", "rangeAvg": "Scores 5.0-7.9: Solid core technique with occasional mechanical flaws under pressure.", "rangeLow": "Scores 1.0-4.9: Significant technical breakdowns requiring fundamental rework."},
                  {"parameter": "Skill Level", "explanation": "Refers to stroke repertoire, bowling variations, and fielding dexterity.", "rangeHigh": "Scores 8.0-10.0: Masterful control over all shot/bowling variations.", "rangeAvg": "Scores 5.0-7.9: Good standard skillset with limited advanced variations.", "rangeLow": "Scores 1.0-4.9: Restricted skill set with execution difficulties."},
                  {"parameter": "Game Plan", "explanation": "Tactical comprehension of match scenarios, field settings, and match pace.", "rangeHigh": "Scores 8.0-10.0: Elite tactical execution and situational awareness.", "rangeAvg": "Scores 5.0-7.9: Understands strategy but occasionally deviates under stress.", "rangeLow": "Scores 1.0-4.9: Poor situational decisions and strategy execution."},
                  {"parameter": "Preparation", "explanation": "Professionalism in warmup, mental readiness, and physical prep.", "rangeHigh": "Scores 8.0-10.0: Meticulous professional warmup and mental visualization.", "rangeAvg": "Scores 5.0-7.9: Standard preparation routine lacking deep focus.", "rangeLow": "Scores 1.0-4.9: Casual or rushed preparation leading to slow starts."},
                  {"parameter": "Intensity", "explanation": "Physical energy, sprinting between wickets, and fielding commitment.", "rangeHigh": "Scores 8.0-10.0: Relentless high energy and total physical effort.", "rangeAvg": "Scores 5.0-7.9: Inconsistent energy output across match phases.", "rangeLow": "Scores 1.0-4.9: Passive body language and low physical intensity."},
                  {"parameter": "Focus", "explanation": "Concentration maintenance and ball-by-ball cognitive reset.", "rangeHigh": "Scores 8.0-10.0: Laser concentration and instant mental reset.", "rangeAvg": "Scores 5.0-7.9: Solid focus with occasional middle-session lapses.", "rangeLow": "Scores 1.0-4.9: Easily distracted, carrying errors from ball to ball."},
                  {"parameter": "Resilience", "explanation": "Mental toughness under pressure and bounce-back capacity.", "rangeHigh": "Scores 8.0-10.0: Thrives in high-pressure crunch situations.", "rangeAvg": "Scores 5.0-7.9: Competent response to setback with occasional hesitation.", "rangeLow": "Scores 1.0-4.9: Folds quickly when match pressure escalates."}
                ]
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
                  "scoreFormatNote": "All scores normalized to 10-point CPI scale (e.g. 7.7 / 10)"
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

            CpiContentConfig defaultConfig = CpiContentConfig.builder()
                    .configKey("MAIN_CONFIG")
                    .parametersJson(defaultParameters)
                    .helpJson(defaultHelp)
                    .instructionsJson(defaultInstructions)
                    .recommendationsJson(defaultRecommendations)
                    .aiCoachJson(defaultAiCoach)
                    .reportsJson(defaultReports)
                    .settingsJson(defaultSettings)
                    .lastUpdatedAt(LocalDateTime.now())
                    .changeLogsJson("[]")
                    .versionsJson("[]")
                    .build();

            configRepository.save(defaultConfig);
            log.info("Default CPI Master Admin Content Configuration seeded successfully.");
        }
    }
}
