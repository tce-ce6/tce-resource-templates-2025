document.addEventListener("DOMContentLoaded", function () {
    let jsonData;
    let selectedItem = null; 
    let showAnswer = false; 
    let boxWidth, boxHeight, boxTop, boxLeft, boxBorderColor, boxBackgroundColor;
    let lineEndX, lineEndY;
  
    fetch("lib/data.json")
        .then((response) => response.json())
        .then((data) => initialize(data))
        .catch((err) => console.error("Error loading JSON:", err));
  
    function initialize(data) {
        jsonData = data;
  
        const backgroundImgElement = document.getElementById("background-image");
        backgroundImgElement.style.backgroundImage = `url('${data.backgroundImage.imageSrc}')`;
  
        const targetImgElement = document.getElementById("target-image");
        targetImgElement.src = data.targetImage.imageSrc;
        targetImgElement.style.width = data.targetImage.width;
        targetImgElement.style.height = data.targetImage.height;
        targetImgElement.style.top = data.targetImage.top;
  
  
        const titleText = document.getElementById("titleText");
        titleText.innerHTML = data.titleText;
  
        const instructionText = document.getElementById("instructionText");
        instructionText.innerHTML = data.instructionText;
  
        const svgContainer = document.getElementById("svg-container");
        const svg = SVG().addTo(svgContainer).size("100%", "100%");
  
        targetImgElement.onload = () => {
            adjustLayout(data, targetImgElement, svg);
            createItemCollection(data);
        };
  
        window.addEventListener("resize", () => {
            adjustLayout(data, targetImgElement, svg);
        });
  
        document.getElementById("reset-button").addEventListener("click", resetAll);
        document.getElementById("toggle-answer").addEventListener("click", toggleShowAnswer);
    }
  
    function adjustLayout(data, targetImgElement, svg) {
      svg.clear();
  
      const SCREEN_WIDTH = 993;
      const SCREEN_HEIGHT = 610;
  
      data.containers.forEach((containerData) => {
          boxWidth = containerData.width;
          boxHeight = containerData.height;
  
          // Ensure box positions are within screen bounds
          boxLeft = Math.max(0, Math.min(containerData.boxPosition.left, SCREEN_WIDTH - boxWidth));
          boxTop = Math.max(0, Math.min(containerData.boxPosition.top, SCREEN_HEIGHT - boxHeight));
  
          boxBorderColor = containerData.borderColor;
          boxBackgroundColor = containerData.backgroundColor;
  
          
          let lineEndX = Math.max(0, Math.min(containerData.lineEndPosition.x, SCREEN_WIDTH));
          let lineEndY = Math.max(0, Math.min(containerData.lineEndPosition.y, SCREEN_HEIGHT));
  
          
          let startX = boxLeft;
          if (containerData.lineDirection === "right") {
              startX = boxLeft + boxWidth;
          }
          let startY = boxTop + boxHeight / 2;
  
          
          const path = svg.path(
              `M${startX},${startY} Q${(startX + lineEndX) / 2},${startY} ${lineEndX},${lineEndY}`
          );
          path.stroke({
              color: boxBorderColor,
              width: 1.5,
              opacity: 1,
              linecap: "round",
              linejoin: "round",
          }).fill("none");
  
          const group = svg.group();
          const rect = group.rect(boxWidth, boxHeight)
              .attr({ x: boxLeft, y: boxTop, rx: 5, ry: 5 })
              .fill(boxBackgroundColor)
              .stroke({ color: boxBorderColor, width: 2 })
              .id(containerData.id);
  
          let debugTextFill = 'transparent';
          if (jsonData.debug) {
              debugTextFill = 'black';
          }
  
          const text = group.text(containerData.label)
              .font({ size: 14, anchor: "middle", fill: debugTextFill, family: "Arial" })
              .center(boxLeft + boxWidth / 2, boxTop + boxHeight / 2)
              .attr("value", containerData.label)
              .id("text_" + containerData.id)
              .attr("style", "cursor:pointer");
  
          group.click(() => handleRectClick(containerData));
  
          
          rect.on("touchstart", (event) => {
              event.preventDefault();
              handleRectClick(containerData);
          });
      });
  }
  
  
  
  
    function createItemCollection(data) {
        const itemContainer = document.getElementById("item-collection");
        itemContainer.innerHTML = "";
  
        shuffleArray(data.collection);
        data.collection.forEach((item) => {
            const button = document.createElement("div");
            button.textContent = item.label;
            button.style.width = item.width;
            button.className = "item-button";
            button.setAttribute("data-used", "false");
            button.setAttribute("data-label", item.label);
  
            button.addEventListener("click", () => {
                if (button.getAttribute("data-used") === "true") return;
                handleItemClick(item);
            });
  
            button.addEventListener("touchstart", (event) => {
                event.preventDefault();
                handleItemClick(item);
            });
  
            itemContainer.appendChild(button);
        });
    }
  
    function handleItemClick(item) {
        if (selectedItem) {
            const previousButton = document.querySelector(`.item-button[data-label="${selectedItem.label}"]`);
            if (previousButton) previousButton.classList.remove("selected");
        }
  
        selectedItem = item;
        const currentButton = document.querySelector(`.item-button[data-label="${selectedItem.label}"]`);
        if (currentButton) {
            currentButton.classList.add("selected");
  
            currentButton.addEventListener("touchmove", (event) => {
                event.preventDefault();
                const touch = event.touches[0];
                currentButton.style.position = "absolute";
                currentButton.style.left = `${touch.clientX - 25}px`;
                currentButton.style.top = `${touch.clientY - 25}px`;
            });
  
            currentButton.addEventListener("touchend", () => {
                currentButton.style.position = "relative";
                currentButton.style.left = "0px";
                currentButton.style.top = "0px";
            });
        }
    }
  
    function handleRectClick(containerData) {
        if (!selectedItem) return;
  
        const isValidMatch = selectedItem.validContainers.includes(containerData.id);
        const rect = document.getElementById(containerData.id);
        const textId = document.getElementById("text_" + containerData.id);
  
        if (rect) {
            if (isValidMatch) {
                rect.setAttribute("fill", "#c8e6c9");
                textId.textContent = textId.getAttribute("value");
                textId.setAttribute("style", "fill:black; cursor:pointer;font-family:Aller_Std_Rg;");
  
                rect.classList.add("correct-animate");
                textId.classList.add("correct-animate");
  
                rect.addEventListener("animationend", () => {
                    rect.classList.remove("correct-animate");
                    textId.classList.remove("correct-animate");
                });
  
                document.querySelectorAll(".item-button").forEach((button) => {
                    if (button.textContent === selectedItem.label) {
                        button.setAttribute("data-used", "true");
                        button.style.opacity = "0.5";
                        button.style.pointerEvents = "none";
                        button.style.display = "none";
                    }
                });
            } else {
                rect.setAttribute("fill", "#ffcdd2");
                resetSelections(rect, textId);
            }
        }
  
        selectedItem = null;
    }
  
    function resetSelections(item, textId) {
        setTimeout(() => {
            item.setAttribute("fill", boxBackgroundColor);
            textId.textContent = "";
        }, 1500);
    }
  
    function resetAll() {
      document.getElementById("toggle-answer").textContent = "Show Answer";
      showAnswer = false;
        document.querySelectorAll("#svg-container rect").forEach(rect => rect.setAttribute("fill", boxBackgroundColor));
        document.querySelectorAll("#svg-container text").forEach(text => {
            text.textContent = "";
            text.setAttribute("style", "fill: transparent;");
        });
  
        createItemCollection(jsonData);
        selectedItem = null;
    }
  
    function toggleShowAnswer() {
      showAnswer = !showAnswer;
      document.getElementById("toggle-answer").textContent = showAnswer ? "Hide Answer" : "Show Answer";
      
      document.querySelectorAll("#svg-container text").forEach(text => {
          const rect = document.getElementById(text.id.replace("text_", ""));
          const isCorrect = rect.getAttribute("fill") === "#c8e6c9";
  
          if (isCorrect) {
              text.textContent = text.getAttribute("value"); 
              text.setAttribute("style", "fill: black;font-family:Aller_Std_Rg;");
          } else {
              text.textContent = showAnswer ? text.getAttribute("value") : "";
              text.setAttribute("style", `font-family:Aller_Std_Rg;fill: ${showAnswer ? "black" : "transparent"};`);
          }
      });
  }
    function shuffleArray(arr) {
        for (let i = arr.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [arr[i], arr[j]] = [arr[j], arr[i]];
        }
    }
  });
  