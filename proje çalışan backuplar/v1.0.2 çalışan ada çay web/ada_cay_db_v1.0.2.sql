--
-- PostgreSQL database dump
--

\restrict lX45ZeGMRyFaypi9A7BNeLYPJb4LMPUcQYfGO2GlLvx6bWvvCMVXTt60Ea4QLhO

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

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: adisyon_kalemleri; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.adisyon_kalemleri (
    id integer NOT NULL,
    adisyon_id integer NOT NULL,
    urun_id integer NOT NULL,
    urun_ad character varying(100) NOT NULL,
    birim_fiyat numeric(10,2) NOT NULL,
    miktar integer DEFAULT 1 NOT NULL,
    toplam numeric(10,2) NOT NULL,
    durum character varying(20) DEFAULT 'siparis'::character varying,
    ekleme_tarih timestamp without time zone DEFAULT now(),
    CONSTRAINT adisyon_kalemleri_durum_check CHECK (((durum)::text = ANY ((ARRAY['siparis'::character varying, 'hazirlaniyor'::character varying, 'hazir'::character varying, 'servis'::character varying, 'iptal'::character varying])::text[]))),
    CONSTRAINT adisyon_kalemleri_miktar_check CHECK ((miktar > 0))
);


ALTER TABLE public.adisyon_kalemleri OWNER TO postgres;

--
-- Name: adisyon_kalemleri_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.adisyon_kalemleri_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.adisyon_kalemleri_id_seq OWNER TO postgres;

--
-- Name: adisyon_kalemleri_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.adisyon_kalemleri_id_seq OWNED BY public.adisyon_kalemleri.id;


--
-- Name: adisyonlar; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.adisyonlar (
    id integer NOT NULL,
    masa_id integer NOT NULL,
    garson_id integer NOT NULL,
    durum character varying(20) DEFAULT 'acik'::character varying NOT NULL,
    toplam numeric(10,2) DEFAULT 0,
    odeme_tipi character varying(20),
    acilis_tarih timestamp without time zone DEFAULT now(),
    kapanis_tarih timestamp without time zone,
    CONSTRAINT adisyonlar_durum_check CHECK (((durum)::text = ANY ((ARRAY['acik'::character varying, 'kapali'::character varying, 'odendi'::character varying, 'iptal'::character varying])::text[])))
);


ALTER TABLE public.adisyonlar OWNER TO postgres;

--
-- Name: adisyonlar_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.adisyonlar_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.adisyonlar_id_seq OWNER TO postgres;

--
-- Name: adisyonlar_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.adisyonlar_id_seq OWNED BY public.adisyonlar.id;


--
-- Name: gelir_gider; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.gelir_gider (
    id integer NOT NULL,
    tip character varying(10) NOT NULL,
    kategori character varying(100),
    miktar numeric(10,2) NOT NULL,
    aciklama text,
    tarih timestamp without time zone DEFAULT now(),
    CONSTRAINT gelir_gider_tip_check CHECK (((tip)::text = ANY ((ARRAY['gelir'::character varying, 'gider'::character varying])::text[])))
);


ALTER TABLE public.gelir_gider OWNER TO postgres;

--
-- Name: gelir_gider_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.gelir_gider_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.gelir_gider_id_seq OWNER TO postgres;

--
-- Name: gelir_gider_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.gelir_gider_id_seq OWNED BY public.gelir_gider.id;


--
-- Name: kategoriler; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.kategoriler (
    id integer NOT NULL,
    ad character varying(100) NOT NULL,
    siralama integer DEFAULT 0
);


ALTER TABLE public.kategoriler OWNER TO postgres;

--
-- Name: kategoriler_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.kategoriler_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.kategoriler_id_seq OWNER TO postgres;

--
-- Name: kategoriler_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.kategoriler_id_seq OWNED BY public.kategoriler.id;


--
-- Name: kullanicilar; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.kullanicilar (
    id integer NOT NULL,
    kullanici_ad character varying(50) NOT NULL,
    ad character varying(100) NOT NULL,
    rol character varying(20) DEFAULT 'garson'::character varying NOT NULL,
    sifre_hash character varying(255) NOT NULL,
    aktif boolean DEFAULT true,
    olusturma_tarih timestamp without time zone DEFAULT now(),
    CONSTRAINT kullanicilar_rol_check CHECK (((rol)::text = ANY ((ARRAY['admin'::character varying, 'garson'::character varying])::text[])))
);


ALTER TABLE public.kullanicilar OWNER TO postgres;

--
-- Name: kullanicilar_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.kullanicilar_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.kullanicilar_id_seq OWNER TO postgres;

