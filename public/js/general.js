// file to store general functions that are used in multiple pages

// function to check login status and change nav bar accordingly
function loginStatus(jwtToken) {
  // nav bar depending on user login status
  // general public
  if (!jwtToken || jwtToken === undefined) {
    // removes dropdown from admin tools
    $("#admin-tools").hide();

    // set profile name to guest
    $("#logged-in-user").find("i").after(" Guest");

    // user is not logged in (set cart items for non logged in user)
    if (sessionStorage["cart"]) {
      $("#num-cart-items").text(JSON.parse(sessionStorage.getItem("cart")).length);
    }

    else {
      $("#num-cart-items").text(0);
    }

  }

  else {
    // user is logged in (remove "login" and change to "logout")
    $("#login-dropdown").text("");
    $("#login-dropdown").append($('<i class="fa-solid fa-right-to-bracket"></i>'), " Logout");
    $("#login-dropdown").removeAttr("data-bs-toggle");
    $("#login-dropdown").attr("class", "nav-link");

    $(document).ready(function () {
      $("#login-dropdown").click(function () {
        let confirmation = "Are you sure you want to logout?";
        if (confirm(confirmation)) {
          localStorage.removeItem("jwt");
          localStorage.removeItem("user-role");
          window.location.href = "./index.html";
        }
      })
    });

    // gets info of current user on webpage
    var settings = {
      "url": "http://localhost:8081/user/self",
      "method": "GET",
      "timeout": 0,
      "headers": {
        "Authorization": "Bearer " + jwtToken
      },
    };

    $.ajax(settings).done(async function (currentUser) {
      // console.log(currentUser);
      // console.log(currentUser.username);

      // set profile name to user's name
      $("#logged-in-user").find("i").after(" " + currentUser.username);

      // edit webpage access based on user role
      const userRole = currentUser.type;
      localStorage.setItem("user-role", userRole);

      if (userRole === "Customer") {
        // removes dropdown from admin tools
        $("#admin-tools").hide();
      }

      // ======== CART ITEMS ========
      // get user's cart status to see if there is a cart with checkout status of false
      try {
        // user is logged in, take cart data from database
        const cartData = await getUserCartData(localStorage["jwt"]);

        // no cart data
        if (cartData === null) {
          $("#num-cart-items").text(0);
        }

        else if (cartData[0].cart_data_id === null) {
          $("#num-cart-items").text(0);
        }

        else {
          $("#num-cart-items").text(cartData.length);
        }
      }

      catch (error) {
        errorStatus = error.slice(0, 3);
        alert(error);
        window.location.href = "./error/error" + errorStatus + ".html";
      }

    }).fail(function (jqXHR, textStatus, errorThrown) {
      if (jqXHR.status === 404 && jqXHR.responseJSON.error === "User not found") {
        alert(jqXHR.responseJSON.error);

        // clear localstorage
        localStorage.removeItem("jwt");
        localStorage.removeItem("user-role");

        window.location.href = "./login.html";
      }

      if (jqXHR.responseJSON && jqXHR.responseJSON.error) {
        alert(jqXHR.responseJSON.error);
        window.location.href = "./login.html";
      }

      else {
        alert(jqXHR.status + " " + errorThrown, textStatus);
        window.location.href = "./error/error" + jqXHR.status + ".html";
      }
    });
  }
}


/**
 * 
 * @param {Number} game_id id of game to get game details from
 * @returns promise that resolves to game details of specified game id
 */
function gameDetailsFromId(game_id) {
  return new Promise(function (resolve, reject) {
    var settings = {
      "url": "http://localhost:8081/specific/game/" + game_id,
      "method": "GET",
      "timeout": 0,
    };

    $.ajax(settings).done(function (response) {
      resolve(response);
    }).fail(function (jqXHR, textStatus, errorThrown) {
      reject(jqXHR.status + " " + jqXHR.responseJSON.error);
    });
  });
}


/**
 * 
 * @param {Number} game_id id of game to get game details from
 * @param {String} platform platform of game to get game details from
 * @returns promise that resolves to game details (with category) of specified game id
 */
function gameCatDetailsFromId(game_id, platform) {
  return new Promise(function (resolve, reject) {
    var settings = {
      "url": "http://localhost:8081/specific/gameCategory/" + game_id + "/" + platform,
      "method": "GET",
      "timeout": 0,
    };

    $.ajax(settings).done(function (response) {
      resolve(response);
    }).fail(function (jqXHR, textStatus, errorThrown) {
      reject(jqXHR.status + " " + jqXHR.responseJSON.error);
    });
  });
}


/**
 * 
 * @param {Numer} game_id id of game to get average ratings of
 * @returns promise that resolves to average ratings of specified game id
 */
