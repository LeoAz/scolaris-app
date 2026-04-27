<?php

use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;

test('it can upload a document to s3', function () {
    $disk = Storage::disk('s3');
    $filename = 'test-document-'.now()->timestamp.'.txt';
    $content = 'Sample content for S3 testing';

    // 1. Upload
    $disk->put($filename, $content);

    // 2. Verify existence
    expect($disk->exists($filename))->toBeTrue();
    expect($disk->get($filename))->toBe($content);

    // 3. Delete
    $disk->delete($filename);

    // 4. Verify deletion
    expect($disk->exists($filename))->toBeFalse();
});

test('it can upload an UploadedFile object to s3', function () {
    $disk = Storage::disk('s3');
    $file = UploadedFile::fake()->create('document.pdf', 100);
    $path = 'uploads/'.$file->hashName();

    // 1. Upload
    $disk->put($path, file_get_contents($file->getRealPath()));

    // 2. Verify
    expect($disk->exists($path))->toBeTrue();

    // 3. Delete
    $disk->delete($path);

    // 4. Verify deletion
    expect($disk->exists($path))->toBeFalse();
});
