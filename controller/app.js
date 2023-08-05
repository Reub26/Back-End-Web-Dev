// Admission num: P2205711
// Name:          Reuben Goh
// Class:         DISM2A03

// controller layer error to receive requests from client then interact with model to retrieve or modify data

const gameFunc = require("../model/gameFunc");
const utilities = require("../functions/utility");
const secretKey = require("../config")
const fs = require("fs");
const express = require("express");
const bcrypt = require("bcrypt");
// used multer becuz can define file size limit and more flexible than express-fileupload
const multer = require("multer");
const jwt = require("jsonwebtoken");
const isLoggedInMiddleware = require("../auth/isLoggedIn");


// middleware
const storage = multer.diskStorage({
  destination: __dirname + "\\..\\public\\gameImage",
  filename: (req, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname);   // appended date to ensure that img name is unqiue
  },
});

// limit img file size
const fileLimit = 1 * 1024 * 1024;    // 1MB

const upload = multer({
  storage: storage,
  limits: { fileSize: fileLimit },
  fileFilter: function (req, file, cb) {
    // allowed extensions
    const fileTypes = /jpeg|png|jpg|gif/;
    utilities.checkFileType(file, cb, fileTypes);
  }
}).single("img_name");    // img_name is key name from postman


const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(__dirname + "\\..\\public"));


// Login to get JWT token
// app.options()
app.post("/login", async (req, res) => {
  const username = req.body.username;
  const password = req.body.password;

  try {
    const user = await gameFunc.verify(username);
    if (user === null) {
      // unauthorized login
      res.status(401).send({ error: "Incorrect password/username login" });
    }

    else {
      bcrypt.compare(password, user.password, (err, result) => {
        if (err) {
          utilities.logErrors(err, "Getting_users");
          res.status(500).send({ error: "Internal Server Error" });
        }

        else {
          if (!result) {
            // unauthorized login
            res.status(401).send({ error: "Incorrect password/username login" });
          }

          else {
            const payload = { user_id: user.user_id, role: user.type };
            const token = jwt.sign(payload, secretKey, { expiresIn: "7d", algorithm: "HS256" });

            res.status(200).send({
              user_id: user.user_id,
              token: token
            });
          }
        }
      });

    }
  }

  catch (err) {
    utilities.logErrors(err, "Getting_users");
    res.status(500).send({ error: "Internal Server Error" });
  }
});



// ---------------------------------------------
// get array of all users in DB (require log in due to listing *all* users)
app.get("/users", isLoggedInMiddleware, async (req, res) => {
  try {
    // get all users
    const result = await gameFunc.getAllUsers();

    // check user role (only admin can view all users)
    if (req.credentials.role === "Admin") {
      res.status(200).send(result);
    }

    else {
      res.status(401).send({ error: "Insufficent permissions" });
    }

  }

  catch (err) {
    utilities.logErrors(err, "Getting_users");
    res.status(500).send({ error: "Internal Server Error" });
  }
});


// ---------------------------------------------
// create a new user in DB (register)
app.post("/users", async (req, res) => {
  try {
    // validate user req body (need 2 since "profile_pic_url" is nullable and can be empty)
    const requiredParam1 = ["username", "email", "password", "type", "profile_pic_url"];
    const requiredParam2 = ["username", "email", "password", "type"];
    const successValidation1 = utilities.validateReqBody(requiredParam1, req.body);
    const successValidation2 = utilities.validateReqBody(requiredParam2, req.body);

    if (!successValidation1 && !successValidation2) {
      res.status(400).send({ error: "Missing or empty request body parameter" });
    }

    else {
      // check if email exists
      const exist = await gameFunc.checkValue([req.body.email], "email", "users");

      if (exist) {
        res.status(422).send({ error: "Email already exists" });
      }

      else {
        // check type is either ("Customer" or "Admin")
        if (req.body.type !== "Customer" && req.body.type !== "Admin") {
          res.status(400).send({ error: "User type is not properly defined" });
        }
        else {
          // hash password
          const hashedPassword = await bcrypt.hash(req.body.password, 7);
          req.body.password = hashedPassword;

          const result = await gameFunc.createUser(req.body);
          res.status(201).send({ userid: result.insertId });
        }
      }
    }
  }

  catch (err) {
    utilities.logErrors(err, "Creating_user");
    res.status(500).send({ error: "Internal Server Error" });
  }
});


// ---------------------------------------------
// update user info*
app.put("/user/:userid", isLoggedInMiddleware, async (req, res) => {
  const requiredParamPass = ["username", "email", "password", "type"];
  const requiredParamNoPass = ["username", "email", "type"];
  const successValidationPass = utilities.validateReqBody(requiredParamPass, req.body);
  const successValidationNoPass = utilities.validateReqBody(requiredParamNoPass, req.body);

  if (!successValidationNoPass && !successValidationPass) {
    res.status(400).send({ error: "Missing or empty request body parameter" });
  }

  else {
    const userId = Number(req.params.userid);

    try {
      // check if user exists
      const userExist = await gameFunc.checkValue([userId], "user_id", "users");
      if (!userExist) {
        res.status(404).send({ error: "User not found" });
      }

      else {
        if (successValidationPass) {
          // hash password
          const hashedPassword = await bcrypt.hash(req.body.password, 7);
          req.body.password = hashedPassword;

          await gameFunc.updateUser(req.body, userId);
          res.status(200).send({ message: "User updated" });
        }

        else {
          await gameFunc.updateUser(req.body, userId);
          res.status(200).send({ message: "User updated" });
        }
      }
    }

    catch (error) {
      utilities.logErrors(error, "Updating_user");
      res.status(500).send({ error: "Internal Server Error" });
    }
  }
});


// ---------------------------------------------
// delete user*
app.delete("/user/:userid", isLoggedInMiddleware, async (req, res) => {
  const userRole = req.credentials.role;

  if (userRole != "Admin") {
    res.status(401).send({ error: "Insufficent permissions" });
  }

  else {
    const userId = Number(req.params.userid);
    try {
      // check if user exists
      const userExist = await gameFunc.checkValue([userId], "user_id", "users");
      if (!userExist) {
        res.status(404).send({ error: "User not found" });
      }

      else {
        await gameFunc.deleteUser(userId);
        res.status(200).send({ message: "User deleted" });
      }
    }

    catch (error) {
      utilities.logErrors(error, "Deleting_user");
      res.status(500).send({ error: "Internal Server Error" });
    }
  }
});


