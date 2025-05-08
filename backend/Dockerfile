# استخدام صورة PHP رسمية

FROM php:8.1-fpm

# تثبيت الامتدادات اللازمة لـ Composer

RUN apt-get update && apt-get install -y \
git \
unzip \
&& rm -rf /var/lib/apt/lists/\*

# تثبيت Composer

RUN curl -sS https://getcomposer.org/installer | php -- --install-dir=/usr/local/bin --filename=composer

# نسخ ملف cacert.pem إلى داخل الحاوية

COPY cacert.pem /usr/local/etc/php/cacert.pem

# تحديث ملف php.ini ليشير إلى cacert.pem

RUN echo "\[openssl\]" &gt;&gt; /usr/local/etc/php/php.ini \
&& echo "openssl.cafile=/usr/local/etc/php/cacert.pem" &gt;&gt; /usr/local/etc/php/php.ini \
&& echo "\[curl\]" &gt;&gt; /usr/local/etc/php/php.ini \
&& echo "curl.cainfo=/usr/local/etc/php/cacert.pem" &gt;&gt; /usr/local/etc/php/php.ini

# ضبط الأذونات لملف cacert.pem

RUN chmod 644 /usr/local/etc/php/cacert.pem