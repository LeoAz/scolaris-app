<?php

namespace App\Support\MediaLibrary;

use App\Models\CreditRequest;
use App\Models\CreditRequestRepayment;
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
        $model = $media->model;

        if ($media->model_type === CreditRequest::class) {
            /** @var CreditRequest $model */
            $countryCode = $model->country?->code ?? 'unknown';
            $year = $model->created_at?->format('Y') ?? now()->format('Y');
            $folderName = str_replace(['/', '\\'], '_', $model->code);

            return "{$countryCode}/{$year}/{$folderName}";
        }

        if ($media->model_type === CreditRequestRepayment::class) {
            /** @var CreditRequestRepayment $model */
            $creditRequest = $model->creditRequest;
            $countryCode = $creditRequest?->country?->code ?? 'unknown';
            $year = $model->created_at?->format('Y') ?? now()->format('Y');
            $folderName = $creditRequest ? str_replace(['/', '\\'], '_', $creditRequest->code).'/repayments' : 'repayments';

            return "{$countryCode}/{$year}/{$folderName}";
        }

        return (string) $media->id;
    }
}
