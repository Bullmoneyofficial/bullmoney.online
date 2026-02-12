<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Plinko extends Model
{
    use HasFactory;

    protected $table = 'plinko';

    protected $fillable = ['id', 'user_id', 'bet', 'rows', 'position', 'multiplier', 'win'];
}
