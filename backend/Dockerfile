FROM php:8.2-fpm

# Set working directory
WORKDIR /var/www/html

# Install dependencies including Supervisor and cron
RUN apt-get update && apt-get install -y \
    build-essential \
    libpng-dev \
    libjpeg62-turbo-dev \
    libfreetype6-dev \
    locales \
    zip \
    jpegoptim optipng pngquant gifsicle \
    vim \
    unzip \
    git \
    curl \
    libzip-dev \
    libonig-dev \
    libxml2-dev \
    supervisor \
    cron

# Clear cache
RUN apt-get clean && rm -rf /var/lib/apt/lists/*

# Install extensions
RUN docker-php-ext-install pdo_mysql mbstring zip exif pcntl bcmath gd xml

# Install PostgreSQL driver
RUN apt-get update && apt-get install -y libpq-dev && docker-php-ext-install pdo_pgsql

# Install composer
RUN curl -sS https://getcomposer.org/installer | php -- --install-dir=/usr/local/bin --filename=composer

# Create Supervisor configuration directory
RUN mkdir -p /etc/supervisor/conf.d

# Copy Supervisor configuration files
COPY supervisord.conf /etc/supervisor/supervisord.conf
COPY laravel-worker.conf /etc/supervisor/conf.d/laravel-worker.conf
COPY laravel-scheduler.conf /etc/supervisor/conf.d/laravel-scheduler.conf
COPY php-server.conf /etc/supervisor/conf.d/php-server.conf

# Create entrypoint script
COPY docker-entrypoint.sh /usr/local/bin/
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

# Add user for application
RUN groupadd -g 1000 www
RUN useradd -u 1000 -ms /bin/bash -g www www

# Copy existing application directory contents
COPY . /var/www/html

# Copy existing application directory permissions
COPY --chown=www:www . /var/www/html

# Create supervisor log directory
RUN mkdir -p /var/log/supervisor

# Change current user to www for composer install
USER www

# Install composer dependencies
RUN composer install --no-dev --optimize-autoloader

# Switch back to root for supervisor
USER root

# Expose port 8000 and start php server
EXPOSE 8000

# Set the entrypoint
ENTRYPOINT ["docker-entrypoint.sh"]

# Run supervisor which will manage all services (scheduler, queue, web server)
CMD ["/usr/bin/supervisord", "-c", "/etc/supervisor/supervisord.conf"]
