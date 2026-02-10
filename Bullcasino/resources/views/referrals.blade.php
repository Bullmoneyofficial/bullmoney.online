@extends('layout')

@section('content')
<div class="referrals__container">
    <div class="referrals__wrapper">
        <p class="referrals__title">Information</p>
        <div class="refferals__info">
            <div class="block__refferals_info">
                <div class="amount__refferals">{{ App\Models\User::where('referred_by', Auth::user()->ref_code)->count() }}</div>
                <div class="amount__refferals_title">Referrals</div>
            </div>
            <div class="block__refferals_info">
                <div class="amount__refferals">{{Auth::user()->ref_money}}</div>
                <div class="amount__refferals_title">Income</div>
            </div>
        </div>
        <p class="referrals__title">Referral System</p>
        <div class="referrals__system">
            <div class="referrals_system_title">Earn from deposits!</div>
            <div class="referrals_system_description">Get @if(Auth::user()->youtuber == 1) 20% @else 10% @endif from your referrals' deposits</div>
            <div class="referrals__link">
                <input id="parther" type="text" class="referrals__link_input" readonly="readonly" value="https://{{$settings->domain}}/parther/{{Auth::user()->ref_code}}">
                <button class="copy__referrals_link">Copy</button>
            </div>
        </div>
    </div>
</div>
@endsection