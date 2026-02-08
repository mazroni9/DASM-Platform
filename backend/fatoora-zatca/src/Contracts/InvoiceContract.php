<?php

namespace Bl\FatooraZatca\Contracts;

interface InvoiceContract
{
    // ! remove return type for compatibility with php7.2
    public function report(); // : self;

    // ! remove return type for compatibility with php7.2
    public function calculate(); // : self;
}
