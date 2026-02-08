<?php

namespace App\Http\Controllers\Exhibitor;

use App\Http\Controllers\Controller;
use App\Http\Requests\Exhibitor\ExhibitorZatcaVerifyRequest;
use App\Models\ZatcaUser;
use Bl\FatooraZatca\Objects\Setting;
use Bl\FatooraZatca\Zatca;
use Exception;

class ExhibitorZatcaVerifyController extends Controller
{
    /**
     * Handle the incoming request.
     */
    public function __invoke(ExhibitorZatcaVerifyRequest $request)
    {
        $zatca = ZatcaUser::query()->find(auth()->id());

        $settings = new Setting(
            $request->input('otp'),
            $zatca->getZatcaField('email'),
            $zatca->getZatcaField('common_name'),
            $zatca->getZatcaField('organizational_unit_name'),
            $zatca->getZatcaField('organization_name'),
            $zatca->getZatcaField('tax_number'),
            $zatca->getZatcaField('registered_address'),
            $zatca->getZatcaField('business_category'),
            $zatca->getZatcaField('egs_serial_number'),
            $zatca->getZatcaField('registration_number'),
            $zatca->getZatcaField('invoice_report_type')
        );

        try {
            
            config()->set('zatca.app.environment', $zatca->getZatcaField('environment'));

            $zatca->zatca_settings = Zatca::generateZatcaSetting($settings);

            $zatca->setZatcaFields([
                'egs_serial_number' => $settings->egsSerialNumber,
            ]);

            $zatca->save();

            $output = [
                'success' => true,
                'data' => [],
            ];
        }
        catch(Exception $e) {
            $output = [
                'success' => false,
                'data' => [
                    'message' => $e->getMessage()
                ],
            ];
        }

        return response()->json($output);
    }
}
