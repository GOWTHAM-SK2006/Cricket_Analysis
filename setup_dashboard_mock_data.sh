#!/bin/bash
set -e

echo "=== 1. Register Coach Daryll ==="
COACH_RES=$(curl -s -X POST http://localhost:8080/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Coach Daryll",
    "email": "daryll@cpi.com",
    "password": "Password123",
    "createOrganization": true,
    "organizationName": "Cricket Academy",
    "organizationType": "Academy",
    "sport": "Cricket",
    "country": "India",
    "city": "Mumbai"
  }')
COACH_TOKEN=$(echo $COACH_RES | python3 -c "import sys, json; print(json.load(sys.stdin)['token'])")

echo "=== 2. Create Teams ==="
TEAM_MAIN_RES=$(curl -s -X POST http://localhost:8080/api/teams \
  -H "Authorization: Bearer $COACH_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Main Team",
    "level": "BEGINNER"
  }')
TEAM_MAIN_ID=$(echo $TEAM_MAIN_RES | python3 -c "import sys, json; print(json.load(sys.stdin)['id'])")

TEAM_U19_RES=$(curl -s -X POST http://localhost:8080/api/teams \
  -H "Authorization: Bearer $COACH_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Under 19",
    "level": "BEGINNER"
  }')
TEAM_U19_ID=$(echo $TEAM_U19_RES | python3 -c "import sys, json; print(json.load(sys.stdin)['id'])")

echo "=== 3. Create Players ==="
PLAYER_1_RES=$(curl -s -X POST http://localhost:8080/api/players \
  -H "Authorization: Bearer $COACH_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Virat Kohli",
    "role": "Batsman",
    "battingStyle": "Right-hand bat",
    "bowlingStyle": "None",
    "teamId": '$TEAM_U19_ID'
  }')
P1_ID=$(echo $PLAYER_1_RES | python3 -c "import sys, json; print(json.load(sys.stdin)['id'])")

PLAYER_2_RES=$(curl -s -X POST http://localhost:8080/api/players \
  -H "Authorization: Bearer $COACH_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "MS Dhoni",
    "role": "Wicketkeeper Batsman",
    "battingStyle": "Right-hand bat",
    "bowlingStyle": "None",
    "teamId": '$TEAM_U19_ID'
  }')
P2_ID=$(echo $PLAYER_2_RES | python3 -c "import sys, json; print(json.load(sys.stdin)['id'])")

PLAYER_3_RES=$(curl -s -X POST http://localhost:8080/api/players \
  -H "Authorization: Bearer $COACH_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Rohit Sharma",
    "role": "Batsman",
    "battingStyle": "Right-hand bat",
    "bowlingStyle": "None",
    "teamId": '$TEAM_MAIN_ID'
  }')
P3_ID=$(echo $PLAYER_3_RES | python3 -c "import sys, json; print(json.load(sys.stdin)['id'])")

echo "=== 4. Log Practice Sessions ==="
# Practice 1
curl -s -X POST http://localhost:8080/api/practice/sessions \
  -H "Authorization: Bearer $COACH_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "teamId": '$TEAM_U19_ID',
    "name": "Nets Session 1",
    "date": "2026-06-18",
    "assessments": [
      {
        "playerId": '$P1_ID',
        "technique": 6,
        "intensity": 6,
        "execution": 6,
        "adaptability": 5,
        "discipline": 5,
        "focus": 6,
        "notes": "Focused nets"
      }
    ]
  }' > /dev/null

# Practice 2
curl -s -X POST http://localhost:8080/api/practice/sessions \
  -H "Authorization: Bearer $COACH_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "teamId": '$TEAM_U19_ID',
    "name": "Nets Session 2",
    "date": "2026-06-19",
    "assessments": [
      {
        "playerId": '$P2_ID',
        "technique": 5,
        "intensity": 5,
        "execution": 5,
        "adaptability": 5,
        "discipline": 5,
        "focus": 5,
        "notes": "Good keeping work"
      }
    ]
  }' > /dev/null

# Practice 3
curl -s -X POST http://localhost:8080/api/practice/sessions \
  -H "Authorization: Bearer $COACH_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "teamId": '$TEAM_MAIN_ID',
    "name": "Main Nets",
    "date": "2026-06-20",
    "assessments": [
      {
        "playerId": '$P3_ID',
        "technique": 10,
        "intensity": 10,
        "execution": 10,
        "adaptability": 10,
        "discipline": 10,
        "focus": 10,
        "notes": "Flawless batting session"
      }
    ]
  }' > /dev/null

echo "=== Data setup complete ==="
echo "Coach Email: daryll@cpi.com"
echo "Coach Password: Password123"
