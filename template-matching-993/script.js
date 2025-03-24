document.addEventListener("DOMContentLoaded", function () {
    let jsonData;
    let selectedItem = null; 
    let showAnswer = false; 
    let boxWidth, boxHeight, boxTop, boxLeft, boxBorderColor, boxBackgroundColor;
    let lineEndX, lineEndY;
  
    fetch("data.json")
        .then((response) => response.json())
        .then((data) => initialize(data))
        .catch((err) => console.error("Error loading JSON:", err));

        function initialize(data) {
            jsonData = data;
            console.log(jsonData);
        }
})