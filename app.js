const express = require("express");
const app = express();
const sqlite3 = require("sqlite3");
const { open } = require("sqlite");
const bcrypt = require("bcrypt");
const path = require("path");
const dbPath = path.join(__dirname, "userData.db");
app.use(express.json());
let db = null;

const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server Is Running");
    });
  } catch (e) {
    console.log(`error ${e.message}`);
    process.exit(1);
  }
};

initializeDBAndServer();

app.post("/register", async (request, response) => {
  const { name, username, password, gender, location } = request.body;
  const passwordLength = password.length;
  const hashedPassword = await bcrypt.hash(password, 10);
  const userQuery = `
  SELECT *
   FROM user
   WHERE username = '${username}';`;
  const user = await db.get(userQuery);
  if (user !== undefined) {
    response.status(400);
    response.send("User already exists");
  } else {
    if (passwordLength < 5) {
      response.status(400);
      response.send("Password is too short");
    } else {
      const createUser = `
          INSERT INTO 
          user(username,name,password,gender,location)
          VALUES
            ('${username}','${name}','${hashedPassword}','${gender}','${location}');`;
      await db.run(createUser);
      response.status(200);
      response.send("User created successfully");
    }
  }
});

app.post("/login", async (request, response) => {
  const { username, password } = request.body;
  const userQuery = `
  SELECT *
   FROM user
   WHERE username = '${username}';`;
  const user = await db.get(userQuery);
  if (user === undefined) {
    response.status(400);
    response.send("Invalid user");
  } else {
    const checkPassword = await bcrypt.compare(password, user.password);
    if (checkPassword === false) {
      response.status(400);
      response.send("Invalid password");
    } else {
      response.status(200);
      response.send("Login success!");
    }
  }
});

app.put("/change-password", async (request, response) => {
  const { username, oldPassword, newPassword } = request.body;
  const userQuery = `
  SELECT *
   FROM user
   WHERE username = '${username}';`;
  const user = await db.get(userQuery);

  if (user !== undefined) {
    const checkPassword = await bcrypt.compare(oldPassword, user.password);
    const newPasswordLength = newPassword.length;
    const hashedNewPassword = await bcrypt.hash(newPassword, 10);
    if (checkPassword === false) {
      response.status(400);
      response.send("Invalid current password");
    } else if (newPasswordLength < 5) {
      response.status(400);
      response.send("Password is too short");
    } else {
      const updatePassword = `
          UPDATE 
          user
          SET 
            password = '${hashedNewPassword}'
          WHERE 
            username = '${username}';`;
      await db.run(updatePassword);
      response.status(200);
      response.send("Password updated");
    }
  } else {
    response.status(400);
    response.send("Invalid User");
  }
});

module.exports = app;