--
-- Name: kullanicilar_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.kullanicilar_id_seq OWNED BY public.kullanicilar.id;


--
-- Name: masalar; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.masalar (
    id integer NOT NULL,
    numara character varying(10) NOT NULL,
    ad character varying(50),
    kapasite integer DEFAULT 4,
    durum character varying(20) DEFAULT 'bos'::character varying NOT NULL,
    guncelleme_tarih timestamp without time zone DEFAULT now(),
    pos_x integer,
    pos_y integer,
    CONSTRAINT masalar_durum_check CHECK (((durum)::text = ANY ((ARRAY['bos'::character varying, 'dolu'::character varying, 'rezerve'::character varying])::text[])))
);


ALTER TABLE public.masalar OWNER TO postgres;

--
-- Name: masalar_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.masalar_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.masalar_id_seq OWNER TO postgres;

--
-- Name: masalar_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.masalar_id_seq OWNED BY public.masalar.id;


--
-- Name: urunler; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.urunler (
    id integer NOT NULL,
    ad character varying(100) NOT NULL,
    kategori_id integer,
    fiyat numeric(10,2) DEFAULT 0 NOT NULL,
    aktif boolean DEFAULT true,
    olusturma_tarih timestamp without time zone DEFAULT now(),
    CONSTRAINT urunler_fiyat_check CHECK ((fiyat >= (0)::numeric))
);


ALTER TABLE public.urunler OWNER TO postgres;

--
-- Name: urunler_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.urunler_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.urunler_id_seq OWNER TO postgres;

--
-- Name: urunler_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.urunler_id_seq OWNED BY public.urunler.id;


--
-- Name: adisyon_kalemleri id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.adisyon_kalemleri ALTER COLUMN id SET DEFAULT nextval('public.adisyon_kalemleri_id_seq'::regclass);


--
-- Name: adisyonlar id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.adisyonlar ALTER COLUMN id SET DEFAULT nextval('public.adisyonlar_id_seq'::regclass);


--
-- Name: gelir_gider id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.gelir_gider ALTER COLUMN id SET DEFAULT nextval('public.gelir_gider_id_seq'::regclass);


--
-- Name: kategoriler id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.kategoriler ALTER COLUMN id SET DEFAULT nextval('public.kategoriler_id_seq'::regclass);


--
-- Name: kullanicilar id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.kullanicilar ALTER COLUMN id SET DEFAULT nextval('public.kullanicilar_id_seq'::regclass);


--
-- Name: masalar id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.masalar ALTER COLUMN id SET DEFAULT nextval('public.masalar_id_seq'::regclass);


--
-- Name: urunler id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.urunler ALTER COLUMN id SET DEFAULT nextval('public.urunler_id_seq'::regclass);


--
-- Data for Name: adisyon_kalemleri; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.adisyon_kalemleri (id, adisyon_id, urun_id, urun_ad, birim_fiyat, miktar, toplam, durum, ekleme_tarih) FROM stdin;
\.


--
-- Data for Name: adisyonlar; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.adisyonlar (id, masa_id, garson_id, durum, toplam, odeme_tipi, acilis_tarih, kapanis_tarih) FROM stdin;
1	1	2	kapali	135.00	kart	2026-08-10 21:17:45.242241	2026-08-10 21:38:15.546648
2	10	2	kapali	55.00	nakit	2026-08-10 21:17:53.088954	2026-08-10 21:38:17.77099
3	1	1	kapali	30.00	nakit	2026-08-10 22:03:19.343079	2026-08-10 22:03:19.450356
4	1	2	kapali	80.00	nakit	2026-08-12 20:14:18.656067	2026-08-12 20:14:46.796508
5	10	2	kapali	75.00	kart	2026-08-12 20:14:32.806413	2026-08-12 20:14:49.242908
6	1	7	kapali	25.00	nakit	2026-08-13 15:08:33.265752	2026-08-13 15:08:53.019167
7	1	7	kapali	175.00	kart	2026-08-13 15:08:56.761834	2026-08-13 15:09:13.005197
8	3	7	kapali	30.00	nakit	2026-08-13 15:09:27.186886	2026-08-13 15:10:04.587498
9	23	7	kapali	135.00	kart	2026-08-13 15:09:31.057938	2026-08-13 15:25:40.438053
10	1	7	kapali	0.00	nakit	2026-08-13 20:14:14.00475	2026-08-13 20:24:38.425731
12	1	7	kapali	0.00	nakit	2026-08-13 20:25:02.014442	2026-08-13 20:25:51.424953
11	2	7	kapali	50.00	nakit	2026-08-13 20:19:44.233644	2026-08-13 20:29:36.843393
13	1	7	kapali	0.00	nakit	2026-08-13 20:32:00.596079	2026-08-13 20:51:14.666691
14	2	7	iptal	0.00	\N	2026-08-13 20:51:20.715726	2026-08-13 23:26:20.729866
15	1	7	iptal	0.00	\N	2026-08-13 23:31:25.420666	2026-08-13 23:32:10.170701
16	1	7	acik	0.00	\N	2026-08-13 23:32:42.871995	\N
\.