// ---------------------------------------------
// get user by username*
app.get("/users/:username", isLoggedInMiddleware, async (req, res) => {
  try {
    // get user based on id
    const result = await gameFunc.getUserByUsername(req.params.username);
    if (result.length < 1) {
      res.status(404).send({ error: "User not found" });
    }

    else {
      // show password
      if (req.credentials.role === "Admin") {
        res.status(200).send(result);
      }

      else {
        res.status(401).send({ error: "Insufficent permissions" });
      }
    }
  }

  catch (err) {
    utilities.logErrors(err, "Getting_specific_user");
    res.status(500).send({ error: "Internal Server Error" });
  }
});


// ---------------------------------------------
// get current user*
app.get("/user/self", isLoggedInMiddleware, async (req, res) => {
  const user_id = req.credentials.user_id;

  try {
    // get user based on id
    const result = await gameFunc.getUserById(user_id);
    if (result.length < 1) {
      res.status(404).send({ error: "User not found" });
    }

    else {
      res.status(200).send(result[0]);
    }
  }

  catch (err) {
    utilities.logErrors(err, "Getting_current_user");
    res.status(500).send({ error: "Internal Server Error" });
  }
});


// ---------------------------------------------
// create new category
app.post("/category", isLoggedInMiddleware, async (req, res) => {
  // creation requires Admin
  if (req.credentials.role === "Admin") {
    try {
      // validate user req body input
      const requiredParam = ["catname", "description"];
      const successValidation = utilities.validateReqBody(requiredParam, req.body);

      if (!successValidation) {
        res.status(400).send({ error: "Missing or empty request body parameter" });
      }

      else {
        // check if category name exists
        const exist = await gameFunc.checkValue([req.body.catname], "catname", "category");
        if (exist) {
          res.status(409).send({ error: "Category already exists" });
        }

        else {
          await gameFunc.createCategory(req.body);
          res.status(201).send();
        }
      }
    }

    catch (err) {
      utilities.logErrors(err, "Creating_category");
      res.status(500).send({ error: "Internal Server Error" });
    }
  }

  else {
    res.status(401).send({ error: "Insufficent permissions" });
  }
});


// ---------------------------------------------
// create new platform (edited to receive icon)*
app.post("/platform", isLoggedInMiddleware, async (req, res) => {
  // creation requires admin
  if (req.credentials.role === "Admin") {
    try {
      // validate user req body input
      const requiredParam = ["platform_name", "description", "platform_icon"];
      const successValidation = utilities.validateReqBody(requiredParam, req.body);

      if (!successValidation) {
        res.status(400).send({ error: "Missing or empty request body parameter" });
      }

      else {
        // check if plat exists
        const exist = await gameFunc.checkValue([req.body.platform_name], "platform_name", "platform");
        if (exist) {
          res.status(422).send({ error: "Platform already exists" });
        }

        else {
          await gameFunc.createPlatform(req.body);
          res.status(201).send();
        }
      }
    }

    catch (err) {
      utilities.logErrors(err, "Creating_platform");
      res.status(500).send({ error: "Internal Server Error" });
    }
  }

  else {
    res.status(401).send({ error: "Insufficent permissions" });
  }
});


// ---------------------------------------------
// get game by id (with platform)*
app.get("/specific/game/:id", async (req, res) => {
  try {
    const newVotes = await gameFunc.getVotes(req.params.id)
    const updateVote = await gameFunc.refreshVotes(req.params.id, newVotes)
    // get game based on id
    const result = await gameFunc.getGameById(req.params.id);
    if (result.length < 1) {
      res.status(404).send({ error: "Game not found" });
    }

    else {
      const gameWithPlatform = result.reduce((returnObj, current) => {
        const result = returnObj.find(item => item.game_id === current.game_id);

        if (result) {
          result.platform_id += ',' + current.platform_id;
          result.price += ',' + current.price;
          result.platform_name += ',' + current.platform_name;
          result.platform_icon += ',' + current.platform_icon;
        } else {
          returnObj.push({ ...current, price: [current.price] });
        }

        return returnObj;
      }, []);

      res.status(200).send(gameWithPlatform[0]);
    }
  }

  catch (err) {
    utilities.logErrors(err, "Getting_specific_game_id");
    res.status(500).send({ error: "Internal Server Error" });
  }
});


// ---------------------------------------------
// get game by id (with specific platform + all category)*
app.get("/specific/gameCategory/:id/:platform", async (req, res) => {
  try {
    const newVotes = await gameFunc.getVotes(req.params.id);
    const updateVote = await gameFunc.refreshVotes(req.params.id, newVotes);
    let platform;

    // check if platform is string or number
    if (isNaN(Number(req.params.platform))) {
      platform = req.params.platform;
    }

    else {
      platform = Number(req.params.platform);
    }
    // get game based on id
    const game = await gameFunc.getSpecificPlatGameById(req.params.id, platform);
    const gameCat = await gameFunc.getAllGamesCat();

    if (game.length < 1) {
      res.status(404).send({ error: "Game not found" });
    }

    else {
      const specificGame = game.map((gameDetails) => {
        // find matching categories
        const matchingCategories = gameCat
          // filter categories to only matching categories
          .filter((category) => category.title === gameDetails.title)
          .map((category) => category.catname);

        return {
          // return game with categories
          ...gameDetails,
          categories: matchingCategories.join(",")
        };
      });

      res.status(200).send(specificGame[0]);
    }
  }

  catch (err) {
    utilities.logErrors(err, "Getting_specific_game_id_with_platform");
    res.status(500).send({ error: "Internal Server Error" });
  }
});


