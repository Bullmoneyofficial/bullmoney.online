<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::create('promocodes', function (Blueprint $table) {
            $table->id();
            $table->string('type')->nullable();
            $table->integer('status')->default(1);
            $table->decimal('sum', 16, 2)->default(0);
            $table->integer('activate')->default(0);
            $table->integer('activate_limit')->default(0);
            $table->string('name')->nullable();
            $table->timestamps();
        });
    }

    public function down()
    {
        Schema::dropIfExists('promocodes');
    }
};