--
-- Data for Name: gelir_gider; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.gelir_gider (id, tip, kategori, miktar, aciklama, tarih) FROM stdin;
3	gelir	Kasa Nakit	500.00	Patron kasaya nakit koydu	2026-08-10 22:03:32.343384
4	gider	Ürün Alımı	100.00	Çay alımı	2026-08-10 22:03:32.376154
\.


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
-- Data for Name: kullanicilar; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.kullanicilar (id, kullanici_ad, ad, rol, sifre_hash, aktif, olusturma_tarih) FROM stdin;
1	admin	Yönetici	admin	$2b$12$8EiOWX4DRk/pb5EvSqi6k.oKfREVTwhMjEFYWiN93vDxyWzigJK9S	t	2026-08-10 21:14:22.204293
2	ege	Ege Cem Yabeyli	garson	$2b$12$xjaewxzTto9qz3SF41BZSeYbxpvI2Nisq9QgI/KLic6bzZTf9OC5q	t	2026-08-10 21:17:27.720402
5	serdar	Serdar BAL	admin	$2b$12$H7OVGV5gYgGG0kGt7MNOjOD2FCkUyLmLsr98nqZ8Nqjz/fpTB2NyG	t	2026-08-13 13:44:49.136801
12	ada	Ada Garson	garson	$2b$12$da6ceNGkgnq.p5ebVrAjG.HpCLhY4uD7RAi9H98.MWN6ryNQEr75S	t	2026-08-13 20:42:48.723416
7	kadir	Kadir	garson	$2b$12$LVhm.LUoJRc3wX2rdmhUYOWUV6fN/PeB57AQpKggY1zXVj5dwICkG	t	2026-08-13 13:45:24.567049
\.


--
-- Data for Name: masalar; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.masalar (id, numara, ad, kapasite, durum, guncelleme_tarih, pos_x, pos_y) FROM stdin;
2	2	Sedir önü 	5	bos	2026-08-13 23:26:20.729866	20	54
1	1	Dolap 1	4	dolu	2026-08-13 23:32:42.871995	49	58
9	9	Karşı 3	6	bos	2026-08-10 21:14:22.204293	28	2
34	12	Karşı 4	4	bos	2026-08-13 15:24:15.054006	28	19
8	8	Karşı 2	6	bos	2026-08-10 21:14:22.204293	37	19
36	14	Karşı 6	4	bos	2026-08-13 15:24:46.223821	17	19
35	13	Karşı 5	4	bos	2026-08-13 15:24:34.453186	17	2
3	3	Cam 1	4	bos	2026-08-13 15:10:04.587498	2	30
4	4	Cam 2	6	bos	2026-08-10 21:14:22.204293	2	46
5	5	Cam 3	4	bos	2026-08-10 21:14:22.204293	2	63
6	6	Cam 4	2	bos	2026-08-10 21:14:22.204293	2	80
7	7	Karşı 1	4	bos	2026-08-13 20:56:56.444732	38	2
23	11	Sedir 2	4	bos	2026-08-13 15:25:40.438053	14	72
10	10	Sedir 1	8	bos	2026-08-12 20:14:49.242908	24	72
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
112	Sütlaç	4	35.00	t	2026-08-13 20:45:41.611128
97	Serite	4	50.00	f	2026-08-13 20:08:39.718012
102	Çay (demli)	1	15.00	f	2026-08-13 20:45:41.611128
103	Çay (tulum)	1	10.00	f	2026-08-13 20:45:41.611128
110	Ayran	3	15.00	f	2026-08-13 20:45:41.611128
113	Baklava	4	60.00	f	2026-08-13 20:45:41.611128
104	Bitki Çayı	1	20.00	f	2026-08-13 20:45:41.611128
107	Cappuccino	2	35.00	f	2026-08-13 20:45:41.611128
109	Cola	3	25.00	f	2026-08-13 20:45:41.611128
106	Espresso	2	30.00	f	2026-08-13 20:45:41.611128
115	Kuru Pasta	5	20.00	f	2026-08-13 20:45:41.611128
114	Künefe	4	70.00	f	2026-08-13 20:45:41.611128
108	Latte	2	40.00	f	2026-08-13 20:45:41.611128
116	Poğaça	5	15.00	f	2026-08-13 20:45:41.611128
\.


