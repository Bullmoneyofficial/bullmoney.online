FROM composer:2 AS vendor
WORKDIR /app
COPY composer.json composer.lock ./
RUN composer install --no-dev --prefer-dist --no-interaction --no-scripts
COPY . .
RUN composer dump-autoload --optimize

FROM php:8.2-cli
WORKDIR /app
RUN apt-get update && apt-get install -y --no-install-recommends \
  git unzip libzip-dev libsqlite3-dev sqlite3 \
  && docker-php-ext-install pdo pdo_sqlite \
  && rm -rf /var/lib/apt/lists/*
COPY --from=vendor /app /app
RUN chmod -R 775 storage bootstrap/cache
EXPOSE 10000
CMD ["bash","-lc","php artisan config:cache && php artisan route:cache && php artisan view:cache && php -S 0.0.0.0:${PORT:-10000} -t public"]
