#!/bin/bash
set -e

# Step 1: Register Coach A
echo -e "\n=== 1. Register Coach A ==="
COACH_A_RES=$(curl -s -X POST http://localhost:8080/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Coach Bob",
    "email": "bob_match@cpi.com",
    "password": "Password123",
    "createOrganization": true,
    "organizationName": "Youth Match Academy",
    "organizationType": "Academy",
    "sport": "Cricket",
    "country": "India",
    "city": "Mumbai"
  }')
COACH_A_TOKEN=$(echo $COACH_A_RES | python3 -c "import sys, json; print(json.load(sys.stdin)['token'])")

# Step 2: Create Team Under 19
echo -e "\n=== 2. Create Team Under 19 ==="
TEAM_RES=$(curl -s -X POST http://localhost:8080/api/teams \
  -H "Authorization: Bearer $COACH_A_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "under 19 match",
    "level": "BEGINNER"
  }')
TEAM_ID=$(echo $TEAM_RES | python3 -c "import sys, json; print(json.load(sys.stdin)['id'])")
echo "Team ID: $TEAM_ID"

# Step 3: Create Player Virat
echo -e "\n=== 3. Create Player Virat ==="
PLAYER_VIRAT_RES=$(curl -s -X POST http://localhost:8080/api/players \
  -H "Authorization: Bearer $COACH_A_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "virat",
    "role": "Batsman",
    "battingStyle": "Right-hand bat",
    "bowlingStyle": "None",
    "teamId": '$TEAM_ID'
  }')
VIRAT_ID=$(echo $PLAYER_VIRAT_RES | python3 -c "import sys, json; print(json.load(sys.stdin)['id'])")
echo "Virat ID: $VIRAT_ID"

# Step 4: Create Player Dhoni
echo -e "\n=== 4. Create Player Dhoni ==="
PLAYER_DHONI_RES=$(curl -s -X POST http://localhost:8080/api/players \
  -H "Authorization: Bearer $COACH_A_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "dhoni",
    "role": "Batsman",
    "battingStyle": "Right-hand bat",
    "bowlingStyle": "None",
    "teamId": '$TEAM_ID'
  }')
DHONI_ID=$(echo $PLAYER_DHONI_RES | python3 -c "import sys, json; print(json.load(sys.stdin)['id'])")
echo "Dhoni ID: $DHONI_ID"

# Step 5: Complete Match Session
echo -e "\n=== 5. Complete Match Session ==="
SESSION_RES=$(curl -s -X POST http://localhost:8080/api/matches/sessions \
  -H "Authorization: Bearer $COACH_A_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "teamId": '$TEAM_ID',
    "name": "IPL Final 2026",
    "opponent": "Mumbai Indians",
    "venue": "Wankhede Stadium",
    "date": "2026-06-21",
    "assessments": [
      {
        "playerId": '$VIRAT_ID',
        "technicalExecution": 8,
        "decisionMaking": 9,
        "gameAwareness": 7,
        "pressureHandling": 8,
        "teamContribution": 9,
        "matchImpact": 8,
        "notes": "Excellent run chase"
      },
      {
        "playerId": '$DHONI_ID',
        "technicalExecution": 7,
        "decisionMaking": 8,
        "gameAwareness": 9,
        "pressureHandling": 10,
        "teamContribution": 8,
        "matchImpact": 9,
        "notes": "Great captaincy and finish"
      }
    ]
  }')
echo "Session Response: $SESSION_RES"

# Step 6: Get Match Sessions
echo -e "\n=== 6. Get Match Sessions ==="
GET_SESSIONS_RES=$(curl -s -H "Authorization: Bearer $COACH_A_TOKEN" http://localhost:8080/api/matches/sessions)
echo "Sessions: $GET_SESSIONS_RES"

# Step 7: Get Match Session Details
MATCH_SESSION_ID=$(echo $SESSION_RES | python3 -c "import sys, json; print(json.load(sys.stdin)['id'])")
echo -e "\n=== 7. Get Match Session Details ==="
GET_DETAILS_RES=$(curl -s -H "Authorization: Bearer $COACH_A_TOKEN" http://localhost:8080/api/matches/sessions/$MATCH_SESSION_ID)
echo "Details: $GET_DETAILS_RES"

echo -e "\n=== Verification Complete ==="
