<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::create('mines', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('user_id');
            $table->integer('bombs')->default(0);
            $table->decimal('bet', 16, 2)->default(0);
            $table->text('mines')->nullable();
            $table->text('click')->nullable();
            $table->integer('onOff')->default(0);
            $table->decimal('result', 16, 2)->default(0);
            $table->integer('step')->default(0);
            $table->decimal('win', 16, 2)->default(0);
            $table->text('can_open')->nullable();
            $table->timestamps();
        });
    }

    public function down()
    {
        Schema::dropIfExists('mines');
    }
};
