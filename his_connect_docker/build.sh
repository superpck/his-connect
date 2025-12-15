docker compose  down -v
docker compose -f compose.prod.yaml  up -d --build
docker compose logs -f