function specificGameAvgRatings(game_id) {
  return new Promise(function (resolve, reject) {
    var settings = {
      "url": "http://localhost:8081/game/" + game_id + "/review",
      "method": "GET",
      "timeout": 0,
    };

    $.ajax(settings).done(function (response) {
      // no reviews
      if (response.length < 1) {
        resolve(null);
      }

      else {
        totalRating = response.reduce(function (rating, review) {
          return rating + review.rating;
        }, 0);

        avgRating = Number(totalRating) / response.length;

        resolve(Math.floor(avgRating));
      }
    }).fail(function (jqXHR, textStatus, errorThrown) {
      reject(jqXHR.status + " " + jqXHR.responseJSON.error);
    });
  });
}


/**
 * 
 * @param {Number} game_id id of game to get all reviews of
 * @returns promise that resolves to all reviews of specified game id
 */
function specificGameReviews(game_id) {
  return new Promise(function (resolve, reject) {
    var settings = {
      "url": "http://localhost:8081/game/" + game_id + "/review",
      "method": "GET",
      "timeout": 0,
    };

    $.ajax(settings).done(function (response) {
      resolve(response);
    }).fail(function (jqXHR, textStatus, errorThrown) {
      reject(jqXHR.status + " " + jqXHR.responseJSON.error);
    });
  });
}


/**
 * 
 * @param {String} jwtToken jwt token of current user
 * @returns promise that resolves to current user details
 */
function getCurrentUser(jwtToken) {
  return new Promise(function (resolve, reject) {
    var settings = {
      "url": "http://localhost:8081/user/self",
      "method": "GET",
      "timeout": 0,
      "headers": {
        "Authorization": "Bearer " + jwtToken
      },
    };

    $.ajax(settings).done(function (currentUser) {
      resolve(currentUser);
    }).fail(function (jqXHR, textStatus, errorThrown) {
      reject(jqXHR.status + " " + jqXHR.responseJSON.error);
    });
  });
}


/**
 * 
 * @param {String} jwtToken jwt token of current user
 * @returns promise that resolves to current user's cart details/status ("null" if no cart with checkout status of false, else cart details)
 */
function getUserCartData(jwtToken) {
  return new Promise(function (resolve, reject) {
    // get user's cart status to see if there is a cart with checkout status of false
    var settings = {
      "url": "http://localhost:8081/cart",
      "method": "GET",
      "timeout": 0,
      "headers": {
        "Authorization": "Bearer " + jwtToken
      },
    };

    $.ajax(settings).done(function (allUserCartStatus) {
      // filter out cart with checkout status of false
      const nonCheckoutCartArr = allUserCartStatus.filter(cartStatus => cartStatus.checkout === 0);
      const nonCheckoutCart = nonCheckoutCartArr[0]; // should only have 1 cart with checkout status of false

      // if undefined, no cart with checkout status of false
      if (nonCheckoutCart === undefined) {
        // return null for cart details
        resolve(null);
      }

      // else, there is a cart with checkout status of false
      else {
        const cart_id = nonCheckoutCart.cart_id;

        // get cart data
        var settings = {
          "url": "http://localhost:8081/cart/" + cart_id,
          "method": "GET",
          "timeout": 0,
          "headers": {
            "Authorization": "Bearer " + jwtToken
          },
        };

        $.ajax(settings).done(function (cartData) {
          // for cart exists but no items in cart situation
          if (cartData.length < 1) {
            resolve([
              {
                "cart_data_id": null,
                "cart_id": cart_id,
                "game_id": null,
                "platform_id": null,
                "quantity": 0
              }
            ])
          }

          else {
            resolve(cartData);
          }

          // error getting cart data
        }).fail(function (jqXHR, textStatus, errorThrown) {
          reject(jqXHR.status + " " + jqXHR.responseJSON.error);
        });
      }

      // error getting cart status
    }).fail(function (jqXHR, textStatus, errorThrown) {
      reject(jqXHR.status + " " + jqXHR.responseJSON.error);
    });
  });
}


/**
 * 
 * @param {String} gameTitle title of game to get id of
 * @returns promise that resolves to id of specified game title
 */
function getIdFromTitle(gameTitle) {
  return new Promise(function (resolve, reject) {
    var settings = {
      "url": "http://localhost:8081/game/" + gameTitle,
      "method": "GET",
      "timeout": 0,
    };

    $.ajax(settings).done(function (response) {
      resolve(response);

    }).fail(function (jqXHR, textStatus, errorThrown) {
      reject(jqXHR.status + " " + jqXHR.responseJSON.error);
    });
  });
}