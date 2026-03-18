<?php

declare(strict_types=1);

return [
    /*
     * ------------------------------------------------------------------------
     * Default Firebase project
     * ------------------------------------------------------------------------
     */

    'default' => env('FIREBASE_PROJECT', 'app'),

    /*
     * ------------------------------------------------------------------------
     * Firebase project configurations
     * ------------------------------------------------------------------------
     */

    'projects' => [
        'app' => [

            /*
             * ------------------------------------------------------------------------
             * Credentials / Service Account
             * ------------------------------------------------------------------------
             *
             * In order to access a Firebase project and its related services using a
             * server SDK, requests must be authenticated. For server-to-server
             * communication this is done with a Service Account.
             *
             * If you don't already have generated a Service Account, you can do so by
             * following the instructions from the official documentation pages at
             *
             * https://firebase.google.com/docs/admin/setup#initialize_the_sdk
             *
             * Once you have downloaded the Service Account JSON file, you can use it
             * to configure the package.
             *
             * If you don't provide credentials, the Firebase Admin SDK will try to
             * auto-discover them
             *
             * - by checking the environment variable FIREBASE_CREDENTIALS
             * - by checking the environment variable GOOGLE_APPLICATION_CREDENTIALS
             * - by trying to find Google's well known file
             * - by checking if the application is running on GCE/GCP
             *
             * If no credentials file can be found, an exception will be thrown the
             * first time you try to access a component of the Firebase Admin SDK.
             *
             */

            //'credentials' => env('FIREBASE_CREDENTIALS', env('GOOGLE_APPLICATION_CREDENTIALS')),
            'credentials' => [
                "type" => "service_account",
                "project_id" => "mazad-e",
                "private_key_id" => "652f356459154b5441523398fa6592c551eb1093",
                "private_key" => "-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC+FIHnhJSj8c5+\ne5c2RqFSHUShjzFBVCvEwZIAXnVw9E+rVBlxM0oNSjFnbvQfNnejlu+7ZH/0+00q\n8rWP3BPHfnRv7vph4yED6NxjP+nmwAY+vcLSjXUK0Qm0qs4yOz24Km1fi7cfQJYc\nAjaJuciAPHgCryqGWTYoCMUukZMYKDKGJgQSbjhBvMgR8ojPP+cu5IXvzQOwdv4F\nb1bApmmHTyP5qQF3AoYpOOb53R9Ny42VGffJtD5hexX0l3ALGE1c8ix5E6c5bk4z\nzJ30/LoG799YaFbxXZlUh0JzkkPf26Ir7i+8R/0Ee8Dka1DLl12k9F9kx+0aNWNa\ne7Mt2V2pAgMBAAECggEAAb/VETrAY0Df5/yYGYUG/Sc6Gp8jf1v4gIzqgwV1IPC/\neFtwb4EFSUy5pyxkShKmTiBe8Caee3RboBqDO46om1epcSut7Lwz8W7RczowAb8z\n+RxZRtBL95x3l/M34H3FYksSEVGX6ICS6rEsUmveC0YWZN0hVk9+xtmlabmnwagx\nW+udx6trJvxEMyMpbuuox9l95qPPF/XpGWuwLCL4HZQyF/B2O/HzjfRopffK0rXk\nGm551jAsqsP8I2cuTi9xF4985Tw2Qix/g/fP5sKHVwPKXRlq91rdAdKD59QqP8tE\n/qX8Ze/s95kjaKk0VoiEtr0i7su5edLjISVpfpurrQKBgQD5dyfrrQdFOUKJYjEg\n7ONW0fVNuaL0rN8aB/lB4X2FqrGZRd2VQRiiUKCTgS95jDLdhUzjAodAj9Dfyq+u\nZ+yGRlfZ64AsQrJhf9XnXOoVr3rwETKYJogd7m2fX+Xohu3eHIr0vXTdUU/bLJCX\nk+DOebt+tYHki2aKt36Yd7dHLQKBgQDDDyFdsQ8U0RSTszBCpbD2hYW/FatZfqLh\nHKQ9/UGHH3A+pjtGAhiJNGU47sLUrT0WjdNgV+IeSvKDVOn7KcL45SoOVgOTwc3G\n24J4+juO00uExQrkQrQ438xgnMITgeEPB5CgJoVSiZhsWa/l6owoukH+cgC2pFe5\n6hXwHEn97QKBgDhvVl6glCZ636yIxCh4rq1zbhUZS94iRY50A1V+F5FnninYflpH\nkbUWnF0COqU6rD8k6tHoPoTChDQ8fCXuaLmvrCwmdKaOqCAadV+Ty3kAa8VnfpSh\nEuYCjFYjsbU64REAUAcx3QA8Zt5kZImF8LOFIn91vF7hkl8LR95iJto5AoGAA0MV\ng8OaRPbaKT4t6G9s7jJ9chyiqPR9NNaNyJubpO7ZqbKN+zW9w02lA7a6e2QKSX5F\nsq7FkUwfkiKxZwnjwNXURjkaBjaPgmvZWryUkmbmNGo3LGoRKYJUoKj+deUOJnox\n6Pu77w1uByHY1zd88JFs2Rx+9o75CJrpkwJmGmECgYEAqGv8cjwGGXoeovPzScvx\nLav1Y44byVtx7zDP3D/RP31tOCBY/zxIPHOhzUCfOTmNIk7dCI5k6raRScejcL1U\nrMMI6hyiENi/2hslTOHUane6QglbLaoqi7i6QzJbDI10OLCqHfAlB8PJvpgIqTWS\nPJUCCGlpZjBRm7VY9b6fHpY=\n-----END PRIVATE KEY-----\n",
                "client_email" => "firebase-adminsdk-fbsvc@mazad-e.iam.gserviceaccount.com",
                "client_id" => "116793496952480775943",
                "auth_uri" => "https://accounts.google.com/o/oauth2/auth",
                "token_uri" => "https://oauth2.googleapis.com/token",
                "auth_provider_x509_cert_url" => "https://www.googleapis.com/oauth2/v1/certs",
                "client_x509_cert_url" => "https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-fbsvc%40mazad-e.iam.gserviceaccount.com",
                "universe_domain" => "googleapis.com"
            ],

            /*
             * ------------------------------------------------------------------------
             * Firebase Auth Component
             * ------------------------------------------------------------------------
             */

            'auth' => [
                'tenant_id' => env('FIREBASE_AUTH_TENANT_ID'),
            ],

            /*
             * ------------------------------------------------------------------------
             * Firestore Component
             * ------------------------------------------------------------------------
             */

            'firestore' => [

                /*
                 * If you want to access a Firestore database other than the default database,
                 * enter its name here.
                 *
                 * By default, the Firestore client will connect to the `(default)` database.
                 *
                 * https://firebase.google.com/docs/firestore/manage-databases
                 */

                // 'database' => env('FIREBASE_FIRESTORE_DATABASE'),
            ],

            /*
             * ------------------------------------------------------------------------
             * Firebase Realtime Database
             * ------------------------------------------------------------------------
             */

            'database' => [

                /*
                 * In most of the cases the project ID defined in the credentials file
                 * determines the URL of your project's Realtime Database. If the
                 * connection to the Realtime Database fails, you can override
                 * its URL with the value you see at
                 *
                 * https://console.firebase.google.com/u/1/project/_/database
                 *
                 * Please make sure that you use a full URL like, for example,
                 * https://my-project-id.firebaseio.com
                 */

                'url' => env('FIREBASE_DATABASE_URL'),

                /*
                 * As a best practice, a service should have access to only the resources it needs.
                 * To get more fine-grained control over the resources a Firebase app instance can access,
                 * use a unique identifier in your Security Rules to represent your service.
                 *
                 * https://firebase.google.com/docs/database/admin/start#authenticate-with-limited-privileges
                 */

                // 'auth_variable_override' => [
                //     'uid' => 'my-service-worker'
                // ],

            ],

            'dynamic_links' => [

                /*
                 * Dynamic links can be built with any URL prefix registered on
                 *
                 * https://console.firebase.google.com/u/1/project/_/durablelinks/links/
                 *
                 * You can define one of those domains as the default for new Dynamic
                 * Links created within your project.
                 *
                 * The value must be a valid domain, for example,
                 * https://example.page.link
                 */

                'default_domain' => env('FIREBASE_DYNAMIC_LINKS_DEFAULT_DOMAIN'),
            ],

            /*
             * ------------------------------------------------------------------------
             * Firebase Cloud Storage
             * ------------------------------------------------------------------------
             */

            'storage' => [

                /*
                 * Your project's default storage bucket usually uses the project ID
                 * as its name. If you have multiple storage buckets and want to
                 * use another one as the default for your application, you can
                 * override it here.
                 */

                'default_bucket' => env('FIREBASE_STORAGE_DEFAULT_BUCKET'),

            ],

            /*
             * ------------------------------------------------------------------------
             * Caching
             * ------------------------------------------------------------------------
             *
             * The Firebase Admin SDK can cache some data returned from the Firebase
             * API, for example Google's public keys used to verify ID tokens.
             *
             */

            'cache_store' => env('FIREBASE_CACHE_STORE', 'file'),

            /*
             * ------------------------------------------------------------------------
             * Logging
             * ------------------------------------------------------------------------
             *
             * Enable logging of HTTP interaction for insights and/or debugging.
             *
             * Log channels are defined in config/logging.php
             *
             * Successful HTTP messages are logged with the log level 'info'.
             * Failed HTTP messages are logged with the log level 'notice'.
             *
             * Note: Using the same channel for simple and debug logs will result in
             * two entries per request and response.
             */

            'logging' => [
                'http_log_channel' => env('FIREBASE_HTTP_LOG_CHANNEL'),
                'http_debug_log_channel' => env('FIREBASE_HTTP_DEBUG_LOG_CHANNEL'),
            ],

            /*
             * ------------------------------------------------------------------------
             * HTTP Client Options
             * ------------------------------------------------------------------------
             *
             * Behavior of the HTTP Client performing the API requests
             */

            'http_client_options' => [

                /*
                 * Use a proxy that all API requests should be passed through.
                 * (default: none)
                 */

                'proxy' => env('FIREBASE_HTTP_CLIENT_PROXY'),

                /*
                 * Set the maximum amount of seconds (float) that can pass before
                 * a request is considered timed out
                 *
                 * The default time out can be reviewed at
                 * https://github.com/kreait/firebase-php/blob/6.x/src/Firebase/Http/HttpClientOptions.php
                 */

                'timeout' => env('FIREBASE_HTTP_CLIENT_TIMEOUT'),

                'guzzle_middlewares' => [
                    // MyInvokableMiddleware::class,
                    // [MyMiddleware::class, 'static_method'],
                ],
            ],
        ],
    ],
];
