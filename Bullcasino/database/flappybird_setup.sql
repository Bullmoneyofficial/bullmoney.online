-- ============================================================================
-- Flappy Bird Database Setup
-- ============================================================================
-- Run this SQL script to manually create the flappy_bird table
-- Alternative to running: php artisan migrate
-- ============================================================================

-- Create flappy_bird table
CREATE TABLE IF NOT EXISTS `flappy_bird` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `user_id` bigint(20) unsigned NOT NULL,
  `bet` decimal(10,2) NOT NULL,
  `multiplier` decimal(10,2) NOT NULL DEFAULT '1.00',
  `score` int(11) NOT NULL DEFAULT '0',
  `won` tinyint(1) NOT NULL DEFAULT '0',
  `win_amount` decimal(10,2) NOT NULL DEFAULT '0.00',
  `status` varchar(20) NOT NULL DEFAULT 'playing',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `flappy_bird_user_id_index` (`user_id`),
  KEY `flappy_bird_created_at_index` (`created_at`),
  KEY `flappy_bird_user_id_score_index` (`user_id`,`score`),
  KEY `flappy_bird_user_id_won_index` (`user_id`,`won`),
  CONSTRAINT `flappy_bird_user_id_foreign` 
    FOREIGN KEY (`user_id`) 
    REFERENCES `users` (`id`) 
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Add flappybird_enabled column to settings table
-- Check if column exists first to avoid errors on re-run
SET @col_exists = (
  SELECT COUNT(*) 
  FROM INFORMATION_SCHEMA.COLUMNS 
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'settings' 
    AND COLUMN_NAME = 'flappybird_enabled'
);

SET @query = IF(
  @col_exists = 0,
  'ALTER TABLE `settings` ADD COLUMN `flappybird_enabled` TINYINT(1) NOT NULL DEFAULT 1 AFTER `plinko_enabled`',
  'SELECT "Column flappybird_enabled already exists" AS Info'
);

PREPARE stmt FROM @query;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Enable the game by default
UPDATE `settings` SET `flappybird_enabled` = 1 WHERE `id` = 1;

-- ============================================================================
-- Verification Queries
-- ============================================================================

-- Check if table was created
SELECT 
  TABLE_NAME, 
  TABLE_ROWS, 
  CREATE_TIME 
FROM 
  INFORMATION_SCHEMA.TABLES 
WHERE 
  TABLE_SCHEMA = DATABASE()
  AND TABLE_NAME = 'flappy_bird';

-- Check table structure
DESCRIBE `flappy_bird`;

-- Check indexes
SHOW INDEX FROM `flappy_bird`;

-- Check settings column
SELECT `flappybird_enabled` FROM `settings` WHERE `id` = 1;

-- ============================================================================
-- Sample Queries for Testing
-- ============================================================================

-- Insert test game (replace user_id with actual user)
-- INSERT INTO `flappy_bird` 
--   (`user_id`, `bet`, `multiplier`, `score`, `won`, `win_amount`, `status`, `created_at`)
-- VALUES 
--   (1, 10.00, 2.50, 15, 1, 25.00, 'win', NOW());

-- Get recent games for user
-- SELECT * FROM `flappy_bird` 
-- WHERE `user_id` = 1 
-- ORDER BY `created_at` DESC 
-- LIMIT 10;

-- Get today's leaderboard
-- SELECT 
--   u.username,
--   MAX(fb.score) as highest_score,
--   MAX(fb.multiplier) as best_multiplier,
--   COUNT(*) as games_played
-- FROM `flappy_bird` fb
-- JOIN `users` u ON fb.user_id = u.id
-- WHERE DATE(fb.created_at) = CURDATE()
-- GROUP BY u.id, u.username
-- ORDER BY highest_score DESC
-- LIMIT 10;

-- Get user statistics
-- SELECT 
--   COUNT(*) as total_games,
--   SUM(CASE WHEN won = 1 THEN 1 ELSE 0 END) as total_wins,
--   SUM(CASE WHEN won = 0 THEN 1 ELSE 0 END) as total_losses,
--   MAX(score) as highest_score,
--   MAX(multiplier) as highest_multiplier,
--   SUM(bet) as total_wagered,
--   SUM(win_amount) as total_won,
--   ROUND((SUM(CASE WHEN won = 1 THEN 1 ELSE 0 END) / COUNT(*)) * 100, 2) as win_rate
-- FROM `flappy_bird`
-- WHERE `user_id` = 1;

-- ============================================================================
-- Cleanup Queries (Use with caution!)
-- ============================================================================

-- Drop table (WARNING: This deletes all data!)
-- DROP TABLE IF EXISTS `flappy_bird`;

-- Remove settings column
-- ALTER TABLE `settings` DROP COLUMN `flappybird_enabled`;

-- Delete all games for a user
-- DELETE FROM `flappy_bird` WHERE `user_id` = 1;

-- Delete old games (older than 30 days)
-- DELETE FROM `flappy_bird` 
-- WHERE `created_at` < DATE_SUB(NOW(), INTERVAL 30 DAY);

-- ============================================================================
-- Database Maintenance
-- ============================================================================

-- Optimize table (run periodically for performance)
-- OPTIMIZE TABLE `flappy_bird`;

-- Analyze table (update statistics)
-- ANALYZE TABLE `flappy_bird`;

-- Check table integrity
-- CHECK TABLE `flappy_bird`;

-- Repair table if needed
-- REPAIR TABLE `flappy_bird`;

-- ============================================================================
-- Indexes Explanation
-- ============================================================================

-- PRIMARY KEY (id): Fast lookups by game ID
-- user_id_index: Fast queries for user's games
-- created_at_index: Fast date-based queries (leaderboards)
-- user_id_score_index: Composite index for user leaderboards
-- user_id_won_index: Composite index for win/loss statistics

-- ============================================================================
-- Installation Complete!
-- ============================================================================
-- The flappy_bird table is now ready to use.
-- Game can be accessed at: /flappybird
-- API endpoints available at: /flappybird/{start,result,leaderboard,stats,history}
-- ============================================================================
