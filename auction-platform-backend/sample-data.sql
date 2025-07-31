-- Sample Users
INSERT INTO "user" (id, email, username, password, role, balance, "isVerified", "isFrozen") VALUES
  ('1', 'seller1@example.com', 'seller1', '$2b$10$6LQuZY3ah7s/dpi6V4LrnuLRIZEbrDhrOcLlHOKdlJlpgsp6SktU6', 'seller', 1000, true, false),
  ('2', 'buyer1@example.com', 'buyer1', '$2b$10$7ISvMoy0UORlT3NQfHM5y.tYk0lhRc.UnxEsYXlIt0F5u1XQrTE3O', 'buyer', 500, true, false),
  ('3', 'admin1@example.com', 'admin1', '$2b$10$6LQuZY3ah7s/dpi6V4LrnuLRIZEbrDhrOcLlHOKdlJlpgsp6SktU6', 'admin', 2000, true, false);

-- Sample Auctions
INSERT INTO auction (id, title, description, "startingPrice", "startTime", "endTime", status, "sellerId") VALUES
  ('a1', 'Vintage Watch', 'A beautiful vintage watch from 1950s', 100, '2025-05-24T12:00:00Z', '2025-05-31T12:00:00Z', 'active', '1'),
  ('a2', 'Antique Vase', 'Rare antique vase in perfect condition', 200, '2025-05-24T12:00:00Z', '2025-05-30T12:00:00Z', 'active', '1');

-- Sample Bids
INSERT INTO bid (id, amount, "createdAt", "auctionId", "bidderId") VALUES
  ('b1', 120, '2025-05-24T13:00:00Z', 'a1', '2'),
  ('b2', 130, '2025-05-24T14:00:00Z', 'a1', '2');

-- Note: Replace the password hashes with real bcrypt hashes if you want to log in with these users.
-- The IDs are simple strings for demo; adjust if your DB uses UUIDs or sequences.
-- Timestamps are in ISO format for PostgreSQL compatibility.
