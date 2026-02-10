<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::create('users', function (Blueprint $table) {
            $table->id();
            $table->string('username')->nullable();
            $table->string('password')->nullable();
            $table->string('avatar')->nullable();
            $table->string('ip')->nullable();
            $table->decimal('balance', 16, 2)->default(0);
            $table->decimal('wager', 16, 2)->default(0);
            $table->string('vk_id')->nullable();
            $table->string('tg_id')->nullable();
            $table->string('unique_id')->nullable();
            $table->integer('admin')->default(0);
            $table->integer('youtuber')->default(0);
            $table->string('ref_code')->nullable();
            $table->string('referred_by')->nullable();
            $table->integer('ban')->default(0);
            $table->string('bonus_time')->nullable();
            $table->string('api_token')->nullable();
            $table->integer('rank')->default(0);
            $table->decimal('ref_money', 16, 2)->default(0);
            $table->integer('vk_bonus')->default(0);
            $table->string('date')->nullable();
            $table->integer('tg_bonus')->default(0);
            $table->integer('tg_bonus_use')->default(0);
            $table->string('videocard')->nullable();
            $table->integer('fake')->default(0);
            $table->integer('type_balance')->default(0);
            $table->decimal('demo_balance', 16, 2)->default(1000);
            $table->decimal('sum_to_withdraw', 16, 2)->default(0);
            $table->timestamps();
        });
    }

    public function down()
    {
        Schema::dropIfExists('users');
    }
};