// ---------------------------------------------
// get all games with category and platform*
app.get("/game/platform/category", async (req, res) => {
  try {
    const newVotes = await gameFunc.getVotes(req.params.id);
    const updateVote = await gameFunc.refreshVotes(req.params.id, newVotes);

    const allGamesPlat = await gameFunc.getAllGamesPlat();
    const allGamesCat = await gameFunc.getAllGamesCat();

    // Combine the arrays
    // map through each game (currently no categories)
    const allGames = allGamesPlat.map((game) => {
      // find matching categories
      const matchingCategories = allGamesCat
        // filter categories to only matching categories
        .filter((category) => category.title === game.title)
        .map((category) => category.catname);

      return {
        // return game with categories
        ...game,
        categories: matchingCategories.join(", ")
      };
    });

    res.status(200).send(allGames);
  }

  catch (err) {
    utilities.logErrors(err, "Getting_all_games");
    res.status(500).send({ error: "Internal Server Error" });
  }
});


// ---------------------------------------------
// get all games without category and platform
app.get("/game", async (req, res) => {
  try {
    const newVotes = await gameFunc.getVotes(req.params.id)
    const updateVote = await gameFunc.refreshVotes(req.params.id, newVotes)

    const result = await gameFunc.getAllGames();
    res.status(200).send(result);
  }

  catch (err) {
    utilities.logErrors(err, "Getting_all_games");
    res.status(500).send({ error: "Internal Server Error" });
  }
});


// ---------------------------------------------
// get all exisiting categories*
app.get("/category", async (req, res) => {
  try {
    const result = await gameFunc.getAllCategories();
    res.status(200).send(result);
  }

  catch (err) {
    utilities.logErrors(err, "Getting_categories");
    res.status(500).send({ error: "Internal Server Error" });
  }
});


// ---------------------------------------------
// get all existing platforms*
app.get("/platform", async (req, res) => {
  // general public (dont need to be logged in)
  try {
    const result = await gameFunc.getAllPlatforms();
    res.status(200).send(result);
  }

  catch (err) {
    utilities.logErrors(err, "Getting_platforms");
    res.status(500).send({ error: "Internal Server Error" });
  }
});


// ---------------------------------------------
// Retrieve all games from certain platform
app.get("/game/:platform", async (req, res) => {
  // general public (dont need to be logged in)
  try {
    const newVotes = await gameFunc.getVotes(req.params.id)
    const updateVote = await gameFunc.refreshVotes(req.params.id, newVotes)

    let returnData = [];
    const gamesFromPlat = await gameFunc.getGamesFromPlatform(req.params.platform);

    // check for empty array (whether game exist or not)
    if (gamesFromPlat.length < 1) {
      res.status(404).send({ error: "Platform or game data not found" });
    }

    else {
      for (let i = 0; i < gamesFromPlat.length; i++) {
        // get catid and catname
        let catidArr = [];
        let catnameArr = [];

        // fill up both arrays with data obtained
        const catData = await gameFunc.getCategoryFromGameId(gamesFromPlat[i].game_id);
        catData.forEach((obj) => {
          catidArr.push(obj.category_id);
          catnameArr.push(obj.catname);
        });

        // create new obj in returnData for each entry
        returnData.push({
          game_id: gamesFromPlat[i].game_id,
          title: gamesFromPlat[i].title,
          description: gamesFromPlat[i].description,
          price: gamesFromPlat[i].price,
          platform: gamesFromPlat[i].platform_name,
          catid: catidArr.join(", "),
          catname: catnameArr.join(", "),
          year: gamesFromPlat[i].year,
          created_at: gamesFromPlat[i].created_at,
        });
      }

      res.status(200).send(returnData);
    }
  }

  catch (err) {
    utilities.logErrors(err, "Retrieving_all_games");
    res.status(500).send({ error: "Internal Server Error" });
  }
});


// ---------------------------------------------
// Delete game based on id
app.delete("/game/:id", isLoggedInMiddleware, async (req, res) => {
  // delete game (admin only)
  if (req.credentials.role === "Admin") {
    const game_id = Number(req.params.id);

    try {
      // check if game_id exists
      const exist = await gameFunc.checkValue([game_id], "game_id", "games");
      if (!exist) {
        res.status(404).send({ error: "Game associated with game_id not found" });
      }

      else {
        // del image from local directory folder
        const result = await gameFunc.getGameImgName(game_id);
        if (result[0].img_name !== null && result[0].img_name !== "image-not-found.jpg") {
          fs.unlinkSync(`${__dirname}\\..\\public\\gameImage\\${result[0].img_name}`);
        }

        // del all game data from database
        await gameFunc.delGame(game_id);

        res.status(204).send();
      }
    }

    catch (err) {
      utilities.logErrors(err, "Deleting_game");
      res.status(500).send({ error: "Internal Server Error" });
    }
  }

  else {
    res.status(401).send({ error: "Insufficient permissions" });
  }
});


