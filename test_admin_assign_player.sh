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

# Step 1: Register Org Admin
echo -e "\n=== 1. Register Org Admin ==="
ADMIN_RES=$(curl -s -X POST http://localhost:8080/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Org Admin",
    "email": "admin@cpi.com",
    "password": "Password123",
    "createOrganization": true,
    "organizationName": "National League",
    "organizationType": "Club",
    "sport": "Cricket",
    "country": "India",
    "city": "Mumbai"
  }')
ADMIN_TOKEN=$(echo $ADMIN_RES | python3 -c "import sys, json; print(json.load(sys.stdin)['token'])")

# Fetch Org Details using profile endpoint
ADMIN_PROFILE=$(curl -s -X GET http://localhost:8080/api/profile \
  -H "Authorization: Bearer $ADMIN_TOKEN")
ADMIN_ORG_ID=$(echo $ADMIN_PROFILE | python3 -c "import sys, json; print(json.load(sys.stdin)['organization']['id'])")
ADMIN_ORG_CODE=$(echo $ADMIN_PROFILE | python3 -c "import sys, json; print(json.load(sys.stdin)['organization']['joinCode'])")
echo "Admin Org ID: $ADMIN_ORG_ID, Join Code: $ADMIN_ORG_CODE"

# Step 2: Register Coach B under the same Org using the Join Code
echo -e "\n=== 2. Register Coach B ==="
COACH_B_RES=$(curl -s -X POST http://localhost:8080/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Coach Bob",
    "email": "bob@cpi.com",
    "password": "Password123",
    "createOrganization": false,
    "joinCode": "'$ADMIN_ORG_CODE'"
  }')
COACH_B_TOKEN=$(echo $COACH_B_RES | python3 -c "import sys, json; print(json.load(sys.stdin)['token'])")

# Fetch Coach B profile to get their ID
COACH_B_PROFILE=$(curl -s -X GET http://localhost:8080/api/profile \
  -H "Authorization: Bearer $COACH_B_TOKEN")
COACH_B_ID=$(echo $COACH_B_PROFILE | python3 -c "import sys, json; print(json.load(sys.stdin)['id'])")
echo "Coach B ID: $COACH_B_ID"

# Step 3: Admin creates player "Kohli" (no team)
echo -e "\n=== 3. Admin creates player Kohli ==="
PLAYER_RES=$(curl -s -X POST http://localhost:8080/api/players \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Kohli",
    "role": "Batsman",
    "battingStyle": "Right-hand bat",
    "bowlingStyle": "None",
    "teamId": null
  }')
PLAYER_ID=$(echo $PLAYER_RES | python3 -c "import sys, json; print(json.load(sys.stdin)['id'])")
echo "Player Kohli ID: $PLAYER_ID"

# Step 4: Coach B creates team "Main Team"
echo -e "\n=== 4. Coach B creates team Main Team ==="
TEAM_RES=$(curl -s -X POST http://localhost:8080/api/teams \
  -H "Authorization: Bearer $COACH_B_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Main Team",
    "level": "PROFESSIONAL"
  }')
TEAM_ID=$(echo $TEAM_RES | python3 -c "import sys, json; print(json.load(sys.stdin)['id'])")
echo "Main Team ID: $TEAM_ID"

# Step 5: Admin assigns player Kohli to Coach B's team "Main Team"
echo -e "\n=== 5. Admin assigns Kohli to Main Team ==="
curl -s -X POST "http://localhost:8080/api/teams/$TEAM_ID/players/$PLAYER_ID" \
  -H "Authorization: Bearer $ADMIN_TOKEN"

# Step 6: Verify Kohli's owner is now Coach B and appears in Coach B's roster
echo -e "\n=== 6. Fetch Coach B's roster ==="
COACH_B_PLAYERS=$(curl -s -X GET http://localhost:8080/api/players \
  -H "Authorization: Bearer $COACH_B_TOKEN")
echo "Coach B Players: $COACH_B_PLAYERS"

IS_ASSIGNED=$(echo $COACH_B_PLAYERS | python3 -c "import sys, json; players=json.load(sys.stdin); print(any(p['id'] == $PLAYER_ID and p['creatorCoach']['id'] == $COACH_B_ID for p in players))")
echo "Is Kohli in Coach B's roster and owned by Coach B? $IS_ASSIGNED"

if [ "$IS_ASSIGNED" = "True" ]; then
  echo "TEST PASSED SUCCESSFULLY!"
else
  echo "TEST FAILED!"
  exit 1
fi

# Cleanup
echo "Cleaning up backend process..."
kill $BACKEND_PID || true
echo "All done!"
