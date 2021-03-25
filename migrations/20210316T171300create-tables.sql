-- sudo mysql -u root < 20210316T171300create-tables.sql

use dominicteo;

drop table if exists users;

create table users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  email varchar(50) UNIQUE,
  display_name varchar(50),
  password varchar(200),
  session_token varchar(300)
);

drop table if exists channels;

create table channels (
  channel_id INT AUTO_INCREMENT PRIMARY KEY,
  name varchar(50) UNIQUE,
  user_id INT
);

drop table if exists messages;

create table messages (
  id INT AUTO_INCREMENT PRIMARY KEY,
  channel_id INT,
  post_id INT,
  message char(255),
  user varchar(50),
  user_id INT
);

drop table if exists unread;

create table unread (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT,
  channel_id INT,
  last_read_id INT DEFAULT 0
);
