@extends('layout')

@section('content')
<div class="pay__container">
    <div class="modal__wallet">
        <div class="modal__wallet_header">
            <div class="modal__wallet_header_nav">
                <a href="/wallet/pay" class="modal__wallet_header_item modal__pay active">
                    <i class='bx bx-plus-circle'></i>
                    <span>Deposits Disabled</span>
                </a>
                <a href="/wallet/withdraw" class="modal__wallet_header_item modal__withdraw">
                    <i class='bx bx-minus-circle'></i>
                    <span>Withdrawals Disabled</span>
                </a>
                <a href="/wallet/history" class="modal__wallet_header_item modal__history">
                    <i class='bx bx-history'></i>
                    <span>History</span>
                </a>
            </div>
        </div>
        <div class="modal__wallet_body" style="padding:24px;display:flex;flex-direction:column;gap:12px;">
            <h2 style="font-size:20px;margin:0;">Wallet actions are disabled</h2>
            <p style="margin:0;color:#cbd5e1;">We do not have gambling rights and operate in demo mode only. Deposits are unavailable and balances are virtual with no monetary value.</p>
            <p style="margin:0;color:#cbd5e1;">You can still explore and play the games for entertainment/testing purposes.</p>
            <a href="/" class="modal__wallet_sumbit" style="display:inline-block;text-align:center;">Return to games</a>
        </div>
    </div>
</div>
@endsection