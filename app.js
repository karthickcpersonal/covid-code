const express = require("express");
const app = express();
app.use(express.json());
const path = require("path");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const Path = path.join(__dirname, "covid19India.db");

let db = null;
const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: Path,
      driver: sqlite3.Database,
    });

    app.listen(3000, () => {
      console.log("Sever is Running");
    });
  } catch (e) {
    console.log(`DB Error :${e.message}`);
    process.exit(1);
  }
};
initializeDBAndServer();

app.get("/states/", async (request, response) => {
  const getStateNames = `
        SELECT *
        FROM state`;
  const stateNames = await db.all(getStateNames);
  const changingFun = (obj) => {
    return {
      stateId: obj.state_id,
      stateName: obj.state_name,
      population: obj.population,
    };
  };
  const camelCaseChange = stateNames.map((obj) => changingFun(obj));

  response.send(camelCaseChange);
});

app.get("/states/:stateId/", async (request, response) => {
  const { stateId } = request.params;
  const getStateName = `SELECT * FROM state WHERE state_id=${stateId}`;
  const stateName = await db.all(getStateName);
  const changingFun = (obj) => {
    return {
      stateId: obj.state_id,
      stateName: obj.state_name,
      population: obj.population,
    };
  };
  const camelCaseChange = stateName.map((obj) => changingFun(obj));

  response.send(...camelCaseChange);
});

app.post("/districts/", async (request, response) => {
  const districtContent = request.body;
  const {
    districtName,
    stateId,
    cases,
    cured,
    active,
    deaths,
  } = districtContent;
  const postDistrict = `
        INSERT INTO district(district_name,state_id,cases,cured,active,deaths)
        VALUES ('${districtName}',${stateId},${cases},${cured},${active},${deaths})`;
  await db.run(postDistrict);

  response.send("District Successfully Added");
});

app.get("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const getDistrict = `SELECT * FROM district WHERE district_id=${districtId}`;
  const districtName = await db.all(getDistrict);
  const changingFun = (obj) => {
    return {
      districtId: obj.district_id,
      districtName: obj.district_name,
      stateId: obj.state_id,
      cases: obj.cases,
      cured: obj.cured,
      active: obj.active,
      deaths: obj.deaths,
    };
  };
  const camelCaseChange = districtName.map((obj) => changingFun(obj));

  response.send(...camelCaseChange);
});

app.delete("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const deleteDistrict = `DELETE FROM district WHERE district_id=${districtId}`;
  await db.all(deleteDistrict);
  response.send("District Removed");
});

app.put("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const districtContent = request.body;
  const {
    districtName,
    stateId,
    cases,
    cured,
    active,
    deaths,
  } = districtContent;
  const putDistrict = `
        UPDATE district SET 
        district_name='${districtName}',state_id=${stateId},
        cases=${cases},cured=${cured},active=${active},deaths=${deaths}
        WHERE district_id=${districtId} `;
  await db.run(putDistrict);

  response.send("District Details Updated");
});

app.get("/states/:stateId/stats/", async (request, response) => {
  const { stateId } = request.params;
  const getCases = `
  SELECT sum(district.cases) AS totalCases,
         sum(district.cured) AS totalCured,
         sum(district.active) AS totalActive,
         sum(district.deaths) AS totalDeaths
  FROM state NATURAL JOIN district
  WHERE state_id=${stateId}`;
  const cases = await db.all(getCases);
  const changingFun = (obj) => {
    return {
      totalCases: obj.totalCases,
      totalCured: obj.totalCured,
      totalActive: obj.totalActive,
      totalDeaths: obj.totalDeaths,
    };
  };
  const camelCaseChange = cases.map((obj) => changingFun(obj));

  response.send(...camelCaseChange);
});

app.get("/districts/:districtId/details/", async (request, response) => {
  const { districtId } = request.params;
  const getState = `
  SELECT state.state_name AS stateName
  FROM state NATURAL JOIN district
  WHERE district_id=${districtId}`;
  const state = await db.all(getState);
  

  response.send(...state);
});

module.exports = app;
