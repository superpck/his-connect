docker compose  down -v
docker compose -f compose.prod.yml  up -d --build
docker compose logs -f
