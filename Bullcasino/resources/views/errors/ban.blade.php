<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">

    <link rel="stylesheet" href="/assets/css/style.css">
    <link href='https://unpkg.com/boxicons@2.1.4/css/boxicons.min.css' rel='stylesheet'>

    <title>Your account is banned</title>
</head>
<body>
    <a href="/" class="logo" style="justify-content:center; font-size: 38px;">
        <img src="/assets/images/IMG_2921.PNG" alt="BullMoney" style="height:40px;width:40px;object-fit:contain;border-radius:8px;margin-right:12px;">
        <span class="bull-logo">Bull<span class="accent">Money</span></span>
    </a>
    <div class="main__error">
        <div class="code__error" style="margin-bottom: 10px;">Your account is banned</div>
        <div class="error__text"><span>{{Auth::user()->username}}, you have been banned, contact support for details.</div>
        <div class="error__text">Support Telegram: @BullMoney_bot</div>
</body>
</html>