--
-- PostgreSQL database dump
--

-- Dumped from database version 16.8
-- Dumped by pg_dump version 16.5

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
-- Name: categories; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.categories (
    id integer NOT NULL,
    name text NOT NULL,
    format text NOT NULL,
    match_duration integer NOT NULL,
    status text DEFAULT 'REGISTRATION_OPEN'::text NOT NULL,
    tournament_id integer NOT NULL
);


ALTER TABLE public.categories OWNER TO neondb_owner;

--
-- Name: categories_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.categories_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.categories_id_seq OWNER TO neondb_owner;

--
-- Name: categories_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.categories_id_seq OWNED BY public.categories.id;


--
-- Name: courts; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.courts (
    id integer NOT NULL,
    name text NOT NULL,
    venue_id integer NOT NULL
);


ALTER TABLE public.courts OWNER TO neondb_owner;

--
-- Name: courts_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.courts_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.courts_id_seq OWNER TO neondb_owner;

--
-- Name: courts_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.courts_id_seq OWNED BY public.courts.id;


--
-- Name: group_assignments; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.group_assignments (
    id integer NOT NULL,
    group_id integer NOT NULL,
    team_id integer NOT NULL,
    played integer DEFAULT 0 NOT NULL,
    won integer DEFAULT 0 NOT NULL,
    lost integer DEFAULT 0 NOT NULL,
    points integer DEFAULT 0 NOT NULL
);


ALTER TABLE public.group_assignments OWNER TO neondb_owner;

--
-- Name: group_assignments_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.group_assignments_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.group_assignments_id_seq OWNER TO neondb_owner;

--
-- Name: group_assignments_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.group_assignments_id_seq OWNED BY public.group_assignments.id;


--
-- Name: groups; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.groups (
    id integer NOT NULL,
    name text NOT NULL,
    category_id integer NOT NULL
);


ALTER TABLE public.groups OWNER TO neondb_owner;

--
-- Name: groups_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.groups_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.groups_id_seq OWNER TO neondb_owner;

--
-- Name: groups_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.groups_id_seq OWNED BY public.groups.id;


--
-- Name: matches; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.matches (
    id integer NOT NULL,
    category_id integer NOT NULL,
    team_a_id integer NOT NULL,
    team_b_id integer NOT NULL,
    group_id integer,
    round text,
    score_a text,
    score_b text,
    winner integer,
    court_id integer,
    scheduled_time timestamp with time zone,
    completed boolean DEFAULT false NOT NULL
);


ALTER TABLE public.matches OWNER TO neondb_owner;

--
-- Name: matches_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.matches_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.matches_id_seq OWNER TO neondb_owner;

--
-- Name: matches_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.matches_id_seq OWNED BY public.matches.id;


--
-- Name: session; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.session (
    sid character varying NOT NULL,
    sess json NOT NULL,
    expire timestamp(6) without time zone NOT NULL
);


ALTER TABLE public.session OWNER TO neondb_owner;

--
-- Name: teams; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.teams (
    id integer NOT NULL,
    name text NOT NULL,
    player1 text NOT NULL,
    player2 text NOT NULL,
    category_id integer NOT NULL,
    seeded boolean DEFAULT false
);


ALTER TABLE public.teams OWNER TO neondb_owner;

--
-- Name: teams_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.teams_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.teams_id_seq OWNER TO neondb_owner;

--
-- Name: teams_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.teams_id_seq OWNED BY public.teams.id;


