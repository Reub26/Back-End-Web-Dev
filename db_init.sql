CREATE DATABASE IF NOT EXISTS `sp_games`;
USE sp_games;

-- create tables

CREATE TABLE `sp_games`.`users` (
  `user_id` INT NOT NULL AUTO_INCREMENT,
  `username` VARCHAR(45) NOT NULL,
  `email` VARCHAR(255) NOT NULL,
  `password` VARCHAR(255) NOT NULL,
  `type` VARCHAR(45) NOT NULL,
  `profile_pic_url` VARCHAR(255) NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`user_id`),
  UNIQUE INDEX `username_UNIQUE` (`username` ASC) VISIBLE,
  UNIQUE INDEX `email_UNIQUE` (`email` ASC) VISIBLE);  
  
CREATE TABLE `sp_games`.`games` (
  `game_id` INT NOT NULL AUTO_INCREMENT,
  `title` VARCHAR(45) NOT NULL,
  `description` VARCHAR(255) NOT NULL,
  `year` INT NOT NULL,
  `total_votes` INT NOT NULL DEFAULT 0,
  `img_name` VARCHAR(45) NOT NULL DEFAULT 'image-not-found.jpg' ,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`game_id`),
  UNIQUE INDEX `title_UNIQUE` (`title` ASC) VISIBLE);
  
  CREATE TABLE `sp_games`.`category` (
  `category_id` INT NOT NULL AUTO_INCREMENT,
  `catname` VARCHAR(45) NOT NULL,
  `description` VARCHAR(255) NOT NULL,
  PRIMARY KEY (`category_id`),
  UNIQUE INDEX `catname_UNIQUE` (`catname` ASC) VISIBLE);

CREATE TABLE `sp_games`.`game_category` (
  `game_category_id` INT NOT NULL AUTO_INCREMENT,
  `game_id` INT NOT NULL,
  `category_id` INT NOT NULL,
  PRIMARY KEY (`game_category_id`),
  INDEX `fk_game_id_idx` (`game_id` ASC) VISIBLE,
  INDEX `fk_category_id_idx` (`category_id` ASC) VISIBLE,
  CONSTRAINT `fk_game_id3`
    FOREIGN KEY (`game_id`)
    REFERENCES `sp_games`.`games` (`game_id`)
    ON DELETE CASCADE
    ON UPDATE CASCADE,
  CONSTRAINT `fk_category_id`
    FOREIGN KEY (`category_id`)
    REFERENCES `sp_games`.`category` (`category_id`)
    ON DELETE CASCADE
    ON UPDATE CASCADE);
  
CREATE TABLE `sp_games`.`platform` (
  `platform_id` INT NOT NULL AUTO_INCREMENT,
  `platform_name` VARCHAR(45) NOT NULL,
  `description` VARCHAR(255) NOT NULL,
  `platform_icon` VARCHAR(45) NULL DEFAULT 'fa-solid fa-gamepad',
  PRIMARY KEY (`platform_id`),
  UNIQUE INDEX `platform_name_UNIQUE` (`platform_name` ASC) VISIBLE);

CREATE TABLE `sp_games`.`prices` (
  `price_id` INT NOT NULL AUTO_INCREMENT,
  `game_id` INT NOT NULL,
  `price` DECIMAL(10,2) NOT NULL,
  `platform_id` INT NOT NULL,
  PRIMARY KEY (`price_id`),
  INDEX `fk_game_id_idx` (`game_id` ASC) VISIBLE,
  INDEX `fk_platform_id_idx` (`platform_id` ASC) VISIBLE,
  CONSTRAINT `fk_game_id`
    FOREIGN KEY (`game_id`)
    REFERENCES `sp_games`.`games` (`game_id`)
    ON DELETE CASCADE
    ON UPDATE CASCADE,
  CONSTRAINT `fk_platform_id`
    FOREIGN KEY (`platform_id`)
    REFERENCES `sp_games`.`platform` (`platform_id`)
    ON DELETE CASCADE
    ON UPDATE CASCADE);

