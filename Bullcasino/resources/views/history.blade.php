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
                <a href="/wallet/withdraw" class="modal__wallet_header_item">
                    <i class='bx bx-minus-circle'></i>
                    <span>Withdrawals Disabled</span>
                </a>
                <a href="/wallet/history" class="modal__wallet_header_item active">
                    <i class='bx bx-history'></i>
                    <span>History</span>
                </a>
            </div>
        </div>
        <div class="history__content" style="padding:24px;display:flex;flex-direction:column;gap:12px;">
            <h2 style="font-size:20px;margin:0;">Payment history disabled</h2>
            <p style="margin:0;color:#cbd5e1;">We do not process deposits or withdrawals and keep no payment history. Balances are virtual and used only for demo play.</p>
            <a href="/" class="modal__wallet_sumbit" style="display:inline-block;text-align:center;align-self:flex-start;">Return to games</a>
        </div>
    </div>
</div>
@endsection