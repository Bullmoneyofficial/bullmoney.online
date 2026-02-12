<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class FlappyBird extends Model
{
    use HasFactory;

    protected $table = 'flappy_bird';

    protected $fillable = [
        'id',
        'user_id',
        'bet',
        'multiplier',
        'score',
        'won',
        'win_amount',
        'status'
    ];

    /**
     * Get the user that owns the game
     */
    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
