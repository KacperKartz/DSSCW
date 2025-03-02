
document.addEventListener("DOMContentLoaded", async () => {
    try {
      const response = await fetch("/navbar.html"); // Fetch from public/
      if (!response.ok) throw new Error("Navbar file not found");
      document.getElementById("navbar").innerHTML = await response.text();
    } catch (error) {
      console.error(error);
    }
  });
  