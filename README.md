# Social Autoposter (100% free, GitHub par chalta hai)

RSS (parent automation) se naya article aate hi Facebook, Instagram, Threads aur Pinterest (child automations) par auto-post.

- **Scheduler:** GitHub Actions, har 10 minute (free)
- **Secrets:** GitHub Secrets (code mein kabhi nahi)
- **Dashboard:** GitHub Pages (`docs/index.html`), free
- **Database:** nahi chahiye, state `data/state.json` mein save hoti hai

## Setup (5 steps)
1. **Repo banayein (Public rakhein)** aur is folder ki saari files upload karein. `.github/workflows/autopost.yml` zaroor upload ho. Public repo mein Actions aur Pages free hain. Private mein Actions ke minutes limited aur Pages paid hota hai.
2. **Secrets dalein:** Repo → Settings → Secrets and variables → Actions → New repository secret. Names neeche list mein hain.
3. **Pages on karein:** Settings → Pages → Source: *Deploy from a branch* → Branch `main`, folder `/docs` → Save. Dashboard `https://USERNAME.github.io/REPO/` par khulega.
4. **Dashboard token banayein:** GitHub → Settings → Developer settings → Fine-grained tokens → sirf isi repo ko select karein → Repository permissions: **Contents: Read and write**, **Actions: Read and write**. Dashboard kholein, `username/repo` aur token dal kar Connect dabayein.
5. **Automation banayein:** "New parent automation" → RSS URL dalein → "Add child" se Facebook/Instagram/Threads/Pinterest add karein → Save → Run now.

Pehli run mein purane articles skip hote hain, sirf aage ke naye articles post hote hain. Phir har 10 minute auto chalta hai.

## Secrets ki list
| Platform | Secrets |
|---|---|
| Facebook | `FACEBOOK_PAGE_ID`, `FACEBOOK_PAGE_TOKEN` |
| Instagram | `INSTAGRAM_USER_ID` (+ optional `INSTAGRAM_ACCESS_TOKEN`, khali ho to Facebook wala token use hota hai) |
| Threads | `THREADS_USER_ID`, `THREADS_ACCESS_TOKEN` |
| Pinterest | `PINTEREST_BOARD_ID`, `PINTEREST_ACCESS_TOKEN` (optional: `PINTEREST_REFRESH_TOKEN`, `PINTEREST_APP_ID`, `PINTEREST_APP_SECRET`, `PINTEREST_API_BASE`) |
| Optional | `GRAPH_API_VERSION` (default `v24.0`) |

## Tokens kaise milte hain (apne accounts ke liye app review nahi chahiye)
**Facebook + Instagram (aik hi Meta app):**
1. Instagram account **Business/Creator** ho aur Facebook Page se linked ho.
2. developers.facebook.com → Create App (Business).
3. Graph API Explorer mein permissions select karein: `pages_show_list`, `pages_manage_posts`, `pages_read_engagement`, `instagram_basic`, `instagram_content_publish`, `business_management`. User token generate karein.
4. Is ko long-lived banayein: `GET /oauth/access_token?grant_type=fb_exchange_token&client_id=APP_ID&client_secret=APP_SECRET&fb_exchange_token=TOKEN`.
5. `GET /me/accounts` se Page ka `id` (= `FACEBOOK_PAGE_ID`) aur `access_token` (= `FACEBOOK_PAGE_TOKEN`) milega.
6. `GET /PAGE_ID?fields=instagram_business_account` se `INSTAGRAM_USER_ID` milega.

**Threads:** Meta app mein Threads use case add karein, apne account ko Threads Tester banayein, token `threads_basic` + `threads_content_publish` ke saath generate karein, aur long-lived mein badlein (`GET https://graph.threads.net/access_token?grant_type=th_exchange_token&client_secret=APP_SECRET&access_token=TOKEN`). `GET https://graph.threads.net/v1.0/me?fields=id` se `THREADS_USER_ID`. Ye token ~60 din mein expire hota hai, dobara bana kar secret update karein.

**Pinterest:** developers.pinterest.com par app banayein, scopes `pins:write`, `boards:read`. Trial access mein pins sirf sandbox mein chalte hain (`PINTEREST_API_BASE=https://api-sandbox.pinterest.com/v5`). Asli posting ke liye Pinterest ka Standard access approval chahiye. Board id `GET /v5/boards` se milta hai.

## Zaroori baatein
- GitHub ka schedule "best effort" hai, kabhi kabhi 10 minute ki jagah thora late chalta hai.
- Public repo mein 60 din tak koi activity na ho to GitHub scheduled runs band kar deta hai. Actions tab mein workflow dobara Enable kar dein.
- Config aur post-log public repo mein nazar aate hain (RSS URL, article links). **Secrets kabhi nazar nahi aate.**
- Instagram aur Pinterest ko image chahiye; RSS image ya article ka og:image use hota hai. Instagram ke liye JPEG/PNG behtar hai.
- Har post 3 dafa retry hoti hai, phir "failed" log hoti hai.
- Naya platform add karna: `src/publishers/` mein nayi file (publish + configured), `index.js` mein register, aur dashboard ki `PLAT` list mein naam.

## Local test
`cp .env.example .env`, values bharein, `npm install`, `npm run dry` (sirf dikhata hai, post nahi karta) ya `npm start`.
