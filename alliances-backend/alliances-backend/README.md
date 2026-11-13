# Alliances backend

Spring Boot 3 (Java 17) REST API + STOMP chat socket for the Alliances frontend (landing, login, dashboard).
It connects to **your existing database**. It does not create, seed or change anything there.

## Run

1. Keep the JDBC driver for your database in `pom.xml` (MySQL or PostgreSQL), delete the other.
2. Set environment variables, then `mvn spring-boot:run`:

| Variable | Example |
|---|---|
| `DB_URL` | `jdbc:mysql://localhost:3306/alliances` or `jdbc:postgresql://localhost:5432/alliances` |
| `DB_USER`, `DB_PASSWORD` | your database login |
| `JWT_SECRET` | any random string, **32+ characters** |
| `GOOGLE_CLIENT_ID` | optional until Google sign-in is wired (OAuth client id) |
| `CORS_ORIGINS` | optional, default `http://127.0.0.1:5500,http://localhost:5500` (Live Server) |
| `DDL_AUTO` | optional, default `validate` (checks tables, never alters them) |

On start-up Hibernate **validates** your tables against the entities. If something differs, the error names
the missing table or column. Fix by either renaming in your DB or changing `@Table` / `@Column` in `domain/`.

## Tables the code expects

| Table | Columns |
|---|---|
| `users` | id, email (unique), password_hash (null for Google), provider (EMAIL/GOOGLE), name, username (unique), pronouns, bio, pfp, college, department, study_year, section, github, linkedin, leetcode, other_link, created_at |
| `user_skills` | user_id, skill |
| `posts` | id, tab (HACKATHON...), author_id, title, link, has_idea, idea_text, team_size, description, deadline (date), status (OPEN/CLOSED/EXPIRED), created_at |
| `post_skills` | post_id, skill |
| `join_requests` | id, post_id, from_user_id, note, status (PENDING/ACCEPTED/REJECTED/EXPIRED), reason, reject_note, sys_note, created_at, decided_at. Unique (post_id, from_user_id) |
| `notifications` | id, user_id, text, target, seen, created_at |
| `chats` | id, post_id, name, owner_id, closed, created_at |
| `chat_members` | chat_id, user_id |
| `messages` | id, chat_id, sender_id (null = system), is_system, body, created_at |

## API (all except `/api/auth/**` and `/api/meta` need `Authorization: Bearer <token>`)

| Area | Endpoint |
|---|---|
| Auth | `POST /api/auth/login` · `POST /api/auth/register` · `POST /api/auth/google` · `POST /api/auth/google/register` |
| Users | `GET/PUT /api/users/me` · `GET /api/users/{id}` · `GET /api/users/username-available?username=` |
| Posts | `GET /api/posts?tab=hackathon&idea=any\|has\|none&skills=Java,React&includeClosed=false` · `POST /api/posts` · `GET /api/posts/mine` · `GET /api/posts/{id}` · `POST /api/posts/{id}/close` |
| Requests | `POST /api/posts/{id}/requests` · `GET /api/requests/received` · `GET /api/requests/sent` · `DELETE /api/requests/{id}` (withdraw) · `POST /api/requests/{id}/accept` · `.../decline` · `.../revive` |
| Notifications | `GET /api/notifications` · `POST /api/notifications/read-all` · `POST /api/notifications/{id}/read` |
| Chats | `GET /api/chats` · `GET /api/chats/by-post/{postId}` · `GET/POST /api/chats/{id}/messages` · `POST /api/chats/{id}/leave` · `POST /api/chats/{id}/close` |
| Meta | `GET /api/meta` (decline reasons, departments, years, preset skills) |
| Live chat | SockJS `/ws`, STOMP CONNECT header `Authorization: Bearer <token>`, subscribe `/topic/chats/{id}` |

Errors are always `{ "code": "...", "message": "..." }`. Useful codes: `ACCOUNT_NOT_FOUND` (404 on login, the
frontend opens the set-up screens), `ACCOUNT_EXISTS`, `USERNAME_TAKEN`, `ALREADY_IN_TEAM`, `NOT_OPEN`.

## Rules enforced on the server

- Everything except auth needs a valid JWT (content is visible only to logged-in users).
- Login by email + BCrypt password, or Google ID token (checked against `GOOGLE_CLIENT_ID`).
- One team per hackathon per user (checked on create post, send request and accept).
- No requests on your own post, on closed/expired posts, or twice on the same post.
- Only the post owner can accept, decline, revive or close. Decline reason must be one of the four presets, plus an optional note.
- Closing a post early or a deadline passing (scheduler, every minute) expires pending requests and notifies everyone.
- Revive brings back a declined/expired request; a closed post reopens for 3 more days.
- A team chat is created only when a request is accepted. Members can leave, only the owner closes it for everyone, nobody outside the chat can read it or subscribe to it.

## Not done yet

Compiled and run-tested on your machine is the next step. Edit profile screen, the six other tabs (the `tab` field is ready),
Cloudinary for photos (photo is stored as text for now), automated tests, and moving Google check from the tokeninfo endpoint to Google's verifier library.
