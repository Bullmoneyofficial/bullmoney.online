@extends('admin')

@section('content')

<div class="statistic__container">
    <div class="statistic__inner">
        <div class="statistic__payments">
            <div class="statistic__payments_day">
                <div class="statitic__payments__header">
                    Deposits Today
                </div>
                <div class="statistic__payments_amount">
                    {{$pay_today}}
                </div>
            </div>
            <div class="statistic__payments_week">
                <div class="statitic__payments__header">
                    Deposits This Week
                </div>
                <div class="statistic__payments_amount">
                    {{$pay_week}}
                </div>
            </div>
            <div class="statistic__payments_all">
                <div class="statitic__payments__header">
                    Total Deposits
                </div>
                <div class="statistic__payments_amount">
                    {{$pay_all}}
                </div>
            </div>
        </div>
        <div class="site__info_users">
            <div class="statistic__amount_users">
                <div class="statitic__payments__header">
                    Users' Balance
                </div>
                <div class="statistic__payments_amount">
                    {{$users_balance}}
                </div>
            </div>
            <div class="statistic__amount_users">
                <div class="statitic__payments__header">
                    Users
                </div>
                <div class="statistic__payments_amount">
                    {{$users}}
                    <span class="new__users aw_green">+{{$new_users}}</span>
                </div>
            </div>
            <div class="statistic__amount_users">
                <div class="statitic__payments__header">
                    RubPay Balance
                </div>
                <div class="statistic__payments_amount balance_rp">
                    
                </div>
            </div>
        </div>
        <div class="statistic__payments">
            <div class="statistic__payments_day">
                <div class="statitic__payments__header">
                    Withdrawals Today
                </div>
                <div class="statistic__payments_amount">
                    {{$with_today}}
                </div>
            </div>
            <div class="statistic__payments_week">
                <div class="statitic__payments__header">
                    Withdrawals This Week
                </div>
                <div class="statistic__payments_amount">
                    {{$with_week}}
                </div>
            </div>
            <div class="statistic__payments_all">
                <div class="statitic__payments__header">
                    Total Withdrawals
                </div>
                <div class="statistic__payments_amount">
                    {{$with_all}}
                </div>
            </div>
        </div>
        <div class="statistics__money">
            <div class="statistics__recent statistics__recent__pay">
                <p class="name__table">Recent Deposits</p>
                <table class="table__user table__statistic">
                    <thead>
                        <tr>
                            <td>Profile</td>
                            <td class="tb-center">Amount</td>
                            <td class="tb-right">Date</td>
                        </tr>
                    </thead>
                    <tbody>
                        @foreach($last_pay as $last_pay)
                        <tr>
                            <td><a href="/admin/user/edit/{{$last_pay->user_id}}">Profile</td>
                            <td class="tb-center">{{$last_pay->amount}}</td>
                            <td class="tb-right">{{$last_pay->created_at->format('H:i:s d.m.Y')}}</td>
                        </tr>
                        @endforeach
                    </tbody>
                </table>
            </div>
            <div class="statistics__recent statistics__recent__withdraws">
            <p class="name__table">Recent Withdrawals</p>
                <table class="table__user table__statistic">
                    <thead>
                        <tr>
                            <td>Profile</td>
                            <td class="tb-center">Amount</td>
                            <td class="tb-right">Date</td>
                        </tr>
                    </thead>
                    <tbody>
                        @foreach($last_withdraws as $last_with)
                        <tr>
                            <td><a href="/admin/user/edit/{{$last_with->user_id}}">Profile</td>
                            <td class="tb-center">{{$last_with->amount}}</td>
                            <td class="tb-right">{{$last_with->created_at->format('H:i:s d.m.Y')}}</td>
                        </tr>
                        @endforeach
                    </tbody>
                </table>
            </div>
        </div>
    </div>
</div>

@endsection