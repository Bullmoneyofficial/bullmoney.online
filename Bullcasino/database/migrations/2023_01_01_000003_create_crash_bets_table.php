<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::create('crash_bets', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('user_id');
            $table->unsignedBigInteger('round_id');
            $table->decimal('price', 16, 2)->default(0);
            $table->decimal('withdraw', 16, 2)->default(0);
            $table->decimal('won', 16, 2)->default(0);
            $table->integer('status')->default(0);
            $table->timestamps();
        });
    }

    public function down()
    {
        Schema::dropIfExists('crash_bets');
    }
};