// ---------------------------------------------
// update game listing
app.put("/game/:id", isLoggedInMiddleware, async (req, res) => {
  // update game (admin only)
  if (req.credentials.role === "Admin") {
    // save some data from req to determine which func to use
    const game_id = Number(req.params.id);
    const newGameData = req.body;

    // validate user request body input
    const requiredParam = ["title", "description", "price", "platformid", "categoryid", "year"];
    const successValidation = utilities.validateReqBody(requiredParam, newGameData);

    if (!successValidation) {
      res.status(400).send({ error: "Missing or empty request body parameter" });
    }

    else {
      // check if there is only 1 price, platid, catid
      let tmpPrice = newGameData.price;
      let tmpPlatid = newGameData.platformid;
      let tmpCatid = newGameData.categoryid;
      let priceArr = [];
      let platidArr = [];
      let catidArr = [];

      // check if there is only 1 price, platid, catid
      // price
      if (Number(tmpPrice)) {
        // convert to array
        priceArr = [Number(tmpPrice)];
      } else {
        // save price, platid, catid to array as Number
        priceArr = newGameData.price.split(",").map(Number);
      }

      // platid
      if (Number(tmpPlatid)) {
        // convert to array
        platidArr = [Number(tmpPlatid)];
      } else {
        platidArr = newGameData.platformid.split(",").map(Number);

      }

      // catid
      if (Number(tmpCatid)) {
        // convert to array
        catidArr = [Number(tmpCatid)];
      } else {
        catidArr = newGameData.categoryid.split(",").map(Number);
      }


      // validate price, platid, catid is number
      const priceCheck = priceArr.every(price => !Number.isNaN(price) && price >= 0);
      const platCheck = platidArr.every(plat => Number.isInteger(plat));
      const catCheck = catidArr.every(cat => Number.isInteger(cat));

      if (!priceCheck || !platCheck || !catCheck) {
        res.status(422).send({ error: "Invalid price or platformid or categoryid" });
      }

      else if (priceArr.length != platidArr.length) {
        res.status(422).send({ error: "Invalid price or platformid length" });
      }

      else {
        try {
          // check if game_id exists
          const exist = await gameFunc.checkValue([game_id], "game_id", "games");
          if (!exist) {
            res.status(404).send({ error: "Game not found" });
          }

          else {
            // get obj of price id and gc id of game (before update)
            const priceId = await gameFunc.getPriceIdOfGame(game_id);
            const gcId = await gameFunc.getGCIdOfGame(game_id);

            // put into array
            let oldPriceIdArr = priceId.map(obj => obj.price_id);
            let oldGCIdArr = gcId.map(obj => obj.game_category_id);

            // check if platformids and catids exist
            const platExist = await gameFunc.checkValue([...platidArr], "platform_id", "platform");
            const catExist = await gameFunc.checkValue([...catidArr], "category_id", "category");

            if (!platExist || !catExist) {
              res.status(404).send({ error: "Platformid or categoryid not found" });
            }

            else {
              // check if new num of price/platid equal to old num of price/platid in game (determines if can just update or need to del/insert)
              // checking based on priceid and gcid

              // update game (since no check is needed for game table update)
              // check year is valid
              // check if year is between 1970 to current year
              if (Number(newGameData.year) < 1970 || Number(newGameData.year) > new Date().getFullYear()) {
                res.status(422).send({ error: "Invalid year" });
              }
              else {
                await gameFunc.updateGame(game_id, newGameData);


                // -------------------------------------------------------------------------------------------------
                // checking price
                if (oldPriceIdArr.length === priceArr.length) {
                  // update price
                  for (let i = 0; i < priceArr.length; i++) {
                    await gameFunc.updatePrice(oldPriceIdArr[i], { game_id: game_id, price: priceArr[i], platform_id: platidArr[i] });
                  }
                }

                // del row then update
                else if (oldPriceIdArr.length > priceArr.length) {
                  const numToDel = oldPriceIdArr.length - priceArr.length;

                  for (let i = 0; i < numToDel; i++) {
                    // dont need to delete specific price_ids, since will update all
                    await gameFunc.delPrice(oldPriceIdArr[i]);
                    // remove deleted priceid from arr so that wont use deleted priceid to update later
                    oldPriceIdArr.splice(i, 1);
                  }

                  // update price
                  for (let i = 0; i < priceArr.length; i++) {
                    await gameFunc.updatePrice(oldPriceIdArr[i], { game_id: game_id, price: priceArr[i], platform_id: platidArr[i] });
                  }
                }

                // add row then update
                else if (oldPriceIdArr.length < priceArr.length) {
                  const numToAdd = priceArr.length - oldPriceIdArr.length;

                  for (let i = 0; i < numToAdd; i++) {
                    // can add any value since will update later
                    const result = await gameFunc.createPrice({ game_id: game_id, price: priceArr[i], platform_id: platidArr[i] });
                    // append new price_id to priceidarr
                    oldPriceIdArr.push(result.insertId);
                  }

                  // update price
                  for (let i = 0; i < priceArr.length; i++) {
                    await gameFunc.updatePrice(oldPriceIdArr[i], { game_id: game_id, price: priceArr[i], platform_id: platidArr[i] });
                  }
                }

                // -------------------------------------------------------------------------------------------------
                // checking game_category
                if (oldGCIdArr.length === catidArr.length) {
                  // update game_category
                  for (let i = 0; i < catidArr.length; i++) {
                    await gameFunc.updateGC(oldGCIdArr[i], { game_id: game_id, category_id: catidArr[i] });
                  }
                }

                // del row then update
                else if (oldGCIdArr.length > catidArr.length) {
                  const numToDel = oldGCIdArr.length - catidArr.length;

                  for (let i = 0; i < numToDel; i++) {
                    // dont need to delete specific gcid, since will update all
                    await gameFunc.delGC(oldGCIdArr[i]);
                    // remove deleted gcid from arr so that wont use deleted gcid to update later
                    oldGCIdArr.splice(i, 1);
                  }

                  // update gc
                  for (let i = 0; i < catidArr.length; i++) {
                    await gameFunc.updateGC(oldGCIdArr[i], { game_id: game_id, category_id: catidArr[i] });
                  }
                }

                // add row then update
                else if (oldGCIdArr.length < catidArr.length) {
                  const numToAdd = catidArr.length - oldGCIdArr.length;

                  for (let i = 0; i < numToAdd; i++) {
                    // can add any value since will update later
                    const result = await gameFunc.createGameCategory({ game_id: game_id, category_id: catidArr[i] });
                    // append new gcid to gcidarr
                    oldGCIdArr.push(result.insertId);
                  }

                  // update gc
                  for (let i = 0; i < catidArr.length; i++) {
                    await gameFunc.updateGC(oldGCIdArr[i], { game_id: game_id, category_id: catidArr[i] });
                  }
                }
                res.status(204).send();
              }
            }
          }
        }

        catch (err) {
          utilities.logErrors(err, "Updating_game");
          res.status(500).send({ error: "Internal Server Error" });
        }
      }
    }
  }

  else {
    res.status(401).send({ error: "Insufficient permissions" });
  }
});


