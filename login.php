<?php

// Replace these values with your own database credentials
$servername = 'localhost';
$username = 'root';
$password = '';
$dbname = 'my_database';

// Create connection
$conn = new mysqli($servername, $username, $password, $dbname);

// Check connection
if ($conn->connect_error) {
    die('Connection failed: ' . $conn->connect_error);
}

// Get the username and password from the POST request
$username = $_POST['username'];
$password = $_POST['password'];

// Check if the username and password are valid
$sql = "SELECT * FROM users WHERE username='$username' AND password='$password'";
$result = $conn->query($sql);

if ($result->num_rows > 0) {
    // The username and password are correct
    echo 'success';
} else {
    // The username and password are incorrect
    echo 'failure';
}

// Close the database connection
$conn->close();

?>