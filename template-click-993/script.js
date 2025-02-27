document.addEventListener("DOMContentLoaded", function () {
    let selectedItem = null;
    let state = {}; 
    let feedbackMessages = {}; 
    let titleText = "";
    let instructionMessage = ""; 
    let collectionData = []; 
    const feedback = document.getElementById("feedback");
    let jsonData ;
    let showAnswer = false;
    loadJSONData('data.json');

    function loadJSONData(fileName) {
        fetch(fileName)
            .then(response => response.json())
            .then(data => initialize(data))
            .catch(error => {
                console.error("Error loading JSON file:", error);
                feedback.textContent = `Failed to load ${fileName}. Using default data.`;
                feedback.style.color = "red";
                setTimeout(() => feedback.textContent = "", 3000);
                
                fetch('data.json')
                    .then(response => response.json())
                    .then(data => initialize(data))
                    .catch(error => console.error("Error loading default JSON:", error));
            });
    }

    function initialize(data) {
        jsonData = data;
        feedbackMessages = data.feedback; 
        
        titleText = data.titleText || "Select items from the collection and place them in the appropriate containers"; // Load instruction message
        instructionMessage = data.instructionText || "Select items from the collection and place them in the appropriate containers"; // Load instruction message

        const titleElement = document.getElementById("titleText");
        if(titleElement){
            titleElement.textContent = titleText;
        }

        const instructionElement = document.getElementById("instructionText");
        if (instructionElement) {
            instructionElement.textContent = instructionMessage;
        }
        const backgroundImgElement = document.getElementById("background-image");
        backgroundImgElement.style.backgroundImage = `url('${data.backgroundImage.imageSrc}')`;

        const collection = document.getElementById("collection");
        const containerArea = document.getElementById("containerArea");
        if (!collection || !containerArea) {
            console.error("Collection or containerArea element not found.");
            return;
        }
        collectionData = [...data.collection];

        data.containers.forEach(container => {
            state[container.id] = [];
            const containerDiv = document.createElement("div");
            
            
            const containerLabelParent = document.createElement("div");
            const containerLabel = document.createElement("div");

            containerLabelParent.className = "container-label-parent";

            containerDiv.className = "drop-zone";
            containerDiv.id = container.id;
            containerLabel.textContent = container.label;
            containerLabel.className = "container-label";
            containerLabel.style['max-width'] = container.width || "100%";
            containerDiv.style.width = container.width || "100%";
            containerDiv.style.height = container.height || "100%";

            const containerWrapper = document.createElement("div");
            containerWrapper.className = "container-wrapper";
            containerWrapper.appendChild(containerLabelParent);
            containerLabelParent.appendChild(containerLabel);
            containerWrapper.appendChild(containerDiv);
            containerArea.appendChild(containerWrapper);

            
            containerDiv.addEventListener("mousedown", () => handleDrop(containerDiv, data));
            containerDiv.addEventListener("touchstart", () => handleDrop(containerDiv, data));
        });
        shuffleArray(data.collection); 

        data.collection.forEach(item => {
            const element = document.createElement("img");
                element.src = item.src;
                element.alt = item.label;
                element.title = item.label;
                element.dataset.label = item.label;
                element.dataset.target = JSON.stringify(item.target);
                element.style.width = item.width || "60px";
                element.style.height = item.height || "60px";

            element.classList.add("draggable-item");
            element.addEventListener("mousedown", event => handleItemSelection(event, element));
            element.addEventListener("touchstart", event => handleItemSelection(event, element));

            collection.appendChild(element);
        });
        document.addEventListener("mouseup", handleDeselect);
        document.addEventListener("touchend", handleDeselect);
        const resetButton = document.getElementById("resetButton");
        if (resetButton) {
            resetButton.addEventListener("click", resetGame);
        }
        document.getElementById("toggle-answer").addEventListener("click", toggleAnswers);
    }

    function shuffleArray(arr) {
        for (let i = arr.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [arr[i], arr[j]] = [arr[j], arr[i]]; 
        }
    }

    function handleItemSelection(event, element) {
        event.preventDefault();         
        console.log('ele-->',selectedItem, element)
        if (stateHasItem(element)) {
            return; 
        }
        if (selectedItem === element) {
            element.classList.remove("selected");
            selectedItem = null;
        } else {
            document.querySelectorAll(".draggable-item").forEach(item => item.classList.remove("selected"));
            element.classList.add("selected");
            selectedItem = element;
        }
    }

    function stateHasItem(item) {
        return Object.values(state).some(containerItems => containerItems.includes(item.dataset.label));
    }

    function handleDeselect(event) {
        if (!event.target.closest(".drop-zone") && !event.target.closest("#collection")) {
            if (selectedItem) {
                selectedItem.classList.remove("selected");
                selectedItem = null;
            }
        }
    }
 



    function handleDrop(containerDiv, data) {
        if(showAnswer){
            feedback.textContent = "Please hide the answer to continue.";
            setTimeout(() => feedback.textContent = "", 2000);
        }
        if (selectedItem && !showAnswer) {
            const target = JSON.parse(selectedItem.dataset.target);
            const containerId = containerDiv.id;
            const itemLabel = selectedItem.dataset.label;
    
            if (target.includes(containerId)) {
                feedback.textContent = feedbackMessages.correct;
                //feedback.style.color = "green";
                containerDiv.classList.add("correct");
    
                state[containerId].push(itemLabel);
                const clone = selectedItem.cloneNode(true);
                clone.classList.remove("selected");
    
                
                const label = document.createElement("div");
                label.textContent = itemLabel;
                label.className = "dropped-item-label"; 
    
                
                const itemWrapper = document.createElement("div");
                itemWrapper.className = "dropped-item-wrapper";
                itemWrapper.appendChild(clone);
                itemWrapper.appendChild(label);
    
                clone.addEventListener("click", () => {
                    containerDiv.removeChild(itemWrapper);
                    state[containerId] = state[containerId].filter(label => label !== itemLabel);
    
                    
                    const collectionItem = document.querySelector(`#collection img[data-label='${itemLabel}']`);
                    if (collectionItem) {
                        collectionItem.classList.remove("grayed-out"); // Remove grayed-out class
                    }
                });
    
                containerDiv.appendChild(itemWrapper);
                selectedItem.classList.remove("selected");
                selectedItem = null;
    
                
                const collectionItem = document.querySelector(`#collection img[data-label='${itemLabel}']`);
                if (collectionItem) {
                    collectionItem.classList.add("grayed-out");
                }
    
                setTimeout(() => feedback.textContent = "", 2000);
                setTimeout(() => {
                    containerDiv.classList.remove("correct");
                }, 1500);
            } else {
                feedback.textContent = feedbackMessages.incorrect;
                //feedback.style.color = "red";
                containerDiv.classList.add("incorrect");
                setTimeout(() => {
                    containerDiv.classList.remove("incorrect");
                }, 1000);
                setTimeout(() => feedback.textContent = "", 2000);
            }
        }
    }
    
   

    function toggleAnswers() {
        showAnswer = !showAnswer;
        document.getElementById("toggle-answer").textContent = showAnswer ? "Hide Answer" : "Show Answer";
    
        Object.keys(state).forEach(containerId => {
            const containerDiv = document.getElementById(containerId);
            
            // Retain already dropped correct items
            const existingItems = Array.from(containerDiv.children).map(child => child.querySelector(".dropped-item-label")?.textContent);
            
            if (showAnswer) {
                jsonData.collection.forEach(item => {
                    if (item.target.includes(containerId) && !existingItems.includes(item.label)) {
                        const clone = document.createElement("img");
                        clone.src = item.src;
                        clone.alt = item.label;
                        clone.style.width = item.width || "60px";
                        clone.style.height = item.height || "60px";
                        clone.classList.add("draggable-item");
    
                        const label = document.createElement("div");
                        label.textContent = item.label;
                        label.className = "dropped-item-label";
    
                        const itemWrapper = document.createElement("div");
                        itemWrapper.className = "dropped-item-wrapper";
                        itemWrapper.appendChild(clone);
                        itemWrapper.appendChild(label);
    
                        containerDiv.appendChild(itemWrapper);
                    }
                });
            } else {
                // Only remove answer hints, retain user-placed items
                Array.from(containerDiv.children).forEach(child => {
                    const labelText = child.querySelector(".dropped-item-label")?.textContent;
                    if (!state[containerId].includes(labelText)) {
                        containerDiv.removeChild(child);
                    }
                });
            }
        });
    }
    
    
    function resetGame() {
        showAnswer = false;
        document.getElementById("toggle-answer").textContent = "Show Answer";
        state = {};
        const collection = document.getElementById("collection");
        const containerArea = document.getElementById("containerArea");
        if (collection) collection.innerHTML = ""; 
        if (containerArea) containerArea.innerHTML = ""; 
        initialize(jsonData)
        feedback.textContent = "Game has been reset.";
        //feedback.style.color = "blue";
        setTimeout(() => feedback.textContent = "", 2000);
    }
    
});
