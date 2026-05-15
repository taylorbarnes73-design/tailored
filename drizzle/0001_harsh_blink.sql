CREATE TABLE `user_files` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`fileKey` varchar(512) NOT NULL,
	`url` text NOT NULL,
	`filename` varchar(255) NOT NULL,
	`mimeType` varchar(128) NOT NULL,
	`size` bigint NOT NULL,
	`category` enum('body-scan','profile-photo','measurement','general') NOT NULL DEFAULT 'general',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `user_files_id` PRIMARY KEY(`id`)
);
