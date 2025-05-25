// Save current page ID if checkbox is checked
document.addEventListener("DOMContentLoaded", () => {
    const compareBox = document.getElementById("compare");
    if (compareBox) {
      const id = window.location.pathname.split("/").pop();
      compareBox.addEventListener("change", () => {
        let list = JSON.parse(localStorage.getItem("compare") || "[]");
        if (compareBox.checked && !list.includes(id)) {
          list.push(id);
        } else {
          list = list.filter(x => x !== id);
        }
        localStorage.setItem("compare", JSON.stringify(list));
      });
    }
  
    // Load comparison if on compare.html
    const compareDiv = document.getElementById("comparison");
    if (compareDiv) {
      const ids = JSON.parse(localStorage.getItem("compare") || "[]");
      compareDiv.innerHTML = ids.length
        ? `<p>Compare these listings: ${ids.join(", ")}</p>`
        : "<p>No listings selected for comparison.</p>";
    }
  });
  