# Back-End-Web-Dev
Back End Web development (BED) assignment for school (pt 2)


# Instructions for SP Games Website
Done by:
Reuben Goh, P2205711, DISM 2A03 (2023)

# Usage
Run `db_init.sql` on mysql to get all the required data and tables first

Run `npm install` on command prompt to install all packages required from package.json

Enter `npm run serve` in command prompt to start server with nodemon

or enter `node server.js` to start server

After starting server..

Access webpage from [http://localhost:8081](http://localhost:8081) (since not hosted online)


# Errors
Any unknown errors will be logged into the file "logs/errorLogs.json"

Any known errors caused by user's input will send an alert and redirect user to respective error page.


# Features
## Non-Logged in users
### Access
Able to access "home" page, "about" page, "games" page, and "reviews" page containing reviews left by other users


### Search and Filter
Search game title feature from "home" page and "games" page (search will show games containing whatever is keyed into search bar, e.g. "c" shows all games containing "c")

Filter games by platform on "games" page

Search game titles and Filter games by platform on "reviews" page (search will show games containing whatever is keyed into search bar, e.g. "c" shows all games containing "c")


### Games
Able to see game details


### Cart
Able to "add to cart" however since user is not logged in, no cart data will be saved (once browser is closed or user logs in and logs out, cart data is lost)

Able to checkout as guest, however unable to save card details

note: No proper payment method is set, only card details is asked to simulate a payment transaction



## Logged in users (Customer role)
### Access
Able to access "home" page, "about" page, "games" page, "reviews" page containing reviews left by other users, and "profile" page


### Search and Filter
Search game title feature from "home" page and "games" page (search will show games containing whatever is keyed into search bar, e.g. "c" shows all games containing "c")

Filter games by platform on "games" page

Search game titles and Filter games by platform on "reviews" page (search will show games containing whatever is keyed into search bar, e.g. "c" shows all games containing "c")


### Games
Able to see game details


### Cart
Able to "add to cart".

Cart data is saved even if user logs off

Able to checkout and choice to save card details for future payments

*note*: No proper payment method is set, only card details is asked to simulate a payment transaction


### Profile
User is able to change "Username", "Email", "Password" (can be left blank)

Able to see payment history (previously bought games)

Not able to change "user role" on "profile" page regardless of "user's role"



## Logged in users (Admin role)
### Access
Able to access "home" page, "about" page, "games" page, "reviews" page containing reviews left by other users, "profile" page, and admin tools such as "add platform", "add game" and "edit user data"


### Search and Filter
Search game title feature from "home" page and "games" page (search will show games containing whatever is keyed into search bar, e.g. "c" shows all games containing "c")

Filter games by platform on "games" page

Search game titles and Filter games by platform on "reviews" page (search will show games containing whatever is keyed into search bar, e.g. "c" shows all games containing "c")


### Games
Able to see game details


### Cart
Able to "add to cart".

Cart data is saved even if user logs off

Able to checkout and choice to save card details for future payments

*note*: No proper payment method is set, only card details is asked to simulate a payment transaction


### Profile
User is able to change "Username", "Email", "Password" (can be left blank)

Able to see payment history (previously bought games)

Not able to change "user role" on "profile" page regardless of "user's role"


### Admin tools
Admins able to add platforms

Admins able to add games

Admins able to change game details from "game-details" page

Admins able to delete games from "game-details" page

Admins able to change user roles from "edit user data" page and update the user role by clicking the "pen and paper" icon

Admins able to delete users



# Additional/Advanced Feature
## Games
Adding new game with a game title that already exists in the database will prompt admins if they want to update the game details with the new details set in "add games" form (however game image can not be updated here and can only be updated from "game-details" page


## Reviews
Games can be upvoted/downvoted in the reviews page and is denoted by "recommened to others"

Reviews to games cannot be added if the game has never been bought by the user (games stored in cart is not counted as game bought)

Ratings and upvote/downvote can be left blank and will default to 0 stars and no upvote/downvote given respectively


## Database
Users' passwords are hashed with bcrypt

Many-to-one platform-game relationship

Many-to-one game-usercart relationship

Many-to-one gamecategory-gate relationship


## Cart
Card payment details can be saved and removed from database based on checkbox

Item quantity can be changed in add to cart page

If "add to cart" button is clicked on "game" or "game-details" page, quantity of 1 is incremented to current game if already in cart

Card payment details forms are validated with both bootstrap's validation and a few javascript RegExp
