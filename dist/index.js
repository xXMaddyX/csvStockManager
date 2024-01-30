// Ref to HTML Elements
const productContainer = document.querySelector('.product-display');
const searchButton = document.querySelector('.search-button');
const searchField = document.querySelector('.search-field');
const exportButton = document.querySelector('#exportCSV');
const productCounterOut = document.querySelector('.products-count');
const addProductButton = document.querySelector('#add-product');
const inputWindow = document.querySelector('.inputField');
const inputField = document.querySelectorAll('.inputfields> input');
const sendButton = document.querySelector('#send');
const cancelButton = document.querySelector('#cancel');
//-----------------------------------------------------------------------------------

//URL for GET Request
const urlData = {
    csvUrl: "http://127.0.0.1:3030/data",
    postUrl: "http://127.0.0.1:3030/submitData",
    exportCSVUrl: "http://127.0.0.1:3030/csv"
};
//-----------------------------------------------------------------------------------

//Store for Data and State
const dataStore = {
    /**@type {Array} */
    rawCSV: undefined,
    /**@type {number} */
    currentIndex: 0,
    /**@type {number} */
    batchSize: 20,
    /**@type {boolean} */
    searchActive: false,
    /**@type {string} */
    searchTerm: '',
    /**@type {string} */
    productCounter: "Produkte: ",
    /**@type {string} */
    deletedRow: '',
    currentSentinel: null,
};
//---------------------------------------------------------------------------------

//Product Counter
const countProducts = () => {
    dataStore.productCounter = dataStore.rawCSV.length;
    productCounterOut.textContent = `Produkte: ${String(dataStore.productCounter)}`;
};
//---------------------------------------------------------------------------------

//Get CSV From Server as JSON
const fetchCSV = async () => {
    try {
        const response = await fetch(urlData.csvUrl);
        dataStore.rawCSV = await response.json();
        addBatchToContainer();
        countProducts();
    } catch (error) {
        console.error('Fehler beim Laden der CSV-Daten:', error);
    };
};
//---------------------------------------------------------------------------------

//Create TABLE and Functionality
const createTableRow = (dataSet) => {
    //Create ROW and Items
    const tableRow = document.createElement('tr');
    tableRow.classList.add('table-row');
    let isFirstItem = true;
    for (let key in dataSet) {
        const tableItem = document.createElement('td');
        tableItem.classList.add('table-item');
        tableItem.textContent = dataSet[key];

        if (isFirstItem) {
            tableItem.contentEditable = false;
            isFirstItem = false;
        } else {
            tableItem.contentEditable = true;
        }

        tableRow.appendChild(tableItem);
    };
    //Delete and Update Button Container
    const buttonContainer = document.createElement('td');
    buttonContainer.classList.add('table-buttons');
    
    //Update Button and Event Functions
    const updateButton = document.createElement('button');
    updateButton.innerText = 'Update';
    updateButton.addEventListener('click', async (event) => {
        let colListItems = [];
        for (let i = 0; i < tableRow.children.length; i++) {
            colListItems.push(tableRow.children.item(i).textContent)
        };
        colListItems.pop()
        const index = dataStore.rawCSV.findIndex(index => index.Hauptartikelnr == colListItems[0])
        console.log(colListItems)
        if (index !== -1) {
            const keys = Object.keys(dataStore.rawCSV[0]);
            if (keys.length === colListItems.length) {
                for (let i = 0; i < keys.length; i++) {
                    dataStore.rawCSV[index][keys[i]] = colListItems[i];
                }
            } else {
                console.error('The Number of Cols and Rows are not match');
            }
        } else {
            console.error('The Object was not found in CSV File');
        }
    
        console.log('Aktualisierte Daten:', dataStore.rawCSV[index]);
        await postDataToServer(dataStore.rawCSV)
    });
    updateButton.classList.add('update-button');
    buttonContainer.appendChild(updateButton);
    
    //Delete Artikel Button & Event
    const delButton = document.createElement('button');
    delButton.innerText = 'Löschen';
    delButton.addEventListener('click', async (event) => {
        dataStore.deletedRow = tableRow.children.item(0);
        /**@type {string} */
        let artNr = dataStore.deletedRow.textContent;
        const index = dataStore.rawCSV.findIndex(index => index.Hauptartikelnr == artNr);
        if (index !== -1) {
            dataStore.rawCSV.splice(index, 1)
            tableRow.remove()
            countProducts()
            await postDataToServer(dataStore.rawCSV)
        } else {
            alert("Fehler beim Löschen");
        };
    });
    delButton.classList.add('delete-button');
    buttonContainer.appendChild(delButton);

    //Add TableRow
    tableRow.appendChild(buttonContainer);
    return tableRow;
};
//---------------------------------------------------------------------------------

//Batch Functions to load Parts of CSV
const addBatchToContainer = () => {
    return new Promise((resolve) => {
        const fragment = document.createDocumentFragment();
        const endIndex = Math.min(dataStore.currentIndex + dataStore.batchSize, dataStore.rawCSV.length);
        for (let i = dataStore.currentIndex; i < endIndex; i++) {
            const tableRow = createTableRow(dataStore.rawCSV[i]);
            fragment.appendChild(tableRow);
        }
        productContainer.appendChild(fragment);
        dataStore.currentIndex += dataStore.batchSize;
        if (dataStore.currentIndex < dataStore.rawCSV.length) {
            addSentinel();
        }
        resolve();
    });
};
//---------------------------------------------------------------------------------

