if [ -n "$env" ]; then
  docker compose -f docker-compose.${env}.yml down $@
else
  docker compose down $@
fi