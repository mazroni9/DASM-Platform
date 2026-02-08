<?php

namespace App\Models;

use Bl\FatooraZatca\Classes\ReportMethod;

class ZatcaUser extends User
{
    /**
     * The table associated with the model.
     *
     * @var string
     */
    protected $table = 'users';

    /**
     * The attributes that are mass assignable.
     *
     * @var array
     */
    protected $fillable = [
        'zatca_fields',
        'zatca_settings',
    ];

    /**
     * The attributes that should be cast to native types.
     *
     * @var array
     */
    protected $casts = [
        'zatca_fields' => 'array',
        'zatca_settings' => 'array',
    ];

    public function getZatcaVerifiedAttribute()
    {
        return ! empty($this->zatca_settings);
    }

    public function getReportMethodAttribute()
    {
        return $this->getZatcaField('report_method') ?? ReportMethod::AUTO;
    }

    public function getZatcaField($key)
    {
        return $this->zatca_fields[$key] ?? NULL;
    }

    public function setZatcaFields($array) 
    {
        $this->zatca_fields = array_merge($this->zatca_fields, $array);
    }
}
