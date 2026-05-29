-- =============================================================================
-- BookBoss — Consolidated Schema
-- Generated: 2026-05-28
-- Single idempotent script covering every table. Run once on a clean database
-- or any database that has never had migrations applied. All ALTER-based column
-- additions from ad-hoc migration scripts have been folded directly into the
-- CREATE TABLE statements below.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- users
-- Columns added across migrations:
--   privacy_settings  (add_privacy_settings.js)
--   role              (add_reading_lists.js)
--   permissions       (add_reading_lists.js)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `users` (
    `id`               INT            NOT NULL AUTO_INCREMENT,
    `username`         VARCHAR(50)    NOT NULL,
    `password`         VARCHAR(255)   NOT NULL,
    `is_admin`         BOOLEAN        NOT NULL DEFAULT FALSE,
    `privacy_settings` JSON           DEFAULT NULL   COMMENT 'User privacy preferences (share_library, library_name, etc.)',
    `role`             VARCHAR(20)    DEFAULT 'viewer' COMMENT 'User role: admin, editor, viewer',
    `permissions`      JSON           DEFAULT NULL   COMMENT 'Custom permissions for the user',
    PRIMARY KEY (`id`),
    UNIQUE KEY `uq_username` (`username`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Default admin user (password: admin — bcrypt hash)
INSERT IGNORE INTO `users` (`username`, `password`, `is_admin`)
VALUES ('admin', '$2b$12$4yY/5Cpxenb2XSSN12umfOyZKt4LaFoGd.ZorV6QQ2Fk8VzVp3XHa', TRUE);

-- ---------------------------------------------------------------------------
-- books
-- Columns added across migrations:
--   owner_id          (add_book_ownership.js)
--   notes             (add_notes_field.js)
--   current_page      (add_progress_tracking.sql)
--   progress_percentage (add_progress_tracking.sql)
--   last_read_at      (add_progress_tracking.sql)
--   physical_format   (add_enhanced_metadata.js)
--   book_condition    (add_enhanced_metadata.js)
--   is_signed         (add_enhanced_metadata.js)
--   has_bonus_chapters (add_enhanced_metadata.js)
--   edition_type      (add_enhanced_metadata.js)
--   edge_type         (add_enhanced_metadata.js)
--   binding_details   (add_enhanced_metadata.js)
--   series_order      (add_series_order.js)
--   duration          (absController.ts — Audiobook duration)
--   library           (bookController.ts — renameLibrary / deleteLibrary)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `books` (
    `id`                  INT            NOT NULL AUTO_INCREMENT,
    `owner_id`            INT            NOT NULL,
    `title`               VARCHAR(255)   NOT NULL,
    `author`              VARCHAR(255)   DEFAULT NULL,
    `isbn`                VARCHAR(20)    DEFAULT NULL,
    `cover_url`           TEXT           DEFAULT NULL,
    `cover_image_path`    VARCHAR(255)   DEFAULT NULL,
    `library`             VARCHAR(50)    DEFAULT 'Main Library',
    `added_at`            TIMESTAMP      NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `categories`          JSON           DEFAULT NULL,
    `file_path`           VARCHAR(255)   DEFAULT NULL,
    `epub_file_path`      VARCHAR(255)   DEFAULT NULL,
    `format`              VARCHAR(50)    DEFAULT NULL,
    `binding_type`        VARCHAR(50)    DEFAULT NULL,
    `descriptors`         JSON           DEFAULT NULL,
    `series`              VARCHAR(255)   DEFAULT NULL,
    `series_index`        FLOAT          DEFAULT NULL,
    `series_order`        INT            DEFAULT NULL,
    `publisher`           VARCHAR(255)   DEFAULT NULL,
    `language`            VARCHAR(10)    DEFAULT 'en',
    `description`         TEXT           DEFAULT NULL,
    `shelf`               VARCHAR(255)   DEFAULT NULL,
    `status`              VARCHAR(50)    DEFAULT 'Not Started',
    `rating`              FLOAT          DEFAULT 0,
    `page_count`          INT            DEFAULT 0,
    `publication_date`    VARCHAR(20)    DEFAULT NULL,
    `is_loaned`           BOOLEAN        NOT NULL DEFAULT FALSE,
    `borrower_name`       VARCHAR(255)   DEFAULT NULL,
    `loan_date`           DATETIME       DEFAULT NULL,
    `due_date`            DATETIME       DEFAULT NULL,
    `notes`               TEXT           DEFAULT NULL   COMMENT 'User notes and reviews for the book',
    `current_page`        INT            DEFAULT 0,
    `progress_percentage` DECIMAL(5,2)   DEFAULT 0.00,
    `last_read_at`        DATETIME       DEFAULT NULL,
    `physical_format`     VARCHAR(50)    DEFAULT NULL   COMMENT 'Hardback, Paperback, Mass Market, Board Book, Leather Bound',
    `book_condition`      VARCHAR(20)    DEFAULT NULL   COMMENT 'Excellent, Good, Fair, Poor',
    `is_signed`           BOOLEAN        NOT NULL DEFAULT FALSE,
    `has_bonus_chapters`  BOOLEAN        NOT NULL DEFAULT FALSE,
    `edition_type`        VARCHAR(50)    DEFAULT NULL   COMMENT 'Limited Edition, First Edition, etc.',
    `edge_type`           VARCHAR(50)    DEFAULT NULL   COMMENT 'Gilded, Fore-edge Painted, Sprayed, Hidden Fore-edge',
    `binding_details`     TEXT           DEFAULT NULL   COMMENT 'Additional binding and decorative details',
    `duration`            DECIMAL(10,2)  DEFAULT NULL   COMMENT 'Audiobook duration in seconds',
    PRIMARY KEY (`id`),
    KEY `idx_owner_id` (`owner_id`),
    FULLTEXT KEY `ft_search` (`title`, `author`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------------
-- settings
-- Key/value store for application-wide settings.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `settings` (
    `key`   VARCHAR(50)  NOT NULL,
    `value` TEXT         DEFAULT NULL,
    PRIMARY KEY (`key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Default application settings
INSERT IGNORE INTO `settings` (`key`, `value`) VALUES
    ('app_title',          'BookBoss'),
    ('theme',              'light'),
    ('allow_registration', 'true');

-- ---------------------------------------------------------------------------
-- shelves
-- Columns added across migrations:
--   user_id (001-initial-schema.sql adds it; create_shelves.js original did not)
-- The authoritative form (001-initial-schema.sql + shelfController.ts) includes user_id.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `shelves` (
    `id`          INT           NOT NULL AUTO_INCREMENT,
    `user_id`     INT           NOT NULL,
    `name`        VARCHAR(100)  NOT NULL,
    `description` TEXT          DEFAULT NULL,
    `created_at`  TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at`  TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    KEY `idx_user_id` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------------
-- shelf_books
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `shelf_books` (
    `shelf_id`  INT        NOT NULL,
    `book_id`   INT        NOT NULL,
    `added_at`  TIMESTAMP  NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`shelf_id`, `book_id`),
    KEY `idx_book_id` (`book_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------------
-- user_books
-- Per-user reading progress/status for books (shared-library model).
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `user_books` (
    `user_id`   INT          NOT NULL,
    `book_id`   INT          NOT NULL,
    `status`    VARCHAR(50)  NOT NULL DEFAULT 'Not Started' COMMENT 'Not Started, In Progress, Completed, DNF',
    `progress`  INT          NOT NULL DEFAULT 0             COMMENT 'Current page or percentage',
    `rating`    INT          NOT NULL DEFAULT 0,
    `notes`     TEXT         DEFAULT NULL,
    `last_read` TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`user_id`, `book_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------------
-- loans
-- Tracks books lent out by a user.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `loans` (
    `id`            INT           NOT NULL AUTO_INCREMENT,
    `user_id`       INT           NOT NULL,
    `book_id`       INT           NOT NULL,
    `borrower_name` VARCHAR(255)  NOT NULL,
    `loan_date`     DATE          DEFAULT NULL,
    `due_date`      DATE          DEFAULT NULL,
    `return_date`   DATE          DEFAULT NULL,
    `notes`         TEXT          DEFAULT NULL,
    PRIMARY KEY (`id`),
    KEY `idx_user_id`  (`user_id`),
    KEY `idx_book_id`  (`book_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------------
-- reading_lists
-- Named lists of books curated by a user.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `reading_lists` (
    `id`          INT           NOT NULL AUTO_INCREMENT,
    `user_id`     INT           NOT NULL,
    `name`        VARCHAR(100)  NOT NULL,
    `description` TEXT          DEFAULT NULL,
    `is_public`   BOOLEAN       NOT NULL DEFAULT FALSE,
    `created_at`  TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at`  TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    KEY `idx_user_id` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------------
-- reading_list_books
-- Junction table: books inside a reading list.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `reading_list_books` (
    `id`       INT        NOT NULL AUTO_INCREMENT,
    `list_id`  INT        NOT NULL,
    `book_id`  INT        NOT NULL,
    `added_at` TIMESTAMP  NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `notes`    TEXT       DEFAULT NULL,
    PRIMARY KEY (`id`),
    UNIQUE KEY `uq_list_book`  (`list_id`, `book_id`),
    KEY        `idx_list_id`   (`list_id`),
    KEY        `idx_book_id`   (`book_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------------
-- reading_sessions
-- Tracks individual timed reading sessions per user/book.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `reading_sessions` (
    `id`               INT        NOT NULL AUTO_INCREMENT,
    `user_id`          INT        NOT NULL,
    `book_id`          INT        NOT NULL,
    `started_at`       TIMESTAMP  NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `ended_at`         TIMESTAMP  DEFAULT NULL,
    `duration_minutes` INT        NOT NULL DEFAULT 0,
    `pages_read`       INT        NOT NULL DEFAULT 0,
    PRIMARY KEY (`id`),
    KEY `idx_user_book`  (`user_id`, `book_id`),
    KEY `idx_started_at` (`started_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------------
-- saved_searches
-- User-saved search query parameters.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `saved_searches` (
    `id`           INT           NOT NULL AUTO_INCREMENT,
    `user_id`      INT           NOT NULL,
    `name`         VARCHAR(100)  NOT NULL,
    `query_params` JSON          NOT NULL,
    `created_at`   TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    KEY `idx_user_id` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------------
-- book_photos
-- Photo gallery for physical books.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `book_photos` (
    `id`          INT           NOT NULL AUTO_INCREMENT,
    `book_id`     INT           NOT NULL,
    `photo_path`  VARCHAR(255)  NOT NULL,
    `photo_type`  VARCHAR(50)   DEFAULT NULL  COMMENT 'cover, spine, edges, special',
    `description` TEXT          DEFAULT NULL,
    `tags`        JSON          DEFAULT NULL,
    `uploaded_at` TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    KEY `idx_book_id` (`book_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------------
-- audiobookshelf_servers
-- User-registered Audiobookshelf server connections.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `audiobookshelf_servers` (
    `id`          INT           NOT NULL AUTO_INCREMENT,
    `user_id`     INT           NOT NULL,
    `server_name` VARCHAR(255)  NOT NULL,
    `server_url`  VARCHAR(500)  NOT NULL,
    `api_token`   TEXT          DEFAULT NULL,
    `is_active`   BOOLEAN       NOT NULL DEFAULT TRUE,
    `created_at`  DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at`  DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    KEY `idx_user_id` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------------
-- abs_book_mappings
-- Maps a BookBoss book to an item on an Audiobookshelf server.
-- Columns added: github_issue_number / github_issue_url not here — those are
-- on feature_requests (see 003-git-sync.js).
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `abs_book_mappings` (
    `id`                  INT           NOT NULL AUTO_INCREMENT,
    `book_id`             INT           NOT NULL,
    `abs_server_id`       INT           NOT NULL,
    `abs_library_item_id` VARCHAR(255)  NOT NULL,
    `abs_library_id`      VARCHAR(255)  DEFAULT NULL,
    `last_synced`         DATETIME      DEFAULT NULL,
    PRIMARY KEY (`id`),
    UNIQUE KEY `uq_book_mapping` (`book_id`, `abs_server_id`),
    KEY `idx_abs_library_item` (`abs_library_item_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------------
-- abs_listening_progress
-- Synced playback progress from an Audiobookshelf server.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `abs_listening_progress` (
    `id`            INT             NOT NULL AUTO_INCREMENT,
    `user_id`       INT             NOT NULL,
    `book_id`       INT             NOT NULL,
    `abs_server_id` INT             NOT NULL,
    `current_time`  DECIMAL(10,2)   DEFAULT NULL,
    `duration`      DECIMAL(10,2)   DEFAULT NULL,
    `progress`      DECIMAL(5,4)    DEFAULT NULL,
    `is_finished`   BOOLEAN         NOT NULL DEFAULT FALSE,
    `last_update`   DATETIME        DEFAULT NULL,
    PRIMARY KEY (`id`),
    KEY `idx_user_book`  (`user_id`, `book_id`),
    KEY `idx_server`     (`abs_server_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------------
-- feature_requests
-- User-submitted feature requests and bug reports.
-- Columns added across migrations:
--   type              (002-add-feature-type.sql)
--   admin_note        (featureController.ts — updateFeature)
--   github_issue_number (003-git-sync.js)
--   github_issue_url  (003-git-sync.js)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `feature_requests` (
    `id`                  INT           NOT NULL AUTO_INCREMENT,
    `user_id`             INT           NOT NULL,
    `title`               VARCHAR(255)  NOT NULL,
    `description`         TEXT          DEFAULT NULL,
    `type`                VARCHAR(50)   NOT NULL DEFAULT 'feature' COMMENT 'feature or bug',
    `status`              VARCHAR(50)   NOT NULL DEFAULT 'open'    COMMENT 'open, planned, in_progress, completed, rejected',
    `admin_note`          TEXT          DEFAULT NULL,
    `github_issue_number` INT           DEFAULT NULL,
    `github_issue_url`    VARCHAR(500)  DEFAULT NULL,
    `created_at`          TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at`          TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    KEY `idx_user_id`   (`user_id`),
    KEY `idx_status`    (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------------
-- feature_votes
-- One vote per user per feature request (toggle).
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `feature_votes` (
    `user_id`            INT        NOT NULL,
    `feature_request_id` INT        NOT NULL,
    `created_at`         TIMESTAMP  NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`user_id`, `feature_request_id`),
    KEY `idx_feature_request_id` (`feature_request_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------------
-- notifications
-- System and admin-created notifications (global or targeted).
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `notifications` (
    `id`              INT           NOT NULL AUTO_INCREMENT,
    `title`           VARCHAR(255)  NOT NULL,
    `message`         TEXT          NOT NULL,
    `type`            VARCHAR(50)   NOT NULL DEFAULT 'info',
    `is_global`       BOOLEAN       NOT NULL DEFAULT FALSE,
    `target_user_id`  INT           DEFAULT NULL,
    `requires_ack`    BOOLEAN       NOT NULL DEFAULT FALSE,
    `scheduled_for`   DATETIME      DEFAULT NULL,
    `expires_at`      DATETIME      DEFAULT NULL,
    `created_at`      TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `created_by`      INT           DEFAULT NULL,
    PRIMARY KEY (`id`),
    KEY `idx_target_user`  (`target_user_id`),
    KEY `idx_created_by`   (`created_by`),
    KEY `idx_is_global`    (`is_global`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------------
-- notification_acknowledgements
-- Records which users have acknowledged which notifications.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `notification_acknowledgements` (
    `id`              INT        NOT NULL AUTO_INCREMENT,
    `notification_id` INT        NOT NULL,
    `user_id`         INT        NOT NULL,
    `acknowledged_at` TIMESTAMP  NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    UNIQUE KEY `uq_ack`             (`notification_id`, `user_id`),
    KEY        `idx_user_id`        (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------------
-- schema_migrations
-- Tracks which migration files have been applied (used by migrate.ts).
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `schema_migrations` (
    `id`             INT           NOT NULL AUTO_INCREMENT,
    `migration_name` VARCHAR(255)  NOT NULL,
    `applied_at`     TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    UNIQUE KEY `uq_migration_name` (`migration_name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
