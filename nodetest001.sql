-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Jul 07, 2026 at 05:41 PM
-- Server version: 10.4.32-MariaDB
-- PHP Version: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `nodetest`
--

-- --------------------------------------------------------

--
-- Table structure for table `cart`
--

CREATE TABLE `cart` (
  `cart_id` int(11) NOT NULL,
  `customer_id` int(11) DEFAULT NULL,
  `session_id` varchar(255) DEFAULT NULL,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `cart`
--

INSERT INTO `cart` (`cart_id`, `customer_id`, `session_id`, `created_at`, `updated_at`) VALUES
(1, 1, NULL, '2026-07-04 00:50:06', '2026-07-04 03:00:24'),
(2, 2, NULL, '2026-07-04 00:50:48', '2026-07-07 15:07:41'),
(3, 3, NULL, '2026-07-04 02:18:53', '2026-07-04 02:18:53');

-- --------------------------------------------------------

--
-- Table structure for table `cartitem`
--

CREATE TABLE `cartitem` (
  `cartitem_id` int(11) NOT NULL,
  `cart_id` int(11) NOT NULL,
  `item_id` int(11) NOT NULL,
  `quantity` int(11) NOT NULL DEFAULT 1,
  `added_at` datetime NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `customer`
--

CREATE TABLE `customer` (
  `customer_id` int(11) NOT NULL,
  `fname` varchar(255) DEFAULT NULL,
  `lname` varchar(255) DEFAULT NULL,
  `addressline` varchar(255) DEFAULT NULL,
  `zipcode` varchar(10) DEFAULT NULL,
  `phone` varchar(20) DEFAULT NULL,
  `image_path` varchar(255) DEFAULT NULL,
  `user_id` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `customer`
--

INSERT INTO `customer` (`customer_id`, `fname`, `lname`, `addressline`, `zipcode`, `phone`, `image_path`, `user_id`) VALUES
(1, NULL, NULL, NULL, NULL, NULL, NULL, 1),
(2, 'Euce', 'Lemon', 'not ph', '69699', '09696945454', 'images/doro-1783334277459-448694090.jpeg', 2),
(3, NULL, NULL, NULL, NULL, NULL, NULL, 3);

-- --------------------------------------------------------

--
-- Table structure for table `item`
--

CREATE TABLE `item` (
  `item_id` int(11) NOT NULL,
  `category` varchar(120) NOT NULL DEFAULT 'Uncategorized',
  `name` varchar(255) NOT NULL,
  `description` text DEFAULT NULL,
  `cost_price` decimal(10,2) NOT NULL,
  `sell_price` decimal(10,2) NOT NULL,
  `img_path` varchar(255) DEFAULT NULL,
  `deleted_at` datetime DEFAULT NULL,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `item`
--

INSERT INTO `item` (`item_id`, `category`, `name`, `description`, `cost_price`, `sell_price`, `img_path`, `deleted_at`, `created_at`, `updated_at`) VALUES
(1, 'Uncategorized', 'among used', NULL, 120.00, 400.00, 'images/amogiLogo-1782266081909-191357660.png', NULL, '2026-06-24 01:03:39', '2026-07-05 16:41:59'),
(2, 'Uncategorized', 'tests', NULL, 225.00, 355.00, 'images/amogi-1782268710394-798132762.png', NULL, '2026-06-24 02:38:30', '2026-06-24 02:38:52'),
(3, 'Uncategorized', 'eq', NULL, 334.00, 231.00, 'images/6kgqpd-1782269297948-627614064.png', NULL, '2026-06-24 02:48:17', '2026-06-24 02:48:17'),
(4, 'Plushie', 'cirno', 'Cirno iq move', 17.00, 45.00, '[\"images/cirno-prod-1783334079754-38172978.jpg\",\"images/FumoNerd-1783334079756-199571551.png\",\"images/fumoSnail-1783334079772-584533058.jpg\"]', NULL, '2026-07-04 01:18:59', '2026-07-06 10:34:39');

-- --------------------------------------------------------

--
-- Table structure for table `orderinfo`
--

CREATE TABLE `orderinfo` (
  `order_id` int(11) NOT NULL,
  `customer_id` int(11) NOT NULL,
  `date_placed` datetime NOT NULL,
  `date_shipped` datetime DEFAULT NULL,
  `status` varchar(30) NOT NULL DEFAULT 'pending'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `orderinfo`
--

INSERT INTO `orderinfo` (`order_id`, `customer_id`, `date_placed`, `date_shipped`, `status`) VALUES
(1, 2, '2026-07-04 00:51:20', NULL, 'pending'),
(2, 2, '2026-07-04 00:51:29', NULL, 'pending'),
(3, 2, '2026-07-04 00:51:30', NULL, 'pending'),
(4, 2, '2026-07-04 00:51:30', NULL, 'pending'),
(5, 2, '2026-07-04 00:51:30', NULL, 'pending'),
(6, 2, '2026-07-04 00:51:30', NULL, 'pending'),
(7, 2, '2026-07-04 00:51:30', NULL, 'processing'),
(8, 1, '2026-07-04 00:55:37', NULL, 'pending'),
(9, 1, '2026-07-04 01:19:19', NULL, 'pending'),
(10, 1, '2026-07-04 01:19:21', NULL, 'pending'),
(11, 1, '2026-07-04 01:19:21', NULL, 'pending'),
(12, 1, '2026-07-04 01:19:22', NULL, 'pending'),
(13, 1, '2026-07-04 01:29:31', NULL, 'pending'),
(14, 2, '2026-07-04 01:30:18', NULL, 'cancelled'),
(15, 2, '2026-07-04 01:50:16', NULL, 'cancelled'),
(16, 2, '2026-07-06 08:40:52', NULL, 'cancelled'),
(17, 2, '2026-07-06 08:41:08', '2026-07-06 10:38:41', 'completed'),
(18, 2, '2026-07-07 14:56:59', NULL, 'processing'),
(19, 2, '2026-07-07 15:04:34', '2026-07-07 15:05:10', 'completed'),
(20, 2, '2026-07-07 15:05:55', NULL, 'processing'),
(21, 2, '2026-07-07 15:07:31', NULL, 'pending'),
(22, 2, '2026-07-07 15:07:45', '2026-07-07 15:08:04', 'completed');

-- --------------------------------------------------------

--
-- Table structure for table `orderline`
--

CREATE TABLE `orderline` (
  `orderline_id` int(11) NOT NULL,
  `orderinfo_id` int(11) NOT NULL,
  `item_id` int(11) NOT NULL,
  `quantity` int(11) NOT NULL DEFAULT 1,
  `unit_price` decimal(10,2) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `orderline`
--

INSERT INTO `orderline` (`orderline_id`, `orderinfo_id`, `item_id`, `quantity`, `unit_price`) VALUES
(1, 1, 1, 2, 400.00),
(2, 1, 2, 1, 355.00),
(3, 1, 3, 1, 231.00),
(4, 2, 1, 2, 400.00),
(5, 2, 2, 1, 355.00),
(6, 2, 3, 1, 231.00),
(7, 3, 1, 2, 400.00),
(8, 3, 2, 1, 355.00),
(9, 3, 3, 1, 231.00),
(10, 4, 1, 2, 400.00),
(11, 4, 2, 1, 355.00),
(12, 4, 3, 1, 231.00),
(13, 5, 1, 2, 400.00),
(14, 5, 2, 1, 355.00),
(15, 5, 3, 1, 231.00),
(16, 6, 1, 2, 400.00),
(17, 6, 2, 1, 355.00),
(18, 6, 3, 1, 231.00),
(19, 7, 1, 2, 400.00),
(20, 7, 2, 1, 355.00),
(21, 7, 3, 1, 231.00),
(22, 8, 2, 1, 355.00),
(23, 8, 1, 1, 400.00),
(24, 9, 4, 1, 45.00),
(25, 9, 3, 1, 231.00),
(26, 9, 2, 1, 355.00),
(27, 9, 1, 1, 400.00),
(28, 10, 4, 1, 45.00),
(29, 10, 3, 1, 231.00),
(30, 10, 2, 1, 355.00),
(31, 10, 1, 1, 400.00),
(32, 11, 4, 1, 45.00),
(33, 11, 3, 1, 231.00),
(34, 11, 2, 1, 355.00),
(35, 11, 1, 1, 400.00),
(36, 12, 4, 1, 45.00),
(37, 12, 3, 1, 231.00),
(38, 12, 2, 1, 355.00),
(39, 12, 1, 1, 400.00),
(40, 13, 4, 1, 45.00),
(41, 13, 3, 1, 231.00),
(42, 13, 2, 1, 355.00),
(43, 14, 4, 1, 45.00),
(44, 14, 2, 1, 355.00),
(45, 15, 4, 1, 45.00),
(46, 15, 3, 1, 231.00),
(47, 15, 2, 1, 355.00),
(48, 16, 4, 2, 45.00),
(49, 16, 3, 1, 231.00),
(50, 16, 2, 1, 355.00),
(51, 16, 1, 1, 400.00),
(52, 17, 4, 1, 45.00),
(53, 17, 3, 1, 231.00),
(54, 17, 2, 1, 355.00),
(55, 18, 3, 1, 231.00),
(56, 18, 4, 3, 45.00),
(57, 19, 2, 1, 355.00),
(58, 19, 3, 3, 231.00),
(59, 20, 3, 3, 231.00),
(60, 21, 3, 13, 231.00),
(61, 22, 3, 13, 231.00);

-- --------------------------------------------------------

--
-- Table structure for table `stock`
--

CREATE TABLE `stock` (
  `item_id` int(11) NOT NULL,
  `quantity` int(11) NOT NULL DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `stock`
--

INSERT INTO `stock` (`item_id`, `quantity`) VALUES
(1, 19),
(2, 235),
(3, 13),
(4, 33);

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `id` int(11) NOT NULL,
  `name` varchar(255) NOT NULL,
  `email` varchar(255) NOT NULL,
  `password` varchar(255) NOT NULL,
  `token` text DEFAULT NULL,
  `role` varchar(30) NOT NULL DEFAULT 'customer',
  `deleted_at` datetime DEFAULT NULL,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`id`, `name`, `email`, `password`, `token`, `role`, `deleted_at`, `created_at`, `updated_at`) VALUES
(1, 'ns', 'nodeshop@shop.com', '$2b$10$i5y1FH8kP.WdMZIqNAkRg.PgS.feCW0C0YZ9B2vjsJ9c6btaqTXH2', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwiaWF0IjoxNzgzNDM4NzM3LCJleHAiOjE3ODM1MjUxMzd9.SiAgO_uS9PORLvTLKDRMfcfJzfGP8YOZ_-MIzNiOXsk', 'admin', NULL, '2026-06-23 20:01:25', '2026-07-07 15:38:57'),
(2, 'user1', 'nodeuser@shop.com', '$2b$10$v2l9PPOiDvTEthP13UxmmOXbRQ765uiZ.5uXAkEAzpRmrjEpja2De', NULL, 'customer', NULL, '2026-06-24 01:38:52', '2026-07-07 15:38:53'),
(3, 'test', 'test@node.com', '$2b$10$1O3UgezEro2v6a92lDyGneLsRXybL4SnkwAC3QcmIF57tFlA9iwoq', NULL, 'admin', NULL, '2026-06-24 02:36:40', '2026-07-05 16:42:21');

--
-- Indexes for dumped tables
--

--
-- Indexes for table `cart`
--
ALTER TABLE `cart`
  ADD PRIMARY KEY (`cart_id`),
  ADD KEY `customer_id` (`customer_id`);

--
-- Indexes for table `cartitem`
--
ALTER TABLE `cartitem`
  ADD PRIMARY KEY (`cartitem_id`),
  ADD KEY `cart_id` (`cart_id`),
  ADD KEY `item_id` (`item_id`);

--
-- Indexes for table `customer`
--
ALTER TABLE `customer`
  ADD PRIMARY KEY (`customer_id`),
  ADD KEY `user_id` (`user_id`);

--
-- Indexes for table `item`
--
ALTER TABLE `item`
  ADD PRIMARY KEY (`item_id`);

--
-- Indexes for table `orderinfo`
--
ALTER TABLE `orderinfo`
  ADD PRIMARY KEY (`order_id`),
  ADD KEY `customer_id` (`customer_id`);

--
-- Indexes for table `orderline`
--
ALTER TABLE `orderline`
  ADD PRIMARY KEY (`orderline_id`),
  ADD KEY `orderinfo_id` (`orderinfo_id`),
  ADD KEY `item_id` (`item_id`);

--
-- Indexes for table `stock`
--
ALTER TABLE `stock`
  ADD PRIMARY KEY (`item_id`);

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `email` (`email`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `cart`
--
ALTER TABLE `cart`
  MODIFY `cart_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `cartitem`
--
ALTER TABLE `cartitem`
  MODIFY `cartitem_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=36;

--
-- AUTO_INCREMENT for table `customer`
--
ALTER TABLE `customer`
  MODIFY `customer_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `item`
--
ALTER TABLE `item`
  MODIFY `item_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT for table `orderinfo`
--
ALTER TABLE `orderinfo`
  MODIFY `order_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=23;

--
-- AUTO_INCREMENT for table `orderline`
--
ALTER TABLE `orderline`
  MODIFY `orderline_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=62;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `cart`
--
ALTER TABLE `cart`
  ADD CONSTRAINT `cart_ibfk_1` FOREIGN KEY (`customer_id`) REFERENCES `customer` (`customer_id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `cartitem`
--
ALTER TABLE `cartitem`
  ADD CONSTRAINT `cartitem_ibfk_1` FOREIGN KEY (`cart_id`) REFERENCES `cart` (`cart_id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `cartitem_ibfk_2` FOREIGN KEY (`item_id`) REFERENCES `item` (`item_id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `customer`
--
ALTER TABLE `customer`
  ADD CONSTRAINT `customer_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `orderinfo`
--
ALTER TABLE `orderinfo`
  ADD CONSTRAINT `orderinfo_ibfk_1` FOREIGN KEY (`customer_id`) REFERENCES `customer` (`customer_id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `orderline`
--
ALTER TABLE `orderline`
  ADD CONSTRAINT `orderline_ibfk_1` FOREIGN KEY (`orderinfo_id`) REFERENCES `orderinfo` (`order_id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `orderline_ibfk_2` FOREIGN KEY (`item_id`) REFERENCES `item` (`item_id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `stock`
--
ALTER TABLE `stock`
  ADD CONSTRAINT `stock_ibfk_1` FOREIGN KEY (`item_id`) REFERENCES `item` (`item_id`) ON DELETE CASCADE ON UPDATE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
