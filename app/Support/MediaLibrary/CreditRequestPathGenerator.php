<?php

namespace App\Support\MediaLibrary;

use App\Models\CreditRequest;
use Spatie\MediaLibrary\MediaCollections\Models\Media;
use Spatie\MediaLibrary\Support\PathGenerator\PathGenerator;

class CreditRequestPathGenerator implements PathGenerator
{
    /*
     * Get the path for the given media, relative to the root storage path.
     */
    public function getPath(Media $media): string
    {
        return $this->getBasePath($media).'/';
    }

    /*
     * Get the path for conversions of the given media, relative to the root storage path.
     */
    public function getPathForConversions(Media $media): string
    {
        return $this->getBasePath($media).'/conversions/';
    }

    /*
     * Get the path for responsive images of the given media, relative to the root storage path.
     */
    public function getPathForResponsiveImages(Media $media): string
    {
        return $this->getBasePath($media).'/responsive-images/';
    }

    /*
     * Get the base path for the given media.
     */
    protected function getBasePath(Media $media): string
    {
        if ($media->model_type !== CreditRequest::class) {
            return (string) $media->id;
        }

        /** @var CreditRequest $creditRequest */
        $creditRequest = $media->model;

        $countryCode = $creditRequest->country?->code ?? 'unknown';
        $year = $creditRequest->created_at?->format('Y') ?? now()->format('Y');
        $folderName = str_replace(['/', '\\'], '_', $creditRequest->code);

        return "{$countryCode}/{$year}/{$folderName}/{$media->id}";
    }
}
