<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::create('plinko', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('user_id');
            $table->decimal('bet', 16, 2)->default(0);
            $table->integer('rows')->default(16);
            $table->integer('position')->default(0);
            $table->decimal('multiplier', 8, 2)->default(0);
            $table->decimal('win', 16, 2)->default(0);
            $table->timestamps();
        });
    }

    public function down()
    {
        Schema::dropIfExists('plinko');
    }
};
