<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::create('wheel', function (Blueprint $table) {
            $table->id();
            $table->string('winner_color')->nullable();
            $table->decimal('price', 16, 2)->default(0);
            $table->integer('status')->default(0);
            $table->timestamps();
        });
    }

    public function down()
    {
        Schema::dropIfExists('wheel');
    }
};
