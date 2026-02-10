<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="csrf-token" content="{{ csrf_token() }}" />
    <meta content="bullmoney, games, entertainment, dice, mines, crash, jackpot, wheel, premium" name="keywords">

    <link rel="stylesheet" href="/assets/css/style.css">
    <link rel="icon" href="/assets/images/favicon.ico" type="image/x-icon">
    <link href='https://unpkg.com/boxicons@2.1.4/css/boxicons.min.css' rel='stylesheet'>
    <link rel="stylesheet" href="/assets/css/notifyme.css">

    <script src="https://cdnjs.cloudflare.com/ajax/libs/jquery/3.6.3/jquery.min.js" integrity="sha512-STof4xm1wgkfm7heWqFJVn58Hm3EtS31XFaagaa8VMReCXAkQnJZ+jEy8PCC/iT18dFy95WcExNHFTqLyp72eQ==" crossorigin="anonymous" referrerpolicy="no-referrer"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/jquery-cookie/1.4.1/jquery.cookie.min.js" integrity="sha512-3j3VU6WC5rPQB4Ld1jnLV7Kd5xr+cq9avvhwqzbH/taCRNURoeEpoPBK9pDyeukwSxwRPJ8fDgvYXd6SkaZ2TA==" crossorigin="anonymous" referrerpolicy="no-referrer"></script>
    <script src='https://cdnjs.cloudflare.com/ajax/libs/socket.io/2.0.3/socket.io.js'></script>
    <script src="/assets/js/jquery.kinetic.min.js"></script>
    <script src="/assets/js/notifyme.min.js"></script>
    <script src="/assets/js/app.js"></script>
    <script src="/assets/js/socket.js"></script>

    <title>BullMoney — Demo Games (No Real Gambling)</title>
</head>
<body>
    <script>
        const client_user = {{Auth::User()->id}};
    </script>
    <div style="background:#111827;color:#f9fafb;padding:10px 16px;text-align:center;font-size:14px;line-height:1.5;border-bottom:1px solid #1f2937;">
        Demo mode only. We do not hold a gambling license, do not process deposits or withdrawals, and all balances are virtual for entertainment/testing purposes only.
    </div>
    <div class="navbar">
        <div class="logotype">
            <a href="/" class="logo" style="display:flex;align-items:center;gap:10px;text-decoration:none;">
                <img src="/assets/images/IMG_2921.PNG" alt="BullMoney" style="height:32px;width:32px;object-fit:contain;border-radius:6px;">
                <span class="bull-logo">Bull<span class="accent">Money</span></span>
            </a>
        </div> 
        <div class="navmenu">
            <ul class="navmenu__list">
                <li class="navmenu__item">
                    <a href="/" class="navmenu__item_link {{ request()->routeIs('index') ? 'active' : '' }}">Home</a>
                </li>
                <li class="navmenu__item">
                    <a href="/bonus" class="navmenu__item_link {{ request()->routeIs('bonus') ? 'active' : '' }}">Bonuses</a>
                </li>
                <li class="navmenu__item">
                    <a href="/profile" class="navmenu__item_link {{ request()->routeIs('profile') ? 'active' : '' }}">Profile</a>
                </li>
                <li class="navmenu__item">
                    <a href="/referrals" class="navmenu__item_link {{ request()->routeIs('referrals') ? 'active' : '' }}">Referrals</a>
                </li>
            </ul>
        </div>
        <div class="user__wallet">
            <div class="user__balance">
                <span id="balance">{{Auth::user()->balance}} <span class="ruble">₽</span></span>
            </div>
            <a href="/wallet/pay" class="wallet_up_btn" aria-disabled="true" onclick="return false;" title="Wallet actions are disabled; demo balance only.">
                Wallet Disabled
            </a>
        </div>
    </div>
    <div class="mobile_menu">
        <div class="mobile_menu__content">
            <a href="/" class="mobile_menu__link">
                <i class='bx bxs-home' ></i>
                Home
            </a>
            <a href="/bonus" class="mobile_menu__link">
                <i class='bx bxs-gift' ></i>
                Bonuses
            </a>
            <a href="/referrals" class="mobile_menu__link">
                <i class='bx bxs-user-plus' ></i>
                Referrals
            </a>
            <a href="/profile" class="mobile_menu__link">
                <i class='bx bxs-user-circle' ></i>
                Profile
            </a>
            @if(Auth::check() && Auth::user()->admin == 1)
            <a href="/admin" class="mobile_menu__link">
                <i class='bx bxs-window-alt'></i>
                Admin
            </a>
            @endif
        </div>
    </div>
    <div class="fix__left_nav">
        <div class="leftside__games">
            <div class="leftside__game">
                <a href="/dice">
                    <i class='bx bx-dice-5'></i>
                </a>
            </div>
            <div class="leftside__game">
                <a href="/mines">
                    <i class='bx bx-bomb' ></i>
                </a>
            </div>
            <div class="leftside__game">
                <a href="/wheel">
                    <i class='bx bx-color'></i>
                </a>
            </div>
            <div class="leftside__game">
                <a href="/jackpot">
                    <i class='bx bx-crown'></i>
                </a>
            </div>
            <div class="leftside__game">
                <a href="/crash">
                    <i class='bx bx-line-chart'></i>
                </a>
            </div>
        </div>
        <div class="leftside__social">
            <div class="social social_tg">
                <a href="https://t.me/BullMoney">
                    <i class='bx bxl-telegram' ></i>
                </a>
            </div>
            @if(Auth::check() && Auth::user()->admin == 1)
            <div class="leftside__game">
                <a href="/admin">
                    <i class='bx bxs-window-alt'></i>
                </a>
            </div>
            @endif
            @if(Auth::check() && Auth::user()->admin == 1)
            <div class="leftside__online">
                <span class="site__online">
                    <span class="online__dot"></span>
                    <span class="online"></span>
                </span>
            </div>
            @endif
        </div>
    </div>
    <div class="main__content">
        @yield('content')
        <footer class="footer">
            <div class="footer__header">
                <div class="footer__logo">
                    <a href="/" class="logo" style="display:flex;align-items:center;gap:10px;text-decoration:none;">
                        <img src="/assets/images/IMG_2921.PNG" alt="BullMoney" style="height:32px;width:32px;object-fit:contain;border-radius:6px;">
                        <span class="bull-logo">Bull<span class="accent">Money</span></span>
                    </a>
                    <strong class="footer_security">© 2026 BullMoney. Demo environment — no gambling rights.</strong>
                </div>
                <div class="footer__warn">
                    <div class="warn_mark">18+</div>
                    <div class="warn_text">
                        This experience uses virtual credits only. We do not offer real-money gambling, payouts, or deposits. Play for fun; no financial value is involved.
                    </div>
                </div>
            </div>
            <div class="footer__bottom">
                <a href="/rules" class="footer__rules">Terms of Use</a>
                <a href="/privacy" class="footer__privacy">Privacy Policy</a>
            </div>
        </footer>
    </div>


</body>
</html>