// Admission num: P2205711
// Name:          Reuben Goh
// Class:         DISM2A03

// model layer code to interact with database to fetch or modify data
const dbConnect = require('./dbConnect.js');
const util = require("util");

const gameFunc = {};

// ------------------------------
// Utility
// ------------------------------
/**
 * 
 * @param {Array} columnValue array containing values to check if they exist in specified sql database or not
 * @param {String} column column of table to check columnValue from (can receive multiple columns, e.g. string passed in = "column1, column2")
 * @param {String} table table name where column is located in\
 * @returns {*} returns either "err" or "exists" which contains boolean of whether value exists or not
 */
gameFunc.checkValue = async (columnValue, column, table) => {
  let conn = dbConnect.getConnection();
  let sqlStatement = `SELECT ${column} FROM ${table};`;
  let connQuery = util.promisify(conn.query).bind(conn);

  try {
    const result = await connQuery(sqlStatement, []);

    // dumps all received values into an array
    let columnValuesArray = result.flatMap(row => {
      return column.split(',').map(column => String(row[column.trim()]).toLowerCase());
    });

    columnValue = columnValue.map(value => String(value).toLowerCase());

    // checks for existence of each item in "columnValue" array inside "columnValuesArray" (data from sql database)
    let exists = columnValue.every(value => columnValuesArray.includes(value));

    conn.end();
    return exists;
  }

  catch (err) {
    conn.end();
    throw err;
  }
}


// ** Adv Feat
// func to get total votes on a specific game
gameFunc.getVotes = async (gameid) => {
  let conn = dbConnect.getConnection();
  let sqlStatement = `SELECT vote FROM reviews WHERE game_id = ?;`;
  let connQuery = util.promisify(conn.query).bind(conn);

  try {
    const result = await connQuery(sqlStatement, [gameid]);

    let totalVotes = result.reduce((sum, obj) => {
      return sum + Number(obj.vote);
    }, 0);
    conn.end();

    return totalVotes;
  }

  catch (err) {
    conn.end();
    throw err;
  }
}

// func to refresh total votes on specific game (used together with func above)
gameFunc.refreshVotes = async (gameid, newVotes) => {
  let conn = dbConnect.getConnection();
  let sqlStatement = "UPDATE `sp_games`.`games` SET `total_votes` = ? WHERE (`game_id` = ?);";
  let connQuery = util.promisify(conn.query).bind(conn);

  try {
    const result = await connQuery(sqlStatement, [newVotes, gameid]);
    conn.end();
    return result;
  }

  catch (err) {
    conn.end();
    throw err;
  }
}

// ------------------------------
// Functions for API
// ------------------------------
// verifying login
gameFunc.verify = async (email, password) => {
  let sqlStatement = 'SELECT * FROM users WHERE BINARY username = ?';
  let conn = dbConnect.getConnection();
  let connQuery = util.promisify(conn.query).bind(conn);

  try {
    const result = await connQuery(sqlStatement, [email, password]);
    conn.end();
    if (result.length === 0) {
      return null;
    }

    else {
      const user = result[0];
      return user;
    }
  }

  catch (err) {
    conn.end();
    throw err;
  }
}


// ---------------------------------------------
// get array of all users in DB
gameFunc.getAllUsers = async () => {
  let conn = dbConnect.getConnection();
  let sqlStatement = "SELECT *, DATE_FORMAT(created_at, '%Y-%m-%d %H:%i:%s') as created_at FROM users;";
  let connQuery = util.promisify(conn.query).bind(conn);

  try {
    const result = await connQuery(sqlStatement, []);
    conn.end();
    return result;
  }

  catch (err) {
    conn.end();
    throw err;
  }
}


// ---------------------------------------------
// add new user to DB
gameFunc.createUser = async (userObj) => {
  let conn = dbConnect.getConnection();
  let sqlStatement = "INSERT INTO `sp_games`.`users` (`username`, `email`, `password`, `type`, `profile_pic_url`) VALUES (?, ?, ?, ?, ?);";
  let connQuery = util.promisify(conn.query).bind(conn);

  try {
    const result = await connQuery(sqlStatement, [userObj.username, userObj.email, userObj.password, userObj.type, userObj.profile_pic_url]);
    conn.end();
    return result;
  }

  catch (err) {
    conn.end();
    throw err;
  }
}


