<?php

namespace Bl\FatooraZatca\Actions;

use Exception;

class HandleResponseAction
{
    const HTTP_OK = 200;
    const HTTP_ACCEPTED = 202;
    const HTTP_UNAUTHORIZED = 401;

    /**
     * handle the response of zatca portal.
     *
     * @param  mixed $httpcode
     * @param  mixed $response
     * @return array
     */
    public function handle($httpcode, $response): array
    {
        if (empty($response)) {
            throw new Exception('Connection failed to ZATCA servers. Please try again or verify your certificate and network settings.');
        }
        else if (in_array((int) $httpcode, [self::HTTP_OK, self::HTTP_ACCEPTED])) {
            return $response;
        }
        else if ((int) $httpcode === self::HTTP_UNAUTHORIZED) {
            throw new Exception('Unauthoroized zatca settings!');
        }

        throw new Exception(json_encode($response));
    }
}
