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
#### Access
Able to access "home" page, "about" page, "games" page, and "reviews" page containing reviews left by other users
#### Search and Filter
Search game title feature from "home" page and "games" page (search will show games containing whatever is keyed into search bar, e.g. "c" shows all games containing "c")
Filter games by platform on "games" page
Search game titles and Filter games by platform on "reviews" page (search will show games containing whatever is keyed into search bar, e.g. "c" shows all games containing "c")
#### Add to Cart
Able to "add to cart" however since user is not logged in, no cart data will be saved (once browser is closed or user logs in and logs out, cart data is lost)
Able to checkout as guest, however unable to save card details
[^note]No proper payment method is set, only card details is asked to simulate a payment transaction

## Logged in users
