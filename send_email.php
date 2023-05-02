<?php
  // Replace with your own email address
  $to = "franmak17@gmail.com";

  // Get form input
  $name = $_POST['name'];
  $email = $_POST['email'];
  $message = $_POST['message'];

  // Set email subject
  $subject = "New message from $name";

  // Build email body
  $body = "Name: $name\n\n";
  $body .= "Email: $email\n\n";
  $body .= "Message: $message\n\n";

  // Set email headers
  $headers = "From: $email\n";
  $headers .= "Reply-To: $email\n";

  // Send email
  if(mail($to, $subject, $body, $headers)) {
    echo "Thank you for your message!";
  } else {
    echo "Sorry, something went wrong. Please try again.";
  }
?>
