<?php

namespace App\Http\Requests\Exhibitor;

use Illuminate\Foundation\Http\FormRequest;

class UpdateAuctionSessionRequest extends FormRequest
{
    public function authorize(): bool
    {
        $session = \App\Models\AuctionSession::findOrFail($this->route('id'));
        return $this->user()?->can('update', $session) ?? false;
    }

    public function rules(): array
    {
        return [
            'name'         => ['sometimes','required','string','max:255'],
            'session_date' => ['sometimes','required','date'],
            'status'       => ['sometimes','required','in:scheduled,active,completed,cancelled,canceled'],
            'type'         => ['sometimes','required','in:live,instant,silent'],
            'description'  => ['nullable','string'],
        ];
    }
}
