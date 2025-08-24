document.addEventListener("DOMContentLoaded", function () {
    console.log('json load')
    let selectedItem = null;
    let state = {}; 
    let feedbackMessages = {}; 
    let jsonData;
    let showAnswer = false;
    const feedback = document.getElementById("feedback");

    loadJSONData(folderName+'/data.json');
    

    function loadJSONData(fileName) {
        console.log('json load')
        fetch(fileName)
            .then(response => response.json())
            .then(data => initialize(data))
            .catch(error => {
                console.error("Error loading JSON:", error);
                feedback.textContent = "Failed to load data.";
            });
    }

    // Helper function to resolve image paths - handles both base64 and file paths
    function resolveImagePath(imageSrc) {
        if (!imageSrc) return "";
        
        // If it's already a base64 data URL, return as-is
        if (imageSrc.startsWith('data:')) {
            return imageSrc;
        }
        
        // If it's an absolute URL (http/https), return as-is
        if (imageSrc.startsWith('http://') || imageSrc.startsWith('https://')) {
            return imageSrc;
        }
        
        // If it's an absolute path starting with '/', return as-is
        if (imageSrc.startsWith('/')) {
            return imageSrc;
        }
        
        // If it already starts with the folderName, return as-is
        if (imageSrc.startsWith(folderName + '/')) {
            return imageSrc;
        }
        
        // Otherwise, prepend the folderName (relative path)
        return folderName + '/' + imageSrc;
    }

    function initialize(data) {
        jsonData = data;
        feedbackMessages = data.feedback || {};
        state = {};
        selectedItem = null;
        showAnswer = false;

        document.getElementById("titleText").textContent = data.titleText || "";
        document.getElementById("instructionText").textContent = data.instructionText || "";
        
        // Handle background image - supports both base64 and file paths
        const backgroundImageSrc = resolveImagePath(data.backgroundImage?.imageSrc);
        if (backgroundImageSrc) {
            document.getElementById("background-image").style.backgroundImage = `url('${backgroundImageSrc}')`;
        }

        const collection = document.getElementById("collection");
        const containerArea = document.getElementById("containerArea");
        collection.innerHTML = "";
        containerArea.innerHTML = "";

        data.containers.forEach(container => {
            state[container.id] = [];

            const containerDiv = document.createElement("div");
            containerDiv.className = "drop-zone";
            containerDiv.id = container.id;
            containerDiv.style.width = container.width || "100%";
            containerDiv.style.height = container.height || "100%";

            const containerLabel = document.createElement("div");
            containerLabel.className = "container-label";
            containerLabel.textContent = container.label;

            const containerLabelParent = document.createElement("div");
            containerLabelParent.className = "container-label-parent";
            containerLabelParent.appendChild(containerLabel);

            const wrapper = document.createElement("div");
            wrapper.className = "container-wrapper";
            wrapper.appendChild(containerLabelParent);
            wrapper.appendChild(containerDiv);

            containerArea.appendChild(wrapper);

            containerDiv.addEventListener("mousedown", () => handleDrop(containerDiv));
            containerDiv.addEventListener("touchstart", () => handleDrop(containerDiv));
        });

        shuffleArray(data.collection);

        data.collection.forEach(item => {
            const element = createDraggableItem(item);
            collection.appendChild(element);
        });

        document.addEventListener("mouseup", handleDeselect);
        document.addEventListener("touchend", handleDeselect);

        document.getElementById("resetButton").addEventListener("click", resetGame);
        document.getElementById("toggle-answer").addEventListener("click", toggleAnswers);
    }

    function createDraggableItem(item) {
        let element;

        // Use the helper function to resolve the image path
        const finalSrc = resolveImagePath(item.src);

        if (item.type === "text") {
            element = document.createElement("div");
            element.textContent = item.label;
            element.className = "draggable-item text-item";
            element.style.width = item.width || "auto";
            element.style.height = item.height || "auto";
        } else {
            element = document.createElement("img");
            element.src = finalSrc;
            element.alt = item.label;
            element.className = "draggable-item";
            element.style.width = item.width || "60px";
            element.style.height = item.height || "60px";
            
            // Add error handling for failed image loads
            element.onerror = function() {
                console.warn(`Failed to load image: ${finalSrc}`);
                // Fallback: show the label as text if image fails to load
                const fallbackText = document.createElement("div");
                fallbackText.textContent = item.label;
                fallbackText.className = "draggable-item text-item fallback";
                fallbackText.style.width = item.width || "60px";
                fallbackText.style.height = item.height || "60px";
                fallbackText.style.display = "flex";
                fallbackText.style.alignItems = "center";
                fallbackText.style.justifyContent = "center";
                fallbackText.style.backgroundColor = "#f0f0f0";
                fallbackText.style.border = "2px dashed #ccc";
                fallbackText.style.fontSize = "12px";
                fallbackText.style.textAlign = "center";
                
                // Copy all the data attributes and event listeners
                fallbackText.title = item.label;
                fallbackText.dataset.label = item.label;
                fallbackText.dataset.target = JSON.stringify(item.target);
                fallbackText.dataset.type = item.type || "image";
                fallbackText.dataset.src = finalSrc;
                
                fallbackText.addEventListener("mousedown", event => handleItemSelection(event, fallbackText));
                fallbackText.addEventListener("touchstart", event => handleItemSelection(event, fallbackText));
                
                // Replace the failed image with the fallback
                if (element.parentNode) {
                    element.parentNode.replaceChild(fallbackText, element);
                }
            };
        }

        element.title = item.label;
        element.dataset.label = item.label;
        element.dataset.target = JSON.stringify(item.target);
        element.dataset.type = item.type || "image";
        element.dataset.src = finalSrc; // store the resolved src path

        element.addEventListener("mousedown", event => handleItemSelection(event, element));
        element.addEventListener("touchstart", event => handleItemSelection(event, element));

        return element;
    }

    function handleItemSelection(event, element) {
        event.preventDefault();
        if (stateHasItem(element)) return;

        if (selectedItem === element) {
            element.classList.remove("selected");
            selectedItem = null;
        } else {
            document.querySelectorAll(".draggable-item").forEach(el => el.classList.remove("selected"));
            element.classList.add("selected");
            selectedItem = element;
        }
    }

    function stateHasItem(item) {
        return Object.values(state).some(arr => arr.includes(item.dataset.label));
    }

    function handleDeselect(event) {
        if (!event.target.closest(".drop-zone") && !event.target.closest("#collection")) {
            if (selectedItem) {
                selectedItem.classList.remove("selected");
                selectedItem = null;
            }
        }
    }

    function handleDrop(containerDiv) {
        console.log('selectedItem ', selectedItem)
        if (!selectedItem || showAnswer) {
            feedback.textContent = showAnswer ? "Please hide the answer to continue." : "";
            setTimeout(() => feedback.textContent = "", 2000);
            return;
        }
    
        const containerId = containerDiv.id;
        const label = selectedItem.dataset.label;
        const target = JSON.parse(selectedItem.dataset.target);
        const type = selectedItem.dataset.type || "image";
    
        if (!target.includes(containerId)) {
            feedback.textContent = feedbackMessages.incorrect || "Incorrect!";
            containerDiv.classList.add("incorrect");
            setTimeout(() => containerDiv.classList.remove("incorrect"), 1000);
            setTimeout(() => feedback.textContent = "", 2000);
            return;
        }
    
        feedback.textContent = feedbackMessages.correct || "Correct!";
        containerDiv.classList.add("correct");
        setTimeout(() => containerDiv.classList.remove("correct"), 1500);
        setTimeout(() => feedback.textContent = "", 2000);
    
        state[containerId].push(label);
        
        // Create clone using the same createDraggableItem function to maintain consistency
        const originalItemData = jsonData.collection.find(item => item.label === label);
        const clone = createDraggableItem({
            ...originalItemData,
            src: selectedItem.dataset.src // use stored resolved src
        });
    
        const wrapper = document.createElement("div");
        wrapper.className = "dropped-item-wrapper";
        wrapper.appendChild(clone);
    
        if (type !== "text") {
            const labelEl = document.createElement("div");
            labelEl.textContent = label;
            labelEl.className = "dropped-item-label";
            wrapper.appendChild(labelEl);
        }
    
        clone.addEventListener("click", () => {
            // Uncomment this block if you want to allow removing items from containers
            /*
            if (showAnswer) {
                feedback.textContent = "Please hide the answer to continue.";
                setTimeout(() => feedback.textContent = "", 2000);
                return;
            }
    
            containerDiv.removeChild(wrapper);
            state[containerId] = state[containerId].filter(l => l !== label);
    
            const orig = document.querySelector(`#collection .draggable-item[data-label='${label}']`);
            if (orig) {
                if (type === "image") {
                    orig.classList.remove("grayed-out");
                } else {
                    document.getElementById("collection").appendChild(orig); 
                }
            }
            */
        });
    
        containerDiv.appendChild(wrapper);
    
        selectedItem.classList.remove("selected");
    
        if (type === "text") {
            const textEl = document.querySelector(`#collection .draggable-item.text-item[data-label='${label}']`);
            if (textEl) {
                textEl.remove(); 
            }
        } else {
            selectedItem.classList.add("grayed-out");
        }
    
        selectedItem = null;
    }
    

    function toggleAnswers() {
        showAnswer = !showAnswer;
        document.getElementById("toggle-answer").textContent = showAnswer ? "Hide Answer" : "Show Answer";
    
        Object.keys(state).forEach(containerId => {
            const containerDiv = document.getElementById(containerId);
    
            if (showAnswer) {
                jsonData.collection.forEach(item => {
                    if (item.target.includes(containerId) && !state[containerId].includes(item.label)) {
                        const itemEl = createDraggableItem(item);
    
                        const wrapper = document.createElement("div");
                        wrapper.className = "dropped-item-wrapper";
                        wrapper.appendChild(itemEl);
    
                        if (item.type !== "text") {
                            const labelEl = document.createElement("div");
                            labelEl.textContent = item.label;
                            labelEl.className = "dropped-item-label";
                            wrapper.appendChild(labelEl);
                        }
    
                        containerDiv.appendChild(wrapper);
                        wrapper.dataset.autoAnswer = "true";
                    }
                });
            } else {
                Array.from(containerDiv.children).forEach(child => {
                    if (child.dataset.autoAnswer === "true") {
                        containerDiv.removeChild(child);
                    }
                });
            }
        });
    }
    
    function resetGame() {
        initialize(jsonData);
        feedback.textContent = "Game has been reset.";
        setTimeout(() => feedback.textContent = "", 2000);
    }

    function shuffleArray(arr) {
        for (let i = arr.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [arr[i], arr[j]] = [arr[j], arr[i]];
        }
    }
});