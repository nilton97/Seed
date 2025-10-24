USE analytics_database;

INSERT IGNORE INTO status (name, created_at, modified_at, created_by, modified_by) VALUES
('pending', NOW(), NOW(), 1, 1),
('paid', NOW(), NOW(), 1, 1),
('payment_failed', NOW(), NOW(), 1, 1),
('shipped', NOW(), NOW(), 1, 1),
('delivered', NOW(), NOW(), 1, 1),
('canceled', NOW(), NOW(), 1, 1),
('refunded', NOW(), NOW(), 1, 1);

INSERT IGNORE INTO payment_status (name, created_at, modified_at, created_by, modified_by) VALUES
('pending', NOW(), NOW(), 1, 1),
('completed', NOW(), NOW(), 1, 1),
('failed', NOW(), NOW(), 1, 1);

INSERT IGNORE INTO currency (iso_code_currency, name, created_at, modified_at, created_by, modified_by) VALUES
('EUR', 'Euro', NOW(), NOW(), 1, 1),
('USD', 'Dollar', NOW(), NOW(), 1, 1);

INSERT INTO carrier (name, created_at, modified_at, created_by, modified_by) VALUES
('DHL', NOW(), NOW(), 1, 1),
('SEUR', NOW(), NOW(), 1, 1);

INSERT IGNORE INTO method (name, created_at, modified_at, created_by, modified_by) VALUES
('credit_card', NOW(), NOW(), 1, 1);

INSERT INTO provider (name, created_at, modified_at, created_by, modified_by) VALUES
('visa', NOW(), NOW(), 1, 1),
('mastercard', NOW(), NOW(), 1, 1);