// ---------------------------------------------
// create new category
gameFunc.createCategory = async (catObj) => {
  let conn = dbConnect.getConnection();
  let sqlStatement = "INSERT INTO `sp_games`.`category` (`catname`, `description`) VALUES (?, ?);";
  let connQuery = util.promisify(conn.query).bind(conn);

  try {
    const result = await connQuery(sqlStatement, [catObj.catname, catObj.description]);
    conn.end();
    return result;
  }

  catch (err) {
    conn.end();
    throw err;
  }
}


// ---------------------------------------------
// create new platform
gameFunc.createPlatform = async (platObj) => {
  let conn = dbConnect.getConnection();
  let sqlStatement;

  // change sql statement based on whether platform icon is null or not
  if (platObj.platform_icon === null) {
    sqlStatement = "INSERT INTO `sp_games`.`platform` (`platform_name`, `description`) VALUES (?, ?);";
  }

  else {
    sqlStatement = "INSERT INTO `sp_games`.`platform` (`platform_name`, `description`, `platform_icon`) VALUES (?, ?, ?);";
  }

  let connQuery = util.promisify(conn.query).bind(conn);

  try {
    let result;

    if (platObj.platform_icon === null) {
      result = await connQuery(sqlStatement, [platObj.platform_name, platObj.description]);
    }

    else {
      result = await connQuery(sqlStatement, [platObj.platform_name, platObj.description, platObj.platform_icon]);
    }
    conn.end();
    return result;
  }

  catch (err) {
    conn.end();
    throw err;
  }
}


// ---------------------------------------------
// get all games without platform and category and price
gameFunc.getAllGames = async () => {
  let conn = dbConnect.getConnection();
  let sqlStatement = "SELECT * from games";
  let connQuery = util.promisify(conn.query).bind(conn);

  try {
    const result = await connQuery(sqlStatement, []);
    conn.end();
    return result;
  }

  catch (err) {
    conn.end();
    throw err;
  }
}


// ---------------------------------------------
// add new game to DB
// first func to add game to "games" table
gameFunc.createGame = async (gameObj) => {
  let conn = dbConnect.getConnection();
  let sqlStatement;

  if (gameObj.img_name === null) {
    sqlStatement = "INSERT INTO `sp_games`.`games` (`title`, `description`, `year`) VALUES (?, ?, ?);";
  }

  else {
    sqlStatement = "INSERT INTO `sp_games`.`games` (`title`, `description`, `year`, `img_name`) VALUES (?, ?, ?, ?);";
  }
  let connQuery = util.promisify(conn.query).bind(conn);

  try {
    let result;
    if (gameObj.img_name === null) {
      result = await connQuery(sqlStatement, [gameObj.title, gameObj.description, gameObj.year]);
    }

    else {
      result = await connQuery(sqlStatement, [gameObj.title, gameObj.description, gameObj.year, gameObj.img_name]);
    }
    conn.end();
    return result;
  }

  catch (err) {
    conn.end();
    throw err;
  }
}

// second func to add price and platformid to "prices" table
gameFunc.createPrice = async (priceObj) => {
  let conn = dbConnect.getConnection();
  let sqlStatement = "INSERT INTO `sp_games`.`prices` (`game_id`, `price`, `platform_id`) VALUES (?, ?, ?);";
  let connQuery = util.promisify(conn.query).bind(conn);

  try {
    const result = await connQuery(sqlStatement, [priceObj.game_id, priceObj.price, priceObj.platform_id]);
    conn.end();
    return result;
  }

  catch (err) {
    conn.end();
    throw err;
  }
}

// third func to add category_id to "game_category" table
gameFunc.createGameCategory = async (categoryObj) => {
  let conn = dbConnect.getConnection();
  let sqlStatement = "INSERT INTO `sp_games`.`game_category` (`game_id`, `category_id`) VALUES (?, ?);";
  let connQuery = util.promisify(conn.query).bind(conn);

  try {
    const result = await connQuery(sqlStatement, [categoryObj.game_id, categoryObj.category_id]);
    conn.end();
    return result;
  }

  catch (err) {
    conn.end();
    throw err;
  }
}


