DELETE FROM public.location_sessions WHERE location = 'Saint-Hubert';

INSERT INTO public.location_sessions (week, location, session_date, activity, artist) VALUES
('WK 1', 'Saint-Hubert', '2026-02-04', '01-Ho Hey', 'The Lumineers'),
('WK 2', 'Saint-Hubert', '2026-02-11', '02-Sweet Child O''Mine', 'Sheryl Crow'),
('NA', 'Saint-Hubert', '2026-02-18', 'No Practice', 'No Practice'),
('WK 3', 'Saint-Hubert', '2026-02-25', '03-Valerie', 'Mark Ronson / Amy Winehouse'),
('WK 4', 'Saint-Hubert', '2026-03-04', '04-I See Fire', 'Ed Sheeran'),
('WK 5', 'Saint-Hubert', '2026-03-11', 'CANCELLED - WEATHER', NULL),
('WK 6', 'Saint-Hubert', '2026-03-18', '05-Hélène', 'Roch Voisine'),
('WK 7', 'Saint-Hubert', '2026-03-25', 'REVIEW WEEK', 'Songs - 01 to 05 (extra 30 mins)'),
('WK 8', 'Saint-Hubert', '2026-04-01', '06-You''re The One That I Want', 'Olivia Newton John and John Travolta'),
('WK 9', 'Saint-Hubert', '2026-04-08', '07-Lemon Tree', 'Fools Garden'),
('WK 10', 'Saint-Hubert', '2026-04-15', '08-Sweet Dreams / Seven Nation Army', 'Pomplemousse'),
('WK 11', 'Saint-Hubert', '2026-04-22', '09-Lose It', 'Oh Wonder'),
('WK 12', 'Saint-Hubert', '2026-04-29', 'REVIEW WEEK', 'Songs - 01 to 05 (extra 30 mins)'),
('WK 13', 'Saint-Hubert', '2026-05-06', 'REVIEW WEEK', 'Songs - 06 to 09 (extra 30mins)'),
('WK 14', 'Saint-Hubert', '2026-05-13', 'Show Night', 'Meet early on this day for dress rehearsal and performance');