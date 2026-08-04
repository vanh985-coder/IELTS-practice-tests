# IELTS-practice-tests
Web for IELTS practice tests
![Test](https://github.com/<vanh985-coder>/IELTS-practice-tests/actions/workflows/test.yml/badge.svg)
## Chạy test

```bash
npm test              # unit test (40)
npm run test:int      # integration test (cần Docker)
```

Integration test cần Postgres + Redis:
```bash
docker compose -f docker-compose.test.yml up -d
npx dotenv -e .env.test -- npx prisma migrate deploy
```