// ---------------------------------------------
// Retrieve all games from certain platform
// first func to retrieve everything except catid and catname (cuz used separate table and need concat multiple category)
gameFunc.getGamesFromPlatform = async (platformname) => {
  let conn = dbConnect.getConnection();
  let sqlStatement =
    `SELECT g.game_id, g.title, g.description, g.total_votes, p.price, plat.platform_name, g.year, g.created_at 
  FROM games g, prices p, platform plat
  WHERE g.game_id = p.game_id AND p.platform_id = plat.platform_id
  AND plat.platform_name = ?;`;
  let connQuery = util.promisify(conn.query).bind(conn);

  try {
    const result = await connQuery(sqlStatement, [platformname]);
    conn.end();
    return result;
  }

  catch (err) {
    conn.end();
    throw err;
  }
}

// second func to retrieve catid and catname
gameFunc.getCategoryFromGameId = async (game_id) => {
  let conn = dbConnect.getConnection();
  let sqlStatement = `SELECT gc.category_id, c.catname FROM category c, game_category gc WHERE gc.category_id = c.category_id AND gc.game_id = ?;`;
  let connQuery = util.promisify(conn.query).bind(conn);

  try {
    const result = await connQuery(sqlStatement, [game_id]);
    conn.end();
    return result;
  }

  catch (err) {
    conn.end();
    throw err;
  }
}


// ---------------------------------------------
// delete game from id
gameFunc.delGame = async (game_id) => {
  let conn = dbConnect.getConnection();
  let sqlStatement = "DELETE FROM `sp_games`.`games` WHERE (`game_id` = ?);";
  let connQuery = util.promisify(conn.query).bind(conn);

  try {
    const result = await connQuery(sqlStatement, [game_id]);
    conn.end();
    return result;
  }

  catch (err) {
    conn.end();
    throw err;
  }
}


// ---------------------------------------------
// update game listing
// func to update "games" table
gameFunc.updateGame = async (game_id, gameObj) => {
  let conn = dbConnect.getConnection();
  let sqlStatement = "UPDATE `sp_games`.`games` SET `title` = ?, `description` = ?, `year` = ? WHERE (`game_id` = ?);";
  let connQuery = util.promisify(conn.query).bind(conn);

  try {
    const result = await connQuery(sqlStatement, [gameObj.title, gameObj.description, gameObj.year, game_id]);
    conn.end();
    return result;
  }

  catch (err) {
    conn.end();
    throw err;
  }
}

// func to get all price_id of specific game_id
gameFunc.getPriceIdOfGame = async (game_id) => {
  let conn = dbConnect.getConnection();
  let sqlStatement = "SELECT price_id FROM prices WHERE game_id = ?";
  let connQuery = util.promisify(conn.query).bind(conn);

  try {
    const result = await connQuery(sqlStatement, [game_id]);
    conn.end();
    return result;
  }

  catch (err) {
    conn.end();
    throw err;
  }
}

// func to get game_category_id of specific game_id
gameFunc.getGCIdOfGame = async (game_id) => {
  let conn = dbConnect.getConnection();
  let sqlStatement = "SELECT game_category_id FROM game_category WHERE game_id = ?";
  let connQuery = util.promisify(conn.query).bind(conn);

  try {
    const result = await connQuery(sqlStatement, [game_id]);
    conn.end();
    return result;
  }

  catch (err) {
    conn.end();
    throw err;
  }
}

// func to update "prices" table
gameFunc.updatePrice = async (price_id, priceObj) => {
  let conn = dbConnect.getConnection();
  let sqlStatement = "UPDATE `sp_games`.`prices` SET `game_id` = ?, `price` = ?, `platform_id` = ? WHERE (`price_id` = ?);";
  let connQuery = util.promisify(conn.query).bind(conn);

  try {
    const result = await connQuery(sqlStatement, [priceObj.game_id, priceObj.price, priceObj.platform_id, price_id]);
    conn.end();
    return result;
  }

  catch (err) {
    conn.end();
    throw err;
  }
}