//Sentinel for Observer Trigger at Scroll
const addSentinel = () => {
    if (dataStore.currentSentinel) {
        observer.unobserve(dataStore.currentSentinel);
        dataStore.currentSentinel.remove();
    }

    const sentinel = document.createElement('div');
    sentinel.classList.add('sentinel');
    productContainer.appendChild(sentinel);
    observer.observe(sentinel);

    dataStore.currentSentinel = sentinel;
};
//---------------------------------------------------------------------------------

//Intersection Observer
const observerCallback = (entries, observer) => {
    entries.forEach(async (entry) => {
        if (entry.isIntersecting && !dataStore.searchActive) {
            observer.unobserve(entry.target);
            entry.target.remove();
            await addBatchToContainer();
        }
    });
};
const observer = new IntersectionObserver(observerCallback, {
    root: null,
    rootMargin: '0px',
    threshold: 0.1,
});

//---------------------------------------------------------------------------------
//Search Field Functions
const scrollToProduct = (searchQuery) => {
    const products = document.querySelectorAll('.table-row');
    for (let product of products) {
        if (product.textContent.toLowerCase().includes(searchQuery.toLowerCase())) {
            product.scrollIntoView({ behavior: 'smooth', block: 'start' });
            dataStore.searchActive = false;
            return true;
        };
    };
    return false;
};

const searchAndScrollToProduct = async (searchQuery) => {
    dataStore.searchActive = true;
    let found = scrollToProduct(searchQuery);
    while (!found && dataStore.currentIndex < dataStore.rawCSV.length) {
        await addBatchToContainer();
        found = scrollToProduct(searchQuery);
    }
    if (!found) {
        alert('Produkt nicht gefunden.');
    };
    dataStore.searchActive = false;
};

const searchActionOnEvent = () => {
    const searchQuery = searchField.value.trim();
        if (searchQuery) {
            searchAndScrollToProduct(searchQuery);
        };
}
//---------------------------------------------------------------------------------

//Post Changed Data to server
const postDataToServer = async(data) => {
    try {
        const response = await fetch(urlData.postUrl, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(data)
        });
    } catch (err) {
        console.log("Fail to send Data", err);
    };
};
//---------------------------------------------------------------------------------

//Toggle InputWindow Function
const toggleInputWindow = () => {
    inputWindow.classList.toggle('active');
};

//Sort The Main CSV After Product Add
const sortCSV = () => {
    const listHeader = dataStore.rawCSV.slice(0, 1);
    const contentList = dataStore.rawCSV.slice(1);

    contentList.sort((a, b) => {
        const KeyA = Object.keys(a)[0];
        const KeyB = Object.keys(b)[0];

        if (a[KeyA] < b[KeyB]) {
            return -1;
        }
        if (a[KeyA] > b[KeyB]) {
            return 1;
        }
        return 0;
    });

    dataStore.rawCSV = listHeader.concat(contentList);
}

//Add Products
const addProduct = () => {
    const element = []
        inputField.forEach((item) => {
            element.push(item.value)
        })
        console.log(element)
        const dataObj = {
            Hauptartikelnr: element[0],
            Artikelname: element[1],
            Hersteller: element[2],
            Beschreibung: element[3],
            Materialangaben:element[4],
            Geschlecht: element[5],
            Produktart: element[6],
            Ärmel: element[7],
            Bein: element[8],
            Kragen: element[9],
            Hersteller2: element[10],
            Taschenart: element[11],
            Grammatur: element[12],
            Material: element[13],
            Ursprungsland: element[14],
            Bildname: element[15]
        }
        dataStore.rawCSV.push(dataObj)
}
//-----------------------------------------------------------------------------------

//Event Listeners
document.addEventListener('DOMContentLoaded', async (event) => {
    await fetchCSV();
    searchButton.addEventListener('click', () => {
        searchActionOnEvent();
    });
    
    searchField.addEventListener('keydown', (event) => {
        if (event.key == "Enter") {
            searchActionOnEvent();
            searchField.value = "";
        };
    });
    
    //Export CSV File
    exportButton.addEventListener('click', async () => {
        try {
            const response = await fetch("http://127.0.0.1:3030/dataload");
            if (!response.ok) {
                throw new Error(`HTTP-Fehler! Status: ${response.status}`);
            }
            const blob = await response.blob();
            const downloadLink = document.createElement('a');
            downloadLink.href = URL.createObjectURL(blob);
            downloadLink.download = 'Artikel.csv'; 
            
            downloadLink.style.display = 'none'; 
            document.body.appendChild(downloadLink);
            downloadLink.click();
            document.body.removeChild(downloadLink);
            
            URL.revokeObjectURL(downloadLink.href);
        } catch (error) {
            console.error('Fehler beim Laden der Datei:', error);
        }
    });
    
    //Add Product Button
    addProductButton.addEventListener('click', () => {
        toggleInputWindow();
    });
    
    //Send Product Button
    sendButton.addEventListener('click', async() => {
        addProduct();
        sortCSV();
        toggleInputWindow();
        countProducts();
        postDataToServer(dataStore.rawCSV);
        document.location.reload();
    });

    //cancel button
    cancelButton.addEventListener('click', () => {
        toggleInputWindow();
    });
});