--
-- Name: tournaments; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.tournaments (
    id integer NOT NULL,
    name text NOT NULL,
    start_date timestamp without time zone NOT NULL,
    end_date timestamp without time zone NOT NULL,
    description text,
    external_link text,
    image_url text,
    user_id integer NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.tournaments OWNER TO neondb_owner;

--
-- Name: tournaments_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.tournaments_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.tournaments_id_seq OWNER TO neondb_owner;

--
-- Name: tournaments_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.tournaments_id_seq OWNED BY public.tournaments.id;


--
-- Name: users; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.users (
    id integer NOT NULL,
    username text NOT NULL,
    password text NOT NULL,
    name text NOT NULL,
    email text NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.users OWNER TO neondb_owner;

--
-- Name: users_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.users_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.users_id_seq OWNER TO neondb_owner;

--
-- Name: users_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.users_id_seq OWNED BY public.users.id;


--
-- Name: venues; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.venues (
    id integer NOT NULL,
    name text NOT NULL,
    address text,
    tournament_id integer NOT NULL
);


ALTER TABLE public.venues OWNER TO neondb_owner;

--
-- Name: venues_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.venues_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.venues_id_seq OWNER TO neondb_owner;

--
-- Name: venues_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.venues_id_seq OWNED BY public.venues.id;


--
-- Name: categories id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.categories ALTER COLUMN id SET DEFAULT nextval('public.categories_id_seq'::regclass);


--
-- Name: courts id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.courts ALTER COLUMN id SET DEFAULT nextval('public.courts_id_seq'::regclass);


--
-- Name: group_assignments id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.group_assignments ALTER COLUMN id SET DEFAULT nextval('public.group_assignments_id_seq'::regclass);


--
-- Name: groups id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.groups ALTER COLUMN id SET DEFAULT nextval('public.groups_id_seq'::regclass);


--
-- Name: matches id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.matches ALTER COLUMN id SET DEFAULT nextval('public.matches_id_seq'::regclass);


--
-- Name: teams id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.teams ALTER COLUMN id SET DEFAULT nextval('public.teams_id_seq'::regclass);


--
-- Name: tournaments id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.tournaments ALTER COLUMN id SET DEFAULT nextval('public.tournaments_id_seq'::regclass);


--
-- Name: users id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.users ALTER COLUMN id SET DEFAULT nextval('public.users_id_seq'::regclass);


--
-- Name: venues id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.venues ALTER COLUMN id SET DEFAULT nextval('public.venues_id_seq'::regclass);


--
-- Data for Name: categories; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.categories (id, name, format, match_duration, status, tournament_id) FROM stdin;
2	f4	GROUPS	60	REGISTRATION_OPEN	1
1	M2	GROUPS	60	ACTIVE	1
3	teste	GROUPS	60	ACTIVE	2
4	F6	GROUPS	60	ACTIVE	2
5	M5	GROUPS	60	REGISTRATION_OPEN	3
6	F1	GROUPS	60	ACTIVE	3
\.


--
-- Data for Name: courts; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.courts (id, name, venue_id) FROM stdin;
1	Campo1	1
2	Campo2	1
3	Campo3	1
4	Campo4	1
5	Campo5	1
6	Campo6	1
7	Campo7	1
8	Campo8	1
9	Campo9	1
10	Campo1	2
11	Campo2	2
12	Campo 1	3
13	Campo 2	3
\.


--
-- Data for Name: group_assignments; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.group_assignments (id, group_id, team_id, played, won, lost, points) FROM stdin;
1	1	6	0	0	0	0
2	2	7	0	0	0	0
3	1	1	0	0	0	0
4	2	2	0	0	0	0
5	1	5	0	0	0	0
6	2	3	0	0	0	0
7	1	4	0	0	0	0
8	3	11	0	0	0	0
9	4	10	0	0	0	0
10	3	12	0	0	0	0
11	4	9	0	0	0	0
12	5	17	0	0	0	0
13	5	15	0	0	0	0
14	6	14	0	0	0	0
15	5	13	0	0	0	0
16	6	18	0	0	0	0
17	5	16	0	0	0	0
18	7	22	0	0	0	0
19	8	19	0	0	0	0
20	7	20	0	0	0	0
21	8	21	0	0	0	0
22	9	27	0	0	0	0
23	10	28	0	0	0	0
24	9	26	0	0	0	0
25	10	25	0	0	0	0
26	9	24	0	0	0	0
27	10	23	0	0	0	0
\.


--
-- Data for Name: groups; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.groups (id, name, category_id) FROM stdin;
1	Group 1	1
2	Group 2	1
3	Group 1	3
4	Group 2	3
5	Group 1	4
6	Group 2	4
7	Group 1	5
8	Group 2	5
9	Group 1	6
10	Group 2	6
\.


--
-- Data for Name: matches; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.matches (id, category_id, team_a_id, team_b_id, group_id, round, score_a, score_b, winner, court_id, scheduled_time, completed) FROM stdin;
7	1	7	2	2	\N	\N	\N	\N	\N	\N	f
8	1	7	3	2	\N	\N	\N	\N	\N	\N	f
9	1	2	3	2	\N	\N	\N	\N	\N	\N	f
3	1	6	4	1	\N	\N	\N	\N	\N	\N	f
2	1	6	5	1	\N	\N	\N	\N	1	\N	f
11	3	10	9	4	\N	\N	\N	\N	11	2025-05-24 09:30:00+00	f
10	3	11	12	3	\N	\N	\N	\N	\N	\N	f
16	6	28	23	10	GROUP	\N	\N	\N	13	2025-05-17 11:00:00+00	f
14	6	26	24	9	GROUP	\N	\N	\N	12	2025-05-17 11:30:00+00	f
15	6	28	25	10	GROUP	\N	\N	\N	13	2025-05-17 11:30:00+00	f
4	1	1	5	1	\N	\N	\N	\N	2	2025-05-17 08:30:00+00	f
6	1	5	4	1	\N	\N	\N	\N	3	2025-05-17 08:30:00+00	f
5	1	1	4	1	\N	\N	\N	\N	4	2025-05-17 08:30:00+00	f
1	1	6	1	1	\N	\N	\N	\N	2	2025-05-16 08:30:00+00	f
17	6	25	23	10	GROUP	\N	\N	\N	\N	\N	f
12	6	27	26	9	GROUP	\N	\N	\N	12	2025-05-17 10:00:00+00	f
13	6	27	24	9	GROUP	\N	\N	\N	13	2025-05-17 09:00:00+00	f
\.


--
-- Data for Name: session; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.session (sid, sess, expire) FROM stdin;
xEMS9ZkF9tO8HFmVqSFmVUUvtyC9_ukD	{"cookie":{"originalMaxAge":null,"expires":null,"httpOnly":true,"path":"/"},"passport":{"user":1}}	2025-05-19 10:01:56
KF0fl9XHy_U80OrNTD_2BVOQw7x15cE_	{"cookie":{"originalMaxAge":null,"expires":null,"httpOnly":true,"path":"/"},"passport":{"user":1}}	2025-05-19 00:07:54
\.


--
-- Data for Name: teams; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.teams (id, name, player1, player2, category_id, seeded) FROM stdin;
1	Dupla1			1	f
2	DUPLA2			1	f
3	DUPLA3			1	f
4	DUPLA4			1	f
5	DUPLA5			1	f
6	dupla 6			1	t
7	team 8			1	t
8	dupla1			2	f
9	Dupla1			3	f
10	dupla2			3	t
12	dupla4			3	f
11	dupla3			3	t
16	Dupla4			4	f
18	Dupla6			4	f
17	Dupla5			4	t
13	Dupla1			4	f
14	Dupla2			4	f
15	DuplA3			4	f
19	Dupla1			5	f
20	Dupla2			5	f
21	Dupla3			5	f
22	Dupla4			5	f
23	dupla1			6	f
24	dupla2			6	f
25	dupla3			6	f
26	dupla4			6	f
27	dupla5			6	f
28	dupla6			6	f
\.


--
-- Data for Name: tournaments; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.tournaments (id, name, start_date, end_date, description, external_link, image_url, user_id, created_at) FROM stdin;
1	Torneio Teste	2025-05-16 23:00:00	2025-05-17 23:00:00	dsfdsfs			1	2025-05-15 01:02:44.587328
2	dfgdfgdfgdfg	2025-05-23 23:00:00	2025-05-24 23:00:00				1	2025-05-15 03:19:31.265269
3	Torneio YYY	2025-05-16 23:00:00	2025-05-17 23:00:00				1	2025-05-15 14:52:49.087175
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.users (id, username, password, name, email, created_at) FROM stdin;
1	joaquimsa	81ffd254552a173d886f2d6cee8503fbaa079d4f9e39c12829e64db04cb2b20d512a031d37b9bdbe06e3e291349adce8f74a97974aa9b0f25fec521924f57219.09d134cf540f6fca78f1d1ae157483b9	Joaquim Sa	joaquimsa@tuganet.pt	2025-05-15 00:45:03.498424
\.


--
-- Data for Name: venues; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.venues (id, name, address, tournament_id) FROM stdin;
1	MPC		1
2	Teste		2
3	teste		3
\.


--
-- Name: categories_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.categories_id_seq', 6, true);


--
-- Name: courts_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.courts_id_seq', 13, true);


--
-- Name: group_assignments_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.group_assignments_id_seq', 27, true);


--
-- Name: groups_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.groups_id_seq', 10, true);


--
-- Name: matches_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.matches_id_seq', 17, true);


--
-- Name: teams_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.teams_id_seq', 28, true);


--
-- Name: tournaments_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.tournaments_id_seq', 3, true);


--
-- Name: users_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.users_id_seq', 1, true);


--
-- Name: venues_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.venues_id_seq', 3, true);


--
-- Name: categories categories_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.categories
    ADD CONSTRAINT categories_pkey PRIMARY KEY (id);


--
-- Name: courts courts_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.courts
    ADD CONSTRAINT courts_pkey PRIMARY KEY (id);


--
-- Name: group_assignments group_assignments_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.group_assignments
    ADD CONSTRAINT group_assignments_pkey PRIMARY KEY (id);


--
-- Name: groups groups_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.groups
    ADD CONSTRAINT groups_pkey PRIMARY KEY (id);


--
-- Name: matches matches_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.matches
    ADD CONSTRAINT matches_pkey PRIMARY KEY (id);


--
-- Name: session session_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.session
    ADD CONSTRAINT session_pkey PRIMARY KEY (sid);


--
-- Name: teams teams_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.teams
    ADD CONSTRAINT teams_pkey PRIMARY KEY (id);


--
-- Name: tournaments tournaments_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.tournaments
    ADD CONSTRAINT tournaments_pkey PRIMARY KEY (id);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: users users_username_unique; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_username_unique UNIQUE (username);


--
-- Name: venues venues_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.venues
    ADD CONSTRAINT venues_pkey PRIMARY KEY (id);


--
-- Name: IDX_session_expire; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX "IDX_session_expire" ON public.session USING btree (expire);


--
-- Name: DEFAULT PRIVILEGES FOR SEQUENCES; Type: DEFAULT ACL; Schema: public; Owner: cloud_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE cloud_admin IN SCHEMA public GRANT ALL ON SEQUENCES TO neon_superuser WITH GRANT OPTION;


--
-- Name: DEFAULT PRIVILEGES FOR TABLES; Type: DEFAULT ACL; Schema: public; Owner: cloud_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE cloud_admin IN SCHEMA public GRANT ALL ON TABLES TO neon_superuser WITH GRANT OPTION;


--
-- PostgreSQL database dump complete
--