// func to del prices (if new game data has less prices)
gameFunc.delPrice = async (price_id) => {
  let conn = dbConnect.getConnection();
  let sqlStatement = "DELETE FROM `sp_games`.`prices` WHERE (`price_id` = ?);";
  let connQuery = util.promisify(conn.query).bind(conn);

  try {
    const result = await connQuery(sqlStatement, [price_id]);
    conn.end();
    return result;
  }

  catch (err) {
    conn.end();
    throw err;
  }
}

// func to update game category
gameFunc.updateGC = async (gcId, gcObj) => {
  let conn = dbConnect.getConnection();
  let sqlStatement = "UPDATE `sp_games`.`game_category` SET `game_id` = ?, `category_id` = ? WHERE (`game_category_id` = ?);";
  let connQuery = util.promisify(conn.query).bind(conn);

  try {
    const result = await connQuery(sqlStatement, [gcObj.game_id, gcObj.category_id, gcId]);
    conn.end();
    return result;
  }

  catch (err) {
    conn.end();
    throw err;
  }
}

// func to del game_category (if new game data has less categories)
gameFunc.delGC = async (gcid) => {
  let conn = dbConnect.getConnection();
  let sqlStatement = "DELETE FROM `sp_games`.`game_category` WHERE (`game_category_id` = ?);";
  let connQuery = util.promisify(conn.query).bind(conn);

  try {
    const result = await connQuery(sqlStatement, [gcid]);
    conn.end();
    return result;
  }

  catch (err) {
    conn.end();
    throw err;
  }
}


// ---------------------------------------------
// create review
gameFunc.createReview = async (userid, gameid, reviewObj) => {
  let conn = dbConnect.getConnection();
  let sqlStatement = "INSERT INTO `sp_games`.`reviews` (`game_id`, `content`, `rating`, `user_id`) VALUES (?, ?, ?, ?);";
  let connQuery = util.promisify(conn.query).bind(conn);

  try {
    const result = await connQuery(sqlStatement, [gameid, reviewObj.content, reviewObj.rating, userid]);
    conn.end();
    return result;
  }

  catch (err) {
    conn.end();
    throw err;
  }
}

// adv feat
gameFunc.createReviewVote = async (userid, gameid, reviewObj) => {
  let conn = dbConnect.getConnection();
  let sqlStatement = "INSERT INTO `sp_games`.`reviews` (`game_id`, `content`, `rating`, `user_id`, `vote`) VALUES (?, ?, ?, ?, ?);";
  let connQuery = util.promisify(conn.query).bind(conn);

  try {
    const result = await connQuery(sqlStatement, [gameid, reviewObj.content, reviewObj.rating, userid, String(reviewObj.vote)]);
    conn.end();
    return result;
  }

  catch (err) {
    conn.end();
    throw err;
  }
}


// ---------------------------------------------
// get game review
gameFunc.getReview = async (gameid) => {
  let conn = dbConnect.getConnection();
  let sqlStatement =
    `SELECT g.game_id, r.content, r.rating, u.username, DATE_FORMAT(r.created_at, '%Y-%m-%d %H:%i:%s') as created_at 
  FROM games g, reviews r, users u 
  WHERE u.user_id = r.user_id AND g.game_id = r.game_id AND g.game_id = ?`;
  let connQuery = util.promisify(conn.query).bind(conn);

  try {
    const result = await connQuery(sqlStatement, [gameid]);
    conn.end();
    return result;
  }

  catch (err) {
    conn.end();
    throw err;
  }
}


// ---------------------------------------------
// Adv feat - Upload/retrieve img of game
// uploading img for game
gameFunc.uploadImg = async (gameid, img_name) => {
  let conn = dbConnect.getConnection();
  let sqlStatement = "UPDATE `sp_games`.`games` SET `img_name` = ? WHERE (`game_id` = ?);";
  let connQuery = util.promisify(conn.query).bind(conn);

  try {
    const result = await connQuery(sqlStatement, [img_name, gameid]);
    conn.end();
    return result;
  }

  catch (err) {
    conn.end();
    throw err;
  }
}

// retrieving img of game
gameFunc.getGameImgName = async (gameid) => {
  let conn = dbConnect.getConnection();
  let sqlStatement = "SELECT img_name FROM games WHERE (`game_id` = ?);";
  let connQuery = util.promisify(conn.query).bind(conn);

  try {
    const result = await connQuery(sqlStatement, [gameid]);
    conn.end();
    return result;
  }

  catch (err) {
    conn.end();
    throw err;
  }
}




