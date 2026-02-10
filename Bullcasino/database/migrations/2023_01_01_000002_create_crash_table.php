<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::create('crash', function (Blueprint $table) {
            $table->id();
            $table->decimal('multiplier', 16, 2)->default(0);
            $table->decimal('profit', 16, 2)->default(0);
            $table->integer('status')->default(0);
            $table->string('hash')->nullable();
            $table->timestamps();
        });
    }

    public function down()
    {
        Schema::dropIfExists('crash');
    }
};
