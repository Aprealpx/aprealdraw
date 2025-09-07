<?php

if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_FILES['artwork'])) {
    $targetDir = "uploads/";
    if (!is_dir($targetDir)) {
        mkdir($targetDir, 0777, true);
    }
    $fileName = basename($_FILES["artwork"]["name"]);
    $targetFile = $targetDir . uniqid() . "_" . $fileName;
    $imageFileType = strtolower(pathinfo($targetFile, PATHINFO_EXTENSION));

    // Check if image file is a actual image
    $check = getimagesize($_FILES["artwork"]["tmp_name"]);
    if ($check === false) {
        die("File is not an image.");
    }

    // Move uploaded file
    if (move_uploaded_file($_FILES["artwork"]["tmp_name"], $targetFile)) {
        // Add image to works.html
        $imgTag = "\n    <img src=\"$targetFile\" alt=\"Artwork\" style=\"max-width:300px; margin:10px;\">\n";
        $worksFile = "works.html";
        $worksContent = file_get_contents($worksFile);

        // Insert image before </section>
        $worksContent = preg_replace('/(<\/section>)/i', $imgTag . '$1', $worksContent, 1);

        file_put_contents($worksFile, $worksContent);

        echo "Artwork uploaded and added to works.html.<br>";
        echo "<a href='works.html'>View Works</a>";
    } else {
        echo "Sorry, there was an error uploading your file.";
    }
} else {
    echo "No file uploaded.";
}
?>