// ==================================================================================
// ADDED/EDITED FUNCTIONS FOR ASSIGNMENT 2
// ==================================================================================

// ---------------------------------------------
// get user by username*
gameFunc.getUserByUsername = async (username) => {
  let conn = dbConnect.getConnection();
  let sqlStatement = "SELECT *, DATE_FORMAT(created_at, '%Y-%m-%d %H:%i:%s') as created_at FROM users WHERE username = ?;";
  let connQuery = util.promisify(conn.query).bind(conn);

  try {
    const result = await connQuery(sqlStatement, [username]);
    conn.end();
    return result;
  }

  catch (err) {
    conn.end();
    throw err;
  }
}


// ---------------------------------------------
// get user by user_id*
gameFunc.getUserById = async (user_id) => {
  let conn = dbConnect.getConnection();
  let sqlStatement = "SELECT *, DATE_FORMAT(created_at, '%Y-%m-%d %H:%i:%s') as created_at FROM users WHERE user_id = ?;";
  let connQuery = util.promisify(conn.query).bind(conn);

  try {
    const result = await connQuery(sqlStatement, [user_id]);
    conn.end();
    return result;
  }

  catch (err) {
    conn.end();
    throw err;
  }
}


// ---------------------------------------------
// update user details
gameFunc.updateUser = async (userObj, userId) => {
  let conn = dbConnect.getConnection();
  let sqlStatement

  if (userObj.password == undefined) {
    sqlStatement = "UPDATE `sp_games`.`users` SET `username` = ?, `email` = ?, `type` = ? WHERE (`user_id` = ?);";
  }

  else {
    sqlStatement = "UPDATE `sp_games`.`users` SET `username` = ?, `email` = ?, `password` = ?, `type` = ? WHERE (`user_id` = ?);";
  }

  let connQuery = util.promisify(conn.query).bind(conn);

  try {
    let result;
    if (userObj.password == undefined) {
      result = await connQuery(sqlStatement, [userObj.username, userObj.email, userObj.type, userId]);
    }

    else {
      result = await connQuery(sqlStatement, [userObj.username, userObj.email, userObj.password, userObj.type, userId]);
    }
    conn.end();
    return result;
  }

  catch (err) {
    conn.end();
    throw err;
  }
}


// ---------------------------------------------
// delete user
gameFunc.deleteUser = async (userId) => {
  let conn = dbConnect.getConnection();
  let sqlStatement = "DELETE FROM `sp_games`.`users` WHERE (`user_id` = ?);";
  let connQuery = util.promisify(conn.query).bind(conn);

  try {
    const result = await connQuery(sqlStatement, [userId]);
    conn.end();
    return result;
  }

  catch (err) {
    conn.end();
    throw err;
  }
}


// ---------------------------------------------
// get all categories of a game*
gameFunc.getAllGamesCat = async () => {
  let conn = dbConnect.getConnection();
  let sqlStatement = "SELECT g.game_id, g.title, c.catname FROM games g, category c, game_category gc \
  WHERE g.game_id = gc.game_id AND c.category_id = gc.category_id;";
  let connQuery = util.promisify(conn.query).bind(conn);

  try {
    const result = await connQuery(sqlStatement, []);
    conn.end();
    return result;
  }

  catch (err) {
    conn.end();
    throw err;
  }
}


// ---------------------------------------------
// get game by game id (multiple platforms)*
gameFunc.getGameById = async (game_id) => {
  let conn = dbConnect.getConnection();
  let sqlStatement = "SELECT g.*, plat.platform_name, plat.platform_id, p.price, p.price_id, plat.platform_icon FROM games g,\
  platform plat, prices p WHERE g.game_id = p.game_id AND plat.platform_id = p.platform_id AND g.game_id = ?";
  let connQuery = util.promisify(conn.query).bind(conn);

  try {
    const result = await connQuery(sqlStatement, [game_id]);
    conn.end();
    return result;
  }

  catch (err) {
    conn.end();
    throw err;
  }
}


