@extends('layout')

@section('content')
<div class="withdraw__container">
<div class="modal__wallet">
        <div class="modal__wallet_header">
            <div class="modal__wallet_header_nav">
                <a href="/wallet/pay" class="modal__wallet_header_item">
                    <i class='bx bx-plus-circle'></i>
                    <span>Deposits Disabled</span>
                </a>
                <a href="/wallet/withdraw" class="modal__wallet_header_item active">
                    <i class='bx bx-minus-circle'></i>
                    <span>Withdrawals Disabled</span>
                </a>
                <a href="/wallet/history" class="modal__wallet_header_item">
                    <i class='bx bx-history'></i>
                    <span>History</span>
                </a>
            </div>
        </div>
        <div class="modal__wallet_body" style="padding:24px;display:flex;flex-direction:column;gap:12px;">
            <h2 style="font-size:20px;margin:0;">Withdrawals are disabled</h2>
            <p style="margin:0;color:#cbd5e1;">We cannot process withdrawals or real-money transactions. This environment is for entertainment/testing only and uses virtual balances without cash value.</p>
            <p style="margin:0;color:#cbd5e1;">Feel free to keep playing the games in demo mode.</p>
            <a href="/" class="modal__wallet_sumbit" style="display:inline-block;text-align:center;">Return to games</a>
        </div>
    </div>
</div>
@endsection