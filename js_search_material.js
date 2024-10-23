<script>

let selectedMaterials = []; // Array to store added materials
let teknisiList = [];
let materialList = [];
let wh = ''; // Variable to store selected WH

// Function to submit material stock data
function inputMaterialStock() {
    // Get values from the inputs
    let tanggal = document.getElementById('tanggalInput').value;
    let noReservasi = document.getElementById('noReservasiInput').value;
    let noDocument = document.getElementById('noDocumentInput').value;
    let teknisiName = document.getElementById('teknisiSearch').value; // Get technician name
    let teknisiNIK = document.getElementById('nikDisplay').textContent; // Get selected technician's NIK
    let pidSelect = document.getElementById('pidSelect').value; // Get selected PID
    let pidValue;

    // Set PID value based on selection
    if (pidSelect === "PSB") {
        pidValue = "24PV26R640-0001";
    } else if (pidSelect === "GGN") {
        pidValue = "24MC15R640-0001";
    } else if (pidSelect === "OTHER") {
        pidValue = document.getElementById('otherPIDInput').value; // Get custom PID input
        if (pidValue === "") {
            alert("Masukkan PID untuk kategori OTHER.");
            return;
        }
    }

    // Check if all inputs are filled and if materials are selected
    if (tanggal === "" || noReservasi === "" || noDocument === "" || teknisiName === "" || teknisiNIK === "") {
        alert("Semua data harus diisi.");
        return; // Stop execution if inputs are incomplete
    }

    if (selectedMaterials.length === 0) {
        alert("Tidak ada material yang dipilih.");
        return; // Stop if no materials are selected
    }

    // Get the selected WH from the dropdown
    wh = document.getElementById('whSelect').value; // Get selected WH

    // Show loading
    showLoading();

    // Call Google Apps Script function to save data
    google.script.run
        .withSuccessHandler(function(response) {
            hideLoading();
            alert(response); // Show success or failure message
            // Clear inputs after submission
            document.getElementById('noReservasiInput').value = "";
            document.getElementById('noDocumentInput').value = "";
            document.getElementById('tanggalInput').value = "";
            document.getElementById('teknisiSearch').value = ""; // Clear technician input
            document.getElementById('nikDisplay').textContent = "NIK"; // Clear NIK
            selectedMaterials = []; // Clear selected materials
            updateMaterialList(); // Refresh the displayed material list
            document.getElementById('pidSelect').value = "PSB"; // Reset PID selection
            handlePIDSelection(); // Reset PID selection UI
        })
        .withFailureHandler(function(error) {
            hideLoading();
            alert("Gagal menyimpan data: " + error.message);
        })
        .inputMaterialStockMultiple(wh, tanggal, noReservasi, noDocument, teknisiName, teknisiNIK, pidValue, selectedMaterials); // Send data to the server
}


// Function to handle PID selection
function handlePIDSelection() {
    let pidSelect = document.getElementById('pidSelect').value;
    let otherPIDContainer = document.getElementById('otherPIDContainer');

    if (pidSelect === "OTHER") {
        otherPIDContainer.style.display = 'block'; // Show custom PID input
    } else {
        otherPIDContainer.style.display = 'none'; // Hide custom PID input
    }
}

// Function to fetch teknisi list from the backend
function fetchTeknisiList(wh) {
  showLoading(); // Show loading indicator
  google.script.run.withSuccessHandler(function(data) {
    teknisiList = data; // Save the teknisi list to the global variable
    hideLoading(); // Hide loading indicator
  }).withFailureHandler(function(error) {
    console.log("Failed to fetch teknisi list: " + error);
    hideLoading(); // Hide loading indicator even on failure
  }).getTeknisiList(wh); // Call the backend function to get the teknisi list
}