// ---------------------------------------------
// add review (voting > adv feat)
app.post("/user/:uid/game/:gid/review", isLoggedInMiddleware, async (req, res) => {
  // add review (for logged in users only)
  const uid = Number(req.params.uid);
  const gid = Number(req.params.gid);

  try {
    // validating request body of input from user (one for no vote, one for vote)
    const requiredParam1 = ["content", "rating"];
    const requiredParam2 = ["content", "rating", "vote"];

    const successValidation1 = utilities.validateReqBody(requiredParam1, req.body);
    const successValidation2 = utilities.validateReqBody(requiredParam2, req.body);

    if (!successValidation1 && !successValidation2) {
      res.status(422).send({ error: "Missing or empty request body parameter" });
    }

    else {
      // check if uid and gid exist
      const userExist = await gameFunc.checkValue([uid], "user_id", "users");
      const gameExist = await gameFunc.checkValue([gid], "game_id", "games");
      const rating = Number(req.body.rating);

      if (!userExist || !gameExist) {
        res.status(404).send({ error: "User or game not found" });
      }

      // check if rating is between 0 to 5
      else if (!(rating > -1 && rating < 6) || !Number.isInteger(rating)) {
        res.status(400).send({ error: "Invalid rating" });
      }

      else {
        // check if user has voted on this game or not (adv feat)
        if (successValidation1) {
          const result = await gameFunc.createReview(uid, gid, req.body);
          res.status(201).send({ reviewid: result.insertId });
        }

        // safe to use else since only one, either successValidation1 or successValidation2, can be true at this point in error
        else {
          let vote = Number(req.body.vote)

          // check if vote is either -1, 0 or 1
          if (!(vote > -2 && vote < 2) || !Number.isInteger(vote)) {
            res.status(400).send({ error: "Invalid vote value" });
          }

          else {
            const result = await gameFunc.createReviewVote(uid, gid, req.body);
            // refresh votes on games table
            const totalVotes = await gameFunc.getVotes(gid);
            await gameFunc.refreshVotes(gid, totalVotes);
            res.status(201).send({ reviewid: result.insertId });
          }
        }
      }
    }
  }

  catch (err) {
    utilities.logErrors(err, "Creating_review");
    res.status(500).send({ error: "Internal Server Error" });
  }
});


// ---------------------------------------------
// get reviews of specific game
app.get("/game/:id/review", async (req, res) => {
  // general public can view reviews of specific game
  const game_id = Number(req.params.id);
  // const returnObj = [];

  try {
    // check if gameid exists
    const exist = await gameFunc.checkValue([game_id], "game_id", "games");
    if (!exist) {
      res.status(404).send({ error: "Game not found" });
    }

    else {
      // get all reviews of specific game
      const reviewResult = await gameFunc.getReview(game_id);

      const newVotes = await gameFunc.getVotes(req.params.id)
      const updateVote = await gameFunc.refreshVotes(req.params.id, newVotes)

      // append totalVotes for the game to returnObj
      // returnObj.push({ totalVotes: totalVotes }); // adv feat (votes)
      // returnObj.push(reviewResult);
      // res.status(200).send(returnObj);
      res.status(200).send(reviewResult);
    }
  }

  catch (err) {
    utilities.logErrors(err, "Getting_reviews");
    res.status(500).send({ error: "Internal Server Error" });
  }
});


