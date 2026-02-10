@extends('layout')

@section('content')
<div class="bonus__container">
    <div class="bonus__grid">
        <div class="bonus__daily">
            <div class="bonus__text">
                Get a <span class="bonus_green">bonus every 24 hours</span>
            </div>
            <div class="bonus__button">
                <button class="daily_btn">Claim</button>
            </div>
        </div>
        <!-- <div class="bonus__vk">
            <div class="bonus__text">
                Get a bonus for subscribing to VK
            </div>
            <div class="bonus__button">
                @if(Auth::check() && Auth::user()->vk_bonus == 0)<button class="vk_bonus">Claim</button>@else<button class="vk_bonus success">Claimed</button>@endif
            </div>
        </div> -->
        @php
            $promo_x = [0, 1, 1, 2, 3, 4, 4, 5, 5, 6, 7];
        @endphp
        <div class="bonus__promo">
            <div class="bonus__inner">
                <div class="bonus__promo_group">
                    <div class="input__wrapper">
                        <input type="text" class="promo__input" placeholder="Enter promo code" id="promocode">
                    </div>
                    <div class="bonus__promo_x" style="@if(Auth::user()->rank <= 3) background: linear-gradient(90deg,#535353 0%,#6e6e6e 100%); @elseif(Auth::user()->rank >= 4) background:linear-gradient(90deg,#0A84FF 30%,#5AC8FA 100%); @elseif(Auth::user()->rank >= 7) background:linear-gradient(90deg,#5AC8FA 0%,#0A84FF 100%); @endif">
                        <p>Your multiplier: x{{$promo_x[Auth::user()->rank]}}</p>
                    </div>
                </div>
                <div class="bonus__button">
                    <button class="promo__activate_btn">Activate</button>
                </div>
            </div>
        </div>
        <div class="bonus__tg">
            <div class="bonus__text" style="max-width: 300px;">
                For security, link your Telegram  
            </div>
            <div class="bonus__button">
            @if(Auth::check() && Auth::user()->tg_id == NULL)
                <button class="tg_bonus bind_tg">Link</button>
                @else 
                <button class="tg_bonus success">Linked</button> 
                @endif
            </div>
        </div>
    </div>
    <div class="bonus__rules">
        <!-- <a href="https://vk.com/zubrix16" class="rules__sub">
            <i class='bx bxl-vk'></i>
        </a> -->
        <a href="https://t.me/BullMoney" class="rules__sub">
            <i class='bx bxl-telegram' ></i>
        </a>
    </div>
</div>

@if(Auth::check() && Auth::user()->tg_id == NULL)
<div class="modal__window modal_window_tg">
    <div class="modal__dialog modal__bind_tg">
        <div class="modal" style="border-radius: 15px;">
            <div class="modal__heading">
                Telegram Linking Instructions
                <div class="modal__close" style="top:9px;"><i class='bx bx-plus'></i></div>
            </div>
            <div class="modal__content">
                <p class="helps__bing_tg" style="margin-bottom: 7px; margin-top: 0px;">You need to link your Telegram account to the bot.
                    Copy the command and send it to the bot <a href="https://t.me/BullMoney_bot" target="_blank" class="colored-link">t.me/BullMoney_bot</a>
                </p>
                <div class="bind__tg_code">
                    <div class="bint_code_form">
                        <input type="text" class="bind_code" disabled value="/bind {{Auth::user()->unique_id}}">
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>
@endif
@endsection