function filterTeknisi() {
  const searchQuery = document.getElementById('teknisiSearch').value.toLowerCase();
  
  // Pastikan teknisiList adalah array sebelum memfilter
  if (Array.isArray(teknisiList)) {
    const filteredTeknisi = teknisiList.filter(function(teknisi) {
      return teknisi.teknisi.toLowerCase().includes(searchQuery); // Filter by teknisi name
    });

    // Display filtered results
    const teknisiListElement = document.getElementById('teknisiList');
    teknisiListElement.innerHTML = ''; // Clear the element before adding new results

    filteredTeknisi.forEach(function(teknisi) {
      const teknisiItem = document.createElement('div');
      teknisiItem.classList.add('teknisi-item');
      teknisiItem.textContent = teknisi.teknisi;
      teknisiItem.className = 'search-item';
      teknisiItem.onclick = function() {
        selectTeknisi(teknisi.teknisi, teknisi.nik);
      };
      teknisiListElement.appendChild(teknisiItem);
    });

    // Show or hide the results list based on whether there are results
      teknisiListElement.style.display = filteredTeknisi.length > 0 ? 'block' : 'none'; //
  } else {
    console.error('teknisiList is not an array');
  }
}

function selectTeknisi(name, nik) {
  // Display selected teknisi name
  document.getElementById('teknisiSearch').value = name;
  document.getElementById('nikDisplay').textContent = nik;

  // Clear search results after selecting teknisi
  document.getElementById('teknisiList').innerHTML = '';
}

// Function to load material list
function loadMaterialList(wh) {
    showLoading(); // Show loading indicator
    google.script.run.withSuccessHandler(function(response) {
        hideLoading(); // Hide loading indicator

        // Ensure response is an array
        if (Array.isArray(response)) {
            materialList = response; // Store the material list
        } else {
            console.error("Material list is not an array:", response);
            materialList = []; // Reset to empty array if response is not valid
        }
    }).getMaterialList(wh); // Call the server function to get the material list
}

// Function to filter materials based on search input
function filterMaterial() {
    let input = document.getElementById('materialSearch').value.toLowerCase();
    let resultList = document.getElementById('materialList');
    resultList.innerHTML = ''; // Clear previous search results

    // Check if materialList is an array before filtering
    if (Array.isArray(materialList)) {
        // Filter materials that match the input
        let filtered = materialList.filter(function(material) {
            return material.name.toLowerCase().includes(input);
        });

        // Display search results
        filtered.forEach(function(material) {
            let div = document.createElement('div');
            div.textContent = material.name;
            div.className = 'search-item';
            div.onclick = function() {
                selectMaterial(material);
            };
            resultList.appendChild(div);
        });

        // Show or hide the results list based on whether there are results
        resultList.style.display = filtered.length > 0 ? 'block' : 'none'; // Show if filtered results are found
    } else {
        console.error('materialList is not an array:', materialList);
    }
}

// Function to select material from search results
function selectMaterial(material) {
    document.getElementById('materialSearch').value = material.name; // Set material name to input
    document.getElementById('materialList').innerHTML = ''; // Clear search results after selection
}

// Function to add material to the selected list
function addMaterial() {
    let materialInput = document.getElementById('materialSearch').value;
    let quantityInput = document.getElementById('materialQuantity').value;

    // Check if material and quantity are filled
    if (materialInput === "" || quantityInput === "") {
        alert("Material dan Jumlah harus diisi.");
        return;
    }

    // Find the material based on input
    let material = materialList.find(m => m.name === materialInput);

    if (!material) {
        alert("Material tidak ditemukan.");
        return; // Stop if material is not found
    }

    // Check if the material is already in the selectedMaterials array
    let existingMaterial = selectedMaterials.find(m => m.name === materialInput);
    
    if (existingMaterial) {
        alert("Material sudah ada di daftar.");
        return; // Stop if the material is already in the list
    }

    // Create an object for the material to be added
    let materialToAdd = {
        designator: material.designator,
        name: material.name,
        quantity: quantityInput
    };

    // Add to the selected materials array
    selectedMaterials.push(materialToAdd);

    // Update displayed material list
    updateMaterialList();

    // Clear inputs
    document.getElementById('materialSearch').value = "";
    document.getElementById('materialQuantity').value = "";
}