// ---------------------------------------------
// add new game to DB 
app.post("/game", isLoggedInMiddleware, async (req, res) => {
  // creation requires admin
  if (req.credentials.role === "Admin") {
    upload(req, res, async (err) => {
      const userObj = req.body;

      // check for any multer errors
      if (err instanceof multer.MulterError) {
        // exceed file limit
        if (err.error === "LIMIT_FILE_SIZE") {
          console.log("File size too big");
          res.status(400).send({ error: "Invalid file size" });
        }

        // key name is not "img_name"
        else if (err.error === "LIMIT_UNEXPECTED_FILE") {
          console.log("Invalid key");
          res.status(400).send({ error: "Invalid key name" });
        }
      }

      // any other errors
      else if (err) {
        if (err.message === "Image only") {
          res.status(400).send({ error: "Only images allowed" });
        }

        else {
          utilities.logErrors(err, "Creating_new_game");
          res.status(500).send({ error: "Internal Server Error" });
        }
      }

      else {
        // ================== TRY BLOCK FOR IMAGE ==================
        try {
          // initialize img_name
          const img_name = req.file.filename;
          userObj.img_name = img_name;
          // validating request body of input from user
          const requiredParam = ["title", "description", "price", "platformid", "categoryid", "year", "img_name"];
          const successValidation = utilities.validateReqBody(requiredParam, userObj);

          if (!successValidation) {
            res.status(400).send({ error: "Missing or empty request body parameter" });
          }

          else {
            // img_name param was populated (only needed for postman, however, not needed for frontend)
            if (req.file == undefined) {
              res.status(400).send({ error: "No file selected" });
            }

            else {
              try {
                // check if game title exists
                const exist = await gameFunc.checkValue([req.body.title], "title", "games");
                if (exist) {
                  fs.unlinkSync(`${__dirname}\\..\\public\\gameImage\\${img_name}`);
                  res.status(422).send({ error: "Game already exists" });
                }

                // check if year is between 1970 to current year
                else if (req.body.year < 1970 || req.body.year > new Date().getFullYear()) {
                  fs.unlinkSync(`${__dirname}\\..\\public\\gameImage\\${img_name}`);
                  res.status(422).send({ error: "Invalid year" });
                }

                else {
                  // check if there is only 1 price, platid, catid
                  let tmpPrice = userObj.price;
                  let tmpPlatid = userObj.platformid;
                  let tmpCatid = userObj.categoryid;
                  let priceArr = [];
                  let platidArr = [];
                  let catidArr = [];

                  // check if there is only 1 price, platid, catid
                  // price
                  if (Number(tmpPrice)) {
                    // convert to array
                    priceArr = [Number(tmpPrice)];
                  } else {
                    // save price, platid, catid to array as Number
                    priceArr = userObj.price.split(",").map(Number);
                  }

                  // platid
                  if (Number(tmpPlatid)) {
                    // convert to array
                    platidArr = [Number(tmpPlatid)];
                  } else {
                    platidArr = userObj.platformid.split(",").map(Number);

                  }

                  // catid
                  if (Number(tmpCatid)) {
                    // convert to array
                    catidArr = [Number(tmpCatid)];
                  } else {
                    catidArr = userObj.categoryid.split(",").map(Number);
                  }

                  // validate price, platid, catid is number
                  const priceCheck = priceArr.every(price => !Number.isNaN(price) && price > 0);
                  const platCheck = platidArr.every(plat => Number.isInteger(plat));
                  const catCheck = catidArr.every(cat => Number.isInteger(cat));

                  // since img already uploaded, if any errors, need to del img
                  if (!priceCheck || !platCheck || !catCheck) {
                    fs.unlinkSync(`${__dirname}\\..\\public\\gameImage\\${img_name}`);
                    res.status(422).send({ error: "Invalid price or platformid or categoryid" });
                  }

                  else if (priceArr.length != platidArr.length) {
                    fs.unlinkSync(`${__dirname}\\..\\public\\gameImage\\${img_name}`);
                    res.status(422).send({ error: "Invalid price or platformid length" });
                  }

                  else {
                    // create game
                    const gameResult = await gameFunc.createGame(userObj);
                    const game_id = gameResult.insertId;

                    // create price
                    for (let i = 0; i < priceArr.length; i++) {
                      // making price object to insert into table
                      let priceObj = {};
                      priceObj.game_id = game_id;
                      priceObj.price = priceArr[i];
                      priceObj.platform_id = platidArr[i];

                      await gameFunc.createPrice(priceObj);
                    }

                    // create category
                    for (let i = 0; i < catidArr.length; i++) {
                      let categoryObj = {};
                      categoryObj.game_id = game_id;
                      categoryObj.category_id = catidArr[i];

                      await gameFunc.createGameCategory(categoryObj);
                    }

                    res.status(201).send({ gameid: game_id });
                  }
                }
              }

              catch (err) {
                utilities.logErrors(err, "Uploading_image");
                // need to delete the img that was uploaded
                fs.unlinkSync(`${__dirname}\\..\\public\\gameImage\\${img_name}`);
                res.status(500).send({ error: "Internal Server Error" });
              }
            }
          }
        }

        // ================== CATCH BLOCK FOR NO IMAGE ==================
        catch {
          // validating request body of input from user
          const requiredParam = ["title", "description", "price", "platformid", "categoryid", "year"];
          const successValidation = utilities.validateReqBody(requiredParam, userObj);

          if (!successValidation) {
            res.status(400).send({ error: "Missing or empty request body parameter" });
          }

          else {
            try {
              // check if game title exists
              const exist = await gameFunc.checkValue([req.body.title], "title", "games");
              if (exist) {
                res.status(422).send({ error: "Game already exists" });
              }

              // check if year is between 1970 to current year
              else if (req.body.year < 1970 || req.body.year > new Date().getFullYear()) {
                res.status(422).send({ error: "Invalid year" });
              }

              else {
                // check if there is only 1 price, platid, catid
                let tmpPrice = userObj.price;
                let tmpPlatid = userObj.platformid;
                let tmpCatid = userObj.categoryid;
                let priceArr = [];
                let platidArr = [];
                let catidArr = [];

                // check if there is only 1 price, platid, catid
                // price
                if (Number(tmpPrice)) {
                  // convert to array
                  priceArr = [Number(tmpPrice)];
                } else {
                  // save price, platid, catid to array as Number
                  priceArr = userObj.price.split(",").map(Number);
                }

                // platid
                if (Number(tmpPlatid)) {
                  // convert to array
                  platidArr = [Number(tmpPlatid)];
                } else {
                  platidArr = userObj.platformid.split(",").map(Number);

                }

                // catid
                if (Number(tmpCatid)) {
                  // convert to array
                  catidArr = [Number(tmpCatid)];
                } else {
                  catidArr = userObj.categoryid.split(",").map(Number);
                }

                if (priceArr.length != platidArr.length) {
                  res.status(422).send({ error: "Invalid price or platformid length" });
                }

                else {
                  // create game
                  req.body.img_name = null; // need to add this key to userObj since it's not in requiredParam
                  const gameResult = await gameFunc.createGame(req.body);
                  const game_id = gameResult.insertId;

                  // create price
                  for (let i = 0; i < priceArr.length; i++) {
                    // making price object to insert into table
                    let priceObj = {};
                    priceObj.game_id = game_id;
                    priceObj.price = priceArr[i];
                    priceObj.platform_id = platidArr[i];

                    await gameFunc.createPrice(priceObj);
                  }

                  // create category
                  for (let i = 0; i < catidArr.length; i++) {
                    let categoryObj = {};
                    categoryObj.game_id = game_id;
                    categoryObj.category_id = catidArr[i];

                    await gameFunc.createGameCategory(categoryObj);
                  }

                  res.status(201).send({ gameid: game_id });
                }
              }
            }
            catch (err) {
              utilities.logErrors(err, "Creating_new_game");
              res.status(500).send({ error: "Internal Server Error" });
            }
          }
        }
      }
    });
  }

  else {
    res.status(401).send({ error: "Insufficient permissions" });
  }
});


// ---------------------------------------------
// get game by game title
app.get("/gameid/:title", async (req, res) => {
  const gameTitle = req.params.title.replaceAll("-", " ");
  try {
    // check if game title exists
    const exist = await gameFunc.checkValue([gameTitle], "title", "games");
    if (!exist) {
      res.status(404).send({ error: "Game not found" });
    }

    else {
      const gameResult = await gameFunc.getGameIdByTitle(gameTitle);
      res.status(200).send({ game_id: gameResult });
    }
  }

  catch (error) {
    utilities.logErrors(error, "Getting_game_by_title");
    res.status(500).send({ error: "Internal Server Error" });
  }
});


