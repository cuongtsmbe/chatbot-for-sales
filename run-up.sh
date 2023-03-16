if [ -n "$env" ]; then
  docker compose -f docker-compose.${env}.yml up $@
else
  docker compose up $@
fi

docker system prune -f

