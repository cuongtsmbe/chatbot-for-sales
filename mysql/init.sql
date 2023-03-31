CREATE DATABASE chatZi;

use chatZi;


CREATE TABLE `Buyer` (
  `buyer_id` varchar(255) NOT NULL,
  `facebook_id` varchar(255) NOT NULL,
  `fanpage_id` varchar(255) NOT NULL,
  `profile_name` varchar(255) NOT NULL,
  `profile_pic` varchar(255) NOT NULL,
  `active` tinyint(1) NOT NULL,
  `summary_text` text NOT NULL,
  `modified_user_date` date NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;



CREATE TABLE `Fanpage` (
  `fanpage_id` varchar(255) NOT NULL,
  `key_fanpage` varchar(255) NOT NULL,
  `key_open_ai` varchar(255) NOT NULL,
  `name` varchar(255) NOT NULL,
  `active` tinyint(1) NOT NULL,
  `user_id` varchar(255) NOT NULL,
  `payment_due_date` date NOT NULL,
  `status` int(1) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;


CREATE TABLE `Limit_fanpage` (
  `limit_fanpage_id` varchar(255) NOT NULL,
  `count` int(3) NOT NULL,
  `description` text NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;



INSERT INTO `Limit_fanpage` (`limit_fanpage_id`, `count`, `description`) VALUES
('5db74c5d-a94c-48fb-9d2f-48d9f5682c47', 3, 'them value');


CREATE TABLE `Order` (
  `order_id` varchar(255) NOT NULL,
  `fanpage_id` varchar(255) NOT NULL,
  `buyer_id` varchar(255) NOT NULL,
  `content` text NOT NULL,
  `created_date` datetime NOT NULL,
  `modified_date` datetime NOT NULL,
  `status` int(1) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;


CREATE TABLE `Prompt` (
  `prompt_id` varchar(255) NOT NULL,
  `active` tinyint(1) NOT NULL,
  `content` text NOT NULL,
  `created_date` datetime NOT NULL,
  `modified_date` datetime NOT NULL,
  `fanpage_id` varchar(255) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;



CREATE TABLE `User` (
  `user_id` varchar(255) NOT NULL,
  `user_name` varchar(255) NOT NULL,
  `phone_number` varchar(255) NOT NULL,
  `address` varchar(255) NOT NULL,
  `role_type` varchar(10) NOT NULL,
  `email` varchar(255) NOT NULL,
  `password` varchar(255) NOT NULL,
  `status` int(1) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;



INSERT INTO `User` (`user_id`, `user_name`, `phone_number`, `address`, `role_type`, `email`, `password`, `status`) VALUES
('22cff419-2d3b-4204-b077-45b4f119a3c3', 'root', '0349612646', 'Doi 1 ,Thuong Xa, Hai Thuong, Hai Lang, Quang Tri', 'root', 'phanhuucuong05012001@gmail.com', '05c00660b1a2ec04881604901d42f2c8e73abfd5a2cc3a076d746332d701b48f', 1),
('83c6ce04-88fd-42f4-87ed-7ad8e18b4144', 'admin', '0349612649', 'hai lang, quang tri', 'admin', 'cuong@gmail.com', '65d8a6dad63f365a4d9b3b2f2fcbd3b85d0bb8206717b830e791e295221324c0', 0);


ALTER TABLE `Buyer`
  ADD PRIMARY KEY (`buyer_id`),
  ADD KEY `fanpage_id` (`fanpage_id`);


ALTER TABLE `Fanpage`
  ADD PRIMARY KEY (`fanpage_id`),
  ADD KEY `user_id` (`user_id`);

ALTER TABLE `Limit_fanpage`
  ADD PRIMARY KEY (`limit_fanpage_id`);

ALTER TABLE `Order`
  ADD PRIMARY KEY (`order_id`),
  ADD KEY `fanpage_id` (`fanpage_id`);

ALTER TABLE `Prompt`
  ADD PRIMARY KEY (`prompt_id`),
  ADD KEY `fanpage_id` (`fanpage_id`);

ALTER TABLE `User`
  ADD PRIMARY KEY (`user_id`);

ALTER TABLE `Buyer`
  ADD CONSTRAINT `Buyer_ibfk_1` FOREIGN KEY (`fanpage_id`) REFERENCES `Fanpage` (`fanpage_id`) ON DELETE NO ACTION ON UPDATE NO ACTION;

ALTER TABLE `Fanpage`
  ADD CONSTRAINT `Fanpage_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `User` (`user_id`) ON DELETE NO ACTION ON UPDATE NO ACTION;


ALTER TABLE `Order`
  ADD CONSTRAINT `Order_ibfk_1` FOREIGN KEY (`fanpage_id`) REFERENCES `Fanpage` (`fanpage_id`) ON DELETE NO ACTION ON UPDATE NO ACTION;

ALTER TABLE `Prompt`
  ADD CONSTRAINT `Prompt_ibfk_1` FOREIGN KEY (`fanpage_id`) REFERENCES `Fanpage` (`fanpage_id`) ON DELETE NO ACTION ON UPDATE NO ACTION;
COMMIT;