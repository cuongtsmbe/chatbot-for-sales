CREATE DATABASE chatZi;

use chatZi;


CREATE TABLE `Buyer` (
  `buyer_id` varchar(255) NOT NULL,
  `facebook_id` varchar(255) NOT NULL,
  `fanpage_id` varchar(255) NOT NULL,
  `active` tinyint(1) NOT NULL,
  `summary_text` text NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;

INSERT INTO `Buyer` (`buyer_id`, `facebook_id`, `fanpage_id`, `active`, `summary_text`) VALUES
('22cff419-2d3b-4204-b077-45b4f119a3c7', '3215643513', '16546546687', 0, 'gia su ban la chat'),
('22cff419-2d3b-4204-b077-45b4f119a3f3', '3215643512', '16546546687', 1, 'gia su ban la chat');

CREATE TABLE `Conversation` (
  `conversation_id` varchar(255) NOT NULL,
  `fanpage_id` varchar(255) NOT NULL,
  `sender_id` varchar(255) NOT NULL,
  `message` text NOT NULL,
  `type` varchar(10) NOT NULL,
  `create_time` datetime NOT NULL
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



INSERT INTO `Fanpage` (`fanpage_id`, `key_fanpage`, `key_open_ai`, `name`, `active`, `user_id`, `payment_due_date`, `status`) VALUES
('1', '987644', '159335', 'TQG', 0, '22cff419-2d3b-4204-b077-45b4f119a3c3', '2023-10-02', 0),
('100000321516', 'updatenaow', 'update noew', 'TQG', 0, '22cff419-2d3b-4204-b077-45b4f119a3c3', '2023-10-02', 0),
('1000003215165', 'k54d8dsf3dsf82ww4fg8hj5dfajhukiRyenkoqhIlPP,lspskssloaKKuusa', 'Kueasdnk009ekmlkdsfnsd', 'ban hang online', 1, '22cff419-2d3b-4204-b077-45b4f119a3c3', '2023-10-02', 1),
('134', 'k54d8dsf3dsf82ww4fg8hj5dfajhukiRyenkoqhIlPP,lspskssloaKKuusa', 'Kueasdnk009ekmlkdsfnsd', 'ban hang online', 0, '22cff419-2d3b-4204-b077-45b4f119a3c3', '2023-10-02', 1),
('134s', 'k54d8dsf3dsf82ww4fg8hj5dfajhukiRyenkoqhIlPP,lspskssloaKKuusa', 'Kueasdnk009ekmlkdsfnsd', 'ban hang online', 0, '22cff419-2d3b-4204-b077-45b4f119a3c3', '2023-10-02', 1),
('1654', 'as', 'as', 'TQG', 0, '22cff419-2d3b-4204-b077-45b4f119a3c3', '2023-10-02', 2),
('1654654', 'k54d8dsf3dsf82ww4fg8hj5dfajhukiRyenkoqhIlPP,lspskssloaKKuusa', 'Kueasdnk009ekmlkdsfnsd', 'ban hang online', 0, '22cff419-2d3b-4204-b077-45b4f119a3c3', '2023-10-02', 1),
('16546546687', 'k54d8dsf3dsf82ww4fg8hj5dfajhukiRyenkoqhIlPP,lspskssloaKKuusa', 'Kueasdnk009ekmlkdsfnsd', 'ban hang online', 0, '22cff419-2d3b-4204-b077-45b4f119a3c3', '2023-10-02', 1),
('165465466878', 'k54d8dsf3dsf82ww4fg8hj5dfajhukiRyenkoqhIlPP,lspskssloaKKuusa', 'Kueasdnk009ekmlkdsfnsd', 'ban hang online', 1, '22cff419-2d3b-4204-b077-45b4f119a3c3', '2023-10-02', 1),
('2', '55555', '3444', 'TQG', 0, '22cff419-2d3b-4204-b077-45b4f119a3c3', '2023-10-02', 2);

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


INSERT INTO `Order` (`order_id`, `fanpage_id`, `buyer_id`, `content`, `created_date`, `modified_date`, `status`) VALUES
('075ed19d-c4dd-4da0-8077-96ec469d948b', '100000321516', '32154', '[donhang] 3 quan ngan', '2023-03-19 17:27:30', '2023-03-19 10:35:49', 1),
('2104c5e1-ca31-4278-bc29-2c268b518add', '100000321516', '32154', '[donhang] 12 ao thun', '2023-03-19 10:30:45', '2023-03-19 10:30:45', 1),
('70319f88-ad94-4a02-b8b1-adc545e676ec', '100000321516', '32154', '[donhang] 3 quan ngan', '2023-03-19 10:34:02', '2023-03-19 10:34:02', 1),
('d8f20e3b-f062-4c31-bc9e-cd0333c8b4d4', '100000321516', '32154', '[donhang] 3 quan ngan', '2023-03-19 10:35:10', '2023-03-19 10:35:10', 1);


CREATE TABLE `Prompt` (
  `prompt_id` varchar(255) NOT NULL,
  `active` tinyint(1) NOT NULL,
  `content` text NOT NULL,
  `created_date` datetime NOT NULL,
  `modified_date` datetime NOT NULL,
  `fanpage_id` varchar(255) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;


INSERT INTO `Prompt` (`prompt_id`, `active`, `content`, `created_date`, `modified_date`, `fanpage_id`) VALUES
('05f52ce2-d754-43a4-9ea8-1865becf2c73', 0, '\"prompt add value\"', '2023-03-18 16:03:22', '2023-03-18 16:43:02', '100000321516');


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

ALTER TABLE `Conversation`
ADD PRIMARY KEY (`conversation_id`),
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

ALTER TABLE `Conversation`
  ADD CONSTRAINT `Conversation_ibfk_1` FOREIGN KEY (`fanpage_id`) REFERENCES `Fanpage` (`fanpage_id`) ON DELETE NO ACTION ON UPDATE NO ACTION;


ALTER TABLE `Fanpage`
  ADD CONSTRAINT `Fanpage_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `User` (`user_id`) ON DELETE NO ACTION ON UPDATE NO ACTION;


ALTER TABLE `Order`
  ADD CONSTRAINT `Order_ibfk_1` FOREIGN KEY (`fanpage_id`) REFERENCES `Fanpage` (`fanpage_id`) ON DELETE NO ACTION ON UPDATE NO ACTION;

ALTER TABLE `Prompt`
  ADD CONSTRAINT `Prompt_ibfk_1` FOREIGN KEY (`fanpage_id`) REFERENCES `Fanpage` (`fanpage_id`) ON DELETE NO ACTION ON UPDATE NO ACTION;
COMMIT;