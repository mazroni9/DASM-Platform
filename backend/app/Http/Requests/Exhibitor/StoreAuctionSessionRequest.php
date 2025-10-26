<?php

namespace App\Http\Requests\Exhibitor;

use Illuminate\Foundation\Http\FormRequest;

class StoreAuctionSessionRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->can('create', \App\Models\AuctionSession::class) ?? false;
    }

    public function rules(): array
    {
        return [
            'name'         => ['required','string','max:255'],
            'session_date' => ['required','date'], // يفضل datetime
            'status'       => ['required','in:scheduled,active,completed,cancelled'],
            'type'         => ['required','in:live,instant,silent'],
            'description'  => ['nullable','string'],
            // مفيش user_id من الواجهة للمعرض — هانضبطه من auth()->id()
        ];
    }
}
