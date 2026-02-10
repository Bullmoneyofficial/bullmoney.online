<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::create('jackpot', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('game_id')->default(0);
            $table->unsignedBigInteger('winner_id')->nullable();
            $table->decimal('winner_chance', 8, 2)->default(0);
            $table->unsignedBigInteger('winner_ticket')->default(0);
            $table->decimal('winner_sum', 16, 2)->default(0);
            $table->string('winner_username')->nullable();
            $table->string('winner_avatar')->nullable();
            $table->string('hash')->nullable();
            $table->decimal('price', 16, 2)->default(0);
            $table->integer('status')->default(0);
            $table->timestamps();
        });
    }

    public function down()
    {
        Schema::dropIfExists('jackpot');
    }
};
