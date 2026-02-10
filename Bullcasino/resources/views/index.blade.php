<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="csrf-token" content="{{ csrf_token() }}"> />
    <meta content="bullmoney, games, entertainment, dice, mines, crash, jackpot, wheel, premium" name="keywords">

    <link rel="stylesheet" href="/assets/css/style.css">
    <link rel="icon" href="/assets/images/favicon.ico" type="image/x-icon">
    <link href='https://unpkg.com/boxicons@2.1.4/css/boxicons.min.css' rel='stylesheet'>
    <link rel="stylesheet" href="/assets/css/notifyme.css">

    <script src="https://cdnjs.cloudflare.com/ajax/libs/jquery/3.6.3/jquery.min.js" integrity="sha512-STof4xm1wgkfm7heWqFJVn58Hm3EtS31XFaagaa8VMReCXAkQnJZ+jEy8PCC/iT18dFy95WcExNHFTqLyp72eQ==" crossorigin="anonymous" referrerpolicy="no-referrer"></script>
    <script src='https://cdnjs.cloudflare.com/ajax/libs/socket.io/2.0.3/socket.io.js'></script>
    <script src="/assets/js/notifyme.min.js"></script>
    <script src="/assets/js/app.js"></script>
    <script src="/assets/js/socket.js"></script>

    <title>BullMoney — Premium Games</title>
</head>
<body>
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
                    <a href="/" class="navmenu__item_link active">Home</a>
                </li>
                <li class="navmenu__item">
                    <a href="/bonus" class="navmenu__item_link">Bonuses</a>
                </li>
                <li class="navmenu__item">
                    <a href="/profile" class="navmenu__item_link">Profile</a>
                </li>
                <li class="navmenu__item">
                    <a href="/referrals" class="navmenu__item_link">Referrals</a>
                </li>
            </ul>
        </div>
        <div class="user__wallet">
            <div class="user__balance">
                <!-- <i class='bx bxs-coin-stack'></i> -->
                <span id="balance">{{Auth::user()->balance}} <span class="ruble">₽</span></span>
            </div>
            <a href="/wallet/pay" class="wallet_up_btn">
                Wallet
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
        <div class="games__container">
            <div class="games__grid">
                <a href="/dice" class="games__item">
                    <div class="games__card card_dice">
                        <div class="card_btn">
                            <span class="card__play">Play</span>
                        </div>
                    </div>
                </a>
                <a href="/mines" class="games__item">
                    <div class="games__card card_mines">
                        <div class="card_btn">
                            <span class="card__play">Play</span>
                        </div>
                    </div>
                </a>
                <a href="/wheel" class="games__item">
                    <div class="games__card card_wheel">
                        <div class="card_btn">
                            <span class="card__play">Play</span>
                        </div>
                    </div>
                </a>
                <a href="/jackpot" class="games__item">
                    <div class="games__card card_jackpot">
                        <div class="card_btn">
                            <span class="card__play">Play</span>
                        </div>
                    </div>
                </a>
                <a href="/crash" class="games__item">
                    <div class="games__card card_crash">
                        <div class="card_btn">
                            <span class="card__play">Play</span>
                        </div>
                    </div>
                </a>
                <a class="games__item games__other">
                    <div class="games__card card_other"></div>
                </a>
            </div>
        </div>
        <footer class="footer">
            <div class="footer__header">
                <div class="footer__logo">
                    <a href="/" class="logo" style="display:flex;align-items:center;gap:10px;text-decoration:none;">
                        <img src="/assets/images/IMG_2921.PNG" alt="BullMoney" style="height:32px;width:32px;object-fit:contain;border-radius:6px;">
                        <span class="bull-logo">Bull<span class="accent">Money</span></span>
                    </a>
                    <strong class="footer_security">© 2026 BullMoney. All rights reserved.</strong>
                </div>
                <div class="footer__warn">
                    <div class="warn_mark">18+</div>
                    <div class="warn_text">
                        Gambling is meant to be entertaining. Remember that you risk money when you place bets. Do not spend more than you can afford to lose.
                    </div>
                </div>
            </div>
            <div class="footer__bottom">
                <a href="/rules" class="footer__rules">Terms of Use</a>
                <a href="/privacy" class="footer__privacy">Privacy Policy</a>
            </div>
        </footer>
    </div>

    @if(session()->has('error'))
    <script>
        $.notify({
            type: "error",
            message: "{{ session()->get('error') }}"
        });  
    </script>  
    @endif            
    @if(session()->has('success'))
    <script>
        $.notify({
            type: "success",
            message: "{{ session()->get('success') }}"
        });  
    </script>  
    @endif


</body>
</html>