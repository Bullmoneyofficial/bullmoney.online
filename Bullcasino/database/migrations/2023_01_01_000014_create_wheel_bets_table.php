<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::create('wheel_bets', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('user_id');
            $table->unsignedBigInteger('game_id');
            $table->decimal('price', 16, 2)->default(0);
            $table->string('color')->nullable();
            $table->decimal('win', 16, 2)->default(0);
            $table->decimal('balance', 16, 2)->default(0);
            $table->decimal('win_sum', 16, 2)->default(0);
            $table->timestamps();
        });
    }

    public function down()
    {
        Schema::dropIfExists('wheel_bets');
    }
};
