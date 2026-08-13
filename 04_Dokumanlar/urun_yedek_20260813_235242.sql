--
-- PostgreSQL database dump
--

\restrict cz4kFQrdfx0Dsaicxgr1MP4gEKjhxKNNdY2TrP2QYDydcMqOsGEXY3gfd3vBbVA

-- Dumped from database version 16.14
-- Dumped by pg_dump version 16.14

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Data for Name: kategoriler; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.kategoriler (id, ad, siralama) FROM stdin;
1	Çaylar	1
2	Kahveler	2
3	Soğuk İçecekler	3
4	Tatlılar	4
5	Atıştırmalıklar	5
\.


--
-- Data for Name: urunler; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.urunler (id, ad, kategori_id, fiyat, aktif, olusturma_tarih) FROM stdin;
9	Ayran	3	15.00	f	2026-08-10 21:14:22.204293
12	Baklava	4	60.00	f	2026-08-10 21:14:22.204293
3	Bitki Çayı	1	20.00	f	2026-08-10 21:14:22.204293
6	Cappuccino	2	35.00	f	2026-08-10 21:14:22.204293
8	Cola	3	25.00	f	2026-08-10 21:14:22.204293
5	Espresso	2	30.00	f	2026-08-10 21:14:22.204293
14	Kuru Pasta	5	20.00	f	2026-08-10 21:14:22.204293
13	Künefe	4	70.00	f	2026-08-10 21:14:22.204293
7	Latte	2	40.00	f	2026-08-10 21:14:22.204293
10	Limonata	3	30.00	f	2026-08-10 21:14:22.204293
15	Poğaça	5	15.00	f	2026-08-10 21:14:22.204293
11	Sütlaç	4	35.00	f	2026-08-10 21:14:22.204293
4	Türk Kahvesi	2	25.00	f	2026-08-10 21:14:22.204293
1	Çay (demli)	1	15.00	f	2026-08-10 21:14:22.204293
2	Çay (tulum)	1	10.00	f	2026-08-10 21:14:22.204293
76	Çay	1	30.00	t	2026-08-13 20:00:31.709831
77	Oralet Çeşitleri	1	35.00	t	2026-08-13 20:00:51.64222
78	Türk Kahvesi	2	100.00	t	2026-08-13 20:01:09.396868
79	Filtre Kahve	2	120.00	t	2026-08-13 20:01:31.019917
80	Dibek Kahvesi	2	100.00	t	2026-08-13 20:01:59.553188
81	Kış Çayı	1	100.00	t	2026-08-13 20:02:17.055904
82	Ada Çayı	1	100.00	t	2026-08-13 20:02:28.623216
83	Ihlamur	1	100.00	t	2026-08-13 20:02:42.277321
84	Nane-Limon	1	35.00	t	2026-08-13 20:03:01.388914
86	Karışık Tost	5	200.00	t	2026-08-13 20:03:52.413219
87	Kaşarlı Tost	5	180.00	t	2026-08-13 20:04:07.969729
88	Hamburger	5	450.00	t	2026-08-13 20:04:22.130435
89	Sigara Böreği	5	250.00	t	2026-08-13 20:04:42.938362
90	Paçanga Böreği	5	250.00	t	2026-08-13 20:05:00.155032
91	Limonata	3	100.00	t	2026-08-13 20:05:59.199686
92	Nescafe	2	50.00	t	2026-08-13 20:06:14.870061
93	Sade Nescafe	2	50.00	t	2026-08-13 20:06:36.094359
94	Meyveli Soda	3	50.00	t	2026-08-13 20:07:04.931416
95	Sade Soda	3	40.00	t	2026-08-13 20:07:16.505864
96	Soğuk Kahve	2	100.00	t	2026-08-13 20:07:43.965008
85	Meşrubat Çeşitleri	3	60.00	f	2026-08-13 20:03:25.28541
98	Kola	3	60.00	t	2026-08-13 20:13:39.202547
99	Fanta	3	60.00	t	2026-08-13 20:13:53.376555
100	Sprite	3	60.00	t	2026-08-13 20:14:00.568679
101	Su	3	20.00	t	2026-08-13 20:20:49.194541
108	Latte	2	40.00	t	2026-08-13 20:45:41.611128
114	Künefe	4	70.00	t	2026-08-13 20:45:41.611128
97	Serite	4	50.00	f	2026-08-13 20:08:39.718012
102	Çay (demli)	1	15.00	f	2026-08-13 20:45:41.611128
103	Çay (tulum)	1	10.00	f	2026-08-13 20:45:41.611128
112	Sütlaç	4	35.00	f	2026-08-13 20:45:41.611128
116	Poğaça	5	15.00	f	2026-08-13 20:45:41.611128
106	Espresso	2	30.00	f	2026-08-13 20:45:41.611128
109	Cola	3	25.00	f	2026-08-13 20:45:41.611128
107	Cappuccino	2	35.00	f	2026-08-13 20:45:41.611128
110	Ayran	3	15.00	f	2026-08-13 20:45:41.611128
113	Baklava	4	60.00	f	2026-08-13 20:45:41.611128
104	Bitki Çayı	1	20.00	f	2026-08-13 20:45:41.611128
115	Kuru Pasta	5	20.00	f	2026-08-13 20:45:41.611128
\.


--
-- Name: kategoriler_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.kategoriler_id_seq', 30, true);


--
-- Name: urunler_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.urunler_id_seq', 116, true);


--
-- PostgreSQL database dump complete
--

\unrestrict cz4kFQrdfx0Dsaicxgr1MP4gEKjhxKNNdY2TrP2QYDydcMqOsGEXY3gfd3vBbVA

