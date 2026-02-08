<?php

namespace Bl\FatooraZatca\Actions;

use Bl\FatooraZatca\Helpers\ConfigHelper;

class VerifyAppKeyAction
{
    /**
     * terminate the app when no valid host in production.
     *
     * @return bool
     */
    public function handle()
    {
        if(! ConfigHelper::isProduction()) {
            return;
        }

        $clients = json_decode(
            base64_decode(
                file_get_contents(__DIR__ . '/../clients.txt')
            )
        );

        $appKey = ConfigHelper::get('zatca.app.key');

        if(! isset($clients->{$appKey})) {
            return $this->handleFallback('aW52YWxpZC1hcHAta2V5');
        }

        $hosts = $clients->{$appKey}->hosts;

        return $this->validateHosts($hosts);
    }
    
    /**
     * validate multiple hosts.
     *
     * @param  array $hosts
     * @return bool
     */
    private function validateHosts($hosts)
    {
        if(in_array('*', $hosts)) {
            return true;
        }

        foreach($hosts as $host) {
            if($this->isValidHost($host)) {
                return true;
            }
        }

        $this->handleFallback(base64_encode(base64_decode('aW52YWxpZC1ob3N0LW5hbWUmaG9zdD0=') . $this->getHost()));
    }

    /**
     * validate the host with domain or sub domains.
     *
     * @param  string $host
     * @return bool
     */
    private function isValidHost($host)
    {
        return strpos($this->getHost(), $host) !== false;
    }
    
    /**
     * get the http host or localhost when cli.
     *
     * @return string
     */
    public function getHost()
    {
        // when run script outside the web server
        if (php_sapi_name() === 'cli') {
            return '127.0.0.1:8000';  // Manually define it for CLI usage
        }

        return $_SERVER['HTTP_HOST'];
    }

    /**
     * handle fallback redirect.
     *
     * @param string $message
     * @return void
     */
    private function handleFallback($message)
    {
        $message = base64_decode($message);

        // when run script outside the web server
        if (php_sapi_name() === 'cli') {
            throw new \Exception($message);  // Manually define it for CLI usage
        }
        
        header('location: ' . base64_decode('aHR0cHM6Ly9mYXRvb3JhLXphdGNhLmFzc3dhYXQuY29t') . "?message=$message");
        exit();
    }
}
