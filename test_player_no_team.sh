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

# Step 2: Coach A creates a Player WITHOUT a team
echo -e "\n=== 2. Coach A creates a player without a team ==="
PLAYER_RES=$(curl -s -X POST http://localhost:8080/api/players \
  -H "Authorization: Bearer $COACH_A_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Dhoni",
    "role": "Wicketkeeper",
    "battingStyle": "Right-hand bat",
    "bowlingStyle": "None",
    "teamId": null
  }')
echo "Player Response: $PLAYER_RES"

# Cleanup
echo "Cleaning up backend process..."
kill $BACKEND_PID || true
echo "All done!"