CREATE TABLE `sp_games`.`reviews` (
  `review_id` INT NOT NULL AUTO_INCREMENT,
  `game_id` INT NOT NULL,
  `content` VARCHAR(255) NOT NULL,
  `rating` INT NOT NULL,
  `user_id` INT NOT NULL,
  `vote` ENUM('-1', '0', '1') NOT NULL DEFAULT '0',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`review_id`),
  INDEX `fk_game_id_idx` (`game_id` ASC) VISIBLE,
  INDEX `fk_user_id_idx` (`user_id` ASC) VISIBLE,
  CONSTRAINT `fk_game_id2`
	FOREIGN KEY (`game_id`)
    REFERENCES `sp_games`.`games` (`game_id`)
    ON DELETE CASCADE
    ON UPDATE CASCADE,
  CONSTRAINT `fk_user_id`
	FOREIGN KEY (`user_id`)
    REFERENCES `sp_games`.`users` (`user_id`)
    ON DELETE CASCADE
    ON UPDATE CASCADE);
    
CREATE TABLE `sp_games`.`cart_status` (
  `cart_id` INT NOT NULL AUTO_INCREMENT,
  `user_id` INT NOT NULL,
  `checkout` TINYINT(1) NOT NULL DEFAULT '0',
  PRIMARY KEY (`cart_id`),
  INDEX `fk_user_id2_idx` (`user_id` ASC) VISIBLE,
  CONSTRAINT `fk_user_id2`
	FOREIGN KEY (`user_id`)
	REFERENCES `sp_games`.`users` (`user_id`)
	ON DELETE CASCADE
	ON UPDATE CASCADE);

CREATE TABLE `sp_games`.`cart_data` (
  `cart_data_id` INT NOT NULL AUTO_INCREMENT,
  `cart_id` INT NOT NULL,
  `game_id` INT NOT NULL,
  `platform_id` INT NOT NULL,
  `quantity` INT NOT NULL,
  PRIMARY KEY (`cart_data_id`),
  INDEX `fk_cart_id_idx` (`cart_id` ASC) VISIBLE,
  CONSTRAINT `fk_cart_id`
	FOREIGN KEY (`cart_id`)
	REFERENCES `sp_games`.`cart_status` (`cart_id`)
	ON DELETE CASCADE
	ON UPDATE CASCADE,
  INDEX `fk_platform_id2_idx` (`platform_id` ASC) VISIBLE,
  CONSTRAINT `fk_platform_id2`
	FOREIGN KEY (`platform_id`)
	REFERENCES `sp_games`.`platform` (`platform_id`)
	ON DELETE CASCADE
	ON UPDATE CASCADE);
    
CREATE TABLE `sp_games`.`card_details` (
  `card_details_id` INT NOT NULL AUTO_INCREMENT,
  `user_id` INT NOT NULL,
  `card_num` VARCHAR(255) NOT NULL,
  `card_name` VARCHAR(45) NOT NULL,
  `card_expiry` VARCHAR(45) NOT NULL,
  PRIMARY KEY (`card_details_id`),
  UNIQUE INDEX `user_id_UNIQUE` (`user_id` ASC) VISIBLE,
  CONSTRAINT `fk_user_id3`
    FOREIGN KEY (`user_id`)
    REFERENCES `sp_games`.`users` (`user_id`)
    ON DELETE CASCADE
    ON UPDATE CASCADE);





