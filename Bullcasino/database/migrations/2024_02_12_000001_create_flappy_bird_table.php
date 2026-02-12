<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        Schema::create('flappy_bird', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('user_id');
            $table->decimal('bet', 10, 2);
            $table->decimal('multiplier', 10, 2)->default(1.0);
            $table->integer('score')->default(0);
            $table->boolean('won')->default(false);
            $table->decimal('win_amount', 10, 2)->default(0);
            $table->string('status', 20)->default('playing'); // playing, win, loss
            $table->timestamps();

            // Indexes
            $table->index('user_id');
            $table->index('created_at');
            $table->index(['user_id', 'score']);
            $table->index(['user_id', 'won']);

            // Foreign key
            $table->foreign('user_id')
                  ->references('id')
                  ->on('users')
                  ->onDelete('cascade');
        });

        // Add settings column if settings table exists
        if (Schema::hasTable('settings')) {
            Schema::table('settings', function (Blueprint $table) {
                if (!Schema::hasColumn('settings', 'flappybird_enabled')) {
                    $table->boolean('flappybird_enabled')->default(1)->after('plinko_enabled');
                }
            });
        }
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        Schema::dropIfExists('flappy_bird');

        // Remove settings column
        if (Schema::hasTable('settings') && Schema::hasColumn('settings', 'flappybird_enabled')) {
            Schema::table('settings', function (Blueprint $table) {
                $table->dropColumn('flappybird_enabled');
            });
        }
    }
};
