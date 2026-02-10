<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::create('settings', function (Blueprint $table) {
            $table->id();
            $table->decimal('min_withdraw', 16, 2)->default(100);
            $table->decimal('min_payment', 16, 2)->default(10);
            $table->decimal('max_payment', 16, 2)->default(100000);
            $table->integer('tech_work')->default(0);
            $table->integer('dice_enabled')->default(1);
            $table->integer('mines_enabled')->default(1);
            $table->integer('wheel_enabled')->default(1);
            $table->integer('jackpot_enabled')->default(1);
            $table->integer('crash_enabled')->default(1);
            $table->integer('coin_enabled')->default(1);
            $table->timestamps();
        });
    }

    public function down()
    {
        Schema::dropIfExists('settings');
    }
};