-- insert values
INSERT INTO `sp_games`.`category` (`catname`, `description`) VALUES ('Puzzle', 'focus on completion, which requires players to solve a logic puzzle or navigate a challenge to progress to the next, more difficult challenge');
INSERT INTO `sp_games`.`category` (`catname`, `description`) VALUES ('Strategy', 'A game  in which the players\' uncoerced, and often autonomous, decision-making skills have a high significance in determining the outcome');
INSERT INTO `sp_games`.`category` (`catname`, `description`) VALUES ('MMORPG', 'Massively Multiplayer Online Role-Playing Game');
INSERT INTO `sp_games`.`category` (`catname`, `description`) VALUES ('FPS', 'First Person Shooter');
INSERT INTO `sp_games`.`games` (`title`, `description`, `year`, `total_votes`, `img_name`) VALUES ('Clash of Clans', 'online multiplayer strategy game published by Supercell. You can build your own community, train troops and attack other players.', '2016', '2', '1691074068856-clashOfClans.jpeg');
INSERT INTO `sp_games`.`games` (`title`, `description`, `year`, `total_votes`, `img_name`) VALUES ('Candy Crush', 'a puzzle game that involves making matches of 3 or more colored candy pieces', '2012', '1', '1691076583432-candyCrush.jpeg');
INSERT INTO `sp_games`.`games` (`title`, `description`, `year`, `img_name`) VALUES ('MapleStory', 'two-dimensional, side-scrolling Massively Multiplayer Online Role-Playing Game', '2003', '1691076431136-mapleStory.jpeg');
INSERT INTO `sp_games`.`games` (`title`, `description`, `year`, `total_votes`, `img_name`) VALUES ('Overwatch 2', 'Blizzard entertainment game', '2022', '3', '1691076566943-overwatch.jpg');
INSERT INTO `sp_games`.`games` (`title`, `description`, `year`) VALUES ('Counter Strike Global Offensive', 'CSGO', '1999');
INSERT INTO `sp_games`.`platform` (`platform_name`, `description`, `platform_icon`) VALUES ('Windows', 'a microcomputer designed for use by one person at a time', 'fa-brands fa-windows');
INSERT INTO `sp_games`.`platform` (`platform_name`, `description`, `platform_icon`) VALUES ('XBOX', 'a video gaming brand created and owned by Microsoft', 'fa-brands fa-xbox');
INSERT INTO `sp_games`.`platform` (`platform_name`, `description`, `platform_icon`) VALUES ('Mobile', 'a wireless handheld device that allows users to make and receive calls and play games', 'fa-solid fa-mobile');
INSERT INTO `sp_games`.`platform` (`platform_name`, `description`, `platform_icon`) VALUES ('Playstation', 'playstation', 'fa-brands fa-playstation');
INSERT INTO `sp_games`.`prices` (`game_id`, `price`, `platform_id`) VALUES ('1', '99.99', '1');
INSERT INTO `sp_games`.`prices` (`game_id`, `price`, `platform_id`) VALUES ('1', '10', '2');
INSERT INTO `sp_games`.`prices` (`game_id`, `price`, `platform_id`) VALUES ('2', '69.69', '3');
INSERT INTO `sp_games`.`prices` (`game_id`, `price`, `platform_id`) VALUES ('2', '39.90', '4');
INSERT INTO `sp_games`.`prices` (`game_id`, `price`, `platform_id`) VALUES ('3', '50', '1');
INSERT INTO `sp_games`.`prices` (`game_id`, `price`, `platform_id`) VALUES ('4', '10', '1');
INSERT INTO `sp_games`.`prices` (`game_id`, `price`, `platform_id`) VALUES ('4', '20', '3');
INSERT INTO `sp_games`.`prices` (`game_id`, `price`, `platform_id`) VALUES ('4', '0', '4');
INSERT INTO `sp_games`.`prices` (`game_id`, `price`, `platform_id`) VALUES ('5', '5', '1');
INSERT INTO `sp_games`.`users` (`username`, `email`, `password`, `type`, `profile_pic_url`) VALUES ('Jenny', 'jenny@abc.com', '$2b$07$ju2xpfRB2j1AqOZiTwGvd.VXseINxPZ4Jcp7e/l5gj8g7rsh417b6', 'Customer', 'https://www.abc.com/jenny.jpg');
INSERT INTO `sp_games`.`users` (`username`, `email`, `password`, `type`, `profile_pic_url`) VALUES ('John Tan', 'johnny@xyz.com', '$2b$07$ju2xpfRB2j1AqOZiTwGvd.VXseINxPZ4Jcp7e/l5gj8g7rsh417b6', 'Admin', 'https://www.xyz.com/johntan.jpg');
INSERT INTO `sp_games`.`users` (`username`, `email`, `password`, `type`) VALUES ('admin', 'admin@abc.com', '$2b$07$ju2xpfRB2j1AqOZiTwGvd.VXseINxPZ4Jcp7e/l5gj8g7rsh417b6', 'Admin');
INSERT INTO `sp_games`.`users` (`username`, `email`, `password`, `type`) VALUES ('testUser', 'test@abc.com', '$2b$07$ju2xpfRB2j1AqOZiTwGvd.VXseINxPZ4Jcp7e/l5gj8g7rsh417b6', 'Customer');
INSERT INTO `sp_games`.`users` (`username`, `email`, `password`, `type`) VALUES ('testUser2', 'test2@abc.com', '$2b$07$ju2xpfRB2j1AqOZiTwGvd.VXseINxPZ4Jcp7e/l5gj8g7rsh417b6', 'Admin');
INSERT INTO `sp_games`.`reviews` (`game_id`, `content`, `rating`, `user_id`) VALUES ('1', 'Clash of Clans is a fun game!!', '4', '1');
INSERT INTO `sp_games`.`reviews` (`game_id`, `content`, `rating`, `user_id`) VALUES ('1', 'Boring game', '1', '2');
INSERT INTO `sp_games`.`reviews` (`game_id`, `content`, `rating`, `user_id`, `vote`) VALUES ('2', 'Medium game', '2', '1', '-1');
INSERT INTO `sp_games`.`reviews` (`game_id`, `content`, `rating`, `user_id`, `vote`) VALUES ('2', 'Very very fun game!', '5', '2', '1');
INSERT INTO `sp_games`.`reviews` (`game_id`, `content`, `rating`, `user_id`, `vote`) VALUES ('2', 'Exciting game!', '4', '2', '1');
INSERT INTO `sp_games`.`reviews` (`game_id`, `content`, `rating`, `user_id`, `vote`) VALUES ('1', 'Exciting game!', '4', '2', '1');
INSERT INTO `sp_games`.`reviews` (`game_id`, `content`, `rating`, `user_id`, `vote`) VALUES ('1', 'Exciting game!', '4', '2', '1');
INSERT INTO `sp_games`.`reviews` (`game_id`, `content`, `rating`, `user_id`, `vote`) VALUES ('4', 'Exciting game!', '4', '2', '1');
INSERT INTO `sp_games`.`reviews` (`game_id`, `content`, `rating`, `user_id`, `vote`) VALUES ('4', 'Exciting game!', '4', '2', '1');
INSERT INTO `sp_games`.`reviews` (`game_id`, `content`, `rating`, `user_id`, `vote`) VALUES ('4', 'Exciting game!', '4', '2', '1');
INSERT INTO `sp_games`.`game_category` (`game_id`, `category_id`) VALUES ('1', '2');
INSERT INTO `sp_games`.`game_category` (`game_id`, `category_id`) VALUES ('2', '1');
INSERT INTO `sp_games`.`game_category` (`game_id`, `category_id`) VALUES ('3', '2');
INSERT INTO `sp_games`.`game_category` (`game_id`, `category_id`) VALUES ('3', '3');
INSERT INTO `sp_games`.`game_category` (`game_id`, `category_id`) VALUES ('4', '4');
INSERT INTO `sp_games`.`game_category` (`game_id`, `category_id`) VALUES ('4', '2');
INSERT INTO `sp_games`.`game_category` (`game_id`, `category_id`) VALUES ('5', '4');
INSERT INTO `sp_games`.`game_category` (`game_id`, `category_id`) VALUES ('5', '2');
INSERT INTO `sp_games`.`cart_status` (`user_id`, `checkout`) VALUES ('1', '1');
INSERT INTO `sp_games`.`cart_status` (`user_id`, `checkout`) VALUES ('3', '0');
INSERT INTO `sp_games`.`cart_data` (`cart_id`, `game_id`, `platform_id`, `quantity`) VALUES ('1', '1', '2', '5');
INSERT INTO `sp_games`.`cart_data` (`cart_id`, `game_id`, `platform_id`, `quantity`) VALUES ('1', '3', '1', '2');
INSERT INTO `sp_games`.`cart_data` (`cart_id`, `game_id`, `platform_id`, `quantity`) VALUES ('1', '5', '1', '7');
INSERT INTO `sp_games`.`cart_data` (`cart_id`, `game_id`, `platform_id`, `quantity`) VALUES ('2', '2', '3', '1');
INSERT INTO `sp_games`.`cart_data` (`cart_id`, `game_id`, `platform_id`, `quantity`) VALUES ('2', '2', '4', '10');


