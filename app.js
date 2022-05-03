const express = require("express");

const { open } = require("sqlite");
const sqlite3 = require("sqlite3");

const path = require("path");
const dbPath = path.join(__dirname, "cricketMatchDetails.db");

const app = express();
app.use(express.json());

let database = null;

const initializedDBAndServer = async () => {
  try {
    database = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Hosting Server locally at http://localhost:3000");
    });
  } catch (error) {
    console.log(`DB Error: ${error.message}`);
  }
};

initializedDBAndServer();

const convertDBObjToResponseObj = (player) => {
  return {
    playerId: player.player_id,
    playerName: player.player_name,
  };
};

const convertDBObj2ResponseObj = (match) => {
  return {
    matchId: match.match_id,
    match: match.match,
    year: match.year,
  };
};

const playerDetails = (player) => {
  return {
    playerId: player.player_id,
    playerName: player.player_name,
    totalScore: player.total_score,
    totalFours: player.total_fours,
    totalSixes: player.total_sixes,
  };
};
// GET players API

app.get("/players/", async (request, response) => {
  const playersQuery = `
        SELECT 
        *
        FROM 
        player_details
    ;`;
  const playersArray = await database.all(playersQuery);
  response.send(
    playersArray.map((eachPlayer) => convertDBObjToResponseObj(eachPlayer))
  );
});

// GET player by ID API

app.get("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const playerQuery = `
        SELECT 
        *
        FROM
        player_details
        WHERE 
        player_id = ${playerId}
    ;`;
  const player = await database.get(playerQuery);
  response.send(convertDBObjToResponseObj(player));
});

// PUT player by ID API

app.put("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const { playerName } = request.body;
  const updatePlayer = `
    UPDATE player_details
    SET
    player_name = '${playerName}'
    WHERE player_id = ${playerId}
  ;`;
  await database.run(updatePlayer);
  response.send("Player Details Updated");
});

// GET match by ID API
app.get("/matches/:matchId/", async (request, response) => {
  const { matchId } = request.params;
  const matchQuery = `
        SELECT 
        *
        FROM
        match_details
        WHERE 
        match_id = ${matchId}
    ;`;
  const match = await database.get(matchQuery);
  response.send(convertDBObj2ResponseObj(match));
});

// GET matches by player ID API

app.get("/players/:playerId/matches", async (request, response) => {
  const { playerId } = request.params;
  const playerMatchQuery = `
        SELECT 
        *
        FROM
        player_match_score 
        INNER JOIN 
        match_details ON player_match_score.match_id = match_details.match_id
        WHERE 
        player_id = ${playerId}
    ;`;
  const playerMatch = await database.all(playerMatchQuery);
  response.send(
    playerMatch.map((eachMatch) => convertDBObj2ResponseObj(eachMatch))
  );
});

// GET match by ID API
app.get("/matches/:matchId/players", async (request, response) => {
  const { matchId } = request.params;
  const matchQuery = `
        SELECT 
        *
        FROM
        player_match_score INNER JOIN player_details ON player_match_score.player_id = player_details.player_id
        WHERE 
        match_id = ${matchId}
    ;`;
  const match = await database.all(matchQuery);
  response.send(match.map((eachMatch) => convertDBObjToResponseObj(eachMatch)));
});

// GET player scores by ID API

app.get("/players/:playerId/playerScores", async (request, response) => {
  const { playerId } = request.params;
  const playerQuery = `
        SELECT
            player_id,
            player_name,
            SUM(score) AS total_score,
            SUM(fours) AS total_fours,
            SUM(sixes) AS total_sixes
        FROM
            player_match_score NATURAL JOIN player_details
        WHERE 
            player_id = ${playerId}
        GROUP BY 
            player_id
    ;`;
  const player = await database.get(playerQuery);
  response.send(playerDetails(player));
});
module.exports = app;
