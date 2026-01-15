-- Seed initial memories
INSERT INTO memories (src, caption, sort_order, is_active) VALUES
('/src/lib/assets/images/running1.jpg', 'Insert Description Here', 1, true),
('/src/lib/assets/images/running2.jpg', 'Insert Description Here', 2, true),
('/src/lib/assets/images/running3.jpg', 'Insert Description Here', 3, true),
('/src/lib/assets/images/running4.jpg', 'Insert Description Here', 4, true),
('/src/lib/assets/images/running5.jpg', 'Insert Description Here', 5, true),
('/src/lib/assets/images/running6.jpg', 'Insert Description Here', 6, true),
('/src/lib/assets/images/running7.jpg', 'Insert Description Here', 7, true),
('/src/lib/assets/images/running8.jpg', 'Insert Description Here', 8, true),
('/src/lib/assets/images/running9.jpg', 'Insert Description Here', 9, true);

-- Seed initial routine schedules
INSERT INTO routine_schedules (day, time, location, accent_color, description, sort_order, is_active) VALUES
('Tuesday', '05:00 AM', 'Hampton Park - Moultrie Lot', 'var(--frosted-blue)', 'Tuesday Speed', 1, true),
('Thursday', '05:00 AM', 'Grace Bridge Street', 'var(--accent-lime)', 'Bridge Run', 2, true),
('Saturday', '06:00 AM', 'Sullivan''s Island - Station 30', 'var(--frosted-blue)', 'Run. Dip. Sip.', 3, true);