// ---------------------------------------------
// Adv feat - Uploading and retrieval of games with img
// uploading img (use put as this api is meant to upload an image for an already existing user in database)
app.put("/game/:id/image", isLoggedInMiddleware, async (req, res) => {
  // only admin can upload image
  if (req.credentials.role === "Admin") {
    const game_id = Number(req.params.id);

    upload(req, res, async (err) => {
      // multer related errors
      if (err instanceof multer.MulterError) {
        // file size too big
        if (err.error === "LIMIT_FILE_SIZE") {
          res.status(400).send({ error: "Invalid file size" });
        }

        // key is not "img_name"
        else if (err.error === "LIMIT_UNEXPECTED_FILE") {
          console.log("Invalid key");
          res.status(400).send({ error: "Invalid key name" });
        }
      }

      else if (err) {
        // file is not jpg/jpeg/png/gif
        if (err.message === "Image only") {
          res.status(400).send({ error: "Only images allowed" });
        }

        else {
          // other errors
          utilities.logErrors(err, "Uploading_image");
          res.status(500).send({ error: "Error uploading image" });
        }
      }

      else {
        if (req.file == undefined) {
          res.status(400).send({ error: "No file selected" });
        }

        else {
          const img_name = req.file.filename;

          try {
            // check if gameid exists
            const exist = await gameFunc.checkValue([game_id], "game_id", "games");

            if (!exist) {
              // del img file if game does not exist
              fs.unlinkSync(`${__dirname}\\..\\public\\gameImage\\${img_name}`);
              res.status(404).send({ error: "Game not found" });
            }

            else {
              await gameFunc.uploadImg(game_id, img_name);
              res.status(204).send();
            }
          }

          catch (err) {
            utilities.logErrors(err, "Uploading_image");
            // need to delete the img that was uploaded since have error
            fs.unlinkSync(`${__dirname}\\..\\public\\gameImage\\${img_name}`);
            res.status(500).send({ error: "Internal Server Error" });
          }
        }
      }
    });
  }

  else {
    res.status(401).send({ error: "Insufficient permission" });
  }
});


app.get("/game/:id/image", async (req, res) => {
  // general public can view image of specific game
  const game_id = Number(req.params.id);

  try {
    // check if gameid exists
    const exist = await gameFunc.checkValue([game_id], "game_id", "games");
    if (!exist) {
      res.status(404).send({ error: "Game not found" });
    }

    else {
      // get image name from database
      const result = await gameFunc.getGameImgName(game_id);
      const img_name = result[0].img_name;

      if (img_name === null) {
        res.status(404).send({ error: "No image associated with game_id" });
      }

      else {
        const filePath = `${__dirname}\\..\\public\\gameImage\\${img_name}`;

        res.sendFile(filePath, (err) => {
          if (err) {
            utilities.logErrors(err, "Sending_file");
            res.status(500).send({ error: "Internal Server Error" });
          }
        });
      }
    }
  }

  catch (err) {
    utilities.logErrors(err, "Retrieving_image");
    res.status(500).send({ error: "Internal Server Error" });
  }
});



// ==================================================================
// ADVANCED FEATURE: CART
// ==================================================================

// ---------------------------------------------
// api to get user cart status (if user already has a cart and its status)
app.get("/cart", isLoggedInMiddleware, async (req, res) => {
  const user_id = Number(req.credentials.user_id);

  try {
    const result = await gameFunc.getCartStatus(user_id);
    res.status(200).send(result);
  }

  catch (error) {
    utilities.logErrors(error, "Getting_cart_status");
    res.status(500).send({ error: "Internal Server Error" });
  }
});


// ---------------------------------------------
// add to cart (for creating a cart ONLY)
app.post("/cart", isLoggedInMiddleware, async (req, res) => {
  const requiredParam = ["game_id", "quantity", "platform_id"];
  const successValidation = utilities.validateReqBody(requiredParam, req.body);

  if (!successValidation) {
    res.status(400).send({ error: "Missing or empty request body parameter" });
  }

  else {
    const game_id = Number(req.body.game_id);
    const platform_id = Number(req.body.platform_id);
    const quantity = Number(req.body.quantity);
    const user_id = Number(req.credentials.user_id);

    // validate request body parameter
    if (!Number.isInteger(quantity) || !Number.isInteger(game_id) || !Number.isInteger(platform_id) || quantity < 0 || game_id <= 0 || platform_id <= 0) {
      res.status(400).send({ error: "Invalid request body parameter" });
    }

    try {
      // check if game_id and platform_id exists
      const gameExist = await gameFunc.checkValue([game_id], "game_id", "games");
      const platExist = await gameFunc.checkValue([platform_id], "platform_id", "platform");
      if (!gameExist || !platExist) {
        res.status(404).send({ error: "Game/Platform not found" });
      }

      else {
        // check if user has a cart with checkout status of false
        const allUserCartStatus = await gameFunc.getCartStatus(user_id);
        // look for cart with checkout status of false
        const currentCartStatusArr = allUserCartStatus.filter(cartStatus => cartStatus.checkout === 0);

        // if user has no cart with checkout status of false, create a new cart
        if (currentCartStatusArr.length === 0) {
          // create new cart
          // status set to false since user does not have cart and has not checked out
          const newCart = await gameFunc.updateStatus(null, user_id, false);
          const cart_id = newCart.insertId;


          // add to cart
          await gameFunc.addToCart(game_id, platform_id, quantity, cart_id);

          res.status(201).send({ message: "Created and added to cart" });
        }

        // user has cart with checkout status of false, send error since this api is only for creating a cart 
        // (considered status 500 since user should not be able to add to cart, for this api, if they already have 
        // a cart with checkout status of false)
        else {
          const error = new Error("User already has a cart with checkout status of false, use update cart api instead");
          utilities.logErrors(error, "Adding_to_cart");
          res.status(500).send({ error: "Internal Server Error" });
        }
      }
    }

    catch (error) {
      utilities.logErrors(error, "Adding_to_cart");
      res.status(500).send({ error: "Internal Server Error" });
    }
  }
});


