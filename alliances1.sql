create database alliances;
use alliances;
create table users (
  id bigint primary key auto_increment,
  your_name varchar(100) not null,
  username varchar(50) not null unique,
  email varchar(255) not null unique,
  auth_provider varchar(20) not null,
  password_hash varchar(255),
  roles varchar(20) not null default 'STUDENT',
  college varchar(150),
  department varchar(100),
  year tinyint,
  section varchar(10),
  bio text,
  pronouns varchar(30),
  pfp_url varchar(2048),
  created_at datetime not null default current_timestamp,
  check (auth_provider in ('GOOGLE','EMAIL')),
  check (roles in ('STUDENT','FACULTY','ADMIN'))
);

insert into users (your_name, username, email, auth_provider)
values ('Test', 'test1', 'a@x.com', 'EMAIL');

-- these should all FAIL:
insert into users (your_name, username, email, auth_provider) values ('T2','test1','b@x.com','EMAIL');  -- duplicate username
insert into users (your_name, username, email, auth_provider) values ('T3','test3','c@x.com','BANANA'); -- bad provider

create table skill (
id bigint primary key auto_increment,
yourname varchar(100) unique not null );

insert into skill (yourname) values ('Python');
insert into skill (yourname) values ('python');  -- should FAIL (duplicate)

create table hackathon (
  id bigint primary key auto_increment,
  name varchar(200) not null,
  link varchar(2048),
  start_date date not null,
  end_date date not null,
  check (end_date >= start_date)
);

create table user_link (
  id bigint primary key auto_increment,
  user_id bigint not null,
  label varchar(50) not null,
  url varchar(2048) not null,
  foreign key (user_id) references users(id) on delete cascade
);

create table user_skill (
  user_id bigint not null,
  skill_id bigint not null,
  primary key (user_id, skill_id),
  index idx_user_skill_skill (skill_id),
  foreign key (user_id) references users(id) on delete cascade,
  foreign key (skill_id) references skill(id) on delete cascade
);

create table post (
  id bigint primary key auto_increment,
  owner_id bigint not null,
  hackathon_id bigint,
  post_type varchar(20) not null default 'HACKATHON',
  title varchar(200) not null,
  description text,
  has_idea boolean not null default false,
  team_size int not null,
  request_deadline datetime not null,
  status varchar(20) not null default 'OPEN',
  created_at datetime not null default current_timestamp,
  check (post_type in ('HACKATHON')),
  check (team_size > 0),
  check (status in ('OPEN','CLOSED','EXPIRED')),
  foreign key (owner_id) references users(id) on delete cascade,
  foreign key (hackathon_id) references hackathon(id) on delete set null
);

create table post_skill (
  post_id bigint not null,
  skill_id bigint not null,
  primary key (post_id, skill_id),
  index idx_post_skill_skill (skill_id),
  foreign key (post_id) references post(id) on delete cascade,
  foreign key (skill_id) references skill(id) on delete cascade
);

create table join_request (
  id bigint primary key auto_increment,
  post_id bigint not null,
  sender_id bigint not null,
  initiated_by varchar(10) not null default 'SENDER',
  note text,
  status varchar(20) not null default 'PENDING',
  reject_reason varchar(100),
  reject_note text,
  created_at datetime not null default current_timestamp,
  decided_at datetime,
  unique key uq_request_post_sender (post_id, sender_id),
  check (initiated_by in ('SENDER','OWNER')),
  check (status in ('PENDING','ACCEPTED','REJECTED','EXPIRED','WITHDRAWN')),
  foreign key (post_id) references post(id) on delete cascade,
  foreign key (sender_id) references users(id) on delete cascade
);

create table conversation (
  id bigint primary key auto_increment,
  post_id bigint,
  convo_type varchar(10) not null,
  name varchar(100),
  status varchar(10) not null default 'ACTIVE',
  created_at datetime not null default current_timestamp,
  check (convo_type in ('DIRECT','GROUP')),
  check (status in ('ACTIVE','CLOSED')),
  foreign key (post_id) references post(id) on delete cascade
);

create table conversation_member (
  conversation_id bigint not null,
  user_id bigint not null,
  joined_at datetime not null default current_timestamp,
  primary key (conversation_id, user_id),
  index idx_member_user (user_id),
  foreign key (conversation_id) references conversation(id) on delete cascade,
  foreign key (user_id) references users(id) on delete cascade
);

create table message (
  id bigint primary key auto_increment,
  conversation_id bigint not null,
  sender_id bigint not null,
  content text not null,
  sent_at datetime not null default current_timestamp,
  index idx_message_convo_time (conversation_id, sent_at),
  foreign key (conversation_id) references conversation(id) on delete cascade,
  foreign key (sender_id) references users(id) on delete cascade
);

create table notification (
  id bigint primary key auto_increment,
  user_id bigint not null,
  notif_type varchar(30) not null,
  ref_type varchar(20) not null,
  ref_id bigint not null,
  message varchar(255) not null,
  is_read boolean not null default false,
  created_at datetime not null default current_timestamp,
  index idx_notif_user_read (user_id, is_read),
  check (notif_type in ('NEW_REQUEST','REQUEST_ACCEPTED','REQUEST_REJECTED','REQUEST_EXPIRED','POST_EXPIRED','NEW_MESSAGE')),
  check (ref_type in ('POST','JOIN_REQUEST','CONVERSATION')),
  foreign key (user_id) references users(id) on delete cascade
);

show tables;


