#!/bin/bash
set -e

# Setup clean DB
pkill -f cpi-backend-0.0.1-SNAPSHOT.jar || true
sleep 1

echo "Starting fresh backend server..."
java -jar target/cpi-backend-0.0.1-SNAPSHOT.jar \
  --spring.datasource.url="jdbc:h2:mem:cpi_db;DB_CLOSE_DELAY=-1;MODE=PostgreSQL" \
  --spring.datasource.driver-class-name=org.h2.Driver \
  --spring.datasource.username=sa \
  --spring.datasource.password= \
  --spring.jpa.database-platform=org.hibernate.dialect.H2Dialect \
  --spring.jpa.properties.hibernate.dialect=org.hibernate.dialect.H2Dialect > backend.log 2>&1 &

BACKEND_PID=$!
echo "Backend PID: $BACKEND_PID"

# Wait for backend to start
for i in {1..20}; do
  if curl -s http://localhost:8080/actuator/health >/dev/null || curl -s http://localhost:8080/login >/dev/null; then
    echo "Backend is up!"
    break
  fi
  echo "Waiting for backend..."
  sleep 2
done

# Step 1: Register Coach A
echo -e "\n=== 1. Register Coach A ==="
COACH_A_RES=$(curl -s -X POST http://localhost:8080/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Coach Bob",
    "email": "bob@cpi.com",
    "password": "Password123",
    "createOrganization": true,
    "organizationName": "Youth Academy",
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
    "name": "under 19",
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

# Step 5: Complete Practice Session
echo -e "\n=== 5. Complete Practice Session ==="
SESSION_RES=$(curl -s -X POST http://localhost:8080/api/practice/sessions \
  -H "Authorization: Bearer $COACH_A_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "teamId": '$TEAM_ID',
    "name": "Under 19 Nets",
    "date": "2026-06-19",
    "assessments": [
      {
        "playerId": '$VIRAT_ID',
        "technique": 6,
        "intensity": 6,
        "execution": 6,
        "adaptability": 5,
        "discipline": 5,
        "focus": 6,
        "notes": "Good technique"
      },
      {
        "playerId": '$DHONI_ID',
        "technique": 5,
        "intensity": 6,
        "execution": 5,
        "adaptability": 6,
        "discipline": 5,
        "focus": 6,
        "notes": "Solid defense"
      }
    ]
  }')
echo "Session Response: $SESSION_RES"

# Cleanup
echo "Cleaning up backend process..."
kill $BACKEND_PID || true
echo "All done!"