--
-- Name: adisyon_kalemleri_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.adisyon_kalemleri_id_seq', 1, false);


--
-- Name: adisyonlar_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.adisyonlar_id_seq', 16, true);


--
-- Name: gelir_gider_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.gelir_gider_id_seq', 6, true);


--
-- Name: kategoriler_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.kategoriler_id_seq', 30, true);


--
-- Name: kullanicilar_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.kullanicilar_id_seq', 18, true);


--
-- Name: masalar_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.masalar_id_seq', 116, true);


--
-- Name: urunler_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.urunler_id_seq', 116, true);


--
-- Name: adisyon_kalemleri adisyon_kalemleri_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.adisyon_kalemleri
    ADD CONSTRAINT adisyon_kalemleri_pkey PRIMARY KEY (id);


--
-- Name: adisyonlar adisyonlar_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.adisyonlar
    ADD CONSTRAINT adisyonlar_pkey PRIMARY KEY (id);


--
-- Name: gelir_gider gelir_gider_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.gelir_gider
    ADD CONSTRAINT gelir_gider_pkey PRIMARY KEY (id);


--
-- Name: kategoriler kategoriler_ad_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.kategoriler
    ADD CONSTRAINT kategoriler_ad_key UNIQUE (ad);


--
-- Name: kategoriler kategoriler_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.kategoriler
    ADD CONSTRAINT kategoriler_pkey PRIMARY KEY (id);


--
-- Name: kullanicilar kullanicilar_kullanici_ad_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.kullanicilar
    ADD CONSTRAINT kullanicilar_kullanici_ad_key UNIQUE (kullanici_ad);


--
-- Name: kullanicilar kullanicilar_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.kullanicilar
    ADD CONSTRAINT kullanicilar_pkey PRIMARY KEY (id);


--
-- Name: masalar masalar_numara_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.masalar
    ADD CONSTRAINT masalar_numara_key UNIQUE (numara);


--
-- Name: masalar masalar_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.masalar
    ADD CONSTRAINT masalar_pkey PRIMARY KEY (id);


--
-- Name: urunler urunler_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.urunler
    ADD CONSTRAINT urunler_pkey PRIMARY KEY (id);


--
-- Name: idx_adisyon_kalemleri_adisyon; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_adisyon_kalemleri_adisyon ON public.adisyon_kalemleri USING btree (adisyon_id);


--
-- Name: idx_adisyonlar_durum; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_adisyonlar_durum ON public.adisyonlar USING btree (durum);


--
-- Name: idx_adisyonlar_masa; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_adisyonlar_masa ON public.adisyonlar USING btree (masa_id);


--
-- Name: idx_adisyonlar_masa_acik; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX idx_adisyonlar_masa_acik ON public.adisyonlar USING btree (masa_id) WHERE ((durum)::text = 'acik'::text);


--
-- Name: idx_urunler_ad_kat_aktif; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX idx_urunler_ad_kat_aktif ON public.urunler USING btree (ad, kategori_id) WHERE (aktif = true);


--
-- Name: idx_urunler_kategori; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_urunler_kategori ON public.urunler USING btree (kategori_id);


--
-- Name: adisyon_kalemleri adisyon_kalemleri_adisyon_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.adisyon_kalemleri
    ADD CONSTRAINT adisyon_kalemleri_adisyon_id_fkey FOREIGN KEY (adisyon_id) REFERENCES public.adisyonlar(id) ON DELETE CASCADE;


--
-- Name: adisyon_kalemleri adisyon_kalemleri_urun_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.adisyon_kalemleri
    ADD CONSTRAINT adisyon_kalemleri_urun_id_fkey FOREIGN KEY (urun_id) REFERENCES public.urunler(id);


--
-- Name: adisyonlar adisyonlar_garson_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.adisyonlar
    ADD CONSTRAINT adisyonlar_garson_id_fkey FOREIGN KEY (garson_id) REFERENCES public.kullanicilar(id);


--
-- Name: adisyonlar adisyonlar_masa_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.adisyonlar
    ADD CONSTRAINT adisyonlar_masa_id_fkey FOREIGN KEY (masa_id) REFERENCES public.masalar(id);


--
-- Name: urunler urunler_kategori_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.urunler
    ADD CONSTRAINT urunler_kategori_id_fkey FOREIGN KEY (kategori_id) REFERENCES public.kategoriler(id) ON DELETE SET NULL;


--
-- PostgreSQL database dump complete
--

\unrestrict lX45ZeGMRyFaypi9A7BNeLYPJb4LMPUcQYfGO2GlLvx6bWvvCMVXTt60Ea4QLhO

