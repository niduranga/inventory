<?php

namespace App\Repositories\Eloquent;

use App\Models\Location;
use App\Repositories\Contracts\LocationRepositoryContract;

class LocationRepository implements LocationRepositoryContract
{
    public function getAll()
    {
        return Location::all();
    }

    public function getById($id)
    {
        return Location::findOrFail($id);
    }

    public function create(array $data)
    {
        return Location::create($data);
    }

    public function update($id, array $data)
    {
        $location = Location::findOrFail($id);
        $location->update($data);
        return $location;
    }

    public function delete($id)
    {
        $location = Location::findOrFail($id);
        $location->delete();
    }
}
