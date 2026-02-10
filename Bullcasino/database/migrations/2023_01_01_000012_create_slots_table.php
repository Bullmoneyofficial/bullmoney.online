<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::create('slots', function (Blueprint $table) {
            $table->id();
            $table->string('slot_code')->nullable();
            $table->string('title')->nullable();
            $table->string('image')->nullable();
            $table->integer('category_id')->default(0);
            $table->integer('top')->default(0);
            $table->integer('status')->default(1);
            $table->timestamps();
        });
    }

    public function down()
    {
        Schema::dropIfExists('slots');
    }
};