// ---------------------------------------------
// update cart (for updating an existing cart, will assume that there is only 1 user cart with a checkout status of false)
app.put("/cart/:cartid", isLoggedInMiddleware, async (req, res) => {
  const requiredParam = ["game_id", "quantity", "platform_id"];
  const successValidation = utilities.validateReqBody(requiredParam, req.body);

  if (!successValidation) {
    res.status(400).send({ error: "Missing or empty request body parameter" });
  }

  else {
    const user_id = req.credentials.user_id;
    const game_id = Number(req.body.game_id);
    const platform_id = Number(req.body.platform_id);
    const quantity = Number(req.body.quantity);
    const cart_id = Number(req.params.cartid);

    // validate request body parameter
    if (!Number.isInteger(quantity) ||
      !Number.isInteger(cart_id) ||
      !Number.isInteger(game_id) ||
      !Number.isInteger(platform_id) ||
      quantity < 0 || cart_id <= 0 || game_id <= 0 || platform_id <= 0
    ) {
      res.status(400).send({ error: "Invalid request body parameter" });
    }

    else {
      try {
        // check if game_id and cart_id exists
        const gameExist = await gameFunc.checkValue([game_id], "game_id", "games");
        const cartExist = await gameFunc.checkValue([cart_id], "cart_id", "cart_status");
        const platExist = await gameFunc.checkValue([platform_id], "platform_id", "platform");
        if (!gameExist || !cartExist || !platExist) {
          res.status(404).send({ error: "Game/Cart not found" });
        }

        else {
          // get current cart data
          const currentCartData = await gameFunc.getCartData(cart_id);

          // filter to see if game_id already exists in cart
          const cartDataOfGame = currentCartData.filter(cartData => cartData.game_id === game_id && cartData.platform_id === platform_id);

          // if game already exists in cart, update quantity with sum of current quantity and new quantity
          if (cartDataOfGame.length !== 0) {
            await gameFunc.updateCart(game_id, platform_id, quantity, cart_id);
            res.status(204).send();
          }

          // if game does not exist in cart, add game to cart
          else {
            await gameFunc.addToCart(game_id, platform_id, quantity, cart_id);
            res.status(204).send();
          }
        }
      }

      catch (error) {
        utilities.logErrors(error, "Updating_cart");
        res.status(500).send({ error: "Internal Server Error" });
      }
    }
  }
});


// ---------------------------------------------
// delete item from cart
app.delete("/cart/:cartid", isLoggedInMiddleware, async (req, res) => {
  const requiredParam = ["game_id", "platform_id"];
  const successValidation = utilities.validateReqBody(requiredParam, req.body);

  if (!successValidation) {
    res.status(400).send({ error: "Missing or empty request body parameter" });
  }

  else {
    const user_id = req.credentials.user_id;
    const game_id = Number(req.body.game_id);
    const platform_id = Number(req.body.platform_id);
    const cart_id = Number(req.params.cartid);

    // validate request body parameter
    if (!Number.isInteger(cart_id) ||
      !Number.isInteger(game_id) ||
      !Number.isInteger(platform_id) ||
      cart_id <= 0 || game_id <= 0 || platform_id <= 0
    ) {
      res.status(400).send({ error: "Invalid request body parameter" });
    }

    else {
      try {
        await gameFunc.deleteCartItem(game_id, platform_id, cart_id);
        res.status(204).send();
      }

      catch (error) {
        utilities.logErrors(error, "Deleting_from_cart");
        res.status(500).send({ error: "Internal Server Error" });
      }
    }
  }
});


// ---------------------------------------------
// retrieve items from cart
app.get("/cart/:cartid", isLoggedInMiddleware, async (req, res) => {
  const cart_id = Number(req.params.cartid);

  if (!Number.isInteger(cart_id) || cart_id <= 0) {
    res.status(400).send({ error: "Invalid cart id" });
  }

  else {
    try {
      // check if card_id exists
      const cartExist = await gameFunc.checkValue([cart_id], "cart_id", "cart_status");
      if (!cartExist) {
        res.status(404).send({ error: "Cart not found" });
      }

      else {
        const cartData = await gameFunc.getCartData(cart_id);

        res.status(200).send(cartData);
      }
    }

    catch (error) {
      utilities.logErrors(error, "Updating_cart");
      res.status(500).send({ error: "Internal Server Error" });
    }
  }
});


// ---------------------------------------------
// checkout cart (set checkout status to true)
app.put("/cart/:cartid/checkout", isLoggedInMiddleware, async (req, res) => {
  const cart_id = Number(req.params.cartid);

  if (!Number.isInteger(cart_id) || cart_id <= 0) {
    res.status(400).send({ error: "Invalid cart id" });
  }

  else {
    try {
      // check if card_id exists
      const cartExist = await gameFunc.checkValue([cart_id], "cart_id", "cart_status");
      if (!cartExist) {
        res.status(404).send({ error: "Cart not found" });
      }

      else {
        await gameFunc.updateStatus(cart_id, null, true);
        res.status(204).send();
      }
    }

    catch (error) {
      utilities.logErrors(error, "Updating_cart");
      res.status(500).send({ error: "Internal Server Error" });
    }
  }
});


// ---------------------------------------------
// save card details
app.post("/card", isLoggedInMiddleware, async (req, res) => {
  const requiredParam = ["card_number", "card_name", "card_expiry"];
  const successValidation = utilities.validateReqBody(requiredParam, req.body);

  if (!successValidation) {
    res.status(400).send({ error: "Missing or empty request body parameter" });
  }

  else {
    const user_id = req.credentials.user_id;
    const card_number = Number(req.body.card_number.replaceAll(" ", ""));
    const card_name = req.body.card_name;
    const card_expiry = req.body.card_expiry;

    // validate request body parameter
    if (!Number.isInteger(user_id) ||
      !Number.isInteger(card_number) ||
      user_id <= 0 || card_number <= 0
    ) {
      res.status(400).send({ error: "Invalid request body parameter" });
    }

    else {
      try {
        await gameFunc.saveCardDetails(user_id, card_number, card_name, card_expiry);
        res.status(204).send();
      }

      catch (error) {
        utilities.logErrors(error, "Saving_card_details");
        res.status(500).send({ error: "Internal Server Error" });
      }
    }
  }
});


// ---------------------------------------------
// retrieve card details
app.get("/card", isLoggedInMiddleware, async (req, res) => {
  const user_id = req.credentials.user_id;

  if (!Number.isInteger(user_id) || user_id <= 0) {
    res.status(400).send({ error: "Invalid user id" });
  }

  else {
    try {
      const cardData = await gameFunc.getCardDetails(user_id);

      res.status(200).send(cardData);
    }

    catch (error) {
      utilities.logErrors(error, "Retrieving_card_details");
      res.status(500).send({ error: "Internal Server Error" });
    }
  }
});


// ---------------------------------------------
// delete card details
app.delete("/card", isLoggedInMiddleware, async (req, res) => {
  const user_id = req.credentials.user_id;

  try {
    await gameFunc.deleteCardDetails(user_id);
    res.status(204).send();
  }

  catch (error) {
    utilities.logErrors(error, "Deleting_card_details");
    res.status(500).send({ error: "Internal Server Error" });
  }
});


module.exports = app;