// ---------------------------------------------
// get game by game id (specific platform)*
gameFunc.getSpecificPlatGameById = async (game_id, platform) => {
  let conn = dbConnect.getConnection();
  let sqlStatement;
  let connQuery = util.promisify(conn.query).bind(conn);

  if (Number.isInteger(platform)) {
    sqlStatement = "SELECT g.*, plat.platform_name, plat.platform_id, p.price, p.price_id, plat.platform_icon FROM games g,\
    platform plat, prices p WHERE g.game_id = p.game_id AND plat.platform_id = p.platform_id AND g.game_id = ? AND plat.platform_id = ?;";
  }

  else {
    sqlStatement = "SELECT g.*, plat.platform_name, plat.platform_id, p.price, p.price_id, plat.platform_icon FROM games g,\
    platform plat, prices p WHERE g.game_id = p.game_id AND plat.platform_id = p.platform_id AND g.game_id = ? AND plat.platform_name = ?;";
  }

  try {
    const result = await connQuery(sqlStatement, [game_id, platform]);
    conn.end();
    return result;
  }

  catch (err) {
    conn.end();
    throw err;
  }
}


// ---------------------------------------------
// get all games with platform and price*
gameFunc.getAllGamesPlat = async () => {
  let conn = dbConnect.getConnection();
  let sqlStatement = "SELECT g.*, plat.platform_name, plat.platform_id, p.price, p.price_id, plat.platform_icon FROM games g,\
  platform plat, prices p WHERE g.game_id = p.game_id AND plat.platform_id = p.platform_id;";
  let connQuery = util.promisify(conn.query).bind(conn);

  try {
    const result = await connQuery(sqlStatement, []);
    conn.end();
    return result;
  }

  catch (err) {
    conn.end();
    throw err;
  }
}


// ---------------------------------------------
// get all exisiting categories*
gameFunc.getAllCategories = async () => {
  let conn = dbConnect.getConnection();
  let sqlStatement = "SELECT * FROM category;";
  let connQuery = util.promisify(conn.query).bind(conn);

  try {
    const result = await connQuery(sqlStatement, []);
    conn.end();
    return result;
  }

  catch (err) {
    conn.end();
    throw err;
  }
}


// ---------------------------------------------
// get all existing platforms*
gameFunc.getAllPlatforms = async () => {
  let conn = dbConnect.getConnection();
  let sqlStatement = "SELECT * FROM platform;";
  let connQuery = util.promisify(conn.query).bind(conn);

  try {
    const result = await connQuery(sqlStatement, []);
    conn.end();
    return result;
  }

  catch (err) {
    conn.end();
    throw err;
  }
}


// ---------------------------------------------
// get game id by title*
gameFunc.getGameIdByTitle = async (title) => {
  let conn = dbConnect.getConnection();
  let sqlStatement = "SELECT game_id FROM games WHERE title = ?;";
  let connQuery = util.promisify(conn.query).bind(conn);

  try {
    const result = await connQuery(sqlStatement, [title]);
    conn.end();
    return result[0].game_id;
  }

  catch (err) {
    conn.end();
    throw err;
  }
}


// ==================================================================
// ADVANCED FEATURE: CART
// ==================================================================

// ---------------------------------------------
// update cart_status
gameFunc.updateStatus = async (cart_id, user_id, status) => {
  let conn = dbConnect.getConnection();
  let sqlStatement;

  // check if status is checkout or create (true > checkout, false > create)
  if (status) {
    sqlStatement = "UPDATE cart_status SET checkout = ? WHERE cart_id = ?";
  }

  else {
    sqlStatement = "INSERT INTO `sp_games`.`cart_status` (`user_id`, `checkout`) VALUES (?, ?);";
  }


  let connQuery = util.promisify(conn.query).bind(conn);

  try {
    let result;
    if (status) {
      result = await connQuery(sqlStatement, [status, cart_id]);
    }

    else {
      result = await connQuery(sqlStatement, [user_id, status]);
    }
    conn.end();
    return result;
  }

  catch (err) {
    conn.end();
    throw err;
  }
}


