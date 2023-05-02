<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8">
    <title>Contact Us</title>
  </head>
  <body>
    <h1>Contact Us</h1>
    <form action="send_email.php" method="POST">
      <label for="name">Name:</label>
      <input type="text" name="name" id="name" required><br><br>
      <label for="email">Email:</label>
      <input type="email" name="email" id="email" required><br><br>
      <label for="message">Message:</label><br>
      <textarea name="message" id="message" rows="5" required></textarea><br><br>
      <input type="submit" value="Send">
    </form>
  </body>
</html>