// Function to clear the selected materials list
function clearMaterialList() {
    selectedMaterials = []; // Clear the array of selected materials
    updateMaterialList(); // Update the table to reflect the cleared list
}

// Function to update the displayed list of selected materials in a table
function updateMaterialList() {
    let materialTableBody = document.getElementById('materialTable').getElementsByTagName('tbody')[0];
    materialTableBody.innerHTML = ""; // Clear previous table rows

    // Loop through the selectedMaterials array and create table rows
    selectedMaterials.forEach(function(material, index) {
        let row = materialTableBody.insertRow(); // Create a new row
        let cellNo = row.insertCell(0); // Insert cell for No
        let cellDesignator = row.insertCell(1); // Insert cell for Designator
        let cellName = row.insertCell(2); // Insert cell for Name
        let cellQuantity = row.insertCell(3); // Insert cell for Quantity

        // Set the text content for each cell
        cellNo.textContent = index + 1;
        cellDesignator.textContent = material.designator;
        cellName.textContent = material.name;
        cellQuantity.textContent = material.quantity;

        // Add click event listener to edit quantity
        row.onclick = function() {
            editMaterialQuantity(index);
        };
    });
}

// Function to edit material quantity
function editMaterialQuantity(index) {
    let material = selectedMaterials[index]; // Get the material to edit
    let newQuantity = prompt(`Edit jumlah material untuk ${material.name}:`, material.quantity);

    // Validate if the new quantity is valid
    newQuantity = parseInt(newQuantity, 10);
    if (isNaN(newQuantity) || newQuantity <= 0) {
        alert("Masukkan jumlah yang valid.");
        return;
    }

    // Update the material's quantity
    selectedMaterials[index].quantity = newQuantity;
    updateMaterialList(); // Update displayed material list
}

// Function to handle clicks outside of the dropdowns
function handleClickOutside(event) {
    const teknisiListElement = document.getElementById('teknisiList');
    const materialListElement = document.getElementById('materialList');

    // Check if the clicked target is outside the teknisi search input and results
    if (!teknisiListElement.contains(event.target) && !document.getElementById('teknisiSearch').contains(event.target)) {
        teknisiListElement.style.display = 'none'; // Hide teknisi list
    }

    // Check if the clicked target is outside the material search input and results
    if (!materialListElement.contains(event.target) && !document.getElementById('materialSearch').contains(event.target)) {
        materialListElement.style.display = 'none'; // Hide material list
    }
}

// Add event listener to handle clicks outside dropdowns
document.addEventListener('click', handleClickOutside);

// Function to show loading indicator
function showLoading() {
    document.getElementById('loading').style.display = 'block';
}

// Function to hide loading indicator
function hideLoading() {
    document.getElementById('loading').style.display = 'none';
}

// Function to load WH list
function loadWHList() {
    showLoading();
    google.script.run.withSuccessHandler(function(response) {
        hideLoading();
        let whSelect = document.getElementById('whSelect');
        whSelect.innerHTML = '<option value=""></option>'; // Clear previous options
        response.forEach(function(whValue) {
            let option = document.createElement('option');
            option.value = whValue;
            option.textContent = whValue;
            whSelect.appendChild(option);
        });
    }).getWHList();
}

// Function to store the selected WH value
function updateWH() {
    const wh = document.getElementById('whSelect').value;
    if (wh) {
    // Fetch teknisi list for the selected WH
    fetchTeknisiList(wh);
    loadMaterialList(wh);
    
  }
}

// Call this function after the page loads to populate dropdowns
window.onload = function() {
    loadWHList(); // Load WH list
    fetchTeknisiList(wh); // Load Technician list
    loadMaterialList(wh); // Load Material list
};

function logout() {
  google.script.run.withSuccessHandler(function() {
    window.open("https://accounts.google.com/ServiceLogin", "_self"); // This will open the page in the same tab
  }).logoutUser();
}

</script>