// ---------------------------------------------
// update cart data (may be used when user increase/decrease quantity of a game)
gameFunc.updateCart = async (game_id, platform_id, quantity, cart_id) => {
  let conn = dbConnect.getConnection();
  let sqlStatement = "UPDATE cart_data SET quantity = ? WHERE cart_id = ? AND game_id = ? AND platform_id = ?;";
  let connQuery = util.promisify(conn.query).bind(conn);

  try {
    const result = await connQuery(sqlStatement, [quantity, cart_id, game_id, platform_id]);
    conn.end();
    return result;
  }

  catch (err) {
    conn.end();
    throw err;
  }
}


// ---------------------------------------------
// delete cart data (may be used when user remove a game from cart)
gameFunc.deleteCartItem = async (game_id, platform_id, cart_id) => {
  let conn = dbConnect.getConnection();
  let sqlStatement = "DELETE FROM cart_data WHERE cart_id = ? AND game_id = ? AND platform_id = ?;";
  let connQuery = util.promisify(conn.query).bind(conn);

  try {
    const result = await connQuery(sqlStatement, [cart_id, game_id, platform_id]);
    conn.end();
    return result;
  }

  catch (err) {
    conn.end();
    throw err;
  }
}


// ---------------------------------------------
// get cart status
gameFunc.getCartStatus = async (user_id) => {
  let conn = dbConnect.getConnection();
  let sqlStatement = "SELECT * FROM cart_status WHERE user_id = ?;";
  let connQuery = util.promisify(conn.query).bind(conn);

  try {
    const result = await connQuery(sqlStatement, [user_id]);
    conn.end();
    return result;
  }

  catch (err) {
    conn.end();
    throw err;
  }
}


// ---------------------------------------------
// add to cart
gameFunc.addToCart = async (game_id, platform_id, quantity, cart_id) => {
  let conn = dbConnect.getConnection();
  let sqlStatement = "INSERT INTO `sp_games`.`cart_data` (`game_id`, `platform_id`, `quantity`, `cart_id`) VALUES (?, ?, ?, ?);";
  let connQuery = util.promisify(conn.query).bind(conn);

  try {
    const result = await connQuery(sqlStatement, [game_id, platform_id, quantity, cart_id]);
    conn.end();
    return result;
  }

  catch (err) {
    conn.end();
    throw err;
  }
}


// ---------------------------------------------
// retrieve cart
gameFunc.getCartData = async (cart_id) => {
  let conn = dbConnect.getConnection();
  let sqlStatement = "SELECT * FROM cart_data WHERE cart_id = ?;";
  let connQuery = util.promisify(conn.query).bind(conn);

  try {
    const result = await connQuery(sqlStatement, [cart_id]);
    conn.end();
    return result;
  }

  catch (err) {
    conn.end();
    throw err;
  }
}


// ---------------------------------------------
// save card details
gameFunc.saveCardDetails = async (user_id, card_number, card_name, card_expiry) => {
  let conn = dbConnect.getConnection();
  let sqlStatement = "INSERT INTO `sp_games`.`card_details` (`user_id`, `card_num`, `card_name`, `card_expiry`) VALUES (?, ?, ?, ?);";
  let connQuery = util.promisify(conn.query).bind(conn);

  try {
    const result = await connQuery(sqlStatement, [user_id, card_number, card_name, card_expiry]);
    conn.end();
    return result;
  }

  catch (err) {
    conn.end();
    throw err;
  }
}


// ---------------------------------------------
// get card details
gameFunc.getCardDetails = async (user_id) => {
  let conn = dbConnect.getConnection();
  let sqlStatement = "SELECT * FROM card_details WHERE user_id = ?;";
  let connQuery = util.promisify(conn.query).bind(conn);

  try {
    const result = await connQuery(sqlStatement, [user_id]);
    conn.end();
    return result;
  }

  catch (err) {
    conn.end();
    throw err;
  }
}


// ---------------------------------------------
// delete card details
gameFunc.deleteCardDetails = async (user_id) => {
  let conn = dbConnect.getConnection();
  let sqlStatement = "DELETE FROM card_details WHERE user_id = ?;";
  let connQuery = util.promisify(conn.query).bind(conn);

  try {
    const result = await connQuery(sqlStatement, [user_id]);
    conn.end();
    return result;
  }

  catch (err) {
    conn.end();
    throw err;
  }
}


module.exports = gameFunc;
// ------------------------------
// Testing
// ------------------------------
